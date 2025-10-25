import {
  CollectionReference,
  QuerySnapshot,
  QueryConstraint,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
  getDocs,
  query,
  startAfter,
} from "firebase/firestore";
import { geohashQueryBounds, distanceBetween } from "geofire-common";
import { Criteria } from "@schorts/shared-kernel";

import { CriteriaToFirestoreSymbolsTranslator } from "./criteria-to-firestore-symbos-translator";

export class FirestoreCriteriaQueryExecutor {
  static async execute(collection: CollectionReference, criteria: Criteria): Promise<QuerySnapshot> {
    const geoFilter = criteria.filters.find(f => f.operator === "GEO_RADIUS");

    if (geoFilter) {
      const geoField = geoFilter.field;
      const { center, radiusInM } = geoFilter.value;
      const bounds = geohashQueryBounds(center, radiusInM);
      const promises: Promise<QuerySnapshot>[] = [];

      for (const [start, end] of bounds) {
        const constraints: QueryConstraint[] = [];

        // Apply non-geo filters
        for (const filter of criteria.filters) {
          if (filter.field === geoField) continue;

          const field = CriteriaToFirestoreSymbolsTranslator.translateField(filter.field);
          const operator = CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
          const value = CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);

          constraints.push(where(field, operator, value));
        }

        // Geo bounding box constraints
        constraints.push(orderBy(`${geoField}_geohash`));
        constraints.push(startAt(start));
        constraints.push(endAt(end));

        // Apply ordering
        for (const order of criteria.orders) {
          const direction = CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);
          constraints.push(orderBy(order.field, direction ?? undefined));
        }

        // Apply limit
        if (criteria.limit !== undefined) {
          constraints.push(limit(criteria.limit));
        }

        promises.push(getDocs(query(collection, ...constraints)));
      }

      const snapshots = await Promise.all(promises);
      const allDocs = snapshots.flatMap(snap => snap.docs);
      const uniqueDocsMap = new Map<string, typeof allDocs[0]>();

      for (const doc of allDocs) {
        uniqueDocsMap.set(doc.id, doc);
      }

      const filteredDocs = Array.from(uniqueDocsMap.values()).filter(doc => {
        const data = doc.data();
        const coords = data[geoField] as { latitude: number; longitude: number };
        if (!coords) return false;

        const distanceInM = distanceBetween(center, [coords.latitude, coords.longitude]) * 1000;
        return distanceInM <= radiusInM;
      });

      return {
        docs: filteredDocs,
        empty: filteredDocs.length === 0,
        forEach: (callback: (doc: any) => void) => filteredDocs.forEach(callback),
        size: filteredDocs.length,
      } as QuerySnapshot;
    }

    // Non-geo query
    const constraints: QueryConstraint[] = [];

    for (const filter of criteria.filters) {
      const field = CriteriaToFirestoreSymbolsTranslator.translateField(filter.field);
      const operator = CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
      const value = CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);

      constraints.push(where(field, operator, value));
    }

    for (const order of criteria.orders) {
      const direction = CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);
      constraints.push(orderBy(order.field, direction ?? undefined));
    }

    if (criteria.limit !== undefined) {
      constraints.push(limit(criteria.limit));
    }

    if (criteria.offset !== undefined) {
      constraints.push(startAfter(criteria.offset));
    }

    return getDocs(query(collection, ...constraints));
  }
}

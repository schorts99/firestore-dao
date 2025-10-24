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
import { Criteria, Order } from "@schorts/shared-kernel";

import { CriteriaToFirestoreSymbolsTranslator } from "./criteria-to-firestore-symbos-translator";

export class FirestoreCriteriaQueryExecutor {
  static async execute(collection: CollectionReference, criteria: Criteria) {
    const geoFilter = criteria.filters.find(f => f.operator === "GEO_RADIUS");

    if (geoFilter) {
      const geoField = geoFilter.field;
      const { center, radiusInM } = geoFilter.value;
      const bounds = geohashQueryBounds(center, radiusInM);
      const promises: Promise<QuerySnapshot>[] = [];

      for (const b of bounds) {
        const constraints: QueryConstraint[] = [];

        for (const filter of criteria.filters) {
          if (filter.field === geoField) continue;

          const firestoreField = CriteriaToFirestoreSymbolsTranslator.translateField(filter.field);
          const firestoreOperator = CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
          const firestoreValue = CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);

          constraints.push(where(firestoreField, firestoreOperator, firestoreValue));
        }

        constraints.push(orderBy(`${geoField}_geohash`));
        constraints.push(startAt(b[0]));
        constraints.push(endAt(b[1]));

        for (const order of criteria.orders) {
          const firestoreDirection = CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);
          constraints.push(orderBy(order.field, firestoreDirection ?? undefined));
        }

        if (criteria.limit) {
          constraints.push(limit(criteria.limit));
        }

        promises.push(getDocs(query(collection, ...constraints)));
      }

      const snapshots = await Promise.all(promises);
      const allDocs = snapshots.flatMap(snap => snap.docs);
      const uniqueDocsMap = new Map<string, typeof allDocs[0]>();

      allDocs.forEach(doc => uniqueDocsMap.set(doc.id, doc));

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
    } else {
      const constraints: QueryConstraint[] = [];

      for (const filter of criteria.filters) {
        const firestoreField = CriteriaToFirestoreSymbolsTranslator.translateField(filter.field);
        const firestoreOperator = CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
        const firestoreValue = CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);

        constraints.push(where(firestoreField, firestoreOperator, firestoreValue));
      }

      for (const order of criteria.orders) {
        const firestoreDirection = CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);
        constraints.push(orderBy(order.field, firestoreDirection ?? undefined));
      }

      if (criteria.limit) {
        constraints.push(limit(criteria.limit));
      }

      if (criteria.offset) {
        constraints.push(startAfter(criteria.offset));
      }

      return getDocs(query(collection, ...constraints));
    }
  }
}

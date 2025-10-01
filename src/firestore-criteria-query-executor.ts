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
    const geoFilterEntry = Object.entries(criteria.filters).find(
      ([_, filter]) => filter.operator === "GEO_RADIUS"
    );
  
    if (geoFilterEntry) {
      const [geoField, geoFilter] = geoFilterEntry;
      const { center, radiusInM } = geoFilter.value;
      const bounds = geohashQueryBounds(center, radiusInM);
      const promises: Promise<QuerySnapshot>[] = [];
  
      for (const b of bounds) {
        const constraints: QueryConstraint[] = [];

        for (const [field, filter] of Object.entries(criteria.filters)) {
          if (field === geoField) continue;
  
          const firestoreField = CriteriaToFirestoreSymbolsTranslator.translateField(field);
          const firestoreOperator = CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
          const firestoreValue = CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);
  
          constraints.push(where(firestoreField, firestoreOperator, firestoreValue));
        }
  
        constraints.push(orderBy(`${geoField}_geohash`));
        constraints.push(startAt(b[0]));
        constraints.push(endAt(b[1]));
  
        criteria.orders.forEach((order: Order) => {
          const firestoreDirection = CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);

          if (firestoreDirection) {
            constraints.push(orderBy(order.field, firestoreDirection));
          } else {
            constraints.push(orderBy(order.field));
          }
        });
  
        if (criteria.limit) {
          constraints.push(limit(criteria.limit));
        }
  
        promises.push(getDocs(query(collection, ...constraints)));
      }
  
      const snapshots = await Promise.all(promises);
      const allDocs = snapshots.flatMap((snap) => snap.docs);
      const uniqueDocsMap = new Map<string, typeof allDocs[0]>();

      allDocs.forEach(doc => uniqueDocsMap.set(doc.id, doc));
  
      const filteredDocs = Array.from(uniqueDocsMap.values()).filter((doc) => {
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
      } as QuerySnapshot;
    } else {
      const constraints: QueryConstraint[] = [];
  
      for (const field in criteria.filters) {
        const filter = criteria.filters[field]!;
        const firestoreField = CriteriaToFirestoreSymbolsTranslator.translateField(field);
        const firestoreOperator = CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
        const firestoreValue = CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);
  
        constraints.push(where(firestoreField, firestoreOperator, firestoreValue));
      }
  
      criteria.orders.forEach((order: Order) => {
        const firestoreDirection = CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);
  
        if (firestoreDirection) {
          constraints.push(orderBy(order.field, firestoreDirection));
        } else {
          constraints.push(orderBy(order.field));
        }
      });
  
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

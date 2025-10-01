"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreCriteriaQueryExecutor = void 0;
const firestore_1 = require("firebase/firestore");
const geofire_common_1 = require("geofire-common");
const criteria_to_firestore_symbos_translator_1 = require("./criteria-to-firestore-symbos-translator");
class FirestoreCriteriaQueryExecutor {
    static async execute(collection, criteria) {
        const geoFilterEntry = Object.entries(criteria.filters).find(([_, filter]) => filter.operator === "GEO_RADIUS");
        if (geoFilterEntry) {
            const [geoField, geoFilter] = geoFilterEntry;
            const { center, radiusInM } = geoFilter.value;
            const bounds = (0, geofire_common_1.geohashQueryBounds)(center, radiusInM);
            const promises = [];
            for (const b of bounds) {
                const constraints = [];
                for (const [field, filter] of Object.entries(criteria.filters)) {
                    if (field === geoField)
                        continue;
                    const firestoreField = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateField(field);
                    const firestoreOperator = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
                    const firestoreValue = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);
                    constraints.push((0, firestore_1.where)(firestoreField, firestoreOperator, firestoreValue));
                }
                constraints.push((0, firestore_1.orderBy)(`${geoField}_geohash`));
                constraints.push((0, firestore_1.startAt)(b[0]));
                constraints.push((0, firestore_1.endAt)(b[1]));
                criteria.orders.forEach((order) => {
                    const firestoreDirection = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);
                    if (firestoreDirection) {
                        constraints.push((0, firestore_1.orderBy)(order.field, firestoreDirection));
                    }
                    else {
                        constraints.push((0, firestore_1.orderBy)(order.field));
                    }
                });
                if (criteria.limit) {
                    constraints.push((0, firestore_1.limit)(criteria.limit));
                }
                promises.push((0, firestore_1.getDocs)((0, firestore_1.query)(collection, ...constraints)));
            }
            const snapshots = await Promise.all(promises);
            const allDocs = snapshots.flatMap((snap) => snap.docs);
            const uniqueDocsMap = new Map();
            allDocs.forEach(doc => uniqueDocsMap.set(doc.id, doc));
            const filteredDocs = Array.from(uniqueDocsMap.values()).filter((doc) => {
                const data = doc.data();
                const coords = data[geoField];
                if (!coords)
                    return false;
                const distanceInM = (0, geofire_common_1.distanceBetween)(center, [coords.latitude, coords.longitude]) * 1000;
                return distanceInM <= radiusInM;
            });
            return {
                docs: filteredDocs,
                empty: filteredDocs.length === 0,
                forEach: (callback) => filteredDocs.forEach(callback),
            };
        }
        else {
            const constraints = [];
            for (const field in criteria.filters) {
                const filter = criteria.filters[field];
                const firestoreField = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateField(field);
                const firestoreOperator = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
                const firestoreValue = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);
                constraints.push((0, firestore_1.where)(firestoreField, firestoreOperator, firestoreValue));
            }
            criteria.orders.forEach((order) => {
                const firestoreDirection = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);
                if (firestoreDirection) {
                    constraints.push((0, firestore_1.orderBy)(order.field, firestoreDirection));
                }
                else {
                    constraints.push((0, firestore_1.orderBy)(order.field));
                }
            });
            if (criteria.limit) {
                constraints.push((0, firestore_1.limit)(criteria.limit));
            }
            if (criteria.offset) {
                constraints.push((0, firestore_1.startAfter)(criteria.offset));
            }
            return (0, firestore_1.getDocs)((0, firestore_1.query)(collection, ...constraints));
        }
    }
}
exports.FirestoreCriteriaQueryExecutor = FirestoreCriteriaQueryExecutor;
//# sourceMappingURL=firestore-criteria-query-executor.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreCriteriaQueryExecutor = void 0;
const firestore_1 = require("firebase/firestore");
const geofire_common_1 = require("geofire-common");
const criteria_to_firestore_symbos_translator_1 = require("./criteria-to-firestore-symbos-translator");
class FirestoreCriteriaQueryExecutor {
    static async execute(collection, criteria) {
        const geoFilter = criteria.filters.find(f => f.operator === "GEO_RADIUS");
        if (geoFilter) {
            const geoField = geoFilter.field;
            const { center, radiusInM } = geoFilter.value;
            const bounds = (0, geofire_common_1.geohashQueryBounds)(center, radiusInM);
            const promises = [];
            for (const [start, end] of bounds) {
                const constraints = [];
                // Apply non-geo filters
                for (const filter of criteria.filters) {
                    if (filter.field === geoField)
                        continue;
                    const field = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateField(filter.field);
                    const operator = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
                    const value = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);
                    constraints.push((0, firestore_1.where)(field, operator, value));
                }
                // Geo bounding box constraints
                constraints.push((0, firestore_1.orderBy)(`${geoField}_geohash`));
                constraints.push((0, firestore_1.startAt)(start));
                constraints.push((0, firestore_1.endAt)(end));
                // Apply ordering
                for (const order of criteria.orders) {
                    const direction = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);
                    constraints.push((0, firestore_1.orderBy)(order.field, direction ?? undefined));
                }
                // Apply limit
                if (criteria.limit !== undefined) {
                    constraints.push((0, firestore_1.limit)(criteria.limit));
                }
                promises.push((0, firestore_1.getDocs)((0, firestore_1.query)(collection, ...constraints)));
            }
            const snapshots = await Promise.all(promises);
            const allDocs = snapshots.flatMap(snap => snap.docs);
            const uniqueDocsMap = new Map();
            for (const doc of allDocs) {
                uniqueDocsMap.set(doc.id, doc);
            }
            const filteredDocs = Array.from(uniqueDocsMap.values()).filter(doc => {
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
                size: filteredDocs.length,
            };
        }
        // Non-geo query
        const constraints = [];
        for (const filter of criteria.filters) {
            const field = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateField(filter.field);
            const operator = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateOperator(filter.operator);
            const value = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateValue(filter.value);
            constraints.push((0, firestore_1.where)(field, operator, value));
        }
        for (const order of criteria.orders) {
            const direction = criteria_to_firestore_symbos_translator_1.CriteriaToFirestoreSymbolsTranslator.translateOrderDirection(order.direction);
            constraints.push((0, firestore_1.orderBy)(order.field, direction ?? undefined));
        }
        if (criteria.limit !== undefined) {
            constraints.push((0, firestore_1.limit)(criteria.limit));
        }
        if (criteria.offset !== undefined) {
            constraints.push((0, firestore_1.startAfter)(criteria.offset));
        }
        return (0, firestore_1.getDocs)((0, firestore_1.query)(collection, ...constraints));
    }
}
exports.FirestoreCriteriaQueryExecutor = FirestoreCriteriaQueryExecutor;
//# sourceMappingURL=firestore-criteria-query-executor.js.map
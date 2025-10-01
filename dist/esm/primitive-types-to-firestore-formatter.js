"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrimitiveTypesToFirestoreFormmater = void 0;
const firestore_1 = require("firebase/firestore");
const geofire_common_1 = require("geofire-common");
const shared_kernel_1 = require("@schorts/shared-kernel");
class PrimitiveTypesToFirestoreFormmater {
    static format(entity) {
        return {
            ...this.formatCoordinates(entity),
            ...this.formatDates(entity),
        };
    }
    static formatCoordinates(entity) {
        const geoData = {};
        for (const key in entity) {
            if (Object.prototype.hasOwnProperty.call(entity, key)) {
                const value = entity[key];
                if (value instanceof shared_kernel_1.CoordinatesValue) {
                    geoData[`${shared_kernel_1.PascalCamelToSnake.format(key)}_geohash`] = (0, geofire_common_1.geohashForLocation)([value.value.latitude, value.value.longitude]);
                }
            }
        }
        return geoData;
    }
    static formatDates(entity) {
        const formattedDates = {};
        for (const key in entity) {
            if (Object.prototype.hasOwnProperty.call(entity, key)) {
                const value = entity[key];
                if (value instanceof Date) {
                    formattedDates[shared_kernel_1.PascalCamelToSnake.format(key)] = firestore_1.Timestamp.fromDate(value);
                }
            }
        }
        return formattedDates;
    }
}
exports.PrimitiveTypesToFirestoreFormmater = PrimitiveTypesToFirestoreFormmater;
//# sourceMappingURL=primitive-types-to-firestore-formatter.js.map
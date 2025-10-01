import { Timestamp } from "firebase/firestore";
import { Geohash, geohashForLocation } from "geofire-common";
import { CoordinatesValue, PascalCamelToSnake } from "@schorts/shared-kernel";

export class PrimitiveTypesToFirestoreFormmater {
  static format<Entity>(entity: Entity) {
    return {
      ...this.formatCoordinates<Entity>(entity),
      ...this.formatDates<Entity>(entity),
    };
  }

  static formatCoordinates<Entity>(entity: Entity): Record<string, Geohash> {
    const geoData: Record<string, Geohash> = {};

    for (const key in entity) {
      if (Object.prototype.hasOwnProperty.call(entity, key)) {
        const value = (entity as any)[key];

        if (value instanceof CoordinatesValue) {
          geoData[`${PascalCamelToSnake.format(key)}_geohash`] = geohashForLocation([value.value.latitude, value.value.longitude]);
        }
      }
    }

    return geoData;
  }

  static formatDates<Entity>(entity: Entity): Record<string, Timestamp> {
    const formattedDates: Record<string, Timestamp> = {};

    for (const key in entity) {
      if (Object.prototype.hasOwnProperty.call(entity, key)) {
        const value = (entity as any)[key];

        if (value instanceof Date) {
          formattedDates[PascalCamelToSnake.format(key)] = Timestamp.fromDate(value);
        }
      }
    }

    return formattedDates;
  }
}

import { Timestamp } from "firebase/firestore";
import { Geohash } from "geofire-common";
export declare class PrimitiveTypesToFirestoreFormmater {
    static format<Entity>(entity: Entity): {
        [x: string]: string | Timestamp;
    };
    static formatCoordinates<Entity>(entity: Entity): Record<string, Geohash>;
    static formatDates<Entity>(entity: Entity): Record<string, Timestamp>;
}
//# sourceMappingURL=primitive-types-to-firestore-formatter.d.ts.map
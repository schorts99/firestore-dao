import { DocumentData } from "firebase/firestore";
import { PrimitiveTypesToFirestoreFormmater } from "./primitive-types-to-firestore-formatter";

export class EntityFirestoreFactory {
  static fromEntity<Entity extends { toPrimitives(): Record<string, any> }>(entity: Entity): DocumentData {
    const raw = {
      ...entity.toPrimitives(),
      ...PrimitiveTypesToFirestoreFormmater.format<Entity>(entity),
    };

    delete raw["id"];

    return raw;
  }
}

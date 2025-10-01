import { DocumentData } from "firebase/firestore";
export declare class EntityFirestoreFactory {
    static fromEntity<Entity extends {
        toPrimitives(): Record<string, any>;
    }>(entity: Entity): DocumentData;
}
//# sourceMappingURL=entity-firestore-factory.d.ts.map
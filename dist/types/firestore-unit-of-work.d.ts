import { Firestore, DocumentReference, DocumentData } from "firebase/firestore";
import { UnitOfWork } from "@schorts/shared-kernel";
export declare class FirestoreUnitOfWork implements UnitOfWork {
    private readonly firestore;
    private batch;
    private active;
    constructor(firestore: Firestore);
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    set(docRef: DocumentReference, data: DocumentData): void;
    update(docRef: DocumentReference, data: DocumentData): void;
    delete(docRef: DocumentReference): void;
}
//# sourceMappingURL=firestore-unit-of-work.d.ts.map
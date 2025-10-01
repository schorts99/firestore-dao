import { CollectionReference, QuerySnapshot } from "firebase/firestore";
import { Criteria } from "@schorts/shared-kernel";
export declare class FirestoreCriteriaQueryExecutor {
    static execute(collection: CollectionReference, criteria: Criteria): Promise<QuerySnapshot<import("@firebase/firestore").DocumentData, import("@firebase/firestore").DocumentData>>;
}
//# sourceMappingURL=firestore-criteria-query-executor.d.ts.map
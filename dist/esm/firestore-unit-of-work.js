"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreUnitOfWork = void 0;
const firestore_1 = require("firebase/firestore");
const exceptions_1 = require("./exceptions");
class FirestoreUnitOfWork {
    firestore;
    batch;
    active = false;
    constructor(firestore) {
        this.firestore = firestore;
        this.batch = (0, firestore_1.writeBatch)(firestore);
    }
    async begin() {
        this.active = true;
    }
    async commit() {
        if (!this.active) {
            throw new exceptions_1.TransactionNotActive();
        }
        await this.batch.commit();
        this.active = false;
    }
    async rollback() {
        this.batch = (0, firestore_1.writeBatch)(this.firestore);
        this.active = false;
    }
    set(docRef, data) {
        this.batch.set(docRef, data);
    }
    update(docRef, data) {
        this.batch.update(docRef, data);
    }
    delete(docRef) {
        this.batch.delete(docRef);
    }
}
exports.FirestoreUnitOfWork = FirestoreUnitOfWork;
//# sourceMappingURL=firestore-unit-of-work.js.map
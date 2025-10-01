"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreDAO = void 0;
const firestore_1 = require("firebase/firestore");
const firestore_criteria_query_executor_1 = require("./firestore-criteria-query-executor");
const firestore_entity_factory_1 = require("./firestore-entity-factory");
const entity_firestore_factory_1 = require("./entity-firestore-factory");
class FirestoreDAO {
    collection;
    firestoreEntityFactory;
    constructor(firestore, collectionName) {
        this.collection = (0, firestore_1.collection)(firestore, collectionName);
        this.firestoreEntityFactory = new firestore_entity_factory_1.FirestoreEntityFactory(collectionName);
    }
    async findByID(id) {
        const docRef = (0, firestore_1.doc)(this.collection, typeof id === "string" ? id : id.toString());
        const docSnap = await (0, firestore_1.getDoc)(docRef);
        return this.firestoreEntityFactory.fromSnapshot(docSnap);
    }
    async findOneBy(criteria) {
        criteria.limitResults(1);
        const querySnap = await firestore_criteria_query_executor_1.FirestoreCriteriaQueryExecutor.execute(this.collection, criteria);
        if (querySnap.empty) {
            return null;
        }
        const docSnap = querySnap.docs[0];
        return this.firestoreEntityFactory.fromSnapshot(docSnap);
    }
    async getAll() {
        const querySnap = await (0, firestore_1.getDocs)(this.collection);
        if (querySnap.empty) {
            return [];
        }
        return this.firestoreEntityFactory.fromSnapshots(querySnap.docs);
    }
    async search(criteria) {
        const querySnap = await firestore_criteria_query_executor_1.FirestoreCriteriaQueryExecutor.execute(this.collection, criteria);
        if (querySnap.empty) {
            return [];
        }
        return this.firestoreEntityFactory.fromSnapshots(querySnap.docs);
    }
    async create(entity, uow) {
        const docRef = (0, firestore_1.doc)(this.collection, typeof entity.id.value === "string" ? entity.id.value : entity.id.value.toString());
        const data = entity_firestore_factory_1.EntityFirestoreFactory.fromEntity(entity);
        if (uow) {
            uow.set(docRef, data);
            return entity;
        }
        else {
            await (0, firestore_1.setDoc)(docRef, data);
            return entity;
        }
    }
    async update(entity, uow) {
        const docRef = (0, firestore_1.doc)(this.collection, typeof entity.id.value === "string" ? entity.id.value : entity.id.value.toString());
        const data = entity_firestore_factory_1.EntityFirestoreFactory.fromEntity(entity);
        if (uow) {
            uow.update(docRef, data);
            return entity;
        }
        else {
            await (0, firestore_1.updateDoc)(docRef, data);
            return entity;
        }
    }
    async delete(entity, uow) {
        const docRef = (0, firestore_1.doc)(this.collection, typeof entity.id.value === "string" ? entity.id.value : entity.id.value.toString());
        if (uow) {
            uow.delete(docRef);
            return entity;
        }
        else {
            await (0, firestore_1.deleteDoc)(docRef);
            return entity;
        }
    }
}
exports.FirestoreDAO = FirestoreDAO;
//# sourceMappingURL=firestore-dao.js.map
import {
  CollectionReference,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  DAO,
  BaseModel,
  ValueObject,
  Entity as BaseEntity,
  Criteria,
} from "@schorts/shared-kernel";

import { FirestoreCriteriaQueryExecutor } from "./firestore-criteria-query-executor";
import { FirestoreEntityFactory } from "./firestore-entity-factory";
import { FirestoreUnitOfWork } from "./firestore-unit-of-work";
import { EntityFirestoreFactory } from "./entity-firestore-factory";

export abstract class FirestoreDAO<Model extends BaseModel, Entity extends BaseEntity<ValueObject, Model>> implements DAO<Model, Entity> {
  private readonly collection: CollectionReference;
  private readonly firestoreEntityFactory: FirestoreEntityFactory<Entity>;

  constructor(collection: CollectionReference) {
    this.collection = collection;
    this.firestoreEntityFactory = new FirestoreEntityFactory(collection.path);
  }

  async findByID(id: Entity["id"]["value"]): Promise<Entity | null> {
    const docRef = doc(this.collection, typeof id === "string" ? id : id!.toString());
    const docSnap = await getDoc(docRef);

    return this.firestoreEntityFactory.fromSnapshot(docSnap);
  }

  async findOneBy(criteria: Criteria): Promise<Entity | null> {
    criteria.limitResults(1)

    const querySnap = await FirestoreCriteriaQueryExecutor.execute(this.collection, criteria);

    if (querySnap.empty) {
      return null;
    }

    const docSnap = querySnap.docs[0]!;

    return this.firestoreEntityFactory.fromSnapshot(docSnap);
  }

  async getAll(): Promise<Entity[]> {
    const querySnap = await getDocs(this.collection);

    if (querySnap.empty) {
      return [];
    }

    return this.firestoreEntityFactory.fromSnapshots(querySnap.docs);
  }

  async search(criteria: Criteria): Promise<Entity[]> {
    const querySnap = await FirestoreCriteriaQueryExecutor.execute(this.collection, criteria);

    if (querySnap.empty) {
      return [];
    }

    return this.firestoreEntityFactory.fromSnapshots(querySnap.docs);
  }

  async create(entity: Entity, uow?: FirestoreUnitOfWork): Promise<Entity> {
    const docRef = doc(this.collection, typeof entity.id.value === "string" ? entity.id.value : entity.id.value!.toString());
    const data = EntityFirestoreFactory.fromEntity(entity);

    if (uow) {
      uow.set(docRef, data);

      return entity;
    } else {
      await setDoc(docRef, data);

      return entity;
    }
  }

  async update(entity: Entity, uow?: FirestoreUnitOfWork): Promise<Entity> {
    const docRef = doc(this.collection, typeof entity.id.value === "string" ? entity.id.value : entity.id.value!.toString());
    const data = EntityFirestoreFactory.fromEntity(entity);

    if (uow) {
      uow.update(docRef, data);

      return entity;
    } else {
      await updateDoc(docRef, data);

      return entity;
    }
  }

  async delete(entity: Entity, uow?: FirestoreUnitOfWork): Promise<Entity> {
    const docRef = doc(this.collection, typeof entity.id.value === "string" ? entity.id.value : entity.id.value!.toString());

    if (uow) {
      uow.delete(docRef);

      return entity;
    } else {
      await deleteDoc(docRef);

      return entity;
    }
  }
}

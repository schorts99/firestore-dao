export { FirestoreDAO } from "./firestore-dao";
export { FirestoreUnitOfWork } from "./firestore-unit-of-work";
export { FirestoreTypesToPrimitivesFormatter } from "./firestore-types-to-primitives-formatter";
export { CriteriaToFirestoreSymbolsTranslator } from "./criteria-to-firestore-symbos-translator";
export { FirestoreEntityFactory } from "./firestore-entity-factory";
export { PrimitiveTypesToFirestoreFormatter } from "./primitive-types-to-firestore-formatter";
export { EntityFirestoreFactory } from "./entity-firestore-factory";

export { collection, getFirestore, Firestore } from "firebase/firestore";
export { getAuth, type Auth } from "firebase/auth";
export { initializeApp, getApps, type FirebaseApp } from "firebase/app";
export { EntityRegistry, RegisterEntity } from "@schorts/shared-kernel";
export { getAnalytics, type Analytics } from "firebase/analytics";

export * from "./exceptions";

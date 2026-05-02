import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firestore } from "../config/firebase.js";

const seededCollections = new Map();

async function ensureSeeded(collectionName, items) {
  const existingSeed = seededCollections.get(collectionName);
  if (existingSeed) {
    return existingSeed;
  }

  const seedPromise = (async () => {
    const snapshot = await getDocs(collection(firestore, collectionName));
    if (!snapshot.empty || !items.length) {
      return;
    }

    const batch = writeBatch(firestore);
    items.forEach((item) => {
      batch.set(doc(firestore, collectionName, item.id), item);
    });
    await batch.commit();
  })();

  seededCollections.set(collectionName, seedPromise);
  try {
    await seedPromise;
  } catch (error) {
    seededCollections.delete(collectionName);
    throw error;
  }
}

export function createCollectionStore(collectionName, seedItems = []) {
  return {
    async getAll() {
      await ensureSeeded(collectionName, seedItems);
      const snapshot = await getDocs(collection(firestore, collectionName));
      return snapshot.docs.map((item) => item.data());
    },

    async save(item) {
      await setDoc(doc(firestore, collectionName, item.id), item);
    },

    async remove(id) {
      await deleteDoc(doc(firestore, collectionName, id));
    },
  };
}

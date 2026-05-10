import { mockSchedules } from "../../data/mock/schedules.js";
import { createCollectionStore } from "../../data/firebase/collectionStore.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firestore } from "../../data/config/firebase.js";

const store = createCollectionStore("schedules", mockSchedules);

export const scheduleRepository = {
  async getAll(session = null) {
    const effectiveRole = session?.effectiveRole ?? session?.role;

    if (effectiveRole === "teacher") {
      const snapshot = await getDocs(query(collection(firestore, "schedules"), where("teacherUid", "==", session.uid)));
      return snapshot.docs.map((item) => item.data());
    }

    if (effectiveRole === "student") {
      const snapshot = await getDocs(query(collection(firestore, "schedules"), where("studentUserUid", "==", session.uid)));
      return snapshot.docs.map((item) => item.data());
    }

    if (effectiveRole === "viewer") {
      return [];
    }

    return store.getAll();
  },

  async save(schedule) {
    return store.save(schedule);
  },

  async remove(scheduleId) {
    return store.remove(scheduleId);
  },
};

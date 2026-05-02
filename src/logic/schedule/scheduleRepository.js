import { mockSchedules } from "../../data/mock/schedules.js";
import { createCollectionStore } from "../../data/firebase/collectionStore.js";

const store = createCollectionStore("schedules", mockSchedules);

export const scheduleRepository = {
  async getAll() {
    return store.getAll();
  },

  async save(schedule) {
    return store.save(schedule);
  },

  async remove(scheduleId) {
    return store.remove(scheduleId);
  },
};

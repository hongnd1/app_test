import { mockStudents } from "../../data/mock/students.js";
import { createCollectionStore } from "../../data/firebase/collectionStore.js";

const store = createCollectionStore("students", mockStudents);

export const studentRepository = {
  async getAll() {
    return store.getAll();
  },

  async save(student) {
    return store.save(student);
  },

  async remove(studentId) {
    return store.remove(studentId);
  },
};

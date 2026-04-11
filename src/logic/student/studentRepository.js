import { mockStudents } from "../../data/mock/students.js";

const STORAGE_KEY = "blx_students";

function initialize() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockStudents));
  }
}

export const studentRepository = {
  getAll() {
    initialize();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  },

  saveAll(students) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  },
};

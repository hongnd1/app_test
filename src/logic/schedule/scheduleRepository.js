import { mockSchedules } from "../../data/mock/schedules.js";

const STORAGE_KEY = "blx_schedules";

function initialize() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSchedules));
  }
}

export const scheduleRepository = {
  getAll() {
    initialize();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  },

  saveAll(schedules) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  },
};

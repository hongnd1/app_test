import { createScheduleModel } from "../../models/Schedule.js";
import { scheduleRepository } from "./scheduleRepository.js";
import { scheduleValidator } from "./scheduleValidator.js";

function normalizeSchedules(items) {
  return items
    .map((item) => createScheduleModel(item))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function generateScheduleId(schedules) {
  const maxId = schedules.reduce((max, schedule) => {
    const numericId = Number(String(schedule.id).replace("DAT", ""));
    return Number.isNaN(numericId) ? max : Math.max(max, numericId);
  }, 0);

  return `DAT${String(maxId + 1).padStart(3, "0")}`;
}

function todayString(offsetDays = 0) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

export const scheduleService = {
  getAllSchedules() {
    return normalizeSchedules(scheduleRepository.getAll());
  },

  createSchedule(payload, student) {
    const schedules = this.getAllSchedules();
    const schedule = createScheduleModel({
      id: generateScheduleId(schedules),
      studentId: student?.id,
      studentName: student?.ten,
      licenseType: student?.loaiBang,
      date: payload.date,
      time: payload.time,
      note: payload.note,
    });

    const validation = scheduleValidator.validate(schedule, student);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    scheduleRepository.saveAll([...schedules, schedule]);
    return { success: true, schedule };
  },

  deleteSchedule(scheduleId) {
    const schedules = this.getAllSchedules();
    scheduleRepository.saveAll(schedules.filter((item) => item.id !== scheduleId));
  },

  getScheduleBuckets() {
    const schedules = this.getAllSchedules();
    const today = todayString(0);
    const tomorrow = todayString(1);

    return {
      today: schedules.filter((item) => item.date === today),
      tomorrow: schedules.filter((item) => item.date === tomorrow),
      all: schedules,
    };
  },
};

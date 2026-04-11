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

function getCalendarDays(month, year, schedules, selectedDate) {
  const firstDay = new Date(year, month, 1);
  const startWeekDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const items = [];

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - startWeekDay + 1;
    const date = new Date(year, month, dayNumber);
    const iso = date.toISOString().slice(0, 10);
    items.push({
      iso,
      label: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
      isToday: iso === todayString(0),
      isSelected: iso === selectedDate,
      hasSchedule: schedules.some((item) => item.date === iso),
    });
  }

  return items;
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

    const validation = scheduleValidator.validate(schedule, student, schedules);
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

  getScheduleBuckets({ month, year, selectedDate }) {
    const schedules = this.getAllSchedules();
    const today = todayString(0);
    const tomorrow = todayString(1);

    return {
      today: schedules.filter((item) => item.date === today),
      tomorrow: schedules.filter((item) => item.date === tomorrow),
      all: schedules,
      selectedDay: schedules.filter((item) => item.date === selectedDate),
      calendarDays: getCalendarDays(month, year, schedules, selectedDate),
    };
  },
};

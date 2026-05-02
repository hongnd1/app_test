import { createScheduleModel } from "../../models/Schedule.js";
import { scheduleRepository } from "./scheduleRepository.js";
import { scheduleValidator } from "./scheduleValidator.js";

function normalizeSchedules(items) {
  return items
    .map((item) => createScheduleModel(item))
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
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
  async getAllSchedules() {
    return normalizeSchedules(await scheduleRepository.getAll());
  },

  async createSchedule(payload, student) {
    const schedules = await this.getAllSchedules();
    const schedule = createScheduleModel({
      id: generateScheduleId(schedules),
      studentId: student?.id,
      studentName: student?.ten,
      licenseType: student?.loaiBang,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      note: payload.note,
    });

    const validation = scheduleValidator.validate(schedule, student, schedules);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    await scheduleRepository.save(schedule);
    return { success: true, schedule };
  },

  async deleteSchedule(scheduleId) {
    await scheduleRepository.remove(scheduleId);
  },

  getScheduleBuckets(schedules, { month, year, selectedDate }) {
    const today = todayString(0);
    const tomorrow = todayString(1);

    return {
      todayDate: today,
      tomorrowDate: tomorrow,
      today: schedules.filter((item) => item.date === today),
      tomorrow: schedules.filter((item) => item.date === tomorrow),
      all: schedules,
      selectedDay: schedules.filter((item) => item.date === selectedDate),
      calendarDays: getCalendarDays(month, year, schedules, selectedDate),
    };
  },
};

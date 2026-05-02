import { createScheduleModel } from "../../models/Schedule.js";
import { scheduleRepository } from "./scheduleRepository.js";
import { getScheduleSlot } from "./scheduleSlots.js";
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
    const slot = getScheduleSlot(payload.slotKey);
    const schedule = createScheduleModel({
      id: generateScheduleId(schedules),
      studentId: student?.id,
      studentName: student?.ten,
      studentPhone: student?.sdt,
      studentZaloName: student?.tenZalo,
      licenseType: student?.loaiBang,
      date: payload.date,
      slotKey: slot?.key,
      slotLabel: slot?.label,
      startTime: slot?.startTime,
      endTime: slot?.endTime,
      note: payload.note,
      meetingLocation: "",
      meetingLocationStatus: "pending",
      teacherReminderNote: "Cần hẹn địa điểm chạy DAT với học viên.",
      teacherConfirmed: false,
      reminderCreatedAt: new Date().toISOString(),
      reminderUpdatedAt: new Date().toISOString(),
    });

    const validation = scheduleValidator.validate(schedule, student, schedules);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    await scheduleRepository.save(schedule);
    return { success: true, schedule };
  },

  async updateMeetingLocation(scheduleId, payload) {
    const schedules = await this.getAllSchedules();
    const currentSchedule = schedules.find((item) => item.id === scheduleId);

    if (!currentSchedule) {
      return { success: false, message: "Không tìm thấy lịch học cần cập nhật địa điểm." };
    }

    const nextStatus = payload.meetingLocationStatus ?? "confirmed";
    if (nextStatus === "confirmed" && !payload.meetingLocation?.trim()) {
      return { success: false, message: "Vui lòng nhập địa điểm hẹn cho học viên." };
    }

    const updatedSchedule = createScheduleModel({
      ...currentSchedule,
      meetingLocation: payload.meetingLocation,
      meetingLocationStatus: nextStatus,
      teacherReminderNote: payload.teacherReminderNote ?? currentSchedule.teacherReminderNote,
      teacherConfirmed:
        payload.teacherConfirmed === undefined ? nextStatus === "confirmed" : Boolean(payload.teacherConfirmed),
      reminderUpdatedAt: new Date().toISOString(),
      meetingNote: payload.meetingNote,
      notificationStatus: nextStatus === "confirmed" ? "ready" : "pending",
      notifiedAt: nextStatus === "confirmed" ? new Date().toISOString() : null,
    });

    await scheduleRepository.save(updatedSchedule);
    return { success: true, schedule: updatedSchedule };
  },

  async deleteSchedule(scheduleId) {
    await scheduleRepository.remove(scheduleId);
  },

  getScheduleById(schedules, scheduleId) {
    return schedules.find((item) => item.id === scheduleId) ?? null;
  },

  getSchedulesNeedingMeetingLocation(schedules, dateString) {
    return schedules.filter(
      (item) =>
        item.date === dateString &&
        (item.meetingLocationStatus === "pending" || !item.teacherConfirmed),
    );
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

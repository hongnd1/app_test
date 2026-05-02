import { getScheduleSlot } from "./scheduleSlots.js";

export const scheduleValidator = {
  validate(schedule, student, schedules = []) {
    if (!student) {
      return { valid: false, message: "Không tìm thấy học viên để đặt lịch." };
    }

    if (!student.daHocLyThuyet) {
      return { valid: false, message: "Chỉ được đặt lịch DAT cho học viên đã hoàn thành lý thuyết." };
    }

    if (!schedule.date) {
      return { valid: false, message: "Vui lòng chọn ngày học DAT." };
    }

    const slot = getScheduleSlot(schedule.slotKey);
    if (!slot) {
      return { valid: false, message: "Vui lòng chọn ca học hợp lệ." };
    }

    if (schedule.startTime !== slot.startTime || schedule.endTime !== slot.endTime) {
      return { valid: false, message: `Ca ${slot.label.toLowerCase()} phải đúng khung giờ ${slot.startTime} - ${slot.endTime}.` };
    }

    const overlapped = schedules.some((item) => {
      if (item.date !== schedule.date) {
        return false;
      }

      const itemStart = item.startTime ?? item.time;
      const itemEnd = item.endTime ?? item.time;
      return schedule.startTime < itemEnd && schedule.endTime > itemStart;
    });

    if (overlapped) {
      return { valid: false, message: "Ca học này đã trùng với một lịch khác. Vui lòng chọn ca khác." };
    }

    return { valid: true };
  },
};

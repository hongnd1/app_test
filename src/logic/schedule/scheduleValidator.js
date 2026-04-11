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

    if (!schedule.time) {
      return { valid: false, message: "Vui lòng chọn giờ học DAT." };
    }

    if (schedule.time < "06:00" || schedule.time > "21:00") {
      return { valid: false, message: "Giờ học DAT chỉ được đặt trong khoảng 06:00 đến 21:00." };
    }

    const duplicated = schedules.some(
      (item) => item.date === schedule.date && item.time === schedule.time,
    );
    if (duplicated) {
      return { valid: false, message: "Khung giờ này đã có lịch học. Vui lòng chọn giờ khác." };
    }

    return { valid: true };
  },
};

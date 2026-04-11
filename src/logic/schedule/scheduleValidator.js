export const scheduleValidator = {
  validate(schedule, student) {
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

    return { valid: true };
  },
};

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

    if (!schedule.startTime || !schedule.endTime) {
      return { valid: false, message: "Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc." };
    }

    if (schedule.startTime < "06:00" || schedule.endTime > "21:00") {
      return { valid: false, message: "Lịch học DAT chỉ được đặt trong khoảng 06:00 đến 21:00." };
    }

    if (schedule.endTime <= schedule.startTime) {
      return { valid: false, message: "Giờ kết thúc phải lớn hơn giờ bắt đầu." };
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
      return { valid: false, message: "Khoảng giờ này đã trùng với một lịch học khác. Vui lòng chọn giờ khác." };
    }

    return { valid: true };
  },
};

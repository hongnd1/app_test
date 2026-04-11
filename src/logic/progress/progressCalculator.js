const DAT_TARGET_KM = 810;

export const progressCalculator = {
  getDatStatus(student) {
    if (student.soKmDAT >= DAT_TARGET_KM) {
      return { label: "DAT đã đạt", tone: "success" };
    }

    if (student.soKmDAT > 0) {
      return { label: `Còn thiếu ${DAT_TARGET_KM - student.soKmDAT} km`, tone: "warning" };
    }

    return { label: "Chưa chạy DAT", tone: "danger" };
  },

  getStageSummary(student) {
    if (student.daHocLyThuyet && student.daHocSaHinh && student.soKmDAT >= DAT_TARGET_KM) {
      return "Hoàn tất đào tạo";
    }

    if (student.daHocLyThuyet && (student.daHocSaHinh || student.soKmDAT > 0)) {
      return "Đang trong giai đoạn thực hành";
    }

    return "Cần hoàn thành lý thuyết";
  },

  getTargetKm() {
    return DAT_TARGET_KM;
  },
};

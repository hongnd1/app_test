const DAT_TARGET_KM = 810;

export const progressCalculator = {
  getDatStatus(student) {
    if (student.soKmDAT >= DAT_TARGET_KM) {
      return { label: "DAT da dat", tone: "success" };
    }

    if (student.soKmDAT > 0) {
      return { label: `Con thieu ${DAT_TARGET_KM - student.soKmDAT} km`, tone: "warning" };
    }

    return { label: "Chua chay DAT", tone: "danger" };
  },

  getStageSummary(student) {
    if (student.daHocLyThuyet && student.daHocSaHinh && student.soKmDAT >= DAT_TARGET_KM) {
      return "Hoan tat dao tao";
    }

    if (student.daHocLyThuyet && (student.daHocSaHinh || student.soKmDAT > 0)) {
      return "Dang trong giai doan thuc hanh";
    }

    return "Can hoan thanh ly thuyet";
  },

  getTargetKm() {
    return DAT_TARGET_KM;
  },
};

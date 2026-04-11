import { progressCalculator } from "./progressCalculator.js";

function percent(count, total) {
  if (!total) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

export const progressService = {
  getDatStatus(student) {
    return progressCalculator.getDatStatus(student);
  },

  getStageSummary(student) {
    return progressCalculator.getStageSummary(student);
  },

  getDashboardStatistics(students) {
    return {
      theoryCompleted: students.filter((student) => student.daHocLyThuyet).length,
      unpaid: students.filter((student) => student.conThieu > 0).length,
      saHinhCompleted: students.filter((student) => student.daHocSaHinh).length,
      datReached: students.filter(
        (student) => student.soKmDAT >= progressCalculator.getTargetKm(),
      ).length,
      totalRevenue: students.reduce((sum, student) => sum + student.daNop, 0),
    };
  },

  getProgressOverview(students) {
    const total = students.length;
    const theoryCompleted = students.filter((student) => student.daHocLyThuyet).length;
    const saHinhCompleted = students.filter((student) => student.daHocSaHinh).length;
    const datReached = students.filter(
      (student) => student.soKmDAT >= progressCalculator.getTargetKm(),
    ).length;
    const paymentCompleted = students.filter((student) => student.conThieu <= 0).length;

    return [
      {
        key: "theoryCompleted",
        label: "Lý thuyết",
        count: theoryCompleted,
        total,
        percent: percent(theoryCompleted, total),
      },
      {
        key: "saHinhCompleted",
        label: "Sa hình",
        count: saHinhCompleted,
        total,
        percent: percent(saHinhCompleted, total),
      },
      {
        key: "datReached",
        label: "DAT",
        count: datReached,
        total,
        percent: percent(datReached, total),
      },
      {
        key: "paidCompleted",
        label: "Học phí",
        count: paymentCompleted,
        total,
        percent: percent(paymentCompleted, total),
      },
    ];
  },
};

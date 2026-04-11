import { progressCalculator } from "./progressCalculator.js";

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
};

import { progressCalculator } from "../progress/progressCalculator.js";

export const filterService = {
  filterStudents(students, filters) {
    return students.filter((student) => {
      if (filters.theory === "done" && !student.daHocLyThuyet) return false;
      if (filters.theory === "pending" && student.daHocLyThuyet) return false;
      if (filters.saHinh === "done" && !student.daHocSaHinh) return false;
      if (filters.saHinh === "pending" && student.daHocSaHinh) return false;
      if (filters.payment === "paid" && student.conThieu > 0) return false;
      if (filters.payment === "debt" && student.conThieu <= 0) return false;
      if (filters.dat === "reached" && student.soKmDAT < progressCalculator.getTargetKm()) {
        return false;
      }
      if (filters.dat === "pending" && student.soKmDAT >= progressCalculator.getTargetKm()) {
        return false;
      }
      if (filters.minPaidAmount !== "" && student.daNop < Number(filters.minPaidAmount)) {
        return false;
      }

      return true;
    });
  },
};

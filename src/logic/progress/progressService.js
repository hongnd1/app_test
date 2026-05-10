import { progressCalculator } from "./progressCalculator.js";

function percent(count, total) {
  if (!total) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

function isInSelectedPeriod(dateString, month, year) {
  if (!dateString) {
    return false;
  }

  const date = new Date(`${dateString}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month;
}

function isGraduated(student) {
  return Boolean(
    student.daHocLyThuyet &&
      student.daHocSaHinh &&
      student.soKmDAT >= progressCalculator.getTargetKm() &&
      student.conThieu <= 0,
  );
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

  getTeachingStatistics(students, schedules, options = {}) {
    const month = Number.isInteger(options.month) ? options.month : new Date().getMonth();
    const year = Number.isInteger(options.year) ? options.year : new Date().getFullYear();
    const teacherUid = options.teacherUid || "";

    const scopedStudents = teacherUid
      ? students.filter((student) => student.teacherUid === teacherUid)
      : students;
    const scopedSchedules = teacherUid
      ? schedules.filter((schedule) => schedule.teacherUid === teacherUid)
      : schedules;
    const schedulesInPeriod = scopedSchedules.filter((schedule) => isInSelectedPeriod(schedule.date, month, year));
    const taughtStudentIds = new Set(schedulesInPeriod.map((schedule) => schedule.studentId).filter(Boolean));
    const graduatedStudents = scopedStudents.filter(isGraduated);
    const datKm = scopedStudents.reduce((sum, student) => sum + Number(student.soKmDAT || 0), 0);

    return {
      month,
      year,
      schedulesInPeriod: schedulesInPeriod.length,
      taughtStudents: taughtStudentIds.size,
      graduatedStudents: graduatedStudents.length,
      datKm,
      totalStudents: scopedStudents.length,
    };
  },
};

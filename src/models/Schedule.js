export function createScheduleModel(data) {
  return {
    id: data.id,
    studentId: data.studentId,
    studentName: data.studentName,
    licenseType: data.licenseType,
    date: data.date,
    time: data.time,
    note: data.note?.trim() ?? "",
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

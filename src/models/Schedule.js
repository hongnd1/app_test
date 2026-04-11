export function createScheduleModel(data) {
  const startTime = data.startTime ?? data.time ?? "";
  const endTime = data.endTime ?? data.time ?? "";

  return {
    id: data.id,
    studentId: data.studentId,
    studentName: data.studentName,
    licenseType: data.licenseType,
    date: data.date,
    startTime,
    endTime,
    time: startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime,
    note: data.note?.trim() ?? "",
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

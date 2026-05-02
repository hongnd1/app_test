import { findScheduleSlotByTimeRange } from "../logic/schedule/scheduleSlots.js";

export function createScheduleModel(data) {
  const startTime = data.startTime ?? data.time ?? "";
  const endTime = data.endTime ?? data.time ?? "";
  const inferredSlot = data.slotKey ? null : findScheduleSlotByTimeRange(startTime, endTime);
  const slotKey = data.slotKey ?? inferredSlot?.key ?? "";
  const slotLabel = data.slotLabel ?? inferredSlot?.label ?? "";
  const reminderCreatedAt = data.reminderCreatedAt ?? new Date().toISOString();
  const meetingLocation = data.meetingLocation?.trim() ?? "";
  const meetingLocationStatus = data.meetingLocationStatus ?? (meetingLocation ? "confirmed" : "pending");
  const teacherConfirmed =
    data.teacherConfirmed === undefined ? meetingLocationStatus === "confirmed" : Boolean(data.teacherConfirmed);

  return {
    id: data.id,
    studentId: data.studentId,
    studentName: data.studentName,
    studentPhone: data.studentPhone ?? "",
    studentZaloName: data.studentZaloName ?? "",
    licenseType: data.licenseType,
    date: data.date,
    slotKey,
    slotLabel,
    startTime,
    endTime,
    time: startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime,
    note: data.note?.trim() ?? "",
    meetingLocation,
    meetingLocationStatus,
    teacherReminderNote:
      data.teacherReminderNote?.trim() ?? "Cần hẹn địa điểm chạy DAT với học viên.",
    teacherConfirmed,
    reminderCreatedAt,
    reminderUpdatedAt: data.reminderUpdatedAt ?? reminderCreatedAt,
    meetingNote: data.meetingNote?.trim() ?? "",
    notificationStatus: data.notificationStatus ?? "pending",
    notifiedAt: data.notifiedAt ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

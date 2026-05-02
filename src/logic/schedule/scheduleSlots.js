export const SCHEDULE_SLOTS = {
  morning: {
    key: "morning",
    label: "Ca sáng",
    startTime: "06:00",
    endTime: "11:30",
  },
  afternoon: {
    key: "afternoon",
    label: "Ca chiều",
    startTime: "13:00",
    endTime: "17:00",
  },
  evening: {
    key: "evening",
    label: "Ca tối",
    startTime: "18:00",
    endTime: "21:00",
  },
};

export function getScheduleSlot(slotKey) {
  return SCHEDULE_SLOTS[slotKey] ?? null;
}

export function getScheduleSlotList() {
  return Object.values(SCHEDULE_SLOTS);
}

export function findScheduleSlotByTimeRange(startTime, endTime) {
  return (
    getScheduleSlotList().find(
      (slot) => startTime >= slot.startTime && endTime <= slot.endTime,
    ) ?? null
  );
}

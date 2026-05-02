const REMINDER_HOURS = [21, 22];
const REMINDER_MARK_KEY = "blx_schedule_reminder_marks";

function getStoredMarks() {
  try {
    const raw = localStorage.getItem(REMINDER_MARK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredMarks(marks) {
  localStorage.setItem(REMINDER_MARK_KEY, JSON.stringify(marks));
}

function buildMarkKey(dateString, hour) {
  return `${dateString}-${hour}`;
}

function isPendingReminder(schedule) {
  return schedule.meetingLocationStatus === "pending" || !schedule.teacherConfirmed;
}

function isReminderCandidateFromDate(schedule, dateString) {
  return schedule.date >= dateString && isPendingReminder(schedule);
}

function createReminderNotification(hour, schedules) {
  const total = schedules.length;
  return {
    id: `${new Date().toISOString()}-${hour}`,
    title: `Nhắc hẹn địa điểm DAT lúc ${String(hour).padStart(2, "0")}:00`,
    body:
      total === 1
        ? `Còn 1 lịch DAT chưa hẹn địa điểm. Vào dashboard để kiểm tra.`
        : `Còn ${total} lịch DAT chưa hẹn địa điểm. Vào dashboard để kiểm tra.`,
    channel: "schedule-reminder",
    tag: `dat-reminder-${new Date().toISOString().slice(0, 10)}-${hour}`,
    hour,
    schedules,
    createdAt: new Date().toISOString(),
  };
}

function getNextTriggerDate(now = new Date()) {
  const next = new Date(now);
  next.setSeconds(0, 0);

  for (const hour of REMINDER_HOURS) {
    const candidate = new Date(now);
    candidate.setHours(hour, 0, 0, 0);
    if (candidate.getTime() > now.getTime()) {
      return candidate;
    }
  }

  next.setDate(next.getDate() + 1);
  next.setHours(REMINDER_HOURS[0], 0, 0, 0);
  return next;
}

export const scheduleReminderService = {
  getPendingSchedulesForDate(schedules, dateString) {
    return schedules.filter((schedule) => isReminderCandidateFromDate(schedule, dateString));
  },

  getReminderSummary(schedules, dateString) {
    const pendingSchedules = this.getPendingSchedulesForDate(schedules, dateString);
    return {
      pendingCount: pendingSchedules.length,
      pendingSchedules,
      hasPending: pendingSchedules.length > 0,
    };
  },

  maybeCreateDueNotification(schedules, now = new Date()) {
    const hour = now.getHours();
    if (!REMINDER_HOURS.includes(hour) || now.getMinutes() > 59) {
      return null;
    }

    const dateString = now.toISOString().slice(0, 10);
    const pendingSchedules = this.getPendingSchedulesForDate(schedules, dateString);
    if (!pendingSchedules.length) {
      return null;
    }

    const marks = getStoredMarks();
    const markKey = buildMarkKey(dateString, hour);
    if (marks[markKey]) {
      return null;
    }

    marks[markKey] = now.toISOString();
    saveStoredMarks(marks);

    return createReminderNotification(hour, pendingSchedules);
  },

  startScheduler(onDue) {
    let timeoutId = null;
    let disposed = false;

    const scheduleNext = () => {
      if (disposed) {
        return;
      }

      const nextDate = getNextTriggerDate();
      const delay = Math.max(nextDate.getTime() - Date.now(), 1000);
      timeoutId = window.setTimeout(() => {
        onDue(new Date());
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      disposed = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  },
};

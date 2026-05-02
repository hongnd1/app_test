const STORAGE_PREFIX = "blx_notification_inbox";

function getStorageKey(uid) {
  return `${STORAGE_PREFIX}:${uid}`;
}

function readInbox(uid) {
  if (!uid) {
    return [];
  }

  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveInbox(uid, items) {
  if (!uid) {
    return;
  }

  localStorage.setItem(getStorageKey(uid), JSON.stringify(items));
}

function toNotificationKey(notification) {
  return (
    notification.key ||
    notification.tag ||
    notification.scheduleId ||
    `${notification.channel || "app"}:${notification.title}:${notification.body}`
  );
}

function normalizeNotification(notification) {
  return {
    id: notification.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    key: toNotificationKey(notification),
    title: notification.title || "Thông báo",
    body: notification.body || "",
    channel: notification.channel || "app",
    createdAt: notification.createdAt || new Date().toISOString(),
    readAt: notification.readAt || null,
    scheduleId: notification.scheduleId || notification.payload?.id || null,
    metadata: notification.metadata || null,
  };
}

function sortInbox(items) {
  return [...items].sort((a, b) => `${b.createdAt}`.localeCompare(`${a.createdAt}`));
}

function buildPendingNotification(schedule) {
  return normalizeNotification({
    id: `pending_${schedule.id}`,
    key: `pending_${schedule.id}`,
    title: "Lịch DAT cần hẹn địa điểm",
    body: `${schedule.studentName} - ${schedule.date} - ${schedule.time}`,
    channel: "pending-dat",
    scheduleId: schedule.id,
    createdAt: schedule.updatedAt || schedule.createdAt || new Date().toISOString(),
    metadata: {
      date: schedule.date,
      time: schedule.time,
      studentName: schedule.studentName,
      licenseType: schedule.licenseType,
      meetingLocationStatus: schedule.meetingLocationStatus,
    },
  });
}

export const notificationInboxService = {
  getInbox(uid) {
    return sortInbox(readInbox(uid));
  },

  getUnreadCount(uid) {
    return this.getInbox(uid).filter((item) => !item.readAt).length;
  },

  addNotification(uid, notification) {
    const nextItem = normalizeNotification(notification);
    const inbox = readInbox(uid);
    const existingIndex = inbox.findIndex((item) => item.key === nextItem.key);

    if (existingIndex >= 0) {
      const existing = inbox[existingIndex];
      inbox[existingIndex] = {
        ...existing,
        ...nextItem,
        readAt: existing.readAt,
      };
    } else {
      inbox.push(nextItem);
    }

    saveInbox(uid, sortInbox(inbox));
    return nextItem;
  },

  syncPendingSchedules(uid, schedules, todayString) {
    const inbox = readInbox(uid);
    const pendingSchedules = schedules.filter(
      (schedule) =>
        schedule.date >= todayString &&
        (schedule.meetingLocationStatus === "pending" || schedule.teacherConfirmed !== true),
    );

    const pendingMap = new Map(pendingSchedules.map((schedule) => [schedule.id, schedule]));
    const nextInbox = inbox.filter((item) => {
      if (item.channel !== "pending-dat") {
        return true;
      }

      return pendingMap.has(item.scheduleId);
    });

    pendingSchedules.forEach((schedule) => {
      const nextItem = buildPendingNotification(schedule);
      const existingIndex = nextInbox.findIndex((item) => item.key === nextItem.key);

      if (existingIndex >= 0) {
        nextInbox[existingIndex] = {
          ...nextInbox[existingIndex],
          ...nextItem,
          readAt: nextInbox[existingIndex].readAt,
        };
      } else {
        nextInbox.push(nextItem);
      }
    });

    saveInbox(uid, sortInbox(nextInbox));
    return sortInbox(nextInbox);
  },

  markAllAsRead(uid) {
    const nextInbox = readInbox(uid).map((item) => ({
      ...item,
      readAt: item.readAt || new Date().toISOString(),
    }));
    saveInbox(uid, sortInbox(nextInbox));
    return sortInbox(nextInbox);
  },

  markAsRead(uid, notificationId) {
    const nextInbox = readInbox(uid).map((item) =>
      item.id === notificationId
        ? { ...item, readAt: item.readAt || new Date().toISOString() }
        : item,
    );
    saveInbox(uid, sortInbox(nextInbox));
    return sortInbox(nextInbox);
  },

  clear(uid) {
    if (!uid) {
      return;
    }

    localStorage.removeItem(getStorageKey(uid));
  },
};

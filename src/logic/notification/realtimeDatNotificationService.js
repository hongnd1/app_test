import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firestore } from "../../data/config/firebase.js";
import { notificationConfig } from "../../data/config/notificationConfig.js";

function isBrowserNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

function getNotificationPermissionStatus() {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
}

function isPendingSchedule(schedule) {
  return schedule?.meetingLocationStatus === "pending" || schedule?.teacherConfirmed !== true;
}

function buildRealtimeNotification(schedule) {
  return {
    id: `${schedule.id}-${Date.now()}`,
    title: "Lịch DAT mới",
    body: `Học viên ${schedule.studentName} đăng ký chạy DAT ngày ${schedule.date} lúc ${schedule.startTime}. Cần hẹn địa điểm.`,
    tag: `dat-realtime-${schedule.id}`,
    channel: "realtime-dat",
    scheduleId: schedule.id,
    payload: schedule,
    createdAt: new Date().toISOString(),
  };
}

async function showBrowserNotification(notification) {
  if (!notificationConfig.enableBrowserNotificationInRealtimeMode) {
    return false;
  }

  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  new Notification(notification.title, {
    body: notification.body,
    tag: notification.tag,
  });

  return true;
}

export const realtimeDatNotificationService = {
  isBrowserNotificationSupported,

  getNotificationPermissionStatus,

  async requestBrowserNotificationPermission() {
    if (!isBrowserNotificationSupported()) {
      return { success: false, message: "Trình duyệt này chưa hỗ trợ thông báo." };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        message: "Trình duyệt đang chặn thông báo. Vui lòng bật lại trong cài đặt trình duyệt.",
      };
    }

    return {
      success: true,
      message: "Đã bật thông báo trên trình duyệt này. Thông báo hoạt động khi web app đang mở.",
    };
  },

  async showDatNotification(schedule) {
    const notification = buildRealtimeNotification(schedule);
    await showBrowserNotification(notification);
    return notification;
  },

  startListening(onNotify) {
    let ready = false;
    const notifiedIds = new Set();

    const scheduleQuery = query(collection(firestore, "schedules"), orderBy("createdAt", "asc"));
    return onSnapshot(scheduleQuery, async (snapshot) => {
      if (!ready) {
        snapshot.docs.forEach((item) => notifiedIds.add(item.id));
        ready = true;
        return;
      }

      for (const change of snapshot.docChanges()) {
        if (change.type !== "added") {
          continue;
        }

        if (notifiedIds.has(change.doc.id)) {
          continue;
        }

        notifiedIds.add(change.doc.id);
        const schedule = { id: change.doc.id, ...change.doc.data() };

        if (!isPendingSchedule(schedule)) {
          continue;
        }

        const notification = await this.showDatNotification(schedule);
        onNotify(notification, schedule);
      }
    });
  },
};

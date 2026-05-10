import {
  NOTIFICATION_MODES,
  getNotificationMode,
  setNotificationMode,
} from "../../data/config/notificationConfig.js";

const MODE_LABELS = {
  [NOTIFICATION_MODES.OFF]: "Tắt thông báo",
  [NOTIFICATION_MODES.REALTIME]: "Realtime miễn phí",
  [NOTIFICATION_MODES.FCM]: "FCM push notification",
};

export const notificationModeService = {
  isNotificationOff() {
    return getNotificationMode() === NOTIFICATION_MODES.OFF;
  },

  isRealtimeMode() {
    return getNotificationMode() === NOTIFICATION_MODES.REALTIME;
  },

  isFcmMode() {
    return getNotificationMode() === NOTIFICATION_MODES.FCM;
  },

  canUseNotification(session) {
    return Boolean(session?.permissions?.canEnablePushNotifications);
  },

  canManageNotificationMode(session) {
    return Boolean(session?.permissions?.canSetNotificationMode);
  },

  getNotificationModeLabel() {
    return MODE_LABELS[getNotificationMode()] ?? MODE_LABELS[NOTIFICATION_MODES.REALTIME];
  },

  getAvailableModes() {
    return Object.values(NOTIFICATION_MODES);
  },

  getCurrentMode() {
    return getNotificationMode();
  },

  setMode(mode) {
    return setNotificationMode(mode);
  },
};

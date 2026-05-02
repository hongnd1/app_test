export const NOTIFICATION_MODES = {
  OFF: "off",
  REALTIME: "realtime",
  FCM: "fcm",
};

const STORAGE_KEY = "notificationMode";
const VALID_MODES = new Set(Object.values(NOTIFICATION_MODES));

export function isValidNotificationMode(mode) {
  return VALID_MODES.has(String(mode ?? "").trim().toLowerCase());
}

function readSavedMode() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const savedMode = localStorage.getItem(STORAGE_KEY);
    return isValidNotificationMode(savedMode) ? savedMode : "";
  } catch {
    return "";
  }
}

export const notificationConfig = {
  mode: NOTIFICATION_MODES.REALTIME,
  enablePendingDatCard: true,
  enableBrowserNotificationInRealtimeMode: true,
  vapidKey: "",
};

const savedMode = readSavedMode();
if (savedMode) {
  notificationConfig.mode = savedMode;
}

export function getNotificationMode() {
  return notificationConfig.mode;
}

export function setNotificationMode(mode) {
  const normalized = String(mode ?? "").trim().toLowerCase();
  if (!isValidNotificationMode(normalized)) {
    return false;
  }

  notificationConfig.mode = normalized;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // Ignore localStorage write failures and keep the in-memory config.
    }
  }

  return true;
}

export function clearNotificationModeOverride() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage cleanup failures.
    }
  }

  notificationConfig.mode = NOTIFICATION_MODES.REALTIME;
}

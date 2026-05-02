const listeners = new Set();

function emitInApp(notification) {
  listeners.forEach((listener) => listener(notification));
}

async function showBrowserNotification(notification) {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  new Notification(notification.title, {
    body: notification.body,
    tag: notification.tag,
  });

  return true;
}

export const notificationService = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async notify(notification) {
    emitInApp(notification);
    await showBrowserNotification(notification);
  },

  isBrowserNotificationSupported() {
    return "Notification" in window;
  },

  getPermission() {
    return this.isBrowserNotificationSupported() ? Notification.permission : "unsupported";
  },

  async requestPermission() {
    if (!this.isBrowserNotificationSupported()) {
      return "unsupported";
    }

    return Notification.requestPermission();
  },
};

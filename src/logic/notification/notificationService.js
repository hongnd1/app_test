import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  onMessage,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { firebaseApp, firestore } from "../../data/config/firebase.js";

const VAPID_KEY = "VAPID_KEY_PLACEHOLDER";
const TOKEN_COLLECTION = "notificationTokens";
const listeners = new Set();
let messagingInstancePromise = null;
let foregroundUnsubscribe = null;
let currentTokenMeta = null;

function emitInApp(notification) {
  listeners.forEach((listener) => listener(notification));
}

function simpleHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function buildTokenDocId(uid, token) {
  return `${uid}_${simpleHash(token)}`;
}

function buildFriendlyNotification(payload) {
  const title =
    payload?.notification?.title ||
    payload?.data?.title ||
    "Thông báo mới";
  const body =
    payload?.notification?.body ||
    payload?.data?.body ||
    "Bạn có thông báo mới từ BLX Student Manager.";

  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    channel: "foreground-fcm",
    tag: payload?.data?.type || "fcm-foreground",
    payload,
    createdAt: new Date().toISOString(),
  };
}

async function resolveMessaging() {
  if (!messagingInstancePromise) {
    messagingInstancePromise = (async () => {
      const supported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        (await isMessagingSupported());

      if (!supported) {
        return null;
      }

      return getMessaging(firebaseApp);
    })();
  }

  return messagingInstancePromise;
}

async function upsertNotificationToken(session, token) {
  const tokenDocId = buildTokenDocId(session.uid, token);
  const tokenRef = doc(firestore, TOKEN_COLLECTION, tokenDocId);
  const now = serverTimestamp();

  await setDoc(
    tokenRef,
    {
      uid: session.uid,
      email: session.email || "",
      displayName: session.displayName || "",
      role: session.role || "",
      token,
      platform: "web",
      userAgent: navigator.userAgent,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  currentTokenMeta = { token, tokenDocId };
  return { token, tokenDocId };
}

async function findCurrentTokenDoc(session) {
  if (currentTokenMeta?.tokenDocId) {
    return currentTokenMeta;
  }

  const token = await this.getCurrentFcmToken();
  if (!token) {
    return null;
  }

  const tokenDocId = buildTokenDocId(session.uid, token);
  currentTokenMeta = { token, tokenDocId };
  return currentTokenMeta;
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

  async getMessagingSupportStatus() {
    if (typeof window === "undefined") {
      return false;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      return false;
    }

    return Boolean(await resolveMessaging());
  },

  isBrowserNotificationSupported() {
    return typeof window !== "undefined" && "Notification" in window;
  },

  getNotificationPermissionStatus() {
    if (!this.isBrowserNotificationSupported() || !("serviceWorker" in navigator)) {
      return "unsupported";
    }

    return Notification.permission;
  },

  async getCurrentFcmToken() {
    const messaging = await resolveMessaging();
    if (!messaging) {
      return null;
    }

    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    return getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  },

  async requestNotificationPermissionAndSaveToken(session) {
    if (!session?.uid) {
      return { success: false, message: "Bạn cần đăng nhập trước khi bật thông báo." };
    }

    const supported = await this.getMessagingSupportStatus();
    if (!supported) {
      return { success: false, message: "Trình duyệt này chưa hỗ trợ thông báo." };
    }

    if (!["admin", "staff"].includes(session.role)) {
      return { success: false, message: "Tài khoản này không được phép bật thông báo." };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        message: "Trình duyệt đang chặn thông báo. Vui lòng bật lại trong cài đặt trình duyệt.",
      };
    }

    try {
      const messaging = await resolveMessaging();
      if (!messaging) {
        return { success: false, message: "Trình duyệt này chưa hỗ trợ Firebase Messaging." };
      }

      const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        return { success: false, message: "Không thể lấy token thông báo cho thiết bị này." };
      }

      await upsertNotificationToken(session, token);
      return { success: true, message: "Đã bật thông báo trên thiết bị này." };
    } catch (error) {
      console.error("Không thể đăng ký FCM token.", error);
      return { success: false, message: "Không thể đăng ký thông báo cho thiết bị này." };
    }
  },

  async disableCurrentDeviceToken(session) {
    if (!session?.uid) {
      return { success: false };
    }

    try {
      const tokenMeta = await findCurrentTokenDoc.call(this, session);
      if (!tokenMeta) {
        return { success: true };
      }

      await updateDoc(doc(firestore, TOKEN_COLLECTION, tokenMeta.tokenDocId), {
        enabled: false,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Không thể vô hiệu token hiện tại.", error);
      return { success: false };
    }
  },

  listenForegroundMessages(callback) {
    if (foregroundUnsubscribe) {
      return foregroundUnsubscribe;
    }

    const attach = async () => {
      const messaging = await resolveMessaging();
      if (!messaging) {
        return () => {};
      }

      return onMessage(messaging, (payload) => {
        const notification = buildFriendlyNotification(payload);
        emitInApp(notification);
        callback(notification, payload);
      });
    };

    let detach = () => {};
    let active = true;

    attach().then((unsubscribe) => {
      if (active) {
        detach = unsubscribe;
      } else {
        unsubscribe();
      }
    });

    foregroundUnsubscribe = () => {
      active = false;
      detach();
      foregroundUnsubscribe = null;
    };

    return foregroundUnsubscribe;
  },

  async getExistingTokensForUser(uid) {
    const snapshot = await getDocs(
      query(collection(firestore, TOKEN_COLLECTION), where("uid", "==", uid)),
    );
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  },
};

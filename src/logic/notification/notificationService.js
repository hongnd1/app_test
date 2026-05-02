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
import { notificationConfig } from "../../data/config/notificationConfig.js";

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

function getVapidKey() {
  return String(notificationConfig.vapidKey ?? "").trim();
}

function buildFriendlyNotification(payload) {
  const title = payload?.notification?.title || payload?.data?.title || "Thong bao moi";
  const body =
    payload?.notification?.body ||
    payload?.data?.body ||
    "Ban co thong bao moi tu BLX Student Manager.";

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
  return currentTokenMeta;
}

async function findCurrentTokenDoc(session) {
  if (currentTokenMeta?.tokenDocId) {
    return currentTokenMeta;
  }

  const token = await notificationService.getCurrentFcmToken();
  if (!token) {
    return null;
  }

  const tokenDocId = buildTokenDocId(session.uid, token);
  currentTokenMeta = { token, tokenDocId };
  return currentTokenMeta;
}

async function showBrowserNotification(notification) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
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
    const vapidKey = getVapidKey();
    if (!vapidKey) {
      return null;
    }

    const messaging = await resolveMessaging();
    if (!messaging) {
      return null;
    }

    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    return getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
  },

  async requestNotificationPermissionAndSaveToken(session) {
    if (!session?.uid) {
      return { success: false, message: "Ban can dang nhap truoc khi bat thong bao." };
    }

    const supported = await this.getMessagingSupportStatus();
    if (!supported) {
      return { success: false, message: "Trinh duyet nay chua ho tro thong bao." };
    }

    if (!["host", "admin", "staff"].includes(session.role)) {
      return { success: false, message: "Tai khoan nay khong duoc phep bat thong bao." };
    }

    const vapidKey = getVapidKey();
    if (!vapidKey) {
      return { success: false, message: "Chua cau hinh VAPID key. Vui long cap nhat notificationConfig." };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        message: "Trinh duyet dang chan thong bao. Vui long bat lai trong cai dat trinh duyet.",
      };
    }

    try {
      const messaging = await resolveMessaging();
      if (!messaging) {
        return { success: false, message: "Trinh duyet nay chua ho tro Firebase Messaging." };
      }

      const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        return { success: false, message: "Khong the lay token thong bao cho thiet bi nay." };
      }

      await upsertNotificationToken(session, token);
      return { success: true, message: "Da bat push notification tren thiet bi nay." };
    } catch (error) {
      console.error("Khong the dang ky FCM token.", error);
      return { success: false, message: "Khong the dang ky thong bao cho thiet bi nay." };
    }
  },

  async disableCurrentDeviceToken(session) {
    if (!session?.uid) {
      return { success: false };
    }

    try {
      const tokenMeta = await findCurrentTokenDoc(session);
      if (!tokenMeta) {
        return { success: true };
      }

      await updateDoc(doc(firestore, TOKEN_COLLECTION, tokenMeta.tokenDocId), {
        enabled: false,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Khong the vo hieu token hien tai.", error);
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

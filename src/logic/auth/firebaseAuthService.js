import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, firestore } from "../../data/config/firebase.js";
import { authValidator } from "./authValidator.js";

const ROLE_LABELS = {
  host: "Chu he thong",
  admin: "Quan tri vien",
  staff: "Nhan su",
  viewer: "Chi xem",
};

const ROLE_PERMISSIONS = {
  host: {
    canCreateStudent: false,
    canEditStudent: false,
    canEditStudentDat: false,
    canDeleteStudent: false,
    canViewSensitiveStudentInfo: false,
    canCreateSchedule: false,
    canDeleteSchedule: false,
    canAssignMeetingLocation: false,
    canEnablePushNotifications: true,
    canSetNotificationMode: true,
  },
  admin: {
    canCreateStudent: true,
    canEditStudent: true,
    canEditStudentDat: true,
    canDeleteStudent: true,
    canViewSensitiveStudentInfo: true,
    canCreateSchedule: true,
    canDeleteSchedule: true,
    canAssignMeetingLocation: true,
    canEnablePushNotifications: true,
    canSetNotificationMode: false,
  },
  staff: {
    canCreateStudent: false,
    canEditStudent: false,
    canEditStudentDat: true,
    canDeleteStudent: false,
    canViewSensitiveStudentInfo: false,
    canCreateSchedule: true,
    canDeleteSchedule: false,
    canAssignMeetingLocation: false,
    canEnablePushNotifications: true,
    canSetNotificationMode: false,
  },
  viewer: {
    canCreateStudent: false,
    canEditStudent: false,
    canEditStudentDat: false,
    canDeleteStudent: false,
    canViewSensitiveStudentInfo: false,
    canCreateSchedule: false,
    canDeleteSchedule: false,
    canAssignMeetingLocation: false,
    canEnablePushNotifications: false,
    canSetNotificationMode: false,
  },
};

let persistenceReady = null;

function ensurePersistence() {
  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence);
  }

  return persistenceReady;
}

function normalizeRole(role) {
  const normalized = String(role ?? "").trim().toLowerCase();
  return ROLE_PERMISSIONS[normalized] ? normalized : "viewer";
}

function getPermissions(role) {
  return ROLE_PERMISSIONS[normalizeRole(role)];
}

function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] ?? ROLE_LABELS.viewer;
}

async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(firestore, "users", uid));
  if (!snapshot.exists()) {
    throw new Error(`Missing users/${uid} profile`);
  }

  return snapshot.data();
}

function buildSession(user, profile) {
  const role = normalizeRole(profile?.role);

  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: profile?.displayName?.trim() || user.displayName || user.email || "Nguoi dung",
    role,
    roleLabel: getRoleLabel(role),
    permissions: getPermissions(role),
  };
}

function toLoginMessage(error) {
  const messages = {
    "auth/invalid-email": "Email khong dung dinh dang.",
    "auth/missing-password": "Vui long nhap mat khau.",
    "auth/invalid-credential": "Email hoac mat khau khong chinh xac.",
    "auth/user-not-found": "Tai khoan khong ton tai.",
    "auth/wrong-password": "Email hoac mat khau khong chinh xac.",
    "auth/too-many-requests": "Dang nhap that bai qua nhieu lan. Vui long thu lai sau.",
    "auth/network-request-failed": "Khong the ket noi den Firebase. Kiem tra mang va cau hinh hosting.",
  };

  return messages[error?.code] ?? "Khong the dang nhap bang Firebase Authentication.";
}

export const firebaseAuthService = {
  async login(credentials) {
    const validation = authValidator.validateCredentials(credentials);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    try {
      await ensurePersistence();
      await signInWithEmailAndPassword(auth, credentials.email.trim(), credentials.password.trim());
      return { success: true };
    } catch (error) {
      return { success: false, message: toLoginMessage(error) };
    }
  },

  async logout() {
    await signOut(auth);
  },

  subscribe(onChange) {
    let active = true;

    ensurePersistence().catch((error) => {
      if (active) {
        onChange({ session: null, error });
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) {
        return;
      }

      if (!user) {
        onChange({ session: null, error: null });
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        onChange({ session: buildSession(user, profile), error: null });
      } catch (error) {
        onChange({ session: null, error });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  },
};

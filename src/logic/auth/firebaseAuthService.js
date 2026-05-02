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
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  staff: "Nhân sự",
  scheduler: "Điều phối lịch",
  viewer: "Chỉ xem",
};

const ROLE_PERMISSIONS = {
  admin: {
    canCreateStudent: true,
    canEditStudent: true,
    canDeleteStudent: true,
    canCreateSchedule: true,
    canDeleteSchedule: true,
  },
  editor: {
    canCreateStudent: true,
    canEditStudent: true,
    canDeleteStudent: false,
    canCreateSchedule: true,
    canDeleteSchedule: true,
  },
  staff: {
    canCreateStudent: true,
    canEditStudent: true,
    canDeleteStudent: false,
    canCreateSchedule: true,
    canDeleteSchedule: false,
  },
  scheduler: {
    canCreateStudent: false,
    canEditStudent: false,
    canDeleteStudent: false,
    canCreateSchedule: true,
    canDeleteSchedule: true,
  },
  viewer: {
    canCreateStudent: false,
    canEditStudent: false,
    canDeleteStudent: false,
    canCreateSchedule: false,
    canDeleteSchedule: false,
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
    displayName: profile?.displayName?.trim() || user.displayName || user.email || "Người dùng",
    role,
    roleLabel: getRoleLabel(role),
    permissions: getPermissions(role),
  };
}

function toLoginMessage(error) {
  const messages = {
    "auth/invalid-email": "Email không đúng định dạng.",
    "auth/missing-password": "Vui lòng nhập mật khẩu.",
    "auth/invalid-credential": "Email hoặc mật khẩu không chính xác.",
    "auth/user-not-found": "Tài khoản không tồn tại.",
    "auth/wrong-password": "Email hoặc mật khẩu không chính xác.",
    "auth/too-many-requests": "Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau.",
    "auth/network-request-failed": "Không thể kết nối đến Firebase. Kiểm tra mạng và cấu hình hosting.",
  };

  return messages[error?.code] ?? "Không thể đăng nhập bằng Firebase Authentication.";
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

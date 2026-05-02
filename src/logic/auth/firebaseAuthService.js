import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, firestore } from "../../data/config/firebase.js";
import { authValidator } from "./authValidator.js";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const ROLE_LABELS = {
  host: "Chủ hệ thống",
  admin: "Quản trị viên",
  staff: "Nhân sự",
  viewer: "Chỉ xem",
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
    const error = new Error(`Missing users/${uid} profile`);
    error.code = "profile/missing";
    throw error;
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

export function toAuthMessage(error) {
  const messages = {
    "auth/invalid-email": "Email không đúng định dạng.",
    "auth/missing-password": "Vui lòng nhập mật khẩu.",
    "auth/invalid-credential": "Email hoặc mật khẩu không chính xác.",
    "auth/user-not-found": "Tài khoản không tồn tại.",
    "auth/wrong-password": "Email hoặc mật khẩu không chính xác.",
    "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập Google.",
    "auth/cancelled-popup-request": "Yêu cầu đăng nhập Google đã bị hủy.",
    "auth/popup-blocked": "Trình duyệt đang chặn cửa sổ đăng nhập Google.",
    "auth/operation-not-allowed": "Firebase Authentication chưa bật đăng nhập Google cho project này.",
    "auth/unauthorized-domain":
      "Domain hiện tại chưa được cho phép trong Firebase Authentication. Hãy thêm domain hosting vào Authorized domains.",
    "auth/account-exists-with-different-credential":
      "Email này đã tồn tại với phương thức đăng nhập khác.",
    "auth/too-many-requests": "Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau.",
    "auth/network-request-failed": "Không thể kết nối đến Firebase. Kiểm tra mạng và cấu hình hosting.",
    "profile/missing":
      "Tài khoản của bạn chưa được cấp quyền đăng nhập. Vui lòng liên hệ thầy giáo hoặc admin để được cấp quyền truy cập.",
  };

  return messages[error?.code] ?? "Không thể đăng nhập bằng Firebase Authentication.";
}

async function verifyAuthorizedProfile(user) {
  try {
    await getUserProfile(user.uid);
    return { success: true };
  } catch (error) {
    try {
      await signOut(auth);
    } catch {
      // Ignore sign-out cleanup failures after profile validation errors.
    }

    return {
      success: false,
      message: toAuthMessage(error),
    };
  }
}

export const firebaseAuthService = {
  async login(credentials) {
    const validation = authValidator.validateCredentials(credentials);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    try {
      await ensurePersistence();
      const credential = await signInWithEmailAndPassword(
        auth,
        credentials.email.trim(),
        credentials.password.trim(),
      );
      return verifyAuthorizedProfile(credential.user);
    } catch (error) {
      return { success: false, message: toAuthMessage(error) };
    }
  },

  async loginWithGoogle() {
    try {
      await ensurePersistence();
      const credential = await signInWithPopup(auth, googleProvider);
      return verifyAuthorizedProfile(credential.user);
    } catch (error) {
      return { success: false, message: toAuthMessage(error) };
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

import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, firestore } from "../../data/config/firebase.js";
import { authValidator } from "./authValidator.js";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const ROLE_LABELS = {
  host: "Chủ hệ thống",
  teacher: "Giáo viên",
  student: "Học sinh",
  viewer: "Chỉ xem",
};

export const ROLE_PERMISSIONS = {
  host: {
    canViewStudents: true,
    canViewStudentsByTeacher: true,
    canCreateStudent: false,
    canEditStudent: false,
    canEditStudentDat: false,
    canDeleteStudent: false,
    canViewSensitiveStudentInfo: true,
    canCreateSchedule: false,
    canDeleteSchedule: false,
    canAssignMeetingLocation: false,
    canEnablePushNotifications: false,
    canSetNotificationMode: true,
    canApproveTeacher: true,
    canApproveStudent: false,
    canSubmitFeedback: false,
    canViewFeedbackReports: true,
    canViewStatistics: true,
  },
  teacher: {
    canViewStudents: true,
    canViewStudentsByTeacher: false,
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
    canApproveTeacher: false,
    canApproveStudent: true,
    canSubmitFeedback: true,
    canViewFeedbackReports: false,
    canViewStatistics: true,
  },
  student: {
    canViewStudents: true,
    canViewStudentsByTeacher: false,
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
    canApproveTeacher: false,
    canApproveStudent: false,
    canSubmitFeedback: true,
    canViewFeedbackReports: false,
    canViewStatistics: false,
  },
  viewer: {
    canViewStudents: false,
    canViewStudentsByTeacher: false,
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
    canApproveTeacher: false,
    canApproveStudent: false,
    canSubmitFeedback: false,
    canViewFeedbackReports: false,
    canViewStatistics: false,
  },
};

let persistenceReady = null;

function ensurePersistence() {
  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence);
  }

  return persistenceReady;
}

export function normalizeRole(role) {
  const normalized = String(role ?? "").trim().toLowerCase();
  const migratedRole = {
    admin: "teacher",
    staff: "student",
    view: "viewer",
    viewr: "viewer",
  }[normalized] || normalized;

  return ROLE_PERMISSIONS[migratedRole] ? migratedRole : "viewer";
}

function getEffectiveRole(profile) {
  const role = normalizeRole(profile?.role);
  if (role === "host") {
    return "host";
  }

  return profile?.status === "active" ? role : "viewer";
}

function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] ?? ROLE_LABELS.viewer;
}

function getPermissions(role) {
  return ROLE_PERMISSIONS[normalizeRole(role)] ?? ROLE_PERMISSIONS.viewer;
}

async function getDocumentOrNull(collectionName, id) {
  const snapshot = await getDoc(doc(firestore, collectionName, id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function getUserProfileOrNull(uid) {
  const snapshot = await getDoc(doc(firestore, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

function getFirebaseUserSummary(user) {
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName || user.email || "Người dùng",
  };
}

function buildSession(user, profile) {
  const role = normalizeRole(profile?.role);
  const effectiveRole = getEffectiveRole(profile);

  return {
    uid: user.uid,
    email: user.email ?? profile?.email ?? "",
    displayName: profile?.displayName?.trim() || user.displayName || user.email || "Người dùng",
    role,
    status: profile?.status ?? "deactive",
    approvalStatus: profile?.approvalStatus ?? "approved",
    effectiveRole,
    teacherUid: profile?.teacherUid ?? "",
    studentId: profile?.studentId ?? "",
    roleLabel: getRoleLabel(effectiveRole),
    permissions: getPermissions(effectiveRole),
  };
}

function resolveProfileApprovalState(profile) {
  const role = normalizeRole(profile?.role);
  if (profile?.approvalStatus === "rejected") {
    return {
      state: role === "teacher" ? "teacherRejected" : "studentRejected",
      application: profile,
    };
  }

  return {
    state: role === "teacher" ? "pendingTeacherApproval" : "pendingStudentApproval",
    application: profile,
  };
}

async function resolveAuthState(user) {
  if (!user) {
    return { state: "loggedOut", session: null, firebaseUser: null };
  }

  const firebaseUser = getFirebaseUserSummary(user);
  const profile = await getUserProfileOrNull(user.uid);

  if (profile) {
    if (profile.approvalStatus && profile.approvalStatus !== "approved") {
      return { ...resolveProfileApprovalState(profile), session: null, firebaseUser };
    }

    return {
      state: "ready",
      session: buildSession(user, profile),
      firebaseUser,
    };
  }

  const teacherApplication = await getDocumentOrNull("teacherApplications", user.uid);
  if (teacherApplication?.status === "pending") {
    return { state: "pendingTeacherApproval", session: null, application: teacherApplication, firebaseUser };
  }
  if (teacherApplication?.status === "rejected") {
    return { state: "teacherRejected", session: null, application: teacherApplication, firebaseUser };
  }

  const studentApplication = await getDocumentOrNull("studentApplications", user.uid);
  if (studentApplication?.status === "pending") {
    return { state: "pendingStudentApproval", session: null, application: studentApplication, firebaseUser };
  }
  if (studentApplication?.status === "rejected") {
    return { state: "studentRejected", session: null, application: studentApplication, firebaseUser };
  }

  return { state: "needOnboarding", session: null, firebaseUser };
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
    "permission-denied":
      "Không đọc/ghi được dữ liệu Firestore theo quyền hiện tại. Kiểm tra lại rules và profile users/{uid}.",
    "profile/missing": "Bạn cần hoàn tất đăng ký trước khi sử dụng app.",
  };

  if (messages[error?.code]) {
    return messages[error.code];
  }

  const detail = [error?.code, error?.message].filter(Boolean).join(" - ");
  return detail
    ? `Không thể đăng nhập bằng Firebase Authentication. Chi tiết: ${detail}`
    : "Không thể đăng nhập bằng Firebase Authentication.";
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
      return { success: true, authState: await resolveAuthState(credential.user) };
    } catch (error) {
      return { success: false, message: toAuthMessage(error) };
    }
  },

  async loginWithGoogle() {
    try {
      await ensurePersistence();
      const credential = await signInWithPopup(auth, googleProvider);
      return { success: true, authState: await resolveAuthState(credential.user) };
    } catch (error) {
      return { success: false, message: toAuthMessage(error) };
    }
  },

  async logout() {
    await signOut(auth);
  },

  async listApprovedTeachers() {
    const teacherQuery = query(
      collection(firestore, "users"),
      where("role", "==", "teacher"),
      where("status", "==", "active"),
      where("approvalStatus", "==", "approved"),
    );
    const snapshot = await getDocs(teacherQuery);
    return snapshot.docs.map((item) => ({ uid: item.id, ...item.data() }));
  },

  async submitTeacherApplication({ displayName, phone = "", note = "" }) {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, message: "Bạn cần đăng nhập trước khi gửi hồ sơ giáo viên." };
    }

    await setDoc(doc(firestore, "teacherApplications", user.uid), {
      uid: user.uid,
      email: user.email ?? "",
      displayName: String(displayName || user.displayName || user.email || "").trim(),
      phone: String(phone || "").trim(),
      note: String(note || "").trim(),
      status: "pending",
      createdAt: serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      rejectReason: null,
    });

    return { success: true };
  },

  async submitStudentApplication({ teacherUid, studentProfile }) {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, message: "Bạn cần đăng nhập trước khi gửi hồ sơ học sinh." };
    }

    await setDoc(doc(firestore, "studentApplications", user.uid), {
      uid: user.uid,
      email: user.email ?? "",
      displayName: studentProfile?.hoTen || user.displayName || user.email || "",
      teacherUid,
      studentProfile,
      status: "pending",
      createdAt: serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      rejectReason: null,
    });

    return { success: true };
  },

  async listPendingTeacherApplications() {
    const pendingQuery = query(collection(firestore, "teacherApplications"), where("status", "==", "pending"));
    const snapshot = await getDocs(pendingQuery);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  },

  async listPendingStudentApplications(session) {
    const pendingQuery = query(
      collection(firestore, "studentApplications"),
      where("teacherUid", "==", session.uid),
      where("status", "==", "pending"),
    );
    const snapshot = await getDocs(pendingQuery);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  },

  async approveTeacherApplication(application, session) {
    const now = serverTimestamp();
    await setDoc(doc(firestore, "users", application.uid), {
      uid: application.uid,
      email: application.email || "",
      displayName: application.displayName || application.email || "Giáo viên",
      role: "teacher",
      status: "active",
      approvalStatus: "approved",
      createdAt: now,
      updatedAt: now,
      approvedAt: now,
      approvedBy: session.uid,
    }, { merge: true });

    await updateDoc(doc(firestore, "teacherApplications", application.uid), {
      status: "approved",
      reviewedAt: now,
      reviewedBy: session.uid,
      rejectReason: null,
    });

    return { success: true };
  },

  async rejectTeacherApplication(application, session, rejectReason = "") {
    await updateDoc(doc(firestore, "teacherApplications", application.uid), {
      status: "rejected",
      reviewedAt: serverTimestamp(),
      reviewedBy: session.uid,
      rejectReason,
    });
    return { success: true };
  },

  async approveStudentApplication(application, session) {
    const now = serverTimestamp();
    const studentId = `HS${Date.now()}`;
    const profile = application.studentProfile || {};

    await setDoc(doc(firestore, "students", studentId), {
      id: studentId,
      ten: profile.hoTen || application.displayName || "Học sinh",
      sdt: profile.soDienThoai || "",
      tenZalo: profile.tenZalo || "",
      cccd: profile.cccd || "",
      loaiBang: profile.loaiBang || "B tự động",
      tongHocPhi: 0,
      daNop: 0,
      conThieu: 0,
      daHocLyThuyet: false,
      soKmDAT: 0,
      daHocSaHinh: false,
      teacherUid: session.uid,
      studentUserUid: application.uid,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(firestore, "users", application.uid), {
      uid: application.uid,
      email: application.email || "",
      displayName: profile.hoTen || application.displayName || application.email || "Học sinh",
      role: "student",
      status: "active",
      approvalStatus: "approved",
      teacherUid: session.uid,
      studentId,
      createdAt: now,
      updatedAt: now,
      approvedAt: now,
      approvedBy: session.uid,
    }, { merge: true });

    await updateDoc(doc(firestore, "studentApplications", application.uid), {
      status: "approved",
      reviewedAt: now,
      reviewedBy: session.uid,
      rejectReason: null,
    });

    return { success: true, studentId };
  },

  async rejectStudentApplication(application, session, rejectReason = "") {
    await updateDoc(doc(firestore, "studentApplications", application.uid), {
      status: "rejected",
      reviewedAt: serverTimestamp(),
      reviewedBy: session.uid,
      rejectReason,
    });
    return { success: true };
  },

  subscribe(onChange) {
    let active = true;

    ensurePersistence().catch((error) => {
      if (active) {
        onChange({ authState: { state: "error", session: null }, session: null, error });
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) {
        return;
      }

      try {
        const authState = await resolveAuthState(user);
        onChange({ authState, session: authState.session ?? null, error: null });
      } catch (error) {
        onChange({ authState: { state: "error", session: null }, session: null, error });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  },
};

import { notificationConfig } from "../data/config/notificationConfig.js";
import { firebaseAuthService, toAuthMessage } from "../logic/auth/firebaseAuthService.js";
import { filterService } from "../logic/filter/filterService.js";
import { searchService } from "../logic/filter/searchService.js";
import { notificationInboxService } from "../logic/notification/notificationInboxService.js";
import { notificationModeService } from "../logic/notification/notificationModeService.js";
import { realtimeDatNotificationService } from "../logic/notification/realtimeDatNotificationService.js";
import { progressService } from "../logic/progress/progressService.js";
import { scheduleReminderService } from "../logic/reminder/scheduleReminderService.js";
import { scheduleService } from "../logic/schedule/scheduleService.js";
import { studentService } from "../logic/student/studentService.js";
import { DashboardScreen } from "../ui/screens/DashboardScreen.js";
import { LoginScreen } from "../ui/screens/LoginScreen.js";

const appElement = document.getElementById("app");
const today = new Date();
const initialDate = today.toISOString().slice(0, 10);

const defaultPermissions = {
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
};

const state = {
  authState: "checking",
  firebaseUser: null,
  application: null,
  approvedTeachers: [],
  pendingTeacherApplications: [],
  pendingStudentApplications: [],
  session: null,
  students: [],
  schedules: [],
  notifications: [],
  unreadNotificationCount: 0,
  authReady: false,
  isLoadingData: false,
  loadError: "",
  loginMessage: "",
  popupNotification: null,
  toastMessage: null,
  notificationPermission: realtimeDatNotificationService.getNotificationPermissionStatus(),
  notificationMode: notificationModeService.getCurrentMode(),
  ui: {
    activeTab: "progress",
    scheduleListTab: "all",
    selectedScheduleDate: initialDate,
    scheduleMonth: today.getMonth(),
    scheduleYear: today.getFullYear(),
    searchTerm: "",
    theoryFilter: "all",
    saHinhFilter: "all",
    paymentFilter: "all",
    datFilter: "all",
    licenseFilter: "all",
    minPaidAmount: "",
    activeStatFilter: "all",
    showStudentFilters: false,
    editingStudentId: null,
    detailStudentId: null,
    formMode: null,
    scheduleFormOpen: false,
    scheduleStudentId: null,
    meetingScheduleId: null,
    showNotificationCenter: false,
    onboardingRole: null,
  },
};

let pendingSearchRefocus = false;
let currentLoadId = 0;
let stopReminderScheduler = null;
let stopRealtimeDatListener = null;
let stopForegroundMessages = null;
let fcmNotificationServicePromise = null;

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getPermissions() {
  return state.session?.permissions ?? defaultPermissions;
}

function hasPermission(permissionKey) {
  return Boolean(getPermissions()[permissionKey]);
}

function getNotificationButtonLabel() {
  if (notificationModeService.isRealtimeMode()) {
    return state.notificationPermission === "granted"
      ? "Đã bật thông báo trình duyệt"
      : "Bật thông báo trình duyệt";
  }

  if (notificationModeService.isFcmMode()) {
    return state.notificationPermission === "granted"
      ? "Đã bật push notification"
      : "Bật push notification";
  }

  return "Thông báo đang tắt";
}

function showToast(title, body) {
  state.toastMessage = { title, body };
  render();
}

function refreshNotificationState() {
  state.notificationMode = notificationModeService.getCurrentMode();
  state.notificationPermission = realtimeDatNotificationService.getNotificationPermissionStatus();
}

function refreshNotificationInbox() {
  if (!state.session?.uid) {
    state.notifications = [];
    state.unreadNotificationCount = 0;
    return;
  }

  state.notifications = notificationInboxService.getInbox(state.session.uid);
  state.unreadNotificationCount = notificationInboxService.getUnreadCount(state.session.uid);
}

function syncPendingNotificationInbox() {
  if (!state.session?.uid || !notificationModeService.canUseNotification(state.session)) {
    refreshNotificationInbox();
    return;
  }

  notificationInboxService.syncPendingSchedules(state.session.uid, state.schedules, getTodayString());
  refreshNotificationInbox();
}

function pushInboxNotification(notification, options = {}) {
  if (!state.session?.uid || !notificationModeService.canUseNotification(state.session)) {
    return;
  }

  const nextNotification = notificationInboxService.addNotification(state.session.uid, notification);
  refreshNotificationInbox();

  if (options.showToast !== false) {
    state.toastMessage = {
      title: nextNotification.title,
      body: nextNotification.body,
    };
  }

  if (options.showPopup) {
    state.popupNotification = nextNotification;
  }

  render();
}

function resetUiState() {
  state.ui = {
    ...state.ui,
    editingStudentId: null,
    detailStudentId: null,
    formMode: null,
    scheduleFormOpen: false,
    scheduleStudentId: null,
    meetingScheduleId: null,
    showNotificationCenter: false,
    onboardingRole: null,
  };
}

function clearDataState() {
  state.students = [];
  state.schedules = [];
  state.notifications = [];
  state.unreadNotificationCount = 0;
  state.pendingTeacherApplications = [];
  state.pendingStudentApplications = [];
  state.isLoadingData = false;
  state.loadError = "";
  state.popupNotification = null;
  state.toastMessage = null;
}

function stopReminderLoop() {
  if (stopReminderScheduler) {
    stopReminderScheduler();
    stopReminderScheduler = null;
  }
}

function stopRealtimeNotificationLoop() {
  if (stopRealtimeDatListener) {
    stopRealtimeDatListener();
    stopRealtimeDatListener = null;
  }
}

function stopForegroundMessageListener() {
  if (stopForegroundMessages) {
    stopForegroundMessages();
    stopForegroundMessages = null;
  }
}

function stopNotificationRuntime() {
  stopRealtimeNotificationLoop();
  stopForegroundMessageListener();
}

function showBrowserNotificationIfGranted(notification) {
  if (!realtimeDatNotificationService.isBrowserNotificationSupported()) {
    return false;
  }

  if (realtimeDatNotificationService.getNotificationPermissionStatus() !== "granted") {
    return false;
  }

  new Notification(notification.title, {
    body: notification.body,
    tag: notification.tag,
  });

  return true;
}

async function getFcmNotificationService() {
  if (!fcmNotificationServicePromise) {
    fcmNotificationServicePromise = import("../logic/notification/notificationService.js").then(
      (module) => module.notificationService,
    );
  }

  return fcmNotificationServicePromise;
}

function maybeTriggerScheduleReminder(now = new Date()) {
  if (!hasPermission("canAssignMeetingLocation")) {
    return;
  }

  const notification = scheduleReminderService.maybeCreateDueNotification(state.schedules, now);
  if (!notification) {
    return;
  }

  pushInboxNotification(notification, { showPopup: true, showToast: true });
  showBrowserNotificationIfGranted(notification);
}

function syncReminderScheduler() {
  stopReminderLoop();

  if (!state.session || !hasPermission("canAssignMeetingLocation")) {
    return;
  }

  stopReminderScheduler = scheduleReminderService.startScheduler((now) => {
    maybeTriggerScheduleReminder(now);
  });
}

async function syncNotificationRuntime() {
  stopNotificationRuntime();
  refreshNotificationState();

  if (!state.session || !notificationModeService.canUseNotification(state.session)) {
    return;
  }

  if (notificationModeService.isNotificationOff()) {
    return;
  }

  if (notificationModeService.isRealtimeMode()) {
    stopRealtimeDatListener = realtimeDatNotificationService.startListening(state.session, (notification) => {
      pushInboxNotification(notification, { showToast: true });
    });
    return;
  }

  if (notificationModeService.isFcmMode()) {
    const notificationService = await getFcmNotificationService();
    stopForegroundMessages = notificationService.listenForegroundMessages((notification) => {
      pushInboxNotification(notification, { showToast: true });
    });
  }
}

async function syncStudents() {
  state.students = await studentService.getAllStudents(state.session);
}

async function syncSchedules() {
  state.schedules = await scheduleService.getAllSchedules(state.session);
  syncPendingNotificationInbox();
}

async function loadDashboardData() {
  if (!state.session) {
    clearDataState();
    return;
  }

  const loadId = ++currentLoadId;
  state.isLoadingData = true;
  state.loadError = "";
  render();

  try {
    const [students, schedules] = await Promise.all([
      studentService.getAllStudents(state.session),
      scheduleService.getAllSchedules(state.session),
    ]);

    if (loadId !== currentLoadId) {
      return;
    }

    state.students = students;
    state.schedules = schedules;
    state.pendingTeacherApplications = hasPermission("canApproveTeacher")
      ? await firebaseAuthService.listPendingTeacherApplications()
      : [];
    state.pendingStudentApplications = hasPermission("canApproveStudent")
      ? await firebaseAuthService.listPendingStudentApplications(state.session)
      : [];
    syncPendingNotificationInbox();
  } catch (error) {
    if (loadId !== currentLoadId) {
      return;
    }

    console.error("Không thể tải dữ liệu Firebase.", error);
    state.loadError = "Không thể tải dữ liệu từ Firebase. Kiểm tra Firestore rules và dữ liệu users/{uid}.";
  } finally {
    if (loadId === currentLoadId) {
      state.isLoadingData = false;
      render();
    }
  }
}

function updateUi(patch, options = {}) {
  state.ui = { ...state.ui, ...patch };
  pendingSearchRefocus = Boolean(options.preserveSearchFocus);
  render();
}

function refocusSearchIfNeeded() {
  if (!pendingSearchRefocus) {
    return;
  }

  pendingSearchRefocus = false;
  requestAnimationFrame(() => {
    const input = document.querySelector('input[name="searchTerm"]');
    if (!input) {
      return;
    }

    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  });
}

function openCreateForm() {
  if (!hasPermission("canCreateStudent")) {
    return;
  }

  updateUi({ editingStudentId: null, formMode: "create", activeTab: "students", showStudentFilters: false });
}

function openEditForm(studentId) {
  if (!(hasPermission("canEditStudent") || hasPermission("canEditStudentDat"))) {
    return;
  }

  updateUi({ editingStudentId: studentId, formMode: "edit", activeTab: "students", showStudentFilters: false });
}

function closeForm() {
  updateUi({ editingStudentId: null, formMode: null, scheduleStudentId: null, scheduleFormOpen: false });
}

function openDetail(studentId) {
  updateUi({ detailStudentId: studentId, activeTab: "students" });
}

function closeDetail() {
  updateUi({ detailStudentId: null });
}

function openScheduleForm(studentId, date = state.ui.selectedScheduleDate) {
  if (!hasPermission("canCreateSchedule")) {
    return;
  }

  updateUi({
    scheduleStudentId: studentId,
    selectedScheduleDate: date,
    scheduleFormOpen: true,
    meetingScheduleId: null,
    activeTab: "schedule",
  });
}

function openScheduleDayForm(date = state.ui.selectedScheduleDate) {
  if (!hasPermission("canCreateSchedule")) {
    return;
  }

  updateUi({
    scheduleStudentId: null,
    selectedScheduleDate: date,
    scheduleFormOpen: true,
    meetingScheduleId: null,
    activeTab: "schedule",
  });
}

function closeScheduleForm() {
  updateUi({ scheduleStudentId: null, scheduleFormOpen: false });
}

function openMeetingLocationForm(scheduleId) {
  if (!hasPermission("canAssignMeetingLocation")) {
    return;
  }

  notificationInboxService.markAllAsRead(state.session?.uid);
  refreshNotificationInbox();
  updateUi({
    meetingScheduleId: scheduleId,
    scheduleFormOpen: false,
    activeTab: "schedule",
    showNotificationCenter: false,
  });
}

function closeMeetingLocationForm() {
  updateUi({ meetingScheduleId: null });
}

async function handleLogin(credentials) {
  state.loginMessage = "";
  const result = await firebaseAuthService.login(credentials);
  if (!result.success) {
    state.loginMessage = result.message;
  }
  return result;
}

async function handleGoogleLogin() {
  state.loginMessage = "";
  const result = await firebaseAuthService.loginWithGoogle();
  if (!result.success) {
    state.loginMessage = result.message;
  }
  return result;
}

async function chooseOnboardingRole(role) {
  state.ui.onboardingRole = role;
  state.loginMessage = "";

  if (role === "student") {
    try {
      state.approvedTeachers = await firebaseAuthService.listApprovedTeachers();
    } catch (error) {
      console.error("Không thể tải danh sách giáo viên.", error);
      state.loginMessage = "Không thể tải danh sách giáo viên đang hoạt động.";
    }
  }

  render();
}

async function handleSubmitTeacherApplication(formData) {
  try {
    const result = await firebaseAuthService.submitTeacherApplication({
      displayName: formData.get("displayName"),
      phone: formData.get("phone"),
      note: formData.get("note"),
    });

    if (!result.success) {
      state.loginMessage = result.message;
      render();
      return;
    }

    state.authState = "pendingTeacherApproval";
    state.application = { status: "pending" };
    state.loginMessage = "";
    render();
  } catch (error) {
    console.error("Không thể gửi hồ sơ giáo viên.", error);
    state.loginMessage = toAuthMessage(error);
    render();
  }
}

async function handleSubmitStudentApplication(formData) {
  try {
    const studentProfile = {
      hoTen: String(formData.get("hoTen") || "").trim(),
      loaiBang: String(formData.get("loaiBang") || "").trim(),
      soDienThoai: String(formData.get("soDienThoai") || "").trim(),
      tenZalo: String(formData.get("tenZalo") || "").trim(),
      cccd: String(formData.get("cccd") || "").trim(),
      ghiChu: String(formData.get("ghiChu") || "").trim(),
    };
    const result = await firebaseAuthService.submitStudentApplication({
      teacherUid: formData.get("teacherUid"),
      studentProfile,
    });

    if (!result.success) {
      state.loginMessage = result.message;
      render();
      return;
    }

    state.authState = "pendingStudentApproval";
    state.application = { status: "pending" };
    state.loginMessage = "";
    render();
  } catch (error) {
    console.error("Không thể gửi hồ sơ học sinh.", error);
    state.loginMessage = toAuthMessage(error);
    render();
  }
}

async function refreshApprovalApplications() {
  state.pendingTeacherApplications = hasPermission("canApproveTeacher")
    ? await firebaseAuthService.listPendingTeacherApplications()
    : [];
  state.pendingStudentApplications = hasPermission("canApproveStudent")
    ? await firebaseAuthService.listPendingStudentApplications(state.session)
    : [];
}

async function handleApproveTeacher(uid) {
  const application = state.pendingTeacherApplications.find((item) => item.uid === uid);
  if (!application) return;

  await firebaseAuthService.approveTeacherApplication(application, state.session);
  await refreshApprovalApplications();
  render();
}

async function handleRejectTeacher(uid) {
  const application = state.pendingTeacherApplications.find((item) => item.uid === uid);
  if (!application) return;

  const rejectReason = window.prompt("Lý do từ chối giáo viên?", "") || "";
  await firebaseAuthService.rejectTeacherApplication(application, state.session, rejectReason);
  await refreshApprovalApplications();
  render();
}

async function handleApproveStudent(uid) {
  const application = state.pendingStudentApplications.find((item) => item.uid === uid);
  if (!application) return;

  await firebaseAuthService.approveStudentApplication(application, state.session);
  await Promise.all([syncStudents(), refreshApprovalApplications()]);
  render();
}

async function handleRejectStudent(uid) {
  const application = state.pendingStudentApplications.find((item) => item.uid === uid);
  if (!application) return;

  const rejectReason = window.prompt("Lý do từ chối học sinh?", "") || "";
  await firebaseAuthService.rejectStudentApplication(application, state.session, rejectReason);
  await refreshApprovalApplications();
  render();
}

async function handleLogout() {
  try {
    state.loginMessage = "";
    if (notificationModeService.isFcmMode()) {
      const notificationService = await getFcmNotificationService();
      await notificationService.disableCurrentDeviceToken(state.session);
    }

    await firebaseAuthService.logout();
  } catch (error) {
    console.error("Không thể đăng xuất.", error);
  }
}

function handleOpenScheduleTab() {
  updateUi({ activeTab: "schedule", showNotificationCenter: false });
}

async function handleRequestNotificationPermission() {
  if (!state.session || !notificationModeService.canUseNotification(state.session)) {
    return;
  }

  if (notificationModeService.isNotificationOff()) {
    showToast("Thông báo", "Chế độ thông báo hiện đang tắt.");
    return;
  }

  let result = { success: false, message: "Không thể bật thông báo lúc này." };

  try {
    if (notificationModeService.isRealtimeMode()) {
      result = await realtimeDatNotificationService.requestBrowserNotificationPermission();
    } else if (notificationModeService.isFcmMode()) {
      const notificationService = await getFcmNotificationService();
      result = await notificationService.requestNotificationPermissionAndSaveToken(state.session);
    }
  } catch (error) {
    console.error("Không thể bật thông báo.", error);
    result = { success: false, message: "Không thể bật thông báo trên thiết bị này." };
  }

  refreshNotificationState();
  showToast(result.success ? "Thông báo" : "Không thể bật thông báo", result.message);
}

async function handleChangeNotificationMode(mode) {
  if (!hasPermission("canSetNotificationMode")) {
    return;
  }

  const changed = notificationModeService.setMode(mode);
  if (!changed) {
    return;
  }

  refreshNotificationState();
  await syncNotificationRuntime();
  render();
}

function handleToggleNotificationCenter() {
  updateUi({ showNotificationCenter: !state.ui.showNotificationCenter });
}

function handleMarkAllNotificationsRead() {
  notificationInboxService.markAllAsRead(state.session?.uid);
  refreshNotificationInbox();
  render();
}

function handleOpenNotification(notificationId, scheduleId) {
  notificationInboxService.markAsRead(state.session?.uid, notificationId);
  refreshNotificationInbox();

  if (scheduleId) {
    updateUi({
      activeTab: "schedule",
      showNotificationCenter: false,
    });
    return;
  }

  render();
}

async function handleSaveStudent(formData) {
  const isEditing = state.ui.formMode === "edit" && state.ui.editingStudentId;

  if (isEditing && !(hasPermission("canEditStudent") || hasPermission("canEditStudentDat"))) {
    return { success: false, message: "Bạn không có quyền cập nhật học viên." };
  }

  if (!isEditing && !hasPermission("canCreateStudent")) {
    return { success: false, message: "Bạn không có quyền tạo học viên." };
  }

  try {
    const payload =
      isEditing && hasPermission("canEditStudentDat") && !hasPermission("canEditStudent")
        ? { soKmDAT: Number(formData.soKmDAT) }
        : formData;

    const result = isEditing
      ? hasPermission("canEditStudent")
        ? await studentService.updateStudent(state.ui.editingStudentId, payload, state.session)
        : await studentService.updateStudentDat(state.ui.editingStudentId, payload.soKmDAT, state.session)
      : await studentService.createStudent(payload, state.session);

    if (result.success) {
      await syncStudents();
      updateUi({
        editingStudentId: null,
        formMode: null,
        detailStudentId: result.student.id,
        activeTab: "students",
      });
    }

    return result;
  } catch (error) {
    console.error("Không thể lưu học viên.", error);
    return { success: false, message: "Không thể lưu học viên lên Firebase." };
  }
}

async function handleDeleteStudent(studentId) {
  if (!hasPermission("canDeleteStudent")) {
    window.alert("Bạn không có quyền xóa học viên.");
    return;
  }

  const confirmed = window.confirm("Xóa học viên này khỏi danh sách?");
  if (!confirmed) {
    return;
  }

  try {
    await studentService.deleteStudent(studentId);
    await syncStudents();
    updateUi({
      editingStudentId: state.ui.editingStudentId === studentId ? null : state.ui.editingStudentId,
      detailStudentId: state.ui.detailStudentId === studentId ? null : state.ui.detailStudentId,
      scheduleStudentId: state.ui.scheduleStudentId === studentId ? null : state.ui.scheduleStudentId,
      scheduleFormOpen:
        state.ui.scheduleStudentId === studentId && state.ui.scheduleFormOpen
          ? false
          : state.ui.scheduleFormOpen,
      formMode:
        state.ui.editingStudentId === studentId && state.ui.formMode === "edit"
          ? null
          : state.ui.formMode,
    });
  } catch (error) {
    console.error("Không thể xóa học viên.", error);
    window.alert("Không thể xóa học viên khỏi Firebase.");
  }
}

async function handleDeleteSchedule(scheduleId) {
  if (!hasPermission("canDeleteSchedule")) {
    window.alert("Bạn không có quyền xóa lịch học.");
    return;
  }

  try {
    await scheduleService.deleteSchedule(scheduleId);
    await syncSchedules();
    render();
  } catch (error) {
    console.error("Không thể xóa lịch học.", error);
    window.alert("Không thể xóa lịch học khỏi Firebase.");
  }
}

function getFilteredStudents() {
  const searched = searchService.searchStudents(state.students, state.ui.searchTerm);

  return filterService.filterStudents(searched, {
    theory: state.ui.theoryFilter,
    saHinh: state.ui.saHinhFilter,
    payment: state.ui.paymentFilter,
    dat: state.ui.datFilter,
    licenseFilter: state.ui.licenseFilter,
    minPaidAmount: state.ui.minPaidAmount,
  });
}

function handleStatFilter(statKey) {
  const nextKey = state.ui.activeStatFilter === statKey ? "all" : statKey;
  const nextFilters = {
    theoryFilter: "all",
    saHinhFilter: "all",
    paymentFilter: "all",
    datFilter: "all",
    licenseFilter: "all",
    minPaidAmount: "",
    activeStatFilter: nextKey,
    activeTab: "students",
  };

  if (nextKey === "theoryCompleted") {
    nextFilters.theoryFilter = "done";
  }

  if (nextKey === "unpaid") {
    nextFilters.paymentFilter = "debt";
  }

  if (nextKey === "saHinhCompleted") {
    nextFilters.saHinhFilter = "done";
  }

  if (nextKey === "datReached") {
    nextFilters.datFilter = "reached";
  }

  if (nextKey === "paidCompleted") {
    nextFilters.paymentFilter = "paid";
  }

  updateUi(nextFilters);
}

function handleOpenStudentTab() {
  updateUi({
    activeTab: "students",
    activeStatFilter: "all",
    showStudentFilters: false,
    theoryFilter: "all",
    saHinhFilter: "all",
    paymentFilter: "all",
    datFilter: "all",
    licenseFilter: "all",
    minPaidAmount: "",
  });
}

async function handleSaveSchedule(payload) {
  if (!hasPermission("canCreateSchedule")) {
    return { success: false, message: "Bạn không có quyền tạo lịch học." };
  }

  try {
    const student = state.students.find((item) => item.id === payload.studentId);
    const result = await scheduleService.createSchedule(payload, student, state.session);

    if (result.success) {
      await syncSchedules();
      updateUi({
        scheduleStudentId: null,
        scheduleFormOpen: false,
        scheduleListTab: "all",
        selectedScheduleDate: payload.date,
        activeTab: "schedule",
      });
    }

    return result;
  } catch (error) {
    console.error("Không thể lưu lịch học.", error);
    return { success: false, message: "Không thể lưu lịch học lên Firebase." };
  }
}

async function handleSaveMeetingLocation(payload) {
  if (!hasPermission("canAssignMeetingLocation")) {
    return { success: false, message: "Bạn không có quyền cập nhật địa điểm hẹn." };
  }

  try {
    const result = await scheduleService.updateMeetingLocation(state.ui.meetingScheduleId, payload, state.session);

    if (result.success) {
      await syncSchedules();
      updateUi({
        meetingScheduleId: null,
        activeTab: "schedule",
      });
    }

    return result;
  } catch (error) {
    console.error("Không thể cập nhật địa điểm hẹn.", error);
    return { success: false, message: "Không thể lưu địa điểm hẹn lên Firebase." };
  }
}

function getActiveFilterLabel(activeStatFilter) {
  const labels = {
    all: "Toàn bộ học viên",
    theoryCompleted: "Học viên đã học lý thuyết",
    unpaid: "Học viên còn thiếu học phí",
    saHinhCompleted: "Học viên đã học sa hình",
    datReached: "Học viên đã đạt DAT",
    paidCompleted: "Học viên đã hoàn tất học phí",
  };

  return labels[activeStatFilter] ?? "Toàn bộ học viên";
}

function renderLoadingState(title, message) {
  appElement.innerHTML = `
    <main class="login-screen">
      <section class="login-panel">
        <div class="panel">
          <p class="eyebrow">Firebase</p>
          <h2>${title}</h2>
          <p class="hero-copy">${message}</p>
        </div>
      </section>
    </main>
  `;
}

function renderErrorState() {
  appElement.innerHTML = `
    <main class="login-screen">
      <section class="login-panel">
        <div class="panel">
          <p class="eyebrow">Firebase</p>
          <h2>Không tải được dữ liệu</h2>
          <p class="form-message">${state.loadError}</p>
        </div>
      </section>
    </main>
  `;
}

function renderPendingState(kind) {
  const title =
    kind === "teacher"
      ? "Tài khoản giáo viên đang chờ duyệt"
      : "Thông tin học sinh đang chờ xác nhận";
  const message =
    kind === "teacher"
      ? "Host sẽ phê duyệt tài khoản giáo viên trước khi bạn vào dashboard."
      : "Giáo viên phụ trách sẽ xác nhận hồ sơ trước khi bạn sử dụng app.";

  appElement.innerHTML = `
    <main class="login-screen">
      <section class="login-panel">
        <div class="panel">
          <p class="eyebrow">Chờ duyệt</p>
          <h2>${title}</h2>
          <p class="hero-copy">${message}</p>
          <div class="form-actions">
            <button type="button" class="secondary-button" data-action="logout">Đăng xuất</button>
          </div>
        </div>
      </section>
    </main>
  `;
  appElement.querySelector('[data-action="logout"]').addEventListener("click", handleLogout);
}

function renderRejectedState(kind) {
  const rejectReason = state.application?.rejectReason ? `<p class="form-message">${state.application.rejectReason}</p>` : "";
  appElement.innerHTML = `
    <main class="login-screen">
      <section class="login-panel">
        <div class="panel">
          <p class="eyebrow">Bị từ chối</p>
          <h2>${kind === "teacher" ? "Hồ sơ giáo viên bị từ chối" : "Hồ sơ học sinh bị từ chối"}</h2>
          <p class="hero-copy">Vui lòng liên hệ người phụ trách để biết thêm chi tiết.</p>
          ${rejectReason}
          <div class="form-actions">
            <button type="button" class="secondary-button" data-action="logout">Đăng xuất</button>
          </div>
        </div>
      </section>
    </main>
  `;
  appElement.querySelector('[data-action="logout"]').addEventListener("click", handleLogout);
}

function renderOnboardingState() {
  const userName = state.firebaseUser?.displayName || state.firebaseUser?.email || "người dùng";
  const teacherOptions = state.approvedTeachers
    .map((teacher) => `<option value="${teacher.uid}">${teacher.displayName || teacher.email || teacher.uid}</option>`)
    .join("");

  const roleBody = !state.ui.onboardingRole
    ? `
      <div class="form-actions">
        <button type="button" class="primary-button" data-role="student">Tôi là học sinh</button>
        <button type="button" class="secondary-button" data-role="teacher">Tôi là giáo viên</button>
      </div>
    `
    : state.ui.onboardingRole === "teacher"
      ? `
        <form class="student-form" data-form="teacher">
          <label class="field">
            <span>Tên hiển thị</span>
            <input name="displayName" value="${userName}" required />
          </label>
          <label class="field">
            <span>Số điện thoại</span>
            <input name="phone" />
          </label>
          <label class="field">
            <span>Ghi chú</span>
            <textarea name="note" rows="3"></textarea>
          </label>
          <div class="form-actions">
            <button type="button" class="secondary-button" data-action="back">Quay lại</button>
            <button type="submit" class="primary-button">Gửi chờ host duyệt</button>
          </div>
        </form>
      `
      : `
        <form class="student-form" data-form="student">
          <label class="field">
            <span>Giáo viên phụ trách</span>
            <select name="teacherUid" required>
              <option value="">Chọn giáo viên</option>
              ${teacherOptions}
            </select>
          </label>
          <label class="field">
            <span>Họ tên</span>
            <input name="hoTen" value="${userName}" required />
          </label>
          <label class="field">
            <span>Loại bằng</span>
            <input name="loaiBang" value="B tự động" required />
          </label>
          <label class="field">
            <span>Số điện thoại</span>
            <input name="soDienThoai" />
          </label>
          <label class="field">
            <span>Tên Zalo</span>
            <input name="tenZalo" />
          </label>
          <label class="field">
            <span>CCCD</span>
            <input name="cccd" />
          </label>
          <label class="field">
            <span>Ghi chú</span>
            <textarea name="ghiChu" rows="3"></textarea>
          </label>
          <div class="form-actions">
            <button type="button" class="secondary-button" data-action="back">Quay lại</button>
            <button type="submit" class="primary-button">Gửi chờ giáo viên duyệt</button>
          </div>
        </form>
      `;

  appElement.innerHTML = `
    <main class="login-screen">
      <section class="login-panel">
        <div class="panel">
          <p class="eyebrow">Hoàn tất đăng ký</p>
          <h2>Chọn loại tài khoản</h2>
          <p class="hero-copy">Bạn đã đăng nhập Firebase. Hãy gửi hồ sơ để được cấp quyền sử dụng app.</p>
          ${state.loginMessage ? `<p class="form-message">${state.loginMessage}</p>` : ""}
          ${roleBody}
          <div class="form-actions">
            <button type="button" class="secondary-button" data-action="logout">Đăng xuất</button>
          </div>
        </div>
      </section>
    </main>
  `;

  appElement.querySelector('[data-action="logout"]').addEventListener("click", handleLogout);
  appElement.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => chooseOnboardingRole(button.dataset.role));
  });

  const backButton = appElement.querySelector('[data-action="back"]');
  if (backButton) {
    backButton.addEventListener("click", () => {
      state.ui.onboardingRole = null;
      state.loginMessage = "";
      render();
    });
  }

  const teacherForm = appElement.querySelector('[data-form="teacher"]');
  if (teacherForm) {
    teacherForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleSubmitTeacherApplication(new FormData(teacherForm));
    });
  }

  const studentForm = appElement.querySelector('[data-form="student"]');
  if (studentForm) {
    studentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleSubmitStudentApplication(new FormData(studentForm));
    });
  }
}

function render() {
  if (!state.authReady) {
    renderLoadingState("Đang kiểm tra phiên đăng nhập...", "Ứng dụng đang đồng bộ trạng thái Firebase Authentication.");
    return;
  }

  if (state.authState === "needOnboarding") {
    renderOnboardingState();
    return;
  }

  if (state.authState === "pendingTeacherApproval") {
    renderPendingState("teacher");
    return;
  }

  if (state.authState === "pendingStudentApproval") {
    renderPendingState("student");
    return;
  }

  if (state.authState === "teacherRejected") {
    renderRejectedState("teacher");
    return;
  }

  if (state.authState === "studentRejected") {
    renderRejectedState("student");
    return;
  }

  if (!state.session) {
    appElement.innerHTML = "";
    LoginScreen(appElement, {
      onLogin: handleLogin,
      onLoginWithGoogle: handleGoogleLogin,
      message: state.loginMessage,
    });
    return;
  }

  if (state.isLoadingData) {
    renderLoadingState("Đang tải dữ liệu...", "Ứng dụng đang đồng bộ danh sách học viên và lịch học từ Firestore.");
    return;
  }

  if (state.loadError) {
    renderErrorState();
    return;
  }

  const filteredStudents = getFilteredStudents();
  const editingStudent =
    state.ui.formMode === "edit" && state.ui.editingStudentId
      ? state.students.find((student) => student.id === state.ui.editingStudentId) ?? null
      : null;
  const detailStudent = state.ui.detailStudentId
    ? state.students.find((student) => student.id === state.ui.detailStudentId) ?? null
    : null;
  const scheduleStudent = state.ui.scheduleStudentId
    ? state.students.find((student) => student.id === state.ui.scheduleStudentId) ?? null
    : null;
  const meetingSchedule = state.ui.meetingScheduleId
    ? scheduleService.getScheduleById(state.schedules, state.ui.meetingScheduleId)
    : null;
  const scheduleCandidates = state.students.filter((student) => student.daHocLyThuyet);
  const statistics = progressService.getDashboardStatistics(state.students);
  const progressOverview = progressService.getProgressOverview(state.students);
  const reminderSummary = scheduleReminderService.getReminderSummary(state.schedules, getTodayString());
  const scheduleBuckets = scheduleService.getScheduleBuckets(state.schedules, {
    month: state.ui.scheduleMonth,
    year: state.ui.scheduleYear,
    selectedDate: state.ui.selectedScheduleDate,
  });

  appElement.innerHTML = "";
  DashboardScreen(appElement, {
    session: state.session,
    permissions: getPermissions(),
    students: filteredStudents,
    totalStudents: state.students.length,
    statistics,
    progressOverview,
    reminderSummary,
    notifications: state.notifications,
    unreadNotificationCount: state.unreadNotificationCount,
    activeFilterLabel: getActiveFilterLabel(state.ui.activeStatFilter),
    filters: state.ui,
    scheduleBuckets,
    editingStudent,
    detailStudent,
    scheduleStudent,
    meetingSchedule,
    scheduleCandidates,
    notificationMode: state.notificationMode,
    notificationModeLabel: notificationModeService.getNotificationModeLabel(),
    notificationModeOptions: notificationModeService.getAvailableModes(),
    supportsBrowserNotifications: realtimeDatNotificationService.isBrowserNotificationSupported(),
    notificationPermission: state.notificationPermission,
    notificationButtonLabel: getNotificationButtonLabel(),
    pendingTeacherApplications: state.pendingTeacherApplications,
    pendingStudentApplications: state.pendingStudentApplications,
    onApproveTeacherApplication: handleApproveTeacher,
    onRejectTeacherApplication: handleRejectTeacher,
    onApproveStudentApplication: handleApproveStudent,
    onRejectStudentApplication: handleRejectStudent,
    showNotificationButton:
      !notificationModeService.isNotificationOff() &&
      notificationModeService.canUseNotification(state.session),
    showNotificationModeSelector: hasPermission("canSetNotificationMode"),
    onChangeNotificationMode: handleChangeNotificationMode,
    onRequestNotificationPermission: handleRequestNotificationPermission,
    onLogout: handleLogout,
    onToggleNotificationCenter: handleToggleNotificationCenter,
    onMarkAllNotificationsRead: handleMarkAllNotificationsRead,
    onOpenNotification: handleOpenNotification,
    onChangeTab: (activeTab) => updateUi({ activeTab, showNotificationCenter: false }),
    onChangeScheduleListTab: (scheduleListTab) => updateUi({ scheduleListTab }),
    onChangeCalendarMonth: (patch) => updateUi(patch),
    onSelectScheduleDate: (selectedScheduleDate) => updateUi({ selectedScheduleDate, scheduleListTab: "all" }),
    onFilterChange: updateUi,
    onOpenCreateForm: openCreateForm,
    onOpenEditForm: openEditForm,
    onCloseForm: closeForm,
    onSaveStudent: handleSaveStudent,
    onDeleteStudent: handleDeleteStudent,
    onOpenDetail: openDetail,
    onCloseDetail: closeDetail,
    onStatFilter: handleStatFilter,
    onToggleStudentFilters: () => updateUi({ showStudentFilters: !state.ui.showStudentFilters }),
    onOpenStudentTab: handleOpenStudentTab,
    onOpenScheduleTab: handleOpenScheduleTab,
    onOpenScheduleForm: openScheduleForm,
    onOpenScheduleDayForm: openScheduleDayForm,
    onCloseScheduleForm: closeScheduleForm,
    onSaveSchedule: handleSaveSchedule,
    onDeleteSchedule: handleDeleteSchedule,
    onOpenMeetingLocationForm: openMeetingLocationForm,
    onCloseMeetingLocationForm: closeMeetingLocationForm,
    onSaveMeetingLocation: handleSaveMeetingLocation,
    popupNotification: state.popupNotification,
    onDismissPopupNotification: () => {
      state.popupNotification = null;
      render();
    },
    toastMessage: state.toastMessage,
    onDismissToastMessage: () => {
      state.toastMessage = null;
      render();
    },
  });

  refocusSearchIfNeeded();
}

firebaseAuthService.subscribe(async ({ authState, session, error }) => {
  currentLoadId += 1;
  stopReminderLoop();
  stopNotificationRuntime();

  if (error) {
    console.error("Không thể đồng bộ Firebase Authentication.", error);
    state.session = null;
    state.authState = "error";
    state.authReady = true;
    state.loginMessage = toAuthMessage(error);
    clearDataState();
    resetUiState();
    refreshNotificationState();
    render();
    return;
  }

  state.authState = authState?.state ?? "loggedOut";
  state.firebaseUser = authState?.firebaseUser ?? null;
  state.application = authState?.application ?? null;
  state.session = session;
  state.authReady = true;
  refreshNotificationState();
  resetUiState();

  if (!session) {
    clearDataState();
    render();
    return;
  }

  state.loginMessage = "";
  await loadDashboardData();
  syncReminderScheduler();
  maybeTriggerScheduleReminder(new Date());
  await syncNotificationRuntime();
  render();
});

render();

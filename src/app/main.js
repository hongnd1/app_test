import { firebaseAuthService } from "../logic/auth/firebaseAuthService.js";
import { filterService } from "../logic/filter/filterService.js";
import { searchService } from "../logic/filter/searchService.js";
import { notificationService } from "../logic/notification/notificationService.js";
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
  canCreateStudent: false,
  canEditStudent: false,
  canEditStudentDat: false,
  canDeleteStudent: false,
  canViewSensitiveStudentInfo: false,
  canCreateSchedule: false,
  canDeleteSchedule: false,
  canAssignMeetingLocation: false,
  canEnablePushNotifications: false,
};

const state = {
  session: null,
  students: [],
  schedules: [],
  authReady: false,
  isLoadingData: false,
  loadError: "",
  loginMessage: "",
  popupNotification: null,
  toastMessage: null,
  notificationPermission: notificationService.getNotificationPermissionStatus(),
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
  },
};

let pendingSearchRefocus = false;
let currentLoadId = 0;
let stopReminderScheduler = null;
let stopForegroundMessages = null;
let stopNotificationBridge = null;

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getPermissions() {
  return state.session?.permissions ?? defaultPermissions;
}

function hasPermission(permissionKey) {
  return Boolean(getPermissions()[permissionKey]);
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
  };
}

function clearDataState() {
  state.students = [];
  state.schedules = [];
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

function stopForegroundMessageListener() {
  if (stopForegroundMessages) {
    stopForegroundMessages();
    stopForegroundMessages = null;
  }
}

function maybeTriggerScheduleReminder(now = new Date()) {
  if (!hasPermission("canAssignMeetingLocation")) {
    return;
  }

  const notification = scheduleReminderService.maybeCreateDueNotification(state.schedules, now);
  if (!notification) {
    return;
  }

  notificationService.notify(notification);
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

async function syncStudents() {
  state.students = await studentService.getAllStudents();
}

async function syncSchedules() {
  state.schedules = await scheduleService.getAllSchedules();
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
      studentService.getAllStudents(),
      scheduleService.getAllSchedules(),
    ]);

    if (loadId !== currentLoadId) {
      return;
    }

    state.students = students;
    state.schedules = schedules;
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

  updateUi({
    meetingScheduleId: scheduleId,
    scheduleFormOpen: false,
    activeTab: "schedule",
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

async function handleLogout() {
  try {
    await notificationService.disableCurrentDeviceToken(state.session);
    await firebaseAuthService.logout();
  } catch (error) {
    console.error("Không thể đăng xuất.", error);
  }
}

function handleOpenScheduleTab() {
  updateUi({ activeTab: "schedule" });
}

async function handleRequestNotificationPermission() {
  const result = await notificationService.requestNotificationPermissionAndSaveToken(state.session);
  state.notificationPermission = notificationService.getNotificationPermissionStatus();
  state.toastMessage = {
    title: result.success ? "Thông báo" : "Không thể bật thông báo",
    body: result.message,
  };
  render();
}

function handleDismissPopupNotification() {
  state.popupNotification = null;
  render();
}

function handleDismissToastMessage() {
  state.toastMessage = null;
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
      ? await studentService.updateStudent(state.ui.editingStudentId, payload)
      : await studentService.createStudent(payload);

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

  const confirmed = window.confirm("Xóa học sinh này khỏi danh sách?");
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
    const result = await scheduleService.createSchedule(payload, student);

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
    const result = await scheduleService.updateMeetingLocation(state.ui.meetingScheduleId, payload);

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

function render() {
  if (!state.authReady) {
    renderLoadingState("Đang kiểm tra phiên đăng nhập...", "Ứng dụng đang đồng bộ trạng thái Firebase Authentication.");
    return;
  }

  if (!state.session) {
    appElement.innerHTML = "";
    LoginScreen(appElement, { onLogin: handleLogin, message: state.loginMessage });
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
    activeFilterLabel: getActiveFilterLabel(state.ui.activeStatFilter),
    filters: state.ui,
    scheduleBuckets,
    editingStudent,
    detailStudent,
    scheduleStudent,
    meetingSchedule,
    scheduleCandidates,
    onLogout: handleLogout,
    onChangeTab: (activeTab) => updateUi({ activeTab }),
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
    supportsBrowserNotifications: notificationService.isBrowserNotificationSupported(),
    notificationPermission: state.notificationPermission,
    onRequestNotificationPermission: handleRequestNotificationPermission,
    popupNotification: state.popupNotification,
    onDismissPopupNotification: handleDismissPopupNotification,
    toastMessage: state.toastMessage,
    onDismissToastMessage: handleDismissToastMessage,
  });

  refocusSearchIfNeeded();
}

firebaseAuthService.subscribe(async ({ session, error }) => {
  currentLoadId += 1;
  stopReminderLoop();
  stopForegroundMessageListener();

  if (error) {
    console.error("Không thể đồng bộ Firebase Authentication.", error);
    state.session = null;
    state.authReady = true;
    state.loginMessage = "Không thể xác thực với Firebase hoặc đọc users/{uid}.";
    clearDataState();
    resetUiState();
    render();
    return;
  }

  state.session = session;
  state.authReady = true;
  state.loginMessage = "";
  state.notificationPermission = notificationService.getNotificationPermissionStatus();
  resetUiState();

  if (!session) {
    clearDataState();
    render();
    return;
  }

  await loadDashboardData();
  syncReminderScheduler();
  maybeTriggerScheduleReminder(new Date());
  stopForegroundMessages = notificationService.listenForegroundMessages((notification) => {
    state.toastMessage = {
      title: notification.title,
      body: notification.body,
    };
    render();
  });
});

if (!stopNotificationBridge) {
  stopNotificationBridge = notificationService.subscribe((notification) => {
    if (notification.channel === "foreground-fcm") {
      return;
    }

    state.popupNotification = notification;
    render();
  });
}

render();

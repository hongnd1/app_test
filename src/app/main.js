import { accountService } from "../logic/auth/accountService.js";
import { loginService } from "../logic/auth/loginService.js";
import { filterService } from "../logic/filter/filterService.js";
import { searchService } from "../logic/filter/searchService.js";
import { progressService } from "../logic/progress/progressService.js";
import { scheduleService } from "../logic/schedule/scheduleService.js";
import { studentService } from "../logic/student/studentService.js";
import { DashboardScreen } from "../ui/screens/DashboardScreen.js";
import { LoginScreen } from "../ui/screens/LoginScreen.js";

const appElement = document.getElementById("app");
const today = new Date();
const initialDate = today.toISOString().slice(0, 10);

const state = {
  session: accountService.getActiveSession(),
  students: [],
  schedules: [],
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
  },
};

let pendingSearchRefocus = false;

function syncStudents() {
  state.students = studentService.getAllStudents();
}

function syncSchedules() {
  state.schedules = scheduleService.getAllSchedules();
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
  updateUi({ editingStudentId: null, formMode: "create", activeTab: "students", showStudentFilters: false });
}

function openEditForm(studentId) {
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
  updateUi({
    scheduleStudentId: studentId,
    selectedScheduleDate: date,
    scheduleFormOpen: true,
    activeTab: "schedule",
  });
}

function openScheduleDayForm(date = state.ui.selectedScheduleDate) {
  updateUi({
    scheduleStudentId: null,
    selectedScheduleDate: date,
    scheduleFormOpen: true,
    activeTab: "schedule",
  });
}

function closeScheduleForm() {
  updateUi({ scheduleStudentId: null, scheduleFormOpen: false });
}

function handleLogin(credentials) {
  const result = loginService.login(credentials);
  if (!result.success) {
    return result;
  }

  state.session = result.session;
  syncStudents();
  syncSchedules();
  render();
  return result;
}

function handleLogout() {
  loginService.logout();
  state.session = null;
  render();
}

function handleSaveStudent(formData) {
  const result =
    state.ui.formMode === "edit" && state.ui.editingStudentId
      ? studentService.updateStudent(state.ui.editingStudentId, formData)
      : studentService.createStudent(formData);

  if (result.success) {
    syncStudents();
    updateUi({
      editingStudentId: null,
      formMode: null,
      detailStudentId: result.student.id,
      activeTab: "students",
    });
  }

  return result;
}

function handleDeleteStudent(studentId) {
  const confirmed = window.confirm("Xóa học sinh này khỏi danh sách?");
  if (!confirmed) {
    return;
  }

  studentService.deleteStudent(studentId);
  syncStudents();
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
}

function handleDeleteSchedule(scheduleId) {
  scheduleService.deleteSchedule(scheduleId);
  syncSchedules();
  render();
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

function handleSaveSchedule(payload) {
  const student = state.students.find((item) => item.id === payload.studentId);
  const result = scheduleService.createSchedule(payload, student);

  if (result.success) {
    syncSchedules();
    updateUi({
      scheduleStudentId: null,
      scheduleFormOpen: false,
      scheduleListTab: "all",
      selectedScheduleDate: payload.date,
      activeTab: "schedule",
    });
  }

  return result;
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

function render() {
  state.session = accountService.getActiveSession();

  if (!state.session) {
    appElement.innerHTML = "";
    LoginScreen(appElement, { onLogin: handleLogin });
    return;
  }

  syncStudents();
  syncSchedules();

  const filteredStudents = getFilteredStudents();
  const editingStudent =
    state.ui.formMode === "edit" && state.ui.editingStudentId
      ? studentService.getStudentById(state.ui.editingStudentId)
      : null;
  const detailStudent = state.ui.detailStudentId
    ? studentService.getStudentById(state.ui.detailStudentId)
    : null;
  const scheduleStudent = state.ui.scheduleStudentId
    ? studentService.getStudentById(state.ui.scheduleStudentId)
    : null;
  const scheduleCandidates = state.students.filter((student) => student.daHocLyThuyet);
  const statistics = progressService.getDashboardStatistics(state.students);
  const progressOverview = progressService.getProgressOverview(state.students);
  const scheduleBuckets = scheduleService.getScheduleBuckets({
    month: state.ui.scheduleMonth,
    year: state.ui.scheduleYear,
    selectedDate: state.ui.selectedScheduleDate,
  });

  appElement.innerHTML = "";
  DashboardScreen(appElement, {
    session: state.session,
    students: filteredStudents,
    totalStudents: state.students.length,
    statistics,
    progressOverview,
    activeFilterLabel: getActiveFilterLabel(state.ui.activeStatFilter),
    filters: state.ui,
    scheduleBuckets,
    editingStudent,
    detailStudent,
    scheduleStudent,
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
    onOpenScheduleForm: openScheduleForm,
    onOpenScheduleDayForm: openScheduleDayForm,
    onCloseScheduleForm: closeScheduleForm,
    onSaveSchedule: handleSaveSchedule,
    onDeleteSchedule: handleDeleteSchedule,
  });

  refocusSearchIfNeeded();
}

render();

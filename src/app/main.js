import { accountService } from "../logic/auth/accountService.js";
import { loginService } from "../logic/auth/loginService.js";
import { filterService } from "../logic/filter/filterService.js";
import { searchService } from "../logic/filter/searchService.js";
import { progressService } from "../logic/progress/progressService.js";
import { studentService } from "../logic/student/studentService.js";
import { DashboardScreen } from "../ui/screens/DashboardScreen.js";
import { LoginScreen } from "../ui/screens/LoginScreen.js";

const appElement = document.getElementById("app");

const state = {
  session: accountService.getActiveSession(),
  students: [],
  ui: {
    searchTerm: "",
    theoryFilter: "all",
    saHinhFilter: "all",
    paymentFilter: "all",
    datFilter: "all",
    minPaidAmount: "",
    editingStudentId: null,
    detailStudentId: null,
    formMode: null,
  },
};

function syncStudents() {
  state.students = studentService.getAllStudents();
}

function updateUi(patch) {
  state.ui = { ...state.ui, ...patch };
  render();
}

function openCreateForm() {
  updateUi({ editingStudentId: null, formMode: "create" });
}

function openEditForm(studentId) {
  updateUi({ editingStudentId: studentId, formMode: "edit" });
}

function closeForm() {
  updateUi({ editingStudentId: null, formMode: null });
}

function openDetail(studentId) {
  updateUi({ detailStudentId: studentId });
}

function closeDetail() {
  updateUi({ detailStudentId: null });
}

function handleLogin(credentials) {
  const result = loginService.login(credentials);
  if (!result.success) {
    return result;
  }

  state.session = result.session;
  syncStudents();
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
    });
  }

  return result;
}

function handleDeleteStudent(studentId) {
  const confirmed = window.confirm("Xoa hoc sinh nay khoi danh sach?");
  if (!confirmed) {
    return;
  }

  studentService.deleteStudent(studentId);
  syncStudents();
  updateUi({
    editingStudentId: state.ui.editingStudentId === studentId ? null : state.ui.editingStudentId,
    detailStudentId: state.ui.detailStudentId === studentId ? null : state.ui.detailStudentId,
    formMode:
      state.ui.editingStudentId === studentId && state.ui.formMode === "edit"
        ? null
        : state.ui.formMode,
  });
}

function getFilteredStudents() {
  const searched = searchService.searchStudents(state.students, state.ui.searchTerm);

  return filterService.filterStudents(searched, {
    theory: state.ui.theoryFilter,
    saHinh: state.ui.saHinhFilter,
    payment: state.ui.paymentFilter,
    dat: state.ui.datFilter,
    minPaidAmount: state.ui.minPaidAmount,
  });
}

function render() {
  state.session = accountService.getActiveSession();

  if (!state.session) {
    appElement.innerHTML = "";
    LoginScreen(appElement, { onLogin: handleLogin });
    return;
  }

  syncStudents();

  const filteredStudents = getFilteredStudents();
  const editingStudent =
    state.ui.formMode === "edit" && state.ui.editingStudentId
      ? studentService.getStudentById(state.ui.editingStudentId)
      : null;
  const detailStudent = state.ui.detailStudentId
    ? studentService.getStudentById(state.ui.detailStudentId)
    : null;
  const statistics = progressService.getDashboardStatistics(state.students);

  appElement.innerHTML = "";
  DashboardScreen(appElement, {
    session: state.session,
    students: filteredStudents,
    totalStudents: state.students.length,
    statistics,
    filters: state.ui,
    editingStudent,
    detailStudent,
    onLogout: handleLogout,
    onFilterChange: updateUi,
    onOpenCreateForm: openCreateForm,
    onOpenEditForm: openEditForm,
    onCloseForm: closeForm,
    onSaveStudent: handleSaveStudent,
    onDeleteStudent: handleDeleteStudent,
    onOpenDetail: openDetail,
    onCloseDetail: closeDetail,
  });
}

render();

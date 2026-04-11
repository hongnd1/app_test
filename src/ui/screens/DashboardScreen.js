import { createFilterBar } from "../components/FilterBar.js";
import { createStudentCard } from "../components/StudentCard.js";
import { createStudentDetail } from "../components/StudentDetail.js";
import { createStudentForm } from "../components/StudentForm.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function createStatCard(label, value, accent) {
  const element = document.createElement("article");
  element.className = `stat-card ${accent}`;
  element.innerHTML = `<p>${label}</p><strong>${value}</strong>`;
  return element;
}

export function DashboardScreen(root, props) {
  const container = document.createElement("main");
  container.className = "dashboard-screen";

  const remainingInfo =
    props.session.accountType === "trial"
      ? `Con ${props.session.remainingDays} ngay su dung`
      : "Tai khoan vinh vien";

  container.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">He thong quan ly hoc sinh</p>
        <h1>Bang dieu khien BLX</h1>
      </div>
      <div class="topbar__account">
        <div>
          <strong>${props.session.displayName}</strong>
          <span>${props.session.accountType === "trial" ? "Dung thu 7 ngay" : "Ban chinh thuc"} - ${remainingInfo}</span>
        </div>
        <button class="secondary-button" type="button">Dang xuat</button>
      </div>
    </header>
    <section class="stats-grid"></section>
    <section class="toolbar">
      <div>
        <h2>Danh sach hoc sinh</h2>
        <p>${props.students.length} / ${props.totalStudents} hoc sinh dang hien thi</p>
      </div>
      <button class="primary-button" type="button">Them hoc sinh</button>
    </section>
  `;

  const [logoutButton, addStudentButton] = container.querySelectorAll("button");
  logoutButton.addEventListener("click", props.onLogout);
  addStudentButton.addEventListener("click", props.onOpenCreateForm);

  const statsGrid = container.querySelector(".stats-grid");
  statsGrid.append(
    createStatCard("Tong hoc sinh", props.totalStudents, "orange"),
    createStatCard("Da hoc ly thuyet", props.statistics.theoryCompleted, "cyan"),
    createStatCard("Con thieu hoc phi", props.statistics.unpaid, "red"),
    createStatCard("Da hoc sa hinh", props.statistics.saHinhCompleted, "green"),
    createStatCard("DAT dat muc", props.statistics.datReached, "blue"),
    createStatCard("Doanh thu", formatCurrency(props.statistics.totalRevenue), "yellow"),
  );

  container.appendChild(
    createFilterBar(props.filters, {
      onChange: props.onFilterChange,
    }),
  );

  const list = document.createElement("section");
  list.className = "student-list";

  if (props.students.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h3>Khong co hoc sinh phu hop</h3>
      <p>Thu doi bo loc hoac them hoc sinh moi vao he thong.</p>
    `;
    list.appendChild(empty);
  } else {
    props.students.forEach((student) => {
      list.appendChild(
        createStudentCard(student, {
          onOpenDetail: props.onOpenDetail,
          onEdit: props.onOpenEditForm,
          onDelete: props.onDeleteStudent,
        }),
      );
    });
  }

  container.appendChild(list);

  if (props.filters.formMode === "create" || props.editingStudent) {
    const modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.appendChild(
      createStudentForm(props.editingStudent, props.filters.formMode, {
        onClose: props.onCloseForm,
        onSave: props.onSaveStudent,
      }),
    );
    container.appendChild(modal);
  }

  if (props.detailStudent) {
    const modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.appendChild(
      createStudentDetail(props.detailStudent, {
        onClose: props.onCloseDetail,
        onEdit: (studentId) => {
          props.onCloseDetail();
          props.onOpenEditForm(studentId);
        },
      }),
    );
    container.appendChild(modal);
  }

  root.appendChild(container);
}

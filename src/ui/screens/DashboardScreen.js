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

function createStatCard(config, onClick) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `stat-card ${config.accent} ${config.activeStatFilter === config.statKey ? "is-active" : ""}`;
  element.innerHTML = `
    <p>${config.label}</p>
    <strong>${config.value}</strong>
    <span class="stat-card__hint">${config.helper}</span>
  `;
  element.addEventListener("click", () => onClick(config.statKey));
  return element;
}

function createProgressBar(item, onClick, activeStatFilter) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `progress-row ${activeStatFilter === item.key ? "is-active" : ""}`;
  button.innerHTML = `
    <div class="progress-row__header">
      <strong>${item.label}</strong>
      <span>${item.count}/${item.total} học viên</span>
    </div>
    <div class="progress-track">
      <span class="progress-fill" style="width:${item.percent}%"></span>
    </div>
    <p>${item.percent}% hoàn thành</p>
  `;
  button.addEventListener("click", () => onClick(item.key));
  return button;
}

export function DashboardScreen(root, props) {
  const container = document.createElement("main");
  container.className = "dashboard-screen compact-dashboard";

  const remainingInfo =
    props.session.accountType === "trial"
      ? `Còn ${props.session.remainingDays} ngày`
      : "Vĩnh viễn";

  container.innerHTML = `
    <header class="topbar compact-topbar">
      <div>
        <p class="eyebrow">BLX Student Manager</p>
        <h1>Bảng điều khiển</h1>
        <span class="topbar__meta">${props.session.displayName} · ${remainingInfo}</span>
      </div>
      <div class="topbar__actions">
        <button class="primary-button add-button" type="button">Thêm học sinh</button>
        <button class="icon-logout-button" type="button" aria-label="Đăng xuất">⎋</button>
      </div>
    </header>
    <section class="progress-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Tiến độ tổng hợp</p>
          <h2>Học viên đã đạt từng phần</h2>
        </div>
      </div>
      <div class="progress-grid"></div>
    </section>
    <section class="stats-grid"></section>
    <section class="toolbar compact-toolbar">
      <div>
        <p class="eyebrow">Đang xem</p>
        <h2>${props.activeFilterLabel}</h2>
        <p>${props.students.length} / ${props.totalStudents} học sinh đang hiển thị</p>
      </div>
    </section>
  `;

  const logoutButton = container.querySelector(".icon-logout-button");
  const addStudentButton = container.querySelector(".add-button");
  logoutButton.addEventListener("click", props.onLogout);
  addStudentButton.addEventListener("click", props.onOpenCreateForm);

  const progressGrid = container.querySelector(".progress-grid");
  props.progressOverview.forEach((item) => {
    progressGrid.appendChild(createProgressBar(item, props.onStatFilter, props.filters.activeStatFilter));
  });

  const statsGrid = container.querySelector(".stats-grid");
  statsGrid.append(
    createStatCard(
      {
        label: "Tổng học sinh",
        value: props.totalStudents,
        accent: "orange",
        statKey: "all",
        activeStatFilter: props.filters.activeStatFilter,
        helper: "Hiện toàn bộ",
      },
      props.onStatFilter,
    ),
    createStatCard(
      {
        label: "Đã học lý thuyết",
        value: props.statistics.theoryCompleted,
        accent: "cyan",
        statKey: "theoryCompleted",
        activeStatFilter: props.filters.activeStatFilter,
        helper: "Lọc ngay",
      },
      props.onStatFilter,
    ),
    createStatCard(
      {
        label: "Còn thiếu học phí",
        value: props.statistics.unpaid,
        accent: "red",
        statKey: "unpaid",
        activeStatFilter: props.filters.activeStatFilter,
        helper: "Lọc ngay",
      },
      props.onStatFilter,
    ),
    createStatCard(
      {
        label: "Đã học sa hình",
        value: props.statistics.saHinhCompleted,
        accent: "green",
        statKey: "saHinhCompleted",
        activeStatFilter: props.filters.activeStatFilter,
        helper: "Lọc ngay",
      },
      props.onStatFilter,
    ),
    createStatCard(
      {
        label: "DAT đạt mức",
        value: props.statistics.datReached,
        accent: "blue",
        statKey: "datReached",
        activeStatFilter: props.filters.activeStatFilter,
        helper: "Lọc ngay",
      },
      props.onStatFilter,
    ),
    createStatCard(
      {
        label: "Đã đủ học phí",
        value: props.progressOverview.find((item) => item.key === "paidCompleted")?.count ?? 0,
        accent: "yellow",
        statKey: "paidCompleted",
        activeStatFilter: props.filters.activeStatFilter,
        helper: "Lọc ngay",
      },
      props.onStatFilter,
    ),
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
      <h3>Không có học sinh phù hợp</h3>
      <p>Thử đổi bộ lọc hoặc chọn mục khác để xem danh sách.</p>
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

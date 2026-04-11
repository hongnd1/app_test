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

export function DashboardScreen(root, props) {
  const container = document.createElement("main");
  container.className = "dashboard-screen";

  const remainingInfo =
    props.session.accountType === "trial"
      ? `Còn ${props.session.remainingDays} ngày sử dụng`
      : "Tài khoản vĩnh viễn";

  container.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Hệ thống quản lý học sinh</p>
        <h1>Bảng điều khiển BLX</h1>
      </div>
      <div class="topbar__account">
        <div>
          <strong>${props.session.displayName}</strong>
          <span>${props.session.accountType === "trial" ? "Dùng thử 7 ngày" : "Bản chính thức"} - ${remainingInfo}</span>
        </div>
        <button class="secondary-button" type="button">Đăng xuất</button>
      </div>
    </header>
    <section class="stats-grid"></section>
    <p class="stats-note">Chạm vào từng ô để lọc nhanh danh sách học viên theo tiêu chí của ô đó.</p>
    <section class="toolbar">
      <div>
        <h2>Danh sách học sinh</h2>
        <p>${props.students.length} / ${props.totalStudents} học sinh đang hiển thị</p>
      </div>
      <button class="primary-button" type="button">Thêm học sinh</button>
    </section>
  `;

  const [logoutButton, addStudentButton] = container.querySelectorAll("button");
  logoutButton.addEventListener("click", props.onLogout);
  addStudentButton.addEventListener("click", props.onOpenCreateForm);

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
        helper: "Lọc theo lý thuyết",
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
        helper: "Lọc theo học phí",
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
        helper: "Lọc theo sa hình",
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
        helper: "Lọc theo DAT",
      },
      props.onStatFilter,
    ),
    createStatCard(
      {
        label: "Doanh thu",
        value: formatCurrency(props.statistics.totalRevenue),
        accent: "yellow",
        statKey: "totalRevenue",
        activeStatFilter: props.filters.activeStatFilter,
        helper: "Học viên đã nộp tiền",
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
      <p>Thử đổi bộ lọc hoặc thêm học sinh mới vào hệ thống.</p>
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

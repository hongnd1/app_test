import { createFilterBar } from "../components/FilterBar.js";
import { createStudentCard } from "../components/StudentCard.js";
import { createStudentDetail } from "../components/StudentDetail.js";
import { createStudentForm } from "../components/StudentForm.js";

function monthLabel(month, year) {
  const names = [
    "Tháng Một",
    "Tháng Hai",
    "Tháng Ba",
    "Tháng Tư",
    "Tháng Năm",
    "Tháng Sáu",
    "Tháng Bảy",
    "Tháng Tám",
    "Tháng Chín",
    "Tháng Mười",
    "Tháng Mười Một",
    "Tháng Mười Hai",
  ];

  return `${names[month]} ${year}`;
}

function weekdayLabel(dateString) {
  const names = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];
  const date = new Date(`${dateString}T00:00:00`);
  return names[date.getDay()];
}

function fullDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return `${weekdayLabel(dateString)}, ngày ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function createBottomTabButton(label, key, activeKey, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `bottom-tab ${activeKey === key ? "is-active" : ""}`;
  button.innerHTML = `<span>${label}</span>`;
  button.addEventListener("click", () => onClick(key));
  return button;
}

function createProgressBar(item, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "progress-row";
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

function createScheduleCard(schedule, actions) {
  const card = document.createElement("article");
  card.className = "schedule-card";
  card.innerHTML = `
    <div class="schedule-card__header">
      <div>
        <p class="eyebrow">${schedule.time}</p>
        <h3>${schedule.studentName}</h3>
        <p class="muted">${schedule.licenseType} · ${schedule.date}</p>
      </div>
      <button class="ghost-danger-button compact-button" type="button">Xóa</button>
    </div>
    <p class="schedule-note">${schedule.note || "Chưa có ghi chú"}</p>
  `;
  card.querySelector("button").addEventListener("click", () => actions.onDelete(schedule.id));
  return card;
}

function renderScheduleList(title, schedules, actions, subtitle = "") {
  const section = document.createElement("section");
  section.className = "schedule-block";
  section.innerHTML = `
    <div class="section-heading">
      <div>
        <h2>${title}</h2>
        ${subtitle ? `<p class="muted section-heading__meta">${subtitle}</p>` : ""}
      </div>
    </div>
  `;

  const list = document.createElement("div");
  list.className = "schedule-list";

  if (!schedules.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.innerHTML = `<p>Chưa có lịch trong mục này.</p>`;
    list.appendChild(empty);
  } else {
    schedules.forEach((schedule) => list.appendChild(createScheduleCard(schedule, actions)));
  }

  section.appendChild(list);
  return section;
}

function createScheduleForm(student, students, selectedDate, handlers) {
  const studentOptions = students
    .map(
      (item) => `
        <option value="${item.id}" ${item.id === student?.id ? "selected" : ""}>
          ${item.ten} · ${item.loaiBang}
        </option>
      `,
    )
    .join("");

  const wrapper = document.createElement("section");
  wrapper.className = "panel schedule-form-panel";
  wrapper.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">Đặt lịch DAT</p>
        <h2>${student?.ten ?? "Chọn học viên cho ngày đã chọn"}</h2>
      </div>
      <button class="icon-button" type="button" aria-label="Đóng">×</button>
    </div>
    <form class="student-form">
      <div class="form-grid">
        <label class="field">
          <span>Học viên</span>
          <select name="studentId" required>
            <option value="">Chọn học viên đã hoàn thành lý thuyết</option>
            ${studentOptions}
          </select>
        </label>
        <label class="field">
          <span>Ngày học DAT</span>
          <input type="date" name="date" value="${selectedDate}" required />
        </label>
        <label class="field">
          <span>Giờ bắt đầu</span>
          <input type="time" name="startTime" required />
        </label>
        <label class="field">
          <span>Giờ kết thúc</span>
          <input type="time" name="endTime" required />
        </label>
        <label class="field">
          <span>Ghi chú</span>
          <input type="text" name="note" placeholder="Ví dụ: Ca sáng sân A" />
        </label>
      </div>
      <p class="form-message" hidden></p>
      <div class="form-actions">
        <button type="button" class="secondary-button">Hủy</button>
        <button type="submit" class="primary-button">Lưu lịch DAT</button>
      </div>
    </form>
  `;

  const form = wrapper.querySelector("form");
  const messageElement = wrapper.querySelector(".form-message");
  wrapper.querySelector(".icon-button").addEventListener("click", handlers.onClose);
  wrapper.querySelector(".secondary-button").addEventListener("click", handlers.onClose);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const result = handlers.onSave({
      studentId: formData.get("studentId"),
      date: formData.get("date"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      note: formData.get("note"),
    });

    if (!result.success) {
      messageElement.hidden = false;
      messageElement.textContent = result.message;
      return;
    }

    messageElement.hidden = true;
  });

  return wrapper;
}

function createCalendar(props) {
  const wrapper = document.createElement("section");
  wrapper.className = "calendar-panel";
  wrapper.innerHTML = `
    <div class="calendar-header">
      <strong>${monthLabel(props.filters.scheduleMonth, props.filters.scheduleYear)}</strong>
      <div class="calendar-nav">
        <button type="button" class="icon-logout-button calendar-nav-button" aria-label="Tháng trước">‹</button>
        <button type="button" class="icon-logout-button calendar-nav-button" aria-label="Tháng sau">›</button>
      </div>
    </div>
    <div class="calendar-weekdays">
      <span>H</span>
      <span>B</span>
      <span>T</span>
      <span>N</span>
      <span>S</span>
      <span>B</span>
      <span>C</span>
    </div>
    <div class="calendar-grid"></div>
  `;

  const [prevButton, nextButton] = wrapper.querySelectorAll(".calendar-nav-button");
  prevButton.addEventListener("click", () => {
    const month = props.filters.scheduleMonth === 0 ? 11 : props.filters.scheduleMonth - 1;
    const year = props.filters.scheduleMonth === 0 ? props.filters.scheduleYear - 1 : props.filters.scheduleYear;
    props.onChangeCalendarMonth({ scheduleMonth: month, scheduleYear: year });
  });
  nextButton.addEventListener("click", () => {
    const month = props.filters.scheduleMonth === 11 ? 0 : props.filters.scheduleMonth + 1;
    const year = props.filters.scheduleMonth === 11 ? props.filters.scheduleYear + 1 : props.filters.scheduleYear;
    props.onChangeCalendarMonth({ scheduleMonth: month, scheduleYear: year });
  });

  const grid = wrapper.querySelector(".calendar-grid");
  props.scheduleBuckets.calendarDays.forEach((day) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `calendar-day ${day.inCurrentMonth ? "" : "is-muted"} ${day.isSelected ? "is-selected" : ""}`;
    button.innerHTML = `<span>${day.label}</span>${day.hasSchedule ? '<i class="calendar-dot"></i>' : ""}`;
    button.addEventListener("click", () => props.onSelectScheduleDate(day.iso));
    grid.appendChild(button);
  });

  return wrapper;
}

function renderProgressTab(container, props) {
  const section = document.createElement("section");
  section.className = "tab-panel active";
  section.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Tiến độ học viên</p>
        <h2>Chạm để chuyển sang danh sách đã lọc</h2>
      </div>
    </div>
  `;

  const quick = document.createElement("div");
  quick.className = "progress-grid";
  const totalButton = document.createElement("button");
  totalButton.type = "button";
  totalButton.className = "progress-row total-row";
  totalButton.innerHTML = `
    <div class="progress-row__header">
      <strong>Tổng số học viên</strong>
      <span>${props.totalStudents} học viên</span>
    </div>
    <p>Mở tab danh sách học viên</p>
  `;
  totalButton.addEventListener("click", props.onOpenStudentTab);
  quick.appendChild(totalButton);
  props.progressOverview.forEach((item) => quick.appendChild(createProgressBar(item, props.onStatFilter)));
  section.appendChild(quick);
  container.appendChild(section);
}

function renderScheduleTab(container, props) {
  const section = document.createElement("section");
  section.className = "tab-panel active";
  section.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Lịch học</p>
        <h2>Lịch chạy DAT của học viên</h2>
      </div>
    </div>
  `;

  const overview = document.createElement("div");
  overview.className = "schedule-overview-grid";
  overview.append(
    renderScheduleList(
      "Hôm nay",
      props.scheduleBuckets.today,
      { onDelete: props.onDeleteSchedule },
      fullDateLabel(props.scheduleBuckets.todayDate),
    ),
    renderScheduleList(
      "Ngày mai",
      props.scheduleBuckets.tomorrow,
      { onDelete: props.onDeleteSchedule },
      fullDateLabel(props.scheduleBuckets.tomorrowDate),
    ),
  );
  section.appendChild(overview);

  section.appendChild(createCalendar(props));
  const selectedSection = renderScheduleList(
    `Lịch ngày ${props.filters.selectedScheduleDate}`,
    props.scheduleBuckets.selectedDay,
    { onDelete: props.onDeleteSchedule },
  );
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "primary-button compact-button schedule-add-button";
  addButton.textContent = "Thêm lịch học";
  addButton.addEventListener("click", () => props.onOpenScheduleDayForm(props.filters.selectedScheduleDate));
  selectedSection.querySelector(".section-heading").appendChild(addButton);
  section.appendChild(selectedSection);

  if (props.filters.scheduleFormOpen) {
    const modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.appendChild(
      createScheduleForm(props.scheduleStudent, props.scheduleCandidates, props.filters.selectedScheduleDate, {
        onClose: props.onCloseScheduleForm,
        onSave: props.onSaveSchedule,
      }),
    );
    section.appendChild(modal);
  }

  container.appendChild(section);
}

function renderStudentsTab(container, props) {
  const section = document.createElement("section");
  section.className = "tab-panel active";
  section.innerHTML = `
    <div class="toolbar compact-toolbar sticky-toolbar">
      <div class="toolbar__content">
        <p class="eyebrow">Danh sách học viên</p>
        <h2>${props.activeFilterLabel}</h2>
        <p>${props.students.length} / ${props.totalStudents} học sinh đang hiển thị</p>
      </div>
      <div class="toolbar-actions">
        <button class="secondary-button" type="button" data-action="toggle-filter">
          ${props.filters.showStudentFilters ? "Ẩn tìm kiếm" : "Tìm kiếm học viên"}
        </button>
        <button class="primary-button" type="button" data-action="create-student">Thêm học sinh</button>
      </div>
    </div>
  `;
  section.querySelector('[data-action="create-student"]').addEventListener("click", props.onOpenCreateForm);
  section.querySelector('[data-action="toggle-filter"]').addEventListener("click", props.onToggleStudentFilters);

  if (props.filters.showStudentFilters) {
    section.appendChild(
      createFilterBar(props.filters, {
        onChange: props.onFilterChange,
      }),
    );
  }

  const list = document.createElement("section");
  list.className = "student-list student-list--search";

  if (!props.students.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h3>Không có học sinh phù hợp</h3>
      <p>Thử đổi bộ lọc hoặc chọn nhóm khác.</p>
    `;
    list.appendChild(empty);
  } else {
    props.students.forEach((student) => {
      list.appendChild(
        createStudentCard(
          student,
          {
            onOpenDetail: props.onOpenDetail,
            onEdit: props.onOpenEditForm,
            onDelete: props.onDeleteStudent,
            onSchedule: (studentId) => props.onOpenScheduleForm(studentId, props.filters.selectedScheduleDate),
          },
          { compact: true },
        ),
      );
    });
  }

  section.appendChild(list);

  if (props.filters.formMode === "create" || props.editingStudent) {
    const modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.appendChild(
      createStudentForm(props.editingStudent, props.filters.formMode, {
        onClose: props.onCloseForm,
        onSave: props.onSaveStudent,
      }),
    );
    section.appendChild(modal);
  }

  if (props.detailStudent) {
    const modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.appendChild(
      createStudentDetail(props.detailStudent, {
        onClose: props.onCloseDetail,
        onDelete: (studentId) => {
          props.onCloseDetail();
          props.onDeleteStudent(studentId);
        },
        onEdit: (studentId) => {
          props.onCloseDetail();
          props.onOpenEditForm(studentId);
        },
        onSchedule: (studentId) => {
          props.onCloseDetail();
          props.onOpenScheduleForm(studentId, props.filters.selectedScheduleDate);
        },
      }),
    );
    section.appendChild(modal);
  }

  container.appendChild(section);
}

export function DashboardScreen(root, props) {
  const container = document.createElement("main");
  container.className = "dashboard-screen tabbed-dashboard bottom-nav-layout";

  const remainingInfo =
    props.session.accountType === "trial"
      ? `Còn ${props.session.remainingDays} ngày`
      : "Vĩnh viễn";

  container.innerHTML = `
    <header class="topbar compact-topbar">
      <div>
        <p class="eyebrow">BLX Student Manager</p>
        <p class="topbar__copyright">Bản quyền được thiết kế bởi Nguyễn Đình Hồng</p>
        <h1>Quản lý đào tạo</h1>
        <span class="topbar__meta">Xin chào ${props.session.displayName} · ${remainingInfo}</span>
      </div>
      <button class="logout-button" type="button" aria-label="Đăng xuất">Đăng xuất</button>
    </header>
    <section class="tab-content"></section>
    <nav class="bottom-tabbar"></nav>
  `;

  container.querySelector(".logout-button").addEventListener("click", props.onLogout);

  const content = container.querySelector(".tab-content");
  if (props.filters.activeTab === "progress") {
    renderProgressTab(content, props);
  }
  if (props.filters.activeTab === "schedule") {
    renderScheduleTab(content, props);
  }
  if (props.filters.activeTab === "students") {
    renderStudentsTab(content, props);
  }

  const bottomBar = container.querySelector(".bottom-tabbar");
  bottomBar.append(
    createBottomTabButton("Tiến độ", "progress", props.filters.activeTab, props.onChangeTab),
    createBottomTabButton("Lịch học", "schedule", props.filters.activeTab, props.onChangeTab),
    createBottomTabButton("Học viên", "students", props.filters.activeTab, props.onChangeTab),
  );

  root.appendChild(container);
}

import { notificationConfig } from "../../data/config/notificationConfig.js";
import { getScheduleSlotList } from "../../logic/schedule/scheduleSlots.js";
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

function notificationModeOptionLabel(mode) {
  const labels = {
    off: "Tắt",
    realtime: "Realtime",
    fcm: "FCM",
  };

  return labels[mode] ?? mode;
}

function notificationPermissionLabel(status) {
  const labels = {
    granted: "Đã cho phép",
    default: "Chưa quyết định",
    denied: "Đã chặn",
    unsupported: "Không hỗ trợ",
  };

  return labels[status] ?? status;
}

function formatDateTime(value) {
  if (!value) {
    return "Chưa có thời gian";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function feedbackStatusLabel(status) {
  return status === "resolved" ? "Đã xử lý" : "Đang mở";
}

function makeSettingsAccordion(panel, options = {}) {
  const originalHeader = panel.querySelector(".panel__header");
  const title = options.title || originalHeader?.querySelector("h2")?.textContent || "Cài đặt";
  const eyebrow = options.eyebrow || originalHeader?.querySelector(".eyebrow")?.textContent || "";
  const details = document.createElement("details");
  details.className = "settings-accordion";
  const summary = document.createElement("summary");
  summary.className = "settings-accordion__trigger";
  const body = document.createElement("div");
  body.className = "settings-accordion__body";

  while (panel.firstChild) {
    body.appendChild(panel.firstChild);
  }

  summary.innerHTML = `
    <span>
      ${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ""}
      <strong>${title}</strong>
    </span>
    <span class="settings-accordion__icon">›</span>
  `;

  details.append(summary, body);
  panel.classList.add("settings-panel--collapsed");
  panel.append(details);
}

function createToast(message, onClose) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerHTML = `
    <div>
      <strong>${message.title || "Thông báo"}</strong>
      <p>${message.body || ""}</p>
    </div>
    <button type="button" class="icon-button" aria-label="Đóng">×</button>
  `;
  toast.querySelector("button").addEventListener("click", onClose);
  return toast;
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

function createNotificationCenter(props) {
  const panel = document.createElement("section");
  panel.className = "panel notification-center-panel";
  panel.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">Thông báo</p>
        <h2>Bạn đang có ${props.unreadNotificationCount} thông báo chưa đọc</h2>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="secondary-button" data-action="mark-all">Đánh dấu đã đọc</button>
        <button type="button" class="icon-button" data-action="close" aria-label="Đóng">×</button>
      </div>
    </div>
    <div class="notification-list"></div>
  `;

  const list = panel.querySelector(".notification-list");
  if (!props.notifications.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.innerHTML = `
      <h3>Chưa có thông báo</h3>
      <p>Thông báo mới sẽ hiển thị tại đây.</p>
    `;
    list.appendChild(empty);
  } else {
    props.notifications.forEach((notification) => {
      const item = document.createElement("article");
      item.className = `notification-item ${notification.readAt ? "" : "is-unread"}`;
      item.innerHTML = `
        <button type="button" class="notification-item__content" data-action="open">
          <strong>${notification.title}</strong>
          <p>${notification.body}</p>
          <span>${formatDateTime(notification.createdAt)}</span>
        </button>
        <button type="button" class="ghost-danger-button compact-button" data-action="delete">Xóa</button>
        <span class="notification-item__state">${notification.readAt ? "Đã đọc" : "Mới"}</span>
      `;
      item.querySelector('[data-action="open"]').addEventListener("click", () =>
        props.onOpenNotification(notification.id, notification.scheduleId),
      );
      item.querySelector('[data-action="delete"]').addEventListener("click", () =>
        props.onDeleteNotification(notification.id),
      );
      list.appendChild(item);
    });
  }

  panel.querySelector('[data-action="close"]').addEventListener("click", props.onClose);
  panel.querySelector('[data-action="mark-all"]').addEventListener("click", props.onMarkAllNotificationsRead);
  return panel;
}

function createNotificationPopup(notification, handlers) {
  const modal = document.createElement("div");
  modal.className = "modal-shell";
  modal.innerHTML = `
    <section class="panel reminder-popup-panel">
      <div class="panel__header">
        <div>
          <p class="eyebrow">Nhắc việc</p>
          <h2>${notification.title}</h2>
        </div>
        <button class="icon-button" type="button" aria-label="Đóng">×</button>
      </div>
      <p class="hero-copy">${notification.body}</p>
      <div class="form-actions">
        <button type="button" class="secondary-button" data-action="dismiss">Đóng</button>
        <button type="button" class="primary-button" data-action="open-schedule">Mở dashboard lịch</button>
      </div>
    </section>
  `;

  modal.querySelector(".icon-button").addEventListener("click", handlers.onDismiss);
  modal.querySelector('[data-action="dismiss"]').addEventListener("click", handlers.onDismiss);
  modal.querySelector('[data-action="open-schedule"]').addEventListener("click", handlers.onOpenScheduleTab);
  return modal;
}

function createScheduleCard(schedule, actions, permissions) {
  const card = document.createElement("article");
  card.className = "schedule-card";

  const actionButtons = [];
  if (permissions.canAssignMeetingLocation) {
    actionButtons.push('<button class="secondary-button compact-button" type="button" data-action="meeting">Địa điểm hẹn</button>');
  }
  if (permissions.canDeleteSchedule) {
    actionButtons.push('<button class="ghost-danger-button compact-button" type="button" data-action="delete">Xóa</button>');
  }

  card.innerHTML = `
    <div class="schedule-card__header">
      <div>
        <p class="eyebrow">${schedule.slotLabel || schedule.time}</p>
        <h3>${schedule.studentName}</h3>
        <p class="muted">${schedule.licenseType} · ${schedule.date} · ${schedule.time}</p>
      </div>
      <div class="toolbar-actions">
        ${actionButtons.join("")}
      </div>
    </div>
    <p class="schedule-note">${schedule.note || "Chưa có ghi chú"}</p>
    ${
      permissions.canAssignMeetingLocation && schedule.meetingLocation
        ? `<p class="schedule-note"><strong>Điểm hẹn:</strong> ${schedule.meetingLocation}</p>
           <p class="schedule-note"><strong>Thông báo:</strong> ${schedule.meetingNote || "Đã chuẩn bị thông báo cho học viên"}</p>`
        : ""
    }
  `;

  const deleteButton = card.querySelector('[data-action="delete"]');
  if (deleteButton) {
    deleteButton.addEventListener("click", () => actions.onDelete(schedule.id));
  }

  const meetingButton = card.querySelector('[data-action="meeting"]');
  if (meetingButton) {
    meetingButton.addEventListener("click", () => actions.onMeeting(schedule.id));
  }

  return card;
}

function renderScheduleList(title, schedules, actions, permissions, subtitle = "") {
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
    schedules.forEach((schedule) => list.appendChild(createScheduleCard(schedule, actions, permissions)));
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

  const slotOptions = getScheduleSlotList()
    .map(
      (slot) => `
        <option value="${slot.key}" ${slot.key === "morning" ? "selected" : ""}>
          ${slot.label} (${slot.startTime} - ${slot.endTime})
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
          <span>Ca học</span>
          <select name="slotKey" required>
            ${slotOptions}
          </select>
        </label>
        <label class="field">
          <span>Ghi chú</span>
          <input type="text" name="note" placeholder="Ví dụ: Chuẩn bị xe sân A" />
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
  const submitButton = wrapper.querySelector('button[type="submit"]');
  wrapper.querySelector(".icon-button").addEventListener("click", handlers.onClose);
  wrapper.querySelector(".secondary-button").addEventListener("click", handlers.onClose);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    try {
      const formData = new FormData(form);
      const result = await handlers.onSave({
        studentId: formData.get("studentId"),
        date: formData.get("date"),
        slotKey: formData.get("slotKey"),
        note: formData.get("note"),
      });

      if (!result.success) {
        messageElement.hidden = false;
        messageElement.textContent = result.message;
        return;
      }

      messageElement.hidden = true;
    } catch {
      messageElement.hidden = false;
      messageElement.textContent = "Không thể lưu lịch học.";
    } finally {
      submitButton.disabled = false;
    }
  });

  return wrapper;
}

function createMeetingLocationForm(schedule, handlers) {
  const wrapper = document.createElement("section");
  wrapper.className = "panel schedule-form-panel";
  wrapper.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">Địa điểm hẹn</p>
        <h2>${schedule.studentName}</h2>
      </div>
      <button class="icon-button" type="button" aria-label="Đóng">×</button>
    </div>
    <form class="student-form">
      <div class="form-grid">
        <label class="field">
          <span>Loại bằng</span>
          <input type="text" value="${schedule.licenseType}" readonly />
        </label>
        <label class="field">
          <span>Khung giờ</span>
          <input type="text" value="${schedule.slotLabel || schedule.time}" readonly />
        </label>
        <label class="field">
          <span>Địa điểm hẹn</span>
          <input type="text" name="meetingLocation" value="${schedule.meetingLocation ?? ""}" />
        </label>
        <label class="field">
          <span>Nội dung thông báo</span>
          <input
            type="text"
            name="meetingNote"
            value="${schedule.meetingNote ?? ""}"
            placeholder="Ví dụ: Có mặt trước 15 phút, mang theo CCCD"
          />
        </label>
        <label class="field">
          <span>Ghi chú nhắc GV/admin</span>
          <input
            type="text"
            name="teacherReminderNote"
            value="${schedule.teacherReminderNote ?? ""}"
            placeholder="Ví dụ: Gọi học viên trước 20:00"
          />
        </label>
        <label class="field">
          <span>Trạng thái hẹn địa điểm</span>
          <select name="meetingLocationStatus">
            <option value="confirmed" ${schedule.meetingLocationStatus === "confirmed" ? "selected" : ""}>Đã hẹn</option>
            <option value="pending" ${schedule.meetingLocationStatus === "pending" ? "selected" : ""}>Chưa hẹn</option>
            <option value="cancelled" ${schedule.meetingLocationStatus === "cancelled" ? "selected" : ""}>Hủy</option>
          </select>
        </label>
      </div>
      <p class="form-message" hidden></p>
      <div class="form-actions">
        <button type="button" class="secondary-button">Hủy</button>
        <button type="submit" class="primary-button">Lưu địa điểm hẹn</button>
      </div>
    </form>
  `;

  const form = wrapper.querySelector("form");
  const messageElement = wrapper.querySelector(".form-message");
  const submitButton = wrapper.querySelector('button[type="submit"]');
  wrapper.querySelector(".icon-button").addEventListener("click", handlers.onClose);
  wrapper.querySelector(".secondary-button").addEventListener("click", handlers.onClose);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    try {
      const formData = new FormData(form);
      const result = await handlers.onSave({
        meetingLocation: formData.get("meetingLocation"),
        meetingNote: formData.get("meetingNote"),
        teacherReminderNote: formData.get("teacherReminderNote"),
        meetingLocationStatus: formData.get("meetingLocationStatus"),
        teacherConfirmed: formData.get("meetingLocationStatus") === "confirmed",
      });

      if (!result.success) {
        messageElement.hidden = false;
        messageElement.textContent = result.message;
        return;
      }

      messageElement.hidden = true;
    } catch {
      messageElement.hidden = false;
      messageElement.textContent = "Không thể lưu địa điểm hẹn.";
    } finally {
      submitButton.disabled = false;
    }
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

  const scheduleActions = {
    onDelete: props.onDeleteSchedule,
    onMeeting: props.onOpenMeetingLocationForm,
  };

  const overview = document.createElement("div");
  overview.className = "schedule-overview-grid";
  overview.append(
    renderScheduleList("Hôm nay", props.scheduleBuckets.today, scheduleActions, props.permissions, fullDateLabel(props.scheduleBuckets.todayDate)),
    renderScheduleList("Ngày mai", props.scheduleBuckets.tomorrow, scheduleActions, props.permissions, fullDateLabel(props.scheduleBuckets.tomorrowDate)),
  );
  section.appendChild(overview);

  section.appendChild(createCalendar(props));
  const selectedSection = renderScheduleList(
    `Lịch ngày ${props.filters.selectedScheduleDate}`,
    props.scheduleBuckets.selectedDay,
    scheduleActions,
    props.permissions,
  );

  if (props.permissions.canCreateSchedule) {
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "primary-button compact-button schedule-add-button";
    addButton.textContent = "Thêm lịch học";
    addButton.addEventListener("click", () => props.onOpenScheduleDayForm(props.filters.selectedScheduleDate));
    selectedSection.querySelector(".section-heading").appendChild(addButton);
  }

  section.appendChild(selectedSection);

  if (props.filters.scheduleFormOpen && props.permissions.canCreateSchedule) {
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

  if (props.meetingSchedule && props.permissions.canAssignMeetingLocation) {
    const modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.appendChild(
      createMeetingLocationForm(props.meetingSchedule, {
        onClose: props.onCloseMeetingLocationForm,
        onSave: props.onSaveMeetingLocation,
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
        <p>${props.students.length} / ${props.totalStudents} học viên đang hiển thị</p>
      </div>
      <div class="toolbar-actions">
        <button class="secondary-button" type="button" data-action="toggle-filter">
          ${props.filters.showStudentFilters ? "Ẩn tìm kiếm" : "Tìm kiếm học viên"}
        </button>
        ${props.permissions.canCreateStudent ? '<button class="primary-button" type="button" data-action="create-student">Thêm học viên</button>' : ""}
      </div>
    </div>
  `;

  const createButton = section.querySelector('[data-action="create-student"]');
  if (createButton) {
    createButton.addEventListener("click", props.onOpenCreateForm);
  }
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
      <h3>Không có học viên phù hợp</h3>
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
          { compact: true, permissions: props.permissions },
        ),
      );
    });
  }

  section.appendChild(list);

  if (
    (props.filters.formMode === "create" && props.permissions.canCreateStudent) ||
    (props.editingStudent && (props.permissions.canEditStudent || props.permissions.canEditStudentDat))
  ) {
    const modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.appendChild(
      createStudentForm(
        props.editingStudent,
        props.filters.formMode,
        {
          onClose: props.onCloseForm,
          onSave: props.onSaveStudent,
        },
        props.permissions,
      ),
    );
    section.appendChild(modal);
  }

  if (props.detailStudent) {
    const modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.appendChild(
      createStudentDetail(
        props.detailStudent,
        {
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
        },
        props.permissions,
      ),
    );
    section.appendChild(modal);
  }

  container.appendChild(section);
}

function renderStatisticsTab(container, props) {
  const report = props.statisticsReport;
  const section = document.createElement("section");
  section.className = "tab-panel active";
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);

  section.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Thống kê</p>
        <h1>Tiến độ đào tạo</h1>
      </div>
      <div class="toolbar-actions">
        <label class="field compact-field">
          <span>Tháng</span>
          <select data-action="stats-month">
            ${Array.from({ length: 12 }, (_, index) => `
              <option value="${index}" ${index === props.filters.statsMonth ? "selected" : ""}>Tháng ${index + 1}</option>
            `).join("")}
          </select>
        </label>
        <label class="field compact-field">
          <span>Năm</span>
          <select data-action="stats-year">
            ${years.map((year) => `<option value="${year}" ${year === props.filters.statsYear ? "selected" : ""}>${year}</option>`).join("")}
          </select>
        </label>
      </div>
    </div>
    ${
      props.permissions.canViewStudentsByTeacher
        ? `
          <section class="panel">
            <label class="field">
              <span>Chọn giáo viên</span>
              <select data-action="stats-teacher">
                <option value="">Tất cả giáo viên</option>
                ${props.approvedTeachers
                  .map(
                    (teacher) => `
                      <option value="${teacher.uid}" ${teacher.uid === props.filters.statsTeacherUid ? "selected" : ""}>
                        ${teacher.displayName || teacher.email}
                      </option>
                    `,
                  )
                  .join("")}
              </select>
            </label>
          </section>
        `
        : ""
    }
    <div class="progress-grid">
      <article class="panel">
        <p class="eyebrow">Trong tháng đã chọn</p>
        <h2>${report.taughtStudents}</h2>
        <p class="hero-copy">Học viên có lịch học DAT</p>
      </article>
      <article class="panel">
        <p class="eyebrow">Trong tháng đã chọn</p>
        <h2>${report.schedulesInPeriod}</h2>
        <p class="hero-copy">Buổi/lịch DAT đã tạo</p>
      </article>
      <article class="panel">
        <p class="eyebrow">Hiện tại</p>
        <h2>${report.graduatedStudents}</h2>
        <p class="hero-copy">Học viên đã tốt nghiệp</p>
      </article>
      <article class="panel">
        <p class="eyebrow">Hiện tại</p>
        <h2>${report.datKm.toLocaleString("vi-VN")} km</h2>
        <p class="hero-copy">Tổng km DAT đã chạy</p>
      </article>
    </div>
    <section class="panel">
      <div class="detail-grid">
        <div class="detail-card">
          <span>Tổng học viên đang quản lý</span>
          <strong>${report.totalStudents}</strong>
        </div>
        <div class="detail-card">
          <span>Kỳ thống kê</span>
          <strong>Tháng ${report.month + 1}/${report.year}</strong>
        </div>
      </div>
    </section>
  `;

  section.querySelector('[data-action="stats-month"]').addEventListener("change", (event) =>
    props.onChangeStatisticsFilter({ statsMonth: Number(event.target.value) }),
  );
  section.querySelector('[data-action="stats-year"]').addEventListener("change", (event) =>
    props.onChangeStatisticsFilter({ statsYear: Number(event.target.value) }),
  );

  const teacherSelect = section.querySelector('[data-action="stats-teacher"]');
  if (teacherSelect) {
    teacherSelect.addEventListener("change", (event) =>
      props.onChangeStatisticsFilter({ statsTeacherUid: event.target.value }),
    );
  }

  container.appendChild(section);
}

function renderSettingsTab(container, props) {
  const section = document.createElement("section");
  section.className = "tab-panel active settings-tab";

  const summary = document.createElement("section");
  summary.className = "panel settings-panel";
  summary.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">Trung tâm thông báo</p>
        <h2>Bạn đang có ${props.unreadNotificationCount} thông báo chưa đọc</h2>
      </div>
      <button type="button" class="secondary-button" data-action="open-notifications">Mở danh sách thông báo</button>
    </div>
    <div class="detail-grid">
      <div class="detail-card">
        <span>Chế độ thông báo</span>
        <strong>${props.notificationModeLabel}</strong>
      </div>
      <div class="detail-card">
        <span>Quyền trình duyệt</span>
        <strong>${notificationPermissionLabel(props.notificationPermission)}</strong>
      </div>
    </div>
    <p class="hero-copy">Các thiết lập thông báo, cài đặt thiết bị và đăng xuất được gom tại tab này.</p>
  `;
  summary.querySelector('[data-action="open-notifications"]').addEventListener("click", props.onToggleNotificationCenter);
  makeSettingsAccordion(summary);
  section.appendChild(summary);

  if (props.reminderSummary.hasPending) {
    const pendingPanel = document.createElement("section");
    pendingPanel.className = "panel settings-panel";
    pendingPanel.innerHTML = `
      <div class="panel__header">
        <div>
          <p class="eyebrow">Lịch DAT tồn đọng</p>
          <h2>Có ${props.reminderSummary.pendingCount} lịch cần hẹn địa điểm</h2>
        </div>
        <button type="button" class="primary-button" data-action="open-schedule">Mở tab lịch</button>
      </div>
      <div class="schedule-list"></div>
    `;

    const list = pendingPanel.querySelector(".schedule-list");
    props.reminderSummary.pendingSchedules.slice(0, 5).forEach((schedule) => {
      const item = document.createElement("div");
      item.className = "schedule-card";
      item.innerHTML = `
        <div class="schedule-card__header">
          <div>
            <p class="eyebrow">${schedule.slotLabel || schedule.time}</p>
            <h3>${schedule.studentName}</h3>
            <p class="muted">${schedule.licenseType} · ${schedule.date} · ${schedule.time}</p>
          </div>
          ${
            props.permissions.canAssignMeetingLocation
              ? '<button type="button" class="secondary-button compact-button" data-action="meeting">Đã hẹn địa điểm</button>'
              : ""
          }
        </div>
        <p class="schedule-note">${schedule.teacherReminderNote || "Cần hẹn địa điểm chạy DAT với học viên."}</p>
      `;

      const actionButton = item.querySelector('[data-action="meeting"]');
      if (actionButton) {
        actionButton.addEventListener("click", () => props.onOpenMeetingLocationForm(schedule.id));
      }

      list.appendChild(item);
    });

    pendingPanel.querySelector('[data-action="open-schedule"]').addEventListener("click", props.onOpenScheduleTab);
    makeSettingsAccordion(pendingPanel);
    section.appendChild(pendingPanel);
  }

  const notificationSettings = document.createElement("section");
  notificationSettings.className = "panel settings-panel";
  notificationSettings.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">Cài đặt thông báo</p>
        <h2>Thiết bị hiện tại</h2>
      </div>
    </div>
    <div class="settings-grid">
      ${
        props.showNotificationModeSelector
          ? `
            <label class="field">
              <span>Notification mode</span>
              <select data-action="notification-mode">
                ${props.notificationModeOptions
                  .map(
                    (mode) => `
                      <option value="${mode}" ${mode === props.notificationMode ? "selected" : ""}>
                        ${notificationModeOptionLabel(mode)}
                      </option>
                    `,
                  )
                  .join("")}
              </select>
            </label>
          `
          : ""
      }
      ${
        props.showNotificationButton
          ? `<button type="button" class="secondary-button settings-action-button" data-action="enable-notification">${props.notificationButtonLabel}</button>`
          : `<div class="detail-card"><span>Thông báo</span><strong>Đang tắt theo cấu hình hiện tại</strong></div>`
      }
    </div>
    <p class="hero-copy">${
      notificationConfig.enablePendingDatCard
        ? "Card lịch DAT tồn đọng đang được bật để bạn xử lý các lịch chưa hẹn địa điểm."
        : "Card lịch DAT tồn đọng hiện đang tắt."
    }</p>
  `;

  const modeSelect = notificationSettings.querySelector('[data-action="notification-mode"]');
  if (modeSelect) {
    modeSelect.addEventListener("change", (event) => props.onChangeNotificationMode(event.target.value));
  }

  const enableButton = notificationSettings.querySelector('[data-action="enable-notification"]');
  if (enableButton) {
    enableButton.disabled = props.notificationPermission === "granted";
    enableButton.addEventListener("click", props.onRequestNotificationPermission);
  }
  makeSettingsAccordion(notificationSettings);
  section.appendChild(notificationSettings);

  const hasTeacherApprovals = props.permissions.canApproveTeacher && props.pendingTeacherApplications?.length;
  const hasStudentApprovals = props.permissions.canApproveStudent && props.pendingStudentApplications?.length;
  if (hasTeacherApprovals || hasStudentApprovals) {
    const approvalPanel = document.createElement("section");
    approvalPanel.className = "panel settings-panel";
    approvalPanel.innerHTML = `
      <div class="panel__header">
        <div>
          <p class="eyebrow">Duyệt tài khoản</p>
          <h2>Hồ sơ đang chờ xử lý</h2>
        </div>
      </div>
      <div class="schedule-list"></div>
    `;

    const list = approvalPanel.querySelector(".schedule-list");
    if (hasTeacherApprovals) {
      props.pendingTeacherApplications.forEach((application) => {
        const item = document.createElement("article");
        item.className = "schedule-card";
        item.innerHTML = `
          <div class="schedule-card__header">
            <div>
              <p class="eyebrow">Giáo viên chờ host duyệt</p>
              <h3>${application.displayName || application.email}</h3>
              <p class="muted">${application.email || ""}</p>
            </div>
            <div class="toolbar-actions">
              <button type="button" class="secondary-button compact-button" data-action="reject">Từ chối</button>
              <button type="button" class="primary-button compact-button" data-action="approve">Duyệt</button>
            </div>
          </div>
        `;
        item.querySelector('[data-action="approve"]').addEventListener("click", () => props.onApproveTeacherApplication(application.uid));
        item.querySelector('[data-action="reject"]').addEventListener("click", () => props.onRejectTeacherApplication(application.uid));
        list.appendChild(item);
      });
    }

    if (hasStudentApprovals) {
      props.pendingStudentApplications.forEach((application) => {
        const profile = application.studentProfile || {};
        const item = document.createElement("article");
        item.className = "schedule-card";
        item.innerHTML = `
          <div class="schedule-card__header">
            <div>
              <p class="eyebrow">Học sinh chờ giáo viên duyệt</p>
              <h3>${profile.hoTen || application.displayName || application.email}</h3>
              <p class="muted">${application.email || ""} · ${profile.loaiBang || ""}</p>
            </div>
            <div class="toolbar-actions">
              <button type="button" class="secondary-button compact-button" data-action="reject">Từ chối</button>
              <button type="button" class="primary-button compact-button" data-action="approve">Duyệt</button>
            </div>
          </div>
        `;
        item.querySelector('[data-action="approve"]').addEventListener("click", () => props.onApproveStudentApplication(application.uid));
        item.querySelector('[data-action="reject"]').addEventListener("click", () => props.onRejectStudentApplication(application.uid));
        list.appendChild(item);
      });
    }

    makeSettingsAccordion(approvalPanel);
    section.appendChild(approvalPanel);
  }

  if (props.permissions.canSubmitFeedback) {
    const feedbackPanel = document.createElement("section");
    feedbackPanel.className = "panel settings-panel";
    feedbackPanel.innerHTML = `
      <div class="panel__header">
        <div>
          <p class="eyebrow">Góp ý và phản hồi</p>
          <h2>Báo vấn đề trong app</h2>
        </div>
      </div>
      <form class="form-grid" data-form="feedback">
        <label class="field">
          <span>Tiêu đề</span>
          <input name="title" type="text" placeholder="Ví dụ: Không lưu được lịch DAT" required />
        </label>
        <label class="field">
          <span>Mô tả bug</span>
          <textarea name="description" rows="4" placeholder="Mô tả màn hình, thao tác và lỗi bạn gặp" required></textarea>
        </label>
        <p class="form-message" data-feedback-message></p>
        <div class="form-actions">
          <button type="submit" class="primary-button">Gửi cho host</button>
        </div>
      </form>
    `;

    feedbackPanel.querySelector('[data-form="feedback"]').addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const result = await props.onSubmitFeedback({
        title: new FormData(form).get("title"),
        description: new FormData(form).get("description"),
      });
      const message = feedbackPanel.querySelector("[data-feedback-message]");
      message.textContent = result.message || "";
      if (result.success) {
        form.reset();
      }
    });

    makeSettingsAccordion(feedbackPanel);
    section.appendChild(feedbackPanel);
  }

  if (props.permissions.canViewFeedbackReports) {
    const reportPanel = document.createElement("section");
    reportPanel.className = "panel settings-panel";
    reportPanel.innerHTML = `
      <div class="panel__header">
        <div>
          <p class="eyebrow">Vấn đề app</p>
          <h2>Góp ý và phản hồi từ giáo viên, học sinh</h2>
        </div>
      </div>
      <div class="schedule-list"></div>
    `;

    const list = reportPanel.querySelector(".schedule-list");
    if (!props.feedbackReports.length) {
      list.innerHTML = `
        <div class="empty-state compact-empty">
          <h3>Chưa có vấn đề app</h3>
          <p>Các phản hồi mới sẽ hiển thị tại đây.</p>
        </div>
      `;
    } else {
      props.feedbackReports.forEach((report) => {
        const item = document.createElement("article");
        item.className = "schedule-card";
        item.innerHTML = `
          <div class="schedule-card__header">
            <div>
              <p class="eyebrow">${feedbackStatusLabel(report.status)} · ${report.authorRole || ""}</p>
              <h3>${report.title}</h3>
              <p class="muted">${report.authorName || report.authorEmail || report.authorUid} · ${formatDateTime(report.createdAt)}</p>
            </div>
            ${
              report.status === "resolved"
                ? '<button type="button" class="ghost-danger-button compact-button" data-action="delete">Xóa</button>'
                : '<button type="button" class="secondary-button compact-button" data-action="resolve">Đã xử lý</button>'
            }
          </div>
          <p class="schedule-note">${report.description}</p>
        `;

        const resolveButton = item.querySelector('[data-action="resolve"]');
        if (resolveButton) {
          resolveButton.addEventListener("click", () => props.onResolveFeedback(report.id));
        }
        const deleteButton = item.querySelector('[data-action="delete"]');
        if (deleteButton) {
          deleteButton.addEventListener("click", () => props.onDeleteResolvedFeedback(report.id));
        }

        list.appendChild(item);
      });
    }

    makeSettingsAccordion(reportPanel);
    section.appendChild(reportPanel);
  }

  const accountPanel = document.createElement("section");
  accountPanel.className = "panel settings-panel";
  accountPanel.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">Cài đặt tài khoản</p>
        <h2>${props.session.displayName}</h2>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-card">
        <span>Email</span>
        <strong>${props.session.email || "Chưa có email"}</strong>
      </div>
      <div class="detail-card">
        <span>Chức vụ</span>
        <strong>${props.session.roleLabel}</strong>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="logout-button" data-action="logout">Đăng xuất</button>
    </div>
  `;
  accountPanel.querySelector('[data-action="logout"]').addEventListener("click", props.onLogout);
  makeSettingsAccordion(accountPanel);
  section.appendChild(accountPanel);

  container.appendChild(section);
}

export function DashboardScreen(root, props) {
  const container = document.createElement("main");
  container.className = "dashboard-screen tabbed-dashboard bottom-nav-layout";

  container.innerHTML = `
    <header class="topbar compact-topbar sticky-topbar">
      <div class="topbar-user">
        <strong>${props.session.displayName}</strong>
        <span class="topbar__meta">${props.session.roleLabel}</span>
      </div>
      <button class="notification-bell" type="button" aria-label="Mở thông báo" data-action="toggle-notifications">
        <span class="notification-bell__icon">🔔</span>
        ${props.unreadNotificationCount ? `<span class="notification-bell__badge">${props.unreadNotificationCount}</span>` : ""}
      </button>
    </header>
    <section class="tab-content"></section>
    <nav class="bottom-tabbar"></nav>
  `;

  container.querySelector('[data-action="toggle-notifications"]').addEventListener("click", props.onToggleNotificationCenter);

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
  if (props.filters.activeTab === "statistics" && props.permissions.canViewStatistics) {
    renderStatisticsTab(content, props);
  }
  if (props.filters.activeTab === "settings") {
    renderSettingsTab(content, props);
  }

  const bottomBar = container.querySelector(".bottom-tabbar");
  bottomBar.append(
    createBottomTabButton("Tiến độ", "progress", props.filters.activeTab, props.onChangeTab),
    createBottomTabButton("Lịch học", "schedule", props.filters.activeTab, props.onChangeTab),
    createBottomTabButton("Học viên", "students", props.filters.activeTab, props.onChangeTab),
    createBottomTabButton("Cài đặt", "settings", props.filters.activeTab, props.onChangeTab),
  );

  if (props.permissions.canViewStatistics) {
    bottomBar.insertBefore(
      createBottomTabButton("Thống kê", "statistics", props.filters.activeTab, props.onChangeTab),
      bottomBar.lastElementChild,
    );
  }

  root.appendChild(container);

  if (props.filters.showNotificationCenter) {
    const modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.appendChild(
      createNotificationCenter({
        notifications: props.notifications,
        unreadNotificationCount: props.unreadNotificationCount,
        onClose: props.onToggleNotificationCenter,
        onMarkAllNotificationsRead: props.onMarkAllNotificationsRead,
        onOpenNotification: props.onOpenNotification,
        onDeleteNotification: props.onDeleteNotification,
      }),
    );
    root.appendChild(modal);
  }

  if (props.popupNotification) {
    root.appendChild(
      createNotificationPopup(props.popupNotification, {
        onDismiss: props.onDismissPopupNotification,
        onOpenScheduleTab: props.onOpenScheduleTab,
      }),
    );
  }

  if (props.toastMessage) {
    root.appendChild(createToast(props.toastMessage, props.onDismissToastMessage));
  }
}

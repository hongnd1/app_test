import { getScheduleSlotList } from "../../logic/schedule/scheduleSlots.js";
import { createFilterBar } from "../components/FilterBar.js";
import { createStudentCard } from "../components/StudentCard.js";
import { createStudentDetail } from "../components/StudentDetail.js";
import { createStudentForm } from "../components/StudentForm.js";

function monthLabel(month, year) {
  const names = [
    "Thang Mot",
    "Thang Hai",
    "Thang Ba",
    "Thang Tu",
    "Thang Nam",
    "Thang Sau",
    "Thang Bay",
    "Thang Tam",
    "Thang Chin",
    "Thang Muoi",
    "Thang Muoi Mot",
    "Thang Muoi Hai",
  ];

  return `${names[month]} ${year}`;
}

function weekdayLabel(dateString) {
  const names = [
    "Chu nhat",
    "Thu hai",
    "Thu ba",
    "Thu tu",
    "Thu nam",
    "Thu sau",
    "Thu bay",
  ];
  const date = new Date(`${dateString}T00:00:00`);
  return names[date.getDay()];
}

function fullDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return `${weekdayLabel(dateString)}, ngay ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function createBottomTabButton(label, key, activeKey, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `bottom-tab ${activeKey === key ? "is-active" : ""}`;
  button.innerHTML = `<span>${label}</span>`;
  button.addEventListener("click", () => onClick(key));
  return button;
}

function createToast(message, onClose) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerHTML = `
    <div>
      <strong>${message.title || "Thong bao"}</strong>
      <p>${message.body || ""}</p>
    </div>
    <button type="button" class="icon-button" aria-label="Dong">x</button>
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
      <span>${item.count}/${item.total} hoc vien</span>
    </div>
    <div class="progress-track">
      <span class="progress-fill" style="width:${item.percent}%"></span>
    </div>
    <p>${item.percent}% hoan thanh</p>
  `;
  button.addEventListener("click", () => onClick(item.key));
  return button;
}

function createReminderPanel(props) {
  const section = document.createElement("section");
  section.className = "panel reminder-panel";
  section.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">Nhac hen DAT</p>
        <h2>${props.reminderSummary.pendingCount} lich can hen dia diem</h2>
      </div>
      <div class="toolbar-actions">
        ${
          props.showNotificationButton && props.supportsBrowserNotifications
            ? `<button type="button" class="secondary-button" data-action="enable-notification">${props.notificationButtonLabel}</button>`
            : ""
        }
        <button type="button" class="primary-button" data-action="open-schedule">Mo lich can xu ly</button>
      </div>
    </div>
    <div class="schedule-list"></div>
  `;

  const list = section.querySelector(".schedule-list");
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
          props.canAssignMeetingLocation
            ? '<button type="button" class="secondary-button compact-button" data-action="confirm-meeting">Da hen dia diem</button>'
            : ""
        }
      </div>
      <p class="schedule-note"><strong>Trang thai:</strong> ${schedule.meetingLocationStatus || "pending"}</p>
      <p class="schedule-note">${schedule.teacherReminderNote || "Can hen dia diem chay DAT voi hoc vien."}</p>
    `;

    const actionButton = item.querySelector('[data-action="confirm-meeting"]');
    if (actionButton) {
      actionButton.addEventListener("click", () => props.onOpenMeetingLocationForm(schedule.id));
    }

    list.appendChild(item);
  });

  section.querySelector('[data-action="open-schedule"]').addEventListener("click", props.onOpenScheduleTab);

  const enableButton = section.querySelector('[data-action="enable-notification"]');
  if (enableButton) {
    enableButton.disabled = props.notificationPermission === "granted";
    enableButton.addEventListener("click", props.onRequestNotificationPermission);
  }

  return section;
}

function createNotificationPopup(notification, handlers) {
  const modal = document.createElement("div");
  modal.className = "modal-shell";
  modal.innerHTML = `
    <section class="panel reminder-popup-panel">
      <div class="panel__header">
        <div>
          <p class="eyebrow">Nhac viec</p>
          <h2>${notification.title}</h2>
        </div>
        <button class="icon-button" type="button" aria-label="Dong">x</button>
      </div>
      <p class="hero-copy">${notification.body}</p>
      <div class="form-actions">
        <button type="button" class="secondary-button" data-action="dismiss">Dong</button>
        <button type="button" class="primary-button" data-action="open-schedule">Mo dashboard lich</button>
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
    actionButtons.push('<button class="secondary-button compact-button" type="button" data-action="meeting">Dia diem hen</button>');
  }
  if (permissions.canDeleteSchedule) {
    actionButtons.push('<button class="ghost-danger-button compact-button" type="button" data-action="delete">Xoa</button>');
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
    <p class="schedule-note">${schedule.note || "Chua co ghi chu"}</p>
    ${
      permissions.canAssignMeetingLocation && schedule.meetingLocation
        ? `<p class="schedule-note"><strong>Diem hen:</strong> ${schedule.meetingLocation}</p>
           <p class="schedule-note"><strong>Thong bao:</strong> ${schedule.meetingNote || "Da chuan bi thong bao cho hoc vien"}</p>`
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
    empty.innerHTML = `<p>Chua co lich trong muc nay.</p>`;
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
        <p class="eyebrow">Dat lich DAT</p>
        <h2>${student?.ten ?? "Chon hoc vien cho ngay da chon"}</h2>
      </div>
      <button class="icon-button" type="button" aria-label="Dong">x</button>
    </div>
    <form class="student-form">
      <div class="form-grid">
        <label class="field">
          <span>Hoc vien</span>
          <select name="studentId" required>
            <option value="">Chon hoc vien da hoan thanh ly thuyet</option>
            ${studentOptions}
          </select>
        </label>
        <label class="field">
          <span>Ngay hoc DAT</span>
          <input type="date" name="date" value="${selectedDate}" required />
        </label>
        <label class="field">
          <span>Ca hoc</span>
          <select name="slotKey" required>
            ${slotOptions}
          </select>
        </label>
        <label class="field">
          <span>Ghi chu</span>
          <input type="text" name="note" placeholder="Vi du: Chuan bi xe san A" />
        </label>
      </div>
      <p class="form-message" hidden></p>
      <div class="form-actions">
        <button type="button" class="secondary-button">Huy</button>
        <button type="submit" class="primary-button">Luu lich DAT</button>
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
      messageElement.textContent = "Khong the luu lich hoc.";
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
        <p class="eyebrow">Dia diem hen</p>
        <h2>${schedule.studentName}</h2>
      </div>
      <button class="icon-button" type="button" aria-label="Dong">x</button>
    </div>
    <form class="student-form">
      <div class="form-grid">
        <label class="field">
          <span>Loai bang</span>
          <input type="text" value="${schedule.licenseType}" readonly />
        </label>
        <label class="field">
          <span>Khung gio</span>
          <input type="text" value="${schedule.slotLabel || schedule.time}" readonly />
        </label>
        <label class="field">
          <span>Dia diem hen</span>
          <input type="text" name="meetingLocation" value="${schedule.meetingLocation ?? ""}" />
        </label>
        <label class="field">
          <span>Noi dung thong bao</span>
          <input
            type="text"
            name="meetingNote"
            value="${schedule.meetingNote ?? ""}"
            placeholder="Vi du: Co mat truoc 15 phut, mang theo CCCD"
          />
        </label>
        <label class="field">
          <span>Ghi chu nhac GV/admin</span>
          <input
            type="text"
            name="teacherReminderNote"
            value="${schedule.teacherReminderNote ?? ""}"
            placeholder="Vi du: Goi hoc vien truoc 20:00"
          />
        </label>
        <label class="field">
          <span>Trang thai hen dia diem</span>
          <select name="meetingLocationStatus">
            <option value="confirmed" ${schedule.meetingLocationStatus === "confirmed" ? "selected" : ""}>Da hen</option>
            <option value="pending" ${schedule.meetingLocationStatus === "pending" ? "selected" : ""}>Chua hen</option>
            <option value="cancelled" ${schedule.meetingLocationStatus === "cancelled" ? "selected" : ""}>Huy</option>
          </select>
        </label>
      </div>
      <p class="form-message" hidden></p>
      <div class="form-actions">
        <button type="button" class="secondary-button">Huy</button>
        <button type="submit" class="primary-button">Luu dia diem hen</button>
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
      messageElement.textContent = "Khong the luu dia diem hen.";
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
        <button type="button" class="icon-logout-button calendar-nav-button" aria-label="Thang truoc"><</button>
        <button type="button" class="icon-logout-button calendar-nav-button" aria-label="Thang sau">></button>
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
        <p class="eyebrow">Tien do hoc vien</p>
        <h2>Cham de chuyen sang danh sach da loc</h2>
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
      <strong>Tong so hoc vien</strong>
      <span>${props.totalStudents} hoc vien</span>
    </div>
    <p>Mo tab danh sach hoc vien</p>
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
        <p class="eyebrow">Lich hoc</p>
        <h2>Lich chay DAT cua hoc vien</h2>
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
    renderScheduleList("Hom nay", props.scheduleBuckets.today, scheduleActions, props.permissions, fullDateLabel(props.scheduleBuckets.todayDate)),
    renderScheduleList("Ngay mai", props.scheduleBuckets.tomorrow, scheduleActions, props.permissions, fullDateLabel(props.scheduleBuckets.tomorrowDate)),
  );
  section.appendChild(overview);

  section.appendChild(createCalendar(props));
  const selectedSection = renderScheduleList(
    `Lich ngay ${props.filters.selectedScheduleDate}`,
    props.scheduleBuckets.selectedDay,
    scheduleActions,
    props.permissions,
  );

  if (props.permissions.canCreateSchedule) {
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "primary-button compact-button schedule-add-button";
    addButton.textContent = "Them lich hoc";
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
        <p class="eyebrow">Danh sach hoc vien</p>
        <h2>${props.activeFilterLabel}</h2>
        <p>${props.students.length} / ${props.totalStudents} hoc vien dang hien thi</p>
      </div>
      <div class="toolbar-actions">
        <button class="secondary-button" type="button" data-action="toggle-filter">
          ${props.filters.showStudentFilters ? "An tim kiem" : "Tim kiem hoc vien"}
        </button>
        ${props.permissions.canCreateStudent ? '<button class="primary-button" type="button" data-action="create-student">Them hoc vien</button>' : ""}
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
      <h3>Khong co hoc vien phu hop</h3>
      <p>Thu doi bo loc hoac chon nhom khac.</p>
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

export function DashboardScreen(root, props) {
  const container = document.createElement("main");
  container.className = "dashboard-screen tabbed-dashboard bottom-nav-layout";

  container.innerHTML = `
    <header class="topbar compact-topbar">
      <div>
        <p class="eyebrow">BLX Student Manager</p>
        <p class="topbar__copyright">Ban quyen duoc thiet ke boi Nguyen Dinh Hong</p>
        <h1>Quan ly dao tao</h1>
        <span class="topbar__meta">Xin chao ${props.session.displayName} · ${props.session.roleLabel}</span>
        <span class="topbar__meta">Mode thong bao: ${props.notificationModeLabel}</span>
      </div>
      <div class="toolbar-actions">
        ${
          props.showNotificationModeSelector
            ? `
              <label class="field topbar-mode-field">
                <span>Notification mode</span>
                <select data-action="notification-mode">
                  ${props.notificationModeOptions
                    .map(
                      (mode) => `
                        <option value="${mode}" ${mode === props.notificationMode ? "selected" : ""}>
                          ${mode}
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
            ? `<button class="secondary-button" type="button" data-action="enable-notification">${props.notificationButtonLabel}</button>`
            : ""
        }
        <button class="logout-button" type="button" aria-label="Dang xuat">Dang xuat</button>
      </div>
    </header>
    <section class="tab-content"></section>
    <nav class="bottom-tabbar"></nav>
  `;

  container.querySelector(".logout-button").addEventListener("click", props.onLogout);

  const modeSelect = container.querySelector('[data-action="notification-mode"]');
  if (modeSelect) {
    modeSelect.addEventListener("change", (event) => {
      props.onChangeNotificationMode(event.target.value);
    });
  }

  const topEnableButton = container.querySelector('[data-action="enable-notification"]');
  if (topEnableButton) {
    topEnableButton.disabled = props.notificationPermission === "granted";
    topEnableButton.addEventListener("click", props.onRequestNotificationPermission);
  }

  const content = container.querySelector(".tab-content");
  if (props.showReminderPanel) {
    content.appendChild(
      createReminderPanel({
        reminderSummary: props.reminderSummary,
        supportsBrowserNotifications: props.supportsBrowserNotifications,
        notificationPermission: props.notificationPermission,
        notificationButtonLabel: props.notificationButtonLabel,
        showNotificationButton: props.showNotificationButton,
        canAssignMeetingLocation: props.permissions.canAssignMeetingLocation,
        onRequestNotificationPermission: props.onRequestNotificationPermission,
        onOpenScheduleTab: props.onOpenScheduleTab,
        onOpenMeetingLocationForm: props.onOpenMeetingLocationForm,
      }),
    );
  }

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
    createBottomTabButton("Tien do", "progress", props.filters.activeTab, props.onChangeTab),
    createBottomTabButton("Lich hoc", "schedule", props.filters.activeTab, props.onChangeTab),
    createBottomTabButton("Hoc vien", "students", props.filters.activeTab, props.onChangeTab),
  );

  root.appendChild(container);

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

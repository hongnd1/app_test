import { paymentService } from "../../logic/payment/paymentService.js";
import { progressService } from "../../logic/progress/progressService.js";
import { createStatusTag } from "./StatusTag.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function createStudentCard(student, actions, options = {}) {
  const compact = options.compact ?? false;
  const permissions = options.permissions ?? {};
  const card = document.createElement("article");
  card.className = `student-card ${compact ? "student-card--compact" : ""}`;

  if (compact) {
    card.innerHTML = `
      <button class="student-compact-item" type="button">
        <div>
          <h3>${student.ten}</h3>
          <p class="muted">Hạng ${student.loaiBang}</p>
        </div>
        <span class="student-compact-arrow">›</span>
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => actions.onOpenDetail(student.id));
    return card;
  }

  const paymentStatus = paymentService.getPaymentStatus(student);
  const datStatus = progressService.getDatStatus(student);
  const canEdit = permissions.canEditStudent || permissions.canEditStudentDat;

  const header = document.createElement("div");
  header.className = "student-card__header";
  header.innerHTML = `
    <div>
      <p class="eyebrow">${student.id}</p>
      <h3>${student.ten}</h3>
      <p class="muted">${
        permissions.canViewSensitiveStudentInfo ? `${student.sdt} · ` : ""
      }Hạng ${student.loaiBang}</p>
    </div>
  `;

  const body = document.createElement("div");
  body.className = "student-card__body";
  body.innerHTML = permissions.canViewSensitiveStudentInfo
    ? `
      <div class="metric-row">
        <span>Đã nộp</span>
        <strong>${formatCurrency(student.daNop)}</strong>
      </div>
      <div class="metric-row">
        <span>Còn thiếu</span>
        <strong>${formatCurrency(student.conThieu)}</strong>
      </div>
      <div class="metric-row">
        <span>Km DAT</span>
        <strong>${student.soKmDAT} km</strong>
      </div>
      <p class="stage-note">${progressService.getStageSummary(student)}</p>
    `
    : `
      <div class="metric-row">
        <span>Loại bằng</span>
        <strong>${student.loaiBang}</strong>
      </div>
      <div class="metric-row">
        <span>Km DAT</span>
        <strong>${student.soKmDAT} km</strong>
      </div>
    `;

  const statusGroup = document.createElement("div");
  statusGroup.className = "student-card__status";
  statusGroup.append(createStatusTag({ label: `Hạng ${student.loaiBang}`, tone: "info" }), createStatusTag(datStatus));

  if (permissions.canViewSensitiveStudentInfo) {
    statusGroup.prepend(createStatusTag(paymentStatus));
    statusGroup.append(
      createStatusTag({
        label: student.daHocLyThuyet ? "Đã học lý thuyết" : "Chưa học lý thuyết",
        tone: student.daHocLyThuyet ? "success" : "danger",
      }),
      createStatusTag({
        label: student.daHocSaHinh ? "Đã học sa hình" : "Chưa học sa hình",
        tone: student.daHocSaHinh ? "success" : "warning",
      }),
    );
  }

  const footer = document.createElement("div");
  footer.className = "student-card__footer";

  if (student.daHocLyThuyet && permissions.canCreateSchedule) {
    const scheduleButton = document.createElement("button");
    scheduleButton.className = "primary-button compact-button";
    scheduleButton.textContent = "Đặt lịch DAT";
    scheduleButton.addEventListener("click", () => actions.onSchedule(student.id));
    footer.appendChild(scheduleButton);
  }

  const detailButton = document.createElement("button");
  detailButton.className = "secondary-button compact-button";
  detailButton.textContent = "Chi tiết";
  detailButton.addEventListener("click", () => actions.onOpenDetail(student.id));
  footer.appendChild(detailButton);

  if (canEdit) {
    const editButton = document.createElement("button");
    editButton.className = "secondary-button compact-button";
    editButton.textContent = permissions.canEditStudent ? "Sửa" : "Sửa km DAT";
    editButton.addEventListener("click", () => actions.onEdit(student.id));
    footer.appendChild(editButton);
  }

  if (permissions.canDeleteStudent) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "ghost-danger-button compact-button";
    deleteButton.textContent = "Xóa";
    deleteButton.addEventListener("click", () => actions.onDelete(student.id));
    footer.appendChild(deleteButton);
  }

  card.append(header, body, statusGroup, footer);

  return card;
}

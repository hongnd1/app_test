import { paymentService } from "../../logic/payment/paymentService.js";
import { progressService } from "../../logic/progress/progressService.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function buildAdminDetail(student, paymentStatus, datStatus) {
  return `
    <div class="detail-grid">
      <div class="detail-card">
        <span>Mã học sinh</span>
        <strong>${student.id}</strong>
      </div>
      <div class="detail-card">
        <span>Số điện thoại</span>
        <strong>${student.sdt}</strong>
      </div>
      <div class="detail-card">
        <span>Tên Zalo</span>
        <strong>${student.tenZalo}</strong>
      </div>
      <div class="detail-card">
        <span>CCCD</span>
        <strong>${student.cccd}</strong>
      </div>
      <div class="detail-card">
        <span>Loại bằng</span>
        <strong>${student.loaiBang}</strong>
      </div>
      <div class="detail-card">
        <span>Tổng học phí</span>
        <strong>${formatCurrency(student.tongHocPhi)}</strong>
      </div>
      <div class="detail-card">
        <span>Đã nộp</span>
        <strong>${formatCurrency(student.daNop)}</strong>
      </div>
      <div class="detail-card">
        <span>Còn thiếu</span>
        <strong>${formatCurrency(student.conThieu)}</strong>
      </div>
      <div class="detail-card">
        <span>Km DAT</span>
        <strong>${student.soKmDAT} km</strong>
      </div>
    </div>
    <div class="detail-summary">
      <p><strong>Thanh toán:</strong> ${paymentStatus.label}</p>
      <p><strong>Lý thuyết:</strong> ${student.daHocLyThuyet ? "Đã hoàn thành" : "Chưa hoàn thành"}</p>
      <p><strong>Sa hình:</strong> ${student.daHocSaHinh ? "Đã hoàn thành" : "Chưa hoàn thành"}</p>
      <p><strong>DAT:</strong> ${datStatus.label}</p>
      <p><strong>Giai đoạn:</strong> ${progressService.getStageSummary(student)}</p>
    </div>
  `;
}

function buildStaffDetail(student) {
  return `
    <div class="detail-grid">
      <div class="detail-card">
        <span>Tên học viên</span>
        <strong>${student.ten}</strong>
      </div>
      <div class="detail-card">
        <span>Loại bằng</span>
        <strong>${student.loaiBang}</strong>
      </div>
      <div class="detail-card">
        <span>Km DAT</span>
        <strong>${student.soKmDAT} km</strong>
      </div>
    </div>
  `;
}

export function createStudentDetail(student, handlers, permissions = {}) {
  const paymentStatus = paymentService.getPaymentStatus(student);
  const datStatus = progressService.getDatStatus(student);
  const canSchedule = student.daHocLyThuyet && permissions.canCreateSchedule;
  const canEditDatOnly = permissions.canEditStudentDat && !permissions.canEditStudent;

  const actions = ['<button type="button" class="secondary-button">Đóng</button>'];

  if (permissions.canEditStudent || permissions.canEditStudentDat) {
    actions.push(
      `<button type="button" class="secondary-button detail-edit-button">${
        canEditDatOnly ? "Cập nhật km DAT" : "Sửa thông tin"
      }</button>`,
    );
  }

  if (permissions.canDeleteStudent) {
    actions.push('<button type="button" class="ghost-danger-button detail-delete-button">Xóa</button>');
  }

  if (canSchedule) {
    actions.push('<button type="button" class="primary-button detail-schedule-button">Đặt lịch DAT</button>');
  }

  const wrapper = document.createElement("section");
  wrapper.className = "panel";
  wrapper.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">Hồ sơ học sinh</p>
        <h2>${student.ten}</h2>
      </div>
      <button class="icon-button" type="button" aria-label="Đóng">×</button>
    </div>
    ${permissions.canViewSensitiveStudentInfo ? buildAdminDetail(student, paymentStatus, datStatus) : buildStaffDetail(student)}
    <div class="form-actions">
      ${actions.join("")}
    </div>
  `;

  wrapper.querySelector(".icon-button").addEventListener("click", handlers.onClose);
  wrapper.querySelector(".secondary-button").addEventListener("click", handlers.onClose);

  const editButton = wrapper.querySelector(".detail-edit-button");
  if (editButton) {
    editButton.addEventListener("click", () => handlers.onEdit(student.id));
  }

  const deleteButton = wrapper.querySelector(".detail-delete-button");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => handlers.onDelete(student.id));
  }

  const scheduleButton = wrapper.querySelector(".detail-schedule-button");
  if (scheduleButton) {
    scheduleButton.addEventListener("click", () => handlers.onSchedule(student.id));
  }

  return wrapper;
}

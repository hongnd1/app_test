import { paymentService } from "../../logic/payment/paymentService.js";
import { progressService } from "../../logic/progress/progressService.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function createStudentDetail(student, handlers) {
  const paymentStatus = paymentService.getPaymentStatus(student);
  const datStatus = progressService.getDatStatus(student);

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
    <div class="detail-grid">
      <div class="detail-card">
        <span>Mã học sinh</span>
        <strong>${student.id}</strong>
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
    <div class="form-actions">
      <button type="button" class="secondary-button">Đóng</button>
      <button type="button" class="secondary-button detail-edit-button">Sửa thông tin</button>
      <button type="button" class="ghost-danger-button detail-delete-button">Xóa</button>
      ${student.daHocLyThuyet ? '<button type="button" class="primary-button detail-schedule-button">Đặt lịch DAT</button>' : ""}
    </div>
  `;

  wrapper.querySelector(".icon-button").addEventListener("click", handlers.onClose);
  wrapper.querySelector(".secondary-button").addEventListener("click", handlers.onClose);
  wrapper.querySelector(".detail-edit-button").addEventListener("click", () => handlers.onEdit(student.id));
  wrapper.querySelector(".detail-delete-button").addEventListener("click", () => handlers.onDelete(student.id));

  const scheduleButton = wrapper.querySelector(".detail-schedule-button");
  if (scheduleButton) {
    scheduleButton.addEventListener("click", () => handlers.onSchedule(student.id));
  }

  return wrapper;
}

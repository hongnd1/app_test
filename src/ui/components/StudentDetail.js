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
        <p class="eyebrow">Ho so hoc sinh</p>
        <h2>${student.ten}</h2>
      </div>
      <button class="icon-button" type="button" aria-label="Dong">×</button>
    </div>
    <div class="detail-grid">
      <div class="detail-card">
        <span>Ma hoc sinh</span>
        <strong>${student.id}</strong>
      </div>
      <div class="detail-card">
        <span>CCCD</span>
        <strong>${student.cccd}</strong>
      </div>
      <div class="detail-card">
        <span>Tong hoc phi</span>
        <strong>${formatCurrency(student.tongHocPhi)}</strong>
      </div>
      <div class="detail-card">
        <span>Da nop</span>
        <strong>${formatCurrency(student.daNop)}</strong>
      </div>
      <div class="detail-card">
        <span>Con thieu</span>
        <strong>${formatCurrency(student.conThieu)}</strong>
      </div>
      <div class="detail-card">
        <span>Km DAT</span>
        <strong>${student.soKmDAT} km</strong>
      </div>
    </div>
    <div class="detail-summary">
      <p><strong>Thanh toan:</strong> ${paymentStatus.label}</p>
      <p><strong>Ly thuyet:</strong> ${student.daHocLyThuyet ? "Da hoan thanh" : "Chua hoan thanh"}</p>
      <p><strong>Sa hinh:</strong> ${student.daHocSaHinh ? "Da hoan thanh" : "Chua hoan thanh"}</p>
      <p><strong>DAT:</strong> ${datStatus.label}</p>
      <p><strong>Giai doan:</strong> ${progressService.getStageSummary(student)}</p>
    </div>
    <div class="form-actions">
      <button type="button" class="secondary-button">Dong</button>
      <button type="button" class="primary-button">Sua thong tin</button>
    </div>
  `;

  wrapper.querySelector(".icon-button").addEventListener("click", handlers.onClose);
  wrapper.querySelector(".secondary-button").addEventListener("click", handlers.onClose);
  wrapper.querySelector(".primary-button").addEventListener("click", () => handlers.onEdit(student.id));

  return wrapper;
}

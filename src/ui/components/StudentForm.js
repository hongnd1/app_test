function toChecked(value) {
  return value ? "checked" : "";
}

function buildAdminFields(student) {
  return `
    <label class="field">
      <span>Tên học sinh</span>
      <input type="text" name="ten" value="${student?.ten ?? ""}" required />
    </label>
    <label class="field">
      <span>Số điện thoại</span>
      <input type="text" name="sdt" maxlength="11" value="${student?.sdt ?? ""}" required />
    </label>
    <label class="field">
      <span>Tên Zalo</span>
      <input type="text" name="tenZalo" value="${student?.tenZalo ?? ""}" required />
    </label>
    <label class="field">
      <span>Số CCCD</span>
      <input type="text" name="cccd" maxlength="12" value="${student?.cccd ?? ""}" required />
    </label>
    <label class="field">
      <span>Loại bằng</span>
      <select name="loaiBang" required>
        <option value="A1">A1</option>
        <option value="A2">A2</option>
        <option value="B tự động">B tự động</option>
        <option value="B số sàn">B số sàn</option>
        <option value="C1">C1</option>
        <option value="D">D</option>
        <option value="E">E</option>
      </select>
    </label>
    <label class="field">
      <span>Tổng học phí</span>
      <input type="number" min="0" name="tongHocPhi" value="${student?.tongHocPhi ?? 0}" required />
    </label>
    <label class="field">
      <span>Số tiền đã nộp</span>
      <input type="number" min="0" name="daNop" value="${student?.daNop ?? 0}" required />
    </label>
    <label class="field">
      <span>Số km DAT</span>
      <input type="number" min="0" name="soKmDAT" value="${student?.soKmDAT ?? 0}" required />
    </label>
  `;
}

function buildStaffFields(student) {
  return `
    <label class="field">
      <span>Tên học sinh</span>
      <input type="text" name="ten" value="${student?.ten ?? ""}" readonly />
    </label>
    <label class="field">
      <span>Loại bằng</span>
      <input type="text" name="loaiBangDisplay" value="${student?.loaiBang ?? ""}" readonly />
    </label>
    <label class="field">
      <span>Số km DAT</span>
      <input type="number" min="0" name="soKmDAT" value="${student?.soKmDAT ?? 0}" required />
    </label>
  `;
}

export function createStudentForm(student, mode, handlers, permissions = {}) {
  const isStaffDatOnly = permissions.canEditStudentDat && !permissions.canEditStudent;
  const wrapper = document.createElement("section");
  wrapper.className = "panel";

  wrapper.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">${mode === "edit" ? "Cập nhật học sinh" : "Thêm học sinh mới"}</p>
        <h2>${mode === "edit" ? student?.ten ?? "" : "Thông tin học viên"}</h2>
      </div>
      <button class="icon-button" type="button" aria-label="Đóng">×</button>
    </div>
    <form class="student-form">
      <div class="form-grid">
        ${isStaffDatOnly ? buildStaffFields(student) : buildAdminFields(student)}
      </div>
      ${
        isStaffDatOnly
          ? ""
          : `
      <div class="toggle-grid">
        <label class="toggle-card">
          <input type="checkbox" name="daHocLyThuyet" ${toChecked(student?.daHocLyThuyet)} />
          <span>Đã học xong lý thuyết</span>
        </label>
        <label class="toggle-card">
          <input type="checkbox" name="daHocSaHinh" ${toChecked(student?.daHocSaHinh)} />
          <span>Đã học sa hình</span>
        </label>
      </div>
      `
      }
      <p class="form-message" hidden></p>
      <div class="form-actions">
        <button type="button" class="secondary-button">Hủy</button>
        <button type="submit" class="primary-button">${mode === "edit" ? "Lưu thay đổi" : "Thêm học sinh"}</button>
      </div>
    </form>
  `;

  const closeButton = wrapper.querySelector(".icon-button");
  const cancelButton = wrapper.querySelector(".secondary-button");
  const form = wrapper.querySelector("form");
  const messageElement = wrapper.querySelector(".form-message");
  const submitButton = wrapper.querySelector('button[type="submit"]');
  const licenseSelect = wrapper.querySelector('[name="loaiBang"]');

  if (licenseSelect) {
    licenseSelect.value = student?.loaiBang ?? "B tự động";
  }

  closeButton.addEventListener("click", handlers.onClose);
  cancelButton.addEventListener("click", handlers.onClose);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    try {
      const formData = new FormData(form);
      const payload = isStaffDatOnly
        ? {
            soKmDAT: Number(formData.get("soKmDAT")),
          }
        : {
            ten: formData.get("ten"),
            sdt: formData.get("sdt"),
            tenZalo: formData.get("tenZalo"),
            cccd: formData.get("cccd"),
            loaiBang: formData.get("loaiBang"),
            tongHocPhi: Number(formData.get("tongHocPhi")),
            daNop: Number(formData.get("daNop")),
            soKmDAT: Number(formData.get("soKmDAT")),
            daHocLyThuyet: form.querySelector('[name="daHocLyThuyet"]').checked,
            daHocSaHinh: form.querySelector('[name="daHocSaHinh"]').checked,
          };

      const result = await handlers.onSave(payload);
      if (!result.success) {
        messageElement.hidden = false;
        messageElement.textContent = result.message;
        return;
      }

      messageElement.hidden = true;
    } catch (error) {
      messageElement.hidden = false;
      messageElement.textContent = "Không thể lưu dữ liệu.";
    } finally {
      submitButton.disabled = false;
    }
  });

  return wrapper;
}

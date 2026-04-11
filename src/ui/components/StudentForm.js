function toChecked(value) {
  return value ? "checked" : "";
}

export function createStudentForm(student, mode, handlers) {
  const wrapper = document.createElement("section");
  wrapper.className = "panel";

  wrapper.innerHTML = `
    <div class="panel__header">
      <div>
        <p class="eyebrow">${mode === "edit" ? "Cap nhat hoc sinh" : "Them hoc sinh moi"}</p>
        <h2>${mode === "edit" ? student?.ten ?? "" : "Thong tin hoc vien"}</h2>
      </div>
      <button class="icon-button" type="button" aria-label="Dong">×</button>
    </div>
    <form class="student-form">
      <div class="form-grid">
        <label class="field">
          <span>Ten hoc sinh</span>
          <input type="text" name="ten" value="${student?.ten ?? ""}" required />
        </label>
        <label class="field">
          <span>So CCCD</span>
          <input type="text" name="cccd" maxlength="12" value="${student?.cccd ?? ""}" required />
        </label>
        <label class="field">
          <span>Tong hoc phi</span>
          <input type="number" min="0" name="tongHocPhi" value="${student?.tongHocPhi ?? 0}" required />
        </label>
        <label class="field">
          <span>So tien da nop</span>
          <input type="number" min="0" name="daNop" value="${student?.daNop ?? 0}" required />
        </label>
        <label class="field">
          <span>So km DAT</span>
          <input type="number" min="0" name="soKmDAT" value="${student?.soKmDAT ?? 0}" required />
        </label>
      </div>
      <div class="toggle-grid">
        <label class="toggle-card">
          <input type="checkbox" name="daHocLyThuyet" ${toChecked(student?.daHocLyThuyet)} />
          <span>Da hoc xong ly thuyet</span>
        </label>
        <label class="toggle-card">
          <input type="checkbox" name="daHocSaHinh" ${toChecked(student?.daHocSaHinh)} />
          <span>Da hoc sa hinh</span>
        </label>
      </div>
      <p class="form-message" hidden></p>
      <div class="form-actions">
        <button type="button" class="secondary-button">Huy</button>
        <button type="submit" class="primary-button">${mode === "edit" ? "Luu thay doi" : "Them hoc sinh"}</button>
      </div>
    </form>
  `;

  const closeButton = wrapper.querySelector(".icon-button");
  const cancelButton = wrapper.querySelector(".secondary-button");
  const form = wrapper.querySelector("form");
  const messageElement = wrapper.querySelector(".form-message");

  closeButton.addEventListener("click", handlers.onClose);
  cancelButton.addEventListener("click", handlers.onClose);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      ten: formData.get("ten"),
      cccd: formData.get("cccd"),
      tongHocPhi: Number(formData.get("tongHocPhi")),
      daNop: Number(formData.get("daNop")),
      soKmDAT: Number(formData.get("soKmDAT")),
      daHocLyThuyet: form.querySelector('[name="daHocLyThuyet"]').checked,
      daHocSaHinh: form.querySelector('[name="daHocSaHinh"]').checked,
    };

    const result = handlers.onSave(payload);
    if (!result.success) {
      messageElement.hidden = false;
      messageElement.textContent = result.message;
      return;
    }

    messageElement.hidden = true;
  });

  return wrapper;
}

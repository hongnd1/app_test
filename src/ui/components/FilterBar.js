export function createFilterBar(filters, handlers) {
  const wrapper = document.createElement("section");
  wrapper.className = "filter-bar";

  wrapper.innerHTML = `
    <label class="field">
      <span>Tim nhanh</span>
      <input type="search" name="searchTerm" placeholder="Nhap ten hoac CCCD" value="${filters.searchTerm}" />
    </label>
    <label class="field">
      <span>Ly thuyet</span>
      <select name="theoryFilter">
        <option value="all">Tat ca</option>
        <option value="done">Da hoc</option>
        <option value="pending">Chua hoc</option>
      </select>
    </label>
    <label class="field">
      <span>Sa hinh</span>
      <select name="saHinhFilter">
        <option value="all">Tat ca</option>
        <option value="done">Da hoc</option>
        <option value="pending">Chua hoc</option>
      </select>
    </label>
    <label class="field">
      <span>Hoc phi</span>
      <select name="paymentFilter">
        <option value="all">Tat ca</option>
        <option value="paid">Da thanh toan</option>
        <option value="debt">Con thieu</option>
      </select>
    </label>
    <label class="field">
      <span>DAT</span>
      <select name="datFilter">
        <option value="all">Tat ca</option>
        <option value="reached">Da dat</option>
        <option value="pending">Chua dat</option>
      </select>
    </label>
    <label class="field">
      <span>Da nop tu</span>
      <input type="number" min="0" name="minPaidAmount" placeholder="0" value="${filters.minPaidAmount}" />
    </label>
  `;

  wrapper.querySelectorAll("input, select").forEach((element) => {
    if (element.tagName === "SELECT") {
      element.value = filters[element.name];
    }

    element.addEventListener("input", () => {
      handlers.onChange({ [element.name]: element.value });
    });
  });

  return wrapper;
}

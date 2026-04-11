export function createFilterBar(filters, handlers) {
  const wrapper = document.createElement("section");
  wrapper.className = "filter-bar";

  wrapper.innerHTML = `
    <label class="field search-field">
      <span>Tìm nhanh</span>
      <input type="search" name="searchTerm" placeholder="Nhập tên hoặc CCCD" value="${filters.searchTerm}" />
    </label>
    <label class="field">
      <span>Lý thuyết</span>
      <select name="theoryFilter">
        <option value="all">Tất cả</option>
        <option value="done">Đã học</option>
        <option value="pending">Chưa học</option>
      </select>
    </label>
    <label class="field">
      <span>Sa hình</span>
      <select name="saHinhFilter">
        <option value="all">Tất cả</option>
        <option value="done">Đã học</option>
        <option value="pending">Chưa học</option>
      </select>
    </label>
    <label class="field">
      <span>Học phí</span>
      <select name="paymentFilter">
        <option value="all">Tất cả</option>
        <option value="paid">Đã thanh toán</option>
        <option value="debt">Còn thiếu</option>
      </select>
    </label>
    <label class="field">
      <span>DAT</span>
      <select name="datFilter">
        <option value="all">Tất cả</option>
        <option value="reached">Đã đạt</option>
        <option value="pending">Chưa đạt</option>
      </select>
    </label>
    <label class="field">
      <span>Loại bằng</span>
      <select name="licenseFilter">
        <option value="all">Tất cả</option>
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
      <span>Đã nộp từ</span>
      <input type="number" min="0" name="minPaidAmount" placeholder="0" value="${filters.minPaidAmount}" />
    </label>
  `;

  wrapper.querySelectorAll("input, select").forEach((element) => {
    if (element.tagName === "SELECT") {
      element.value = filters[element.name];
    }

    const eventName = element.name === "searchTerm" ? "input" : "change";
    element.addEventListener(eventName, () => {
      handlers.onChange({
        [element.name]: element.value,
        activeStatFilter: "all",
      }, { preserveSearchFocus: element.name === "searchTerm" });
    });
  });

  return wrapper;
}

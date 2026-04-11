export function createStatusTag({ label, tone }) {
  const span = document.createElement("span");
  span.className = `status-tag ${tone}`;
  span.textContent = label;
  return span;
}

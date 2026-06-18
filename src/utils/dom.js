export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createToastController(toastElement, durationMs = 2500) {
  let timeoutId = null;

  return {
    show(message, isError = false) {
      toastElement.textContent = message;
      toastElement.classList.toggle("error", isError);
      toastElement.classList.remove("hidden");

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        toastElement.classList.add("hidden");
      }, durationMs);
    },
  };
}

export function bindDelegatedClick(container, selector, handler) {
  container.addEventListener("click", (event) => {
    const target = event.target.closest(selector);
    if (!target || !container.contains(target)) return;
    handler(event, target);
  });
}

const LAYOUT_STYLE_ID = "tailscale-chinese-layout";
const NOWRAP_MARKER = "data-tailscale-zh-nowrap";

const COMPACT_BUTTON_LABELS = new Set([
  "分享…",
  "设备设置",
]);

function getDocumentHead() {
  return typeof document !== "undefined" ? document.head : null;
}

function getElementById(id: string) {
  if (typeof document === "undefined" || typeof document.getElementById !== "function") {
    return null;
  }

  return document.getElementById(id);
}

function ensureLayoutStyle() {
  if (getElementById(LAYOUT_STYLE_ID)) {
    return;
  }

  const head = getDocumentHead();
  if (!head) {
    return;
  }

  const style = document.createElement("style");
  style.id = LAYOUT_STYLE_ID;
  style.textContent = `
    button[${NOWRAP_MARKER}] {
      white-space: nowrap;
    }
  `;
  head.appendChild(style);
}

function clearCompactButtonLayout() {
  getElementById(LAYOUT_STYLE_ID)?.remove();

  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") {
    return;
  }

  for (const button of document.querySelectorAll(`button[${NOWRAP_MARKER}]`)) {
    button.removeAttribute(NOWRAP_MARKER);
  }
}

function applyCompactButtonLayout() {
  ensureLayoutStyle();

  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") {
    return;
  }

  for (const button of document.querySelectorAll("button")) {
    const label = button.textContent?.trim();
    if (!label || !COMPACT_BUTTON_LABELS.has(label)) {
      continue;
    }

    button.setAttribute(NOWRAP_MARKER, "");
  }
}

export function syncAdminNavigationLayout(enabled: boolean) {
  if (!enabled) {
    clearCompactButtonLayout();
    return;
  }

  applyCompactButtonLayout();
}

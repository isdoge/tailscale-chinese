type ExposedWindow = Window & typeof globalThis & {
  __tailscaleChinese?: unknown;
  unsafeWindow?: Window;
};

export function getExposedWindow() {
  const context = globalThis as ExposedWindow;
  return context.unsafeWindow ?? context;
}

import {
  getLanguagePreference,
  setLanguagePreference,
} from "../state/language";

type LocalControlWindow = typeof globalThis & {
  __tailscaleChinese?: unknown;
};

function getLocalControlWindow(): LocalControlWindow {
  return globalThis as LocalControlWindow;
}

export function installControl(rerun: () => void) {
  const api = {
    getLanguage() {
      return getLanguagePreference();
    },
    setLanguage(nextLanguage: string) {
      const language = setLanguagePreference(nextLanguage);
      rerun();
      return language;
    },
    rerun,
  };

  getLocalControlWindow().__tailscaleChinese = api;

  return api;
}

export function uninstallLegacyControl() {
  const exposedWindow = globalThis as LocalControlWindow & {
    unsafeWindow?: LocalControlWindow;
  };

  const legacyWindow = exposedWindow.unsafeWindow;
  if (!legacyWindow || legacyWindow === exposedWindow) {
    return;
  }

  try {
    delete legacyWindow.__tailscaleChinese;
  } catch {
    legacyWindow.__tailscaleChinese = undefined;
  }
}

const STORAGE_KEY = "tailscale-chinese:language";
const DEFAULT_LANGUAGE = "zh-CN";

export function getLanguagePreference() {
  try {
    if (typeof globalThis.GM_getValue === "function") {
      return normalizeLanguagePreference(
        globalThis.GM_getValue(STORAGE_KEY, DEFAULT_LANGUAGE),
      );
    }

    return normalizeLanguagePreference(
      globalThis.localStorage?.getItem(STORAGE_KEY),
    );
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function setLanguagePreference(nextLanguage: string) {
  const language = normalizeLanguagePreference(nextLanguage);

  if (typeof globalThis.GM_setValue === "function") {
    globalThis.GM_setValue(STORAGE_KEY, language);
    return language;
  }

  globalThis.localStorage?.setItem(STORAGE_KEY, language);
  return language;
}

function normalizeLanguagePreference(
  value: string | null | undefined,
): "en" | "zh-CN" {
  return value === "en" ? "en" : DEFAULT_LANGUAGE;
}

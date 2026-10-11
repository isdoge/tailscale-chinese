import { log } from "../utils/log";

type ExactTextDictionary = Record<string, string>;

type RegexTextRule = {
  pattern: string;
  flags?: string;
  replace: string;
};

type AttrRule = {
  match: "exact" | "regex";
  selector: string;
  attr: string;
  from?: string | null;
  to?: string | null;
  pattern?: string | null;
  flags?: string;
  replace?: string | null;
};

type RemoteRules = {
  regexText: RegexTextRule[];
  attr: AttrRule[];
};

type ParsedDictionary = {
  revision: number;
  dictionary: ExactTextDictionary;
  rules: RemoteRules;
  signature: string;
  serialized: string;
};

export type DictionaryStatus = {
  version: string;
  revision: number;
  source: "cache" | "remote" | "none";
  entries: number;
};

const SCRIPT_NAME = "Tailscale Chinese";
const SCRIPT_VERSION = "__SCRIPT_VERSION__";
const DICTIONARY_SOURCES = __DICTIONARY_SOURCES__;
const DICTIONARY_CACHE_KEY = "tailscale-zh-remote-dictionary-v1";
const DICTIONARY_MAX_BYTES = 800_000;
const LOCK_NAME = "tailscale-zh-dictionary-commit-v1";

let currentRevision = 0;
let currentSignature: string | null = null;
let exactText: ExactTextDictionary = {};
let remoteRules: RemoteRules = { regexText: [], attr: [] };
let dictionarySource: DictionaryStatus["source"] = "none";
let dictionaryRequest: Promise<boolean> | null = null;

function dictionarySignature(entries: [string, string][]): string {
  return JSON.stringify(entries.slice().sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function signatureOf(dictionary: ExactTextDictionary): string {
  return dictionarySignature(Object.entries(dictionary));
}

function parseDictionary(raw: string): ParsedDictionary | null {
  if (typeof raw !== "string" || raw.length > DICTIONARY_MAX_BYTES) return null;
  try {
    const bytes = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(raw).length
      : encodeURIComponent(raw).replace(/%[\dA-F]{2}/g, "x").length;
    if (bytes > DICTIONARY_MAX_BYTES) return null;
    const data = JSON.parse(raw) as {
      schemaVersion?: number;
      revision?: number;
      entries?: number;
      dictionary?: unknown;
      rules?: unknown;
    } | null;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    if (data.schemaVersion !== 1 || !Number.isSafeInteger(data.revision)
      || data.revision < 1 || !Number.isSafeInteger(data.entries)) return null;
    const dictionary = data.dictionary;
    const rules = data.rules;
    if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary)) return null;
    if (!rules || typeof rules !== "object" || Array.isArray(rules)
      || !Array.isArray((rules as RemoteRules).regexText)
      || !Array.isArray((rules as RemoteRules).attr)) return null;
    const entries = Object.entries(dictionary as ExactTextDictionary);
    if (entries.length < 20 || entries.length > 5000) return null;
    if (data.entries !== entries.length) return null;
    for (const [key, value] of entries) {
      if (!key.trim() || key.length > 4000 || typeof value !== "string" || !value.trim()
        || value.length > 8000 || ["__proto__", "prototype", "constructor"].includes(key)) return null;
    }
    const serialized = JSON.stringify({
      schemaVersion: 1,
      revision: data.revision,
      entries: entries.length,
      dictionary,
      rules,
    });
    return {
      revision: data.revision,
      dictionary: dictionary as ExactTextDictionary,
      rules: rules as RemoteRules,
      signature: signatureOf(dictionary as ExactTextDictionary),
      serialized,
    };
  } catch {
    return null;
  }
}

function canApply(parsed: ParsedDictionary): boolean {
  if (parsed.revision < currentRevision) return false;
  if (parsed.revision !== currentRevision) return true;
  return currentSignature === null || parsed.signature === currentSignature;
}

function apply(parsed: ParsedDictionary, source: DictionaryStatus["source"]): void {
  exactText = parsed.dictionary;
  remoteRules = parsed.rules;
  currentRevision = parsed.revision;
  currentSignature = parsed.signature;
  dictionarySource = source;
}

function readStored(key: string): string {
  try {
    if (typeof globalThis.GM_getValue === "function") {
      return globalThis.GM_getValue(key, "") as string;
    }
  } catch {
    // fall through
  }
  return "";
}

function loadCached(): void {
  const saved = parseDictionary(readStored(DICTIONARY_CACHE_KEY));
  if (!saved) return;
  if (canApply(saved)) apply(saved, "cache");
}

function requestSource(baseUrl: string, force: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.GM_xmlhttpRequest !== "function") {
      reject(new Error("GM_xmlhttpRequest 不可用"));
      return;
    }
    globalThis.GM_xmlhttpRequest({
      method: "GET",
      url: baseUrl + (force ? "?refresh=" + Date.now() : ""),
      timeout: 8000,
      anonymous: true,
      headers: { Accept: "application/json" },
      onload(response) {
        if (response.status !== 200) {
          reject(new Error("HTTP " + response.status));
          return;
        }
        resolve(response.responseText);
      },
      onerror() {
        reject(new Error("词典请求失败"));
      },
      ontimeout() {
        reject(new Error("词典请求超时"));
      },
      onabort() {
        reject(new Error("词典请求已取消"));
      },
    });
  });
}

function syncShared(strict = false): void {
  let raw = "";
  try {
    raw = typeof globalThis.GM_getValue === "function"
      ? (globalThis.GM_getValue(DICTIONARY_CACHE_KEY, "") as string)
      : "";
  } catch {
    return;
  }
  const shared = parseDictionary(raw);
  if (!shared || shared.revision < currentRevision) return;
  if (shared.revision === currentRevision) {
    if (strict && shared.signature !== currentSignature) {
      throw new Error("同版本词典内容冲突");
    }
    return;
  }
  if (canApply(shared)) apply(shared, "cache");
}

async function persist(parsed: ParsedDictionary, source: DictionaryStatus["source"]): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.locks?.request) {
    throw new Error("浏览器不支持安全的跨标签页词典更新");
  }
  await navigator.locks.request(LOCK_NAME, { mode: "exclusive" }, async () => {
    syncShared(true);
    if (!canApply(parsed)) {
      throw new Error("词典版本冲突");
    }
    globalThis.GM_setValue(DICTIONARY_CACHE_KEY, parsed.serialized);
    apply(parsed, source);
  });
}

async function requestDictionary(force: boolean): Promise<void> {
  for (const url of DICTIONARY_SOURCES) {
    let parsed: ParsedDictionary | null;
    try {
      parsed = parseDictionary(await requestSource(url, force));
    } catch {
      continue;
    }
    if (!parsed || !canApply(parsed)) continue;
    try {
      await persist(parsed, "remote");
      return;
    } catch (error) {
      if ((error as { code?: string }).code === "DICTIONARY_VERSION_CONFLICT"
        || (error as Error).message === "词典版本冲突") {
        continue;
      }
      throw error;
    }
  }
  throw new Error("全部词典来源不可用或版本无效");
}

export async function refreshDictionary(): Promise<boolean> {
  if (dictionaryRequest) return dictionaryRequest;
  try {
    syncShared();
  } catch {
    // 启动期共享缓存冲突不致命。
  }
  dictionaryRequest = (async () => {
    try {
      await requestDictionary(false);
      log(`词典同步成功：${Object.keys(exactText).length} 条`);
      return true;
    } catch {
      log("词典更新失败，继续使用当前词典");
      return false;
    }
  })();
  try {
    return await dictionaryRequest;
  } finally {
    dictionaryRequest = null;
  }
}

export function getDictionaryStatus(): DictionaryStatus {
  return {
    version: SCRIPT_VERSION,
    revision: currentRevision,
    source: dictionarySource,
    entries: Object.keys(exactText).length,
  };
}

export function getRemoteRules(): RemoteRules {
  return remoteRules;
}

export function getExactText(): ExactTextDictionary {
  return exactText;
}

export function setupDictionaryMenu(): void {
  const register = (name: string, callback: () => void) => {
    try {
      globalThis.GM_registerMenuCommand?.(name, callback);
    } catch {
      // 菜单不可用不影响翻译。
    }
  };
  register("立即更新中文词典", () => {
    void refreshDictionary().then((ok) => {
      window.alert(ok ? "中文词典已更新。" : "未能更新，已保留当前词典。请稍后重试。");
    });
  });
  register("查看词典状态", () => {
    const status = getDictionaryStatus();
    const sources: Record<DictionaryStatus["source"], string> = {
      cache: "本地缓存",
      remote: "在线更新",
      none: "未加载",
    };
    window.alert(
      `脚本版本：${status.version}\n词典版本：${status.revision}`
      + `\n来源：${sources[status.source]}\n有效条目：${status.entries}`,
    );
  });
}

export function initRemoteDictionary(onLoaded?: () => void): void {
  loadCached();
  setupDictionaryMenu();
  void refreshDictionary().then((ok) => {
    if (ok && onLoaded) onLoaded();
  });
}

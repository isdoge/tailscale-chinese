import { syncAdminNavigationLayout } from "./admin-layout";
import { installControl, uninstallLegacyControl } from "./control";
import { observeNavigation } from "./navigation";
import { resolveRules } from "./page-detector";
import { observeDocument } from "./observer";
import { restoreDocument, translateDocument } from "./translator";
import { getLanguagePreference } from "../state/language";
import { log } from "../utils/log";

let documentObserver: ReturnType<typeof observeDocument> = null;
let lastTranslatedPath: string | null = null;

function runTranslation() {
  documentObserver?.disconnect();

  try {
    const root = document.body;
    const pathname = window.location.pathname;

    if (getLanguagePreference() !== "zh-CN") {
      restoreDocument(root);
      syncAdminNavigationLayout(false);
      lastTranslatedPath = null;
      log("language preference is not zh-CN, restored original content");
      return 0;
    }

    if (lastTranslatedPath !== pathname) {
      restoreDocument(root);
    }

    const rules = resolveRules(pathname);
    const changedCount = translateDocument(root, rules);
    syncAdminNavigationLayout(true);
    lastTranslatedPath = pathname;
    if (changedCount > 0) {
      log(`translated ${changedCount} nodes on ${pathname}`);
    }
    return changedCount;
  } finally {
    documentObserver?.reconnect();
  }
}

function createScheduledRunner(runNow: () => void) {
  let scheduled = false;
  let settleTimers: ReturnType<typeof setTimeout>[] = [];

  return () => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    const flush = () => {
      scheduled = false;
      runNow();

      const settle = () => {
        runNow();
      };

      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(settle);
      } else {
        queueMicrotask(settle);
      }

      for (const timer of settleTimers) {
        clearTimeout(timer);
      }
      settleTimers = [200, 500, 1000].map((delay) =>
        setTimeout(() => {
          runNow();
        }, delay),
      );
    };

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(flush);
      return;
    }

    queueMicrotask(flush);
  };
}

function installHoverRerun(rerun: () => void) {
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  document.addEventListener("mouseover", () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }

    hoverTimer = setTimeout(() => {
      hoverTimer = null;
      rerun();
    }, 150);
  }, { passive: true });
}

export function bootstrap() {
  if (!window.location.hostname.endsWith("tailscale.com")) {
    return;
  }

  const start = () => {
    const rerun = createScheduledRunner(runTranslation);
    uninstallLegacyControl();
    installControl(runTranslation);
    installHoverRerun(rerun);
    runTranslation();
    documentObserver = observeDocument(rerun);
    observeNavigation(rerun);
    log("Tailscale Chinese userscript bootstrapped");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
    return;
  }

  start();
}

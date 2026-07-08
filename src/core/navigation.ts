export function observeNavigation(onNavigate: () => void) {
  let currentUrl = window.location.href;

  const notifyIfChanged = () => {
    const nextUrl = window.location.href;
    if (nextUrl === currentUrl) {
      return;
    }

    currentUrl = nextUrl;
    onNavigate();
  };

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = (...args) => {
    const result = originalPushState(...args);
    notifyIfChanged();
    return result;
  };

  window.history.replaceState = (...args) => {
    const result = originalReplaceState(...args);
    notifyIfChanged();
    return result;
  };

  window.addEventListener("popstate", notifyIfChanged);
  window.addEventListener("hashchange", notifyIfChanged);

  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", notifyIfChanged);
    window.removeEventListener("hashchange", notifyIfChanged);
  };
}

const OBSERVED_ATTRIBUTES = ["aria-label", "title", "placeholder", "data-content"];

export type DocumentObserver = {
  disconnect: () => void;
  reconnect: () => void;
};

export function observeDocument(onMutation: () => void): DocumentObserver | null {
  if (!document.body) {
    return null;
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      onMutation();
    });
  });

  const observe = () => {
    observer.observe(document.body!, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: OBSERVED_ATTRIBUTES,
    });
  };

  observe();

  return {
    disconnect() {
      observer.disconnect();
    },
    reconnect() {
      observer.disconnect();
      observe();
    },
  };
}

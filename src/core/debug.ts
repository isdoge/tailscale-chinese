type CaptureFloatingTextOptions = {
  keywords?: string[];
  pause?: boolean;
};

type CapturedFloatingText = {
  keyword: string | null;
  text: string;
  html: string;
  element: Element;
};

const capturedFloatingTexts: CapturedFloatingText[] = [];
const capturedHtmlSet = new Set<string>();

function findMatchedKeyword(text: string, keywords: string[]) {
  if (keywords.length === 0) {
    return null;
  }

  return keywords.find((keyword) => text.includes(keyword)) ?? null;
}

function nodeMatchesKeywords(text: string, keywords: string[]) {
  return findMatchedKeyword(text, keywords) !== null;
}

function rememberFloatingNode(
  element: Element,
  keywords: string[],
  pause: boolean,
) {
  const text = element.textContent ?? "";
  const html = element.outerHTML;
  const keyword = findMatchedKeyword(text, keywords);

  if (capturedHtmlSet.has(html)) {
    return;
  }

  capturedHtmlSet.add(html);
  capturedFloatingTexts.push({
    keyword,
    text,
    html,
    element,
  });

  console.log(
    "[tailscale-chinese] captured floating text",
    keyword ? `(matched: ${keyword})` : "",
    element,
  );
  console.log(html);

  if (pause) {
    debugger;
  }
}

function inspectFloatingNode(node: Node, keywords: string[], pause: boolean) {
  if (node.nodeType !== 1) {
    return;
  }

  const element = node as Element;
  const text = element.textContent ?? "";
  const isTooltip = element.getAttribute("role") === "tooltip"
    || element.matches?.('[role="tooltip"]')
    || element.closest?.('[role="tooltip"]') !== null;
  const looksLikeFloatingLayer = Boolean(
    element.getAttribute("data-state")
    || element.getAttribute("data-radix-popper-content-wrapper") !== null
    || element.classList?.contains("TooltipContent"),
  );
  const matchesKeyword = nodeMatchesKeywords(text, keywords);
  const shouldLog = keywords.length === 0
    ? isTooltip || looksLikeFloatingLayer
    : matchesKeyword;

  if (shouldLog) {
    rememberFloatingNode(element, keywords, pause);
  }

  for (const tooltip of element.querySelectorAll('[role="tooltip"]')) {
    const tooltipText = tooltip.textContent ?? "";
    if (keywords.length === 0 || nodeMatchesKeywords(tooltipText, keywords)) {
      rememberFloatingNode(tooltip, keywords, pause);
    }
  }
}

export function captureFloatingText(options: CaptureFloatingTextOptions = {}) {
  const keywords = options.keywords ?? [];
  const pause = options.pause ?? true;

  capturedFloatingTexts.length = 0;
  capturedHtmlSet.clear();

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        inspectFloatingNode(node, keywords, pause);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log(
    "[tailscale-chinese] captureFloatingText listening",
    keywords.length > 0 ? keywords : "(all tooltips)",
  );
  console.log(
    "[tailscale-chinese] keywords use OR matching: any one hit will capture.",
  );
  console.log(
    "[tailscale-chinese] view results: __tailscaleChinese.getCapturedFloatingTexts()",
  );

  const stop = () => {
    observer.disconnect();
    console.log(
      `[tailscale-chinese] captureFloatingText stopped, captured ${capturedFloatingTexts.length} item(s)`,
    );
  };

  return stop;
}

export function getCapturedFloatingTexts() {
  return capturedFloatingTexts.map(({ keyword, text, html }) => ({
    keyword,
    text,
    html,
  }));
}

export function clearCapturedFloatingTexts() {
  capturedFloatingTexts.length = 0;
  capturedHtmlSet.clear();
}

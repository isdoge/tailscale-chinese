const textSnapshots = new WeakMap();
const attrSnapshots = new WeakMap();

export const SKIP_TRANSLATION = Symbol("skip-translation");

export function isSkipTranslation(value: unknown): value is typeof SKIP_TRANSLATION {
  return value === SKIP_TRANSLATION;
}

export function isTextAlreadyTranslated(node: Text) {
  const snapshot = textSnapshots.get(node);
  if (!snapshot || snapshot.translated === null) {
    return false;
  }

  return (node.textContent ?? "") === snapshot.translated;
}

export function prepareTextSource(node: Text) {
  const currentText = node.textContent ?? "";
  const snapshot = textSnapshots.get(node);

  if (!snapshot) {
    return currentText;
  }

  if (isTextAlreadyTranslated(node)) {
    return SKIP_TRANSLATION;
  }

  if (currentText !== snapshot.original) {
    snapshot.original = currentText;
    snapshot.translated = null;
  }

  return node.textContent ?? "";
}

export function hasGroupedDrift(groupedNodes: Text[]) {
  return groupedNodes.some((node) => {
    const current = node.textContent ?? "";
    const snapshot = textSnapshots.get(node);
    if (!snapshot || snapshot.translated === null) {
      return false;
    }

    if (current === snapshot.translated) {
      return false;
    }

    if (current === "" && snapshot.translated === "") {
      return false;
    }

    return true;
  });
}

export function getGroupedFragmentSources(groupedNodes: Text[]) {
  return groupedNodes.map((node) => {
    const current = node.textContent ?? "";
    const snapshot = textSnapshots.get(node);
    if (current.length > 0 && current !== snapshot?.translated) {
      return current;
    }

    return snapshot?.original ?? current;
  });
}

export function buildGroupedSource(groupedNodes: Text[]) {
  if (!hasGroupedDrift(groupedNodes)) {
    return groupedNodes.map((node) => node.textContent ?? "").join("");
  }

  return getGroupedFragmentSources(groupedNodes).join("");
}

export function rememberTextTranslation(
  node: Text,
  originalText: string,
  translatedText: string,
) {
  textSnapshots.set(node, {
    original: originalText,
    translated: translatedText,
  });
}

export function restoreTextNode(node: Text) {
  const snapshot = textSnapshots.get(node);
  if (!snapshot) {
    return false;
  }

  const currentText = node.textContent ?? "";
  if (snapshot.translated !== null && currentText === snapshot.translated) {
    node.textContent = snapshot.original;
    snapshot.translated = null;
    return true;
  }

  if (currentText !== snapshot.original) {
    snapshot.original = currentText;
    snapshot.translated = null;
  }

  return false;
}

export function prepareAttributeSource(element: Element, attributeName: string) {
  const currentValue = element.getAttribute(attributeName);
  if (currentValue === null) {
    return null;
  }

  const attributeMap = attrSnapshots.get(element);
  const snapshot = attributeMap?.get(attributeName);
  if (!snapshot) {
    return currentValue;
  }

  if (snapshot.translated !== null && currentValue === snapshot.translated) {
    return SKIP_TRANSLATION;
  }

  if (currentValue !== snapshot.original) {
    snapshot.original = currentValue;
    snapshot.translated = null;
  }

  return element.getAttribute(attributeName);
}

export function rememberAttributeTranslation(
  element: Element,
  attributeName: string,
  originalValue: string,
  translatedValue: string,
) {
  const attributeMap = ensureAttributeMap(element);
  attributeMap.set(attributeName, {
    original: originalValue,
    translated: translatedValue,
  });
}

export function restoreTrackedAttributes(element: Element) {
  const attributeMap = attrSnapshots.get(element);
  if (!attributeMap) {
    return 0;
  }

  let restoredCount = 0;
  for (const [attributeName, snapshot] of attributeMap.entries()) {
    const currentValue = element.getAttribute(attributeName);
    if (snapshot.translated !== null && currentValue === snapshot.translated) {
      setAttributeValue(element, attributeName, snapshot.original);
      snapshot.translated = null;
      restoredCount += 1;
      continue;
    }

    if (currentValue !== snapshot.original) {
      snapshot.original = currentValue;
      snapshot.translated = null;
    }
  }

  return restoredCount;
}

function ensureAttributeMap(element: Element) {
  const existingMap = attrSnapshots.get(element);
  if (existingMap) {
    return existingMap;
  }

  const nextMap = new Map();
  attrSnapshots.set(element, nextMap);
  return nextMap;
}

function setAttributeValue(
  element: Element,
  attributeName: string,
  value: string | null,
) {
  if (value === null) {
    element.removeAttribute(attributeName);
    return;
  }

  element.setAttribute(attributeName, value);
}

import { applyAttrRule, applyTextRules } from "./matcher";
import {
  buildGroupedSource,
  getGroupedFragmentSources,
  hasGroupedDrift,
  isSkipTranslation,
  isTextAlreadyTranslated,
  prepareAttributeSource,
  prepareTextSource,
  rememberAttributeTranslation,
  rememberTextTranslation,
  restoreTextNode,
  restoreTrackedAttributes,
  SKIP_TRANSLATION,
} from "./originals";
import { selectElements, walkElements, walkTextNodes } from "../utils/dom";
import type { AttrRule, TextRule, TranslationRule } from "../types";

export function translateDocument(
  root: ParentNode | null,
  rules: TranslationRule[],
) {
  if (!root) {
    return 0;
  }

  const textRules = rules.filter((rule) => rule.kind === "text") as TextRule[];
  const attrRules = rules.filter((rule) => rule.kind === "attr") as AttrRule[];
  const attrSources = new WeakMap<Element, Map<string, string | null>>();
  const translatedAttrs = new WeakMap<Element, Set<string>>();
  const consumedTextNodes = new WeakSet<Text>();
  let changedCount = 0;

  for (const node of walkTextNodes(root)) {
    if (consumedTextNodes.has(node)) {
      continue;
    }

    const groupedNodes = collectTextSiblings(node);
    if (groupedNodes.length > 1) {
      if (!hasGroupedDrift(groupedNodes) && groupedNodes.every(isTextAlreadyTranslated)) {
        for (const groupNode of groupedNodes) {
          consumedTextNodes.add(groupNode);
        }
        continue;
      }

      const groupedSource = buildGroupedSource(groupedNodes);
      const groupedNext = applyTextRules(groupedSource, textRules);

      if (groupedNext && groupedNext !== groupedSource) {
        const fragmentSources = getGroupedFragmentSources(groupedNodes);
        groupedNodes[0].textContent = groupedNext;
        rememberTextTranslation(groupedNodes[0], fragmentSources[0], groupedNext);
        changedCount += 1;

        for (let index = 1; index < groupedNodes.length; index += 1) {
          const groupNode = groupedNodes[index];
          groupNode.textContent = "";
          rememberTextTranslation(groupNode, fragmentSources[index], "");
          consumedTextNodes.add(groupNode);
          changedCount += 1;
        }

        consumedTextNodes.add(groupedNodes[0]);
        continue;
      }
    }

    if (isTextAlreadyTranslated(node)) {
      consumedTextNodes.add(node);
      continue;
    }

    const inlineGroup = collectInlineGroup(node);
    if (inlineGroup) {
      if (inlineGroup.textNodes.every(isTextAlreadyTranslated)) {
        for (const textNode of inlineGroup.textNodes) {
          consumedTextNodes.add(textNode);
        }
        continue;
      }

      const inlineSource = buildInlineGroupSource(inlineGroup.segments);
      if (isSkipTranslation(inlineSource)) {
        continue;
      }

      const inlineNext = applyTextRules(inlineSource, textRules);

      if (inlineNext && inlineNext !== inlineSource) {
        if (applyInlineGroupTranslation(inlineGroup.segments, inlineNext)) {
          for (const textNode of inlineGroup.textNodes) {
            consumedTextNodes.add(textNode);
          }
          changedCount += 1;
          continue;
        }
      }
    }

    const originalText = prepareTextSource(node);
    if (isSkipTranslation(originalText)) {
      continue;
    }

    const nextText = applyTextRules(originalText, textRules);

    if (!nextText || nextText === originalText) {
      continue;
    }

    node.textContent = nextText;
    rememberTextTranslation(node, originalText, nextText);
    changedCount += 1;
  }

  for (const rule of attrRules) {
    for (const element of selectElements(root, rule.selector)) {
      if (hasTranslatedAttribute(translatedAttrs, element, rule.attr)) {
        continue;
      }

      const originalValue = getAttributeSource(
        attrSources,
        element,
        rule.attr,
      );
      if (originalValue === null) {
        continue;
      }

      const nextValue = applyAttrRule(originalValue, rule);
      if (!nextValue || nextValue === originalValue) {
        continue;
      }

      element.setAttribute(rule.attr, nextValue);
      rememberAttributeTranslation(element, rule.attr, originalValue, nextValue);
      markTranslatedAttribute(translatedAttrs, element, rule.attr);
      changedCount += 1;
    }
  }

  return changedCount;
}

export function restoreDocument(root: ParentNode | null) {
  if (!root) {
    return 0;
  }

  let restoredCount = 0;

  for (const node of walkTextNodes(root, { includeEmpty: true })) {
    restoredCount += restoreTextNode(node) ? 1 : 0;
  }

  for (const element of walkElements(root)) {
    restoredCount += restoreTrackedAttributes(element);
  }

  return restoredCount;
}

function getAttributeSource(
  cache: WeakMap<Element, Map<string, string | null>>,
  element: Element,
  attributeName: string,
) {
  const cachedAttributes = cache.get(element);
  if (cachedAttributes?.has(attributeName)) {
    return cachedAttributes.get(attributeName) ?? null;
  }

  const originalValue = prepareAttributeSource(element, attributeName);
  if (originalValue === null || isSkipTranslation(originalValue)) {
    return null;
  }

  const nextAttributes = cachedAttributes ?? new Map();
  nextAttributes.set(attributeName, originalValue);
  cache.set(element, nextAttributes);
  return originalValue;
}

function hasTranslatedAttribute(
  cache: WeakMap<Element, Set<string>>,
  element: Element,
  attributeName: string,
) {
  return cache.get(element)?.has(attributeName) ?? false;
}

function markTranslatedAttribute(
  cache: WeakMap<Element, Set<string>>,
  element: Element,
  attributeName: string,
) {
  const translated = cache.get(element) ?? new Set();
  translated.add(attributeName);
  cache.set(element, translated);
}

const INLINE_TAGS = new Set([
  "CODE",
  "STRONG",
  "EM",
  "B",
  "I",
  "SPAN",
  "A",
  "SMALL",
  "SUB",
  "SUP",
  "MARK",
  "ABBR",
  "KBD",
  "SAMP",
  "VAR",
  "TIME",
]);

type TextSegment = {
  kind: "text";
  node: Text;
};

type InlineSegment = {
  kind: "inline";
  value: string;
};

type BreakSegment = {
  kind: "break";
};

type InlineGroupSegment = TextSegment | InlineSegment | BreakSegment;

type InlineGroup = {
  segments: InlineGroupSegment[];
  textNodes: Text[];
};

function isInlineElement(node: Node): node is Element {
  return node.nodeType === 1 && INLINE_TAGS.has((node as Element).tagName);
}

function isIgnorablePrefixNode(node: Node) {
  if (node.nodeType === 3) {
    return (node.textContent ?? "").trim().length === 0;
  }

  return node.nodeType === 1 && isInlineElement(node);
}

function collectInlineGroup(node: Text): InlineGroup | null {
  const parent = node.parentElement ?? node.parentNode;
  if (!parent) {
    return null;
  }

  const siblings = Array.from(parent.childNodes);
  const index = siblings.indexOf(node);
  if (index < 0) {
    return null;
  }

  for (let siblingIndex = 0; siblingIndex < index; siblingIndex += 1) {
    const sibling = siblings[siblingIndex];
    if (!sibling || isIgnorablePrefixNode(sibling)) {
      continue;
    }

    return null;
  }

  const segments: InlineGroupSegment[] = [];
  const textNodes: Text[] = [];
  let hasInlineElement = false;

  for (let siblingIndex = index; siblingIndex < siblings.length; siblingIndex += 1) {
    const sibling = siblings[siblingIndex];
    if (!sibling) {
      break;
    }

    if (sibling.nodeType === 3) {
      segments.push({ kind: "text", node: sibling as Text });
      textNodes.push(sibling as Text);
      continue;
    }

    if (sibling.nodeType === 1 && (sibling as Element).tagName === "BR") {
      segments.push({ kind: "break" });
      continue;
    }

    if (isInlineElement(sibling)) {
      hasInlineElement = true;
      segments.push({
        kind: "inline",
        value: sibling.textContent ?? "",
      });
      continue;
    }

    break;
  }

  if (!hasInlineElement || segments.length < 2) {
    return null;
  }

  return { segments, textNodes };
}

function buildInlineGroupSource(segments: InlineGroupSegment[]) {
  let source = "";

  for (const segment of segments) {
    if (segment.kind === "break") {
      source += " ";
      continue;
    }

    if (segment.kind === "text") {
      const textSource = prepareTextSource(segment.node);
      if (isSkipTranslation(textSource)) {
        return SKIP_TRANSLATION;
      }

      source += textSource;
      continue;
    }

    source += segment.value;
  }

  return source.replace(/\s+/g, " ").trim();
}

function applyInlineGroupTranslation(
  segments: InlineGroupSegment[],
  translated: string,
) {
  const inlineValues = segments
    .filter((segment): segment is InlineSegment => segment.kind === "inline")
    .map((segment) => segment.value);
  const textSegments = segments
    .filter((segment): segment is TextSegment => segment.kind === "text");

  let remainder = translated;
  const textParts: string[] = [];

  for (const inlineValue of inlineValues) {
    const inlineIndex = remainder.indexOf(inlineValue);
    if (inlineIndex < 0) {
      return false;
    }

    textParts.push(remainder.slice(0, inlineIndex));
    remainder = remainder.slice(inlineIndex + inlineValue.length);
  }

  textParts.push(remainder);

  if (textParts.length !== textSegments.length) {
    return false;
  }

  for (let index = 0; index < textSegments.length; index += 1) {
    const segment = textSegments[index];
    const originalText = prepareTextSource(segment.node);
    const nextText = textParts[index];

    if (nextText === originalText) {
      continue;
    }

    segment.node.textContent = nextText;
    rememberTextTranslation(segment.node, originalText, nextText);
  }

  return true;
}

function collectTextSiblings(node: Text) {
  const parent = node.parentElement ?? node.parentNode;
  if (!parent) {
    return [node];
  }

  const siblings = Array.from(parent.childNodes);
  const index = siblings.indexOf(node);
  if (index < 0) {
    return [node];
  }

  let start = index;
  while (start > 0 && siblings[start - 1]?.nodeType === 3) {
    start -= 1;
  }

  const textSiblings = [];
  for (let siblingIndex = start; siblingIndex < siblings.length; siblingIndex += 1) {
    const sibling = siblings[siblingIndex];
    if (sibling?.nodeType !== 3) {
      break;
    }

    textSiblings.push(sibling as Text);
  }

  return textSiblings;
}

import type { AttrRule, TextRule } from "../types";

export function applyTextRules(
  originalText: string,
  rules: TextRule[],
) {
  for (const rule of rules) {
    const nextText = applyTextRule(originalText, rule);
    if (nextText && nextText !== originalText) {
      return nextText;
    }
  }

  return null;
}

export function applyAttrRule(originalValue: string, rule: AttrRule) {
  if (rule.match === "exact") {
    return originalValue === rule.from ? rule.to : null;
  }

  const pattern = new RegExp(rule.pattern, rule.flags);
  return pattern.test(originalValue)
    ? originalValue.replace(pattern, rule.replace)
    : null;
}

function applyTextRule(originalText: string, rule: TextRule) {
  if (rule.match === "exact") {
    const trimmedText = originalText.trim();
    if (trimmedText !== rule.from) {
      return null;
    }

    return originalText.replace(trimmedText, rule.to);
  }

  const pattern = new RegExp(rule.pattern, rule.flags);
  return pattern.test(originalText)
    ? originalText.replace(pattern, rule.replace)
    : null;
}

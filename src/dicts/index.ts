import { getExactText, getRemoteRules } from "../core/remote-dictionary";
import type { TranslationRule } from "../types";

// 词典数据来自在线 envelope（GM 缓存优先，启动时尝试更新）。
// exact text 规则由 envelope.dictionary 展开；regex / attr 规则随 envelope.rules 外置。
// 合并后的规则集在 match 命中即返回，冲突键已在提取时裁决。

export const sharedRules: TranslationRule[] = [];

export function rebuildSharedRules(): TranslationRule[] {
  sharedRules.length = 0;
  for (const [from, to] of Object.entries(getExactText())) {
    sharedRules.push({ kind: "text", match: "exact", from, to });
  }
  for (const rule of getRemoteRules().regexText) {
    sharedRules.push({ kind: "text", match: "regex", pattern: rule.pattern, flags: rule.flags, replace: rule.replace });
  }
  for (const rule of getRemoteRules().attr) {
    if (rule.match === "exact" && rule.from && rule.to) {
      sharedRules.push({ kind: "attr", match: "exact", selector: rule.selector, attr: rule.attr, from: rule.from, to: rule.to });
    } else if (rule.match === "regex" && rule.pattern && rule.replace) {
      sharedRules.push({ kind: "attr", match: "regex", selector: rule.selector, attr: rule.attr, pattern: rule.pattern, flags: rule.flags || undefined, replace: rule.replace });
    }
  }
  return sharedRules;
}

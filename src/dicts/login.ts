import type { TranslationRule } from "../types";

export const loginDictionary: TranslationRule[] = [
  {
    kind: "text",
    match: "regex",
    pattern: "^Continue with (.+)$",
    replace: "使用 $1 继续",
  },
  {
    kind: "attr",
    match: "exact",
    selector: 'input[type="email"]',
    attr: "placeholder",
    from: "Email",
    to: "邮箱",
  },
];

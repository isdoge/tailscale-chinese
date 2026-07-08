export type LanguagePreference = "en" | "zh-CN";

export type ExactTextRule = {
  kind: "text";
  match: "exact";
  from: string;
  to: string;
};

export type RegexTextRule = {
  kind: "text";
  match: "regex";
  pattern: string;
  flags?: string;
  replace: string;
};

export type ExactAttrRule = {
  kind: "attr";
  match: "exact";
  selector: string;
  attr: string;
  from: string;
  to: string;
};

export type RegexAttrRule = {
  kind: "attr";
  match: "regex";
  selector: string;
  attr: string;
  pattern: string;
  flags?: string;
  replace: string;
};

export type TextRule = ExactTextRule | RegexTextRule;
export type AttrRule = ExactAttrRule | RegexAttrRule;
export type TranslationRule = TextRule | AttrRule;
export type TextReplacement = TranslationRule;

export type PageDictionary = {
  route: RegExp;
  rules: TranslationRule[];
};

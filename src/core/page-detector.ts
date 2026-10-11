import { sharedRules } from "../dicts";
import type { TranslationRule } from "../types";

// 词典来自在线 envelope：规则合并时冲突键已裁决，无需按路由裁剪。
export function resolveRules(_pathname: string): TranslationRule[] {
  return sharedRules;
}

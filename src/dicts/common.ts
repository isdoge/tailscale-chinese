import type { TranslationRule } from "../types";

export const commonDictionary: TranslationRule[] = [
  { kind: "text", match: "exact", from: "Sign in", to: "登录" },
  { kind: "text", match: "exact", from: "Get started", to: "开始使用" },
  { kind: "text", match: "exact", from: "Manage account", to: "管理账户" },
  { kind: "text", match: "exact", from: "Cancel", to: "取消" },
  { kind: "text", match: "exact", from: "Save", to: "保存" },
  { kind: "text", match: "exact", from: "Apply", to: "应用" },
  { kind: "text", match: "exact", from: "Filters", to: "筛选" },
  { kind: "text", match: "exact", from: "Reset", to: "重置" },
  { kind: "text", match: "exact", from: "Discard changes", to: "放弃更改" },
];

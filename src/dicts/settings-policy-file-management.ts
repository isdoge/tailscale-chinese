import { adminShellDictionary } from "./admin-shell";
import { settingsShellDictionary } from "./settings-shell";
import type { TranslationRule } from "../types";

const settingsPolicyFileManagementRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "Manage how your policy file is maintained.",
    to: "管理你的策略文件维护方式。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Lock editor",
    to: "锁定编辑器",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Prevent users from editing policies in the admin console to avoid conflicts with external management workflows like GitOps or Terraform\\.",
    replace: "防止用户在管理控制台中编辑策略，以避免与 GitOps 或 Terraform 等外部管理流程冲突。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Prevent edits in the admin console",
    to: "禁止在管理控制台中编辑",
  },
  {
    kind: "text",
    match: "exact",
    from: "External reference",
    to: "外部引用",
  },
  {
    kind: "text",
    match: "exact",
    from: "Link to your external tailnet policy definition or management solution.",
    to: "链接到你的外部 tailnet 策略定义或管理方案。",
  },
];

export const settingsPolicyFileManagementDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...settingsShellDictionary,
  ...settingsPolicyFileManagementRules,
];

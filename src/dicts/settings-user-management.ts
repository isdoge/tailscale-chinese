import { adminShellDictionary } from "./admin-shell";
import { settingsShellDictionary } from "./settings-shell";
import type { TranslationRule } from "../types";

const settingsUserManagementRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "Manage your tailnet user settings.",
    to: "管理你的 tailnet 用户设置。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Identity Provider",
    to: "身份提供商",
  },
  {
    kind: "text",
    match: "exact",
    from: "How users log in to your tailnet.",
    to: "用户如何登录到你的 tailnet。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Contact support",
    to: "联系支持",
  },
  {
    kind: "text",
    match: "exact",
    from: "to change this.",
    to: "以更改此项。",
  },
  {
    kind: "text",
    match: "exact",
    from: "User Approval",
    to: "用户审批",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Require new users to be approved by admins before\\s+they can access the network\\.",
    replace: "要求新用户在访问网络前先由管理员审批。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Manually approve new users",
    to: "手动审批新用户",
  },
  {
    kind: "text",
    match: "exact",
    from: "Admin Console Session Timeout",
    to: "管理控制台会话超时",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Users with access to the Admin console will be logged out\\s+after this time period of inactivity\\.",
    replace: "可访问管理控制台的用户在此时长未活动后将被登出。",
  },
  {
    kind: "text",
    match: "exact",
    from: "36 hours",
    to: "36 小时",
  },
  {
    kind: "text",
    match: "exact",
    from: "Edit",
    to: "编辑",
  },
];

export const settingsUserManagementDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...settingsShellDictionary,
  ...settingsUserManagementRules,
];

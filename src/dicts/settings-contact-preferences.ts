import { adminShellDictionary } from "./admin-shell";
import { settingsShellDictionary } from "./settings-shell";
import type { TranslationRule } from "../types";

const settingsContactPreferencesRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "Define points of contact for different kinds of transactional emails. We will only use these to send essential communications related to the functioning of your tailnet, not marketing-related content. As such, you can’t opt out, and all emails must be verified.",
    to: "为不同类型的事务邮件指定联系人。我们只会用它们发送与 tailnet 运行相关的必要通信，不会发送营销内容。因此你无法选择退出，且所有邮箱都必须完成验证。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Account changes",
    to: "账户变更",
  },
  {
    kind: "text",
    match: "exact",
    from: "Receive communications about important changes to your tailnet.",
    to: "接收有关 tailnet 重要变更的通知。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Configuration issues",
    to: "配置问题",
  },
  {
    kind: "text",
    match: "exact",
    from: "Receive communications about misconfigurations in your tailnet.",
    to: "接收有关 tailnet 配置错误的通知。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Security issues",
    to: "安全问题",
  },
  {
    kind: "text",
    match: "exact",
    from: "Receive communications about security issues affecting your tailnet.",
    to: "接收有关影响你 tailnet 的安全问题通知。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Billing email",
    to: "计费邮箱",
  },
  {
    kind: "text",
    match: "exact",
    from: "Receive communications about billing matters.",
    to: "接收与计费事项有关的通知。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Manage in Billing",
    to: "在计费页管理",
  },
];

export const settingsContactPreferencesDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...settingsShellDictionary,
  ...settingsContactPreferencesRules,
];

import { adminShellDictionary } from "./admin-shell";
import { settingsShellDictionary } from "./settings-shell";
import type { TranslationRule } from "../types";

const settingsWebhooksRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "Get notified of changes and misconfigurations in your tailnet.",
    to: "在你的 tailnet 发生变更或配置错误时接收通知。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Endpoints",
    to: "端点",
  },
  {
    kind: "text",
    match: "exact",
    from: "View and manage endpoints.",
    to: "查看并管理端点。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Add endpoint...",
    to: "添加端点...",
  },
  {
    kind: "text",
    match: "exact",
    from: "Add endpoint",
    to: "添加端点",
  },
  {
    kind: "text",
    match: "exact",
    from: "You don’t have any endpoints yet",
    to: "你还没有任何端点",
  },
  {
    kind: "text",
    match: "exact",
    from: "Webhook URL",
    to: "Webhook URL",
  },
  {
    kind: "text",
    match: "exact",
    from: "Events selected below will trigger an HTTPS POST request to this URL.",
    to: "下方选择的事件会触发一个发送到此 URL 的 HTTPS POST 请求。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Destination",
    to: "目标平台",
  },
  {
    kind: "text",
    match: "exact",
    from: "optional",
    to: "可选",
  },
  {
    kind: "text",
    match: "exact",
    from: "If selected, we’ll send your webhook events in the format expected by your destination.",
    to: "如果选择了目标平台，我们会按该平台期望的格式发送 webhook 事件。",
  },
  {
    kind: "text",
    match: "exact",
    from: "None",
    to: "无",
  },
  {
    kind: "text",
    match: "exact",
    from: "Events",
    to: "事件",
  },
  {
    kind: "text",
    match: "exact",
    from: "Tailnet Management",
    to: "Tailnet 管理",
  },
  {
    kind: "text",
    match: "exact",
    from: "Node was created.",
    to: "节点已创建。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Node needs approval.",
    to: "节点需要批准。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Node was approved.",
    to: "节点已批准。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Node key expiring in less than one day.",
    to: "节点密钥将在一天内过期。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Node key recently expired.",
    to: "节点密钥刚刚过期。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Node was deleted.",
    to: "节点已删除。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Node needs a signature.",
    to: "节点需要签名。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Node was signed.",
    to: "节点已签名。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Tailnet policy file updated.",
    to: "Tailnet 策略文件已更新。",
  },
  {
    kind: "text",
    match: "exact",
    from: "User was created.",
    to: "用户已创建。",
  },
  {
    kind: "text",
    match: "exact",
    from: "User needs approval.",
    to: "用户需要批准。",
  },
  {
    kind: "text",
    match: "exact",
    from: "User was suspended.",
    to: "用户已停用。",
  },
  {
    kind: "text",
    match: "exact",
    from: "User was restored.",
    to: "用户已恢复。",
  },
  {
    kind: "text",
    match: "exact",
    from: "User was deleted.",
    to: "用户已删除。",
  },
  {
    kind: "text",
    match: "exact",
    from: "User was approved.",
    to: "用户已批准。",
  },
  {
    kind: "text",
    match: "exact",
    from: "User role changed.",
    to: "用户角色已变更。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Device Misconfigurations",
    to: "设备配置错误",
  },
  {
    kind: "text",
    match: "exact",
    from: "Subnet has IP forwarding disabled.",
    to: "子网未启用 IP 转发。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Exit node has IP forwarding disabled.",
    to: "出口节点未启用 IP 转发。",
  },
];

export const settingsWebhooksDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...settingsShellDictionary,
  ...settingsWebhooksRules,
];

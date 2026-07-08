import { adminShellDictionary } from "./admin-shell";
import type { TranslationRule } from "../types";

const resourceHubRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "Explore what you can do with Tailscale",
    to: "探索你可以用 Tailscale 做什么",
  },
  {
    kind: "text",
    match: "exact",
    from: "I want to...",
    to: "我想要……",
  },
  {
    kind: "text",
    match: "exact",
    from: "Send files to different devices",
    to: "向不同设备发送文件",
  },
  {
    kind: "text",
    match: "exact",
    from: "Access my home network",
    to: "访问我的家庭网络",
  },
  {
    kind: "text",
    match: "exact",
    from: "Host my own cloud storage",
    to: "自托管我的云存储",
  },
  {
    kind: "text",
    match: "exact",
    from: "Install Tailscale on my Apple TV",
    to: "在我的 Apple TV 上安装 Tailscale",
  },
  {
    kind: "text",
    match: "exact",
    from: "Other",
    to: "其他",
  },
  {
    kind: "text",
    match: "exact",
    from: "Taildrop allows you to share files seamlessly with any of your devices.",
    to: "Taildrop 让你可以在任意设备之间无缝共享文件。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Read guide",
    to: "阅读指南",
  },
  {
    kind: "text",
    match: "exact",
    from: "Taildrop lets you send files between your personal devices on a Tailscale network (known as a tailnet).",
    to: "Taildrop 让你可以在 Tailscale 网络（即 tailnet）中的个人设备之间发送文件。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Was this helpful?",
    to: "这对你有帮助吗？",
  },
  {
    kind: "text",
    match: "exact",
    from: "Yes",
    to: "是",
  },
  {
    kind: "text",
    match: "exact",
    from: "No",
    to: "否",
  },
  {
    kind: "text",
    match: "exact",
    from: "I’m not interested in this use case",
    to: "我对这个使用场景不感兴趣",
  },
];

export const resourceHubDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...resourceHubRules,
];

import { adminShellDictionary } from "./admin-shell";
import { settingsShellDictionary } from "./settings-shell";
import type { TranslationRule } from "../types";

const settingsGeneralRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "Manage your tailnet account settings.",
    to: "管理你的 tailnet 账户设置。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Unique IDs",
    to: "唯一 ID",
  },
  {
    kind: "text",
    match: "exact",
    from: "A unique ID to identify this tailnet in API calls.",
    to: "用于在 API 调用中识别此 tailnet 的唯一 ID。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Display",
    to: "显示",
  },
  {
    kind: "text",
    match: "exact",
    from: "Set a display name to easily recognize this tailnet.",
    to: "设置显示名称以便更容易识别此 tailnet。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Regional Routing",
    to: "区域路由",
  },
  {
    kind: "text",
    match: "exact",
    from: "Regional Routing Premium",
    to: "区域路由 Premium",
  },
  {
    kind: "text",
    match: "exact",
    from: "Premium",
    to: "高级版",
  },
  {
    kind: "text",
    match: "exact",
    from: "Route traffic to the closest available subnet router or app connector region. Available on the Premium plan and above.",
    to: "将流量路由到最近可用的子网路由器或应用连接器区域。Premium 及以上套餐可用。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Allow users to provision HTTPS certificates for their devices.",
    to: "允许用户为其设备申请 HTTPS 证书。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Feature previews",
    to: "功能预览",
  },
  {
    kind: "text",
    match: "exact",
    from: "Get early access to features. Feature previews are available for testing, but still in development. Please",
    to: "提前体验新功能。功能预览可用于测试，但仍在开发中。请",
  },
  {
    kind: "text",
    match: "exact",
    from: "share feedback",
    to: "分享反馈",
  },
  {
    kind: "text",
    match: "exact",
    from: "on how we could make them work better.",
    to: "告诉我们如何把它们做得更好。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Beta",
    to: "测试版",
  },
  {
    kind: "text",
    match: "exact",
    from: "Alpha",
    to: "内测版",
  },
  {
    kind: "text",
    match: "exact",
    from: "Paid add-on",
    to: "付费附加项",
  },
  {
    kind: "text",
    match: "exact",
    from: "Allow users on your network to use Mullvad VPN endpoints as exit-nodes.",
    to: "允许你网络中的用户将 Mullvad VPN 节点用作出口节点。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Send Files",
    to: "发送文件",
  },
  {
    kind: "text",
    match: "exact",
    from: "Allow users on your network to send files between their own devices using Taildrop, Tailscale’s built-in file sharing feature.",
    to: "允许你网络中的用户使用 Tailscale 内置文件共享功能 Taildrop，在自己的设备之间发送文件。",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^Allow users on your network to send files between their\\s+own devices using Taildrop, Tailscale’s built-in file sharing feature\\.$",
    replace: "允许你网络中的用户使用 Tailscale 内置文件共享功能 Taildrop，在自己的设备之间发送文件。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Services Collection",
    to: "服务收集",
  },
  {
    kind: "text",
    match: "exact",
    from: "Collect and display information about services running on your network in the admin panel.",
    to: "在管理面板中收集并显示网络中运行的服务信息。",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^Collect and display information about services running\\s+on your network in the admin panel\\.$",
    replace: "在管理面板中收集并显示网络中运行的服务信息。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Redesigned MacOS Client UI",
    to: "重新设计的 macOS 客户端界面",
  },
  {
    kind: "text",
    match: "exact",
    from: "Enable the redesigned macOS client with a dedicated windowed interface. Find devices and exit nodes faster with search, get clearer connectivity error messages, and easily access features like Taildrop and ping. Requires Tailscale v1.88 or later.",
    to: "启用重新设计的 macOS 客户端，使用专属窗口式界面。通过搜索更快找到设备和出口节点，获得更清晰的连接错误信息，并更方便地访问 Taildrop 和 ping 等功能。需要 Tailscale v1.88 或更高版本。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Allow users on your network to route traffic from the wider internet to their Tailscale nodes.",
    to: "允许你网络中的用户将更广泛互联网的流量路由到其 Tailscale 节点。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Public IP addresses for device posture",
    to: "设备态势的公共IP地址",
  },
  {
    kind: "text",
    match: "exact",
    from: "Use the public IP address a device uses to connect to Tailscale as a Device Posture attribute.",
    to: "将设备用于连接Tailscale的公共IP地址用作设备态势属性。",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^Allow users on your network to route traffic from the wider\\s+internet to their Tailscale nodes\\.$",
    replace: "允许你网络中的用户将更广泛互联网的流量路由到其 Tailscale 节点。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Delete tailnet",
    to: "删除 tailnet",
  },
  {
    kind: "text",
    match: "exact",
    from: "Permanently delete this tailnet. This action cannot be undone.",
    to: "永久删除此 tailnet。此操作无法撤销。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Delete tailnet…",
    to: "删除 tailnet…",
  },
];

export const settingsGeneralDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...settingsShellDictionary,
  ...settingsGeneralRules,
];

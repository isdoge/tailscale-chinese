import { adminShellDictionary } from "./admin-shell";
import { settingsShellDictionary } from "./settings-shell";
import type { TranslationRule } from "../types";

const settingsDeviceManagementRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "Manage your tailnet device settings.",
    to: "管理你的 tailnet 设备设置。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Device Approval",
    to: "设备审批",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Require new devices to be approved by admins before\\s+they can access the network\\.",
    replace: "要求新设备在访问网络前先由管理员审批。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Manually approve new devices",
    to: "手动审批新设备",
  },
  {
    kind: "text",
    match: "exact",
    from: "Tailnet Lock",
    to: "Tailnet Lock",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Manually verify every new device added to your network\\s+without trusting Tailscale’s coordination server\\.",
    replace: "在不信任 Tailscale 协调服务器的情况下，手动验证每一台新加入网络的设备。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Enable tailnet lock…",
    to: "启用 tailnet lock…",
  },
  {
    kind: "text",
    match: "exact",
    from: "Key Expiry",
    to: "密钥过期",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Set the number of days a device can stay logged in\\s+to Tailscale before it needs to re-authenticate with Google\\.",
    replace: "设置设备在重新通过 Google 身份验证前可保持登录 Tailscale 的天数。",
  },
  {
    kind: "text",
    match: "exact",
    from: "days",
    to: "天",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^Must be between\\s+1\\s+and\\s+180\\s+days\\.$",
    replace: "必须在 1 到 180 天之间。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Auto-update Tailscale",
    to: "自动更新 Tailscale",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Default new devices on your network to automatically update to the latest Tailscale version\\. Existing devices are unaffected, but can opt-in from their settings or via MDM\\.",
    replace: "默认让网络中的新设备自动更新到最新 Tailscale 版本。现有设备不受影响，但可在各自设置中或通过 MDM 选择加入。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Auto-update new devices",
    to: "自动更新新设备",
  },
  {
    kind: "text",
    match: "exact",
    from: "Device Posture Integrations Standard",
    to: "设备状态集成 Standard",
  },
  {
    kind: "text",
    match: "exact",
    from: "Device Posture Integrations",
    to: "设备状态集成",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Enable integrations to use third-party device attributes as part of device postures along with other device properties\\.",
    replace: "启用集成，以便将第三方设备属性与其他设备属性一起用作设备状态的一部分。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Device Identity Collection",
    to: "设备身份信息收集",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Collect device identity information \\(e\\.g\\. serial numbers\\) for use in third-party and custom device posture integrations\\.",
    replace: "收集设备身份信息（如序列号），供第三方和自定义设备状态集成使用。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Disabled",
    to: "已禁用",
  },
  {
    kind: "text",
    match: "exact",
    from: "Integrations",
    to: "集成",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Synchronize device posture attributes from third-party systems like CrowdStrike, Microsoft Intune, Jamf Pro, and more\\.",
    replace: "从 CrowdStrike、Microsoft Intune、Jamf Pro 等第三方系统同步设备状态属性。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Add an integration...",
    to: "添加集成...",
  },
  {
    kind: "text",
    match: "exact",
    from: "Posture Conditions",
    to: "状态条件",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Use srcPosture in your ACL rules to restrict access from devices with non-compliant posture\\.",
    replace: "在 ACL 规则中使用 srcPosture 来限制来自不合规设备的访问。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Manage in Access Controls",
    to: "在访问控制页管理",
  },
  {
    kind: "text",
    match: "exact",
    from: "← Back to device management",
    to: "← 返回设备管理",
  },
  {
    kind: "text",
    match: "exact",
    from: "Add a device posture integration",
    to: "添加设备状态集成",
  },
  {
    kind: "text",
    match: "exact",
    from: "Standard",
    to: "标准版",
  },
  {
    kind: "text",
    match: "exact",
    from: "Device posture integrations synchronize data from third-party systems, which can be used as device attributes in your policy file.",
    to: "设备状态集成会同步来自第三方系统的数据，这些数据可在你的策略文件中用作设备属性。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Continue",
    to: "继续",
  },
];

export const settingsDeviceManagementDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...settingsShellDictionary,
  ...settingsDeviceManagementRules,
];

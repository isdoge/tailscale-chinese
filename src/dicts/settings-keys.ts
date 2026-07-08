import { adminShellDictionary } from "./admin-shell";
import { settingsShellDictionary } from "./settings-shell";
import type { TranslationRule } from "../types";

const settingsKeysRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "View and manage your Auth keys and API access tokens.",
    to: "查看并管理你的 Auth key 和 API 访问令牌。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Your private device keys are not included here: they are always private, stay on your device, and are never shared with Tailscale.",
    to: "你的私有设备密钥不包含在这里：它们始终保持私有，留在你的设备上，且从不与 Tailscale 共享。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Auth keys",
    to: "Auth key",
  },
  {
    kind: "text",
    match: "exact",
    from: "Authenticate devices without an interactive login.",
    to: "在无需交互式登录的情况下验证设备。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Generate auth key…",
    to: "生成 Auth key…",
  },
  {
    kind: "text",
    match: "exact",
    from: "Generate auth key",
    to: "生成 Auth key",
  },
  {
    kind: "text",
    match: "exact",
    from: "You don’t have any auth keys yet",
    to: "你还没有任何 Auth key",
  },
  {
    kind: "text",
    match: "exact",
    from: "API access tokens",
    to: "API 访问令牌",
  },
  {
    kind: "text",
    match: "exact",
    from: "Access tokens give access to the Tailscale API.",
    to: "访问令牌可用于访问 Tailscale API。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Generate access token…",
    to: "生成访问令牌…",
  },
  {
    kind: "text",
    match: "exact",
    from: "Generate API access token",
    to: "生成 API 访问令牌",
  },
  {
    kind: "text",
    match: "exact",
    from: "You don’t have any access tokens yet",
    to: "你还没有任何访问令牌",
  },
  {
    kind: "text",
    match: "exact",
    from: "Description",
    to: "描述",
  },
  {
    kind: "text",
    match: "exact",
    from: "Add an optional description for the key.",
    to: "为密钥添加可选描述。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Reusable",
    to: "可重复使用",
  },
  {
    kind: "text",
    match: "exact",
    from: "Use this key to authenticate more than one device.",
    to: "使用此密钥验证多台设备。",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Number of days until this auth key expires\\. This will not affect the\\s+node key expiry\\s+of any machine authenticated with this auth key\\.",
    replace: "此 auth key 过期前的天数。这不会影响任何通过此 auth key 认证设备的节点密钥过期。",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^Number of days until this auth key expires\\. This will not affect the\\s*$",
    replace: "此 auth key 过期前的天数。这不会影响任何通过此 auth key 认证设备的",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^\\s*of any machine authenticated with this auth key\\.$",
    replace: "。",
  },
  {
    kind: "text",
    match: "exact",
    from: "node key expiry",
    to: "节点密钥过期",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^Must be between\\s+1\\s+and\\s+90\\s+days\\.$",
    replace: "必须在 1 到 90 天之间。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Device Settings",
    to: "设备设置",
  },
  {
    kind: "text",
    match: "exact",
    from: "These settings will apply to any devices authenticated using this key.",
    to: "这些设置将应用于使用此密钥验证的所有设备。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Ephemeral",
    to: "临时",
  },
  {
    kind: "text",
    match: "exact",
    from: "Devices authenticated by this key will be automatically removed after going offline.",
    to: "通过此密钥验证的设备在离线后将自动移除。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Tags",
    to: "标签",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "Devices authenticated by this key will be automatically tagged\\. This will also disable\\s+node key expiry\\s+for the device\\.",
    replace: "通过此密钥验证的设备将自动打标签。这也会禁用该设备的节点密钥过期。",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^Devices authenticated by this key will be automatically tagged\\. This will also disable\\s*$",
    replace: "通过此密钥验证的设备将自动打标签。这也会禁用该设备的",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^\\s*for the device\\.$",
    replace: "。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Generate key",
    to: "生成密钥",
  },
  {
    kind: "text",
    match: "exact",
    from: "Manage tags in Access Controls",
    to: "在访问控制页管理标签",
  },
  {
    kind: "text",
    match: "exact",
    from: "Expiration",
    to: "过期",
  },
  {
    kind: "text",
    match: "exact",
    from: "Number of days this key is valid for.",
    to: "此密钥的有效天数。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Generate access token",
    to: "生成访问令牌",
  },
];

export const settingsKeysDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...settingsShellDictionary,
  ...settingsKeysRules,
];

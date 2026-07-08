import { adminShellDictionary } from "./admin-shell";
import { settingsShellDictionary } from "./settings-shell";
import type { TranslationRule } from "../types";

const settingsTrustCredentialsRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "New credential",
    to: "新建凭据",
  },
  {
    kind: "text",
    match: "exact",
    from: "Create an interactive login token for a shared resource",
    to: "为共享资源创建交互式登录令牌",
  },
  {
    kind: "text",
    match: "exact",
    from: "Set up a trust relationship with another service provider",
    to: "与另一个服务提供方建立信任关系",
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
    from: "optional",
    to: "可选",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^Description\\s+\\(optional\\)$",
    replace: "描述（可选）",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^Description\\s+optional$",
    replace: "描述（可选）",
  },
  {
    kind: "text",
    match: "exact",
    from: "Description (optional)",
    to: "描述（可选）",
  },
  {
    kind: "text",
    match: "exact",
    from: "Continue",
    to: "继续",
  },
  {
    kind: "text",
    match: "exact",
    from: "Provide fine grained access to the Tailscale API using OAuth or OIDC tokens.",
    to: "使用 OAuth 或 OIDC 令牌为 Tailscale API 提供细粒度访问控制。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Client ID",
    to: "客户端 ID",
  },
  {
    kind: "text",
    match: "exact",
    from: "Type",
    to: "类型",
  },
  {
    kind: "text",
    match: "exact",
    from: "Updated",
    to: "已更新",
  },
  {
    kind: "text",
    match: "exact",
    from: "Scopes",
    to: "作用域",
  },
  {
    kind: "text",
    match: "exact",
    from: "Trust credentials action menu",
    to: "受信任凭据操作菜单",
  },
  {
    kind: "text",
    match: "exact",
    from: "You do not have any trust credentials",
    to: "你还没有任何受信任凭据",
  },
  {
    kind: "text",
    match: "exact",
    from: "Create a new trust credential",
    to: "创建新的受信任凭据",
  },
  {
    kind: "attr",
    match: "exact",
    selector: "input",
    attr: "placeholder",
    from: "Search by issuer, description, id...",
    to: "按签发方、描述、ID 搜索...",
  },
  {
    kind: "attr",
    match: "exact",
    selector: "input",
    attr: "placeholder",
    from: "Internal reference only",
    to: "仅供内部参考",
  },
];

export const settingsTrustCredentialsDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...settingsShellDictionary,
  ...settingsTrustCredentialsRules,
];

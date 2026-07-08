import { adminShellDictionary } from "./admin-shell";
import type { TranslationRule } from "../types";

const appRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "Route traffic to third-party SaaS apps through connectors on your tailnet.",
    to: "通过 tailnet 中的连接器将流量路由到第三方 SaaS 应用。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Add app",
    to: "添加应用",
  },
  {
    kind: "text",
    match: "exact",
    from: "Add an app",
    to: "添加一个应用",
  },
  {
    kind: "text",
    match: "exact",
    from: "Name",
    to: "名称",
  },
  {
    kind: "text",
    match: "exact",
    from: "Only shown in the admin console. Only letters, numbers, and dashes.",
    to: "仅在管理控制台中显示。只能包含字母、数字和短横线。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Target",
    to: "目标",
  },
  {
    kind: "text",
    match: "exact",
    from: "External app to route traffic for.",
    to: "要为其路由流量的外部应用。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Select a target",
    to: "选择目标",
  },
  {
    kind: "text",
    match: "exact",
    from: "Apps let you control access to your third-party SaaS applications, without requiring any end user configuration.",
    to: "应用让你无需终端用户进行任何配置，即可控制对第三方 SaaS 应用的访问。",
  },
  {
    kind: "text",
    match: "exact",
    from: "route",
    to: "条路由",
  },
  {
    kind: "text",
    match: "exact",
    from: "routes",
    to: "条路由",
  },
  {
    kind: "text",
    match: "exact",
    from: "NAME",
    to: "名称",
  },
  {
    kind: "text",
    match: "exact",
    from: "DOMAINS",
    to: "域名",
  },
  {
    kind: "text",
    match: "exact",
    from: "CONNECTORS",
    to: "连接器",
  },
  {
    kind: "text",
    match: "exact",
    from: "Connectors",
    to: "连接器",
  },
  {
    kind: "text",
    match: "exact",
    from: "Configure which",
    to: "配置哪些",
  },
  {
    kind: "text",
    match: "exact",
    from: "connectors",
    to: "连接器",
  },
  {
    kind: "text",
    match: "exact",
    from: "can route traffic for this app.",
    to: "可以为此应用路由流量。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Select ACL tags",
    to: "选择 ACL 标签",
  },
  {
    kind: "text",
    match: "exact",
    from: "No ACL tags found. You can create ACL tags from the",
    to: "未找到 ACL 标签。你可以在",
  },
  {
    kind: "text",
    match: "exact",
    from: "Access Controls page",
    to: "访问控制页面",
  },
  {
    kind: "text",
    match: "exact",
    from: "STATUS",
    to: "状态",
  },
  {
    kind: "text",
    match: "exact",
    from: "APP ACTION MENU",
    to: "应用操作",
  },
  {
    kind: "attr",
    match: "exact",
    selector: "[placeholder]",
    attr: "placeholder",
    from: "Search apps...",
    to: "搜索应用...",
  },
];

export const appsDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...appRules,
];

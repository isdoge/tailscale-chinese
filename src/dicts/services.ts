import { adminShellDictionary } from "./admin-shell";
import type { TranslationRule } from "../types";

const serviceRules: TranslationRule[] = [
  {
    kind: "text",
    match: "exact",
    from: "All Services",
    to: "所有服务",
  },
  {
    kind: "text",
    match: "exact",
    from: "Service",
    to: "服务",
  },
  {
    kind: "text",
    match: "exact",
    from: "Hosts",
    to: "主机",
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
    from: "Addresses",
    to: "地址",
  },
  {
    kind: "text",
    match: "exact",
    from: "Machine Name",
    to: "设备名称",
  },
  {
    kind: "text",
    match: "exact",
    from: "Status",
    to: "状态",
  },
  {
    kind: "text",
    match: "exact",
    from: "Short domain",
    to: "短域名",
  },
  {
    kind: "text",
    match: "exact",
    from: "Full domain",
    to: "完整域名",
  },
  {
    kind: "text",
    match: "exact",
    from: "Revoke service host",
    to: "吊销服务主机",
  },
  {
    kind: "text",
    match: "exact",
    from:
      "Revoke this service host, so that no new connections can be established with it, and taking it out of rotation for connection steering. This will place the service host back in a Needs Approval state.",
    to: "吊销此服务主机，使其无法再建立新连接，并将其从连接引导轮换中移除。此操作会使该服务主机回到「需要审批」状态。",
  },
  {
    kind: "text",
    match: "regex",
    pattern:
      "^Revoke this service host, so that no new connections can be established with it, and\\s+taking it out of rotation for connection steering\\. This will place the service host back in a Needs Approval state\\.$",
    replace:
      "吊销此服务主机，使其无法再建立新连接，并将其从连接引导轮换中移除。此操作会使该服务主机回到「需要审批」状态。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Device:",
    to: "设备：",
  },
  {
    kind: "text",
    match: "exact",
    from: "Managed by:",
    to: "管理者：",
  },
  {
    kind: "text",
    match: "exact",
    from: "Ports:",
    to: "端口：",
  },
  {
    kind: "text",
    match: "exact",
    from: "Revoke",
    to: "吊销",
  },
  {
    kind: "text",
    match: "exact",
    from: "Edit",
    to: "编辑",
  },
  {
    kind: "text",
    match: "exact",
    from: "Remove",
    to: "移除",
  },
  {
    kind: "text",
    match: "exact",
    from:
      "Remove this Service from your tailnet. Hosts will continue to advertise and serve.",
    to: "从你的 tailnet 移除此服务。主机仍会继续发布并提供服务。",
  },
  {
    kind: "text",
    match: "regex",
    pattern:
      "^Remove this Service from your tailnet\\. Hosts will continue to advertise and serve\\.$",
    replace: "从你的 tailnet 移除此服务。主机仍会继续发布并提供服务。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Remove Service",
    to: "移除服务",
  },
  {
    kind: "text",
    match: "exact",
    from:
      "This Service will permanently be removed from your network. To re-add it, you will need to create it and advertise its proper hosts. Type the name of this Service to remove.",
    to: "此服务将从你的网络中被永久移除。若要重新添加，你需要重新创建它并发布其正确的主机。请输入要移除的服务名称以确认。",
  },
  {
    kind: "text",
    match: "regex",
    pattern:
      "^This Service will permanently be removed from your network\\. To re-add it, you will need to create it and advertise its proper hosts\\. Type the name of this Service to remove\\.$",
    replace:
      "此服务将从你的网络中被永久移除。若要重新添加，你需要重新创建它并发布其正确的主机。请输入要移除的服务名称以确认。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Save changes",
    to: "保存更改",
  },
  {
    kind: "text",
    match: "exact",
    from: "Services advertised and discovered within your network.",
    to: "你网络中已发布和已发现的服务。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Advertised",
    to: "已发布",
  },
  {
    kind: "text",
    match: "exact",
    from: "Discovered",
    to: "已发现",
  },
  {
    kind: "text",
    match: "exact",
    from: "Loading endpoints...",
    to: "正在加载端点...",
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
    from: "User",
    to: "用户",
  },
  {
    kind: "text",
    match: "exact",
    from: "Define your first Service",
    to: "定义你的第一个服务",
  },
  {
    kind: "text",
    match: "exact",
    from: "Share Services in your tailnet by advertising Services from your devices.",
    to: "通过从设备发布服务，在 tailnet 中共享服务。",
  },
  {
    kind: "text",
    match: "exact",
    from: "1. Define a Service",
    to: "1. 定义服务",
  },
  {
    kind: "text",
    match: "exact",
    from: "Name, describe, and give identity to the process or data the Service will provide.",
    to: "为该服务将提供的进程或数据命名、描述并赋予标识。",
  },
  {
    kind: "text",
    match: "exact",
    from: "2. Advertise and serve",
    to: "2. 发布并提供服务",
  },
  {
    kind: "text",
    match: "exact",
    from: "From the host, advertise the Service ports from which it will serve.",
    to: "在主机上发布服务将提供的端口。",
  },
  {
    kind: "text",
    match: "exact",
    from: "3. Approve",
    to: "3. 审批",
  },
  {
    kind: "text",
    match: "exact",
    from: "Review proper configuration and approve each Service’s hosts, manually or automatically.",
    to: "审查正确配置，并手动或自动批准各服务的主机。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Define Service",
    to: "定义服务",
  },
  {
    kind: "text",
    match: "exact",
    from: "Back to All Services",
    to: "返回所有服务",
  },
  {
    kind: "text",
    match: "exact",
    from: "Define a Service",
    to: "定义服务",
  },
  {
    kind: "text",
    match: "exact",
    from: "Service name",
    to: "服务名称",
  },
  {
    kind: "text",
    match: "exact",
    from: "This Service will be available in your tailnet at",
    to: "此服务将在你的 tailnet 中以下列地址提供：",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^This Service will be available in your tailnet at\\s+(.+)$",
    replace: "此服务将在你的 tailnet 中以下列地址提供：$1",
  },
  {
    kind: "text",
    match: "exact",
    from: "Only alphanumeric characters and dashes allowed, max 63 characters.",
    to: "仅允许字母数字和短横线，最多 63 个字符。",
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
    from: "Max 80 characters",
    to: "最多 80 个字符",
  },
  {
    kind: "text",
    match: "exact",
    from: "Ports",
    to: "端口",
  },
  {
    kind: "text",
    match: "exact",
    from: "Which ports does this Service listen on?",
    to: "此服务监听哪些端口？",
  },
  {
    kind: "text",
    match: "exact",
    from: "Only hosts advertising all listed ports will be eligible candidates.",
    to: "只有发布了全部所列端口的主机才会成为候选项。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Service tags",
    to: "服务标签",
  },
  {
    kind: "text",
    match: "exact",
    from: "ACL tags can be used to identify this Service.",
    to: "可使用 ACL 标签来标识此服务。",
  },
  {
    kind: "text",
    match: "exact",
    from: "No tags assigned.",
    to: "尚未分配标签。",
  },
  {
    kind: "text",
    match: "exact",
    from: "Add tags",
    to: "添加标签",
  },
  {
    kind: "text",
    match: "exact",
    from: "Manage tags in Access Controls",
    to: "在访问控制中管理标签",
  },
  {
    kind: "text",
    match: "exact",
    from: "No Services Discovered",
    to: "未发现任何服务",
  },
  {
    kind: "text",
    match: "exact",
    from: "No reported endpoints",
    to: "暂无已上报端点",
  },
  {
    kind: "text",
    match: "exact",
    from: "If your network just turned on endpoint collection, machines may take some time to start sending their endpoints.",
    to: "如果你的网络刚启用端点收集，设备可能需要一些时间才会开始上报其端点。",
  },
  {
    kind: "text",
    match: "regex",
    pattern: "^\\s*If your network just turned on endpoint collection, machines may\\s+take some time to start sending their endpoints\\.\\s*$",
    replace: "如果你的网络刚启用端点收集，设备可能需要一些时间才会开始上报其端点。",
  },
  {
    kind: "attr",
    match: "exact",
    selector: "[placeholder]",
    attr: "placeholder",
    from: "Search endpoints...",
    to: "搜索端点...",
  },
];

export const servicesDictionary: TranslationRule[] = [
  ...adminShellDictionary,
  ...serviceRules,
];

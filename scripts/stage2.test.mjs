import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "dist", "tailscale-chinese.user.js");
let cachedBundle = null;

function buildUserscriptBundle() {
  if (cachedBundle) {
    return cachedBundle;
  }

  const buildResult = spawnSync(process.execPath, ["scripts/build.mjs"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  assert.equal(
    buildResult.status,
    0,
    `expected build to succeed\nstdout:\n${buildResult.stdout}\nstderr:\n${buildResult.stderr}`,
  );

  cachedBundle = readFileSync(outputPath, "utf8");
  return cachedBundle;
}

test("stage2 runtime supports regex, attr, url changes, and language restore", () => {
  const bundle = buildUserscriptBundle();
  const runtime = createRuntime({ path: "/login" });

  vm.runInNewContext(bundle, runtime.context);

  assert.equal(runtime.heading.textContent, "登录");
  assert.equal(runtime.providerButton.textContent, "使用 Okta 继续");
  assert.equal(runtime.emailInput.getAttribute("placeholder"), "邮箱");

  assert.equal(typeof runtime.window.__tailscaleChinese?.setLanguage, "function");
  runtime.window.__tailscaleChinese.setLanguage("en");

  assert.equal(runtime.heading.textContent, "Sign in");
  assert.equal(runtime.providerButton.textContent, "Continue with Okta");
  assert.equal(runtime.emailInput.getAttribute("placeholder"), "Email");

  runtime.window.__tailscaleChinese.setLanguage("zh-CN");

  assert.equal(runtime.heading.textContent, "登录");
  assert.equal(runtime.providerButton.textContent, "使用 Okta 继续");
  assert.equal(runtime.emailInput.getAttribute("placeholder"), "邮箱");

  runtime.window.history.pushState({}, "", "/account");

  assert.equal(runtime.heading.textContent, "登录");
  assert.equal(runtime.providerButton.textContent, "Continue with Okta");
  assert.equal(runtime.emailInput.getAttribute("placeholder"), "Email");

  runtime.window.history.pushState({}, "", "/login");

  assert.equal(runtime.heading.textContent, "登录");
  assert.equal(runtime.providerButton.textContent, "使用 Okta 继续");
  assert.equal(runtime.emailInput.getAttribute("placeholder"), "邮箱");
});

test("machines page translates stable list labels, actions, and pagination controls", () => {
  const bundle = buildUserscriptBundle();
  const runtime = createRuntime({
    path: "/admin/machines",
    buildBody: createMachinesBody,
  });

  vm.runInNewContext(bundle, runtime.context);

  assert.equal(runtime.pageTitle.textContent, "设备");
  assert.equal(
    runtime.pageDescription.textContent,
    "管理连接到你的 tailnet 的设备。",
  );
  assert.equal(runtime.learnMoreLink.textContent, "了解更多");
  assert.equal(runtime.addDeviceButton.textContent, "添加设备");
  assert.equal(runtime.filtersButton.textContent, "筛选");
  assert.equal(runtime.searchInput.getAttribute("placeholder"), "按名称、所有者、标签、版本搜索...");
  assert.equal(runtime.exportButton.getAttribute("aria-label"), "导出设备数据");
  assert.equal(runtime.exportButton.getAttribute("title"), "导出设备数据");
  assert.equal(runtime.machineCountLabel.textContent, "台设备");
  assert.equal(runtime.machineHeader.textContent, "设备");
  assert.equal(runtime.addressesHeader.textContent, "地址");
  assert.equal(runtime.versionHeader.textContent, "版本");
  assert.equal(runtime.lastSeenHeader.textContent, "最后在线");
  assert.equal(runtime.actionHeader.textContent, "设备操作");
  assert.equal(runtime.connectedStatus.textContent, "已连接");
  assert.equal(runtime.previousButton.textContent, "上一页");
  assert.equal(runtime.nextButton.textContent, "下一页");
  assert.equal(runtime.detailLink.getAttribute("aria-label"), "a1-0579 的详情页");
  assert.equal(
    runtime.addressesButton.getAttribute("aria-label"),
    "查看此设备的所有地址",
  );
  assert.equal(runtime.actionButton.getAttribute("aria-label"), "a1-0579 的操作");
  assert.equal(runtime.shareButton.getAttribute("aria-label"), "分享 a1-0579");
  assert.equal(
    runtime.updateBadge.getAttribute("aria-label"),
    "dogemacbook-air 有可用更新",
  );
  assert.equal(runtime.networkCardHeading.textContent, "向你的网络添加设备");
  assert.equal(
    runtime.networkCardDescription.textContent,
    "Tailscale 在安装到多台设备后效果最佳。探索你可以在这些环境中用 Tailscale 做什么。",
  );
  assert.equal(runtime.operatingSystemsHeading.textContent, "操作系统");
  assert.equal(runtime.cloudProvidersHeading.textContent, "云服务提供商");
  assert.equal(runtime.containersHeading.textContent, "容器");
  assert.equal(runtime.seeMoreLink.textContent, "查看更多");
  assert.equal(runtime.addAwsVmLink.textContent, "添加 AWS 虚拟机");
  assert.equal(runtime.addDeviceLinuxServerTitle.textContent, "Linux 服务器");
  assert.equal(
    runtime.addDeviceLinuxServerDescription.textContent,
    "用于运行在虚拟机、容器和函数中的服务",
  );
  assert.equal(runtime.addDeviceClientDeviceTitle.textContent, "客户端设备");
  assert.equal(
    runtime.addDeviceClientDeviceDescription.textContent,
    "用于 macOS、Windows、Linux、iOS 和 Android 等用户自有客户端设备",
  );
  assert.equal(
    runtime.addDeviceDialogIntroLead.textContent,
    "要将新设备添加到你的 tailnet，请在该设备上安装 Tailscale，并登录为 ",
  );
  assert.equal(runtime.emailLinkTab.textContent, "邮件链接");
  assert.equal(runtime.copyLinkTab.textContent, "复制链接");
  assert.equal(runtime.readGuideTab.textContent, "阅读指南");
  assert.equal(runtime.inputCodeTab.textContent, "输入代码");
  assert.equal(runtime.sendInviteButton.textContent, "发送");
  assert.equal(
    runtime.addDeviceInstallLinkNote.textContent,
    "我们只会用它向你发送安装链接，不作其他用途。",
  );
  assert.equal(runtime.copyDownloadLinkButton.textContent, "复制");
  assert.equal(
    runtime.exitNodeAdvertiseHint.textContent,
    "此设备未声明自身为出口节点。请重新运行 tailscale up，并使用 --advertise-exit-node 参数以启用此选项。",
  );
  assert.equal(runtime.requiresLead.textContent, "需要");
  assert.equal(runtime.requiresTail.textContent, "或更高版本。");
  assert.equal(
    runtime.macosReadGuideIntro.textContent,
    "使用以下任一方式下载并安装 Tailscale 客户端：",
  );
  assert.equal(runtime.standaloneVariantLink.textContent, "独立版本");
  assert.equal(
    runtime.standaloneVariantTail.textContent,
    "来自 Tailscale 软件包服务器（推荐）。",
  );
  assert.equal(
    runtime.macAppStoreTail.textContent,
    "版本。Tailscale 客户端可免费下载，但从 Mac App Store 下载任何应用都可能需要绑定有效信用卡的 Apple ID。",
  );
  assert.equal(
    runtime.onboardingFlowStep.textContent,
    "按照 Tailscale 引导流程完成安装，它会指导你安装 Tailscale VPN 配置。",
  );
  assert.equal(runtime.signInStep.textContent, "使用你的身份提供商登录。");
  assert.equal(runtime.updatePopoverTitle.textContent, "有可用更新");
  assert.equal(runtime.patchReleaseLabel.textContent, "补丁版本");
  assert.equal(runtime.updateAvailableTail.textContent, "可用。");
  assert.equal(runtime.releaseNotesLink.textContent, "查看发布说明");
  assert.equal(runtime.updateWhatsNewTail.textContent, "了解更新内容！");
  assert.equal(runtime.securityUpdateTitle.textContent, "有安全更新");
  assert.equal(
    runtime.securityUpdateDescription.textContent,
    "此设备运行的版本存在已知安全漏洞。建议更新到 1.96.5。",
  );
  assert.equal(runtime.updateRecommendedTitle.textContent, "建议更新");
  assert.equal(
    runtime.updateRecommendedDescription.textContent,
    "此设备已落后 multiple 个版本。版本 1.96.5 已可用，建议尽快更新。",
  );
  assert.equal(runtime.startUpdateButton.textContent, "开始更新");
  assert.equal(runtime.updatingButton.textContent, "更新中");
  assert.equal(runtime.updatedButton.textContent, "已更新");
  assert.equal(
    runtime.macosUpdateGuide.textContent,
    "在 macOS 上，请通过 Mac App Store 的“更新”页面更新 Tailscale。",
  );
  assert.equal(
    runtime.androidUpdateGuide.textContent,
    "在 Android 上，请通过 Play Store 的“更新”页面更新 Tailscale。默认情况下，应用会自动更新。",
  );
  assert.equal(runtime.expiryDisabledBadge.textContent, "已禁用密钥过期");
  assert.equal(runtime.editMachineNameItem.textContent, "编辑设备名称…");
  assert.equal(runtime.editMachineIpv4Item.textContent, "编辑设备 IPv4…");
  assert.equal(runtime.shareMenuItem.textContent, "分享…");
  assert.equal(runtime.enableKeyExpiryItem.textContent, "启用密钥过期");
  assert.equal(runtime.disableKeyExpiryItem.textContent, "禁用密钥过期");
  assert.equal(runtime.viewRecentActivityItem.textContent, "查看最近活动");
  assert.equal(runtime.editRouteSettingsItem.textContent, "编辑路由设置…");
  assert.equal(runtime.editAclTagsItem.textContent, "编辑 ACL 标签…");
  assert.equal(runtime.removeItem.textContent, "移除…");
  assert.equal(runtime.editMachineNameDialogTitle.textContent, "编辑 a1-0579 的设备名称");
  assert.equal(runtime.editMachineNameDialogLead.textContent, "此名称会显示在管理面板中");
  assert.equal(
    runtime.editMachineNameDialogTail.textContent,
    "、Tailscale 客户端中，并在生成 MagicDNS 名称时使用。",
  );
  assert.equal(runtime.autoGenerateFromHostnameLabel.textContent, "根据操作系统主机名自动生成");
  assert.equal(runtime.machineNameLabel.textContent, "设备名称");
  assert.equal(runtime.machineMagicDnsLead.textContent, "此设备");
  assert.equal(runtime.machineMagicDnsVerb.textContent, "可");
  assert.equal(runtime.machineMagicDnsTail.textContent, "通过");
  assert.equal(runtime.machineMagicDnsSuffix.textContent, " 使用 MagicDNS 访问。");
  assert.equal(runtime.cancelNameButton.textContent, "取消");
  assert.equal(runtime.updateNameButton.textContent, "更新名称");
  assert.equal(runtime.editMachineIpDialogTitle.textContent, "编辑 a1-0579 的设备 IP");
  assert.equal(
    runtime.editMachineIpDescription.textContent,
    "这是用于连接到此设备的 IP 地址。",
  );
  assert.equal(
    runtime.editMachineIpWarning.textContent,
    "此操作会中断到此设备的任何现有连接。你需要使用新的 IP 地址重新连接到此设备。你可能还需要刷新 DNS 缓存。",
  );
  assert.equal(runtime.machineIpLabel.textContent, "设备 IP");
  assert.equal(runtime.cancelIpButton.textContent, "取消");
  assert.equal(runtime.updateIpButton.textContent, "更新 IP");
  assert.equal(runtime.shareMachineDialogTitle.textContent, "分享设备");
  assert.equal(runtime.shareMachineLead.textContent, "将");
  assert.equal(
    runtime.shareMachineTail.textContent,
    "分享给外部用户，前提是 ACL 允许。如果你需要同一 tailnet 中的多个用户访问它，或者想把多台设备共享给某个用户，请改为邀请用户加入你的 tailnet。",
  );
  assert.equal(runtime.shareViaEmailTab.textContent, "通过电子邮件分享");
  assert.equal(runtime.copyShareLinkTab.textContent, "复制分享链接");
  assert.equal(runtime.shareRecipientsHelp.textContent, "你可以使用逗号分隔多个邮箱收件人。");
  assert.equal(runtime.noExternalUsersLabel.textContent, "没有外部用户拥有访问权限");
  assert.equal(runtime.shareDialogButton.textContent, "分享");
  assert.equal(runtime.editRouteSettingsDialogTitle.textContent, "编辑 a1-0579 的路由设置");
  assert.equal(runtime.subnetRoutesHeading.textContent, "子网路由");
  assert.equal(
    runtime.subnetRoutesDescription.textContent,
    "通过将 IP 范围发布为子网路由，连接那些无法安装 Tailscale 的设备。",
  );
  assert.equal(runtime.noRoutesLabel.textContent, "此设备未暴露任何路由。");
  assert.equal(runtime.exitNodeHeading.textContent, "出口节点");
  assert.equal(
    runtime.exitNodeDescription.textContent,
    "允许你的网络通过此设备转发互联网流量。",
  );
  assert.equal(runtime.useAsExitNodeLabel.textContent, "用作出口节点");
  assert.equal(runtime.cancelRouteButton.textContent, "取消");
  assert.equal(runtime.saveRouteButton.textContent, "保存");
  assert.equal(runtime.editAclTagsDialogTitle.textContent, "编辑 a1-0579 的 ACL 标签");
  assert.equal(runtime.editAclTagsLead.textContent, "分配标签会将");
  assert.equal(runtime.editAclTagsMid.textContent, "的所有权从");
  assert.equal(
    runtime.editAclTagsTail.textContent,
    "更改为你选择的标签。请确保同时更新你的 ACL。",
  );
  assert.equal(
    runtime.noTagsDefinedLabel.textContent,
    "尚未定义任何标签。请在访问控制页面定义标签",
  );
  assert.equal(runtime.goToAccessControlsButton.textContent, "前往访问控制");
  assert.equal(runtime.cancelAclButton.textContent, "取消");
  assert.equal(runtime.saveAclButton.textContent, "保存");
  assert.equal(runtime.removeMachineDialogTitle.textContent, "移除 a1-0579");
  assert.equal(
    runtime.removeMachineDescription.textContent,
    "此设备将从你的网络中被永久移除。若要重新添加它，你需要在设备上重新向 tailnet 完成身份验证。",
  );
  assert.equal(runtime.removeMachineHoldLead.textContent, "按住");
  assert.equal(runtime.removeMachineOptionKey.textContent, "Option 键");
  assert.equal(
    runtime.removeMachineHoldTail.textContent,
    "，再点击“移除”即可跳过此确认。",
  );
  assert.equal(runtime.cancelRemoveButton.textContent, "取消");
  assert.equal(runtime.removeMachineButton.textContent, "移除设备");

  runtime.window.__tailscaleChinese.setLanguage("en");

  assert.equal(runtime.pageTitle.textContent, "Machines");
  assert.equal(
    runtime.pageDescription.textContent,
    "Manage the devices connected to your tailnet.",
  );
  assert.equal(runtime.learnMoreLink.textContent, "Learn more");
  assert.equal(runtime.addDeviceButton.textContent, "Add device");
  assert.equal(runtime.filtersButton.textContent, "Filters");
  assert.equal(
    runtime.searchInput.getAttribute("placeholder"),
    "Search by name, owner, tag, version...",
  );
  assert.equal(runtime.exportButton.getAttribute("aria-label"), "Export devices data");
  assert.equal(runtime.exportButton.getAttribute("title"), "Export devices data");
  assert.equal(runtime.machineCountLabel.textContent, "machines");
  assert.equal(runtime.machineHeader.textContent, "Machine");
  assert.equal(runtime.addressesHeader.textContent, "Addresses");
  assert.equal(runtime.versionHeader.textContent, "Version");
  assert.equal(runtime.lastSeenHeader.textContent, "Last Seen");
  assert.equal(runtime.actionHeader.textContent, "Machines action menu");
  assert.equal(runtime.connectedStatus.textContent, "Connected");
  assert.equal(runtime.previousButton.textContent, "Previous");
  assert.equal(runtime.nextButton.textContent, "Next");
  assert.equal(runtime.detailLink.getAttribute("aria-label"), "Detail view for a1-0579");
  assert.equal(
    runtime.addressesButton.getAttribute("aria-label"),
    "See all addresses for this device.",
  );
  assert.equal(runtime.actionButton.getAttribute("aria-label"), "Actions for a1-0579");
  assert.equal(runtime.shareButton.getAttribute("aria-label"), "Share a1-0579");
  assert.equal(
    runtime.updateBadge.getAttribute("aria-label"),
    "Update available for dogemacbook-air",
  );
  assert.equal(runtime.networkCardHeading.textContent, "Add devices to your network");
  assert.equal(
    runtime.networkCardDescription.textContent,
    "Tailscale works best when it’s installed on multiple devices. Explore what you can do with Tailscale in these environments.",
  );
  assert.equal(runtime.operatingSystemsHeading.textContent, "Operating systems");
  assert.equal(runtime.cloudProvidersHeading.textContent, "Cloud providers");
  assert.equal(runtime.containersHeading.textContent, "Containers");
  assert.equal(runtime.seeMoreLink.textContent, "See more");
  assert.equal(runtime.addAwsVmLink.textContent, "Add AWS VM");
  assert.equal(runtime.addDeviceLinuxServerTitle.textContent, "Linux server");
  assert.equal(
    runtime.addDeviceLinuxServerDescription.textContent,
    "Use this for services running on VMs, containers, and functions",
  );
  assert.equal(runtime.addDeviceClientDeviceTitle.textContent, "Client device");
  assert.equal(
    runtime.addDeviceClientDeviceDescription.textContent,
    "Use this for user-owned client devices like macOS, Windows, Linux, iOS, and Android",
  );
  assert.equal(
    runtime.addDeviceDialogIntroLead.textContent,
    "To add a new device to your tailnet, install Tailscale on that device and log in as ",
  );
  assert.equal(runtime.emailLinkTab.textContent, "Email link");
  assert.equal(runtime.copyLinkTab.textContent, "Copy link");
  assert.equal(runtime.readGuideTab.textContent, "Read guide");
  assert.equal(runtime.inputCodeTab.textContent, "Input code");
  assert.equal(runtime.sendInviteButton.textContent, "Send");
  assert.equal(
    runtime.addDeviceInstallLinkNote.textContent,
    "We’ll only use it to send you the install link and nothing else.",
  );
  assert.equal(runtime.copyDownloadLinkButton.textContent, "Copy");
  assert.equal(runtime.requiresLead.textContent, "Requires ");
  assert.equal(runtime.requiresTail.textContent, " or later.");
  assert.equal(
    runtime.macosReadGuideIntro.textContent,
    "Download and install the Tailscale client using one of the following options:",
  );
  assert.equal(runtime.standaloneVariantLink.textContent, "Standalone variant");
  assert.equal(
    runtime.standaloneVariantTail.textContent,
    "from the Tailscale package server (recommended).",
  );
  assert.equal(
    runtime.macAppStoreTail.textContent,
    "variant. The Tailscale client is free to download, but downloading any app from the Mac App Store may require an Apple ID with a valid credit card attached.",
  );
  assert.equal(
    runtime.onboardingFlowStep.textContent,
    "Follow the Tailscale onboarding flow, which will guide you to install the Tailscale VPN configuration.",
  );
  assert.equal(runtime.signInStep.textContent, "Sign in with your identity provider.");
  assert.equal(runtime.updatePopoverTitle.textContent, "Update available");
  assert.equal(runtime.patchReleaseLabel.textContent, "Patch release");
  assert.equal(runtime.updateAvailableTail.textContent, "is available.");
  assert.equal(runtime.releaseNotesLink.textContent, "Read the release notes");
  assert.equal(runtime.updateWhatsNewTail.textContent, "to find out what’s new!");
  assert.equal(runtime.securityUpdateTitle.textContent, "Security update available");
  assert.equal(
    runtime.securityUpdateDescription.textContent,
    "This machine is running a version with a known security vulnerability. It’s recommended to update to 1.96.5.",
  );
  assert.equal(runtime.updateRecommendedTitle.textContent, "Update recommended");
  assert.equal(
    runtime.updateRecommendedDescription.textContent,
    "This machine is multiple versions out of date. Version 1.96.5 is available, and it is recommended to update.",
  );
  assert.equal(runtime.startUpdateButton.textContent, "Start update");
  assert.equal(runtime.updatingButton.textContent, "Updating");
  assert.equal(runtime.updatedButton.textContent, "Updated");
  assert.equal(
    runtime.macosUpdateGuide.textContent,
    "On macOS, update Tailscale from the Mac App Store’s “Updates” page.",
  );
  assert.equal(
    runtime.androidUpdateGuide.textContent,
    "On Android, update Tailscale from the Play Store’s “Update” page. By default, apps will auto-update.",
  );
  assert.equal(runtime.expiryDisabledBadge.textContent, "Expiry disabled");
  assert.equal(runtime.editMachineNameItem.textContent, "Edit machine name…");
  assert.equal(runtime.editMachineIpv4Item.textContent, "Edit machine IPv4…");
  assert.equal(runtime.shareMenuItem.textContent, "Share…");
  assert.equal(runtime.enableKeyExpiryItem.textContent, "Enable key expiry");
  assert.equal(runtime.disableKeyExpiryItem.textContent, "Disable key expiry");
  assert.equal(runtime.viewRecentActivityItem.textContent, "View recent activity");
  assert.equal(runtime.editRouteSettingsItem.textContent, "Edit route settings…");
  assert.equal(runtime.editAclTagsItem.textContent, "Edit ACL tags…");
  assert.equal(runtime.removeItem.textContent, "Remove…");
  assert.equal(runtime.editMachineNameDialogTitle.textContent, "Edit machine name for a1-0579");
  assert.equal(
    runtime.editMachineNameDialogLead.textContent,
    "This name is shown in the admin panel",
  );
  assert.equal(
    runtime.editMachineNameDialogTail.textContent,
    ", in Tailscale clients, and used when generating MagicDNS names.",
  );
  assert.equal(runtime.autoGenerateFromHostnameLabel.textContent, "Auto-generate from OS hostname");
  assert.equal(runtime.machineNameLabel.textContent, "Machine name");
  assert.equal(runtime.machineMagicDnsLead.textContent, "This machine ");
  assert.equal(runtime.machineMagicDnsVerb.textContent, "is");
  assert.equal(runtime.machineMagicDnsTail.textContent, " accessible as");
  assert.equal(runtime.machineMagicDnsSuffix.textContent, " using MagicDNS.");
  assert.equal(runtime.cancelNameButton.textContent, "Cancel");
  assert.equal(runtime.updateNameButton.textContent, "Update name");
  assert.equal(runtime.editMachineIpDialogTitle.textContent, "Edit machine IP for a1-0579");
  assert.equal(
    runtime.editMachineIpDescription.textContent,
    "This is the IP address that will be used to connect to this machine.",
  );
  assert.equal(
    runtime.editMachineIpWarning.textContent,
    "This action will break any existing connections to this machine. You will need to reconnect to this machine using the new IP address. You may also need to flush your DNS cache.",
  );
  assert.equal(runtime.machineIpLabel.textContent, "Machine IP");
  assert.equal(runtime.cancelIpButton.textContent, "Cancel");
  assert.equal(runtime.updateIpButton.textContent, "Update IP");
  assert.equal(runtime.shareMachineDialogTitle.textContent, "Share machine");
  assert.equal(runtime.shareMachineLead.textContent, "Share access to");
  assert.equal(
    runtime.shareMachineTail.textContent,
    "with external users, as allowed by ACLs. If you need multiple users in the same tailnet to access it, or if you want to share more than one machine with a user, invite users to your tailnet instead.",
  );
  assert.equal(runtime.shareViaEmailTab.textContent, "Share via email");
  assert.equal(runtime.copyShareLinkTab.textContent, "Copy share link");
  assert.equal(
    runtime.shareRecipientsHelp.textContent,
    "You can use commas to separate multiple email recipients.",
  );
  assert.equal(runtime.noExternalUsersLabel.textContent, "No external users have access");
  assert.equal(runtime.shareDialogButton.textContent, "Share");
  assert.equal(runtime.editRouteSettingsDialogTitle.textContent, "Edit route settings of a1-0579");
  assert.equal(runtime.subnetRoutesHeading.textContent, "Subnet routes");
  assert.equal(
    runtime.subnetRoutesDescription.textContent,
    "Connect to devices you can’t install Tailscale on by advertising IP ranges as subnet routes.",
  );
  assert.equal(runtime.noRoutesLabel.textContent, "This machine does not expose any routes.");
  assert.equal(runtime.exitNodeHeading.textContent, "Exit node");
  assert.equal(
    runtime.exitNodeDescription.textContent,
    "Allow your network to route internet traffic through this machine.",
  );
  assert.equal(runtime.useAsExitNodeLabel.textContent, "Use as exit node");
  assert.equal(runtime.cancelRouteButton.textContent, "Cancel");
  assert.equal(runtime.saveRouteButton.textContent, "Save");
  assert.equal(runtime.editAclTagsDialogTitle.textContent, "Edit ACL tags for a1-0579");
  assert.equal(runtime.editAclTagsLead.textContent, "Assigning tags will change the ownership of");
  assert.equal(runtime.editAclTagsMid.textContent, " from");
  assert.equal(
    runtime.editAclTagsTail.textContent,
    " to the tag(s) you select. Make sure to update your ACLs accordingly.",
  );
  assert.equal(
    runtime.noTagsDefinedLabel.textContent,
    "No tags defined. Define tags from the Access Controls page",
  );
  assert.equal(runtime.goToAccessControlsButton.textContent, "Go to Access Controls");
  assert.equal(runtime.cancelAclButton.textContent, "Cancel");
  assert.equal(runtime.saveAclButton.textContent, "Save");
  assert.equal(runtime.removeMachineDialogTitle.textContent, "Remove a1-0579");
  assert.equal(
    runtime.removeMachineDescription.textContent,
    "This machine will permanently be removed from your network. To re-add it, you will need to re-authenticate to your tailnet from the device.",
  );
  assert.equal(runtime.removeMachineHoldLead.textContent, "Hold ");
  assert.equal(runtime.removeMachineOptionKey.textContent, "the Option key");
  assert.equal(
    runtime.removeMachineHoldTail.textContent,
    " while clicking “Remove” to skip this confirmation.",
  );
  assert.equal(runtime.cancelRemoveButton.textContent, "Cancel");
  assert.equal(runtime.removeMachineButton.textContent, "Remove machine");
});

test("machines page re-translates late attribute writes from the page itself", () => {
  const bundle = buildUserscriptBundle();
  const runtime = createRuntime({
    path: "/admin/machines",
    buildBody: createMachinesBody,
  });

  vm.runInNewContext(bundle, runtime.context);

  runtime.exportButton.setAttribute("title", "Export devices data");
  assert.equal(runtime.exportButton.getAttribute("title"), "导出设备数据");

  runtime.exportButton.setAttribute("aria-label", "Export devices data");
  assert.equal(runtime.exportButton.getAttribute("aria-label"), "导出设备数据");

  runtime.searchInput.setAttribute("placeholder", "Search by name, owner, tag, version...");
  assert.equal(
    runtime.searchInput.getAttribute("placeholder"),
    "按名称、所有者、标签、版本搜索...",
  );

  runtime.macosUpdateGuideLead.textContent = "On ";
  runtime.macosUpdateGuideTail.textContent =
    ", update Tailscale from the Mac App Store’s “Updates” page.";
  assert.equal(
    runtime.macosUpdateGuide.textContent,
    "在 macOS 上，请通过 Mac App Store 的“更新”页面更新 Tailscale。",
  );
});

test("acl visual add subpage reuses access controls translations", () => {
  const bundle = buildUserscriptBundle();
  const runtime = createRuntime({
    path: "/admin/acls/visual/general-access-rules/add",
    buildBody: createAccessControlsAddRuleBody,
  });

  vm.runInNewContext(bundle, runtime.context);

  assert.equal(runtime.backLink.textContent, "常规访问规则");
  assert.equal(runtime.pageTitle.textContent, "添加规则");
  assert.equal(runtime.sourcesLabel.textContent, "来源");
  assert.equal(runtime.sourceInput.getAttribute("placeholder"), "输入来源");
  assert.equal(runtime.destinationsLabel.textContent, "目标");
  assert.equal(runtime.destinationInput.getAttribute("placeholder"), "输入目标");
  assert.equal(runtime.portProtocolLabel.textContent, "端口和协议");
  assert.equal(runtime.defaultPorts.textContent, "所有端口和协议");
  assert.equal(
    runtime.removePortsButton.getAttribute("aria-label"),
    "移除所有端口和协议",
  );
  assert.equal(runtime.commentLabel.textContent, "说明");
  assert.equal(
    runtime.commentInput.getAttribute("placeholder"),
    "输入说明，记录这条规则的意图。",
  );
  assert.equal(runtime.advancedOptionsButton.textContent, "高级选项");
  assert.equal(runtime.devicePostureLabel.textContent, "设备状态");
  assert.equal(
    runtime.devicePostureInput.getAttribute("placeholder"),
    "输入设备状态",
  );
  assert.equal(runtime.viaLabel.textContent, "经由");
  assert.equal(runtime.viaInput.getAttribute("placeholder"), "输入经由标签");
  assert.equal(runtime.appLabel.textContent, "应用");
  assert.equal(runtime.appInput.getAttribute("placeholder"), "输入域名");
  assert.equal(runtime.capabilityLabel.textContent, "能力");
  assert.equal(
    runtime.capabilityInput.getAttribute("placeholder"),
    "{ 输入 JSON 格式的能力 }",
  );
  assert.equal(
    runtime.devicePostureTooltip.textContent,
    "指定必须满足的设备状态规则，只有满足这些规则才允许建立这些连接。",
  );
  assert.equal(
    runtime.viaTooltip.textContent,
    "指定此规则中的来源流量前往目标时应使用的出口节点、子网路由器或应用连接器。",
  );
  assert.equal(
    runtime.appTooltip.textContent,
    "能力的唯一标识符，通常采用 my-domain.x/cap/feature 这种格式。",
  );
  assert.equal(
    runtime.capabilityTooltip.textContent,
    "能力专用配置项，通常使用 JSON 格式。",
  );
  assert.equal(runtime.learnMoreLink.textContent, "了解更多");
  assert.equal(runtime.addCapabilityButton.textContent, "添加更多能力");
  assert.equal(runtime.addAnotherAppButton.textContent, "添加另一个应用");
  assert.equal(runtime.jsonPreviewLabel.textContent, "JSON 预览");
  assert.equal(
    runtime.jsonPreviewCopy.getAttribute("aria-label"),
    "复制 {\"ip\": [\"*\"]} 到剪贴板。",
  );
  assert.equal(runtime.saveGrantButton.textContent, "保存授权规则");
  assert.equal(runtime.cancelButton.textContent, "取消");

  runtime.window.__tailscaleChinese.setLanguage("en");

  assert.equal(runtime.backLink.textContent, "General access rules");
  assert.equal(runtime.pageTitle.textContent, "Add rule");
  assert.equal(runtime.sourcesLabel.textContent, "Sources");
  assert.equal(runtime.sourceInput.getAttribute("placeholder"), "Enter source");
  assert.equal(runtime.destinationsLabel.textContent, "Destination");
  assert.equal(runtime.destinationInput.getAttribute("placeholder"), "Enter destination");
  assert.equal(runtime.portProtocolLabel.textContent, "Port and protocol");
  assert.equal(runtime.defaultPorts.textContent, "All ports and protocols");
  assert.equal(
    runtime.removePortsButton.getAttribute("aria-label"),
    "Remove All ports and protocols",
  );
  assert.equal(runtime.commentLabel.textContent, "Note");
  assert.equal(
    runtime.commentInput.getAttribute("placeholder"),
    "Enter a note to keep track of your rationale.",
  );
  assert.equal(runtime.advancedOptionsButton.textContent, "Advanced options");
  assert.equal(runtime.devicePostureLabel.textContent, "Device posture");
  assert.equal(
    runtime.devicePostureInput.getAttribute("placeholder"),
    "Enter device posture",
  );
  assert.equal(runtime.viaLabel.textContent, "Via");
  assert.equal(runtime.viaInput.getAttribute("placeholder"), "Enter tag to route via");
  assert.equal(runtime.appLabel.textContent, "App");
  assert.equal(runtime.appInput.getAttribute("placeholder"), "Enter domain");
  assert.equal(runtime.capabilityLabel.textContent, "Capability");
  assert.equal(
    runtime.capabilityInput.getAttribute("placeholder"),
    "{ Enter capability in JSON \n                  \n}",
  );
  assert.equal(
    runtime.devicePostureTooltip.textContent,
    "Specify device posture rules that must be true in order to allow these connections.",
  );
  assert.equal(
    runtime.viaTooltip.textContent,
    "Specify exit nodes, subnet routers, or app connectors that should be used to route the source(s) in this rule to the destination(s).",
  );
  assert.equal(
    runtime.appTooltip.textContent,
    "Unique identifier for the capability, typically in the format my-domain.x/cap/feature.",
  );
  assert.equal(
    runtime.capabilityTooltip.textContent,
    "Capability-specific configuration options, typically in JSON format.",
  );
  assert.equal(runtime.learnMoreLink.textContent, "Learn more");
  assert.equal(runtime.addCapabilityButton.textContent, "Add additional capability");
  assert.equal(runtime.addAnotherAppButton.textContent, "Add another app");
  assert.equal(runtime.jsonPreviewLabel.textContent, "JSON preview");
  assert.equal(
    runtime.jsonPreviewCopy.getAttribute("aria-label"),
    "Copy {\"ip\": [\"*\"]}\n to your clip board.",
  );
  assert.equal(runtime.saveGrantButton.textContent, "Save grant");
  assert.equal(runtime.cancelButton.textContent, "Cancel");
});

test("device management posture subpage reuses device management translations", () => {
  const bundle = buildUserscriptBundle();
  const runtime = createRuntime({
    path: "/admin/settings/device-management/posture",
    buildBody: createSettingsDeviceManagementPostureBody,
  });

  vm.runInNewContext(bundle, runtime.context);

  assertAdminShellChinese(runtime);
  assertSettingsShellChinese(runtime);
  assert.equal(runtime.backLink.textContent, "← 返回设备管理");
  assert.equal(runtime.pageTitle.textContent, "添加设备状态集成");
  assert.equal(runtime.planBadge.textContent, "标准版");
  assert.equal(
    runtime.pageDescription.textContent,
    "设备状态集成会同步来自第三方系统的数据，这些数据可在你的策略文件中用作设备属性。",
  );
  assert.equal(runtime.learnMoreLink.textContent, "了解更多");
  assert.equal(runtime.continueButton.textContent, "继续");

  runtime.window.__tailscaleChinese.setLanguage("en");

  assertAdminShellEnglish(runtime);
  assertSettingsShellEnglish(runtime);
  assert.equal(runtime.backLink.textContent, "← Back to device management");
  assert.equal(runtime.pageTitle.textContent, "Add a device posture integration");
  assert.equal(runtime.planBadge.textContent, "Standard");
  assert.equal(
    runtime.pageDescription.textContent,
    "Device posture integrations synchronize data from third-party systems, which can be used as device attributes in your policy file.",
  );
  assert.equal(runtime.learnMoreLink.textContent, "Learn more");
  assert.equal(runtime.continueButton.textContent, "Continue");
});

test("additional admin pages translate stable shell labels, page controls, and restore English", () => {
  const bundle = buildUserscriptBundle();
  const cases = [
    {
      path: "/admin/machines/100.93.195.77",
      buildBody: createMachineDetailBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.allMachinesLink.textContent, "所有设备");
        assert.equal(runtime.detailLink.textContent, "100.93.195.77");
        assert.equal(runtime.pageTitle.textContent, "a1-0579");
        assert.equal(runtime.shareButton.textContent, "分享…");
        assert.equal(runtime.machineSettingsButton.textContent, "设备设置");
        assert.equal(
          runtime.machineSettingsButton.getAttribute("aria-label"),
          "a1-0579 的操作",
        );
        assert.equal(runtime.managedByLabel.textContent, "管理者");
        assert.equal(runtime.subnetsHeading.textContent, "子网");
        assert.equal(
          runtime.subnetsDescription.textContent,
          "子网允许你将物理网络路由暴露到 Tailscale。",
        );
        assert.equal(runtime.routingSettingsHeading.textContent, "路由设置");
        assert.equal(runtime.exitNodeLabel.textContent, "出口节点");
        assert.equal(runtime.notAllowedLabel.textContent, "不允许");
        assert.equal(runtime.editButton.textContent, "编辑");
        assert.equal(runtime.appsLabel.textContent, "应用");
        assert.equal(runtime.machineDetailsHeading.textContent, "设备详情");
        assert.equal(
          runtime.machineDetailsDescription.textContent,
          "关于此设备网络的信息，用于调试连接问题。",
        );
        assert.equal(runtime.creatorLabel.textContent, "创建者");
        assert.equal(runtime.osHostnameLabel.textContent, "操作系统主机名");
        assert.equal(runtime.tailscaleVersionLabel.textContent, "Tailscale 版本");
        assert.equal(runtime.createdLabel.textContent, "创建时间");
        assert.equal(runtime.lastSeenLabel.textContent, "最后在线");
        assert.equal(runtime.keyExpiryLabel.textContent, "密钥过期");
        assert.equal(runtime.attributesHeading.textContent, "属性");
        assert.equal(runtime.relaysHeading.textContent, "中继");
        assert.equal(runtime.addressesHeading.textContent, "地址");
        assert.equal(runtime.shortDomainLabel.textContent, "短域名");
        assert.equal(runtime.fullDomainLabel.textContent, "完整域名");
        assert.equal(runtime.clientConnectivityHeading.textContent, "客户端连通性");
        assert.equal(runtime.variesLabel.textContent, "视情况而定");
        assert.equal(runtime.noLabel.textContent, "否");
        assert.equal(runtime.yesLabel.textContent, "是");
        assert.equal(runtime.tlsCertificateHeading.textContent, "TLS 证书");
        assert.equal(runtime.domainLabel.textContent, "域名");
        assert.equal(runtime.statusLabel.textContent, "状态");
        assert.equal(runtime.validLabel.textContent, "有效");
        assert.equal(runtime.untilLabel.textContent, "至");
        assert.equal(runtime.monthsFromNowLabel.textContent, "2 个月后");
        assert.equal(runtime.endpointsAlphaHeading.textContent, "端点 Alpha 版本");
        assert.equal(
          runtime.noEndpointsLabel.textContent,
          "此设备未上报任何端点。",
        );
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.allMachinesLink.textContent, "All Machines");
        assert.equal(runtime.detailLink.textContent, "100.93.195.77");
        assert.equal(runtime.pageTitle.textContent, "a1-0579");
        assert.equal(runtime.shareButton.textContent, "Share…");
        assert.equal(runtime.machineSettingsButton.textContent, "Machine settings");
        assert.equal(
          runtime.machineSettingsButton.getAttribute("aria-label"),
          "Actions for a1-0579",
        );
        assert.equal(runtime.managedByLabel.textContent, "Managed by");
        assert.equal(runtime.subnetsHeading.textContent, "Subnets");
        assert.equal(
          runtime.subnetsDescription.textContent,
          "Subnets let you expose physical network routes onto Tailscale.",
        );
        assert.equal(runtime.routingSettingsHeading.textContent, "Routing Settings");
        assert.equal(runtime.exitNodeLabel.textContent, "Exit Node");
        assert.equal(runtime.notAllowedLabel.textContent, "Not Allowed");
        assert.equal(runtime.editButton.textContent, "Edit");
        assert.equal(runtime.appsLabel.textContent, "Apps");
        assert.equal(runtime.machineDetailsHeading.textContent, "Machine Details");
        assert.equal(
          runtime.machineDetailsDescription.textContent,
          "Information about this machine’s network. Used to debug connection issues.",
        );
        assert.equal(runtime.creatorLabel.textContent, "Creator");
        assert.equal(runtime.osHostnameLabel.textContent, "OS hostname");
        assert.equal(runtime.tailscaleVersionLabel.textContent, "Tailscale version");
        assert.equal(runtime.createdLabel.textContent, "Created");
        assert.equal(runtime.lastSeenLabel.textContent, "Last seen");
        assert.equal(runtime.keyExpiryLabel.textContent, "Key expiry");
        assert.equal(runtime.attributesHeading.textContent, "ATTRIBUTES");
        assert.equal(runtime.relaysHeading.textContent, "RELAYS");
        assert.equal(runtime.addressesHeading.textContent, "ADDRESSES");
        assert.equal(runtime.shortDomainLabel.textContent, "Short domain");
        assert.equal(runtime.fullDomainLabel.textContent, "Full domain");
        assert.equal(runtime.clientConnectivityHeading.textContent, "CLIENT CONNECTIVITY");
        assert.equal(runtime.variesLabel.textContent, "Varies");
        assert.equal(runtime.noLabel.textContent, "No");
        assert.equal(runtime.yesLabel.textContent, "Yes");
        assert.equal(runtime.tlsCertificateHeading.textContent, "TLS CERTIFICATE");
        assert.equal(runtime.domainLabel.textContent, "Domain");
        assert.equal(runtime.statusLabel.textContent, "Status");
        assert.equal(runtime.validLabel.textContent, "Valid");
        assert.equal(runtime.untilLabel.textContent, "until");
        assert.equal(runtime.monthsFromNowLabel.textContent, "2 months from now");
        assert.equal(runtime.endpointsAlphaHeading.textContent, "Endpoints Alpha version");
        assert.equal(
          runtime.noEndpointsLabel.textContent,
          "This machine is not reporting any endpoints.",
        );
      },
    },
    {
      path: "/admin/machines/100.83.17.52/ssh-setup",
      buildBody: createMachineSshSetupBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.allMachinesLink.textContent, "所有设备");
        assert.equal(runtime.machineNameLink.textContent, "txy");
        assert.equal(runtime.sshQuickstartLink.textContent, "SSH 快速入门");
        assert.equal(runtime.pageTitle.textContent, "Tailscale SSH 快速入门");
        assert.equal(
          runtime.introDescription.textContent,
          "Tailscale 可让你从 tailnet 中的其他设备轻松 SSH 到 txy — 以下是入门步骤。",
        );
        assert.equal(runtime.readDocsLead.textContent, "更多详情，请参阅");
        assert.equal(runtime.readDocsLink.textContent, "完整 Tailscale SSH 文档");
        assert.equal(runtime.enableSshHeading.textContent, "启用 Tailscale SSH");
        assert.equal(
          runtime.enableSshDescription.textContent,
          "在 txy 上运行此命令。它会告诉 Tailscale 守护进程处理 22 端口的传入 SSH 连接。",
        );
        assert.equal(runtime.allowSshHeading.textContent, "在 tailnet 策略中允许 SSH");
        assert.equal(
          runtime.policyAllowedLabel.textContent,
          "Tailscale SSH 已在你策略文件中允许。",
        );
        assert.equal(runtime.connectHeading.textContent, "连接");
        assert.equal(
          runtime.connectDescription.textContent,
          "在 tailnet 中的另一台设备上运行此命令，以 SSH 连接到 txy。",
        );
        assert.equal(runtime.goingFurtherHeading.textContent, "进一步探索");
        assert.equal(
          runtime.goingFurtherDescription.textContent,
          "充分利用 Tailscale SSH 的其他方式：",
        );
        assert.equal(
          runtime.checkModeItem.textContent,
          "使用检查模式，在 SSH 会话前按计划通过 IdP 重新进行身份验证",
        );
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.allMachinesLink.textContent, "All Machines");
        assert.equal(runtime.machineNameLink.textContent, "txy");
        assert.equal(runtime.sshQuickstartLink.textContent, "SSH quickstart");
        assert.equal(runtime.pageTitle.textContent, "Tailscale SSH quickstart");
        assert.equal(
          runtime.introDescription.textContent,
          "Tailscale makes it easy to SSH to txy from other devices on your tailnet - here's how to get started.",
        );
        assert.equal(runtime.readDocsLead.textContent, "For more details, read the");
        assert.equal(runtime.readDocsLink.textContent, "full Tailscale SSH docs");
        assert.equal(runtime.enableSshHeading.textContent, "Enable Tailscale SSH");
        assert.equal(
          runtime.enableSshDescription.textContent,
          "On txy, run this command. It tells the Tailscale daemon to handle incoming SSH on port 22.",
        );
        assert.equal(runtime.allowSshHeading.textContent, "Allow SSH in your tailnet policy");
        assert.equal(
          runtime.policyAllowedLabel.textContent,
          "Tailscale SSH is already allowed by your policy file.",
        );
        assert.equal(runtime.connectHeading.textContent, "Connect");
        assert.equal(
          runtime.connectDescription.textContent,
          "From another device on your tailnet, run this command to SSH into txy.",
        );
        assert.equal(runtime.goingFurtherHeading.textContent, "Going further");
        assert.equal(
          runtime.goingFurtherDescription.textContent,
          "Other ways to get more out of Tailscale SSH:",
        );
        assert.equal(
          runtime.checkModeItem.textContent,
          "Use Check mode to re-authenticate with your IdP on a schedule before SSH sessions",
        );
      },
    },
    {
      path: "/admin/apps",
      buildBody: createAppsBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "应用");
        assert.equal(
          runtime.pageDescription.textContent,
          "通过 tailnet 中的连接器将流量路由到第三方 SaaS 应用。",
        );
        assert.equal(runtime.learnMoreLink.textContent, "了解更多");
        assert.equal(runtime.learnMoreLink.getAttribute("aria-label"), "阅读相关文档");
        assert.equal(runtime.addAppButton.textContent, "添加应用");
        assert.equal(runtime.emptyHeading.textContent, "添加一个应用");
        assert.equal(
          runtime.emptyDescription.textContent,
          "应用让你无需终端用户进行任何配置，即可控制对第三方 SaaS 应用的访问。",
        );
        assert.equal(runtime.routesLabel.textContent, "条路由");
        assert.equal(runtime.nameHeader.textContent, "名称");
        assert.equal(runtime.domainsHeader.textContent, "域名");
        assert.equal(runtime.connectorsHeader.textContent, "连接器");
        assert.equal(runtime.statusHeader.textContent, "状态");
        assert.equal(runtime.actionHeader.textContent, "应用操作");
        assert.equal(runtime.dialogTitle.textContent, "添加一个应用");
        assert.equal(runtime.appNameLabel.textContent, "名称");
        assert.equal(
          runtime.appNameHint.textContent,
          "仅在管理控制台中显示。只能包含字母、数字和短横线。",
        );
        assert.equal(runtime.targetLabel.textContent, "目标");
        assert.equal(runtime.targetHint.textContent, "要为其路由流量的外部应用。");
        assert.equal(runtime.selectTargetButton.textContent, "选择目标");
        assert.equal(runtime.dialogConnectorsLabel.textContent, "连接器");
        assert.equal(runtime.connectorsLead.textContent, "配置哪些");
        assert.equal(runtime.connectorsLink.textContent, "连接器");
        assert.equal(runtime.connectorsTail.textContent, "可以为此应用路由流量。");
        assert.equal(runtime.selectAclTagsButton.textContent, "选择 ACL 标签");
        assert.equal(runtime.noAclTagsLabel.textContent, "未找到 ACL 标签。你可以在");
        assert.equal(runtime.accessControlsPageLink.textContent, "访问控制页面");
        assert.equal(runtime.cancelButton.textContent, "取消");
        assert.equal(runtime.saveButton.textContent, "保存");
        assert.equal(runtime.searchAppsInput.getAttribute("placeholder"), "搜索应用...");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Apps");
        assert.equal(
          runtime.pageDescription.textContent,
          "Route traffic to third-party SaaS apps through connectors on your tailnet.",
        );
        assert.equal(runtime.learnMoreLink.textContent, "Learn more");
        assert.equal(
          runtime.learnMoreLink.getAttribute("aria-label"),
          "Read documentation about Apps",
        );
        assert.equal(runtime.addAppButton.textContent, "Add app");
        assert.equal(runtime.emptyHeading.textContent, "Add an app");
        assert.equal(
          runtime.emptyDescription.textContent,
          "Apps let you control access to your third-party SaaS applications, without requiring any end user configuration.",
        );
        assert.equal(runtime.routesLabel.textContent, "routes");
        assert.equal(runtime.nameHeader.textContent, "NAME");
        assert.equal(runtime.domainsHeader.textContent, "DOMAINS");
        assert.equal(runtime.connectorsHeader.textContent, "CONNECTORS");
        assert.equal(runtime.statusHeader.textContent, "STATUS");
        assert.equal(runtime.actionHeader.textContent, "APP ACTION MENU");
        assert.equal(runtime.dialogTitle.textContent, "Add an app");
        assert.equal(runtime.appNameLabel.textContent, "Name");
        assert.equal(
          runtime.appNameHint.textContent,
          "Only shown in the admin console. Only letters, numbers, and dashes.",
        );
        assert.equal(runtime.targetLabel.textContent, "Target");
        assert.equal(runtime.targetHint.textContent, "External app to route traffic for.");
        assert.equal(runtime.selectTargetButton.textContent, "Select a target");
        assert.equal(runtime.dialogConnectorsLabel.textContent, "Connectors");
        assert.equal(runtime.connectorsLead.textContent, "Configure which");
        assert.equal(runtime.connectorsLink.textContent, "connectors");
        assert.equal(runtime.connectorsTail.textContent, "can route traffic for this app.");
        assert.equal(runtime.selectAclTagsButton.textContent, "Select ACL tags");
        assert.equal(
          runtime.noAclTagsLabel.textContent,
          "No ACL tags found. You can create ACL tags from the",
        );
        assert.equal(runtime.accessControlsPageLink.textContent, "Access Controls page");
        assert.equal(runtime.cancelButton.textContent, "Cancel");
        assert.equal(runtime.saveButton.textContent, "Save");
        assert.equal(runtime.searchAppsInput.getAttribute("placeholder"), "Search apps...");
      },
    },
    {
      path: "/admin/services",
      buildBody: createServicesBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "服务");
        assert.equal(runtime.giveFeedbackButton.textContent, "提交反馈");
        assert.equal(
          runtime.pageDescription.textContent,
          "你网络中已发布和已发现的服务。",
        );
        assert.equal(runtime.advertisedTab.textContent, "已发布");
        assert.equal(runtime.discoveredTab.textContent, "已发现");
        assert.equal(runtime.emptyHeading.textContent, "定义你的第一个服务");
        assert.equal(
          runtime.emptyDescription.textContent,
          "通过从设备发布服务，在 tailnet 中共享服务。",
        );
        assert.equal(runtime.step1Heading.textContent, "1. 定义服务");
        assert.equal(
          runtime.step1Description.textContent,
          "为该服务将提供的进程或数据命名、描述并赋予标识。",
        );
        assert.equal(runtime.step2Heading.textContent, "2. 发布并提供服务");
        assert.equal(
          runtime.step2Description.textContent,
          "在主机上发布服务将提供的端口。",
        );
        assert.equal(runtime.step3Heading.textContent, "3. 审批");
        assert.equal(
          runtime.step3Description.textContent,
          "审查正确配置，并手动或自动批准各服务的主机。",
        );
        assert.equal(runtime.defineServiceLink.textContent, "定义服务");
        assert.equal(runtime.learnMoreButton.textContent, "了解更多");
        assert.equal(runtime.loadingEndpointsLabel.textContent, "正在加载端点...");
        assert.equal(
          runtime.searchEndpointsInput.getAttribute("placeholder"),
          "搜索端点...",
        );
        assert.equal(runtime.typeFilterButton.textContent, "类型");
        assert.equal(runtime.userFilterButton.textContent, "用户");
        assert.equal(runtime.noEndpointsHeading.textContent, "暂无已上报端点");
        assert.equal(
          runtime.noEndpointsDescription.textContent,
          "如果你的网络刚启用端点收集，设备可能需要一些时间才会开始上报其端点。",
        );
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Services");
        assert.equal(runtime.giveFeedbackButton.textContent, "Give feedback");
        assert.equal(
          runtime.pageDescription.textContent,
          "Services advertised and discovered within your network.",
        );
        assert.equal(runtime.advertisedTab.textContent, "Advertised");
        assert.equal(runtime.discoveredTab.textContent, "Discovered");
        assert.equal(runtime.emptyHeading.textContent, "Define your first Service");
        assert.equal(
          runtime.emptyDescription.textContent,
          "Share Services in your tailnet by advertising Services from your devices.",
        );
        assert.equal(runtime.step1Heading.textContent, "1. Define a Service");
        assert.equal(
          runtime.step1Description.textContent,
          "Name, describe, and give identity to the process or data the Service will provide.",
        );
        assert.equal(runtime.step2Heading.textContent, "2. Advertise and serve");
        assert.equal(
          runtime.step2Description.textContent,
          "From the host, advertise the Service ports from which it will serve.",
        );
        assert.equal(runtime.step3Heading.textContent, "3. Approve");
        assert.equal(
          runtime.step3Description.textContent,
          "Review proper configuration and approve each Service’s hosts, manually or automatically.",
        );
        assert.equal(runtime.defineServiceLink.textContent, "Define Service");
        assert.equal(runtime.learnMoreButton.textContent, "Learn more");
        assert.equal(runtime.loadingEndpointsLabel.textContent, "Loading endpoints...");
        assert.equal(
          runtime.searchEndpointsInput.getAttribute("placeholder"),
          "Search endpoints...",
        );
        assert.equal(runtime.typeFilterButton.textContent, "Type");
        assert.equal(runtime.userFilterButton.textContent, "User");
        assert.equal(runtime.noEndpointsHeading.textContent, "No reported endpoints");
        assert.equal(
          runtime.noEndpointsDescription.textContent,
          "If your network just turned on endpoint collection, machines may take some time to start sending their endpoints.",
        );
      },
    },
    {
      path: "/admin/services/new",
      buildBody: createServicesNewBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.backLink.textContent, "返回所有服务");
        assert.equal(runtime.pageTitle.textContent, "定义服务");
        assert.equal(runtime.serviceNameLabel.textContent, "服务名称");
        assert.equal(
          runtime.serviceAddressLabel.textContent,
          "此服务将在你的 tailnet 中以下列地址提供： name.tailf14c18.ts.net",
        );
        assert.equal(
          runtime.serviceNameHint.textContent,
          "仅允许字母数字和短横线，最多 63 个字符。",
        );
        assert.equal(runtime.descriptionLabel.textContent, "描述");
        assert.equal(runtime.descriptionHint.textContent, "最多 80 个字符");
        assert.equal(runtime.portsLabel.textContent, "端口");
        assert.equal(runtime.portsHint.textContent, "此服务监听哪些端口？");
        assert.equal(runtime.learnMoreLink.textContent, "了解更多");
        assert.equal(
          runtime.learnMoreLink.getAttribute("aria-label"),
          "阅读相关文档",
        );
        assert.equal(
          runtime.portsEligibilityHint.textContent,
          "只有发布了全部所列端口的主机才会成为候选项。",
        );
        assert.equal(runtime.serviceTagsLabel.textContent, "服务标签");
        assert.equal(
          runtime.serviceTagsHint.textContent,
          "可使用 ACL 标签来标识此服务。",
        );
        assert.equal(runtime.noTagsLabel.textContent, "尚未分配标签。");
        assert.equal(runtime.addTagsButton.textContent, "添加标签");
        assert.equal(runtime.manageTagsLink.textContent, "在访问控制中管理标签");
        assert.equal(runtime.defineServiceButton.textContent, "定义服务");
        assert.equal(runtime.cancelLink.textContent, "取消");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.backLink.textContent, "Back to All Services");
        assert.equal(runtime.pageTitle.textContent, "Define a Service");
        assert.equal(runtime.serviceNameLabel.textContent, "Service name");
        assert.equal(
          runtime.serviceAddressLabel.textContent,
          "This Service will be available in your tailnet at name.tailf14c18.ts.net",
        );
        assert.equal(
          runtime.serviceNameHint.textContent,
          "Only alphanumeric characters and dashes allowed, max 63 characters.",
        );
        assert.equal(runtime.descriptionLabel.textContent, "Description");
        assert.equal(runtime.descriptionHint.textContent, "Max 80 characters");
        assert.equal(runtime.portsLabel.textContent, "Ports");
        assert.equal(
          runtime.portsHint.textContent,
          "Which ports does this Service listen on?",
        );
        assert.equal(runtime.learnMoreLink.textContent, "Learn more");
        assert.equal(
          runtime.learnMoreLink.getAttribute("aria-label"),
          "Read documentation about Learn more about Services",
        );
        assert.equal(
          runtime.portsEligibilityHint.textContent,
          "Only hosts advertising all listed ports will be eligible candidates.",
        );
        assert.equal(runtime.serviceTagsLabel.textContent, "Service tags");
        assert.equal(
          runtime.serviceTagsHint.textContent,
          "ACL tags can be used to identify this Service.",
        );
        assert.equal(runtime.noTagsLabel.textContent, "No tags assigned.");
        assert.equal(runtime.addTagsButton.textContent, "Add tags");
        assert.equal(
          runtime.manageTagsLink.textContent,
          "Manage tags in Access Controls",
        );
        assert.equal(runtime.defineServiceButton.textContent, "Define Service");
        assert.equal(runtime.cancelLink.textContent, "Cancel");
      },
    },
    {
      path: "/admin/users",
      buildBody: createUsersBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "用户");
        assert.equal(
          runtime.pageDescription.textContent,
          "管理你网络中的用户及其权限。",
        );
        assert.equal(runtime.searchInput.getAttribute("placeholder"), "搜索用户...");
        assert.equal(runtime.statusButton.textContent, "状态");
        assert.equal(runtime.roleButton.textContent, "角色");
        assert.equal(runtime.exportButton.getAttribute("aria-label"), "导出用户数据");
        assert.equal(runtime.exportButton.getAttribute("title"), "导出用户数据");
        assert.equal(runtime.inviteUsersHeading.textContent, "邀请用户");
        assert.equal(
          runtime.inviteUsersDescription.textContent,
          "你可以生成邀请链接并分享给用户，以邀请他们加入。",
        );
        assert.equal(runtime.inviteExternalUsersButton.textContent, "邀请外部用户");
        assert.equal(runtime.approvalRequiredHeading.textContent, "需要审批");
        assert.equal(
          runtime.approvalRequiredDescription.textContent,
          "受邀用户只有在管理员批准后才能加入。",
        );
        assert.equal(runtime.editInSettingsLink.textContent, "在设置中编辑");
        assert.equal(runtime.userCountLabel.textContent, "用户");
        assert.equal(runtime.userHeader.textContent, "用户");
        assert.equal(runtime.roleHeader.textContent, "角色");
        assert.equal(runtime.joinedHeader.textContent, "加入时间");
        assert.equal(runtime.lastSeenHeader.textContent, "最后在线");
        assert.equal(runtime.actionHeader.textContent, "用户操作");
        assert.equal(runtime.ownerRole.textContent, "所有者");
        assert.equal(runtime.connectedStatus.textContent, "已连接");
        assert.equal(runtime.actionButton.getAttribute("aria-label"), "jack mika 的操作");
        assert.equal(runtime.viewDevicesItem.textContent, "查看设备");
        assert.equal(runtime.viewRecentActivityItem.textContent, "查看最近活动");
        assert.equal(runtime.viewAccessRulesItem.textContent, "查看访问控制规则");
        assert.equal(runtime.editRoleItem.textContent, "编辑角色…");
        assert.equal(runtime.editGroupMembershipItem.textContent, "编辑群组成员资格…");
        assert.equal(runtime.deleteUserItem.textContent, "删除用户…");
        assert.equal(runtime.inviteDialogTitle.textContent, "邀请外部用户");
        assert.equal(
          runtime.inviteDialogDescription.textContent,
          "邀请用户加入此 tailnet，并按 ACL 允许访问其中的设备。如果你只想让某个用户访问一台设备，请改为分享该设备。",
        );
        assert.equal(runtime.availableSeatsHeading.textContent, "可用席位");
        assert.equal(
          runtime.availableSeatsDescription.textContent,
          "受邀用户一旦加入 tailnet，就会占用一个席位。",
        );
        assert.equal(runtime.learnMoreSeatsLink.textContent, "了解席位");
        assert.equal(runtime.copyInviteLinkTab.textContent, "复制邀请链接");
        assert.equal(runtime.inviteViaEmailTab.textContent, "通过电子邮件邀请");
        assert.equal(runtime.selectRoleLabel.textContent, "选择角色");
        assert.equal(runtime.roleHint.textContent, "通过该链接注册将获得此角色。");
        assert.equal(runtime.memberRoleButton.textContent, "成员");
        assert.equal(runtime.copyInviteLinkButton.textContent, "复制邀请链接");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Users");
        assert.equal(
          runtime.pageDescription.textContent,
          "Manage the users in your network and their permissions.",
        );
        assert.equal(runtime.searchInput.getAttribute("placeholder"), "Search users...");
        assert.equal(runtime.statusButton.textContent, "Status");
        assert.equal(runtime.roleButton.textContent, "Role");
        assert.equal(runtime.exportButton.getAttribute("aria-label"), "Export users data");
        assert.equal(runtime.exportButton.getAttribute("title"), "Export users data");
        assert.equal(runtime.inviteUsersHeading.textContent, "Invite users");
        assert.equal(
          runtime.inviteUsersDescription.textContent,
          "You can invite users by generating an invite link to share with them.",
        );
        assert.equal(runtime.inviteExternalUsersButton.textContent, "Invite external users");
        assert.equal(runtime.approvalRequiredHeading.textContent, "Approval is required");
        assert.equal(
          runtime.approvalRequiredDescription.textContent,
          "Invited users can only join after being approved by an admin.",
        );
        assert.equal(runtime.editInSettingsLink.textContent, "Edit in Settings");
        assert.equal(runtime.userCountLabel.textContent, "user");
        assert.equal(runtime.userHeader.textContent, "User");
        assert.equal(runtime.roleHeader.textContent, "ROLE");
        assert.equal(runtime.joinedHeader.textContent, "Joined");
        assert.equal(runtime.lastSeenHeader.textContent, "Last seen");
        assert.equal(runtime.actionHeader.textContent, "Users action menu");
        assert.equal(runtime.ownerRole.textContent, "Owner");
        assert.equal(runtime.connectedStatus.textContent, "Connected");
        assert.equal(runtime.actionButton.getAttribute("aria-label"), "Actions for jack mika");
        assert.equal(runtime.viewDevicesItem.textContent, "View devices");
        assert.equal(runtime.viewRecentActivityItem.textContent, "View recent activity");
        assert.equal(runtime.viewAccessRulesItem.textContent, "View access control rules");
        assert.equal(runtime.editRoleItem.textContent, "Edit role…");
        assert.equal(runtime.editGroupMembershipItem.textContent, "Edit group membership…");
        assert.equal(runtime.deleteUserItem.textContent, "Delete user…");
        assert.equal(runtime.inviteDialogTitle.textContent, "Invite external user");
        assert.equal(
          runtime.inviteDialogDescription.textContent,
          "Invite users to join this tailnet and access its machines, as allowed by ACLs. If you only want to give a user access to one machine, share the machine instead.",
        );
        assert.equal(runtime.availableSeatsHeading.textContent, "Available seats");
        assert.equal(
          runtime.availableSeatsDescription.textContent,
          "Once an invited user joins the tailnet, they will occupy a seat.",
        );
        assert.equal(runtime.learnMoreSeatsLink.textContent, "Learn more about seats");
        assert.equal(runtime.copyInviteLinkTab.textContent, "Copy invite link");
        assert.equal(runtime.inviteViaEmailTab.textContent, "Invite via email");
        assert.equal(runtime.selectRoleLabel.textContent, "Select role");
        assert.equal(runtime.roleHint.textContent, "Signing up via the link will grant this role.");
        assert.equal(runtime.memberRoleButton.textContent, "Member");
        assert.equal(runtime.copyInviteLinkButton.textContent, "Copy invite link");
      },
    },
    {
      path: "/admin/acls/visual/general-access-rules",
      buildBody: createAccessControlsBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "访问控制");
        assert.equal(runtime.visualEditorTab.textContent, "可视化编辑器");
        assert.equal(runtime.jsonEditorTab.textContent, "JSON 编辑器");
        assert.equal(runtime.giveFeedbackButton.textContent, "提交反馈");
        assert.equal(
          runtime.pageDescription.textContent,
          "控制谁以及哪些设备可以在你的网络中建立连接。如果你需要更高级或更定制的控制，或更喜欢直接编写 JSON，请切换到原始 JSON 编辑器。",
        );
        assert.equal(runtime.generalAccessRulesTab.textContent, "常规访问规则");
        assert.equal(runtime.sshTab.textContent, "Tailscale SSH");
        assert.equal(runtime.testsTab.textContent, "测试");
        assert.equal(runtime.groupsTab.textContent, "群组");
        assert.equal(runtime.tagsTab.textContent, "标签");
        assert.equal(runtime.ipSetsTab.textContent, "IP 集");
        assert.equal(runtime.hostsTab.textContent, "主机");
        assert.equal(runtime.nodeAttributesTab.textContent, "节点属性");
        assert.equal(runtime.devicePostureTab.textContent, "设备状态");
        assert.equal(runtime.autoApproversTab.textContent, "自动审批者");
        assert.equal(
          runtime.searchInput.getAttribute("placeholder"),
          "按用户、群组、设备、标签、端口、IP 地址等搜索...",
        );
        assert.equal(runtime.toggleMenuButton.getAttribute("aria-label"), "切换菜单");
        assert.equal(runtime.addRuleButton.textContent, "添加规则");
        assert.equal(runtime.sourcesLabel.textContent, "来源");
        assert.equal(runtime.destinationsLabel.textContent, "可访问目标");
        assert.equal(runtime.portProtocolLabel.textContent, "在端口和协议上");
        assert.equal(runtime.commentLabel.textContent, "备注");
        assert.equal(runtime.actionHeader.textContent, "常规访问规则操作");
        assert.equal(runtime.defaultSource1.textContent, "所有用户和设备");
        assert.equal(runtime.defaultSource2.textContent, "所有用户和设备");
        assert.equal(runtime.defaultPorts.textContent, "所有端口和协议");
        assert.equal(
          runtime.actionMenuButton.getAttribute("aria-label"),
          "授权策略 0 的操作",
        );
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Access controls");
        assert.equal(runtime.visualEditorTab.textContent, "Visual editor");
        assert.equal(runtime.jsonEditorTab.textContent, "JSON editor");
        assert.equal(runtime.giveFeedbackButton.textContent, "Give feedback");
        assert.equal(
          runtime.pageDescription.textContent,
          "Control who and which devices are allowed to connect in your network. If you need more advanced or customized control, or if you prefer to write in JSON directly, switch to the original JSON editor.",
        );
        assert.equal(runtime.generalAccessRulesTab.textContent, "General access rules");
        assert.equal(runtime.sshTab.textContent, "Tailscale SSH");
        assert.equal(runtime.testsTab.textContent, "Tests");
        assert.equal(runtime.groupsTab.textContent, "Groups");
        assert.equal(runtime.tagsTab.textContent, "Tags");
        assert.equal(runtime.ipSetsTab.textContent, "IP sets");
        assert.equal(runtime.hostsTab.textContent, "Hosts");
        assert.equal(runtime.nodeAttributesTab.textContent, "Node attributes");
        assert.equal(runtime.devicePostureTab.textContent, "Device posture");
        assert.equal(runtime.autoApproversTab.textContent, "Auto approvers");
        assert.equal(
          runtime.searchInput.getAttribute("placeholder"),
          "Search by user, group, device, tag, port, IP address...etc.",
        );
        assert.equal(runtime.toggleMenuButton.getAttribute("aria-label"), "toggle menu");
        assert.equal(runtime.addRuleButton.textContent, "Add rule");
        assert.equal(runtime.sourcesLabel.textContent, "Sources");
        assert.equal(runtime.destinationsLabel.textContent, "can access destinations");
        assert.equal(runtime.portProtocolLabel.textContent, "on port and protocol");
        assert.equal(runtime.commentLabel.textContent, "Comment");
        assert.equal(runtime.actionHeader.textContent, "General access rules action menu");
        assert.equal(runtime.defaultSource1.textContent, "All users and devices");
        assert.equal(runtime.defaultSource2.textContent, "All users and devices");
        assert.equal(runtime.defaultPorts.textContent, "All ports and protocols");
        assert.equal(
          runtime.actionMenuButton.getAttribute("aria-label"),
          "Actions for grant policy 0",
        );
      },
    },
    {
      path: "/admin/acls/visual/tailscale-ssh",
      buildBody: createAccessControlsSshBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "访问控制");
        assert.equal(runtime.giveFeedbackButton.textContent, "提交反馈");
        assert.equal(runtime.sshTab.textContent, "Tailscale SSH");
        assert.equal(
          runtime.searchInput.getAttribute("placeholder"),
          "按用户、群组、设备、动作等搜索...",
        );
        assert.equal(runtime.asUserLabel.textContent, "以用户身份");
        assert.equal(runtime.checkModeLabel.textContent, "使用检查模式");
        assert.equal(runtime.actionHeader.textContent, "SSH 操作菜单");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Access controls");
        assert.equal(runtime.giveFeedbackButton.textContent, "Give feedback");
        assert.equal(runtime.sshTab.textContent, "Tailscale SSH");
        assert.equal(
          runtime.searchInput.getAttribute("placeholder"),
          "Search by user, group, device, action...etc.",
        );
        assert.equal(runtime.asUserLabel.textContent, "as user");
        assert.equal(runtime.checkModeLabel.textContent, "with check mode");
        assert.equal(runtime.actionHeader.textContent, "SSH action menu");
      },
    },
    {
      path: "/admin/acls/visual/tests",
      buildBody: createAccessControlsTestsBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.testsTab.textContent, "测试");
        assert.equal(runtime.generalTestsHeading.textContent, "常规测试");
        assert.equal(runtime.addTestButton.textContent, "添加测试");
        assert.equal(runtime.emptyTestsState1.textContent, "你尚未定义任何测试。");
        assert.equal(runtime.sshTestsHeading.textContent, "SSH 测试");
        assert.equal(runtime.addSshTestButton.textContent, "添加 SSH 测试");
        assert.equal(runtime.emptyTestsState2.textContent, "你尚未定义任何测试。");
        assert.equal(runtime.sshTestsActionMenu.textContent, "SSH 测试操作菜单");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.testsTab.textContent, "Tests");
        assert.equal(runtime.generalTestsHeading.textContent, "General tests");
        assert.equal(runtime.addTestButton.textContent, "Add test");
        assert.equal(
          runtime.emptyTestsState1.textContent,
          "You have not yet defined any tests.",
        );
        assert.equal(runtime.sshTestsHeading.textContent, "SSH tests");
        assert.equal(runtime.addSshTestButton.textContent, "Add SSH test");
        assert.equal(
          runtime.emptyTestsState2.textContent,
          "You have not yet defined any tests.",
        );
        assert.equal(runtime.sshTestsActionMenu.textContent, "SSH tests action menu");
      },
    },
    {
      path: "/admin/acls/visual/groups",
      buildBody: createAccessControlsGroupsBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.groupsTab.textContent, "群组");
        assert.equal(runtime.userDefinedGroupsHeading.textContent, "用户自定义群组");
        assert.equal(runtime.createGroupButton.textContent, "创建群组");
        assert.equal(runtime.autogroupsHeading.textContent, "自动群组");
        assert.equal(runtime.autogroupsActionMenu.textContent, "自动群组操作菜单");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.groupsTab.textContent, "Groups");
        assert.equal(runtime.userDefinedGroupsHeading.textContent, "User-defined groups");
        assert.equal(runtime.createGroupButton.textContent, "Create group");
        assert.equal(runtime.autogroupsHeading.textContent, "Autogroups");
        assert.equal(runtime.autogroupsActionMenu.textContent, "Autogroups action menu");
      },
    },
    {
      path: "/admin/acls/visual/ipsets",
      buildBody: createAccessControlsIpSetsBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.ipSetsTab.textContent, "IP 集");
        assert.equal(
          runtime.searchInput.getAttribute("placeholder"),
          "按名称、CIDR、IP 地址、主机或 IP 集搜索。",
        );
        assert.equal(runtime.createIpSetButton.textContent, "创建 IP 集");
        assert.equal(runtime.targetsLabel.textContent, "目标");
        assert.equal(runtime.actionHeader.textContent, "IP 集操作菜单");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.ipSetsTab.textContent, "IP sets");
        assert.equal(
          runtime.searchInput.getAttribute("placeholder"),
          "Search by name, CIDR, IP address, host, or IP set.",
        );
        assert.equal(runtime.createIpSetButton.textContent, "Create IP set");
        assert.equal(runtime.targetsLabel.textContent, "Targets");
        assert.equal(runtime.actionHeader.textContent, "IP sets action menu");
      },
    },
    {
      path: "/admin/acls/visual/auto-approvers",
      buildBody: createAccessControlsAutoApproversBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.autoApproversTab.textContent, "自动审批者");
        assert.equal(runtime.routesHeading.textContent, "路由");
        assert.equal(runtime.addRouteButton.textContent, "添加路由");
        assert.equal(runtime.emptyRoutesState.textContent, "未找到路由自动审批者。");
        assert.equal(runtime.defineServiceButton.textContent, "定义服务");
        assert.equal(runtime.emptyServicesState.textContent, "未找到服务自动审批者。");
        assert.equal(runtime.exitNodesHeading.textContent, "出口节点");
        assert.equal(runtime.emptyExitNodesState.textContent, "你还没有添加任何出口节点。");
        assert.equal(
          runtime.exitNodesActionMenu.textContent,
          "出口节点自动审批者操作菜单",
        );
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.autoApproversTab.textContent, "Auto approvers");
        assert.equal(runtime.routesHeading.textContent, "Routes");
        assert.equal(runtime.addRouteButton.textContent, "Add route");
        assert.equal(
          runtime.emptyRoutesState.textContent,
          "No auto approvers for routes found.",
        );
        assert.equal(runtime.defineServiceButton.textContent, "Define Service");
        assert.equal(
          runtime.emptyServicesState.textContent,
          "No auto approvers for services found.",
        );
        assert.equal(runtime.exitNodesHeading.textContent, "Exit nodes");
        assert.equal(
          runtime.emptyExitNodesState.textContent,
          "You have not added any exit nodes.",
        );
        assert.equal(
          runtime.exitNodesActionMenu.textContent,
          "Exit node auto approvers action menu",
        );
      },
    },
    {
      path: "/admin/acls/file",
      buildBody: createAccessControlsFileBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "访问控制");
        assert.equal(runtime.visualEditorTab.textContent, "可视化编辑器");
        assert.equal(runtime.jsonEditorTab.textContent, "JSON 编辑器");
        assert.equal(runtime.editFileTab.textContent, "编辑文件");
        assert.equal(runtime.previewChangesTab.textContent, "预览更改");
        assert.equal(runtime.previewRulesTab.textContent, "预览规则");
        assert.equal(runtime.docsHeading.textContent, "文档");
        assert.equal(runtime.syntaxReferenceLink.textContent, "语法参考");
        assert.equal(runtime.tagsReferenceLink.textContent, "标签参考");
        assert.equal(runtime.sshReferenceLink.textContent, "SSH 参考");
        assert.equal(runtime.funnelReferenceLink.textContent, "Funnel 参考");
        assert.equal(runtime.testsReferenceLink.textContent, "测试参考");
        assert.equal(runtime.examplesLink.textContent, "示例");
        assert.equal(runtime.disableSshButton.textContent, "禁用 Tailscale SSH…");
        assert.equal(runtime.convertAclsHeading.textContent, "将 ACL 转换为 grants");
        assert.equal(runtime.convertToGrantsButton.textContent, "转换为 grants...");
        assert.equal(runtime.discardChangesButton.textContent, "放弃更改");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Access controls");
        assert.equal(runtime.visualEditorTab.textContent, "Visual editor");
        assert.equal(runtime.jsonEditorTab.textContent, "JSON editor");
        assert.equal(runtime.editFileTab.textContent, "Edit file");
        assert.equal(runtime.previewChangesTab.textContent, "Preview changes");
        assert.equal(runtime.previewRulesTab.textContent, "Preview rules");
        assert.equal(runtime.docsHeading.textContent, "Docs");
        assert.equal(runtime.syntaxReferenceLink.textContent, "Syntax reference");
        assert.equal(runtime.tagsReferenceLink.textContent, "Tags reference");
        assert.equal(runtime.sshReferenceLink.textContent, "SSH reference");
        assert.equal(runtime.funnelReferenceLink.textContent, "Funnel reference");
        assert.equal(runtime.testsReferenceLink.textContent, "Tests reference");
        assert.equal(runtime.examplesLink.textContent, "Examples");
        assert.equal(runtime.disableSshButton.textContent, "Disable Tailscale SSH…");
        assert.equal(runtime.convertAclsHeading.textContent, "Convert ACLs to grants");
        assert.equal(runtime.convertToGrantsButton.textContent, "Convert to grants...");
        assert.equal(runtime.discardChangesButton.textContent, "Discard changes");
      },
    },
    {
      path: "/admin/acls/diff",
      buildBody: createAccessControlsDiffBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "访问控制");
        assert.equal(runtime.editFileTab.textContent, "编辑文件");
        assert.equal(runtime.previewChangesTab.textContent, "预览更改");
        assert.equal(runtime.previewRulesTab.textContent, "预览规则");
        assert.equal(runtime.discardChangesButton.textContent, "放弃更改");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Access controls");
        assert.equal(runtime.editFileTab.textContent, "Edit file");
        assert.equal(runtime.previewChangesTab.textContent, "Preview changes");
        assert.equal(runtime.previewRulesTab.textContent, "Preview rules");
        assert.equal(runtime.discardChangesButton.textContent, "Discard changes");
      },
    },
    {
      path: "/admin/acls/preview",
      buildBody: createAccessControlsPreviewBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "访问控制");
        assert.equal(runtime.editFileTab.textContent, "编辑文件");
        assert.equal(runtime.previewChangesTab.textContent, "预览更改");
        assert.equal(runtime.previewRulesTab.textContent, "预览规则");
        assert.equal(runtime.previewRulesHeading.textContent, "预览规则");
        assert.equal(
          runtime.previewRulesDescription.textContent,
          "预览某个用户的设备可访问的主机和端口。",
        );
        assert.equal(runtime.selectUserButton.textContent, "选择用户或标签");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Access controls");
        assert.equal(runtime.editFileTab.textContent, "Edit file");
        assert.equal(runtime.previewChangesTab.textContent, "Preview changes");
        assert.equal(runtime.previewRulesTab.textContent, "Preview rules");
        assert.equal(runtime.previewRulesHeading.textContent, "Preview Rules");
        assert.equal(
          runtime.previewRulesDescription.textContent,
          "Preview which hosts and ports a user’s machines are allowed to access.",
        );
        assert.equal(runtime.selectUserButton.textContent, "Select a user or tag");
      },
    },
    {
      path: "/admin/logs",
      buildBody: createLogsBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "日志");
        assert.equal(
          runtime.pageDescription.textContent,
          "配置并查看 tailnet 内的日志和事件。",
        );
        assert.equal(runtime.configurationLogsTab.textContent, "配置日志");
        assert.equal(runtime.networkFlowLogsTab.textContent, "网络流量日志");
        assert.equal(
          runtime.configurationDescription.textContent,
          "查看过去 90 天内对 tailnet 配置设置所做更改的日志。",
        );
        assert.equal(runtime.notStreamingStatus.textContent, "未流式传输");
        assert.equal(runtime.startStreamingButton.textContent, "开始流式传输…");
        assert.equal(
          runtime.timeframeButton.textContent,
          "时间范围： 2026/04/12 – 2026/04/13",
        );
        assert.equal(runtime.actionFilterButton.textContent, "操作");
        assert.equal(runtime.actorFilterButton.textContent, "执行者");
        assert.equal(runtime.targetFilterButton.textContent, "目标");
        assert.equal(runtime.timestampHeader.textContent, "时间戳（本地时间）");
        assert.equal(runtime.actionHeader.textContent, "操作");
        assert.equal(runtime.actorHeader.textContent, "执行者");
        assert.equal(runtime.targetHeader.textContent, "目标");
        assert.equal(runtime.loginEvent.textContent, "登录管理控制台");
        assert.equal(runtime.adminConsoleTarget.textContent, "管理控制台");
        assert.equal(runtime.enableKeyExpiryEvent.textContent, "为设备启用密钥过期");
        assert.equal(runtime.disableKeyExpiryEvent.textContent, "为设备禁用密钥过期");
        assert.equal(runtime.exportButton.textContent, "导出日志");
        assert.equal(runtime.exportButton.getAttribute("aria-label"), "导出日志数据");
        assert.equal(runtime.exportButton.getAttribute("title"), "导出日志数据");
        assert.equal(
          runtime.searchActionsInput.getAttribute("placeholder"),
          "搜索操作...",
        );
        assert.equal(
          runtime.searchActionsInput.getAttribute("aria-label"),
          "搜索操作...",
        );
        assert.equal(runtime.applyButton.textContent, "应用");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Logs");
        assert.equal(
          runtime.pageDescription.textContent,
          "Configure and explore logs and events within your tailnet.",
        );
        assert.equal(runtime.configurationLogsTab.textContent, "Configuration logs");
        assert.equal(runtime.networkFlowLogsTab.textContent, "Network flow logs");
        assert.equal(
          runtime.configurationDescription.textContent,
          "Inspect logs of changes made to your tailnet’s configuration settings during the last 90 days.",
        );
        assert.equal(runtime.notStreamingStatus.textContent, "Not streaming");
        assert.equal(runtime.startStreamingButton.textContent, "Start streaming…");
        assert.equal(
          runtime.timeframeButton.textContent,
          "Timeframe: 2026/04/12 – 2026/04/13",
        );
        assert.equal(runtime.actionFilterButton.textContent, "Action");
        assert.equal(runtime.actorFilterButton.textContent, "Actor");
        assert.equal(runtime.targetFilterButton.textContent, "Target");
        assert.equal(runtime.timestampHeader.textContent, "Timestamp (Local Time)");
        assert.equal(runtime.actionHeader.textContent, "ACTION");
        assert.equal(runtime.actorHeader.textContent, "ACTOR");
        assert.equal(runtime.targetHeader.textContent, "TARGET");
        assert.equal(runtime.loginEvent.textContent, "Log in to admin console");
        assert.equal(runtime.adminConsoleTarget.textContent, "Admin console");
        assert.equal(runtime.enableKeyExpiryEvent.textContent, "Enable key expiry for node");
        assert.equal(runtime.disableKeyExpiryEvent.textContent, "Disable key expiry for node");
        assert.equal(runtime.exportButton.textContent, "Export logs");
        assert.equal(runtime.exportButton.getAttribute("aria-label"), "Export logs data");
        assert.equal(runtime.exportButton.getAttribute("title"), "Export logs data");
        assert.equal(
          runtime.searchActionsInput.getAttribute("placeholder"),
          "Search actions...",
        );
        assert.equal(
          runtime.searchActionsInput.getAttribute("aria-label"),
          "Search actions...",
        );
        assert.equal(runtime.applyButton.textContent, "Apply");
      },
    },
    {
      path: "/admin/logs/network",
      buildBody: createLogsNetworkBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "日志");
        assert.equal(
          runtime.pageDescription.textContent,
          "配置并查看 tailnet 内的日志和事件。",
        );
        assert.equal(runtime.configurationLogsTab.textContent, "配置日志");
        assert.equal(runtime.networkFlowLogsTab.textContent, "网络流量日志");
        assert.equal(
          runtime.networkDescription.textContent,
          "tailnet 中设备之间网络活动的日志。",
        );
        assert.equal(runtime.notLoggingStatus.textContent, "未记录");
        assert.equal(runtime.startLoggingButton.textContent, "开始记录…");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Logs");
        assert.equal(
          runtime.pageDescription.textContent,
          "Configure and explore logs and events within your tailnet.",
        );
        assert.equal(runtime.configurationLogsTab.textContent, "Configuration logs");
        assert.equal(runtime.networkFlowLogsTab.textContent, "Network flow logs");
        assert.equal(
          runtime.networkDescription.textContent,
          "Logs of network activity between devices in your tailnet.",
        );
        assert.equal(runtime.notLoggingStatus.textContent, "Not logging");
        assert.equal(runtime.startLoggingButton.textContent, "Start logging…");
      },
    },
    {
      path: "/admin/dns",
      buildBody: createDnsBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "DNS");
        assert.equal(
          runtime.pageDescription.textContent,
          "管理你网络的 DNS 和名称服务器。",
        );
        assert.equal(runtime.tailnetDnsNameHeading.textContent, "Tailnet DNS 名称");
        assert.equal(
          runtime.tailnetDnsNameDescription.textContent,
          "此唯一名称用于注册 DNS 条目、将你的设备共享到其他 tailnet，以及签发 TLS 证书。",
        );
        assert.equal(
          runtime.copyTailnetNameButton.getAttribute("aria-label"),
          "复制 tailf14c18.ts.net 到剪贴板。",
        );
        assert.equal(runtime.renameTailnetButton.textContent, "重命名 tailnet...");
        assert.equal(runtime.appsSectionHeading.textContent, "应用");
        assert.equal(runtime.manageInAppsLink.textContent, "在应用页管理");
        assert.equal(runtime.nameserversHeading.textContent, "名称服务器");
        assert.equal(runtime.globalNameserversHeading.textContent, "全局名称服务器");
        assert.equal(runtime.overrideDnsServersLabel.textContent, "覆盖 DNS 服务器");
        assert.equal(runtime.localDnsSettingsLabel.textContent, "本地 DNS 设置");
        assert.equal(runtime.addNameserverButton.textContent, "添加名称服务器");
        assert.equal(runtime.renameDialogTitle.textContent, "重命名 tailf14c18.ts.net");
        assert.equal(
          runtime.renameWarning1.textContent,
          "重命名 tailnet 可能会破坏现有指向你 tailnet 设备的链接。",
        );
        assert.equal(
          runtime.renameWarning2.textContent,
          "你需要使用新的 tailnet 名称重新签发 HTTPS 证书。任何你为其申请 HTTPS 证书的设备名称，包括新的 tailnet 名称，都会发布到一个无法移除的公共账本中。",
        );
        assert.equal(
          runtime.renameConfirmButton.textContent,
          "我已了解，让我重命名 tailnet",
        );
        assert.equal(runtime.googleDnsMenuItem.textContent, "Google 公共 DNS 8.8.8.8");
        assert.equal(
          runtime.cloudflareDnsMenuItem.textContent,
          "Cloudflare 公共 DNS 1.1.1.1",
        );
        assert.equal(runtime.quad9DnsMenuItem.textContent, "Quad9 公共 DNS 9.9.9.9");
        assert.equal(
          runtime.mullvadDnsMenuItem.textContent,
          "Mullvad 公共 DNS 194.242.2.2",
        );
        assert.equal(runtime.nextDnsMenuItem.textContent, "NextDNS DoH");
        assert.equal(runtime.controlDMenuItem.textContent, "Control D DoH");
        assert.equal(runtime.customDnsMenuItem.textContent, "自定义…");
        assert.equal(runtime.searchDomainsHeading.textContent, "搜索域");
        assert.equal(runtime.addSearchDomainButton.textContent, "添加搜索域...");
        assert.equal(runtime.addSearchDomainDialogTitle.textContent, "添加搜索域");
        assert.equal(
          runtime.addSearchDomainDialogHelp.textContent,
          "搜索域只能包含小写字母数字字符、短横线和句点。",
        );
        assert.equal(runtime.addSearchDomainDialogButton.textContent, "添加搜索域");
        assert.equal(runtime.magicDnsHeading.textContent, "MagicDNS");
        assert.equal(runtime.disableMagicDnsButton.textContent, "禁用 MagicDNS…");
        assert.equal(runtime.disableMagicDnsDialogTitle.textContent, "禁用 MagicDNS？");
        assert.equal(
          runtime.disableMagicDnsDialogDescription.textContent,
          "你网络中的用户将无法再通过简短名称访问 Tailscale 上的设备。",
        );
        assert.equal(
          runtime.disableMagicDnsDialogButton.textContent,
          "禁用 MagicDNS",
        );
        assert.equal(runtime.httpsCertificatesHeading.textContent, "HTTPS 证书");
        assert.equal(runtime.enableHttpsButton.textContent, "启用 HTTPS...");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "DNS");
        assert.equal(
          runtime.pageDescription.textContent,
          "Manage DNS and nameservers of your network.",
        );
        assert.equal(runtime.tailnetDnsNameHeading.textContent, "Tailnet DNS name");
        assert.equal(
          runtime.tailnetDnsNameDescription.textContent,
          "This unique name is used when registering DNS entries, sharing your device to other tailnets, and issuing TLS certificates.",
        );
        assert.equal(
          runtime.copyTailnetNameButton.getAttribute("aria-label"),
          "Copy tailf14c18.ts.net to your clip board.",
        );
        assert.equal(runtime.renameTailnetButton.textContent, "Rename tailnet...");
        assert.equal(runtime.appsSectionHeading.textContent, "Apps");
        assert.equal(runtime.manageInAppsLink.textContent, "Manage in Apps");
        assert.equal(runtime.nameserversHeading.textContent, "Nameservers");
        assert.equal(runtime.globalNameserversHeading.textContent, "Global nameservers");
        assert.equal(runtime.overrideDnsServersLabel.textContent, "Override DNS servers");
        assert.equal(runtime.localDnsSettingsLabel.textContent, "Local DNS settings");
        assert.equal(runtime.addNameserverButton.textContent, "Add nameserver");
        assert.equal(runtime.renameDialogTitle.textContent, "Rename tailf14c18.ts.net");
        assert.equal(
          runtime.renameWarning1.textContent,
          "Renaming your tailnet may break existing links to devices in your tailnet.",
        );
        assert.equal(
          runtime.renameWarning2.textContent,
          "You will need to reissue HTTPS certificates using the new tailnet name. The name of any machine for which you obtain a HTTPS certificate, including the new tailnet name, will be published in a public ledger from which it cannot be removed.",
        );
        assert.equal(
          runtime.renameConfirmButton.textContent,
          "I understand, let me rename the tailnet",
        );
        assert.equal(runtime.googleDnsMenuItem.textContent, "Google Public DNS 8.8.8.8");
        assert.equal(
          runtime.cloudflareDnsMenuItem.textContent,
          "Cloudflare Public DNS 1.1.1.1",
        );
        assert.equal(runtime.quad9DnsMenuItem.textContent, "Quad9 Public DNS 9.9.9.9");
        assert.equal(
          runtime.mullvadDnsMenuItem.textContent,
          "Mullvad Public DNS 194.242.2.2",
        );
        assert.equal(runtime.nextDnsMenuItem.textContent, "NextDNS DoH");
        assert.equal(runtime.controlDMenuItem.textContent, "Control D DoH");
        assert.equal(runtime.customDnsMenuItem.textContent, "Custom…");
        assert.equal(runtime.searchDomainsHeading.textContent, "Search Domains");
        assert.equal(runtime.addSearchDomainButton.textContent, "Add search domain...");
        assert.equal(runtime.addSearchDomainDialogTitle.textContent, "Add search domain");
        assert.equal(
          runtime.addSearchDomainDialogHelp.textContent,
          "The search domain can only contain alphanumeric lowercase characters, hyphens, and periods.",
        );
        assert.equal(runtime.addSearchDomainDialogButton.textContent, "Add search domain");
        assert.equal(runtime.magicDnsHeading.textContent, "MagicDNS");
        assert.equal(runtime.disableMagicDnsButton.textContent, "Disable MagicDNS…");
        assert.equal(runtime.disableMagicDnsDialogTitle.textContent, "Disable MagicDNS?");
        assert.equal(
          runtime.disableMagicDnsDialogDescription.textContent,
          "Users of your network will no longer be able to use short names to access devices over Tailscale.",
        );
        assert.equal(
          runtime.disableMagicDnsDialogButton.textContent,
          "Disable MagicDNS",
        );
        assert.equal(runtime.httpsCertificatesHeading.textContent, "HTTPS Certificates");
        assert.equal(runtime.enableHttpsButton.textContent, "Enable HTTPS...");
      },
    },
    {
      path: "/admin/settings/general",
      buildBody: createSettingsGeneralBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.tailnetSettingsHeading.textContent, "Tailnet 设置");
        assert.equal(runtime.generalNavLink.textContent, "常规");
        assert.equal(runtime.userManagementLink.textContent, "用户管理");
        assert.equal(runtime.deviceManagementLink.textContent, "设备管理");
        assert.equal(runtime.policyFileManagementLink.textContent, "策略文件管理");
        assert.equal(runtime.trustCredentialsLink.textContent, "受信任凭据");
        assert.equal(runtime.contactPreferencesLink.textContent, "联系偏好");
        assert.equal(runtime.billingLink.textContent, "计费");
        assert.equal(runtime.personalSettingsHeading.textContent, "个人设置");
        assert.equal(runtime.keysLink.textContent, "密钥");
        assert.equal(runtime.pageTitle.textContent, "常规");
        assert.equal(
          runtime.pageDescription.textContent,
          "管理你的 tailnet 账户设置。",
        );
        assert.equal(runtime.uniqueIdsHeading.textContent, "唯一 ID");
        assert.equal(runtime.tailnetIdHeading.textContent, "Tailnet ID");
        assert.equal(
          runtime.tailnetIdDescription.textContent,
          "用于在 API 调用中识别此 tailnet 的唯一 ID。",
        );
        assert.equal(runtime.displayHeading.textContent, "显示");
        assert.equal(
          runtime.displayDescription.textContent,
          "设置显示名称以便更容易识别此 tailnet。",
        );
        assert.equal(runtime.regionalRoutingHeading.textContent, "区域路由 Premium");
        assert.equal(runtime.httpsHeading.textContent, "HTTPS");
        assert.equal(runtime.manageDnsLink.textContent, "管理");
        assert.equal(runtime.featurePreviewsHeading.textContent, "功能预览");
        assert.equal(runtime.shareFeedbackLink.textContent, "分享反馈");
        assert.equal(runtime.sendFilesHeading.textContent, "发送文件");
        assert.equal(runtime.servicesCollectionHeading.textContent, "服务收集");
        assert.equal(runtime.redesignedMacUiHeading.textContent, "重新设计的 macOS 客户端界面");
        assert.equal(runtime.deleteTailnetHeading.textContent, "删除 tailnet");
        assert.equal(runtime.deleteTailnetButton.textContent, "删除 tailnet…");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.tailnetSettingsHeading.textContent, "Tailnet Settings");
        assert.equal(runtime.generalNavLink.textContent, "General");
        assert.equal(runtime.userManagementLink.textContent, "User management");
        assert.equal(runtime.deviceManagementLink.textContent, "Device management");
        assert.equal(runtime.policyFileManagementLink.textContent, "Policy file management");
        assert.equal(runtime.trustCredentialsLink.textContent, "Trust credentials");
        assert.equal(runtime.contactPreferencesLink.textContent, "Contact preferences");
        assert.equal(runtime.billingLink.textContent, "Billing");
        assert.equal(runtime.personalSettingsHeading.textContent, "Personal Settings");
        assert.equal(runtime.keysLink.textContent, "Keys");
        assert.equal(runtime.pageTitle.textContent, "General");
        assert.equal(
          runtime.pageDescription.textContent,
          "Manage your tailnet account settings.",
        );
        assert.equal(runtime.uniqueIdsHeading.textContent, "Unique IDs");
        assert.equal(runtime.tailnetIdHeading.textContent, "Tailnet ID");
        assert.equal(
          runtime.tailnetIdDescription.textContent,
          "A unique ID to identify this tailnet in API calls.",
        );
        assert.equal(runtime.displayHeading.textContent, "Display");
        assert.equal(
          runtime.displayDescription.textContent,
          "Set a display name to easily recognize this tailnet.",
        );
        assert.equal(runtime.regionalRoutingHeading.textContent, "Regional Routing Premium");
        assert.equal(runtime.httpsHeading.textContent, "HTTPS");
        assert.equal(runtime.manageDnsLink.textContent, "Manage");
        assert.equal(runtime.featurePreviewsHeading.textContent, "Feature previews");
        assert.equal(runtime.shareFeedbackLink.textContent, "share feedback");
        assert.equal(runtime.sendFilesHeading.textContent, "Send Files");
        assert.equal(runtime.servicesCollectionHeading.textContent, "Services Collection");
        assert.equal(runtime.redesignedMacUiHeading.textContent, "Redesigned MacOS Client UI");
        assert.equal(runtime.deleteTailnetHeading.textContent, "Delete tailnet");
        assert.equal(runtime.deleteTailnetButton.textContent, "Delete tailnet…");
      },
    },
    {
      path: "/admin/settings/device-management",
      buildBody: createSettingsDeviceManagementBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assertSettingsShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "设备管理");
        assert.equal(runtime.pageDescription.textContent, "管理你的 tailnet 设备设置。");
        assert.equal(runtime.deviceApprovalHeading.textContent, "设备审批");
        assert.equal(
          runtime.deviceApprovalDescription.textContent,
          "要求新设备在访问网络前先由管理员审批。",
        );
        assert.equal(runtime.approvalCheckbox.textContent, "手动审批新设备");
        assert.equal(runtime.tailnetLockHeading.textContent, "Tailnet Lock");
        assert.equal(runtime.enableTailnetLockButton.textContent, "启用 tailnet lock…");
        assert.equal(runtime.keyExpiryHeading.textContent, "密钥过期");
        assert.equal(
          runtime.keyExpiryDescription.textContent,
          "设置设备在重新通过 Google 身份验证前可保持登录 Tailscale 的天数。",
        );
        assert.equal(runtime.resetButton.textContent, "重置");
        assert.equal(runtime.autoUpdateHeading.textContent, "自动更新 Tailscale");
        assert.equal(runtime.autoUpdateCheckbox.textContent, "自动更新新设备");
        assert.equal(
          runtime.devicePostureIntegrationsHeading.textContent,
          "设备状态集成 Standard",
        );
        assert.equal(runtime.addIntegrationButton.textContent, "添加集成...");
        assert.equal(
          runtime.manageInAccessControlsLink.textContent,
          "在访问控制页管理",
        );
        assert.equal(
          runtime.postureConditionsDescription.textContent,
          "在 ACL 规则中使用 srcPosture 来限制来自不合规设备的访问。",
        );
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assertSettingsShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Device management");
        assert.equal(runtime.pageDescription.textContent, "Manage your tailnet device settings.");
        assert.equal(runtime.deviceApprovalHeading.textContent, "Device Approval");
        assert.equal(
          runtime.deviceApprovalDescription.textContent,
          "Require new devices to be approved by admins before they can access the network.",
        );
        assert.equal(runtime.approvalCheckbox.textContent, "Manually approve new devices");
        assert.equal(runtime.tailnetLockHeading.textContent, "Tailnet Lock");
        assert.equal(runtime.enableTailnetLockButton.textContent, "Enable tailnet lock…");
        assert.equal(runtime.keyExpiryHeading.textContent, "Key Expiry");
        assert.equal(runtime.resetButton.textContent, "Reset");
        assert.equal(runtime.autoUpdateHeading.textContent, "Auto-update Tailscale");
        assert.equal(runtime.autoUpdateCheckbox.textContent, "Auto-update new devices");
        assert.equal(
          runtime.devicePostureIntegrationsHeading.textContent,
          "Device Posture Integrations Standard",
        );
        assert.equal(runtime.addIntegrationButton.textContent, "Add an integration...");
        assert.equal(
          runtime.manageInAccessControlsLink.textContent,
          "Manage in Access Controls",
        );
      },
    },
    {
      path: "/admin/settings/policy-file-management",
      buildBody: createSettingsPolicyFileManagementBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assertSettingsShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "策略文件管理");
        assert.equal(runtime.pageDescription.textContent, "管理你的策略文件维护方式。");
        assert.equal(runtime.lockEditorHeading.textContent, "锁定编辑器");
        assert.equal(
          runtime.lockEditorDescription.textContent,
          "防止用户在管理控制台中编辑策略，以避免与 GitOps 或 Terraform 等外部管理流程冲突。",
        );
        assert.equal(
          runtime.preventEditsCheckbox.textContent,
          "禁止在管理控制台中编辑",
        );
        assert.equal(runtime.externalReferenceHeading.textContent, "外部引用");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assertSettingsShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Policy file management");
        assert.equal(
          runtime.pageDescription.textContent,
          "Manage how your policy file is maintained.",
        );
        assert.equal(runtime.lockEditorHeading.textContent, "Lock editor");
        assert.equal(
          runtime.lockEditorDescription.textContent,
          "Prevent users from editing policies in the admin console to avoid conflicts with external management workflows like GitOps or Terraform.",
        );
        assert.equal(
          runtime.preventEditsCheckbox.textContent,
          "Prevent edits in the admin console",
        );
        assert.equal(runtime.externalReferenceHeading.textContent, "External reference");
      },
    },
    {
      path: "/admin/settings/trust-credentials",
      buildBody: createSettingsTrustCredentialsBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assertSettingsShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "受信任凭据");
        assert.equal(
          runtime.pageDescription.textContent,
          "使用 OAuth 或 OIDC 令牌为 Tailscale API 提供细粒度访问控制。",
        );
        assert.equal(
          runtime.searchInput.getAttribute("placeholder"),
          "按签发方、描述、ID 搜索...",
        );
        assert.equal(runtime.filtersButton.textContent, "筛选");
        assert.equal(runtime.createCredentialButton.textContent, "创建新的受信任凭据");
        assert.equal(runtime.clientIdHeader.textContent, "客户端 ID");
        assert.equal(runtime.typeHeader.textContent, "类型");
        assert.equal(runtime.updatedHeader.textContent, "已更新");
        assert.equal(runtime.scopesHeader.textContent, "作用域");
        assert.equal(runtime.actionHeader.textContent, "受信任凭据操作菜单");
        assert.equal(runtime.emptyState.textContent, "你还没有任何受信任凭据");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assertSettingsShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Trust credentials");
        assert.equal(
          runtime.pageDescription.textContent,
          "Provide fine grained access to the Tailscale API using OAuth or OIDC tokens.",
        );
        assert.equal(
          runtime.searchInput.getAttribute("placeholder"),
          "Search by issuer, description, id...",
        );
        assert.equal(runtime.filtersButton.textContent, "Filters");
        assert.equal(
          runtime.createCredentialButton.textContent,
          "Create a new trust credential",
        );
        assert.equal(runtime.clientIdHeader.textContent, "Client ID");
        assert.equal(runtime.typeHeader.textContent, "Type");
        assert.equal(runtime.updatedHeader.textContent, "Updated");
        assert.equal(runtime.scopesHeader.textContent, "Scopes");
        assert.equal(runtime.actionHeader.textContent, "Trust credentials action menu");
        assert.equal(runtime.emptyState.textContent, "You do not have any trust credentials");
      },
    },
    {
      path: "/admin/settings/webhooks",
      buildBody: createSettingsWebhooksBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assertSettingsShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "Webhook");
        assert.equal(
          runtime.pageDescription.textContent,
          "在你的 tailnet 发生变更或配置错误时接收通知。",
        );
        assert.equal(runtime.endpointsHeading.textContent, "端点");
        assert.equal(runtime.endpointsDescription.textContent, "查看并管理端点。");
        assert.equal(runtime.addEndpointButton.textContent, "添加端点...");
        assert.equal(runtime.addEndpointDialogTitle.textContent, "添加端点");
        assert.equal(runtime.webhookUrlLabel.textContent, "Webhook URL");
        assert.equal(
          runtime.webhookUrlDescription.textContent,
          "下方选择的事件会触发一个发送到此 URL 的 HTTPS POST 请求。",
        );
        assert.equal(runtime.destinationLabel.textContent, "目标平台");
        assert.equal(runtime.optionalLabel.textContent, "可选");
        assert.equal(
          runtime.destinationDescription.textContent,
          "如果选择了目标平台，我们会按该平台期望的格式发送 webhook 事件。",
        );
        assert.equal(runtime.noneOption.textContent, "无");
        assert.equal(runtime.eventsHeading.textContent, "事件");
        assert.equal(runtime.tailnetManagementHeading.textContent, "Tailnet 管理");
        assert.equal(runtime.nodeCreatedDescription.textContent, "节点已创建。");
        assert.equal(runtime.userRoleUpdatedDescription.textContent, "用户角色已变更。");
        assert.equal(runtime.deviceMisconfigurationsHeading.textContent, "设备配置错误");
        assert.equal(runtime.subnetForwardingDescription.textContent, "子网未启用 IP 转发。");
        assert.equal(runtime.exitNodeForwardingDescription.textContent, "出口节点未启用 IP 转发。");
        assert.equal(runtime.emptyState.textContent, "你还没有任何端点");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assertSettingsShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Webhooks");
        assert.equal(
          runtime.pageDescription.textContent,
          "Get notified of changes and misconfigurations in your tailnet.",
        );
        assert.equal(runtime.endpointsHeading.textContent, "Endpoints");
        assert.equal(runtime.endpointsDescription.textContent, "View and manage endpoints.");
        assert.equal(runtime.addEndpointButton.textContent, "Add endpoint...");
        assert.equal(runtime.addEndpointDialogTitle.textContent, "Add endpoint");
        assert.equal(runtime.webhookUrlLabel.textContent, "Webhook URL");
        assert.equal(
          runtime.webhookUrlDescription.textContent,
          "Events selected below will trigger an HTTPS POST request to this URL.",
        );
        assert.equal(runtime.destinationLabel.textContent, "Destination");
        assert.equal(runtime.optionalLabel.textContent, "optional");
        assert.equal(
          runtime.destinationDescription.textContent,
          "If selected, we’ll send your webhook events in the format expected by your destination.",
        );
        assert.equal(runtime.noneOption.textContent, "None");
        assert.equal(runtime.eventsHeading.textContent, "Events");
        assert.equal(runtime.tailnetManagementHeading.textContent, "Tailnet Management");
        assert.equal(runtime.nodeCreatedDescription.textContent, "Node was created.");
        assert.equal(runtime.userRoleUpdatedDescription.textContent, "User role changed.");
        assert.equal(runtime.deviceMisconfigurationsHeading.textContent, "Device Misconfigurations");
        assert.equal(runtime.subnetForwardingDescription.textContent, "Subnet has IP forwarding disabled.");
        assert.equal(runtime.exitNodeForwardingDescription.textContent, "Exit node has IP forwarding disabled.");
        assert.equal(runtime.emptyState.textContent, "You don’t have any endpoints yet");
      },
    },
    {
      path: "/admin/settings/contact-preferences",
      buildBody: createSettingsContactPreferencesBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assertSettingsShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "联系偏好");
        assert.equal(
          runtime.pageDescription.textContent,
          "为不同类型的事务邮件指定联系人。我们只会用它们发送与 tailnet 运行相关的必要通信，不会发送营销内容。因此你无法选择退出，且所有邮箱都必须完成验证。",
        );
        assert.equal(runtime.accountChangesHeading.textContent, "账户变更");
        assert.equal(runtime.configurationIssuesHeading.textContent, "配置问题");
        assert.equal(runtime.securityIssuesHeading.textContent, "安全问题");
        assert.equal(runtime.billingEmailHeading.textContent, "计费邮箱");
        assert.equal(runtime.manageInBillingLink.textContent, "在计费页管理");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assertSettingsShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Contact preferences");
        assert.equal(
          runtime.pageDescription.textContent,
          "Define points of contact for different kinds of transactional emails. We will only use these to send essential communications related to the functioning of your tailnet, not marketing-related content. As such, you can’t opt out, and all emails must be verified.",
        );
        assert.equal(runtime.accountChangesHeading.textContent, "Account changes");
        assert.equal(runtime.configurationIssuesHeading.textContent, "Configuration issues");
        assert.equal(runtime.securityIssuesHeading.textContent, "Security issues");
        assert.equal(runtime.billingEmailHeading.textContent, "Billing email");
        assert.equal(runtime.manageInBillingLink.textContent, "Manage in Billing");
      },
    },
    {
      path: "/admin/settings/billing",
      buildBody: createSettingsBillingBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assertSettingsShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "计费");
        assert.equal(runtime.pageDescription.textContent, "查看并管理你的计费方案。");
        assert.equal(runtime.planName.textContent, "个人方案");
        assert.equal(runtime.contactSalesButton.textContent, "联系销售");
        assert.equal(runtime.switchPlanButton.textContent, "切换方案");
        assert.equal(runtime.purchaseMullvadButton.textContent, "购买 Mullvad VPN");
        assert.equal(runtime.usageTab.textContent, "用量");
        assert.equal(runtime.invoicesTab.textContent, "发票");
        assert.equal(runtime.billingDetailsTab.textContent, "计费详情");
        assert.equal(runtime.seatsLabel.textContent, "席位");
        assert.equal(
          runtime.seatsDescription.textContent,
          "已登录 Tailscale 的用户占用的席位。已添加但从未登录的用户不计入。",
        );
        assert.equal(runtime.learnMoreAboutSeatsLink.textContent, "了解更多席位信息");
        assert.equal(runtime.userDevicesLabel.textContent, "用户设备");
        assert.equal(
          runtime.userDevicesDescription.textContent,
          "由用户拥有的设备，不包括标签拥有的设备。",
        );
        assert.equal(runtime.unlimitedLabel.textContent, "无限");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assertSettingsShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Billing");
        assert.equal(runtime.pageDescription.textContent, "View and manage your billing plan.");
        assert.equal(runtime.planName.textContent, "Personal plan");
        assert.equal(runtime.contactSalesButton.textContent, "Contact sales");
        assert.equal(runtime.switchPlanButton.textContent, "Switch plan");
        assert.equal(runtime.purchaseMullvadButton.textContent, "Purchase Mullvad VPN");
        assert.equal(runtime.usageTab.textContent, "Usage");
        assert.equal(runtime.invoicesTab.textContent, "Invoices");
        assert.equal(runtime.billingDetailsTab.textContent, "Billing details");
        assert.equal(runtime.seatsLabel.textContent, "Seats");
        assert.equal(
          runtime.seatsDescription.textContent,
          "Seats occupied by users who logged into Tailscale. Users that have been added but never logged in don’t count.",
        );
        assert.equal(runtime.learnMoreAboutSeatsLink.textContent, "Learn more about seats");
        assert.equal(runtime.userDevicesLabel.textContent, "User devices");
        assert.equal(runtime.userDevicesDescription.textContent, "Devices owned by users, not tags.");
        assert.equal(runtime.unlimitedLabel.textContent, "Unlimited");
      },
    },
    {
      path: "/admin/settings/billing/invoices",
      buildBody: createSettingsBillingInvoicesBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assertSettingsShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "计费");
        assert.equal(runtime.pastInvoicesHeading.textContent, "历史发票");
        assert.equal(runtime.invoicesDescription.textContent, "过去 12 个月的发票。");
        assert.equal(runtime.emptyState.textContent, "你没有发票。");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assertSettingsShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Billing");
        assert.equal(runtime.pastInvoicesHeading.textContent, "Past invoices");
        assert.equal(runtime.invoicesDescription.textContent, "Invoices from the past 12 months.");
        assert.equal(runtime.emptyState.textContent, "You have no invoices.");
      },
    },
    {
      path: "/admin/settings/billing/billing-details",
      buildBody: createSettingsBillingDetailsBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assertSettingsShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "计费");
        assert.equal(runtime.emptyState.textContent, "没有可用的计费详情。");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assertSettingsShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Billing");
        assert.equal(runtime.emptyState.textContent, "No billing details available.");
      },
    },
    {
      path: "/admin/settings/billing/plans",
      buildBody: createSettingsBillingPlansBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.backToBillingLink.textContent, "返回计费");
        assert.equal(runtime.plansTab.textContent, "方案");
        assert.equal(runtime.paymentTab.textContent, "付款");
        assert.equal(runtime.pageTitle.textContent, "升级你的方案");
        assert.equal(
          runtime.pageDescription.textContent,
          "添加无限数量的用户，并让他们连接所需的所有设备和服务。",
        );
        assert.equal(runtime.currentPlanLabel.textContent, "当前方案");
        assert.equal(runtime.personalHeading.textContent, "个人");
        assert.equal(runtime.freeForeverLabel.textContent, "永久免费");
        assert.equal(runtime.standardHeading.textContent, "标准");
        assert.equal(runtime.upgradeButton.textContent, "升级");
        assert.equal(runtime.premiumHeading.textContent, "高级版");
        assert.equal(runtime.enterpriseHeading.textContent, "企业");
        assert.equal(runtime.platformExtensionsHeading.textContent, "平台扩展");
        assert.equal(runtime.pamHeading.textContent, "特权访问管理 (PAM)");
        assert.equal(runtime.comparePlansLink.textContent, "详细比较方案");
        assert.equal(runtime.contactSupportLink.textContent, "联系支持");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.backToBillingLink.textContent, "Back to billing");
        assert.equal(runtime.plansTab.textContent, "Plans");
        assert.equal(runtime.paymentTab.textContent, "Payment");
        assert.equal(runtime.pageTitle.textContent, "Upgrade your plan");
        assert.equal(
          runtime.pageDescription.textContent,
          "Add unlimited users and get them connected to all the devices and services they need.",
        );
        assert.equal(runtime.currentPlanLabel.textContent, "Current plan");
        assert.equal(runtime.personalHeading.textContent, "Personal");
        assert.equal(runtime.freeForeverLabel.textContent, "Free Forever");
        assert.equal(runtime.standardHeading.textContent, "Standard");
        assert.equal(runtime.upgradeButton.textContent, "Upgrade");
        assert.equal(runtime.premiumHeading.textContent, "Premium");
        assert.equal(runtime.enterpriseHeading.textContent, "Enterprise");
        assert.equal(runtime.platformExtensionsHeading.textContent, "Platform extensions");
        assert.equal(runtime.pamHeading.textContent, "Privileged Access Management (PAM)");
        assert.equal(runtime.comparePlansLink.textContent, "Compare plans in detail");
        assert.equal(runtime.contactSupportLink.textContent, "Contact support");
      },
    },
    {
      path: "/admin/settings/billing/checkout/hybrid_standard",
      buildBody: createSettingsBillingCheckoutBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "购买席位");
        assert.equal(runtime.seatsToPurchaseLabel.textContent, "要购买的席位数");
        assert.equal(runtime.usersWhoNeedSeatsNote.textContent, "当前有 1 位用户需要席位。");
        assert.equal(runtime.faqHeading.textContent, "常见问题");
        assert.equal(runtime.upgradingToLabel.textContent, "升级到");
        assert.equal(runtime.priceLabel.textContent, "每个席位每月 8 美元");
        assert.equal(runtime.estimatedSalesTaxLabel.textContent, "预计销售税");
        assert.equal(runtime.applyPromoCodeButton.textContent, "应用优惠码");
        assert.equal(runtime.nextPaymentLabel.textContent, "下次付款日期");
        assert.equal(runtime.salesTaxLink.textContent, "了解 Tailscale 如何收取销售税。");
        assert.equal(runtime.continueButton.textContent, "继续前往计费详情 →");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Purchase seats");
        assert.equal(runtime.seatsToPurchaseLabel.textContent, "Seats to purchase");
        assert.equal(runtime.usersWhoNeedSeatsNote.textContent, "Currently you have 1 users who would need seats.");
        assert.equal(runtime.faqHeading.textContent, "Frequently asked questions");
        assert.equal(runtime.upgradingToLabel.textContent, "Upgrading to");
        assert.equal(runtime.priceLabel.textContent, "$8 per seat / month");
        assert.equal(runtime.estimatedSalesTaxLabel.textContent, "Estimated sales tax");
        assert.equal(runtime.applyPromoCodeButton.textContent, "Apply promo code");
        assert.equal(runtime.nextPaymentLabel.textContent, "Next payment on");
        assert.equal(runtime.salesTaxLink.textContent, "about how Tailscale collects sales tax.");
        assert.equal(runtime.continueButton.textContent, "Continue to billing details →");
      },
    },
    {
      path: "/admin/settings/billing/add/mullvad",
      buildBody: createSettingsBillingMullvadBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "管理附加组件");
        assert.equal(runtime.mainHeading.textContent, "Mullvad VPN");
        assert.equal(
          runtime.introLine.textContent,
          "选择可使用 Mullvad 服务器作为出口节点的设备数量。在每个计费周期结束时，你将按以下数量计费：",
        );
        assert.equal(
          runtime.postCheckoutNote.textContent,
          "完成结账后，你可以选择哪些设备可以使用 Mullvad VPN。",
        );
        assert.equal(runtime.estimatedSalesTaxLabel.textContent, "预计销售税");
        assert.equal(runtime.applyPromoCodeButton.textContent, "应用优惠码");
        assert.equal(runtime.nextBillingCycleLabel.textContent, "下一计费周期开始于");
        assert.equal(runtime.continueButton.textContent, "继续前往计费详情 →");
        assert.equal(runtime.agreementLead.textContent, "点击继续即表示你同意");
        assert.equal(runtime.termsLink.textContent, "面向 Tailscale 客户的 Mullvad VPN 条款");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Manage add-ons");
        assert.equal(runtime.mainHeading.textContent, "Mullvad VPN");
        assert.equal(
          runtime.introLine.textContent,
          "Select a number of devices that can use Mullvad’s servers as exit nodes. At the end of every billing cycle, you will be billed",
        );
        assert.equal(
          runtime.postCheckoutNote.textContent,
          "You will be able to pick which devices can use Mullvad VPN after completing the checkout.",
        );
        assert.equal(runtime.estimatedSalesTaxLabel.textContent, "Estimated sales tax");
        assert.equal(runtime.applyPromoCodeButton.textContent, "Apply promo code");
        assert.equal(runtime.nextBillingCycleLabel.textContent, "Next billing cycle starts");
        assert.equal(runtime.continueButton.textContent, "Continue to billing details →");
        assert.equal(runtime.agreementLead.textContent, "By clicking continue, you agree to the");
        assert.equal(runtime.termsLink.textContent, "Mullvad VPN Terms For Tailscale Customers");
      },
    },
    {
      path: "/admin/settings/keys",
      buildBody: createSettingsKeysBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assertSettingsShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "密钥");
        assert.equal(
          runtime.pageDescription.textContent,
          "查看并管理你的 Auth key 和 API 访问令牌。",
        );
        assert.equal(
          runtime.privateKeysNotice.textContent,
          "你的私有设备密钥不包含在这里：它们始终保持私有，留在你的设备上，且从不与 Tailscale 共享。",
        );
        assert.equal(runtime.authKeysHeading.textContent, "Auth key");
        assert.equal(runtime.generateAuthKeyButton.textContent, "生成 Auth key…");
        assert.equal(runtime.emptyAuthKeysState.textContent, "你还没有任何 Auth key");
        assert.equal(runtime.apiTokensHeading.textContent, "API 访问令牌");
        assert.equal(runtime.generateAccessTokenButton.textContent, "生成访问令牌…");
        assert.equal(runtime.emptyAccessTokensState.textContent, "你还没有任何访问令牌");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assertSettingsShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Keys");
        assert.equal(
          runtime.pageDescription.textContent,
          "View and manage your Auth keys and API access tokens.",
        );
        assert.equal(
          runtime.privateKeysNotice.textContent,
          "Your private device keys are not included here: they are always private, stay on your device, and are never shared with Tailscale.",
        );
        assert.equal(runtime.authKeysHeading.textContent, "Auth keys");
        assert.equal(runtime.generateAuthKeyButton.textContent, "Generate auth key…");
        assert.equal(runtime.emptyAuthKeysState.textContent, "You don’t have any auth keys yet");
        assert.equal(runtime.apiTokensHeading.textContent, "API access tokens");
        assert.equal(runtime.generateAccessTokenButton.textContent, "Generate access token…");
        assert.equal(
          runtime.emptyAccessTokensState.textContent,
          "You don’t have any access tokens yet",
        );
      },
    },
    {
      path: "/admin/settings/user-management",
      buildBody: createSettingsUserManagementBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.tailnetSettingsHeading.textContent, "Tailnet 设置");
        assert.equal(runtime.userManagementLink.textContent, "用户管理");
        assert.equal(runtime.webhooksLink.textContent, "Webhook");
        assert.equal(runtime.pageTitle.textContent, "用户管理");
        assert.equal(
          runtime.pageDescription.textContent,
          "管理你的 tailnet 用户设置。",
        );
      assert.equal(runtime.identityProviderHeading.textContent, "身份提供商");
      assert.equal(runtime.userApprovalHeading.textContent, "用户审批");
      assert.equal(
        runtime.userApprovalDescription.textContent,
        "要求新用户在访问网络前先由管理员审批。",
      );
      assert.equal(runtime.approvalCheckbox.textContent, "手动审批新用户");
      assert.equal(runtime.sessionTimeoutHeading.textContent, "管理控制台会话超时");
      assert.equal(
        runtime.sessionTimeoutDescription.textContent,
        "可访问管理控制台的用户在此时长未活动后将被登出。",
      );
      assert.equal(runtime.editButton.textContent, "编辑");
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.tailnetSettingsHeading.textContent, "Tailnet Settings");
        assert.equal(runtime.userManagementLink.textContent, "User management");
        assert.equal(runtime.webhooksLink.textContent, "Webhooks");
        assert.equal(runtime.pageTitle.textContent, "User management");
        assert.equal(
          runtime.pageDescription.textContent,
          "Manage your tailnet user settings.",
        );
        assert.equal(runtime.identityProviderHeading.textContent, "Identity Provider");
        assert.equal(runtime.userApprovalHeading.textContent, "User Approval");
        assert.equal(
          runtime.userApprovalDescription.textContent,
          "Require new users to be approved by admins before they can access the network.",
        );
        assert.equal(runtime.approvalCheckbox.textContent, "Manually approve new users");
        assert.equal(
          runtime.sessionTimeoutHeading.textContent,
          "Admin Console Session Timeout",
        );
        assert.equal(
          runtime.sessionTimeoutDescription.textContent,
          "Users with access to the Admin console will be logged out after this time period of inactivity.",
        );
        assert.equal(runtime.editButton.textContent, "Edit");
      },
    },
    {
      path: "/admin/resource-hub",
      buildBody: createResourceHubBody,
      assertZh(runtime) {
        assertAdminShellChinese(runtime);
        assert.equal(runtime.pageTitle.textContent, "资源中心");
        assert.equal(
          runtime.pageDescription.textContent,
          "探索你可以用 Tailscale 做什么",
        );
        assert.equal(runtime.intentLabel.textContent, "我想要……");
        assert.equal(runtime.sendFilesButton.textContent, "向不同设备发送文件");
        assert.equal(runtime.accessHomeNetworkButton.textContent, "访问我的家庭网络");
        assert.equal(runtime.cloudStorageButton.textContent, "自托管我的云存储");
        assert.equal(runtime.appleTvButton.textContent, "在我的 Apple TV 上安装 Tailscale");
        assert.equal(runtime.otherButton.textContent, "其他");
        assert.equal(
          runtime.cardDescription.textContent,
          "Taildrop 让你可以在任意设备之间无缝共享文件。",
        );
        assert.equal(runtime.readGuideLink.textContent, "阅读指南");
        assert.equal(
          runtime.guideSummary.textContent,
          "Taildrop 让你可以在 Tailscale 网络（即 tailnet）中的个人设备之间发送文件。",
        );
        assert.equal(runtime.helpfulQuestion.textContent, "这对你有帮助吗？");
        assert.equal(runtime.yesButton.textContent, "是");
        assert.equal(runtime.noButton.textContent, "否");
        assert.equal(
          runtime.notInterestedButton.textContent,
          "我对这个使用场景不感兴趣",
        );
      },
      assertEn(runtime) {
        assertAdminShellEnglish(runtime);
        assert.equal(runtime.pageTitle.textContent, "Resource hub");
        assert.equal(
          runtime.pageDescription.textContent,
          "Explore what you can do with Tailscale",
        );
        assert.equal(runtime.intentLabel.textContent, "I want to...");
        assert.equal(runtime.sendFilesButton.textContent, "Send files to different devices");
        assert.equal(runtime.accessHomeNetworkButton.textContent, "Access my home network");
        assert.equal(runtime.cloudStorageButton.textContent, "Host my own cloud storage");
        assert.equal(runtime.appleTvButton.textContent, "Install Tailscale on my Apple TV");
        assert.equal(runtime.otherButton.textContent, "Other");
        assert.equal(
          runtime.cardDescription.textContent,
          "Taildrop allows you to share files seamlessly with any of your devices.",
        );
        assert.equal(runtime.readGuideLink.textContent, "Read guide");
        assert.equal(
          runtime.guideSummary.textContent,
          "Taildrop lets you send files between your personal devices on a Tailscale network (known as a tailnet).",
        );
        assert.equal(runtime.helpfulQuestion.textContent, "Was this helpful?");
        assert.equal(runtime.yesButton.textContent, "Yes");
        assert.equal(runtime.noButton.textContent, "No");
        assert.equal(
          runtime.notInterestedButton.textContent,
          "I’m not interested in this use case",
        );
      },
    },
  ];

  for (const pageCase of cases) {
    const runtime = createRuntime({
      path: pageCase.path,
      buildBody: pageCase.buildBody,
    });

    vm.runInNewContext(bundle, runtime.context);
    pageCase.assertZh(runtime);

    runtime.window.__tailscaleChinese.setLanguage("en");
    pageCase.assertEn(runtime);
  }
});

function createRuntime({ path: pathname }) {
  const mutationObservers = [];

  function notifyMutation(record) {
    for (const observer of mutationObservers.slice()) {
      if (!observer.options) {
        continue;
      }

      if (record.type === "childList" && !observer.options.childList) {
        continue;
      }

      if (record.type === "attributes") {
        if (!observer.options.attributes) {
          continue;
        }

        const attributeFilter = observer.options.attributeFilter;
        if (
          Array.isArray(attributeFilter) &&
          record.attributeName &&
          !attributeFilter.includes(record.attributeName)
        ) {
          continue;
        }
      }

      if (record.type === "characterData" && !observer.options.characterData) {
        continue;
      }

      observer.callback([record], observer);
    }
  }

  class FakeTextNode {
    constructor(value) {
      this.nodeType = 3;
      this.parentElement = null;
      this._textContent = value;
    }

    get textContent() {
      return this._textContent;
    }

    set textContent(value) {
      const nextValue = String(value);
      if (nextValue === this._textContent) {
        return;
      }

      this._textContent = nextValue;
      notifyMutation({
        type: "characterData",
        target: this,
      });
    }
  }

  class FakeElement {
    constructor(tagName, attributes = {}, children = []) {
      this.nodeType = 1;
      this.tagName = tagName.toUpperCase();
      this.parentElement = null;
      this.childNodes = [];
      this.attributes = new Map();

      for (const [name, value] of Object.entries(attributes)) {
        this.setAttribute(name, value);
      }

      for (const child of children) {
        this.appendChild(child);
      }
    }

    appendChild(child) {
      child.parentElement = this;
      this.childNodes.push(child);
      notifyMutation({
        type: "childList",
        target: this,
      });
      return child;
    }

    get textContent() {
      return this.childNodes.map((child) => child.textContent ?? "").join("");
    }

    set textContent(value) {
      const textNode = new FakeTextNode(value);
      textNode.parentElement = this;
      this.childNodes = [textNode];
      notifyMutation({
        type: "childList",
        target: this,
      });
    }

    getAttribute(name) {
      return this.attributes.has(name) ? this.attributes.get(name) : null;
    }

    setAttribute(name, value) {
      const nextValue = String(value);
      if (this.attributes.get(name) === nextValue) {
        return;
      }

      this.attributes.set(name, nextValue);
      notifyMutation({
        type: "attributes",
        target: this,
        attributeName: name,
      });
    }

    removeAttribute(name) {
      if (!this.attributes.has(name)) {
        return;
      }

      this.attributes.delete(name);
      notifyMutation({
        type: "attributes",
        target: this,
        attributeName: name,
      });
    }

    matches(selector) {
      return matchesSelector(this, selector);
    }

    querySelectorAll(selector) {
      const results = [];

      const visit = (node) => {
        if (!node || node.nodeType !== 1) {
          return;
        }

        if (matchesSelector(node, selector)) {
          results.push(node);
        }

        for (const child of node.childNodes) {
          visit(child);
        }
      };

      for (const child of this.childNodes) {
        visit(child);
      }

      return results;
    }
  }

  const { body, references } = (arguments[0].buildBody ?? createLoginBody)({
    FakeElement,
    FakeTextNode,
  });

  const documentListeners = new Map();
  const windowListeners = new Map();
  const currentUrl = new URL(`https://login.tailscale.com${pathname}`);
  const languageStore = new Map([["tailscale-chinese:language", "zh-CN"]]);

  const document = {
    body,
    readyState: "complete",
    addEventListener(type, listener) {
      addListener(documentListeners, type, listener);
    },
    removeEventListener(type, listener) {
      removeListener(documentListeners, type, listener);
    },
    dispatchEvent(event) {
      dispatch(documentListeners, event.type, event);
    },
    createTreeWalker(root, _whatToShow, filter) {
      const accepted = [];

      const visit = (node) => {
        if (!node) {
          return;
        }

        if (node.nodeType === 3) {
          const decision = filter.acceptNode(node);
          if (decision === NodeFilter.FILTER_ACCEPT) {
            accepted.push(node);
          }
          return;
        }

        if (node.nodeType === 1) {
          for (const child of node.childNodes) {
            visit(child);
          }
        }
      };

      visit(root);

      let index = 0;
      return {
        nextNode() {
          return accepted[index++] ?? null;
        },
      };
    },
  };

  const window = {
    document,
    addEventListener(type, listener) {
      addListener(windowListeners, type, listener);
    },
    removeEventListener(type, listener) {
      removeListener(windowListeners, type, listener);
    },
    dispatchEvent(event) {
      dispatch(windowListeners, event.type, event);
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    cancelAnimationFrame() {},
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    console: {
      info() {},
    },
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.options = null;
      }

      observe(_target, options = {}) {
        this.options = { ...options };
        if (!mutationObservers.includes(this)) {
          mutationObservers.push(this);
        }
      }

      disconnect() {
        this.options = null;
      }
    },
    NodeFilter,
    location: createLocation(currentUrl),
    history: {
      pushState(_state, _title, nextUrl) {
        updateLocation(currentUrl, nextUrl);
        syncLocation(window.location, currentUrl);
      },
      replaceState(_state, _title, nextUrl) {
        updateLocation(currentUrl, nextUrl);
        syncLocation(window.location, currentUrl);
      },
    },
    GM_getValue(key, fallback) {
      return languageStore.has(key) ? languageStore.get(key) : fallback;
    },
    GM_setValue(key, value) {
      languageStore.set(key, value);
    },
    localStorage: {
      getItem(key) {
        return languageStore.has(key) ? languageStore.get(key) : null;
      },
      setItem(key, value) {
        languageStore.set(key, String(value));
      },
    },
  };

  const context = {
    window,
    document,
    console: window.console,
    MutationObserver: window.MutationObserver,
    NodeFilter,
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    history: window.history,
    location: window.location,
    localStorage: window.localStorage,
    GM_getValue: window.GM_getValue,
    GM_setValue: window.GM_setValue,
    globalThis: window,
  };

  window.window = window;
  window.self = window;
  window.globalThis = window;

  return {
    context,
    window,
    ...references,
  };
}

function createLoginBody({ FakeElement, FakeTextNode }) {
  const heading = new FakeElement("h1", {}, [new FakeTextNode("Sign in")]);
  const providerButton = new FakeElement("button", { "data-provider": "okta" }, [
    new FakeTextNode("Continue with Okta"),
  ]);
  const emailInput = new FakeElement("input", {
    type: "email",
    placeholder: "Email",
  });
  const body = new FakeElement("body", {}, [heading, providerButton, emailInput]);

  return {
    body,
    references: {
      heading,
      providerButton,
      emailInput,
    },
  };
}

function createAdminShell({ FakeElement, FakeTextNode }) {
  const accountHomeLink = new FakeElement("a", {
    "aria-label": "isdoge93@gmail.com’s admin console home",
  });
  const freePlanLabel = new FakeElement("span", {}, [new FakeTextNode("Free")]);
  const helpMenuButton = new FakeElement("button", {
    "aria-label": "Help menu",
    title: "Help and resources",
  });
  const userMenuButton = new FakeElement("button", {
    "aria-label": "User menu…",
  });

  function createNavItem(label) {
    const navLabel = new FakeElement("div", {
      class: "navigation-link",
      "data-content": label,
    }, [
      new FakeTextNode(label),
    ]);
    const navWrapper = new FakeElement("div", { class: "flex items-center" }, [
      navLabel,
    ]);
    const navLink = new FakeElement("a", {}, [navWrapper]);

    return { navLabel, navWrapper, navLink };
  }

  const machinesItem = createNavItem("Machines");
  const appsItem = createNavItem("Apps");
  const servicesItem = createNavItem("Services");
  const usersItem = createNavItem("Users");
  const accessControlsItem = createNavItem("Access controls");
  const logsItem = createNavItem("Logs");
  const dnsItem = createNavItem("DNS");
  const settingsItem = createNavItem("Settings");
  const resourceHubItem = createNavItem("Resource hub");
  const topNav = new FakeElement("nav", { id: "nav", class: "navigation" }, [
    machinesItem.navLink,
    appsItem.navLink,
    servicesItem.navLink,
    usersItem.navLink,
    accessControlsItem.navLink,
    logsItem.navLink,
    dnsItem.navLink,
    settingsItem.navLink,
    resourceHubItem.navLink,
  ]);
  const liveQaHeading = new FakeElement("h4", {}, [
    new FakeTextNode("Join our live community Q&A!"),
  ]);
  const joinPrefix = new FakeTextNode("Join ");
  const averyText = new FakeTextNode("Avery");
  const ceoText = new FakeTextNode(" (CEO and Co-Founder) and ");
  const alexText = new FakeTextNode("Alex");
  const devRelText = new FakeTextNode(" (Head of DevRel) for a live community Q&A on");
  const discordLink = new FakeElement("a", {}, [new FakeTextNode("Discord")]);
  const onPrefix = new FakeTextNode("on ");
  const dateText = new FakeTextNode("April 13 at 4 PM ET");
  const bannerTail = new FakeTextNode(
    ". We’ll chat through the recent pricing update and answer your questions live.",
  );
  const dismissBannerButton = new FakeElement("button", {
    "aria-label": "Dismiss Q&A banner",
  });

  return {
    nodes: [
      accountHomeLink,
      freePlanLabel,
      helpMenuButton,
      userMenuButton,
      topNav,
      liveQaHeading,
      joinPrefix,
      averyText,
      ceoText,
      alexText,
      devRelText,
      discordLink,
      onPrefix,
      dateText,
      bannerTail,
      dismissBannerButton,
    ],
    references: {
      accountHomeLink,
      freePlanLabel,
      helpMenuButton,
      userMenuButton,
      machinesNav: machinesItem.navLabel,
      machinesNavWrapper: machinesItem.navWrapper,
      appsNav: appsItem.navLabel,
      appsNavWrapper: appsItem.navWrapper,
      servicesNav: servicesItem.navLabel,
      servicesNavWrapper: servicesItem.navWrapper,
      usersNav: usersItem.navLabel,
      usersNavWrapper: usersItem.navWrapper,
      accessControlsNav: accessControlsItem.navLabel,
      accessControlsNavWrapper: accessControlsItem.navWrapper,
      logsNav: logsItem.navLabel,
      logsNavWrapper: logsItem.navWrapper,
      dnsNav: dnsItem.navLabel,
      dnsNavWrapper: dnsItem.navWrapper,
      settingsNav: settingsItem.navLabel,
      settingsNavWrapper: settingsItem.navWrapper,
      resourceHubNav: resourceHubItem.navLabel,
      resourceHubNavWrapper: resourceHubItem.navWrapper,
      liveQaHeading,
      joinPrefix,
      averyText,
      ceoText,
      alexText,
      devRelText,
      discordLink,
      onPrefix,
      dateText,
      bannerTail,
      dismissBannerButton,
    },
  };
}

function createMachinesBody({ FakeElement, FakeTextNode }) {
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Machines")]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode("Manage the devices connected to your tailnet."),
  ]);
  const learnMoreLink = new FakeElement("a", {
    "aria-label": "Read documentation about Machines",
  }, [new FakeTextNode("Learn more")]);
  const addDeviceButton = new FakeElement("button", {}, [
    new FakeTextNode("Add device"),
  ]);
  const searchInput = new FakeElement("input", {
    type: "text",
    placeholder: "Search by name, owner, tag, version...",
  });
  const filtersButton = new FakeElement("button", {}, [new FakeTextNode("Filters")]);
  const exportButton = new FakeElement("button", {
    "aria-label": "Export devices data",
    title: "Export devices data",
  });
  const machineCountLabel = new FakeElement("span", {}, [new FakeTextNode("machines")]);
  const machineHeader = new FakeElement("th", {}, [new FakeTextNode("Machine")]);
  const addressesHeader = new FakeElement("th", {}, [new FakeTextNode("Addresses")]);
  const versionHeader = new FakeElement("th", {}, [new FakeTextNode("Version")]);
  const lastSeenHeader = new FakeElement("th", {}, [new FakeTextNode("Last Seen")]);
  const actionHeader = new FakeElement("th", {}, [
    new FakeTextNode("Machines action menu"),
  ]);
  const detailLink = new FakeElement("a", {
    "aria-label": "Detail view for a1-0579",
  }, [new FakeTextNode("a1-0579")]);
  const expiryDisabledBadge = new FakeElement("span", {}, [new FakeTextNode("Expiry disabled")]);
  const addressesButton = new FakeElement("button", {
    "aria-label": "See all addresses for this device.",
  });
  const connectedStatus = new FakeElement("span", {}, [new FakeTextNode("Connected")]);
  const actionButton = new FakeElement("button", {
    "aria-label": "Actions for a1-0579",
  });
  const shareButton = new FakeElement("button", {
    "aria-label": "Share a1-0579",
  });
  const updateBadge = new FakeElement("svg", {
    "aria-label": "Update available for dogemacbook-air",
  });
  const previousButton = new FakeElement("button", {}, [new FakeTextNode("Previous")]);
  const nextButton = new FakeElement("button", {}, [new FakeTextNode("Next")]);
  const networkCardHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Add devices to your network"),
  ]);
  const networkCardDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Tailscale works best when it’s installed on multiple devices. Explore what you can do with Tailscale in these environments.",
    ),
  ]);
  const operatingSystemsHeading = new FakeElement("h4", {}, [
    new FakeTextNode("Operating systems"),
  ]);
  const cloudProvidersHeading = new FakeElement("h4", {}, [
    new FakeTextNode("Cloud providers"),
  ]);
  const containersHeading = new FakeElement("h4", {}, [
    new FakeTextNode("Containers"),
  ]);
  const seeMoreLink = new FakeElement("a", {}, [new FakeTextNode("See more")]);
  const addAwsVmLink = new FakeElement("a", {}, [new FakeTextNode("Add AWS VM")]);
  const addDeviceLinuxServerTitle = new FakeElement("h3", {}, [
    new FakeTextNode("Linux server"),
  ]);
  const addDeviceLinuxServerDescription = new FakeElement("p", {}, [
    new FakeTextNode("Use this for services running on VMs, containers, and functions"),
  ]);
  const addDeviceClientDeviceTitle = new FakeElement("h3", {}, [
    new FakeTextNode("Client device"),
  ]);
  const addDeviceClientDeviceDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Use this for user-owned client devices like macOS, Windows, Linux, iOS, and Android",
    ),
  ]);
  const addDeviceDialogIntroLead = new FakeElement("span", {}, [
    new FakeTextNode(
      "To add a new device to your tailnet, install Tailscale on that device and log in as ",
    ),
  ]);
  const addDeviceDialogIdentity = new FakeElement("strong", {}, [
    new FakeTextNode("isdoge93@gmail.com"),
  ]);
  const addDeviceDialogIntroTail = new FakeElement("span", {}, [new FakeTextNode(".")]);
  const emailLinkTab = new FakeElement("button", {}, [new FakeTextNode("Email link")]);
  const addDeviceCopyLinkTab = new FakeElement("button", {}, [new FakeTextNode("Copy link")]);
  const readGuideTab = new FakeElement("button", {}, [new FakeTextNode("Read guide")]);
  const inputCodeTab = new FakeElement("button", {}, [new FakeTextNode("Input code")]);
  const sendInviteButton = new FakeElement("button", {}, [new FakeTextNode("Send")]);
  const addDeviceInstallLinkNote = new FakeElement("p", {}, [
    new FakeTextNode("We’ll only use it to send you the install link and nothing else."),
  ]);
  const copyDownloadLinkButton = new FakeElement("button", {}, [new FakeTextNode("Copy")]);
  const requiresLead = new FakeElement("span", {}, [new FakeTextNode("Requires ")]);
  const requiresPlatform = new FakeElement("strong", {}, [new FakeTextNode("Android 6")]);
  const requiresTail = new FakeElement("span", {}, [new FakeTextNode(" or later.")]);
  const macosReadGuideIntro = new FakeElement("p", {}, [
    new FakeTextNode("Download and install the Tailscale client using one of the following options:"),
  ]);
  const standaloneVariantLink = new FakeElement("a", {}, [new FakeTextNode("Standalone variant")]);
  const standaloneVariantTail = new FakeElement("span", {}, [
    new FakeTextNode("from the Tailscale package server (recommended)."),
  ]);
  const macAppStoreLink = new FakeElement("a", {}, [new FakeTextNode("Mac App Store")]);
  const macAppStoreTail = new FakeElement("span", {}, [
    new FakeTextNode(
      "variant. The Tailscale client is free to download, but downloading any app from the Mac App Store may require an Apple ID with a valid credit card attached.",
    ),
  ]);
  const onboardingFlowStep = new FakeElement("p", {}, [
    new FakeTextNode(
      "Follow the Tailscale onboarding flow, which will guide you to install the Tailscale VPN configuration.",
    ),
  ]);
  const signInStep = new FakeElement("p", {}, [
    new FakeTextNode("Sign in with your identity provider."),
  ]);
  const updatePopoverTitle = new FakeElement("h3", {}, [new FakeTextNode("Update available")]);
  const patchReleaseLabel = new FakeElement("span", {}, [new FakeTextNode("Patch release")]);
  const updateAvailableVersion = new FakeElement("strong", {}, [new FakeTextNode("1.96.5")]);
  const updateAvailableTail = new FakeElement("span", {}, [new FakeTextNode("is available.")]);
  const releaseNotesLink = new FakeElement("a", {}, [
    new FakeTextNode("Read the release notes"),
  ]);
  const updateWhatsNewTail = new FakeElement("span", {}, [
    new FakeTextNode("to find out what’s new!"),
  ]);
  const securityUpdateTitle = new FakeElement("h3", {}, [
    new FakeTextNode("Security update available"),
  ]);
  const securityUpdateDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "This machine is running a version with a known security vulnerability. It’s recommended to update to 1.96.5.",
    ),
  ]);
  const updateRecommendedTitle = new FakeElement("h3", {}, [
    new FakeTextNode("Update recommended"),
  ]);
  const updateRecommendedDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "This machine is multiple versions out of date. Version 1.96.5 is available, and it is recommended to update.",
    ),
  ]);
  const startUpdateButton = new FakeElement("button", {}, [new FakeTextNode("Start update")]);
  const updatingButton = new FakeElement("button", {}, [new FakeTextNode("Updating")]);
  const updatedButton = new FakeElement("button", {}, [new FakeTextNode("Updated")]);
  const macosUpdateGuideLead = new FakeTextNode("On ");
  const macosUpdateGuidePlatform = new FakeTextNode("macOS");
  const macosUpdateGuideTail = new FakeTextNode(
    ", update Tailscale from the Mac App Store’s “Updates” page.",
  );
  const macosUpdateGuide = new FakeElement("p", {}, [
    macosUpdateGuideLead,
    macosUpdateGuidePlatform,
    macosUpdateGuideTail,
  ]);
  const androidUpdateGuideLead = new FakeTextNode("On ");
  const androidUpdateGuidePlatform = new FakeTextNode("Android");
  const androidUpdateGuideTail = new FakeTextNode(
    ", update Tailscale from the Play Store’s “Update” page. By default, apps will auto-update.",
  );
  const androidUpdateGuide = new FakeElement("p", {}, [
    androidUpdateGuideLead,
    androidUpdateGuidePlatform,
    androidUpdateGuideTail,
  ]);
  const editMachineNameItem = new FakeElement("button", {}, [
    new FakeTextNode("Edit machine name…"),
  ]);
  const editMachineIpv4Item = new FakeElement("button", {}, [
    new FakeTextNode("Edit machine IPv4…"),
  ]);
  const shareMenuItem = new FakeElement("button", {}, [new FakeTextNode("Share…")]);
  const enableKeyExpiryItem = new FakeElement("button", {}, [
    new FakeTextNode("Enable key expiry"),
  ]);
  const disableKeyExpiryItem = new FakeElement("button", {}, [
    new FakeTextNode("Disable key expiry"),
  ]);
  const viewRecentActivityItem = new FakeElement("button", {}, [
    new FakeTextNode("View recent activity"),
  ]);
  const editRouteSettingsItem = new FakeElement("button", {}, [
    new FakeTextNode("Edit route settings…"),
  ]);
  const editAclTagsItem = new FakeElement("button", {}, [
    new FakeTextNode("Edit ACL tags…"),
  ]);
  const removeItem = new FakeElement("button", {}, [new FakeTextNode("Remove…")]);
  const editMachineNameDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Edit machine name for a1-0579"),
  ]);
  const editMachineNameDialogLead = new FakeElement("p", {}, [
    new FakeTextNode("This name is shown in the admin panel"),
  ]);
  const editMachineNameDialogTail = new FakeElement("p", {}, [
    new FakeTextNode(", in Tailscale clients, and used when generating MagicDNS names."),
  ]);
  const autoGenerateFromHostnameLabel = new FakeElement("label", {}, [
    new FakeTextNode("Auto-generate from OS hostname"),
  ]);
  const machineNameLabel = new FakeElement("label", {}, [
    new FakeTextNode("Machine name"),
  ]);
  const machineMagicDnsLead = new FakeElement("span", {}, [
    new FakeTextNode("This machine "),
  ]);
  const machineMagicDnsVerb = new FakeElement("span", {}, [new FakeTextNode("is")]);
  const machineMagicDnsTail = new FakeElement("span", {}, [
    new FakeTextNode(" accessible as"),
  ]);
  const machineMagicDnsValue = new FakeElement("code", {}, [new FakeTextNode("a1-0579")]);
  const machineMagicDnsSuffix = new FakeElement("span", {}, [
    new FakeTextNode(" using MagicDNS."),
  ]);
  const cancelNameButton = new FakeElement("button", {}, [new FakeTextNode("Cancel")]);
  const updateNameButton = new FakeElement("button", {}, [new FakeTextNode("Update name")]);
  const editMachineIpDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Edit machine IP for a1-0579"),
  ]);
  const editMachineIpDescription = new FakeElement("p", {}, [
    new FakeTextNode("This is the IP address that will be used to connect to this machine."),
  ]);
  const editMachineIpWarning = new FakeElement("div", {}, [
    new FakeTextNode(
      "This action will break any existing connections to this machine. You will need to reconnect to this machine using the new IP address. You may also need to flush your DNS cache.",
    ),
  ]);
  const machineIpLabel = new FakeElement("label", {}, [new FakeTextNode("Machine IP")]);
  const cancelIpButton = new FakeElement("button", {}, [new FakeTextNode("Cancel")]);
  const updateIpButton = new FakeElement("button", {}, [new FakeTextNode("Update IP")]);
  const shareMachineDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Share machine"),
  ]);
  const shareMachineLead = new FakeElement("span", {}, [
    new FakeTextNode("Share access to"),
  ]);
  const shareMachineValue = new FakeElement("strong", {}, [new FakeTextNode("a1-0579")]);
  const shareMachineTail = new FakeElement("span", {}, [
    new FakeTextNode(
      "with external users, as allowed by ACLs. If you need multiple users in the same tailnet to access it, or if you want to share more than one machine with a user, invite users to your tailnet instead.",
    ),
  ]);
  const shareViaEmailTab = new FakeElement("button", {}, [new FakeTextNode("Share via email")]);
  const copyShareLinkTab = new FakeElement("button", {}, [new FakeTextNode("Copy share link")]);
  const shareDialogButton = new FakeElement("button", {}, [new FakeTextNode("Share")]);
  const shareRecipientsHelp = new FakeElement("p", {}, [
    new FakeTextNode("You can use commas to separate multiple email recipients."),
  ]);
  const noExternalUsersLabel = new FakeElement("p", {}, [
    new FakeTextNode("No external users have access"),
  ]);
  const editRouteSettingsDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Edit route settings of a1-0579"),
  ]);
  const subnetRoutesHeading = new FakeElement("h3", {}, [new FakeTextNode("Subnet routes")]);
  const subnetRoutesDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Connect to devices you can’t install Tailscale on by advertising IP ranges as subnet routes.",
    ),
  ]);
  const noRoutesLabel = new FakeElement("p", {}, [
    new FakeTextNode("This machine does not expose any routes."),
  ]);
  const exitNodeHeading = new FakeElement("h3", {}, [new FakeTextNode("Exit node")]);
  const exitNodeDescription = new FakeElement("p", {}, [
    new FakeTextNode("Allow your network to route internet traffic through this machine."),
  ]);
  const useAsExitNodeLabel = new FakeElement("label", {}, [new FakeTextNode("Use as exit node")]);
  const cancelRouteButton = new FakeElement("button", {}, [new FakeTextNode("Cancel")]);
  const saveRouteButton = new FakeElement("button", {}, [new FakeTextNode("Save")]);
  const editAclTagsDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Edit ACL tags for a1-0579"),
  ]);
  const editAclTagsLead = new FakeElement("span", {}, [
    new FakeTextNode("Assigning tags will change the ownership of"),
  ]);
  const editAclTagsValue = new FakeElement("strong", {}, [new FakeTextNode("a1-0579")]);
  const editAclTagsMid = new FakeElement("span", {}, [new FakeTextNode(" from")]);
  const editAclTagsOwner = new FakeElement("strong", {}, [new FakeTextNode("isdoge93@gmail.com")]);
  const editAclTagsTail = new FakeElement("span", {}, [
    new FakeTextNode(" to the tag(s) you select. Make sure to update your ACLs accordingly."),
  ]);
  const noTagsDefinedLabel = new FakeElement("p", {}, [
    new FakeTextNode("No tags defined. Define tags from the Access Controls page"),
  ]);
  const goToAccessControlsButton = new FakeElement("button", {}, [
    new FakeTextNode("Go to Access Controls"),
  ]);
  const cancelAclButton = new FakeElement("button", {}, [new FakeTextNode("Cancel")]);
  const saveAclButton = new FakeElement("button", {}, [new FakeTextNode("Save")]);
  const removeMachineDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Remove a1-0579"),
  ]);
  const removeMachineDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "This machine will permanently be removed from your network. To re-add it, you will need to re-authenticate to your tailnet from the device.",
    ),
  ]);
  const removeMachineHoldLead = new FakeElement("span", {}, [new FakeTextNode("Hold ")]);
  const removeMachineOptionKey = new FakeElement("strong", {}, [new FakeTextNode("the Option key")]);
  const removeMachineHoldTail = new FakeElement("span", {}, [
    new FakeTextNode(" while clicking “Remove” to skip this confirmation."),
  ]);
  const cancelRemoveButton = new FakeElement("button", {}, [new FakeTextNode("Cancel")]);
  const removeMachineButton = new FakeElement("button", {}, [new FakeTextNode("Remove machine")]);
  const exitNodeAdvertiseHint = new FakeElement("span", {}, [
    new FakeTextNode("This device does not advertise itself as an exit node. Re-run "),
    new FakeElement("code", { class: "bg-gray-200 dark:bg-gray-600 text-sm" }, [
      new FakeTextNode("tailscale up"),
    ]),
    new FakeTextNode(" with the "),
    new FakeElement("code", { class: "bg-gray-200 dark:bg-gray-600 text-sm" }, [
      new FakeTextNode("--advertise-exit-node"),
    ]),
    new FakeTextNode(" flag to enable this option."),
  ]);
  const body = new FakeElement("body", {}, [
    pageTitle,
    pageDescription,
    learnMoreLink,
    addDeviceButton,
    searchInput,
    filtersButton,
    exportButton,
    machineCountLabel,
    machineHeader,
    addressesHeader,
    versionHeader,
    lastSeenHeader,
    actionHeader,
    detailLink,
    expiryDisabledBadge,
    addressesButton,
    connectedStatus,
    actionButton,
    shareButton,
    updateBadge,
    previousButton,
    nextButton,
    networkCardHeading,
    networkCardDescription,
    operatingSystemsHeading,
    cloudProvidersHeading,
    containersHeading,
    seeMoreLink,
    addAwsVmLink,
    addDeviceLinuxServerTitle,
    addDeviceLinuxServerDescription,
    addDeviceClientDeviceTitle,
    addDeviceClientDeviceDescription,
    addDeviceDialogIntroLead,
    addDeviceDialogIdentity,
    addDeviceDialogIntroTail,
    emailLinkTab,
    addDeviceCopyLinkTab,
    readGuideTab,
    inputCodeTab,
    sendInviteButton,
    addDeviceInstallLinkNote,
    copyDownloadLinkButton,
    requiresLead,
    requiresPlatform,
    requiresTail,
    macosReadGuideIntro,
    standaloneVariantLink,
    standaloneVariantTail,
    macAppStoreLink,
    macAppStoreTail,
    onboardingFlowStep,
    signInStep,
    updatePopoverTitle,
    patchReleaseLabel,
    updateAvailableVersion,
    updateAvailableTail,
    releaseNotesLink,
    updateWhatsNewTail,
    securityUpdateTitle,
    securityUpdateDescription,
    updateRecommendedTitle,
    updateRecommendedDescription,
    startUpdateButton,
    updatingButton,
    updatedButton,
    macosUpdateGuide,
    macosUpdateGuideLead,
    macosUpdateGuidePlatform,
    macosUpdateGuideTail,
    androidUpdateGuide,
    androidUpdateGuideLead,
    androidUpdateGuidePlatform,
    androidUpdateGuideTail,
    editMachineNameItem,
    editMachineIpv4Item,
    shareMenuItem,
    enableKeyExpiryItem,
    disableKeyExpiryItem,
    viewRecentActivityItem,
    editRouteSettingsItem,
    editAclTagsItem,
    removeItem,
    editMachineNameDialogTitle,
    editMachineNameDialogLead,
    editMachineNameDialogTail,
    autoGenerateFromHostnameLabel,
    machineNameLabel,
    machineMagicDnsLead,
    machineMagicDnsVerb,
    machineMagicDnsTail,
    machineMagicDnsValue,
    machineMagicDnsSuffix,
    cancelNameButton,
    updateNameButton,
    editMachineIpDialogTitle,
    editMachineIpDescription,
    editMachineIpWarning,
    machineIpLabel,
    cancelIpButton,
    updateIpButton,
    shareMachineDialogTitle,
    shareMachineLead,
    shareMachineValue,
    shareMachineTail,
    shareViaEmailTab,
    copyShareLinkTab,
    shareDialogButton,
    shareRecipientsHelp,
    noExternalUsersLabel,
    editRouteSettingsDialogTitle,
    subnetRoutesHeading,
    subnetRoutesDescription,
    noRoutesLabel,
    exitNodeHeading,
    exitNodeDescription,
    useAsExitNodeLabel,
    cancelRouteButton,
    saveRouteButton,
    editAclTagsDialogTitle,
    editAclTagsLead,
    editAclTagsValue,
    editAclTagsMid,
    editAclTagsOwner,
    editAclTagsTail,
    noTagsDefinedLabel,
    goToAccessControlsButton,
    cancelAclButton,
    saveAclButton,
    removeMachineDialogTitle,
    removeMachineDescription,
    removeMachineHoldLead,
    removeMachineOptionKey,
    removeMachineHoldTail,
    cancelRemoveButton,
    removeMachineButton,
    exitNodeAdvertiseHint,
  ]);

  return {
    body,
    references: {
      pageTitle,
      pageDescription,
      learnMoreLink,
      addDeviceButton,
      searchInput,
      filtersButton,
      exportButton,
      machineCountLabel,
      machineHeader,
      addressesHeader,
      versionHeader,
      lastSeenHeader,
      actionHeader,
      detailLink,
      expiryDisabledBadge,
      addressesButton,
      connectedStatus,
      actionButton,
      shareButton,
      updateBadge,
      previousButton,
      nextButton,
      networkCardHeading,
      networkCardDescription,
      operatingSystemsHeading,
      cloudProvidersHeading,
      containersHeading,
      seeMoreLink,
      addAwsVmLink,
      addDeviceLinuxServerTitle,
      addDeviceLinuxServerDescription,
      addDeviceClientDeviceTitle,
      addDeviceClientDeviceDescription,
      addDeviceDialogIntroLead,
      addDeviceDialogIdentity,
      addDeviceDialogIntroTail,
      emailLinkTab,
      copyLinkTab: addDeviceCopyLinkTab,
      readGuideTab,
      inputCodeTab,
      sendInviteButton,
      addDeviceInstallLinkNote,
      copyDownloadLinkButton,
      requiresLead,
      requiresPlatform,
      requiresTail,
      macosReadGuideIntro,
      standaloneVariantLink,
      standaloneVariantTail,
      macAppStoreLink,
      macAppStoreTail,
      onboardingFlowStep,
      signInStep,
      updatePopoverTitle,
      patchReleaseLabel,
      updateAvailableVersion,
      updateAvailableTail,
      releaseNotesLink,
      updateWhatsNewTail,
      securityUpdateTitle,
      securityUpdateDescription,
      updateRecommendedTitle,
      updateRecommendedDescription,
      startUpdateButton,
      updatingButton,
      updatedButton,
      macosUpdateGuide,
      macosUpdateGuideLead,
      macosUpdateGuidePlatform,
      macosUpdateGuideTail,
      androidUpdateGuide,
      androidUpdateGuideLead,
      androidUpdateGuidePlatform,
      androidUpdateGuideTail,
      editMachineNameItem,
      editMachineIpv4Item,
      shareMenuItem,
      enableKeyExpiryItem,
      disableKeyExpiryItem,
      viewRecentActivityItem,
      editRouteSettingsItem,
      editAclTagsItem,
      removeItem,
      editMachineNameDialogTitle,
      editMachineNameDialogLead,
      editMachineNameDialogTail,
      autoGenerateFromHostnameLabel,
      machineNameLabel,
      machineMagicDnsLead,
      machineMagicDnsVerb,
      machineMagicDnsTail,
      machineMagicDnsValue,
      machineMagicDnsSuffix,
      cancelNameButton,
      updateNameButton,
      editMachineIpDialogTitle,
      editMachineIpDescription,
      editMachineIpWarning,
      machineIpLabel,
      cancelIpButton,
      updateIpButton,
      shareMachineDialogTitle,
      shareMachineLead,
      shareMachineValue,
      shareMachineTail,
      shareViaEmailTab,
      copyShareLinkTab,
      shareDialogButton,
      shareRecipientsHelp,
      noExternalUsersLabel,
      editRouteSettingsDialogTitle,
      subnetRoutesHeading,
      subnetRoutesDescription,
      noRoutesLabel,
      exitNodeHeading,
      exitNodeDescription,
      useAsExitNodeLabel,
      cancelRouteButton,
      saveRouteButton,
      editAclTagsDialogTitle,
      editAclTagsLead,
      editAclTagsValue,
      editAclTagsMid,
      editAclTagsOwner,
      editAclTagsTail,
      noTagsDefinedLabel,
      goToAccessControlsButton,
      cancelAclButton,
      saveAclButton,
      removeMachineDialogTitle,
      removeMachineDescription,
      removeMachineHoldLead,
      removeMachineOptionKey,
      removeMachineHoldTail,
      cancelRemoveButton,
      removeMachineButton,
      exitNodeAdvertiseHint,
    },
  };
}

function createMachineDetailBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const allMachinesLink = new FakeElement("a", {}, [new FakeTextNode("All Machines")]);
  const slashLabel = new FakeTextNode("/");
  const detailLink = new FakeElement("a", {}, [new FakeTextNode("100.93.195.77")]);
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("a1-0579")]);
  const shareButton = new FakeElement("button", {}, [new FakeTextNode("Share…")]);
  const machineSettingsButton = new FakeElement("button", {
    "aria-label": "Actions for a1-0579",
  }, [new FakeTextNode("Machine settings")]);
  const managedByLabel = new FakeElement("span", {}, [new FakeTextNode("Managed by")]);
  const subnetsHeading = new FakeElement("h3", {}, [new FakeTextNode("Subnets")]);
  const subnetsDescription = new FakeElement("p", {}, [
    new FakeTextNode("Subnets let you expose physical network routes onto Tailscale."),
  ]);
  const noRoutesLabel = new FakeElement("p", {}, [
    new FakeTextNode("This machine does not expose any routes."),
  ]);
  const routingSettingsHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Routing Settings"),
  ]);
  const routingSettingsDescription = new FakeElement("p", {}, [
    new FakeTextNode("Let this device route traffic for your tailnet."),
  ]);
  const exitNodeLabel = new FakeElement("span", {}, [new FakeTextNode("Exit Node")]);
  const notAllowedLabel = new FakeElement("span", {}, [new FakeTextNode("Not Allowed")]);
  const editButton = new FakeElement("button", {}, [new FakeTextNode("Edit")]);
  const appsLabel = new FakeElement("span", {}, [new FakeTextNode("Apps")]);
  const machineDetailsHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Machine Details"),
  ]);
  const machineDetailsDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Information about this machine’s network. Used to debug connection issues.",
    ),
  ]);
  const creatorLabel = new FakeElement("span", {}, [new FakeTextNode("Creator")]);
  const machineNameLabel = new FakeElement("span", {}, [new FakeTextNode("Machine name")]);
  const copyButton = new FakeElement("button", {}, [new FakeTextNode("Copy")]);
  const osHostnameLabel = new FakeElement("span", {}, [new FakeTextNode("OS hostname")]);
  const tailscaleVersionLabel = new FakeElement("span", {}, [
    new FakeTextNode("Tailscale version"),
  ]);
  const createdLabel = new FakeElement("span", {}, [new FakeTextNode("Created")]);
  const lastSeenLabel = new FakeElement("span", {}, [new FakeTextNode("Last seen")]);
  const keyExpiryLabel = new FakeElement("span", {}, [new FakeTextNode("Key expiry")]);
  const attributesHeading = new FakeElement("h3", {}, [new FakeTextNode("ATTRIBUTES")]);
  const relaysHeading = new FakeElement("h3", {}, [new FakeTextNode("RELAYS")]);
  const latencyLabel = new FakeElement("span", {}, [new FakeTextNode("Latency")]);
  const addressesHeading = new FakeElement("h3", {}, [new FakeTextNode("ADDRESSES")]);
  const shortDomainLabel = new FakeElement("span", {}, [new FakeTextNode("Short domain")]);
  const fullDomainLabel = new FakeElement("span", {}, [new FakeTextNode("Full domain")]);
  const clientConnectivityHeading = new FakeElement("h3", {}, [
    new FakeTextNode("CLIENT CONNECTIVITY"),
  ]);
  const variesLabel = new FakeElement("span", {}, [new FakeTextNode("Varies")]);
  const noLabel = new FakeElement("span", {}, [new FakeTextNode("No")]);
  const yesLabel = new FakeElement("span", {}, [new FakeTextNode("Yes")]);
  const tlsCertificateHeading = new FakeElement("h3", {}, [
    new FakeTextNode("TLS CERTIFICATE"),
  ]);
  const domainLabel = new FakeElement("span", {}, [new FakeTextNode("Domain")]);
  const statusLabel = new FakeElement("span", {}, [new FakeTextNode("Status")]);
  const validLabel = new FakeElement("span", {}, [new FakeTextNode("Valid")]);
  const untilLabel = new FakeElement("span", {}, [new FakeTextNode("until")]);
  const monthsFromNowLabel = new FakeElement("span", {}, [
    new FakeTextNode("2 months from now"),
  ]);
  const endpointsAlphaHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Endpoints Alpha version"),
  ]);
  const endpointsDescription = new FakeElement("p", {}, [
    new FakeTextNode("Live endpoints running on this machine."),
  ]);
  const noEndpointsLabel = new FakeElement("p", {}, [
    new FakeTextNode("This machine is not reporting any endpoints."),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    allMachinesLink,
    slashLabel,
    detailLink,
    pageTitle,
    shareButton,
    machineSettingsButton,
    managedByLabel,
    subnetsHeading,
    subnetsDescription,
    noRoutesLabel,
    routingSettingsHeading,
    routingSettingsDescription,
    exitNodeLabel,
    notAllowedLabel,
    editButton,
    appsLabel,
    machineDetailsHeading,
    machineDetailsDescription,
    creatorLabel,
    machineNameLabel,
    copyButton,
    osHostnameLabel,
    tailscaleVersionLabel,
    createdLabel,
    lastSeenLabel,
    keyExpiryLabel,
    attributesHeading,
    relaysHeading,
    latencyLabel,
    addressesHeading,
    shortDomainLabel,
    fullDomainLabel,
    clientConnectivityHeading,
    variesLabel,
    noLabel,
    yesLabel,
    tlsCertificateHeading,
    domainLabel,
    statusLabel,
    validLabel,
    untilLabel,
    monthsFromNowLabel,
    endpointsAlphaHeading,
    endpointsDescription,
    noEndpointsLabel,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      allMachinesLink,
      detailLink,
      pageTitle,
      shareButton,
      machineSettingsButton,
      managedByLabel,
      subnetsHeading,
      subnetsDescription,
      noRoutesLabel,
      routingSettingsHeading,
      routingSettingsDescription,
      exitNodeLabel,
      notAllowedLabel,
      editButton,
      appsLabel,
      machineDetailsHeading,
      machineDetailsDescription,
      creatorLabel,
      machineNameLabel,
      copyButton,
      osHostnameLabel,
      tailscaleVersionLabel,
      createdLabel,
      lastSeenLabel,
      keyExpiryLabel,
      attributesHeading,
      relaysHeading,
      latencyLabel,
      addressesHeading,
      shortDomainLabel,
      fullDomainLabel,
      clientConnectivityHeading,
      variesLabel,
      noLabel,
      yesLabel,
      tlsCertificateHeading,
      domainLabel,
      statusLabel,
      validLabel,
      untilLabel,
      monthsFromNowLabel,
      endpointsAlphaHeading,
      endpointsDescription,
      noEndpointsLabel,
    },
  };
}

function createMachineSshSetupBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const allMachinesLink = new FakeElement("a", {}, [new FakeTextNode("All Machines")]);
  const machineNameLink = new FakeElement("a", {}, [new FakeTextNode("txy")]);
  const sshQuickstartLink = new FakeElement("a", {}, [new FakeTextNode("SSH quickstart")]);
  const pageTitle = new FakeElement("h1", {}, [
    new FakeTextNode("Tailscale SSH quickstart"),
  ]);
  const introDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Tailscale makes it easy to SSH to txy from other devices on your tailnet - here's how to get started.",
    ),
  ]);
  const readDocsLead = new FakeTextNode("For more details, read the");
  const readDocsLink = new FakeElement("a", {}, [
    new FakeTextNode("full Tailscale SSH docs"),
  ]);
  const enableSshHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Enable Tailscale SSH"),
  ]);
  const enableSshDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "On txy, run this command. It tells the Tailscale daemon to handle incoming SSH on port 22.",
    ),
  ]);
  const allowSshHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Allow SSH in your tailnet policy"),
  ]);
  const policyAllowedLabel = new FakeElement("p", {}, [
    new FakeTextNode("Tailscale SSH is already allowed by your policy file."),
  ]);
  const connectHeading = new FakeElement("h3", {}, [new FakeTextNode("Connect")]);
  const connectDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "From another device on your tailnet, run this command to SSH into txy.",
    ),
  ]);
  const goingFurtherHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Going further"),
  ]);
  const goingFurtherDescription = new FakeElement("p", {}, [
    new FakeTextNode("Other ways to get more out of Tailscale SSH:"),
  ]);
  const checkModeItem = new FakeElement("li", {}, [
    new FakeTextNode(
      "Use Check mode to re-authenticate with your IdP on a schedule before SSH sessions",
    ),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    allMachinesLink,
    machineNameLink,
    sshQuickstartLink,
    pageTitle,
    introDescription,
    readDocsLead,
    readDocsLink,
    enableSshHeading,
    enableSshDescription,
    allowSshHeading,
    policyAllowedLabel,
    connectHeading,
    connectDescription,
    goingFurtherHeading,
    goingFurtherDescription,
    checkModeItem,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      allMachinesLink,
      machineNameLink,
      sshQuickstartLink,
      pageTitle,
      introDescription,
      readDocsLead,
      readDocsLink,
      enableSshHeading,
      enableSshDescription,
      allowSshHeading,
      policyAllowedLabel,
      connectHeading,
      connectDescription,
      goingFurtherHeading,
      goingFurtherDescription,
      checkModeItem,
    },
  };
}

function createAppsBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Apps")]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Route traffic to third-party SaaS apps through connectors on your tailnet.",
    ),
  ]);
  const learnMoreLink = new FakeElement("a", {
    "aria-label": "Read documentation about Apps",
  }, [new FakeTextNode("Learn more")]);
  const addAppButton = new FakeElement("button", {}, [new FakeTextNode("Add app")]);
  const emptyHeading = new FakeElement("h3", {}, [new FakeTextNode("Add an app")]);
  const emptyDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Apps let you control access to your third-party SaaS applications, without requiring any end user configuration.",
    ),
  ]);
  const routesLabel = new FakeElement("span", {}, [new FakeTextNode("routes")]);
  const nameHeader = new FakeElement("th", {}, [new FakeTextNode("NAME")]);
  const domainsHeader = new FakeElement("th", {}, [new FakeTextNode("DOMAINS")]);
  const connectorsHeader = new FakeElement("th", {}, [new FakeTextNode("CONNECTORS")]);
  const statusHeader = new FakeElement("th", {}, [new FakeTextNode("STATUS")]);
  const actionHeader = new FakeElement("th", {}, [
    new FakeTextNode("APP ACTION MENU"),
  ]);
  const dialogTitle = new FakeElement("h2", {}, [new FakeTextNode("Add an app")]);
  const appNameLabel = new FakeElement("label", {}, [new FakeTextNode("Name")]);
  const appNameHint = new FakeElement("p", {}, [
    new FakeTextNode(
      "Only shown in the admin console. Only letters, numbers, and dashes.",
    ),
  ]);
  const targetLabel = new FakeElement("label", {}, [new FakeTextNode("Target")]);
  const targetHint = new FakeElement("p", {}, [
    new FakeTextNode("External app to route traffic for."),
  ]);
  const selectTargetButton = new FakeElement("button", {}, [
    new FakeTextNode("Select a target"),
  ]);
  const dialogConnectorsLabel = new FakeElement("span", {}, [
    new FakeTextNode("Connectors"),
  ]);
  const connectorsLead = new FakeTextNode("Configure which");
  const connectorsLink = new FakeElement("a", {}, [new FakeTextNode("connectors")]);
  const connectorsTail = new FakeTextNode("can route traffic for this app.");
  const selectAclTagsButton = new FakeElement("button", {}, [
    new FakeTextNode("Select ACL tags"),
  ]);
  const noAclTagsLabel = new FakeElement("p", {}, [
    new FakeTextNode("No ACL tags found. You can create ACL tags from the"),
  ]);
  const accessControlsPageLink = new FakeElement("a", {}, [
    new FakeTextNode("Access Controls page"),
  ]);
  const cancelButton = new FakeElement("button", {}, [new FakeTextNode("Cancel")]);
  const saveButton = new FakeElement("button", {}, [new FakeTextNode("Save")]);
  const searchAppsInput = new FakeElement("input", {
    type: "text",
    placeholder: "Search apps...",
  });
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    pageTitle,
    pageDescription,
    learnMoreLink,
    addAppButton,
    emptyHeading,
    emptyDescription,
    routesLabel,
    nameHeader,
    domainsHeader,
    connectorsHeader,
    statusHeader,
    actionHeader,
    dialogTitle,
    appNameLabel,
    appNameHint,
    targetLabel,
    targetHint,
    selectTargetButton,
    dialogConnectorsLabel,
    connectorsLead,
    connectorsLink,
    connectorsTail,
    selectAclTagsButton,
    noAclTagsLabel,
    accessControlsPageLink,
    cancelButton,
    saveButton,
    searchAppsInput,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      pageTitle,
      pageDescription,
      learnMoreLink,
      addAppButton,
      emptyHeading,
      emptyDescription,
      routesLabel,
      nameHeader,
      domainsHeader,
      connectorsHeader,
      statusHeader,
      actionHeader,
      dialogTitle,
      appNameLabel,
      appNameHint,
      targetLabel,
      targetHint,
      selectTargetButton,
      dialogConnectorsLabel,
      connectorsLead,
      connectorsLink,
      connectorsTail,
      selectAclTagsButton,
      noAclTagsLabel,
      accessControlsPageLink,
      cancelButton,
      saveButton,
      searchAppsInput,
    },
  };
}

function createServicesBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Services")]);
  const giveFeedbackButton = new FakeElement("button", {}, [
    new FakeTextNode("Give feedback"),
  ]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode("Services advertised and discovered within your network."),
  ]);
  const advertisedTab = new FakeElement("button", {}, [new FakeTextNode("Advertised")]);
  const discoveredTab = new FakeElement("button", {}, [new FakeTextNode("Discovered")]);
  const emptyHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Define your first Service"),
  ]);
  const emptyDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Share Services in your tailnet by advertising Services from your devices.",
    ),
  ]);
  const step1Heading = new FakeElement("h4", {}, [
    new FakeTextNode("1. Define a Service"),
  ]);
  const step1Description = new FakeElement("p", {}, [
    new FakeTextNode(
      "Name, describe, and give identity to the process or data the Service will provide.",
    ),
  ]);
  const step2Heading = new FakeElement("h4", {}, [
    new FakeTextNode("2. Advertise and serve"),
  ]);
  const step2Description = new FakeElement("p", {}, [
    new FakeTextNode("From the host, advertise the Service ports from which it will serve."),
  ]);
  const step3Heading = new FakeElement("h4", {}, [new FakeTextNode("3. Approve")]);
  const step3Description = new FakeElement("p", {}, [
    new FakeTextNode(
      "Review proper configuration and approve each Service’s hosts, manually or automatically.",
    ),
  ]);
  const defineServiceLink = new FakeElement("a", {}, [new FakeTextNode("Define Service")]);
  const learnMoreButton = new FakeElement("button", {}, [new FakeTextNode("Learn more")]);
  const loadingEndpointsLabel = new FakeElement("p", {}, [
    new FakeTextNode("Loading endpoints..."),
  ]);
  const searchEndpointsInput = new FakeElement("input", {
    type: "text",
    placeholder: "Search endpoints...",
  });
  const typeFilterButton = new FakeElement("button", {}, [new FakeTextNode("Type")]);
  const userFilterButton = new FakeElement("button", {}, [new FakeTextNode("User")]);
  const noEndpointsHeading = new FakeElement("h3", {}, [
    new FakeTextNode("No reported endpoints"),
  ]);
  const noEndpointsDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "If your network just turned on endpoint collection, machines may take some time to start sending their endpoints.",
    ),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    pageTitle,
    giveFeedbackButton,
    pageDescription,
    advertisedTab,
    discoveredTab,
    emptyHeading,
    emptyDescription,
    step1Heading,
    step1Description,
    step2Heading,
    step2Description,
    step3Heading,
    step3Description,
    defineServiceLink,
    learnMoreButton,
    loadingEndpointsLabel,
    searchEndpointsInput,
    typeFilterButton,
    userFilterButton,
    noEndpointsHeading,
    noEndpointsDescription,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      pageTitle,
      giveFeedbackButton,
      pageDescription,
      advertisedTab,
      discoveredTab,
      emptyHeading,
      emptyDescription,
      step1Heading,
      step1Description,
      step2Heading,
      step2Description,
      step3Heading,
      step3Description,
      defineServiceLink,
      learnMoreButton,
      loadingEndpointsLabel,
      searchEndpointsInput,
      typeFilterButton,
      userFilterButton,
      noEndpointsHeading,
      noEndpointsDescription,
    },
  };
}

function createServicesNewBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const backLink = new FakeElement("a", {}, [new FakeTextNode("Back to All Services")]);
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Define a Service")]);
  const serviceNameLabel = new FakeElement("label", {}, [new FakeTextNode("Service name")]);
  const serviceAddressName = new FakeElement("strong", {}, [new FakeTextNode("name")]);
  const serviceAddressLabel = new FakeElement("p", {}, [
    new FakeTextNode("This Service will be available in your tailnet at"),
    new FakeTextNode(" "),
    serviceAddressName,
    new FakeTextNode(".tailf14c18.ts.net"),
  ]);
  const serviceNameInput = new FakeElement("input", { type: "text" });
  const serviceNameHint = new FakeElement("p", {}, [
    new FakeTextNode("Only alphanumeric characters and dashes allowed, max 63 characters."),
  ]);
  const descriptionLabel = new FakeElement("label", {}, [new FakeTextNode("Description")]);
  const descriptionInput = new FakeElement("textarea", {});
  const descriptionHint = new FakeElement("p", {}, [new FakeTextNode("Max 80 characters")]);
  const portsLabel = new FakeElement("label", {}, [new FakeTextNode("Ports")]);
  const portsHint = new FakeElement("p", {}, [
    new FakeTextNode("Which ports does this Service listen on?"),
  ]);
  const learnMoreLink = new FakeElement("a", {
    "aria-label": "Read documentation about Learn more about Services",
  }, [new FakeTextNode("Learn more")]);
  const portsInput = new FakeElement("input", {
    type: "text",
    placeholder: "443, 53-57, 4000",
  });
  const portsEligibilityHint = new FakeElement("p", {}, [
    new FakeTextNode("Only hosts advertising all listed ports will be eligible candidates."),
  ]);
  const serviceTagsLabel = new FakeElement("label", {}, [new FakeTextNode("Service tags")]);
  const serviceTagsHint = new FakeElement("p", {}, [
    new FakeTextNode("ACL tags can be used to identify this Service."),
  ]);
  const noTagsLabel = new FakeElement("p", {}, [new FakeTextNode("No tags assigned.")]);
  const addTagsButton = new FakeElement("button", {}, [new FakeTextNode("Add tags")]);
  const manageTagsLink = new FakeElement("a", {}, [
    new FakeTextNode("Manage tags in Access Controls"),
  ]);
  const defineServiceButton = new FakeElement("button", {}, [
    new FakeTextNode("Define Service"),
  ]);
  const cancelLink = new FakeElement("a", {}, [new FakeTextNode("Cancel")]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    backLink,
    pageTitle,
    serviceNameLabel,
    serviceAddressLabel,
    serviceNameInput,
    serviceNameHint,
    descriptionLabel,
    descriptionInput,
    descriptionHint,
    portsLabel,
    portsHint,
    learnMoreLink,
    portsInput,
    portsEligibilityHint,
    serviceTagsLabel,
    serviceTagsHint,
    noTagsLabel,
    addTagsButton,
    manageTagsLink,
    defineServiceButton,
    cancelLink,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      backLink,
      pageTitle,
      serviceNameLabel,
      serviceAddressName,
      serviceAddressLabel,
      serviceNameInput,
      serviceNameHint,
      descriptionLabel,
      descriptionInput,
      descriptionHint,
      portsLabel,
      portsHint,
      learnMoreLink,
      portsInput,
      portsEligibilityHint,
      serviceTagsLabel,
      serviceTagsHint,
      noTagsLabel,
      addTagsButton,
      manageTagsLink,
      defineServiceButton,
      cancelLink,
    },
  };
}

function createUsersBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Users")]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode("Manage the users in your network and their permissions."),
  ]);
  const searchInput = new FakeElement("input", {
    type: "text",
    placeholder: "Search users...",
  });
  const statusButton = new FakeElement("button", {}, [new FakeTextNode("Status")]);
  const roleButton = new FakeElement("button", {}, [new FakeTextNode("Role")]);
  const exportButton = new FakeElement("button", {
    "aria-label": "Export users data",
    title: "Export users data",
  });
  const inviteUsersHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Invite users"),
  ]);
  const inviteUsersDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "You can invite users by generating an invite link to share with them.",
    ),
  ]);
  const inviteExternalUsersButton = new FakeElement("button", {}, [
    new FakeTextNode("Invite external users"),
  ]);
  const approvalRequiredHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Approval is required"),
  ]);
  const approvalRequiredDescription = new FakeElement("p", {}, [
    new FakeTextNode("Invited users can only join after being approved by an admin."),
  ]);
  const editInSettingsLink = new FakeElement("a", {}, [
    new FakeTextNode("Edit in Settings"),
  ]);
  const userCountLabel = new FakeElement("span", {}, [new FakeTextNode("user")]);
  const userHeader = new FakeElement("th", {}, [new FakeTextNode("User")]);
  const roleHeader = new FakeElement("th", {}, [new FakeTextNode("ROLE")]);
  const joinedHeader = new FakeElement("th", {}, [new FakeTextNode("Joined")]);
  const lastSeenHeader = new FakeElement("th", {}, [new FakeTextNode("Last seen")]);
  const actionHeader = new FakeElement("th", {}, [
    new FakeTextNode("Users action menu"),
  ]);
  const ownerRole = new FakeElement("span", {}, [new FakeTextNode("Owner")]);
  const connectedStatus = new FakeElement("span", {}, [new FakeTextNode("Connected")]);
  const actionButton = new FakeElement("button", {
    "aria-label": "Actions for jack mika",
  });
  const viewDevicesItem = new FakeElement("button", {}, [new FakeTextNode("View devices")]);
  const viewRecentActivityItem = new FakeElement("button", {}, [
    new FakeTextNode("View recent activity"),
  ]);
  const viewAccessRulesItem = new FakeElement("button", {}, [
    new FakeTextNode("View access control rules"),
  ]);
  const editRoleItem = new FakeElement("button", {}, [new FakeTextNode("Edit role…")]);
  const editGroupMembershipItem = new FakeElement("button", {}, [
    new FakeTextNode("Edit group membership…"),
  ]);
  const deleteUserItem = new FakeElement("button", {}, [new FakeTextNode("Delete user…")]);
  const inviteDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Invite external user"),
  ]);
  const inviteDialogDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Invite users to join this tailnet and access its machines, as allowed by ACLs. If you only want to give a user access to one machine, share the machine instead.",
    ),
  ]);
  const availableSeatsHeading = new FakeElement("h4", {}, [
    new FakeTextNode("Available seats"),
  ]);
  const availableSeatsDescription = new FakeElement("p", {}, [
    new FakeTextNode("Once an invited user joins the tailnet, they will occupy a seat."),
  ]);
  const learnMoreSeatsLink = new FakeElement("a", {}, [
    new FakeTextNode("Learn more about seats"),
  ]);
  const copyInviteLinkTab = new FakeElement("button", {}, [
    new FakeTextNode("Copy invite link"),
  ]);
  const inviteViaEmailTab = new FakeElement("button", {}, [
    new FakeTextNode("Invite via email"),
  ]);
  const selectRoleLabel = new FakeElement("label", {}, [
    new FakeTextNode("Select role"),
  ]);
  const roleHint = new FakeElement("p", {}, [
    new FakeTextNode("Signing up via the link will grant this role."),
  ]);
  const memberRoleButton = new FakeElement("button", {}, [new FakeTextNode("Member")]);
  const copyInviteLinkButton = new FakeElement("button", {}, [
    new FakeTextNode("Copy invite link"),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    pageTitle,
    pageDescription,
    searchInput,
    statusButton,
    roleButton,
    exportButton,
    inviteUsersHeading,
    inviteUsersDescription,
    inviteExternalUsersButton,
    approvalRequiredHeading,
    approvalRequiredDescription,
    editInSettingsLink,
    userCountLabel,
    userHeader,
    roleHeader,
    joinedHeader,
    lastSeenHeader,
    actionHeader,
    ownerRole,
    connectedStatus,
    actionButton,
    viewDevicesItem,
    viewRecentActivityItem,
    viewAccessRulesItem,
    editRoleItem,
    editGroupMembershipItem,
    deleteUserItem,
    inviteDialogTitle,
    inviteDialogDescription,
    availableSeatsHeading,
    availableSeatsDescription,
    learnMoreSeatsLink,
    copyInviteLinkTab,
    inviteViaEmailTab,
    selectRoleLabel,
    roleHint,
    memberRoleButton,
    copyInviteLinkButton,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      pageTitle,
      pageDescription,
      searchInput,
      statusButton,
      roleButton,
      exportButton,
      inviteUsersHeading,
      inviteUsersDescription,
      inviteExternalUsersButton,
      approvalRequiredHeading,
      approvalRequiredDescription,
      editInSettingsLink,
      userCountLabel,
      userHeader,
      roleHeader,
      joinedHeader,
      lastSeenHeader,
      actionHeader,
      ownerRole,
      connectedStatus,
      actionButton,
      viewDevicesItem,
      viewRecentActivityItem,
      viewAccessRulesItem,
      editRoleItem,
      editGroupMembershipItem,
      deleteUserItem,
      inviteDialogTitle,
      inviteDialogDescription,
      availableSeatsHeading,
      availableSeatsDescription,
      learnMoreSeatsLink,
      copyInviteLinkTab,
      inviteViaEmailTab,
      selectRoleLabel,
      roleHint,
      memberRoleButton,
      copyInviteLinkButton,
    },
  };
}

function createAccessControlsBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Access controls")]);
  const visualEditorTab = new FakeElement("button", {}, [new FakeTextNode("Visual editor")]);
  const jsonEditorTab = new FakeElement("button", {}, [new FakeTextNode("JSON editor")]);
  const giveFeedbackButton = new FakeElement("button", {}, [
    new FakeTextNode("Give feedback"),
  ]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Control who and which devices are allowed to connect in your network. If you need more advanced or customized control, or if you prefer to write in JSON directly, switch to the original JSON editor.",
    ),
  ]);
  const generalAccessRulesTab = new FakeElement("button", {}, [
    new FakeTextNode("General access rules"),
  ]);
  const sshTab = new FakeElement("button", {}, [new FakeTextNode("Tailscale SSH")]);
  const testsTab = new FakeElement("button", {}, [new FakeTextNode("Tests")]);
  const groupsTab = new FakeElement("button", {}, [new FakeTextNode("Groups")]);
  const tagsTab = new FakeElement("button", {}, [new FakeTextNode("Tags")]);
  const ipSetsTab = new FakeElement("button", {}, [new FakeTextNode("IP sets")]);
  const hostsTab = new FakeElement("button", {}, [new FakeTextNode("Hosts")]);
  const nodeAttributesTab = new FakeElement("button", {}, [
    new FakeTextNode("Node attributes"),
  ]);
  const devicePostureTab = new FakeElement("button", {}, [
    new FakeTextNode("Device posture"),
  ]);
  const autoApproversTab = new FakeElement("button", {}, [
    new FakeTextNode("Auto approvers"),
  ]);
  const searchInput = new FakeElement("input", {
    type: "text",
    placeholder: "Search by user, group, device, tag, port, IP address...etc.",
  });
  const toggleMenuButton = new FakeElement("button", {
    "aria-label": "toggle menu",
  });
  const addRuleButton = new FakeElement("button", {}, [new FakeTextNode("Add rule")]);
  const sourcesLabel = new FakeElement("span", {}, [new FakeTextNode("Sources")]);
  const destinationsLabel = new FakeElement("span", {}, [
    new FakeTextNode("can access destinations"),
  ]);
  const portProtocolLabel = new FakeElement("span", {}, [
    new FakeTextNode("on port and protocol"),
  ]);
  const commentLabel = new FakeElement("span", {}, [new FakeTextNode("Comment")]);
  const actionHeader = new FakeElement("th", {}, [
    new FakeTextNode("General access rules action menu"),
  ]);
  const defaultSource1 = new FakeElement("span", {}, [
    new FakeTextNode("All users and devices"),
  ]);
  const defaultSource2 = new FakeElement("span", {}, [
    new FakeTextNode("All users and devices"),
  ]);
  const defaultPorts = new FakeElement("span", {}, [
    new FakeTextNode("All ports and protocols"),
  ]);
  const actionMenuButton = new FakeElement("button", {
    "aria-label": "Actions for grant policy 0",
  });
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    pageTitle,
    visualEditorTab,
    jsonEditorTab,
    giveFeedbackButton,
    pageDescription,
    generalAccessRulesTab,
    sshTab,
    testsTab,
    groupsTab,
    tagsTab,
    ipSetsTab,
    hostsTab,
    nodeAttributesTab,
    devicePostureTab,
    autoApproversTab,
    searchInput,
    toggleMenuButton,
    addRuleButton,
    sourcesLabel,
    destinationsLabel,
    portProtocolLabel,
    commentLabel,
    actionHeader,
    defaultSource1,
    defaultSource2,
    defaultPorts,
    actionMenuButton,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      pageTitle,
      visualEditorTab,
      jsonEditorTab,
      giveFeedbackButton,
      pageDescription,
      generalAccessRulesTab,
      sshTab,
      testsTab,
      groupsTab,
      tagsTab,
      ipSetsTab,
      hostsTab,
      nodeAttributesTab,
      devicePostureTab,
      autoApproversTab,
      searchInput,
      toggleMenuButton,
      addRuleButton,
      sourcesLabel,
      destinationsLabel,
      portProtocolLabel,
      commentLabel,
      actionHeader,
      defaultSource1,
      defaultSource2,
      defaultPorts,
      actionMenuButton,
    },
  };
}

function createAccessControlsAddRuleBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const backLink = new FakeElement("a", {}, [new FakeTextNode("General access rules")]);
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Add rule")]);
  const sourcesLabel = new FakeElement("span", {}, [new FakeTextNode("Sources")]);
  const sourceInput = new FakeElement("input", {
    type: "text",
    role: "combobox",
    placeholder: "Enter source",
  });
  const sourceToggleButton = new FakeElement("button", {
    "aria-label": "toggle menu",
  });
  const destinationsLabel = new FakeElement("span", {}, [
    new FakeTextNode("Destination"),
  ]);
  const destinationInput = new FakeElement("input", {
    type: "text",
    role: "combobox",
    placeholder: "Enter destination",
  });
  const destinationToggleButton = new FakeElement("button", {
    "aria-label": "toggle menu",
  });
  const portProtocolLabel = new FakeElement("span", {}, [
    new FakeTextNode("Port and protocol"),
  ]);
  const defaultPorts = new FakeElement("span", {}, [
    new FakeTextNode("All ports and protocols"),
  ]);
  const removePortsButton = new FakeElement("button", {
    "aria-label": "Remove All ports and protocols",
  });
  const portsToggleButton = new FakeElement("button", {
    "aria-label": "toggle menu",
  });
  const commentLabel = new FakeElement("span", {}, [new FakeTextNode("Note")]);
  const commentInput = new FakeElement("textarea", {
    placeholder: "Enter a note to keep track of your rationale.",
  });
  const advancedOptionsButton = new FakeElement("button", {}, [
    new FakeTextNode("Advanced options"),
  ]);
  const devicePostureLabel = new FakeElement("span", {}, [
    new FakeTextNode("Device posture"),
  ]);
  const devicePostureInput = new FakeElement("input", {
    type: "text",
    role: "combobox",
    placeholder: "Enter device posture",
  });
  const devicePostureToggleButton = new FakeElement("button", {
    "aria-label": "toggle menu",
  });
  const devicePostureTooltip = new FakeElement("p", {}, [
    new FakeTextNode(
      "Specify device posture rules that must be true in order to allow these connections.",
    ),
  ]);
  const viaLabel = new FakeElement("span", {}, [new FakeTextNode("Via")]);
  const viaInput = new FakeElement("input", {
    type: "text",
    role: "combobox",
    placeholder: "Enter tag to route via",
  });
  const viaToggleButton = new FakeElement("button", {
    "aria-label": "toggle menu",
  });
  const viaTooltip = new FakeElement("p", {}, [
    new FakeTextNode(
      "Specify exit nodes, subnet routers, or app connectors that should be used to route the source(s) in this rule to the destination(s).",
    ),
  ]);
  const appLabel = new FakeElement("span", {}, [new FakeTextNode("App")]);
  const appInput = new FakeElement("input", {
    type: "text",
    role: "combobox",
    placeholder: "Enter domain",
  });
  const appToggleButton = new FakeElement("button", {
    "aria-label": "toggle menu",
  });
  const appTooltip = new FakeElement("p", {}, [
    new FakeTextNode(
      "Unique identifier for the capability, typically in the format my-domain.x/cap/feature.",
    ),
  ]);
  const capabilityLabel = new FakeElement("span", {}, [new FakeTextNode("Capability")]);
  const capabilityInput = new FakeElement("textarea", {
    placeholder: "{ Enter capability in JSON \n                  \n}",
  });
  const capabilityTooltip = new FakeElement("p", {}, [
    new FakeTextNode(
      "Capability-specific configuration options, typically in JSON format.",
    ),
  ]);
  const learnMoreLink = new FakeElement("a", {}, [new FakeTextNode("Learn more")]);
  const addCapabilityButton = new FakeElement("button", {}, [
    new FakeTextNode("Add additional capability"),
  ]);
  const addAnotherAppButton = new FakeElement("button", {}, [
    new FakeTextNode("Add another app"),
  ]);
  const jsonPreviewLabel = new FakeElement("span", {}, [new FakeTextNode("JSON preview")]);
  const jsonPreviewCopy = new FakeElement("div", {
    "aria-label": "Copy {\"ip\": [\"*\"]}\n to your clip board.",
  }, [new FakeTextNode("{\"ip\": [\"*\"]}")]);
  const saveGrantButton = new FakeElement("button", {}, [new FakeTextNode("Save grant")]);
  const cancelButton = new FakeElement("button", {}, [new FakeTextNode("Cancel")]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    backLink,
    pageTitle,
    sourcesLabel,
    sourceInput,
    sourceToggleButton,
    destinationsLabel,
    destinationInput,
    destinationToggleButton,
    portProtocolLabel,
    defaultPorts,
    removePortsButton,
    portsToggleButton,
    commentLabel,
    commentInput,
    advancedOptionsButton,
    devicePostureLabel,
    devicePostureInput,
    devicePostureToggleButton,
    devicePostureTooltip,
    viaLabel,
    viaInput,
    viaToggleButton,
    viaTooltip,
    appLabel,
    appInput,
    appToggleButton,
    appTooltip,
    capabilityLabel,
    capabilityInput,
    capabilityTooltip,
    learnMoreLink,
    addCapabilityButton,
    addAnotherAppButton,
    jsonPreviewLabel,
    jsonPreviewCopy,
    saveGrantButton,
    cancelButton,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      backLink,
      pageTitle,
      sourcesLabel,
      sourceInput,
      sourceToggleButton,
      destinationsLabel,
      destinationInput,
      destinationToggleButton,
      portProtocolLabel,
      defaultPorts,
      removePortsButton,
      portsToggleButton,
      commentLabel,
      commentInput,
      advancedOptionsButton,
      devicePostureLabel,
      devicePostureInput,
      devicePostureToggleButton,
      devicePostureTooltip,
      viaLabel,
      viaInput,
      viaToggleButton,
      viaTooltip,
      appLabel,
      appInput,
      appToggleButton,
      appTooltip,
      capabilityLabel,
      capabilityInput,
      capabilityTooltip,
      learnMoreLink,
      addCapabilityButton,
      addAnotherAppButton,
      jsonPreviewLabel,
      jsonPreviewCopy,
      saveGrantButton,
      cancelButton,
    },
  };
}

function createAccessControlsSshBody({ FakeElement, FakeTextNode }) {
  const body = createAccessControlsBody({ FakeElement, FakeTextNode });
  const searchInput = new FakeElement("input", {
    type: "text",
    placeholder: "Search by user, group, device, action...etc.",
  });
  const asUserLabel = new FakeElement("span", {}, [new FakeTextNode("as user")]);
  const checkModeLabel = new FakeElement("span", {}, [new FakeTextNode("with check mode")]);
  const actionHeader = new FakeElement("th", {}, [new FakeTextNode("SSH action menu")]);
  body.body.appendChild(searchInput);
  body.body.appendChild(asUserLabel);
  body.body.appendChild(checkModeLabel);
  body.body.appendChild(actionHeader);
  return {
    body: body.body,
    references: {
      ...body.references,
      searchInput,
      asUserLabel,
      checkModeLabel,
      actionHeader,
    },
  };
}

function createAccessControlsTestsBody({ FakeElement, FakeTextNode }) {
  const body = createAccessControlsBody({ FakeElement, FakeTextNode });
  const generalTestsHeading = new FakeElement("h3", {}, [new FakeTextNode("General tests")]);
  const addTestButton = new FakeElement("button", {}, [new FakeTextNode("Add test")]);
  const emptyTestsState1 = new FakeElement("p", {}, [
    new FakeTextNode("You have not yet defined any tests."),
  ]);
  const sshTestsHeading = new FakeElement("h3", {}, [new FakeTextNode("SSH tests")]);
  const addSshTestButton = new FakeElement("button", {}, [new FakeTextNode("Add SSH test")]);
  const emptyTestsState2 = new FakeElement("p", {}, [
    new FakeTextNode("You have not yet defined any tests."),
  ]);
  const sshTestsActionMenu = new FakeElement("th", {}, [
    new FakeTextNode("SSH tests action menu"),
  ]);
  body.body.appendChild(generalTestsHeading);
  body.body.appendChild(addTestButton);
  body.body.appendChild(emptyTestsState1);
  body.body.appendChild(sshTestsHeading);
  body.body.appendChild(addSshTestButton);
  body.body.appendChild(emptyTestsState2);
  body.body.appendChild(sshTestsActionMenu);
  return {
    body: body.body,
    references: {
      ...body.references,
      generalTestsHeading,
      addTestButton,
      emptyTestsState1,
      sshTestsHeading,
      addSshTestButton,
      emptyTestsState2,
      sshTestsActionMenu,
    },
  };
}

function createAccessControlsGroupsBody({ FakeElement, FakeTextNode }) {
  const body = createAccessControlsBody({ FakeElement, FakeTextNode });
  const userDefinedGroupsHeading = new FakeElement("h2", {}, [
    new FakeTextNode("User-defined groups"),
  ]);
  const createGroupButton = new FakeElement("button", {}, [new FakeTextNode("Create group")]);
  const autogroupsHeading = new FakeElement("h2", {}, [new FakeTextNode("Autogroups")]);
  const autogroupsActionMenu = new FakeElement("th", {}, [
    new FakeTextNode("Autogroups action menu"),
  ]);
  body.body.appendChild(userDefinedGroupsHeading);
  body.body.appendChild(createGroupButton);
  body.body.appendChild(autogroupsHeading);
  body.body.appendChild(autogroupsActionMenu);
  return {
    body: body.body,
    references: {
      ...body.references,
      userDefinedGroupsHeading,
      createGroupButton,
      autogroupsHeading,
      autogroupsActionMenu,
    },
  };
}

function createAccessControlsIpSetsBody({ FakeElement, FakeTextNode }) {
  const body = createAccessControlsBody({ FakeElement, FakeTextNode });
  const searchInput = new FakeElement("input", {
    type: "text",
    placeholder: "Search by name, CIDR, IP address, host, or IP set.",
  });
  const createIpSetButton = new FakeElement("button", {}, [new FakeTextNode("Create IP set")]);
  const targetsLabel = new FakeElement("span", {}, [new FakeTextNode("Targets")]);
  const actionHeader = new FakeElement("th", {}, [new FakeTextNode("IP sets action menu")]);
  body.body.appendChild(searchInput);
  body.body.appendChild(createIpSetButton);
  body.body.appendChild(targetsLabel);
  body.body.appendChild(actionHeader);
  return {
    body: body.body,
    references: {
      ...body.references,
      searchInput,
      createIpSetButton,
      targetsLabel,
      actionHeader,
    },
  };
}

function createAccessControlsAutoApproversBody({ FakeElement, FakeTextNode }) {
  const body = createAccessControlsBody({ FakeElement, FakeTextNode });
  const routesHeading = new FakeElement("h3", {}, [new FakeTextNode("Routes")]);
  const addRouteButton = new FakeElement("button", {}, [new FakeTextNode("Add route")]);
  const emptyRoutesState = new FakeElement("p", {}, [
    new FakeTextNode("No auto approvers for routes found."),
  ]);
  const defineServiceButton = new FakeElement("button", {}, [
    new FakeTextNode("Define Service"),
  ]);
  const emptyServicesState = new FakeElement("p", {}, [
    new FakeTextNode("No auto approvers for services found."),
  ]);
  const exitNodesHeading = new FakeElement("h3", {}, [new FakeTextNode("Exit nodes")]);
  const emptyExitNodesState = new FakeElement("p", {}, [
    new FakeTextNode("You have not added any exit nodes."),
  ]);
  const exitNodesActionMenu = new FakeElement("th", {}, [
    new FakeTextNode("Exit node auto approvers action menu"),
  ]);
  body.body.appendChild(routesHeading);
  body.body.appendChild(addRouteButton);
  body.body.appendChild(emptyRoutesState);
  body.body.appendChild(defineServiceButton);
  body.body.appendChild(emptyServicesState);
  body.body.appendChild(exitNodesHeading);
  body.body.appendChild(emptyExitNodesState);
  body.body.appendChild(exitNodesActionMenu);
  return {
    body: body.body,
    references: {
      ...body.references,
      routesHeading,
      addRouteButton,
      emptyRoutesState,
      defineServiceButton,
      emptyServicesState,
      exitNodesHeading,
      emptyExitNodesState,
      exitNodesActionMenu,
    },
  };
}

function createAccessControlsFileBody({ FakeElement, FakeTextNode }) {
  const body = createAccessControlsBody({ FakeElement, FakeTextNode });
  const editFileTabLabel = new FakeElement("span", {}, [
    new FakeTextNode("Edit"),
    new FakeTextNode(" file"),
  ]);
  const editFileTab = new FakeElement("button", {}, [editFileTabLabel]);
  const previewChangesTab = new FakeElement("button", {}, [
    new FakeTextNode("Preview changes"),
  ]);
  const previewRulesTab = new FakeElement("button", {}, [
    new FakeTextNode("Preview rules"),
  ]);
  const docsHeading = new FakeElement("h3", {}, [new FakeTextNode("Docs")]);
  const syntaxReferenceLink = new FakeElement("a", {}, [
    new FakeTextNode("Syntax reference"),
  ]);
  const tagsReferenceLink = new FakeElement("a", {}, [new FakeTextNode("Tags reference")]);
  const sshReferenceLink = new FakeElement("a", {}, [new FakeTextNode("SSH reference")]);
  const funnelReferenceLink = new FakeElement("a", {}, [
    new FakeTextNode("Funnel reference"),
  ]);
  const testsReferenceLink = new FakeElement("a", {}, [new FakeTextNode("Tests reference")]);
  const examplesLink = new FakeElement("a", {}, [new FakeTextNode("Examples")]);
  const disableSshButton = new FakeElement("button", {}, [
    new FakeTextNode("Disable Tailscale SSH…"),
  ]);
  const convertAclsHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Convert ACLs to grants"),
  ]);
  const convertToGrantsButton = new FakeElement("button", {}, [
    new FakeTextNode("Convert to grants..."),
  ]);
  const discardChangesButton = new FakeElement("button", {}, [
    new FakeTextNode("Discard changes"),
  ]);
  body.body.appendChild(editFileTab);
  body.body.appendChild(previewChangesTab);
  body.body.appendChild(previewRulesTab);
  body.body.appendChild(docsHeading);
  body.body.appendChild(syntaxReferenceLink);
  body.body.appendChild(tagsReferenceLink);
  body.body.appendChild(sshReferenceLink);
  body.body.appendChild(funnelReferenceLink);
  body.body.appendChild(testsReferenceLink);
  body.body.appendChild(examplesLink);
  body.body.appendChild(disableSshButton);
  body.body.appendChild(convertAclsHeading);
  body.body.appendChild(convertToGrantsButton);
  body.body.appendChild(discardChangesButton);
  return {
    body: body.body,
    references: {
      ...body.references,
      editFileTab,
      previewChangesTab,
      previewRulesTab,
      docsHeading,
      syntaxReferenceLink,
      tagsReferenceLink,
      sshReferenceLink,
      funnelReferenceLink,
      testsReferenceLink,
      examplesLink,
      disableSshButton,
      convertAclsHeading,
      convertToGrantsButton,
      discardChangesButton,
    },
  };
}

function createAccessControlsDiffBody({ FakeElement, FakeTextNode }) {
  return createAccessControlsFileBody({ FakeElement, FakeTextNode });
}

function createAccessControlsPreviewBody({ FakeElement, FakeTextNode }) {
  const body = createAccessControlsFileBody({ FakeElement, FakeTextNode });
  const previewRulesHeading = new FakeElement("h2", {}, [new FakeTextNode("Preview Rules")]);
  const previewRulesDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Preview which hosts and ports a user’s machines are allowed to access.",
    ),
  ]);
  const selectUserButton = new FakeElement("button", {}, [
    new FakeTextNode("Select a user or tag"),
  ]);
  body.body.appendChild(previewRulesHeading);
  body.body.appendChild(previewRulesDescription);
  body.body.appendChild(selectUserButton);
  return {
    body: body.body,
    references: {
      ...body.references,
      previewRulesHeading,
      previewRulesDescription,
      selectUserButton,
    },
  };
}

function createLogsBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Logs")]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode("Configure and explore logs and events within your tailnet."),
  ]);
  const configurationLogsTab = new FakeElement("button", {}, [
    new FakeTextNode("Configuration logs"),
  ]);
  const networkFlowLogsTab = new FakeElement("button", {}, [
    new FakeTextNode("Network flow logs"),
  ]);
  const configurationDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Inspect logs of changes made to your tailnet’s configuration settings during the last 90 days.",
    ),
  ]);
  const notStreamingStatus = new FakeElement("span", {}, [
    new FakeTextNode("Not streaming"),
  ]);
  const startStreamingButton = new FakeElement("button", {}, [
    new FakeTextNode("Start streaming…"),
  ]);
  const timeframeButton = new FakeElement("button", {}, [
    new FakeTextNode("Timeframe:"),
    new FakeTextNode(" 2026/04/12 – 2026/04/13"),
  ]);
  const actionFilterButton = new FakeElement("button", {}, [new FakeTextNode("Action")]);
  const actorFilterButton = new FakeElement("button", {}, [new FakeTextNode("Actor")]);
  const targetFilterButton = new FakeElement("button", {}, [new FakeTextNode("Target")]);
  const timestampHeader = new FakeElement("th", {}, [
    new FakeTextNode("Timestamp (Local Time)"),
  ]);
  const actionHeader = new FakeElement("th", {}, [new FakeTextNode("ACTION")]);
  const actorHeader = new FakeElement("th", {}, [new FakeTextNode("ACTOR")]);
  const targetHeader = new FakeElement("th", {}, [new FakeTextNode("TARGET")]);
  const loginEvent = new FakeElement("td", {}, [new FakeTextNode("Log in to admin console")]);
  const adminConsoleTarget = new FakeElement("td", {}, [new FakeTextNode("Admin console")]);
  const exportButton = new FakeElement("button", {
    "aria-label": "Export logs data",
    title: "Export logs data",
  }, [new FakeTextNode("Export logs")]);
  const searchActionsInput = new FakeElement("input", {
    type: "text",
    "aria-label": "Search actions...",
    placeholder: "Search actions...",
  });
  const applyButton = new FakeElement("button", {}, [new FakeTextNode("Apply")]);
  const enableKeyExpiryEvent = new FakeElement("td", {}, [
    new FakeTextNode("Enable key expiry for node"),
  ]);
  const disableKeyExpiryEvent = new FakeElement("td", {}, [
    new FakeTextNode("Disable key expiry for node"),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    pageTitle,
    pageDescription,
    configurationLogsTab,
    networkFlowLogsTab,
    configurationDescription,
    notStreamingStatus,
    startStreamingButton,
    timeframeButton,
    actionFilterButton,
    actorFilterButton,
    targetFilterButton,
    timestampHeader,
    actionHeader,
    actorHeader,
    targetHeader,
    loginEvent,
    adminConsoleTarget,
    exportButton,
    searchActionsInput,
    applyButton,
    enableKeyExpiryEvent,
    disableKeyExpiryEvent,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      pageTitle,
      pageDescription,
      configurationLogsTab,
      networkFlowLogsTab,
      configurationDescription,
      notStreamingStatus,
      startStreamingButton,
      timeframeButton,
      actionFilterButton,
      actorFilterButton,
      targetFilterButton,
      timestampHeader,
      actionHeader,
      actorHeader,
      targetHeader,
      loginEvent,
      adminConsoleTarget,
      exportButton,
      searchActionsInput,
      applyButton,
      enableKeyExpiryEvent,
      disableKeyExpiryEvent,
    },
  };
}

function createLogsNetworkBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Logs")]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode("Configure and explore logs and events within your tailnet."),
  ]);
  const configurationLogsTab = new FakeElement("button", {}, [
    new FakeTextNode("Configuration logs"),
  ]);
  const networkFlowLogsTab = new FakeElement("button", {}, [
    new FakeTextNode("Network flow logs"),
  ]);
  const networkDescription = new FakeElement("p", {}, [
    new FakeTextNode("Logs of network activity between devices in your tailnet."),
  ]);
  const notLoggingStatus = new FakeElement("span", {}, [new FakeTextNode("Not logging")]);
  const startLoggingButton = new FakeElement("button", {}, [
    new FakeTextNode("Start logging…"),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    pageTitle,
    pageDescription,
    configurationLogsTab,
    networkFlowLogsTab,
    networkDescription,
    notLoggingStatus,
    startLoggingButton,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      pageTitle,
      pageDescription,
      configurationLogsTab,
      networkFlowLogsTab,
      networkDescription,
      notLoggingStatus,
      startLoggingButton,
    },
  };
}

function createDnsBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("DNS")]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode("Manage DNS and nameservers of your network."),
  ]);
  const tailnetDnsNameHeading = new FakeElement("h2", {}, [
    new FakeTextNode("Tailnet DNS name"),
  ]);
  const tailnetDnsNameDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "This unique name is used when registering DNS entries, sharing your device to other tailnets, and issuing TLS certificates.",
    ),
  ]);
  const copyTailnetNameButton = new FakeElement("button", {
    "aria-label": "Copy tailf14c18.ts.net to your clip board.",
  });
  const renameTailnetButton = new FakeElement("button", {}, [
    new FakeTextNode("Rename tailnet..."),
  ]);
  const appsSectionHeading = new FakeElement("h2", {}, [new FakeTextNode("Apps")]);
  const manageInAppsLink = new FakeElement("a", {}, [new FakeTextNode("Manage in Apps")]);
  const nameserversHeading = new FakeElement("h2", {}, [new FakeTextNode("Nameservers")]);
  const globalNameserversHeading = new FakeElement("h4", {}, [
    new FakeTextNode("Global nameservers"),
  ]);
  const overrideDnsServersLabel = new FakeElement("span", {}, [
    new FakeTextNode("Override DNS servers"),
  ]);
  const localDnsSettingsLabel = new FakeElement("span", {}, [
    new FakeTextNode("Local DNS settings"),
  ]);
  const addNameserverButton = new FakeElement("button", {}, [
    new FakeTextNode("Add nameserver"),
  ]);
  const renameDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Rename tailf14c18.ts.net"),
  ]);
  const renameWarning1 = new FakeElement("p", {}, [
    new FakeTextNode(
      "Renaming your tailnet may break existing links to devices in your tailnet.",
    ),
  ]);
  const renameWarning2 = new FakeElement("p", {}, [
    new FakeTextNode(
      "You will need to reissue HTTPS certificates using the new tailnet name. The name of any machine for which you obtain a HTTPS certificate, including the new tailnet name, will be published in a public ledger from which it cannot be removed.",
    ),
  ]);
  const renameConfirmButton = new FakeElement("button", {}, [
    new FakeTextNode("I understand, let me rename the tailnet"),
  ]);
  const googleDnsMenuItem = new FakeElement("button", {}, [
    new FakeTextNode("Google Public DNS 8.8.8.8"),
  ]);
  const cloudflareDnsMenuItem = new FakeElement("button", {}, [
    new FakeTextNode("Cloudflare Public DNS 1.1.1.1"),
  ]);
  const quad9DnsMenuItem = new FakeElement("button", {}, [
    new FakeTextNode("Quad9 Public DNS 9.9.9.9"),
  ]);
  const mullvadDnsMenuItem = new FakeElement("button", {}, [
    new FakeTextNode("Mullvad Public DNS 194.242.2.2"),
  ]);
  const nextDnsMenuItem = new FakeElement("button", {}, [new FakeTextNode("NextDNS DoH")]);
  const controlDMenuItem = new FakeElement("button", {}, [new FakeTextNode("Control D DoH")]);
  const customDnsMenuItem = new FakeElement("button", {}, [new FakeTextNode("Custom…")]);
  const searchDomainsHeading = new FakeElement("h2", {}, [
    new FakeTextNode("Search Domains"),
  ]);
  const addSearchDomainButton = new FakeElement("button", {}, [
    new FakeTextNode("Add search domain..."),
  ]);
  const addSearchDomainDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Add search domain"),
  ]);
  const addSearchDomainDialogHelp = new FakeElement("p", {}, [
    new FakeTextNode(
      "The search domain can only contain alphanumeric lowercase characters, hyphens, and periods.",
    ),
  ]);
  const addSearchDomainDialogButton = new FakeElement("button", {}, [
    new FakeTextNode("Add search domain"),
  ]);
  const magicDnsHeading = new FakeElement("h2", {}, [new FakeTextNode("MagicDNS")]);
  const disableMagicDnsButton = new FakeElement("button", {}, [
    new FakeTextNode("Disable MagicDNS…"),
  ]);
  const disableMagicDnsDialogTitle = new FakeElement("h2", {}, [
    new FakeTextNode("Disable MagicDNS?"),
  ]);
  const disableMagicDnsDialogDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Users of your network will no longer be able to use short names to access devices over Tailscale.",
    ),
  ]);
  const disableMagicDnsDialogButton = new FakeElement("button", {}, [
    new FakeTextNode("Disable MagicDNS"),
  ]);
  const httpsCertificatesHeading = new FakeElement("h2", {}, [
    new FakeTextNode("HTTPS Certificates"),
  ]);
  const enableHttpsButton = new FakeElement("button", {}, [
    new FakeTextNode("Enable HTTPS..."),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    pageTitle,
    pageDescription,
    tailnetDnsNameHeading,
    tailnetDnsNameDescription,
    copyTailnetNameButton,
    renameTailnetButton,
    appsSectionHeading,
    manageInAppsLink,
    nameserversHeading,
    globalNameserversHeading,
    overrideDnsServersLabel,
    localDnsSettingsLabel,
    addNameserverButton,
    renameDialogTitle,
    renameWarning1,
    renameWarning2,
    renameConfirmButton,
    googleDnsMenuItem,
    cloudflareDnsMenuItem,
    quad9DnsMenuItem,
    mullvadDnsMenuItem,
    nextDnsMenuItem,
    controlDMenuItem,
    customDnsMenuItem,
    searchDomainsHeading,
    addSearchDomainButton,
    addSearchDomainDialogTitle,
    addSearchDomainDialogHelp,
    addSearchDomainDialogButton,
    magicDnsHeading,
    disableMagicDnsButton,
    disableMagicDnsDialogTitle,
    disableMagicDnsDialogDescription,
    disableMagicDnsDialogButton,
    httpsCertificatesHeading,
    enableHttpsButton,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      pageTitle,
      pageDescription,
      tailnetDnsNameHeading,
      tailnetDnsNameDescription,
      copyTailnetNameButton,
      renameTailnetButton,
      appsSectionHeading,
      manageInAppsLink,
      nameserversHeading,
      globalNameserversHeading,
      overrideDnsServersLabel,
      localDnsSettingsLabel,
      addNameserverButton,
      renameDialogTitle,
      renameWarning1,
      renameWarning2,
      renameConfirmButton,
      googleDnsMenuItem,
      cloudflareDnsMenuItem,
      quad9DnsMenuItem,
      mullvadDnsMenuItem,
      nextDnsMenuItem,
      controlDMenuItem,
      customDnsMenuItem,
      searchDomainsHeading,
      addSearchDomainButton,
      addSearchDomainDialogTitle,
      addSearchDomainDialogHelp,
      addSearchDomainDialogButton,
      magicDnsHeading,
      disableMagicDnsButton,
      disableMagicDnsDialogTitle,
      disableMagicDnsDialogDescription,
      disableMagicDnsDialogButton,
      httpsCertificatesHeading,
      enableHttpsButton,
    },
  };
}

function createSettingsGeneralBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const tailnetSettingsHeading = new FakeElement("h2", {}, [
    new FakeTextNode("Tailnet Settings"),
  ]);
  const generalNavLink = new FakeElement("a", {}, [new FakeTextNode("General")]);
  const userManagementLink = new FakeElement("a", {}, [
    new FakeTextNode("User management"),
  ]);
  const deviceManagementLink = new FakeElement("a", {}, [
    new FakeTextNode("Device management"),
  ]);
  const policyFileManagementLink = new FakeElement("a", {}, [
    new FakeTextNode("Policy file management"),
  ]);
  const trustCredentialsLink = new FakeElement("a", {}, [
    new FakeTextNode("Trust credentials"),
  ]);
  const contactPreferencesLink = new FakeElement("a", {}, [
    new FakeTextNode("Contact preferences"),
  ]);
  const billingLink = new FakeElement("a", {}, [new FakeTextNode("Billing")]);
  const personalSettingsHeading = new FakeElement("h2", {}, [
    new FakeTextNode("Personal Settings"),
  ]);
  const keysLink = new FakeElement("a", {}, [new FakeTextNode("Keys")]);
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("General")]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode("Manage your tailnet account settings."),
  ]);
  const uniqueIdsHeading = new FakeElement("h3", {}, [new FakeTextNode("Unique IDs")]);
  const tailnetIdHeading = new FakeElement("h5", {}, [new FakeTextNode("Tailnet ID")]);
  const tailnetIdDescription = new FakeElement("p", {}, [
    new FakeTextNode("A unique ID to identify this tailnet in API calls."),
  ]);
  const displayHeading = new FakeElement("h3", {}, [new FakeTextNode("Display")]);
  const displayDescription = new FakeElement("p", {}, [
    new FakeTextNode("Set a display name to easily recognize this tailnet."),
  ]);
  const regionalRoutingHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Regional Routing Premium"),
  ]);
  const httpsHeading = new FakeElement("h3", {}, [new FakeTextNode("HTTPS")]);
  const manageDnsLink = new FakeElement("a", {}, [new FakeTextNode("Manage")]);
  const featurePreviewsHeading = new FakeElement("h2", {}, [
    new FakeTextNode("Feature previews"),
  ]);
  const shareFeedbackLink = new FakeElement("a", {}, [new FakeTextNode("share feedback")]);
  const sendFilesHeading = new FakeElement("h3", {}, [new FakeTextNode("Send Files")]);
  const servicesCollectionHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Services Collection"),
  ]);
  const redesignedMacUiHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Redesigned MacOS Client UI"),
  ]);
  const deleteTailnetHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Delete tailnet"),
  ]);
  const deleteTailnetButton = new FakeElement("button", {}, [
    new FakeTextNode("Delete tailnet…"),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    tailnetSettingsHeading,
    generalNavLink,
    userManagementLink,
    deviceManagementLink,
    policyFileManagementLink,
    trustCredentialsLink,
    contactPreferencesLink,
    billingLink,
    personalSettingsHeading,
    keysLink,
    pageTitle,
    pageDescription,
    uniqueIdsHeading,
    tailnetIdHeading,
    tailnetIdDescription,
    displayHeading,
    displayDescription,
    regionalRoutingHeading,
    httpsHeading,
    manageDnsLink,
    featurePreviewsHeading,
    shareFeedbackLink,
    sendFilesHeading,
    servicesCollectionHeading,
    redesignedMacUiHeading,
    deleteTailnetHeading,
    deleteTailnetButton,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      tailnetSettingsHeading,
      generalNavLink,
      userManagementLink,
      deviceManagementLink,
      policyFileManagementLink,
      trustCredentialsLink,
      contactPreferencesLink,
      billingLink,
      personalSettingsHeading,
      keysLink,
      pageTitle,
      pageDescription,
      uniqueIdsHeading,
      tailnetIdHeading,
      tailnetIdDescription,
      displayHeading,
      displayDescription,
      regionalRoutingHeading,
      httpsHeading,
      manageDnsLink,
      featurePreviewsHeading,
      shareFeedbackLink,
      sendFilesHeading,
      servicesCollectionHeading,
      redesignedMacUiHeading,
      deleteTailnetHeading,
      deleteTailnetButton,
    },
  };
}

function createSettingsUserManagementBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const tailnetSettingsHeading = new FakeElement("h2", {}, [
    new FakeTextNode("Tailnet Settings"),
  ]);
  const generalNavLink = new FakeElement("a", {}, [new FakeTextNode("General")]);
  const userManagementLink = new FakeElement("a", {}, [
    new FakeTextNode("User management"),
  ]);
  const deviceManagementLink = new FakeElement("a", {}, [
    new FakeTextNode("Device management"),
  ]);
  const policyFileManagementLink = new FakeElement("a", {}, [
    new FakeTextNode("Policy file management"),
  ]);
  const trustCredentialsLink = new FakeElement("a", {}, [
    new FakeTextNode("Trust credentials"),
  ]);
  const webhooksLink = new FakeElement("a", {}, [new FakeTextNode("Webhooks")]);
  const contactPreferencesLink = new FakeElement("a", {}, [
    new FakeTextNode("Contact preferences"),
  ]);
  const billingLink = new FakeElement("a", {}, [new FakeTextNode("Billing")]);
  const personalSettingsHeading = new FakeElement("h2", {}, [
    new FakeTextNode("Personal Settings"),
  ]);
  const keysLink = new FakeElement("a", {}, [new FakeTextNode("Keys")]);
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("User management")]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode("Manage your tailnet user settings."),
  ]);
  const identityProviderHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Identity Provider"),
  ]);
  const userApprovalHeading = new FakeElement("h3", {}, [new FakeTextNode("User Approval")]);
  const userApprovalDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Require new users to be approved by admins before they can access the network.",
    ),
  ]);
  const approvalCheckbox = new FakeElement("label", {}, [
    new FakeTextNode("Manually approve new users"),
  ]);
  const sessionTimeoutHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Admin Console Session Timeout"),
  ]);
  const sessionTimeoutDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Users with access to the Admin console will be logged out after this time period of inactivity.",
    ),
  ]);
  const editButton = new FakeElement("button", {}, [new FakeTextNode("Edit")]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    tailnetSettingsHeading,
    generalNavLink,
    userManagementLink,
    deviceManagementLink,
    policyFileManagementLink,
    trustCredentialsLink,
    webhooksLink,
    contactPreferencesLink,
    billingLink,
    personalSettingsHeading,
    keysLink,
    pageTitle,
    pageDescription,
    identityProviderHeading,
    userApprovalHeading,
    userApprovalDescription,
    approvalCheckbox,
    sessionTimeoutHeading,
    sessionTimeoutDescription,
    editButton,
  ]);
  return {
    body,
    references: {
      ...shell.references,
      tailnetSettingsHeading,
      generalNavLink,
      userManagementLink,
      deviceManagementLink,
      policyFileManagementLink,
      trustCredentialsLink,
      webhooksLink,
      contactPreferencesLink,
      billingLink,
      personalSettingsHeading,
      keysLink,
      pageTitle,
      pageDescription,
      identityProviderHeading,
      userApprovalHeading,
      userApprovalDescription,
      approvalCheckbox,
      sessionTimeoutHeading,
      sessionTimeoutDescription,
      editButton,
    },
  };
}

function createSettingsPageBase({
  FakeElement,
  FakeTextNode,
  pageTitleText,
  pageDescriptionText,
}) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const tailnetSettingsHeading = new FakeElement("h2", {}, [
    new FakeTextNode("Tailnet Settings"),
  ]);
  const generalNavLink = new FakeElement("a", {}, [new FakeTextNode("General")]);
  const userManagementLink = new FakeElement("a", {}, [
    new FakeTextNode("User management"),
  ]);
  const deviceManagementLink = new FakeElement("a", {}, [
    new FakeTextNode("Device management"),
  ]);
  const policyFileManagementLink = new FakeElement("a", {}, [
    new FakeTextNode("Policy file management"),
  ]);
  const trustCredentialsLink = new FakeElement("a", {}, [
    new FakeTextNode("Trust credentials"),
  ]);
  const webhooksLink = new FakeElement("a", {}, [new FakeTextNode("Webhooks")]);
  const contactPreferencesLink = new FakeElement("a", {}, [
    new FakeTextNode("Contact preferences"),
  ]);
  const billingLink = new FakeElement("a", {}, [new FakeTextNode("Billing")]);
  const personalSettingsHeading = new FakeElement("h2", {}, [
    new FakeTextNode("Personal Settings"),
  ]);
  const keysLink = new FakeElement("a", {}, [new FakeTextNode("Keys")]);
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode(pageTitleText)]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode(pageDescriptionText),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    tailnetSettingsHeading,
    generalNavLink,
    userManagementLink,
    deviceManagementLink,
    policyFileManagementLink,
    trustCredentialsLink,
    webhooksLink,
    contactPreferencesLink,
    billingLink,
    personalSettingsHeading,
    keysLink,
    pageTitle,
    pageDescription,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      tailnetSettingsHeading,
      generalNavLink,
      userManagementLink,
      deviceManagementLink,
      policyFileManagementLink,
      trustCredentialsLink,
      webhooksLink,
      contactPreferencesLink,
      billingLink,
      personalSettingsHeading,
      keysLink,
      pageTitle,
      pageDescription,
    },
  };
}

function createSettingsDeviceManagementBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Device management",
    pageDescriptionText: "Manage your tailnet device settings.",
  });
  const deviceApprovalHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Device Approval"),
  ]);
  const deviceApprovalDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Require new devices to be approved by admins before they can access the network.",
    ),
  ]);
  const approvalCheckbox = new FakeElement("label", {}, [
    new FakeTextNode("Manually approve new devices"),
  ]);
  const tailnetLockHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Tailnet Lock"),
  ]);
  const enableTailnetLockButton = new FakeElement("button", {}, [
    new FakeTextNode("Enable tailnet lock…"),
  ]);
  const keyExpiryHeading = new FakeElement("h3", {}, [new FakeTextNode("Key Expiry")]);
  const keyExpiryDescription = new FakeElement("p", {}, [
    new FakeTextNode("Set the number of days a device can stay logged in\n    to Tailscale before it needs to re-authenticate with Google."),
  ]);
  const resetButton = new FakeElement("button", {}, [new FakeTextNode("Reset")]);
  const autoUpdateHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Auto-update Tailscale"),
  ]);
  const autoUpdateCheckbox = new FakeElement("label", {}, [
    new FakeTextNode("Auto-update new devices"),
  ]);
  const devicePostureIntegrationsHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Device Posture Integrations Standard"),
  ]);
  const addIntegrationButton = new FakeElement("button", {}, [
    new FakeTextNode("Add an integration..."),
  ]);
  const manageInAccessControlsLink = new FakeElement("a", {}, [
    new FakeTextNode("Manage in Access Controls"),
  ]);
  const postureConditionsDescription = new FakeElement("span", {}, [
    new FakeTextNode("Use "),
    new FakeElement("code", {}, [new FakeTextNode("srcPosture")]),
    new FakeTextNode(" in your ACL rules to restrict access from devices with non-compliant posture."),
  ]);
  base.body.appendChild(deviceApprovalHeading);
  base.body.appendChild(deviceApprovalDescription);
  base.body.appendChild(approvalCheckbox);
  base.body.appendChild(tailnetLockHeading);
  base.body.appendChild(enableTailnetLockButton);
  base.body.appendChild(keyExpiryHeading);
  base.body.appendChild(keyExpiryDescription);
  base.body.appendChild(resetButton);
  base.body.appendChild(autoUpdateHeading);
  base.body.appendChild(autoUpdateCheckbox);
  base.body.appendChild(devicePostureIntegrationsHeading);
  base.body.appendChild(addIntegrationButton);
  base.body.appendChild(manageInAccessControlsLink);
  base.body.appendChild(postureConditionsDescription);
  return {
    body: base.body,
    references: {
      ...base.references,
      deviceApprovalHeading,
      deviceApprovalDescription,
      approvalCheckbox,
      tailnetLockHeading,
      enableTailnetLockButton,
      keyExpiryHeading,
      keyExpiryDescription,
      resetButton,
      autoUpdateHeading,
      autoUpdateCheckbox,
      devicePostureIntegrationsHeading,
      addIntegrationButton,
      manageInAccessControlsLink,
      postureConditionsDescription,
    },
  };
}

function createSettingsDeviceManagementPostureBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Add a device posture integration",
    pageDescriptionText:
      "Device posture integrations synchronize data from third-party systems, which can be used as device attributes in your policy file.",
  });
  const backLink = new FakeElement("a", {}, [
    new FakeTextNode("← Back to device management"),
  ]);
  const planBadge = new FakeElement("span", {}, [new FakeTextNode("Standard")]);
  const learnMoreLink = new FakeElement("a", {}, [new FakeTextNode("Learn more")]);
  const crowdStrikeOption = new FakeElement("label", {}, [
    new FakeTextNode("CrowdStrike Falcon"),
  ]);
  const fleetOption = new FakeElement("label", {}, [new FakeTextNode("Fleet")]);
  const huntressOption = new FakeElement("label", {}, [new FakeTextNode("Huntress")]);
  const intuneOption = new FakeElement("label", {}, [
    new FakeTextNode("Microsoft Intune"),
  ]);
  const jamfOption = new FakeElement("label", {}, [new FakeTextNode("Jamf Pro")]);
  const kandjiOption = new FakeElement("label", {}, [new FakeTextNode("Kandji")]);
  const kolideOption = new FakeElement("label", {}, [
    new FakeTextNode("1Password XAM (Kolide)"),
  ]);
  const sentinelOneOption = new FakeElement("label", {}, [
    new FakeTextNode("SentinelOne"),
  ]);
  const continueButton = new FakeElement("button", {}, [new FakeTextNode("Continue")]);

  base.body.appendChild(backLink);
  base.body.appendChild(planBadge);
  base.body.appendChild(learnMoreLink);
  base.body.appendChild(crowdStrikeOption);
  base.body.appendChild(fleetOption);
  base.body.appendChild(huntressOption);
  base.body.appendChild(intuneOption);
  base.body.appendChild(jamfOption);
  base.body.appendChild(kandjiOption);
  base.body.appendChild(kolideOption);
  base.body.appendChild(sentinelOneOption);
  base.body.appendChild(continueButton);

  return {
    body: base.body,
    references: {
      ...base.references,
      backLink,
      planBadge,
      learnMoreLink,
      crowdStrikeOption,
      fleetOption,
      huntressOption,
      intuneOption,
      jamfOption,
      kandjiOption,
      kolideOption,
      sentinelOneOption,
      continueButton,
    },
  };
}

function createSettingsPolicyFileManagementBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Policy file management",
    pageDescriptionText: "Manage how your policy file is maintained.",
  });
  const lockEditorHeading = new FakeElement("h3", {}, [new FakeTextNode("Lock editor")]);
  const lockEditorDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Prevent users from editing policies in the admin console to avoid conflicts with external management workflows like GitOps or Terraform.",
    ),
  ]);
  const preventEditsCheckbox = new FakeElement("label", {}, [
    new FakeTextNode("Prevent edits in the admin console"),
  ]);
  const externalReferenceHeading = new FakeElement("h3", {}, [
    new FakeTextNode("External reference"),
  ]);
  base.body.appendChild(lockEditorHeading);
  base.body.appendChild(lockEditorDescription);
  base.body.appendChild(preventEditsCheckbox);
  base.body.appendChild(externalReferenceHeading);
  return {
    body: base.body,
    references: {
      ...base.references,
      lockEditorHeading,
      lockEditorDescription,
      preventEditsCheckbox,
      externalReferenceHeading,
    },
  };
}

function createSettingsTrustCredentialsBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Trust credentials",
    pageDescriptionText:
      "Provide fine grained access to the Tailscale API using OAuth or OIDC tokens.",
  });
  const searchInput = new FakeElement("input", {
    type: "text",
    placeholder: "Search by issuer, description, id...",
  });
  const filtersButton = new FakeElement("button", {}, [new FakeTextNode("Filters")]);
  const createCredentialButton = new FakeElement("button", {}, [
    new FakeTextNode("Create a new trust credential"),
  ]);
  const clientIdHeader = new FakeElement("th", {}, [new FakeTextNode("Client ID")]);
  const typeHeader = new FakeElement("th", {}, [new FakeTextNode("Type")]);
  const updatedHeader = new FakeElement("th", {}, [new FakeTextNode("Updated")]);
  const scopesHeader = new FakeElement("th", {}, [new FakeTextNode("Scopes")]);
  const actionHeader = new FakeElement("th", {}, [
    new FakeTextNode("Trust credentials action menu"),
  ]);
  const emptyState = new FakeElement("p", {}, [
    new FakeTextNode("You do not have any trust credentials"),
  ]);
  base.body.appendChild(searchInput);
  base.body.appendChild(filtersButton);
  base.body.appendChild(createCredentialButton);
  base.body.appendChild(clientIdHeader);
  base.body.appendChild(typeHeader);
  base.body.appendChild(updatedHeader);
  base.body.appendChild(scopesHeader);
  base.body.appendChild(actionHeader);
  base.body.appendChild(emptyState);
  return {
    body: base.body,
    references: {
      ...base.references,
      searchInput,
      filtersButton,
      createCredentialButton,
      clientIdHeader,
      typeHeader,
      updatedHeader,
      scopesHeader,
      actionHeader,
      emptyState,
    },
  };
}

function createSettingsWebhooksBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Webhooks",
    pageDescriptionText: "Get notified of changes and misconfigurations in your tailnet.",
  });
  const endpointsHeading = new FakeElement("h3", {}, [new FakeTextNode("Endpoints")]);
  const endpointsDescription = new FakeElement("p", {}, [
    new FakeTextNode("View and manage endpoints."),
  ]);
  const addEndpointButton = new FakeElement("button", {}, [
    new FakeTextNode("Add endpoint..."),
  ]);
  const addEndpointDialogTitle = new FakeElement("h2", {}, [new FakeTextNode("Add endpoint")]);
  const webhookUrlLabel = new FakeElement("label", {}, [new FakeTextNode("Webhook URL")]);
  const webhookUrlDescription = new FakeElement("p", {}, [
    new FakeTextNode("Events selected below will trigger an HTTPS POST request to this URL."),
  ]);
  const destinationLabel = new FakeElement("label", {}, [new FakeTextNode("Destination")]);
  const optionalLabel = new FakeElement("span", {}, [new FakeTextNode("optional")]);
  const destinationDescription = new FakeElement("p", {}, [
    new FakeTextNode("If selected, we’ll send your webhook events in the format expected by your destination."),
  ]);
  const noneOption = new FakeElement("button", {}, [new FakeTextNode("None")]);
  const eventsHeading = new FakeElement("h3", {}, [new FakeTextNode("Events")]);
  const tailnetManagementHeading = new FakeElement("h4", {}, [new FakeTextNode("Tailnet Management")]);
  const nodeCreatedDescription = new FakeElement("p", {}, [new FakeTextNode("Node was created.")]);
  const userRoleUpdatedDescription = new FakeElement("p", {}, [new FakeTextNode("User role changed.")]);
  const deviceMisconfigurationsHeading = new FakeElement("h4", {}, [
    new FakeTextNode("Device Misconfigurations"),
  ]);
  const subnetForwardingDescription = new FakeElement("p", {}, [
    new FakeTextNode("Subnet has IP forwarding disabled."),
  ]);
  const exitNodeForwardingDescription = new FakeElement("p", {}, [
    new FakeTextNode("Exit node has IP forwarding disabled."),
  ]);
  const emptyState = new FakeElement("p", {}, [
    new FakeTextNode("You don’t have any endpoints yet"),
  ]);
  base.body.appendChild(endpointsHeading);
  base.body.appendChild(endpointsDescription);
  base.body.appendChild(addEndpointButton);
  base.body.appendChild(addEndpointDialogTitle);
  base.body.appendChild(webhookUrlLabel);
  base.body.appendChild(webhookUrlDescription);
  base.body.appendChild(destinationLabel);
  base.body.appendChild(optionalLabel);
  base.body.appendChild(destinationDescription);
  base.body.appendChild(noneOption);
  base.body.appendChild(eventsHeading);
  base.body.appendChild(tailnetManagementHeading);
  base.body.appendChild(nodeCreatedDescription);
  base.body.appendChild(userRoleUpdatedDescription);
  base.body.appendChild(deviceMisconfigurationsHeading);
  base.body.appendChild(subnetForwardingDescription);
  base.body.appendChild(exitNodeForwardingDescription);
  base.body.appendChild(emptyState);
  return {
    body: base.body,
    references: {
      ...base.references,
      endpointsHeading,
      endpointsDescription,
      addEndpointButton,
      addEndpointDialogTitle,
      webhookUrlLabel,
      webhookUrlDescription,
      destinationLabel,
      optionalLabel,
      destinationDescription,
      noneOption,
      eventsHeading,
      tailnetManagementHeading,
      nodeCreatedDescription,
      userRoleUpdatedDescription,
      deviceMisconfigurationsHeading,
      subnetForwardingDescription,
      exitNodeForwardingDescription,
      emptyState,
    },
  };
}

function createSettingsContactPreferencesBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Contact preferences",
    pageDescriptionText:
      "Define points of contact for different kinds of transactional emails. We will only use these to send essential communications related to the functioning of your tailnet, not marketing-related content. As such, you can’t opt out, and all emails must be verified.",
  });
  const accountChangesHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Account changes"),
  ]);
  const configurationIssuesHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Configuration issues"),
  ]);
  const securityIssuesHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Security issues"),
  ]);
  const billingEmailHeading = new FakeElement("h3", {}, [
    new FakeTextNode("Billing email"),
  ]);
  const manageInBillingLink = new FakeElement("a", {}, [
    new FakeTextNode("Manage in Billing"),
  ]);
  base.body.appendChild(accountChangesHeading);
  base.body.appendChild(configurationIssuesHeading);
  base.body.appendChild(securityIssuesHeading);
  base.body.appendChild(billingEmailHeading);
  base.body.appendChild(manageInBillingLink);
  return {
    body: base.body,
    references: {
      ...base.references,
      accountChangesHeading,
      configurationIssuesHeading,
      securityIssuesHeading,
      billingEmailHeading,
      manageInBillingLink,
    },
  };
}

function createSettingsBillingBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Billing",
    pageDescriptionText: "View and manage your billing plan.",
  });
  const planName = new FakeElement("h3", {}, [new FakeTextNode("Personal plan")]);
  const contactSalesButton = new FakeElement("button", {}, [
    new FakeTextNode("Contact sales"),
  ]);
  const switchPlanButton = new FakeElement("button", {}, [
    new FakeTextNode("Switch plan"),
  ]);
  const purchaseMullvadButton = new FakeElement("button", {}, [
    new FakeTextNode("Purchase Mullvad VPN"),
  ]);
  const usageTab = new FakeElement("button", {}, [new FakeTextNode("Usage")]);
  const invoicesTab = new FakeElement("button", {}, [new FakeTextNode("Invoices")]);
  const billingDetailsTab = new FakeElement("button", {}, [
    new FakeTextNode("Billing details"),
  ]);
  const seatsLabel = new FakeElement("span", {}, [new FakeTextNode("Seats")]);
  const seatsDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Seats occupied by users who logged into Tailscale. Users that have been added but never logged in don’t count.",
    ),
  ]);
  const learnMoreAboutSeatsLink = new FakeElement("a", {}, [
    new FakeTextNode("Learn more about seats"),
  ]);
  const userDevicesLabel = new FakeElement("span", {}, [new FakeTextNode("User devices")]);
  const userDevicesDescription = new FakeElement("p", {}, [
    new FakeTextNode("Devices owned by users, not tags."),
  ]);
  const unlimitedLabel = new FakeElement("span", {}, [new FakeTextNode("Unlimited")]);
  base.body.appendChild(planName);
  base.body.appendChild(contactSalesButton);
  base.body.appendChild(switchPlanButton);
  base.body.appendChild(purchaseMullvadButton);
  base.body.appendChild(usageTab);
  base.body.appendChild(invoicesTab);
  base.body.appendChild(billingDetailsTab);
  base.body.appendChild(seatsLabel);
  base.body.appendChild(seatsDescription);
  base.body.appendChild(learnMoreAboutSeatsLink);
  base.body.appendChild(userDevicesLabel);
  base.body.appendChild(userDevicesDescription);
  base.body.appendChild(unlimitedLabel);
  return {
    body: base.body,
    references: {
      ...base.references,
      planName,
      contactSalesButton,
      switchPlanButton,
      purchaseMullvadButton,
      usageTab,
      invoicesTab,
      billingDetailsTab,
      seatsLabel,
      seatsDescription,
      learnMoreAboutSeatsLink,
      userDevicesLabel,
      userDevicesDescription,
      unlimitedLabel,
    },
  };
}

function createSettingsBillingInvoicesBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Billing",
    pageDescriptionText: "View and manage your billing plan.",
  });
  const pastInvoicesHeading = new FakeElement("h3", {}, [new FakeTextNode("Past invoices")]);
  const invoicesDescription = new FakeElement("p", {}, [
    new FakeTextNode("Invoices from the past 12 months."),
  ]);
  const emptyState = new FakeElement("p", {}, [new FakeTextNode("You have no invoices.")]);
  base.body.appendChild(pastInvoicesHeading);
  base.body.appendChild(invoicesDescription);
  base.body.appendChild(emptyState);
  return {
    body: base.body,
    references: {
      ...base.references,
      pastInvoicesHeading,
      invoicesDescription,
      emptyState,
    },
  };
}

function createSettingsBillingDetailsBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Billing",
    pageDescriptionText: "View and manage your billing plan.",
  });
  const emptyState = new FakeElement("p", {}, [
    new FakeTextNode("No billing details available."),
  ]);
  base.body.appendChild(emptyState);
  return {
    body: base.body,
    references: {
      ...base.references,
      emptyState,
    },
  };
}

function createSettingsBillingPlansBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Upgrade your plan",
    pageDescriptionText:
      "Add unlimited users and get them connected to all the devices and services they need.",
  });
  const backToBillingLink = new FakeElement("a", {}, [new FakeTextNode("Back to billing")]);
  const plansTab = new FakeElement("button", {}, [new FakeTextNode("Plans")]);
  const paymentTab = new FakeElement("button", {}, [new FakeTextNode("Payment")]);
  const currentPlanLabel = new FakeElement("span", {}, [new FakeTextNode("Current plan")]);
  const personalHeading = new FakeElement("h3", {}, [new FakeTextNode("Personal")]);
  const freeForeverLabel = new FakeElement("span", {}, [new FakeTextNode("Free Forever")]);
  const standardHeading = new FakeElement("h3", {}, [new FakeTextNode("Standard")]);
  const upgradeButton = new FakeElement("button", {}, [new FakeTextNode("Upgrade")]);
  const premiumHeading = new FakeElement("h3", {}, [new FakeTextNode("Premium")]);
  const enterpriseHeading = new FakeElement("h3", {}, [new FakeTextNode("Enterprise")]);
  const platformExtensionsHeading = new FakeElement("h3", {}, [new FakeTextNode("Platform extensions")]);
  const pamHeading = new FakeElement("h3", {}, [new FakeTextNode("Privileged Access Management (PAM)")]);
  const comparePlansLink = new FakeElement("a", {}, [new FakeTextNode("Compare plans in detail")]);
  const contactSupportLink = new FakeElement("a", {}, [new FakeTextNode("Contact support")]);
  base.body.appendChild(backToBillingLink);
  base.body.appendChild(plansTab);
  base.body.appendChild(paymentTab);
  base.body.appendChild(currentPlanLabel);
  base.body.appendChild(personalHeading);
  base.body.appendChild(freeForeverLabel);
  base.body.appendChild(standardHeading);
  base.body.appendChild(upgradeButton);
  base.body.appendChild(premiumHeading);
  base.body.appendChild(enterpriseHeading);
  base.body.appendChild(platformExtensionsHeading);
  base.body.appendChild(pamHeading);
  base.body.appendChild(comparePlansLink);
  base.body.appendChild(contactSupportLink);
  return {
    body: base.body,
    references: {
      ...base.references,
      backToBillingLink,
      plansTab,
      paymentTab,
      currentPlanLabel,
      personalHeading,
      freeForeverLabel,
      standardHeading,
      upgradeButton,
      premiumHeading,
      enterpriseHeading,
      platformExtensionsHeading,
      pamHeading,
      comparePlansLink,
      contactSupportLink,
    },
  };
}

function createSettingsBillingCheckoutBody({ FakeElement, FakeTextNode }) {
  const base = createAdminPageBaseForBillingCheckout({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Purchase seats",
  });
  const seatsToPurchaseLabel = new FakeElement("label", {}, [new FakeTextNode("Seats to purchase")]);
  const usersWhoNeedSeatsNote = new FakeElement("p", {}, [
    new FakeTextNode("Currently you have 1 users who would need seats."),
  ]);
  const faqHeading = new FakeElement("h3", {}, [new FakeTextNode("Frequently asked questions")]);
  const upgradingToLabel = new FakeElement("span", {}, [new FakeTextNode("Upgrading to")]);
  const priceLabel = new FakeElement("span", {}, [new FakeTextNode("$8 per seat / month")]);
  const estimatedSalesTaxLabel = new FakeElement("span", {}, [new FakeTextNode("Estimated sales tax")]);
  const applyPromoCodeButton = new FakeElement("button", {}, [new FakeTextNode("Apply promo code")]);
  const nextPaymentLabel = new FakeElement("span", {}, [new FakeTextNode("Next payment on")]);
  const salesTaxLink = new FakeElement("a", {}, [
    new FakeTextNode("about how Tailscale collects sales tax."),
  ]);
  const continueButton = new FakeElement("button", {}, [
    new FakeTextNode("Continue to billing details →"),
  ]);
  base.body.appendChild(seatsToPurchaseLabel);
  base.body.appendChild(usersWhoNeedSeatsNote);
  base.body.appendChild(faqHeading);
  base.body.appendChild(upgradingToLabel);
  base.body.appendChild(priceLabel);
  base.body.appendChild(estimatedSalesTaxLabel);
  base.body.appendChild(applyPromoCodeButton);
  base.body.appendChild(nextPaymentLabel);
  base.body.appendChild(salesTaxLink);
  base.body.appendChild(continueButton);
  return {
    body: base.body,
    references: {
      ...base.references,
      seatsToPurchaseLabel,
      usersWhoNeedSeatsNote,
      faqHeading,
      upgradingToLabel,
      priceLabel,
      estimatedSalesTaxLabel,
      applyPromoCodeButton,
      nextPaymentLabel,
      salesTaxLink,
      continueButton,
    },
  };
}

function createSettingsBillingMullvadBody({ FakeElement, FakeTextNode }) {
  const base = createAdminPageBaseForBillingCheckout({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Manage add-ons",
  });
  const mainHeading = new FakeElement("h2", {}, [new FakeTextNode("Mullvad VPN")]);
  const introLine = new FakeElement("p", {}, [
    new FakeTextNode(
      "Select a number of devices that can use Mullvad’s servers as exit nodes. At the end of every billing cycle, you will be billed",
    ),
  ]);
  const postCheckoutNote = new FakeElement("p", {}, [
    new FakeTextNode(
      "You will be able to pick which devices can use Mullvad VPN after completing the checkout.",
    ),
  ]);
  const estimatedSalesTaxLabel = new FakeElement("span", {}, [new FakeTextNode("Estimated sales tax")]);
  const applyPromoCodeButton = new FakeElement("button", {}, [new FakeTextNode("Apply promo code")]);
  const nextBillingCycleLabel = new FakeElement("span", {}, [new FakeTextNode("Next billing cycle starts")]);
  const continueButton = new FakeElement("button", {}, [
    new FakeTextNode("Continue to billing details →"),
  ]);
  const agreementLead = new FakeElement("span", {}, [
    new FakeTextNode("By clicking continue, you agree to the"),
  ]);
  const termsLink = new FakeElement("a", {}, [
    new FakeTextNode("Mullvad VPN Terms For Tailscale Customers"),
  ]);
  base.body.appendChild(mainHeading);
  base.body.appendChild(introLine);
  base.body.appendChild(postCheckoutNote);
  base.body.appendChild(estimatedSalesTaxLabel);
  base.body.appendChild(applyPromoCodeButton);
  base.body.appendChild(nextBillingCycleLabel);
  base.body.appendChild(continueButton);
  base.body.appendChild(agreementLead);
  base.body.appendChild(termsLink);
  return {
    body: base.body,
    references: {
      ...base.references,
      mainHeading,
      introLine,
      postCheckoutNote,
      estimatedSalesTaxLabel,
      applyPromoCodeButton,
      nextBillingCycleLabel,
      continueButton,
      agreementLead,
      termsLink,
    },
  };
}

function createAdminPageBaseForBillingCheckout({ FakeElement, FakeTextNode, pageTitleText }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode(pageTitleText)]);
  const body = new FakeElement("body", {}, [...shell.nodes, pageTitle]);
  return {
    body,
    references: {
      ...shell.references,
      pageTitle,
    },
  };
}

function createSettingsKeysBody({ FakeElement, FakeTextNode }) {
  const base = createSettingsPageBase({
    FakeElement,
    FakeTextNode,
    pageTitleText: "Keys",
    pageDescriptionText: "View and manage your Auth keys and API access tokens.",
  });
  const privateKeysNotice = new FakeElement("p", {}, [
    new FakeTextNode(
      "Your private device keys are not included here: they are always private, stay on your device, and are never shared with Tailscale.",
    ),
  ]);
  const authKeysHeading = new FakeElement("h3", {}, [new FakeTextNode("Auth keys")]);
  const generateAuthKeyButton = new FakeElement("button", {}, [
    new FakeTextNode("Generate auth key…"),
  ]);
  const emptyAuthKeysState = new FakeElement("p", {}, [
    new FakeTextNode("You don’t have any auth keys yet"),
  ]);
  const apiTokensHeading = new FakeElement("h3", {}, [
    new FakeTextNode("API access tokens"),
  ]);
  const generateAccessTokenButton = new FakeElement("button", {}, [
    new FakeTextNode("Generate access token…"),
  ]);
  const emptyAccessTokensState = new FakeElement("p", {}, [
    new FakeTextNode("You don’t have any access tokens yet"),
  ]);
  base.body.appendChild(privateKeysNotice);
  base.body.appendChild(authKeysHeading);
  base.body.appendChild(generateAuthKeyButton);
  base.body.appendChild(emptyAuthKeysState);
  base.body.appendChild(apiTokensHeading);
  base.body.appendChild(generateAccessTokenButton);
  base.body.appendChild(emptyAccessTokensState);
  return {
    body: base.body,
    references: {
      ...base.references,
      privateKeysNotice,
      authKeysHeading,
      generateAuthKeyButton,
      emptyAuthKeysState,
      apiTokensHeading,
      generateAccessTokenButton,
      emptyAccessTokensState,
    },
  };
}

function createResourceHubBody({ FakeElement, FakeTextNode }) {
  const shell = createAdminShell({ FakeElement, FakeTextNode });
  const pageTitle = new FakeElement("h1", {}, [new FakeTextNode("Resource hub")]);
  const pageDescription = new FakeElement("p", {}, [
    new FakeTextNode("Explore what you can do with Tailscale"),
  ]);
  const intentLabel = new FakeElement("span", {}, [new FakeTextNode("I want to...")]);
  const sendFilesButton = new FakeElement("button", {}, [
    new FakeTextNode("Send files to different devices"),
  ]);
  const accessHomeNetworkButton = new FakeElement("button", {}, [
    new FakeTextNode("Access my home network"),
  ]);
  const cloudStorageButton = new FakeElement("button", {}, [
    new FakeTextNode("Host my own cloud storage"),
  ]);
  const appleTvButton = new FakeElement("button", {}, [
    new FakeTextNode("Install Tailscale on my Apple TV"),
  ]);
  const otherButton = new FakeElement("button", {}, [new FakeTextNode("Other")]);
  const cardDescription = new FakeElement("p", {}, [
    new FakeTextNode(
      "Taildrop allows you to share files seamlessly with any of your devices.",
    ),
  ]);
  const readGuideLink = new FakeElement("a", {}, [new FakeTextNode("Read guide")]);
  const guideSummary = new FakeElement("p", {}, [
    new FakeTextNode(
      "Taildrop lets you send files between your personal devices on a Tailscale network (known as a tailnet).",
    ),
  ]);
  const helpfulQuestion = new FakeElement("span", {}, [
    new FakeTextNode("Was this helpful?"),
  ]);
  const yesButton = new FakeElement("button", {}, [new FakeTextNode("Yes")]);
  const noButton = new FakeElement("button", {}, [new FakeTextNode("No")]);
  const notInterestedButton = new FakeElement("button", {}, [
    new FakeTextNode("I’m not interested in this use case"),
  ]);
  const body = new FakeElement("body", {}, [
    ...shell.nodes,
    pageTitle,
    pageDescription,
    intentLabel,
    sendFilesButton,
    accessHomeNetworkButton,
    cloudStorageButton,
    appleTvButton,
    otherButton,
    cardDescription,
    readGuideLink,
    guideSummary,
    helpfulQuestion,
    yesButton,
    noButton,
    notInterestedButton,
  ]);

  return {
    body,
    references: {
      ...shell.references,
      pageTitle,
      pageDescription,
      intentLabel,
      sendFilesButton,
      accessHomeNetworkButton,
      cloudStorageButton,
      appleTvButton,
      otherButton,
      cardDescription,
      readGuideLink,
      guideSummary,
      helpfulQuestion,
      yesButton,
      noButton,
      notInterestedButton,
    },
  };
}

function assertAdminShellChinese(runtime) {
  assert.equal(
    runtime.accountHomeLink.getAttribute("aria-label"),
    "isdoge93@gmail.com 的管理控制台主页",
  );
  assert.equal(runtime.freePlanLabel.textContent, "免费版");
  assert.equal(runtime.helpMenuButton.getAttribute("aria-label"), "帮助菜单");
  assert.equal(runtime.helpMenuButton.getAttribute("title"), "帮助和资源");
  assert.equal(runtime.userMenuButton.getAttribute("aria-label"), "用户菜单…");
  assert.equal(runtime.machinesNav.textContent, "设备");
  assert.equal(runtime.machinesNav.getAttribute("data-content"), "设备");
  assert.equal(runtime.appsNav.textContent, "应用");
  assert.equal(runtime.appsNav.getAttribute("data-content"), "应用");
  assert.equal(runtime.servicesNav.textContent, "服务");
  assert.equal(runtime.servicesNav.getAttribute("data-content"), "服务");
  assert.equal(runtime.usersNav.textContent, "用户");
  assert.equal(runtime.usersNav.getAttribute("data-content"), "用户");
  assert.equal(runtime.accessControlsNav.textContent, "访问控制");
  assert.equal(runtime.accessControlsNav.getAttribute("data-content"), "访问控制");
  assert.equal(runtime.logsNav.textContent, "日志");
  assert.equal(runtime.logsNav.getAttribute("data-content"), "日志");
  assert.equal(runtime.dnsNav.textContent, "DNS");
  assert.equal(runtime.dnsNav.getAttribute("data-content"), "DNS");
  assert.equal(runtime.settingsNav.textContent, "设置");
  assert.equal(runtime.settingsNav.getAttribute("data-content"), "设置");
  assert.equal(runtime.resourceHubNav.textContent, "资源中心");
  assert.equal(runtime.resourceHubNav.getAttribute("data-content"), "资源中心");
  assert.equal(runtime.machinesNavWrapper.getAttribute("data-tsc-nav-item"), null);
  assert.equal(runtime.machinesNavWrapper.getAttribute("data-tsc-nav-size"), null);
  assert.equal(runtime.machinesNavWrapper.getAttribute("style"), null);
  assert.equal(runtime.accessControlsNavWrapper.getAttribute("data-tsc-nav-item"), null);
  assert.equal(runtime.accessControlsNavWrapper.getAttribute("data-tsc-nav-size"), null);
  assert.equal(runtime.accessControlsNavWrapper.getAttribute("style"), null);
  assert.equal(runtime.liveQaHeading.textContent, "加入我们的现场社区问答！");
  assert.equal(runtime.joinPrefix.textContent.trim(), "参加");
  assert.equal(runtime.ceoText.textContent.trim(), "（CEO 和联合创始人）以及");
  assert.equal(
    runtime.devRelText.textContent.trim(),
    "（开发者关系负责人）的现场社区问答，活动在",
  );
  assert.equal(runtime.onPrefix.textContent.trim(), "于");
  assert.equal(
    runtime.bannerTail.textContent,
    "。我们会聊最近的价格更新，并现场回答你的问题。",
  );
  assert.equal(runtime.dismissBannerButton.getAttribute("aria-label"), "关闭问答横幅");
}

function assertAdminShellEnglish(runtime) {
  assert.equal(
    runtime.accountHomeLink.getAttribute("aria-label"),
    "isdoge93@gmail.com’s admin console home",
  );
  assert.equal(runtime.freePlanLabel.textContent, "Free");
  assert.equal(runtime.helpMenuButton.getAttribute("aria-label"), "Help menu");
  assert.equal(runtime.helpMenuButton.getAttribute("title"), "Help and resources");
  assert.equal(runtime.userMenuButton.getAttribute("aria-label"), "User menu…");
  assert.equal(runtime.machinesNav.textContent, "Machines");
  assert.equal(runtime.machinesNav.getAttribute("data-content"), "Machines");
  assert.equal(runtime.appsNav.textContent, "Apps");
  assert.equal(runtime.appsNav.getAttribute("data-content"), "Apps");
  assert.equal(runtime.servicesNav.textContent, "Services");
  assert.equal(runtime.servicesNav.getAttribute("data-content"), "Services");
  assert.equal(runtime.usersNav.textContent, "Users");
  assert.equal(runtime.usersNav.getAttribute("data-content"), "Users");
  assert.equal(runtime.accessControlsNav.textContent, "Access controls");
  assert.equal(runtime.accessControlsNav.getAttribute("data-content"), "Access controls");
  assert.equal(runtime.logsNav.textContent, "Logs");
  assert.equal(runtime.logsNav.getAttribute("data-content"), "Logs");
  assert.equal(runtime.dnsNav.textContent, "DNS");
  assert.equal(runtime.dnsNav.getAttribute("data-content"), "DNS");
  assert.equal(runtime.settingsNav.textContent, "Settings");
  assert.equal(runtime.settingsNav.getAttribute("data-content"), "Settings");
  assert.equal(runtime.resourceHubNav.textContent, "Resource hub");
  assert.equal(runtime.resourceHubNav.getAttribute("data-content"), "Resource hub");
  assert.equal(runtime.machinesNavWrapper.getAttribute("data-tsc-nav-item"), null);
  assert.equal(runtime.machinesNavWrapper.getAttribute("data-tsc-nav-size"), null);
  assert.equal(runtime.machinesNavWrapper.getAttribute("style"), null);
  assert.equal(runtime.accessControlsNavWrapper.getAttribute("data-tsc-nav-item"), null);
  assert.equal(runtime.accessControlsNavWrapper.getAttribute("data-tsc-nav-size"), null);
  assert.equal(runtime.accessControlsNavWrapper.getAttribute("style"), null);
  assert.equal(runtime.liveQaHeading.textContent, "Join our live community Q&A!");
  assert.equal(runtime.joinPrefix.textContent.trim(), "Join");
  assert.equal(runtime.ceoText.textContent.trim(), "(CEO and Co-Founder) and");
  assert.equal(
    runtime.devRelText.textContent.trim(),
    "(Head of DevRel) for a live community Q&A on",
  );
  assert.equal(runtime.onPrefix.textContent.trim(), "on");
  assert.equal(
    runtime.bannerTail.textContent,
    ". We’ll chat through the recent pricing update and answer your questions live.",
  );
  assert.equal(
    runtime.dismissBannerButton.getAttribute("aria-label"),
    "Dismiss Q&A banner",
  );
}

function assertSettingsShellChinese(runtime) {
  assert.equal(runtime.tailnetSettingsHeading.textContent, "Tailnet 设置");
  assert.equal(runtime.generalNavLink.textContent, "常规");
  assert.equal(runtime.userManagementLink.textContent, "用户管理");
  assert.equal(runtime.deviceManagementLink.textContent, "设备管理");
  assert.equal(runtime.policyFileManagementLink.textContent, "策略文件管理");
  assert.equal(runtime.trustCredentialsLink.textContent, "受信任凭据");
  assert.equal(runtime.webhooksLink.textContent, "Webhook");
  assert.equal(runtime.contactPreferencesLink.textContent, "联系偏好");
  assert.equal(runtime.billingLink.textContent, "计费");
  assert.equal(runtime.personalSettingsHeading.textContent, "个人设置");
  assert.equal(runtime.keysLink.textContent, "密钥");
}

function assertSettingsShellEnglish(runtime) {
  assert.equal(runtime.tailnetSettingsHeading.textContent, "Tailnet Settings");
  assert.equal(runtime.generalNavLink.textContent, "General");
  assert.equal(runtime.userManagementLink.textContent, "User management");
  assert.equal(runtime.deviceManagementLink.textContent, "Device management");
  assert.equal(runtime.policyFileManagementLink.textContent, "Policy file management");
  assert.equal(runtime.trustCredentialsLink.textContent, "Trust credentials");
  assert.equal(runtime.webhooksLink.textContent, "Webhooks");
  assert.equal(runtime.contactPreferencesLink.textContent, "Contact preferences");
  assert.equal(runtime.billingLink.textContent, "Billing");
  assert.equal(runtime.personalSettingsHeading.textContent, "Personal Settings");
  assert.equal(runtime.keysLink.textContent, "Keys");
}

const NodeFilter = {
  SHOW_TEXT: 4,
  FILTER_ACCEPT: 1,
  FILTER_REJECT: 2,
};

function addListener(store, type, listener) {
  const listeners = store.get(type) ?? [];
  listeners.push(listener);
  store.set(type, listeners);
}

function removeListener(store, type, listener) {
  const listeners = store.get(type) ?? [];
  store.set(
    type,
    listeners.filter((current) => current !== listener),
  );
}

function dispatch(store, type, event) {
  const listeners = store.get(type) ?? [];
  for (const listener of listeners) {
    listener(event);
  }
}

function createLocation(url) {
  return {
    get href() {
      return url.href;
    },
    get pathname() {
      return url.pathname;
    },
    get hostname() {
      return url.hostname;
    },
    get hash() {
      return url.hash;
    },
  };
}

function syncLocation(location, url) {
  Object.defineProperties(location, {
    href: { get: () => url.href, configurable: true },
    pathname: { get: () => url.pathname, configurable: true },
    hostname: { get: () => url.hostname, configurable: true },
    hash: { get: () => url.hash, configurable: true },
  });
}

function updateLocation(currentUrl, nextUrl) {
  if (!nextUrl) {
    return;
  }

  const resolved = new URL(nextUrl, currentUrl.href);
  currentUrl.pathname = resolved.pathname;
  currentUrl.hash = resolved.hash;
  currentUrl.search = resolved.search;
}

function matchesSelector(element, selector) {
  if (selector === "*") {
    return true;
  }

  const match = selector.match(
    /^(?<tag>[a-zA-Z0-9_-]+)?(?:\[(?<attr>[a-zA-Z0-9_-]+)(?:="(?<value>[^"]*)")?\])?$/,
  );

  if (!match || !match.groups) {
    return false;
  }

  const { tag, attr, value } = match.groups;

  if (tag && element.tagName.toLowerCase() !== tag.toLowerCase()) {
    return false;
  }

  if (!attr) {
    return true;
  }

  if (typeof value === "undefined") {
    return element.getAttribute(attr) !== null;
  }

  return element.getAttribute(attr) === value;
}

// ==UserScript==
// @name         Tailscale 中文化插件
// @namespace    https://github.com/isdoge/tailscale-chinese
// @version      1.0.1
// @description  中文化 Tailscale 管理控制台界面的部分菜单及内容。
// @author       狗带带子
// @match        https://tailscale.com/*
// @match        https://*.tailscale.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @icon         https://ts2.tc.mm.bing.net/th/id/ODF.MtiBxHB4UlSlj9Wx-6fUYA?w=32&h=32&qlt=90&pcl=fffffc&o=6&pid=1.2
// @homepageURL  https://github.com/isdoge/tailscale-chinese
// @supportURL   https://github.com/isdoge/tailscale-chinese/issues
// @updateURL    https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/dist/tailscale-chinese.user.js
// @downloadURL  https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/dist/tailscale-chinese.user.js
// @run-at       document-idle
// ==/UserScript==
(() => {
  const modules = {
    "src/core/admin-layout.ts": (module, exports, require) => {
        const LAYOUT_STYLE_ID = "tailscale-chinese-layout";
        const NOWRAP_MARKER = "data-tailscale-zh-nowrap";
        const COMPACT_BUTTON_LABELS = new Set([
            "分享…",
            "设备设置"
        ]);
        function getDocumentHead() {
            return typeof document !== "undefined" ? document.head : null;
        }
        function getElementById(id) {
            if (typeof document === "undefined" || typeof document.getElementById !== "function") {
                return null;
            }
            return document.getElementById(id);
        }
        function ensureLayoutStyle() {
            if (getElementById(LAYOUT_STYLE_ID)) {
                return;
            }
            const head = getDocumentHead();
            if (!head) {
                return;
            }
            const style = document.createElement("style");
            style.id = LAYOUT_STYLE_ID;
            style.textContent = `
            button[${NOWRAP_MARKER}] {
              white-space: nowrap;
            }
          `;
            head.appendChild(style);
        }
        function clearCompactButtonLayout() {
            getElementById(LAYOUT_STYLE_ID)?.remove();
            if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") {
                return;
            }
            for (const button of document.querySelectorAll(`button[${NOWRAP_MARKER}]`)){
                button.removeAttribute(NOWRAP_MARKER);
            }
        }
        function applyCompactButtonLayout() {
            ensureLayoutStyle();
            if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") {
                return;
            }
            for (const button of document.querySelectorAll("button")){
                const label = button.textContent?.trim();
                if (!label || !COMPACT_BUTTON_LABELS.has(label)) {
                    continue;
                }
                button.setAttribute(NOWRAP_MARKER, "");
            }
        }
        function syncAdminNavigationLayout(enabled) {
            if (!enabled) {
                clearCompactButtonLayout();
                return;
            }
            applyCompactButtonLayout();
        }

        module.exports = { syncAdminNavigationLayout };
        },
    "src/state/language.ts": (module, exports, require) => {
        const STORAGE_KEY = "tailscale-chinese:language";
        const DEFAULT_LANGUAGE = "zh-CN";
        function getLanguagePreference() {
            try {
                if (typeof globalThis.GM_getValue === "function") {
                    return normalizeLanguagePreference(globalThis.GM_getValue(STORAGE_KEY, DEFAULT_LANGUAGE));
                }
                return normalizeLanguagePreference(globalThis.localStorage?.getItem(STORAGE_KEY));
            } catch  {
                return DEFAULT_LANGUAGE;
            }
        }
        function setLanguagePreference(nextLanguage) {
            const language = normalizeLanguagePreference(nextLanguage);
            if (typeof globalThis.GM_setValue === "function") {
                globalThis.GM_setValue(STORAGE_KEY, language);
                return language;
            }
            globalThis.localStorage?.setItem(STORAGE_KEY, language);
            return language;
        }
        function normalizeLanguagePreference(value) {
            return value === "en" ? "en" : DEFAULT_LANGUAGE;
        }

        module.exports = { getLanguagePreference, setLanguagePreference };
        },
    "src/core/control.ts": (module, exports, require) => {
        const { getLanguagePreference, setLanguagePreference } = require("src/state/language.ts");
        function getLocalControlWindow() {
            return globalThis;
        }
        function installControl(rerun) {
            const api = {
                getLanguage () {
                    return getLanguagePreference();
                },
                setLanguage (nextLanguage) {
                    const language = setLanguagePreference(nextLanguage);
                    rerun();
                    return language;
                },
                rerun
            };
            getLocalControlWindow().__tailscaleChinese = api;
            return api;
        }
        function uninstallLegacyControl() {
            const exposedWindow = globalThis;
            const legacyWindow = exposedWindow.unsafeWindow;
            if (!legacyWindow || legacyWindow === exposedWindow) {
                return;
            }
            try {
                delete legacyWindow.__tailscaleChinese;
            } catch  {
                legacyWindow.__tailscaleChinese = undefined;
            }
        }

        module.exports = { installControl, uninstallLegacyControl };
        },
    "src/core/navigation.ts": (module, exports, require) => {
        function observeNavigation(onNavigate) {
            let currentUrl = window.location.href;
            const notifyIfChanged = ()=>{
                const nextUrl = window.location.href;
                if (nextUrl === currentUrl) {
                    return;
                }
                currentUrl = nextUrl;
                onNavigate();
            };
            const originalPushState = window.history.pushState.bind(window.history);
            const originalReplaceState = window.history.replaceState.bind(window.history);
            window.history.pushState = (...args)=>{
                const result = originalPushState(...args);
                notifyIfChanged();
                return result;
            };
            window.history.replaceState = (...args)=>{
                const result = originalReplaceState(...args);
                notifyIfChanged();
                return result;
            };
            window.addEventListener("popstate", notifyIfChanged);
            window.addEventListener("hashchange", notifyIfChanged);
            return ()=>{
                window.history.pushState = originalPushState;
                window.history.replaceState = originalReplaceState;
                window.removeEventListener("popstate", notifyIfChanged);
                window.removeEventListener("hashchange", notifyIfChanged);
            };
        }

        module.exports = { observeNavigation };
        },
    "src/dicts/admin-shell.ts": (module, exports, require) => {
        const adminShellDictionary = [
            {
                kind: "text",
                match: "exact",
                from: "Machines",
                to: "设备"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "div[data-content]",
                attr: "data-content",
                from: "Machines",
                to: "设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Free",
                to: "免费版"
            },
            {
                kind: "text",
                match: "exact",
                from: "Premium",
                to: "高级版"
            },
            {
                kind: "text",
                match: "exact",
                from: "Apps",
                to: "应用"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "div[data-content]",
                attr: "data-content",
                from: "Apps",
                to: "应用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Services",
                to: "服务"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "div[data-content]",
                attr: "data-content",
                from: "Services",
                to: "服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Users",
                to: "用户"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "div[data-content]",
                attr: "data-content",
                from: "Users",
                to: "用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Access controls",
                to: "访问控制"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "div[data-content]",
                attr: "data-content",
                from: "Access controls",
                to: "访问控制"
            },
            {
                kind: "text",
                match: "exact",
                from: "Logs",
                to: "日志"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "div[data-content]",
                attr: "data-content",
                from: "Logs",
                to: "日志"
            },
            {
                kind: "text",
                match: "exact",
                from: "Settings",
                to: "设置"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "div[data-content]",
                attr: "data-content",
                from: "Settings",
                to: "设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Resource hub",
                to: "资源中心"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "div[data-content]",
                attr: "data-content",
                from: "Resource hub",
                to: "资源中心"
            },
            {
                kind: "text",
                match: "exact",
                from: "Learn more",
                to: "了解更多"
            },
            {
                kind: "text",
                match: "exact",
                from: "Give feedback",
                to: "提交反馈"
            },
            {
                kind: "text",
                match: "exact",
                from: "Submit feedback",
                to: "提交反馈"
            },
            {
                kind: "text",
                match: "exact",
                from: "Use system setting",
                to: "跟随系统设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Use system settings",
                to: "跟随系统设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Appearance",
                to: "外观"
            },
            {
                kind: "text",
                match: "exact",
                from: "Light",
                to: "浅色"
            },
            {
                kind: "text",
                match: "exact",
                from: "Dark",
                to: "深色"
            },
            {
                kind: "text",
                match: "exact",
                from: "Log out",
                to: "退出登录"
            },
            {
                kind: "text",
                match: "exact",
                from: "Documentation",
                to: "文档"
            },
            {
                kind: "text",
                match: "exact",
                from: "Docs",
                to: "文档"
            },
            {
                kind: "text",
                match: "exact",
                from: "Use case guides",
                to: "用例指南"
            },
            {
                kind: "text",
                match: "exact",
                from: "Support",
                to: "支持"
            },
            {
                kind: "text",
                match: "exact",
                from: "Download",
                to: "下载"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage",
                to: "管理"
            },
            {
                kind: "text",
                match: "exact",
                from: "Configure",
                to: "配置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Connected",
                to: "已连接"
            },
            {
                kind: "text",
                match: "exact",
                from: "Join our live community Q&A!",
                to: "加入我们的现场社区问答！"
            },
            {
                kind: "text",
                match: "exact",
                from: "Join",
                to: "参加 "
            },
            {
                kind: "text",
                match: "exact",
                from: "(CEO and Co-Founder) and",
                to: "（CEO 和联合创始人）以及 "
            },
            {
                kind: "text",
                match: "exact",
                from: "(Head of DevRel) for a live community Q&A on",
                to: "（开发者关系负责人）的现场社区问答，活动在"
            },
            {
                kind: "text",
                match: "exact",
                from: "on",
                to: "于 "
            },
            {
                kind: "text",
                match: "exact",
                from: ". We’ll chat through the recent pricing update and answer your questions live.",
                to: "。我们会聊最近的价格更新，并现场回答你的问题。"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "a",
                attr: "aria-label",
                pattern: "^(.+)’s admin console home$",
                replace: "$1 的管理控制台主页"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "aria-label",
                from: "Help menu",
                to: "帮助菜单"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "aria-label",
                from: "User menu…",
                to: "用户菜单…"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "aria-label",
                from: "Dismiss Q&A banner",
                to: "关闭问答横幅"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "title",
                from: "Help and resources",
                to: "帮助和资源"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "a",
                attr: "aria-label",
                pattern: "^Read documentation about .+$",
                replace: "阅读相关文档"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "[aria-label]",
                attr: "aria-label",
                pattern: "^Copy (.+) to your clip board\\.$",
                replace: "复制 $1 到剪贴板。"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "button",
                attr: "aria-label",
                pattern: "^Actions for grant policy (\\d+)$",
                replace: "授权策略 $1 的操作"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "button",
                attr: "aria-label",
                pattern: "^Actions for (.+)$",
                replace: "$1 的操作"
            }
        ];

        module.exports = { adminShellDictionary };
        },
    "src/dicts/access-controls.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const accessControlRules = [
            {
                kind: "text",
                match: "exact",
                from: "Visual editor",
                to: "可视化编辑器"
            },
            {
                kind: "text",
                match: "exact",
                from: "JSON editor",
                to: "JSON 编辑器"
            },
            {
                kind: "text",
                match: "exact",
                from: "Control who and which devices are allowed to connect in your network. If you need more advanced or customized control, or if you prefer to write in JSON directly, switch to the original JSON editor.",
                to: "控制谁以及哪些设备可以在你的网络中建立连接。如果你需要更高级或更定制的控制，或更喜欢直接编写 JSON，请切换到原始 JSON 编辑器。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Control who and which devices are allowed to connect in your network.",
                to: "控制谁以及哪些设备可以在你的网络中建立连接。"
            },
            {
                kind: "text",
                match: "exact",
                from: "General access rules",
                to: "常规访问规则"
            },
            {
                kind: "text",
                match: "exact",
                from: "Port and protocol",
                to: "端口和协议"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tests",
                to: "测试"
            },
            {
                kind: "text",
                match: "exact",
                from: "Groups",
                to: "群组"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tags",
                to: "标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "IP sets",
                to: "IP 集"
            },
            {
                kind: "text",
                match: "exact",
                from: "Hosts",
                to: "主机"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node attributes",
                to: "节点属性"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device posture",
                to: "设备状态"
            },
            {
                kind: "text",
                match: "exact",
                from: "Via",
                to: "经由"
            },
            {
                kind: "text",
                match: "exact",
                from: "App",
                to: "应用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Capability",
                to: "能力"
            },
            {
                kind: "text",
                match: "exact",
                from: "Auto approvers",
                to: "自动审批者"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit file",
                to: "编辑文件"
            },
            {
                kind: "text",
                match: "exact",
                from: "Preview changes",
                to: "预览更改"
            },
            {
                kind: "text",
                match: "exact",
                from: "Preview rules",
                to: "预览规则"
            },
            {
                kind: "text",
                match: "exact",
                from: "Preview Rules",
                to: "预览规则"
            },
            {
                kind: "text",
                match: "exact",
                from: "Preview which hosts and ports a user’s machines are allowed to access.",
                to: "预览某个用户的设备可访问的主机和端口。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Select a user or tag",
                to: "选择用户或标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "Docs",
                to: "文档"
            },
            {
                kind: "text",
                match: "exact",
                from: "Learn how to configure your tailnet policy file.",
                to: "了解如何配置你的 tailnet 策略文件。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Syntax reference",
                to: "语法参考"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tags reference",
                to: "标签参考"
            },
            {
                kind: "text",
                match: "exact",
                from: "SSH reference",
                to: "SSH 参考"
            },
            {
                kind: "text",
                match: "exact",
                from: "Funnel reference",
                to: "Funnel 参考"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tests reference",
                to: "测试参考"
            },
            {
                kind: "text",
                match: "exact",
                from: "Examples",
                to: "示例"
            },
            {
                kind: "text",
                match: "exact",
                from: "Advanced options",
                to: "高级选项"
            },
            {
                kind: "text",
                match: "exact",
                from: "JSON preview",
                to: "JSON 预览"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add additional capability",
                to: "添加更多能力"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add another app",
                to: "添加另一个应用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Save grant",
                to: "保存授权规则"
            },
            {
                kind: "text",
                match: "exact",
                from: "Capability-specific configuration options, typically in JSON format.",
                to: "能力专用配置项，通常使用 JSON 格式。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Specify device posture rules that must be true in order to allow these connections.",
                to: "指定必须满足的设备状态规则，只有满足这些规则才允许建立这些连接。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Specify exit nodes, subnet routers, or app connectors that should be used to route the source(s) in this rule to the destination(s).",
                to: "指定此规则中的来源流量前往目标时应使用的出口节点、子网路由器或应用连接器。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Unique identifier for the capability, typically in the format my-domain.x/cap/feature.",
                to: "能力的唯一标识符，通常采用 my-domain.x/cap/feature 这种格式。"
            },
            {
                kind: "text",
                match: "exact",
                from: "SSH into servers using Tailscale & ACLs for authentication and authorization.",
                to: "使用 Tailscale 和 ACL 对服务器执行 SSH 身份验证与授权。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Disable Tailscale SSH…",
                to: "禁用 Tailscale SSH…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Funnel Beta",
                to: "Funnel 测试版"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage which nodes are allowed to accept internet traffic.",
                to: "管理哪些节点允许接受互联网流量。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage your policy file using",
                to: "使用以下方式管理你的策略文件"
            },
            {
                kind: "text",
                match: "exact",
                from: "Convert ACLs to grants",
                to: "将 ACL 转换为 grants"
            },
            {
                kind: "text",
                match: "exact",
                from: "Convert deprecated ACL rules to the grant syntax. Changes can be reverted via audit",
                to: "将已弃用的 ACL 规则转换为 grant 语法。可通过审计"
            },
            {
                kind: "text",
                match: "exact",
                from: "logs",
                to: "日志"
            },
            {
                kind: "text",
                match: "exact",
                from: "Convert to grants...",
                to: "转换为 grants..."
            },
            {
                kind: "text",
                match: "exact",
                from: "// Example/default ACLs for unrestricted connections.",
                to: "// 用于无限制连接的示例/默认 ACL。"
            },
            {
                kind: "text",
                match: "exact",
                from: "// Declare static groups of users. Use autogroups for all users or users with a specific role.",
                to: "// 声明静态用户组。对所有用户或特定角色用户使用 autogroups。"
            },
            {
                kind: "text",
                match: "exact",
                from: "// Define the tags which can be applied to devices and by which users.",
                to: "// 定义哪些标签可应用到设备，以及哪些用户可以应用它们。"
            },
            {
                kind: "text",
                match: "exact",
                from: "// Define grants that govern access for users, groups, autogroups, tags,",
                to: "// 定义 grants，用于控制用户、群组、autogroups、标签的访问，"
            },
            {
                kind: "text",
                match: "exact",
                from: "// Tailscale IP addresses, and subnet ranges.",
                to: "// 以及 Tailscale IP 地址和子网范围。"
            },
            {
                kind: "text",
                match: "exact",
                from: "// Allow all connections.",
                to: "// 允许所有连接。"
            },
            {
                kind: "text",
                match: "exact",
                from: "// Allow users in \"group:example\" to access \"tag:example\", but only from",
                to: "// 允许 \"group:example\" 中的用户访问 \"tag:example\"，但仅限来自"
            },
            {
                kind: "text",
                match: "exact",
                from: "// devices that are running macOS and have enabled Tailscale client auto-updating.",
                to: "// 运行 macOS 且已启用 Tailscale 客户端自动更新的设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "// Define postures that will be applied to all rules without any specific",
                to: "// 定义将应用于所有未指定"
            },
            {
                kind: "text",
                match: "exact",
                from: "// srcPosture definition.",
                to: "// srcPosture 定义的规则的 posture。"
            },
            {
                kind: "text",
                match: "exact",
                from: "// Define device posture rules requiring devices to meet",
                to: "// 定义设备 posture 规则，要求设备满足"
            },
            {
                kind: "text",
                match: "exact",
                from: "// certain criteria to access parts of your system.",
                to: "// 某些条件后才能访问系统的部分资源。"
            },
            {
                kind: "text",
                match: "exact",
                from: "//      // Require devices running macOS, a stable Tailscale",
                to: "//      // 要求设备运行 macOS，并使用稳定版 Tailscale"
            },
            {
                kind: "text",
                match: "exact",
                from: "//      // version and auto update enabled for Tailscale.",
                to: "//      // 版本，且已为 Tailscale 启用自动更新。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Search by user, group, device, action...etc.",
                to: "按用户、群组、设备、动作等搜索..."
            },
            {
                kind: "text",
                match: "exact",
                from: "as user",
                to: "以用户身份"
            },
            {
                kind: "text",
                match: "exact",
                from: "with check mode",
                to: "使用检查模式"
            },
            {
                kind: "text",
                match: "exact",
                from: "SSH action menu",
                to: "SSH 操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "Source",
                to: "来源"
            },
            {
                kind: "text",
                match: "exact",
                from: "Destination",
                to: "目标"
            },
            {
                kind: "text",
                match: "exact",
                from: "Users",
                to: "用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Action",
                to: "动作"
            },
            {
                kind: "text",
                match: "exact",
                from: "Note",
                to: "说明"
            },
            {
                kind: "text",
                match: "exact",
                from: "Allow all users to SSH into their own devices in check mode.",
                to: "允许所有用户以检查模式 SSH 登录到自己的设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Comment this section out if you want to define specific restrictions.",
                to: "如果你想定义更具体的限制，请将此部分注释掉。"
            },
            {
                kind: "text",
                match: "exact",
                from: "General tests",
                to: "常规测试"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create validation tests that access control changes must pass before saving.",
                to: "创建访问控制变更在保存前必须通过的验证测试。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add test",
                to: "添加测试"
            },
            {
                kind: "text",
                match: "exact",
                from: "with posture attribute",
                to: "带有姿态属性"
            },
            {
                kind: "text",
                match: "exact",
                from: "is accepted on",
                to: "在以下目标上被允许"
            },
            {
                kind: "text",
                match: "exact",
                from: "but denied on",
                to: "但在以下目标上被拒绝"
            },
            {
                kind: "text",
                match: "exact",
                from: "with protocol",
                to: "使用协议"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tests action menu",
                to: "测试操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "SSH tests",
                to: "SSH 测试"
            },
            {
                kind: "text",
                match: "exact",
                from: "Write validation tests that Tailscale SSH policy changes must pass before saving.",
                to: "编写 Tailscale SSH 策略变更在保存前必须通过的验证测试。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add SSH test",
                to: "添加 SSH 测试"
            },
            {
                kind: "text",
                match: "exact",
                from: "can access destination",
                to: "可访问目标"
            },
            {
                kind: "text",
                match: "exact",
                from: "is accepted for",
                to: "被允许用于"
            },
            {
                kind: "text",
                match: "exact",
                from: "but checked for",
                to: "但会检查"
            },
            {
                kind: "text",
                match: "exact",
                from: "and denied on",
                to: "并在以下目标上被拒绝"
            },
            {
                kind: "text",
                match: "exact",
                from: "SSH tests action menu",
                to: "SSH 测试操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "You have not yet defined any tests.",
                to: "你尚未定义任何测试。"
            },
            {
                kind: "text",
                match: "exact",
                from: "You have not yet defined any device postures.",
                to: "你尚未定义任何设备姿态。"
            },
            {
                kind: "text",
                match: "exact",
                from: "User-defined groups",
                to: "用户自定义群组"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create and manage user groups to use in access control policies.",
                to: "创建并管理可用于访问控制策略的用户群组。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create group",
                to: "创建群组"
            },
            {
                kind: "text",
                match: "exact",
                from: "Group name",
                to: "群组名称"
            },
            {
                kind: "text",
                match: "exact",
                from: "Group size",
                to: "群组规模"
            },
            {
                kind: "text",
                match: "exact",
                from: "Members",
                to: "成员"
            },
            {
                kind: "text",
                match: "exact",
                from: "User-defined groups action menu",
                to: "用户自定义群组操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "Autogroups",
                to: "自动群组"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailscale has built-in, dynamically generated groups, called Autogroups, that you can use in your access policies. Autogroups for users are shown below, but you can",
                to: "Tailscale 内置了一类动态生成的群组，称为自动群组，你可以在访问策略中使用它们。下面展示的是面向用户的自动群组，但你也可以"
            },
            {
                kind: "text",
                match: "exact",
                from: "see the full list",
                to: "查看完整列表"
            },
            {
                kind: "text",
                match: "exact",
                from: "of autogroups in our docs.",
                to: "在我们的文档中查看全部自动群组。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Autogroups action menu",
                to: "自动群组操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "Organize non-user devices like servers into functional groups to use in access control policies.",
                to: "将服务器等非用户设备组织成可用于访问控制策略的功能分组。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create tag",
                to: "创建标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tag name",
                to: "标签名称"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tag owner",
                to: "标签所有者"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tags action menu",
                to: "标签操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create collections of IP addresses, hosts, and subnets to use in access control policies.",
                to: "创建可用于访问控制策略的 IP 地址、主机和子网集合。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create IP set",
                to: "创建 IP 集"
            },
            {
                kind: "text",
                match: "exact",
                from: "IP sets action menu",
                to: "IP 集操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create friendly names for IP addresses and CIDR ranges.",
                to: "为 IP 地址和 CIDR 范围创建便于识别的名称。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create host",
                to: "创建主机"
            },
            {
                kind: "text",
                match: "exact",
                from: "Name",
                to: "名称"
            },
            {
                kind: "text",
                match: "exact",
                from: "IP address",
                to: "IP 地址"
            },
            {
                kind: "text",
                match: "exact",
                from: "Hosts action menu",
                to: "主机操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "Apply settings and attributes to sets of devices.",
                to: "将设置和属性应用到一组设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add node attribute",
                to: "添加节点属性"
            },
            {
                kind: "text",
                match: "exact",
                from: "Targets",
                to: "目标"
            },
            {
                kind: "text",
                match: "exact",
                from: "Attributes",
                to: "属性"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node attributes action menu",
                to: "节点属性操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "Define device posture requirements to use in access control policies.",
                to: "定义可用于访问控制策略的设备姿态要求。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add device posture",
                to: "添加设备姿态"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device posture",
                to: "设备姿态"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device attributes",
                to: "设备属性"
            },
            {
                kind: "text",
                match: "exact",
                from: "Postures action menu",
                to: "设备姿态操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "Routes",
                to: "路由"
            },
            {
                kind: "text",
                match: "exact",
                from: "Automatically approve route advertisements from users, groups and tags.",
                to: "自动批准来自用户、群组和标签的路由通告。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add route",
                to: "添加路由"
            },
            {
                kind: "text",
                match: "exact",
                from: "Route",
                to: "路由"
            },
            {
                kind: "text",
                match: "exact",
                from: "is auto-approved for",
                to: "会被自动批准给"
            },
            {
                kind: "text",
                match: "exact",
                from: "Route auto approvers action menu",
                to: "路由自动审批者操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "No auto approvers for routes found.",
                to: "未找到路由自动审批者。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Automatically approve devices joining services.",
                to: "自动批准加入服务的设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Define Service",
                to: "定义服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Service",
                to: "服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "can automatically accept devices",
                to: "可自动接纳设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Services auto approvers action menu",
                to: "服务自动审批者操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "No auto approvers for services found.",
                to: "未找到服务自动审批者。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Exit nodes",
                to: "出口节点"
            },
            {
                kind: "text",
                match: "exact",
                from: "Automatically approve users, groups, and tags as exit nodes.",
                to: "自动批准用户、群组和标签作为出口节点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add exit node",
                to: "添加出口节点"
            },
            {
                kind: "text",
                match: "exact",
                from: "Devices",
                to: "设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Exit node auto approvers action menu",
                to: "出口节点自动审批者操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "You have not added any exit nodes.",
                to: "你还没有添加任何出口节点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add rule",
                to: "添加规则"
            },
            {
                kind: "text",
                match: "exact",
                from: "Sources",
                to: "来源"
            },
            {
                kind: "text",
                match: "exact",
                from: "can access destinations",
                to: "可访问目标"
            },
            {
                kind: "text",
                match: "exact",
                from: "on port and protocol",
                to: "在端口和协议上"
            },
            {
                kind: "text",
                match: "exact",
                from: "Comment",
                to: "备注"
            },
            {
                kind: "text",
                match: "exact",
                from: "General access rules action menu",
                to: "常规访问规则操作"
            },
            {
                kind: "text",
                match: "exact",
                from: "All users and devices",
                to: "所有用户和设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "All ports and protocols",
                to: "所有端口和协议"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Enter source",
                to: "输入来源"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Enter destination",
                to: "输入目标"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Enter device posture",
                to: "输入设备状态"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Enter tag to route via",
                to: "输入经由标签"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Enter domain",
                to: "输入域名"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "textarea",
                attr: "placeholder",
                from: "Enter a note to keep track of your rationale.",
                to: "输入说明，记录这条规则的意图。"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "textarea",
                attr: "placeholder",
                pattern: "\\{\\s*Enter capability in JSON\\s*\\}",
                replace: "{ 输入 JSON 格式的能力 }"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "*",
                attr: "aria-label",
                from: "Remove All ports and protocols",
                to: "移除所有端口和协议"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "*",
                attr: "aria-label",
                from: "Copy {\"ip\": [\"*\"]}\n to your clip board.",
                to: "复制 {\"ip\": [\"*\"]} 到剪贴板。"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Search by user, group, device, tag, port, IP address...etc.",
                to: "按用户、群组、设备、标签、端口、IP 地址等搜索..."
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Search by user, group, device, action...etc.",
                to: "按用户、群组、设备、动作等搜索..."
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Search by name or tag owner.",
                to: "按名称或标签所有者搜索。"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Search by name, CIDR, IP address, host, or IP set.",
                to: "按名称、CIDR、IP 地址、主机或 IP 集搜索。"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Search by name or IP address.",
                to: "按名称或 IP 地址搜索。"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Search by target, attribute, capability, and keyword.",
                to: "按目标、属性、能力和关键字搜索。"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Search by device posture or posture attributes.",
                to: "按设备姿态或姿态属性搜索。"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "aria-label",
                from: "toggle menu",
                to: "切换菜单"
            }
        ];
        const accessControlsDictionary = [
            ...adminShellDictionary,
            ...accessControlRules
        ];

        module.exports = { accessControlsDictionary };
        },
    "src/dicts/apps.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const appRules = [
            {
                kind: "text",
                match: "exact",
                from: "Route traffic to third-party SaaS apps through connectors on your tailnet.",
                to: "通过 tailnet 中的连接器将流量路由到第三方 SaaS 应用。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add app",
                to: "添加应用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add an app",
                to: "添加一个应用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Name",
                to: "名称"
            },
            {
                kind: "text",
                match: "exact",
                from: "Only shown in the admin console. Only letters, numbers, and dashes.",
                to: "仅在管理控制台中显示。只能包含字母、数字和短横线。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Target",
                to: "目标"
            },
            {
                kind: "text",
                match: "exact",
                from: "External app to route traffic for.",
                to: "要为其路由流量的外部应用。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Select a target",
                to: "选择目标"
            },
            {
                kind: "text",
                match: "exact",
                from: "Apps let you control access to your third-party SaaS applications, without requiring any end user configuration.",
                to: "应用让你无需终端用户进行任何配置，即可控制对第三方 SaaS 应用的访问。"
            },
            {
                kind: "text",
                match: "exact",
                from: "route",
                to: "条路由"
            },
            {
                kind: "text",
                match: "exact",
                from: "routes",
                to: "条路由"
            },
            {
                kind: "text",
                match: "exact",
                from: "NAME",
                to: "名称"
            },
            {
                kind: "text",
                match: "exact",
                from: "DOMAINS",
                to: "域名"
            },
            {
                kind: "text",
                match: "exact",
                from: "CONNECTORS",
                to: "连接器"
            },
            {
                kind: "text",
                match: "exact",
                from: "Connectors",
                to: "连接器"
            },
            {
                kind: "text",
                match: "exact",
                from: "Configure which",
                to: "配置哪些"
            },
            {
                kind: "text",
                match: "exact",
                from: "connectors",
                to: "连接器"
            },
            {
                kind: "text",
                match: "exact",
                from: "can route traffic for this app.",
                to: "可以为此应用路由流量。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Select ACL tags",
                to: "选择 ACL 标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "No ACL tags found. You can create ACL tags from the",
                to: "未找到 ACL 标签。你可以在"
            },
            {
                kind: "text",
                match: "exact",
                from: "Access Controls page",
                to: "访问控制页面"
            },
            {
                kind: "text",
                match: "exact",
                from: "STATUS",
                to: "状态"
            },
            {
                kind: "text",
                match: "exact",
                from: "APP ACTION MENU",
                to: "应用操作"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "[placeholder]",
                attr: "placeholder",
                from: "Search apps...",
                to: "搜索应用..."
            }
        ];
        const appsDictionary = [
            ...adminShellDictionary,
            ...appRules
        ];

        module.exports = { appsDictionary };
        },
    "src/dicts/common.ts": (module, exports, require) => {
        const commonDictionary = [
            {
                kind: "text",
                match: "exact",
                from: "Sign in",
                to: "登录"
            },
            {
                kind: "text",
                match: "exact",
                from: "Get started",
                to: "开始使用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage account",
                to: "管理账户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Cancel",
                to: "取消"
            },
            {
                kind: "text",
                match: "exact",
                from: "Save",
                to: "保存"
            },
            {
                kind: "text",
                match: "exact",
                from: "Apply",
                to: "应用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Filters",
                to: "筛选"
            },
            {
                kind: "text",
                match: "exact",
                from: "Reset",
                to: "重置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Discard changes",
                to: "放弃更改"
            },
            {
                kind: "text",
                match: "exact",
                from: "Submit",
                to: "提交"
            }
        ];

        module.exports = { commonDictionary };
        },
    "src/dicts/dns.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const dnsRules = [
            {
                kind: "text",
                match: "exact",
                from: "Manage DNS and nameservers of your network.",
                to: "管理你网络的 DNS 和名称服务器。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailnet DNS name",
                to: "Tailnet DNS 名称"
            },
            {
                kind: "text",
                match: "exact",
                from: "This unique name is used when registering DNS entries, sharing your device to other tailnets, and issuing TLS certificates.",
                to: "此唯一名称用于注册 DNS 条目、将你的设备共享到其他 tailnet，以及签发 TLS 证书。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Rename tailnet...",
                to: "重命名 tailnet..."
            },
            {
                kind: "text",
                match: "exact",
                from: "Control device and user access to your third-party applications, without requiring any end user configuration.",
                to: "无需终端用户进行任何配置，即可控制设备和用户对第三方应用的访问。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage in Apps",
                to: "在应用页管理"
            },
            {
                kind: "text",
                match: "exact",
                from: "Nameservers",
                to: "名称服务器"
            },
            {
                kind: "text",
                match: "exact",
                from: "Set the nameservers used by devices on your network to resolve DNS queries.",
                to: "设置网络中设备用于解析 DNS 查询的名称服务器。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Global nameservers",
                to: "全局名称服务器"
            },
            {
                kind: "text",
                match: "exact",
                from: "Override DNS servers",
                to: "覆盖 DNS 服务器"
            },
            {
                kind: "text",
                match: "exact",
                from: "Local DNS settings",
                to: "本地 DNS 设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add nameserver",
                to: "添加名称服务器"
            },
            {
                kind: "text",
                match: "exact",
                from: "Search Domains",
                to: "搜索域"
            },
            {
                kind: "text",
                match: "exact",
                from: "Set custom DNS search domains. With MagicDNS enabled, your tailnet domain is always the first search domain.",
                to: "设置自定义 DNS 搜索域。启用 MagicDNS 后，你的 tailnet 域始终是第一个搜索域。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add search domain...",
                to: "添加搜索域..."
            },
            {
                kind: "text",
                match: "exact",
                from: "Automatically register domain names for devices in your tailnet. This lets you to use a machine’s name instead of its IP address.",
                to: "自动为 tailnet 中的设备注册域名。这样你可以使用设备名称而不是 IP 地址。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Disable MagicDNS…",
                to: "禁用 MagicDNS…"
            },
            {
                kind: "text",
                match: "exact",
                from: "HTTPS Certificates",
                to: "HTTPS 证书"
            },
            {
                kind: "text",
                match: "exact",
                from: "Allow users to provision HTTPS certificates for their devices.",
                to: "允许用户为其设备申请 HTTPS 证书。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Enable HTTPS...",
                to: "启用 HTTPS..."
            },
            {
                kind: "text",
                match: "exact",
                from: "Disable HTTPS...",
                to: "禁用 HTTPS..."
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Rename (.+)$",
                replace: "重命名 $1"
            },
            {
                kind: "text",
                match: "exact",
                from: "Renaming your tailnet may break existing links to devices in your tailnet.",
                to: "重命名 tailnet 可能会破坏现有指向你 tailnet 设备的链接。"
            },
            {
                kind: "text",
                match: "exact",
                from: "You will need to reissue HTTPS certificates using the new tailnet name. The name of any machine for which you obtain a HTTPS certificate, including the new tailnet name, will be published in a public ledger from which it cannot be removed.",
                to: "你需要使用新的 tailnet 名称重新签发 HTTPS 证书。任何你为其申请 HTTPS 证书的设备名称，包括新的 tailnet 名称，都会发布到一个无法移除的公共账本中。"
            },
            {
                kind: "text",
                match: "exact",
                from: "I understand, let me rename the tailnet",
                to: "我已了解，让我重命名 tailnet"
            },
            {
                kind: "text",
                match: "exact",
                from: "Google Public DNS 8.8.8.8",
                to: "Google 公共 DNS 8.8.8.8"
            },
            {
                kind: "text",
                match: "exact",
                from: "Cloudflare Public DNS 1.1.1.1",
                to: "Cloudflare 公共 DNS 1.1.1.1"
            },
            {
                kind: "text",
                match: "exact",
                from: "Quad9 Public DNS 9.9.9.9",
                to: "Quad9 公共 DNS 9.9.9.9"
            },
            {
                kind: "text",
                match: "exact",
                from: "Mullvad Public DNS 194.242.2.2",
                to: "Mullvad 公共 DNS 194.242.2.2"
            },
            {
                kind: "text",
                match: "exact",
                from: "NextDNS DoH",
                to: "NextDNS DoH"
            },
            {
                kind: "text",
                match: "exact",
                from: "Control D DoH",
                to: "Control D DoH"
            },
            {
                kind: "text",
                match: "exact",
                from: "Custom…",
                to: "自定义…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add search domain",
                to: "添加搜索域"
            },
            {
                kind: "text",
                match: "exact",
                from: "The search domain can only contain alphanumeric lowercase characters, hyphens, and periods.",
                to: "搜索域只能包含小写字母数字字符、短横线和句点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Disable MagicDNS?",
                to: "禁用 MagicDNS？"
            },
            {
                kind: "text",
                match: "exact",
                from: "Users of your network will no longer be able to use short names to access devices over Tailscale.",
                to: "你网络中的用户将无法再通过简短名称访问 Tailscale 上的设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Disable MagicDNS",
                to: "禁用 MagicDNS"
            }
        ];
        const dnsDictionary = [
            ...adminShellDictionary,
            ...dnsRules
        ];

        module.exports = { dnsDictionary };
        },
    "src/dicts/home.ts": (module, exports, require) => {
        const homeDictionary = [
            {
                kind: "text",
                match: "exact",
                from: "Connect all your devices securely.",
                to: "安全连接你的所有设备。"
            }
        ];

        module.exports = { homeDictionary };
        },
    "src/dicts/login.ts": (module, exports, require) => {
        const loginDictionary = [
            {
                kind: "text",
                match: "regex",
                pattern: "^Continue with (.+)$",
                replace: "使用 $1 继续"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="email"]',
                attr: "placeholder",
                from: "Email",
                to: "邮箱"
            }
        ];

        module.exports = { loginDictionary };
        },
    "src/dicts/logs.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const logRules = [
            {
                kind: "text",
                match: "exact",
                from: "Configure and explore logs and events within your tailnet.",
                to: "配置并查看 tailnet 内的日志和事件。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Configuration logs",
                to: "配置日志"
            },
            {
                kind: "text",
                match: "exact",
                from: "Network flow logs",
                to: "网络流量日志"
            },
            {
                kind: "text",
                match: "exact",
                from: "Inspect logs of changes made to your tailnet’s configuration settings during the last 90 days.",
                to: "查看过去 90 天内对 tailnet 配置设置所做更改的日志。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Not streaming",
                to: "未流式传输"
            },
            {
                kind: "text",
                match: "exact",
                from: "Start streaming…",
                to: "开始流式传输…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Timeframe:",
                to: "时间范围："
            },
            {
                kind: "text",
                match: "exact",
                from: "Action",
                to: "操作"
            },
            {
                kind: "text",
                match: "exact",
                from: "Actor",
                to: "执行者"
            },
            {
                kind: "text",
                match: "exact",
                from: "Target",
                to: "目标"
            },
            {
                kind: "text",
                match: "exact",
                from: "TIMESTAMP (LOCAL TIME)",
                to: "时间戳（本地时间）"
            },
            {
                kind: "text",
                match: "exact",
                from: "Timestamp (Local Time)",
                to: "时间戳（本地时间）"
            },
            {
                kind: "text",
                match: "exact",
                from: "ACTION",
                to: "操作"
            },
            {
                kind: "text",
                match: "exact",
                from: "ACTOR",
                to: "执行者"
            },
            {
                kind: "text",
                match: "exact",
                from: "TARGET",
                to: "目标"
            },
            {
                kind: "text",
                match: "exact",
                from: "Log in to admin console",
                to: "登录管理控制台"
            },
            {
                kind: "text",
                match: "exact",
                from: "Admin console",
                to: "管理控制台"
            },
            {
                kind: "text",
                match: "exact",
                from: "Enable key expiry for node",
                to: "为设备启用密钥过期"
            },
            {
                kind: "text",
                match: "exact",
                from: "Disable key expiry for node",
                to: "为设备禁用密钥过期"
            },
            {
                kind: "text",
                match: "exact",
                from: "Export logs",
                to: "导出日志"
            },
            {
                kind: "text",
                match: "exact",
                from: "Logs of network activity between devices in your tailnet.",
                to: "tailnet 中设备之间网络活动的日志。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Not logging",
                to: "未记录"
            },
            {
                kind: "text",
                match: "exact",
                from: "Start logging…",
                to: "开始记录…"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "[placeholder]",
                attr: "placeholder",
                from: "Search actions...",
                to: "搜索操作..."
            },
            {
                kind: "attr",
                match: "exact",
                selector: "input",
                attr: "aria-label",
                from: "Search actions...",
                to: "搜索操作..."
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "aria-label",
                from: "Export logs data",
                to: "导出日志数据"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "title",
                from: "Export logs data",
                to: "导出日志数据"
            }
        ];
        const logsDictionary = [
            ...adminShellDictionary,
            ...logRules
        ];

        module.exports = { logsDictionary };
        },
    "src/dicts/machines.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const machineRules = [
            {
                kind: "text",
                match: "exact",
                from: "Machines",
                to: "设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage the devices connected to your tailnet.",
                to: "管理连接到你的 tailnet 的设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Learn more",
                to: "了解更多"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add device",
                to: "添加设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Filters",
                to: "筛选"
            },
            {
                kind: "text",
                match: "exact",
                from: "Property",
                to: "属性"
            },
            {
                kind: "text",
                match: "exact",
                from: "Shared",
                to: "共享"
            },
            {
                kind: "text",
                match: "exact",
                from: "Disabled",
                to: "已禁用"
            },
            {
                kind: "text",
                match: "exact",
                from: "OS Version",
                to: "操作系统版本"
            },
            {
                kind: "text",
                match: "exact",
                from: "Operating system",
                to: "操作系统"
            },
            {
                kind: "text",
                match: "exact",
                from: "Auto-update",
                to: "自动更新"
            },
            {
                kind: "text",
                match: "exact",
                from: "machines",
                to: "台设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Machine",
                to: "设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Addresses",
                to: "地址"
            },
            {
                kind: "text",
                match: "exact",
                from: "Version",
                to: "版本"
            },
            {
                kind: "text",
                match: "exact",
                from: "Last Seen",
                to: "最后在线"
            },
            {
                kind: "text",
                match: "exact",
                from: "Machines action menu",
                to: "设备操作"
            },
            {
                kind: "text",
                match: "exact",
                from: "Connected",
                to: "已连接"
            },
            {
                kind: "text",
                match: "exact",
                from: "Expiry disabled",
                to: "已禁用密钥过期"
            },
            {
                kind: "text",
                match: "exact",
                from: "Previous",
                to: "上一页"
            },
            {
                kind: "text",
                match: "exact",
                from: "Next",
                to: "下一页"
            },
            {
                kind: "text",
                match: "exact",
                from: "All Machines",
                to: "所有设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Machine settings",
                to: "设备设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Managed by",
                to: "管理者"
            },
            {
                kind: "text",
                match: "exact",
                from: "Subnets",
                to: "子网"
            },
            {
                kind: "text",
                match: "exact",
                from: "Subnets let you expose physical network routes onto Tailscale.",
                to: "子网允许你将物理网络路由暴露到 Tailscale。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^This machine does not expose any\\s+routes\\.$",
                replace: "此设备未暴露任何路由。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Routing Settings",
                to: "路由设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Let this device route traffic for your tailnet.",
                to: "允许此设备为你的 tailnet 转发流量。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Exit Node",
                to: "出口节点"
            },
            {
                kind: "text",
                match: "exact",
                from: "Not Allowed",
                to: "不允许"
            },
            {
                kind: "text",
                match: "exact",
                from: "Whether this machine can act as an exit node for your tailnet.",
                to: "此设备是否可作为你 tailnet 的出口节点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit",
                to: "编辑"
            },
            {
                kind: "text",
                match: "exact",
                from: "Apps",
                to: "应用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Machine Details",
                to: "设备详情"
            },
            {
                kind: "text",
                match: "exact",
                from: "Information about this machine’s network. Used to debug connection issues.",
                to: "关于此设备网络的信息，用于调试连接问题。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Creator",
                to: "创建者"
            },
            {
                kind: "text",
                match: "exact",
                from: "OS hostname",
                to: "操作系统主机名"
            },
            {
                kind: "text",
                match: "exact",
                from: "OS",
                to: "操作系统"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailscale version",
                to: "Tailscale 版本"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node key",
                to: "节点密钥"
            },
            {
                kind: "text",
                match: "exact",
                from: "Created",
                to: "创建时间"
            },
            {
                kind: "text",
                match: "exact",
                from: "Last seen",
                to: "最后在线"
            },
            {
                kind: "text",
                match: "exact",
                from: "Key expiry",
                to: "密钥过期"
            },
            {
                kind: "text",
                match: "exact",
                from: "When tagged, a machine\u2019s permissions change from matching its creator\u2019s to what is defined in the tailnet policy file.",
                to: "打标签后，设备的权限会从匹配其创建者，变为由 tailnet 策略文件中定义的内容。"
            },
            {
                kind: "text",
                match: "exact",
                from: "This machine routes traffic for these apps.",
                to: "此设备为这些应用转发流量。"
            },
            {
                kind: "text",
                match: "exact",
                from: "This machine\u2019s IPv6 address within your tailnet (your private Tailscale network). Connections within your tailnet support IPv6 even if your ISP does not.",
                to: "此设备在你 tailnet（私有 Tailscale 网络）内的 IPv6 地址。即使你的 ISP 不支持，tailnet 内的连接也支持 IPv6。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Whether the machine is behind a difficult NAT that varies the machine\u2019s IP address depending on the destination.",
                to: "设备是否位于困难 NAT 之后，导致其 IP 地址随目标不同而变化。"
            },
            {
                kind: "text",
                match: "exact",
                from: "OS hostname is published by the machine\u2019s operating system and is used as the default name for the machine.",
                to: "操作系统主机名由设备的操作系统发布，并用作设备的默认名称。"
            },
            {
                kind: "text",
                match: "exact",
                from: "This machine\u2019s IPv4 address within your tailnet (your private Tailscale network).",
                to: "此设备在你 tailnet（私有 Tailscale 网络）内的 IPv4 地址。"
            },
            {
                kind: "text",
                match: "exact",
                from: "This machine\u2019s candidate IP addresses and port numbers (local and public) that peer devices can use to try to connect to it directly.",
                to: "对等设备可尝试直接连接此设备时使用的候选 IP 地址和端口号（本地与公网）。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Users of your tailnet, and those you\u2019ve shared this device with, can use this DNS name to access this machine.",
                to: "tailnet 用户以及你共享此设备的用户，可使用此 DNS 名称访问此设备。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: `When tagged, a machine[\\u2019']s permissions change from matching its creator[\\u2019']s to what is defined in the tailnet policy file\\.`,
                replace: "打标签后，设备的权限会从匹配其创建者，变为由 tailnet 策略文件中定义的内容。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "OS hostname is published by the machine[\\u2019']s operating system and is used as the default name for the machine\\.",
                replace: "操作系统主机名由设备的操作系统发布，并用作设备的默认名称。"
            },
            {
                kind: "text",
                match: "exact",
                from: "The machine name may differ from the OS hostname if it conflicts with a machine already on the network or has manually been renamed by an admin.",
                to: "若与网络上已有设备冲突，或管理员手动重命名，设备名称可能与操作系统主机名不同。"
            },
            {
                kind: "text",
                match: "exact",
                from: "ID for this machine. Used in the Tailscale API.",
                to: "此设备的 ID，用于 Tailscale API。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Public key which uniquely identifies this machine.",
                to: "唯一标识此设备的公钥。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "This machine[\\u2019']s IPv4 address within your tailnet \\(your private Tailscale network\\)\\.",
                replace: "此设备在你 tailnet（私有 Tailscale 网络）内的 IPv4 地址。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "This machine[\\u2019']s IPv6 address within your tailnet \\(your private Tailscale network\\)\\. Connections within your tailnet support IPv6 even if your ISP does not\\.",
                replace: "此设备在你 tailnet（私有 Tailscale 网络）内的 IPv6 地址。即使你的 ISP 不支持，tailnet 内的连接也支持 IPv6。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Users of your tailnet can use this DNS short name to access this machine.",
                to: "tailnet 用户可使用此 DNS 短名称访问此设备。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Users of your tailnet, and those you[\\u2019']ve shared this device with, can use this DNS name to access this machine\\.",
                replace: "tailnet 用户以及你共享此设备的用户，可使用此 DNS 名称访问此设备。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "This machine[\\u2019']s candidate IP addresses and port numbers \\(local and public\\) that peer devices can use to try to connect to it directly\\.",
                replace: "对等设备可尝试直接连接此设备时使用的候选 IP 地址和端口号（本地与公网）。"
            },
            {
                kind: "text",
                match: "exact",
                from: "The last time this machine was connected to the Tailscale control plane.",
                to: "此设备上次连接到 Tailscale 控制平面的时间。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Whether the machine is behind a difficult NAT that varies the machine[\\u2019']s IP address depending on the destination\\.",
                replace: "设备是否位于困难 NAT 之后，导致其 IP 地址随目标不同而变化。"
            },
            {
                kind: "text",
                match: "exact",
                from: "No certificate found. This either means that no certificate was generated, or the file containing the certificate has been moved.",
                to: "未找到证书。这可能表示未生成证书，或包含证书的文件已被移动。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Latency from Tailscale relay (DERP) servers, used when machines cannot connect peer-to-peer. Checkmark indicates preferred relays.",
                to: "来自 Tailscale 中继（DERP）服务器的延迟，在设备无法点对点连接时使用。勾号表示首选中继。"
            },
            {
                kind: "text",
                match: "exact",
                from: "ATTRIBUTES",
                to: "属性"
            },
            {
                kind: "text",
                match: "exact",
                from: "Attributes",
                to: "属性"
            },
            {
                kind: "text",
                match: "exact",
                from: "RELAYS",
                to: "中继"
            },
            {
                kind: "text",
                match: "exact",
                from: "Relays",
                to: "中继"
            },
            {
                kind: "text",
                match: "exact",
                from: "Latency",
                to: "延迟"
            },
            {
                kind: "text",
                match: "exact",
                from: "ADDRESSES",
                to: "地址"
            },
            {
                kind: "text",
                match: "exact",
                from: "Short domain",
                to: "短域名"
            },
            {
                kind: "text",
                match: "exact",
                from: "Full domain",
                to: "完整域名"
            },
            {
                kind: "text",
                match: "exact",
                from: "CLIENT CONNECTIVITY",
                to: "客户端连通性"
            },
            {
                kind: "text",
                match: "exact",
                from: "Client Connectivity",
                to: "客户端连通性"
            },
            {
                kind: "text",
                match: "exact",
                from: "Varies",
                to: "视情况而定"
            },
            {
                kind: "text",
                match: "exact",
                from: "No",
                to: "否"
            },
            {
                kind: "text",
                match: "exact",
                from: "Yes",
                to: "是"
            },
            {
                kind: "text",
                match: "exact",
                from: "TLS CERTIFICATE",
                to: "TLS 证书"
            },
            {
                kind: "text",
                match: "exact",
                from: "TLS Certificate",
                to: "TLS 证书"
            },
            {
                kind: "text",
                match: "exact",
                from: "Domain",
                to: "域名"
            },
            {
                kind: "text",
                match: "exact",
                from: "Status",
                to: "状态"
            },
            {
                kind: "text",
                match: "exact",
                from: "Valid",
                to: "有效"
            },
            {
                kind: "text",
                match: "exact",
                from: "until",
                to: "至"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^(\\d+) month(?:s)? from now$",
                replace: "$1 个月后"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^(\\d+) day(?:s)? from now$",
                replace: "$1 天后"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^(\\d+) hour(?:s)? from now$",
                replace: "$1 小时后"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^(\\d+) minute(?:s)? from now$",
                replace: "$1 分钟后"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^(\\d+) year(?:s)? from now$",
                replace: "$1 年后"
            },
            {
                kind: "text",
                match: "exact",
                from: "Endpoints Alpha version",
                to: "端点 Alpha 版本"
            },
            {
                kind: "text",
                match: "exact",
                from: "Endpoints",
                to: "端点"
            },
            {
                kind: "text",
                match: "exact",
                from: "Live endpoints running on this machine.",
                to: "此设备上正在运行的实时端点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "This machine is not reporting any endpoints.",
                to: "此设备未上报任何端点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add devices to your network",
                to: "向你的网络添加设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailscale works best when it’s installed on multiple devices. Explore what you can do with Tailscale in these environments.",
                to: "Tailscale 在安装到多台设备后效果最佳。探索你可以在这些环境中用 Tailscale 做什么。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Operating systems",
                to: "操作系统"
            },
            {
                kind: "text",
                match: "exact",
                from: "Cloud providers",
                to: "云服务提供商"
            },
            {
                kind: "text",
                match: "exact",
                from: "Containers",
                to: "容器"
            },
            {
                kind: "text",
                match: "exact",
                from: "See more",
                to: "查看更多"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add AWS VM",
                to: "添加 AWS 虚拟机"
            },
            {
                kind: "text",
                match: "exact",
                from: "Linux server",
                to: "Linux 服务器"
            },
            {
                kind: "text",
                match: "exact",
                from: "Use this for services running on VMs, containers, and functions",
                to: "用于运行在虚拟机、容器和函数中的服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Client device",
                to: "客户端设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Use this for user-owned client devices like macOS, Windows, Linux, iOS, and Android",
                to: "用于 macOS、Windows、Linux、iOS 和 Android 等用户自有客户端设备"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^To add a new device to your tailnet, install Tailscale on that device and log in as\\s*$",
                replace: "要将新设备添加到你的 tailnet，请在该设备上安装 Tailscale，并登录为 "
            },
            {
                kind: "text",
                match: "exact",
                from: "Email link",
                to: "邮件链接"
            },
            {
                kind: "text",
                match: "exact",
                from: "Copy link",
                to: "复制链接"
            },
            {
                kind: "text",
                match: "exact",
                from: "Read guide",
                to: "阅读指南"
            },
            {
                kind: "text",
                match: "exact",
                from: "Input code",
                to: "输入代码"
            },
            {
                kind: "text",
                match: "exact",
                from: "Send",
                to: "发送"
            },
            {
                kind: "text",
                match: "exact",
                from: "We’ll only use it to send you the install link and nothing else.",
                to: "我们只会用它向你发送安装链接，不作其他用途。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Copy",
                to: "复制"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Requires\\s*$",
                replace: "需要"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^\\s*or later\\.$",
                replace: "或更高版本。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Download and install the Tailscale client using one of the following options:",
                to: "使用以下任一方式下载并安装 Tailscale 客户端："
            },
            {
                kind: "text",
                match: "exact",
                from: "Standalone variant",
                to: "独立版本"
            },
            {
                kind: "text",
                match: "exact",
                from: "from the Tailscale package server (recommended).",
                to: "来自 Tailscale 软件包服务器（推荐）。"
            },
            {
                kind: "text",
                match: "exact",
                from: "variant. The Tailscale client is free to download, but downloading any app from the Mac App Store may require an Apple ID with a valid credit card attached.",
                to: "版本。Tailscale 客户端可免费下载，但从 Mac App Store 下载任何应用都可能需要绑定有效信用卡的 Apple ID。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Follow the Tailscale onboarding flow, which will guide you to install the Tailscale VPN configuration.",
                to: "按照 Tailscale 引导流程完成安装，它会指导你安装 Tailscale VPN 配置。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Sign in with your identity provider.",
                to: "使用你的身份提供商登录。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Update available",
                to: "有可用更新"
            },
            {
                kind: "text",
                match: "exact",
                from: "Patch release",
                to: "补丁版本"
            },
            {
                kind: "text",
                match: "exact",
                from: "is available.",
                to: "可用。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Read the release notes",
                to: "查看发布说明"
            },
            {
                kind: "text",
                match: "exact",
                from: "to find out what’s new!",
                to: "了解更新内容！"
            },
            {
                kind: "text",
                match: "exact",
                from: "Security update available",
                to: "有安全更新"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^This machine is running a version with a known security vulnerability\\. It’s recommended to update to (.+)\\.$",
                replace: "此设备运行的版本存在已知安全漏洞。建议更新到 $1。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Update recommended",
                to: "建议更新"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^This machine is (.+) versions out of date\\. Version (.+) is available, and it is recommended to update\\.$",
                replace: "此设备已落后 $1 个版本。版本 $2 已可用，建议尽快更新。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Start update",
                to: "开始更新"
            },
            {
                kind: "text",
                match: "exact",
                from: "Updating",
                to: "更新中"
            },
            {
                kind: "text",
                match: "exact",
                from: "Updated",
                to: "已更新"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^On\\s*$",
                replace: "在 "
            },
            {
                kind: "text",
                match: "exact",
                from: "On macOS, update Tailscale from the Mac App Store’s “Updates” page.",
                to: "在 macOS 上，请通过 Mac App Store 的“更新”页面更新 Tailscale。"
            },
            {
                kind: "text",
                match: "exact",
                from: ", update Tailscale from the Mac App Store’s “Updates” page.",
                to: " 上，请通过 Mac App Store 的“更新”页面更新 Tailscale。"
            },
            {
                kind: "text",
                match: "exact",
                from: "On Android, update Tailscale from the Play Store’s “Update” page. By default, apps will auto-update.",
                to: "在 Android 上，请通过 Play Store 的“更新”页面更新 Tailscale。默认情况下，应用会自动更新。"
            },
            {
                kind: "text",
                match: "exact",
                from: ", update Tailscale from the Play Store’s “Update” page. By default, apps will auto-update.",
                to: " 上，请通过 Play Store 的“更新”页面更新 Tailscale。默认情况下，应用会自动更新。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit machine name…",
                to: "编辑设备名称…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit machine IPv4…",
                to: "编辑设备 IPv4…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Share…",
                to: "分享…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Enable key expiry",
                to: "启用密钥过期"
            },
            {
                kind: "text",
                match: "exact",
                from: "Disable key expiry",
                to: "禁用密钥过期"
            },
            {
                kind: "text",
                match: "exact",
                from: "View recent activity",
                to: "查看最近活动"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit route settings…",
                to: "编辑路由设置…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit ACL tags…",
                to: "编辑 ACL 标签…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Remove…",
                to: "移除…"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Edit machine name for (.+)$",
                replace: "编辑 $1 的设备名称"
            },
            {
                kind: "text",
                match: "exact",
                from: "This name is shown in the admin panel",
                to: "此名称会显示在管理面板中"
            },
            {
                kind: "text",
                match: "exact",
                from: ", in Tailscale clients, and used when generating MagicDNS names.",
                to: "、Tailscale 客户端中，并在生成 MagicDNS 名称时使用。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Auto-generate from OS hostname",
                to: "根据操作系统主机名自动生成"
            },
            {
                kind: "text",
                match: "exact",
                from: "Machine name",
                to: "设备名称"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^This machine\\s*$",
                replace: "此设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "is",
                to: "可"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^\\s*accessible as$",
                replace: "通过"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^\\s*using MagicDNS\\.$",
                replace: " 使用 MagicDNS 访问。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Cancel",
                to: "取消"
            },
            {
                kind: "text",
                match: "exact",
                from: "Update name",
                to: "更新名称"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Edit machine IP for (.+)$",
                replace: "编辑 $1 的设备 IP"
            },
            {
                kind: "text",
                match: "exact",
                from: "This is the IP address that will be used to connect to this machine.",
                to: "这是用于连接到此设备的 IP 地址。"
            },
            {
                kind: "text",
                match: "exact",
                from: "This action will break any existing connections to this machine. You will need to reconnect to this machine using the new IP address. You may also need to flush your DNS cache.",
                to: "此操作会中断到此设备的任何现有连接。你需要使用新的 IP 地址重新连接到此设备。你可能还需要刷新 DNS 缓存。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Machine IP",
                to: "设备 IP"
            },
            {
                kind: "text",
                match: "exact",
                from: "Update IP",
                to: "更新 IP"
            },
            {
                kind: "text",
                match: "exact",
                from: "Share machine",
                to: "分享设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Share access to",
                to: "将"
            },
            {
                kind: "text",
                match: "exact",
                from: "with external users, as allowed by ACLs. If you need multiple users in the same tailnet to access it, or if you want to share more than one machine with a user, invite users to your tailnet instead.",
                to: "分享给外部用户，前提是 ACL 允许。如果你需要同一 tailnet 中的多个用户访问它，或者想把多台设备共享给某个用户，请改为邀请用户加入你的 tailnet。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Share via email",
                to: "通过电子邮件分享"
            },
            {
                kind: "text",
                match: "exact",
                from: "Copy share link",
                to: "复制分享链接"
            },
            {
                kind: "text",
                match: "exact",
                from: "Share",
                to: "分享"
            },
            {
                kind: "text",
                match: "exact",
                from: "You can use commas to separate multiple email recipients.",
                to: "你可以使用逗号分隔多个邮箱收件人。"
            },
            {
                kind: "text",
                match: "exact",
                from: "No external users have access",
                to: "没有外部用户拥有访问权限"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Edit route settings of (.+)$",
                replace: "编辑 $1 的路由设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Subnet routes",
                to: "子网路由"
            },
            {
                kind: "text",
                match: "exact",
                from: "Connect to devices you can’t install Tailscale on by advertising IP ranges as subnet routes.",
                to: "通过将 IP 范围发布为子网路由，连接那些无法安装 Tailscale 的设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "This machine does not expose any routes.",
                to: "此设备未暴露任何路由。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Exit node",
                to: "出口节点"
            },
            {
                kind: "text",
                match: "exact",
                from: "Allow your network to route internet traffic through this machine.",
                to: "允许你的网络通过此设备转发互联网流量。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Use as exit node",
                to: "用作出口节点"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "This device does not advertise itself as an exit node\\. Re-run tailscale up with the --advertise-exit-node flag to enable this option\\.",
                replace: "此设备未声明自身为出口节点。请重新运行 tailscale up，并使用 --advertise-exit-node 参数以启用此选项。"
            },
            {
                kind: "text",
                match: "exact",
                from: "This device does not advertise itself as an exit node. Re-run ",
                to: "此设备未声明自身为出口节点。请重新运行 "
            },
            {
                kind: "text",
                match: "exact",
                from: " flag to enable this option.",
                to: " 参数以启用此选项。"
            },
            {
                kind: "text",
                match: "exact",
                from: " with the ",
                to: "，并使用 "
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage tags in Access Controls",
                to: "在访问控制页管理标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "Save",
                to: "保存"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Edit ACL tags for (.+)$",
                replace: "编辑 $1 的 ACL 标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "Assigning tags will change the ownership of",
                to: "分配标签会将"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^\\s*from$",
                replace: "的所有权从"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^\\s*to the tag\\(s\\) you select\\. Make sure to update your ACLs accordingly\\.$",
                replace: "更改为你选择的标签。请确保同时更新你的 ACL。"
            },
            {
                kind: "text",
                match: "exact",
                from: "No tags defined. Define tags from the Access Controls page",
                to: "尚未定义任何标签。请在访问控制页面定义标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "No tags defined. Define tags from the Access controls page",
                to: "尚未定义任何标签。请在访问控制页面定义标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage access to this machine by adding and removing tags. If you want a user to own this device, have them reauthenticate it. Make sure to update your ACLs accordingly.",
                to: "通过添加和移除标签来管理对此设备的访问权限。若要让用户拥有此设备，请让其重新进行身份验证。请确保相应地更新你的 ACL。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Manage access to this machine by adding and removing tags\\. If you want a user to own this device, have them reauthenticate it\\. Make sure to update your ACLs accordingly\\.$",
                replace: "通过添加和移除标签来管理对此设备的访问权限。若要让用户拥有此设备，请让其重新进行身份验证。请确保相应地更新你的 ACL。"
            },
            {
                kind: "text",
                match: "exact",
                from: "You can\u2019t save your changes because the only way to remove all tags from a machine is to reauthenticate it. The user who reauthenticates the machine will become its manager.",
                to: "你无法保存更改，因为要从设备上移除所有标签的唯一方式是重新进行身份验证。重新验证该设备的用户将成为其管理者。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^You can[\u2019']t save your changes because the only way to remove all tags from a machine is to reauthenticate it\\. The user who reauthenticates the machine will become its manager\\.$",
                replace: "你无法保存更改，因为要从设备上移除所有标签的唯一方式是重新进行身份验证。重新验证该设备的用户将成为其管理者。"
            },
            {
                kind: "text",
                match: "exact",
                from: "This tag was deleted from the tailnet policy file, but never removed from this machine. It does not affect access anymore, and can be removed safely.",
                to: "此标签已从 tailnet 策略文件中删除，但从未从此设备上移除。它已不再影响访问，可以安全移除。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^This tag was deleted from the tailnet policy file, but never removed from this machine\\. It does not affect access anymore, and can be removed safely\\.$",
                replace: "此标签已从 tailnet 策略文件中删除，但从未从此设备上移除。它已不再影响访问，可以安全移除。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Go to Access Controls",
                to: "前往访问控制"
            },
            {
                kind: "text",
                match: "exact",
                from: "Go to Access controls",
                to: "前往访问控制"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailscale SSH quickstart",
                to: "Tailscale SSH 快速入门"
            },
            {
                kind: "text",
                match: "exact",
                from: "SSH quickstart",
                to: "SSH 快速入门"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailscale makes it easy to SSH to txy from other devices on your tailnet - here\u2019s how to get started.",
                to: "Tailscale 可让你从 tailnet 中的其他设备轻松 SSH 到 txy — 以下是入门步骤。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailscale makes it easy to SSH to txy from other devices on your tailnet - here's how to get started.",
                to: "Tailscale 可让你从 tailnet 中的其他设备轻松 SSH 到 txy — 以下是入门步骤。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Tailscale makes it easy to SSH to (.+) from other devices on your tailnet [-\u2014] here[\u2019']s how to get started\\.$",
                replace: "Tailscale 可让你从 tailnet 中的其他设备轻松 SSH 到 $1 — 以下是入门步骤。"
            },
            {
                kind: "text",
                match: "exact",
                from: "For more details, read the",
                to: "更多详情，请参阅"
            },
            {
                kind: "text",
                match: "exact",
                from: "full Tailscale SSH docs",
                to: "完整 Tailscale SSH 文档"
            },
            {
                kind: "text",
                match: "exact",
                from: "Enable Tailscale SSH",
                to: "启用 Tailscale SSH"
            },
            {
                kind: "text",
                match: "exact",
                from: "On txy, run this command. It tells the Tailscale daemon to handle incoming SSH on port 22.",
                to: "在 txy 上运行此命令。它会告诉 Tailscale 守护进程处理 22 端口的传入 SSH 连接。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^On (.+), run this command\\. It tells the Tailscale daemon to handle incoming SSH on port 22\\.$",
                replace: "在 $1 上运行此命令。它会告诉 Tailscale 守护进程处理 22 端口的传入 SSH 连接。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Allow SSH in your tailnet policy",
                to: "在 tailnet 策略中允许 SSH"
            },
            {
                kind: "text",
                match: "exact",
                from: "Your tailnet policy file needs a rule that permits SSH between your devices. Click below to add the default rule that lets every member SSH to their own devices.",
                to: "你的 tailnet 策略文件需要一条允许设备间 SSH 的规则。点击下方可添加默认规则，允许每位成员 SSH 到自己的设备。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Your tailnet policy file needs a rule that permits SSH between your devices\\. Click below to add the default rule that lets every member SSH to their own devices\\.$",
                replace: "你的 tailnet 策略文件需要一条允许设备间 SSH 的规则。点击下方可添加默认规则，允许每位成员 SSH 到自己的设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailscale SSH is already allowed by your policy file.",
                to: "Tailscale SSH 已在你策略文件中允许。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Connect",
                to: "连接"
            },
            {
                kind: "text",
                match: "exact",
                from: "From another device on your tailnet, run this command to SSH into txy.",
                to: "在 tailnet 中的另一台设备上运行此命令，以 SSH 连接到 txy。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^From another device on your tailnet, run this command to SSH into (.+)\\.$",
                replace: "在 tailnet 中的另一台设备上运行此命令，以 SSH 连接到 $1。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Going further",
                to: "进一步探索"
            },
            {
                kind: "text",
                match: "exact",
                from: "Other ways to get more out of Tailscale SSH:",
                to: "充分利用 Tailscale SSH 的其他方式："
            },
            {
                kind: "text",
                match: "exact",
                from: "Use Check mode to re-authenticate with your IdP on a schedule before SSH sessions",
                to: "使用检查模式，在 SSH 会话前按计划通过 IdP 重新进行身份验证"
            },
            {
                kind: "text",
                match: "exact",
                from: "Record SSH sessions to a recorder node for auditing and compliance purposes",
                to: "将 SSH 会话录制到记录节点，用于审计与合规"
            },
            {
                kind: "text",
                match: "exact",
                from: "SSH to open a terminal from the admin console without needing a local client",
                to: "从管理控制台 SSH 打开终端，无需本地客户端"
            },
            {
                kind: "text",
                match: "exact",
                from: "Scope SSH by user, group, tag, or destination instead of the default allow-self rule",
                to: "按用户、群组、标签或目标限制 SSH 范围，而非使用默认的 allow-self 规则"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Remove (?!machine$)(.+)$",
                replace: "移除 $1"
            },
            {
                kind: "text",
                match: "exact",
                from: "This machine will permanently be removed from your network. To re-add it, you will need to re-authenticate to your tailnet from the device.",
                to: "此设备将从你的网络中被永久移除。若要重新添加它，你需要在设备上重新向 tailnet 完成身份验证。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Hold\\s*$",
                replace: "按住"
            },
            {
                kind: "text",
                match: "exact",
                from: "the Option key",
                to: "Option 键"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^\\s*while clicking “Remove” to skip this confirmation\\.$",
                replace: "，再点击“移除”即可跳过此确认。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Remove machine",
                to: "移除设备"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="search"]',
                attr: "placeholder",
                from: "Search by name, owner, tag, version...",
                to: "按名称、所有者、标签、版本搜索..."
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Search by name, owner, tag, version...",
                to: "按名称、所有者、标签、版本搜索..."
            },
            {
                kind: "attr",
                match: "exact",
                selector: "a",
                attr: "aria-label",
                from: "Read documentation about Machines",
                to: "查看设备文档"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "a",
                attr: "aria-label",
                from: "Read documentation about subnet routers",
                to: "查看子网路由器文档"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "a",
                attr: "aria-label",
                from: "Read documentation about route",
                to: "查看路由文档"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "a",
                attr: "aria-label",
                from: "Read documentation about services",
                to: "查看服务文档"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "aria-label",
                from: "Export devices data",
                to: "导出设备数据"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "title",
                from: "Export devices data",
                to: "导出设备数据"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "aria-label",
                from: "See all addresses for this device.",
                to: "查看此设备的所有地址"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "a",
                attr: "aria-label",
                pattern: "^Detail view for (.+)$",
                replace: "$1 的详情页"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "a",
                attr: "aria-label",
                pattern: "^Update available for (.+)$",
                replace: "$1 有可用更新"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "svg",
                attr: "aria-label",
                pattern: "^Update available for (.+)$",
                replace: "$1 有可用更新"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "button",
                attr: "aria-label",
                pattern: "^Actions for (.+)$",
                replace: "$1 的操作"
            },
            {
                kind: "attr",
                match: "regex",
                selector: "button",
                attr: "aria-label",
                pattern: "^Share (.+)$",
                replace: "分享 $1"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "img",
                attr: "alt",
                from: "Preferred Relay",
                to: "首选中继"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "svg",
                attr: "aria-label",
                from: "Preferred Relay",
                to: "首选中继"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "div",
                attr: "aria-label",
                from: "Alpha version",
                to: "Alpha 版本"
            }
        ];
        const machinesDictionary = [
            ...adminShellDictionary,
            ...machineRules
        ];

        module.exports = { machinesDictionary };
        },
    "src/dicts/resource-hub.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const resourceHubRules = [
            {
                kind: "text",
                match: "exact",
                from: "Explore what you can do with Tailscale",
                to: "探索你可以用 Tailscale 做什么"
            },
            {
                kind: "text",
                match: "exact",
                from: "I want to...",
                to: "我想要……"
            },
            {
                kind: "text",
                match: "exact",
                from: "Send files to different devices",
                to: "向不同设备发送文件"
            },
            {
                kind: "text",
                match: "exact",
                from: "Access my home network",
                to: "访问我的家庭网络"
            },
            {
                kind: "text",
                match: "exact",
                from: "Host my own cloud storage",
                to: "自托管我的云存储"
            },
            {
                kind: "text",
                match: "exact",
                from: "Install Tailscale on my Apple TV",
                to: "在我的 Apple TV 上安装 Tailscale"
            },
            {
                kind: "text",
                match: "exact",
                from: "Other",
                to: "其他"
            },
            {
                kind: "text",
                match: "exact",
                from: "Taildrop allows you to share files seamlessly with any of your devices.",
                to: "Taildrop 让你可以在任意设备之间无缝共享文件。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Read guide",
                to: "阅读指南"
            },
            {
                kind: "text",
                match: "exact",
                from: "Taildrop lets you send files between your personal devices on a Tailscale network (known as a tailnet).",
                to: "Taildrop 让你可以在 Tailscale 网络（即 tailnet）中的个人设备之间发送文件。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Was this helpful?",
                to: "这对你有帮助吗？"
            },
            {
                kind: "text",
                match: "exact",
                from: "Yes",
                to: "是"
            },
            {
                kind: "text",
                match: "exact",
                from: "No",
                to: "否"
            },
            {
                kind: "text",
                match: "exact",
                from: "I’m not interested in this use case",
                to: "我对这个使用场景不感兴趣"
            }
        ];
        const resourceHubDictionary = [
            ...adminShellDictionary,
            ...resourceHubRules
        ];

        module.exports = { resourceHubDictionary };
        },
    "src/dicts/services.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const serviceRules = [
            {
                kind: "text",
                match: "exact",
                from: "All Services",
                to: "所有服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Service",
                to: "服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Hosts",
                to: "主机"
            },
            {
                kind: "text",
                match: "exact",
                from: "Endpoints",
                to: "端点"
            },
            {
                kind: "text",
                match: "exact",
                from: "Addresses",
                to: "地址"
            },
            {
                kind: "text",
                match: "exact",
                from: "Machine Name",
                to: "设备名称"
            },
            {
                kind: "text",
                match: "exact",
                from: "Status",
                to: "状态"
            },
            {
                kind: "text",
                match: "exact",
                from: "Short domain",
                to: "短域名"
            },
            {
                kind: "text",
                match: "exact",
                from: "Full domain",
                to: "完整域名"
            },
            {
                kind: "text",
                match: "exact",
                from: "Revoke service host",
                to: "吊销服务主机"
            },
            {
                kind: "text",
                match: "exact",
                from: "Revoke this service host, so that no new connections can be established with it, and taking it out of rotation for connection steering. This will place the service host back in a Needs Approval state.",
                to: "吊销此服务主机，使其无法再建立新连接，并将其从连接引导轮换中移除。此操作会使该服务主机回到「需要审批」状态。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Revoke this service host, so that no new connections can be established with it, and\\s+taking it out of rotation for connection steering\\. This will place the service host back in a Needs Approval state\\.$",
                replace: "吊销此服务主机，使其无法再建立新连接，并将其从连接引导轮换中移除。此操作会使该服务主机回到「需要审批」状态。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device:",
                to: "设备："
            },
            {
                kind: "text",
                match: "exact",
                from: "Managed by:",
                to: "管理者："
            },
            {
                kind: "text",
                match: "exact",
                from: "Ports:",
                to: "端口："
            },
            {
                kind: "text",
                match: "exact",
                from: "Revoke",
                to: "吊销"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit",
                to: "编辑"
            },
            {
                kind: "text",
                match: "exact",
                from: "Remove",
                to: "移除"
            },
            {
                kind: "text",
                match: "exact",
                from: "Remove this Service from your tailnet. Hosts will continue to advertise and serve.",
                to: "从你的 tailnet 移除此服务。主机仍会继续发布并提供服务。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Remove this Service from your tailnet\\. Hosts will continue to advertise and serve\\.$",
                replace: "从你的 tailnet 移除此服务。主机仍会继续发布并提供服务。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Remove Service",
                to: "移除服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "This Service will permanently be removed from your network. To re-add it, you will need to create it and advertise its proper hosts. Type the name of this Service to remove.",
                to: "此服务将从你的网络中被永久移除。若要重新添加，你需要重新创建它并发布其正确的主机。请输入要移除的服务名称以确认。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^This Service will permanently be removed from your network\\. To re-add it, you will need to create it and advertise its proper hosts\\. Type the name of this Service to remove\\.$",
                replace: "此服务将从你的网络中被永久移除。若要重新添加，你需要重新创建它并发布其正确的主机。请输入要移除的服务名称以确认。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Save changes",
                to: "保存更改"
            },
            {
                kind: "text",
                match: "exact",
                from: "Services advertised and discovered within your network.",
                to: "你网络中已发布和已发现的服务。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Advertised",
                to: "已发布"
            },
            {
                kind: "text",
                match: "exact",
                from: "Discovered",
                to: "已发现"
            },
            {
                kind: "text",
                match: "exact",
                from: "Loading endpoints...",
                to: "正在加载端点..."
            },
            {
                kind: "text",
                match: "exact",
                from: "Type",
                to: "类型"
            },
            {
                kind: "text",
                match: "exact",
                from: "User",
                to: "用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Define your first Service",
                to: "定义你的第一个服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Share Services in your tailnet by advertising Services from your devices.",
                to: "通过从设备发布服务，在 tailnet 中共享服务。"
            },
            {
                kind: "text",
                match: "exact",
                from: "1. Define a Service",
                to: "1. 定义服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Name, describe, and give identity to the process or data the Service will provide.",
                to: "为该服务将提供的进程或数据命名、描述并赋予标识。"
            },
            {
                kind: "text",
                match: "exact",
                from: "2. Advertise and serve",
                to: "2. 发布并提供服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "From the host, advertise the Service ports from which it will serve.",
                to: "在主机上发布服务将提供的端口。"
            },
            {
                kind: "text",
                match: "exact",
                from: "3. Approve",
                to: "3. 审批"
            },
            {
                kind: "text",
                match: "exact",
                from: "Review proper configuration and approve each Service’s hosts, manually or automatically.",
                to: "审查正确配置，并手动或自动批准各服务的主机。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Define Service",
                to: "定义服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Back to All Services",
                to: "返回所有服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Define a Service",
                to: "定义服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Service name",
                to: "服务名称"
            },
            {
                kind: "text",
                match: "exact",
                from: "This Service will be available in your tailnet at",
                to: "此服务将在你的 tailnet 中以下列地址提供："
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^This Service will be available in your tailnet at\\s+(.+)$",
                replace: "此服务将在你的 tailnet 中以下列地址提供：$1"
            },
            {
                kind: "text",
                match: "exact",
                from: "Only alphanumeric characters and dashes allowed, max 63 characters.",
                to: "仅允许字母数字和短横线，最多 63 个字符。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Description",
                to: "描述"
            },
            {
                kind: "text",
                match: "exact",
                from: "Max 80 characters",
                to: "最多 80 个字符"
            },
            {
                kind: "text",
                match: "exact",
                from: "Ports",
                to: "端口"
            },
            {
                kind: "text",
                match: "exact",
                from: "Which ports does this Service listen on?",
                to: "此服务监听哪些端口？"
            },
            {
                kind: "text",
                match: "exact",
                from: "Only hosts advertising all listed ports will be eligible candidates.",
                to: "只有发布了全部所列端口的主机才会成为候选项。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Service tags",
                to: "服务标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "ACL tags can be used to identify this Service.",
                to: "可使用 ACL 标签来标识此服务。"
            },
            {
                kind: "text",
                match: "exact",
                from: "No tags assigned.",
                to: "尚未分配标签。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add tags",
                to: "添加标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage tags in Access Controls",
                to: "在访问控制中管理标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "No Services Discovered",
                to: "未发现任何服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "No reported endpoints",
                to: "暂无已上报端点"
            },
            {
                kind: "text",
                match: "exact",
                from: "If your network just turned on endpoint collection, machines may take some time to start sending their endpoints.",
                to: "如果你的网络刚启用端点收集，设备可能需要一些时间才会开始上报其端点。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^\\s*If your network just turned on endpoint collection, machines may\\s+take some time to start sending their endpoints\\.\\s*$",
                replace: "如果你的网络刚启用端点收集，设备可能需要一些时间才会开始上报其端点。"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "[placeholder]",
                attr: "placeholder",
                from: "Search endpoints...",
                to: "搜索端点..."
            }
        ];
        const servicesDictionary = [
            ...adminShellDictionary,
            ...serviceRules
        ];

        module.exports = { servicesDictionary };
        },
    "src/dicts/settings-shell.ts": (module, exports, require) => {
        const settingsShellDictionary = [
            {
                kind: "text",
                match: "exact",
                from: "Tailnet Settings",
                to: "Tailnet 设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "General",
                to: "常规"
            },
            {
                kind: "text",
                match: "exact",
                from: "User management",
                to: "用户管理"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device management",
                to: "设备管理"
            },
            {
                kind: "text",
                match: "exact",
                from: "Policy file management",
                to: "策略文件管理"
            },
            {
                kind: "text",
                match: "exact",
                from: "Trust credentials",
                to: "受信任凭据"
            },
            {
                kind: "text",
                match: "exact",
                from: "Webhooks",
                to: "Webhook"
            },
            {
                kind: "text",
                match: "exact",
                from: "Contact preferences",
                to: "联系偏好"
            },
            {
                kind: "text",
                match: "exact",
                from: "Billing",
                to: "计费"
            },
            {
                kind: "text",
                match: "exact",
                from: "Personal Settings",
                to: "个人设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "Keys",
                to: "密钥"
            }
        ];

        module.exports = { settingsShellDictionary };
        },
    "src/dicts/settings-billing.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const { settingsShellDictionary } = require("src/dicts/settings-shell.ts");
        const settingsBillingRules = [
            {
                kind: "text",
                match: "exact",
                from: "View and manage your billing plan.",
                to: "查看并管理你的计费方案。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Personal plan",
                to: "个人方案"
            },
            {
                kind: "text",
                match: "exact",
                from: "Contact sales",
                to: "联系销售"
            },
            {
                kind: "text",
                match: "exact",
                from: "Switch plan",
                to: "切换方案"
            },
            {
                kind: "text",
                match: "exact",
                from: "Purchase Mullvad VPN",
                to: "购买 Mullvad VPN"
            },
            {
                kind: "text",
                match: "exact",
                from: "Usage",
                to: "用量"
            },
            {
                kind: "text",
                match: "exact",
                from: "Invoices",
                to: "发票"
            },
            {
                kind: "text",
                match: "exact",
                from: "Billing details",
                to: "计费详情"
            },
            {
                kind: "text",
                match: "exact",
                from: "Seats",
                to: "席位"
            },
            {
                kind: "text",
                match: "exact",
                from: "User devices",
                to: "用户设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Unlimited",
                to: "无限"
            },
            {
                kind: "text",
                match: "exact",
                from: "Seats occupied by users who logged into Tailscale. Users that have been added but never logged in don’t count.",
                to: "已登录 Tailscale 的用户占用的席位。已添加但从未登录的用户不计入。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Learn more about seats",
                to: "了解更多席位信息"
            },
            {
                kind: "text",
                match: "exact",
                from: "Devices owned by users, not tags.",
                to: "由用户拥有的设备，不包括标签拥有的设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tagging a device turns it into a non-user resource, such as a server, NAS, or app connector.",
                to: "为设备打标签会将其变为非用户资源，例如服务器、NAS 或应用连接器。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tagged resources",
                to: "标签资源"
            },
            {
                kind: "text",
                match: "exact",
                from: "Included:",
                to: "包含："
            },
            {
                kind: "text",
                match: "exact",
                from: "Additional:",
                to: "额外："
            },
            {
                kind: "text",
                match: "exact",
                from: "/mo per tagged resource",
                to: "/月/每个标签资源"
            },
            {
                kind: "text",
                match: "exact",
                from: "per tagged resource",
                to: "每个标签资源"
            },
            {
                kind: "text",
                match: "exact",
                from: "Purchase more",
                to: "购买更多"
            },
            {
                kind: "text",
                match: "exact",
                from: "Past invoices",
                to: "历史发票"
            },
            {
                kind: "text",
                match: "exact",
                from: "Invoices from the past 12 months.",
                to: "过去 12 个月的发票。"
            },
            {
                kind: "text",
                match: "exact",
                from: "You have no invoices.",
                to: "你没有发票。"
            },
            {
                kind: "text",
                match: "exact",
                from: "No billing details available.",
                to: "没有可用的计费详情。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Back to billing",
                to: "返回计费"
            },
            {
                kind: "text",
                match: "exact",
                from: "Plans",
                to: "方案"
            },
            {
                kind: "text",
                match: "exact",
                from: "Calculate",
                to: "计算"
            },
            {
                kind: "text",
                match: "exact",
                from: "Payment",
                to: "付款"
            },
            {
                kind: "text",
                match: "exact",
                from: "Upgrade your plan",
                to: "升级你的方案"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add unlimited users and get them connected to all the devices and services they need.",
                to: "添加无限数量的用户，并让他们连接所需的所有设备和服务。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Current plan",
                to: "当前方案"
            },
            {
                kind: "text",
                match: "exact",
                from: "Personal",
                to: "个人"
            },
            {
                kind: "text",
                match: "exact",
                from: "For individuals, families, and friends who want to securely connect devices, servers, or software, for free.",
                to: "适合希望免费安全连接设备、服务器或软件的个人、家庭和朋友。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Free Forever",
                to: "永久免费"
            },
            {
                kind: "text",
                match: "exact",
                from: "Your plan",
                to: "你的方案"
            },
            {
                kind: "text",
                match: "exact",
                from: "Plan highlights",
                to: "方案亮点"
            },
            {
                kind: "text",
                match: "exact",
                from: "Access nearly all of Tailscale’s features",
                to: "使用几乎所有 Tailscale 功能"
            },
            {
                kind: "text",
                match: "exact",
                from: "Unlimited user devices",
                to: "无限用户设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Limited to 6 users",
                to: "最多 6 个用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Up to 3 ACL groups",
                to: "最多 3 个 ACL 组"
            },
            {
                kind: "text",
                match: "exact",
                from: "1,000 mins per month for ephemeral resources",
                to: "临时资源每月 1,000 分钟"
            },
            {
                kind: "text",
                match: "exact",
                from: "Try SSH and Kubernetes features",
                to: "试用 SSH 和 Kubernetes 功能"
            },
            {
                kind: "text",
                match: "exact",
                from: "Use Tailscale for free, indefinitely",
                to: "永久免费使用 Tailscale"
            },
            {
                kind: "text",
                match: "exact",
                from: "Standard",
                to: "标准"
            },
            {
                kind: "text",
                match: "exact",
                from: "For teams looking for a secure network access solution that’s easy to use and deploy.",
                to: "适合需要易用、易部署安全网络访问方案的团队。"
            },
            {
                kind: "text",
                match: "exact",
                from: "per user, per month",
                to: "每用户每月"
            },
            {
                kind: "text",
                match: "exact",
                from: "Upgrade",
                to: "升级"
            },
            {
                kind: "text",
                match: "exact",
                from: "Unlimited users",
                to: "无限用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Up to 10 ACL groups",
                to: "最多 10 个 ACL 组"
            },
            {
                kind: "text",
                match: "exact",
                from: "Configure Tailscale with MDM tools",
                to: "使用 MDM 工具配置 Tailscale"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device posture integrations with MDM, EDR, XDR",
                to: "与 MDM、EDR、XDR 集成设备态势"
            },
            {
                kind: "text",
                match: "exact",
                from: "Deploy users and groups with SCIM",
                to: "使用 SCIM 部署用户和组"
            },
            {
                kind: "text",
                match: "exact",
                from: "Advanced user roles for billing, IT, auditors, and more",
                to: "面向计费、IT、审计等场景的高级用户角色"
            },
            {
                kind: "text",
                match: "exact",
                from: "Premium",
                to: "高级"
            },
            {
                kind: "text",
                match: "exact",
                from: "For organizations who need advanced service and resource level networking, posture management, or heavy ephemeral resources usage.",
                to: "适合需要高级服务与资源级联网、态势管理或大量临时资源用量的组织。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Up to 300 ACL groups",
                to: "最多 300 个 ACL 组"
            },
            {
                kind: "text",
                match: "exact",
                from: "10,000 mins per month for ephemeral resources",
                to: "临时资源每月 10,000 分钟"
            },
            {
                kind: "text",
                match: "exact",
                from: "Just-in-time access to resources",
                to: "资源即时访问"
            },
            {
                kind: "text",
                match: "exact",
                from: "Network flow logs",
                to: "网络流日志"
            },
            {
                kind: "text",
                match: "exact",
                from: "Log streaming",
                to: "日志流式传输"
            },
            {
                kind: "text",
                match: "exact",
                from: "Regional routing and traffic steering",
                to: "区域路由与流量调度"
            },
            {
                kind: "text",
                match: "exact",
                from: "Advanced Tailscale SSH",
                to: "高级 Tailscale SSH"
            },
            {
                kind: "text",
                match: "exact",
                from: "Priority support",
                to: "优先支持"
            },
            {
                kind: "text",
                match: "exact",
                from: "Enterprise",
                to: "企业"
            },
            {
                kind: "text",
                match: "exact",
                from: "For organizations who need extra-large Tailnets, custom terms, robust compliance, or dedicated support.",
                to: "适合需要超大 tailnet、自定义条款、强合规或专属支持的组织。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Custom",
                to: "自定义"
            },
            {
                kind: "text",
                match: "exact",
                from: "Custom device quantities and limits",
                to: "自定义设备数量和限制"
            },
            {
                kind: "text",
                match: "exact",
                from: "Solutions Engineer consultation and implementation assistance",
                to: "解决方案工程师咨询与实施协助"
            },
            {
                kind: "text",
                match: "exact",
                from: "Custom MSA & SLAs",
                to: "自定义 MSA 和 SLA"
            },
            {
                kind: "text",
                match: "exact",
                from: "Dedicated success and support services available",
                to: "可提供专属成功和支持服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Custom pricing and bundling to meet your organization’s needs and budget",
                to: "按组织需求和预算定制价格与组合"
            },
            {
                kind: "text",
                match: "exact",
                from: "Pay by invoice",
                to: "按发票付款"
            },
            {
                kind: "text",
                match: "exact",
                from: "Platform extensions",
                to: "平台扩展"
            },
            {
                kind: "text",
                match: "exact",
                from: "Get more out of Tailscale with optional add-ons by contacting our sales team.",
                to: "联系销售团队，通过可选附加组件充分发挥 Tailscale 的能力。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Privileged Access Management (PAM)",
                to: "特权访问管理 (PAM)"
            },
            {
                kind: "text",
                match: "exact",
                from: "Supercharge your security with granular elevated access control for K8s, SSH, and databases.",
                to: "通过面向 K8s、SSH 和数据库的细粒度提权访问控制增强安全性。"
            },
            {
                kind: "text",
                match: "exact",
                from: "CI/CD connectivity at scale",
                to: "大规模 CI/CD 连接"
            },
            {
                kind: "text",
                match: "exact",
                from: "Secures CI/CD connectivity on the Tailscale platform. Grant ephemeral segmented access, and get rid of long-lived secrets. Secure your managed runners, wherever they are.",
                to: "在 Tailscale 平台上保护 CI/CD 连接。授予临时分段访问权限，摆脱长期密钥，并保护任意位置的托管 runner。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Workload connectivity at scale",
                to: "大规模工作负载连接"
            },
            {
                kind: "text",
                match: "exact",
                from: "Connect across clouds and environments securely, privately, and without complex networking—all on the Tailscale platform.",
                to: "在 Tailscale 平台上安全、私密地跨云和跨环境连接，无需复杂网络配置。"
            },
            {
                kind: "text",
                match: "exact",
                from: "IoT Edge connectivity at scale",
                to: "大规模 IoT 边缘连接"
            },
            {
                kind: "text",
                match: "exact",
                from: "Automate your device fleet management through our platform. Stop manually managing thousands of edge devices and avoid local IP clashes.",
                to: "通过我们的平台自动化设备集群管理，停止手动管理数千台边缘设备并避免本地 IP 冲突。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add-ons",
                to: "附加组件"
            },
            {
                kind: "text",
                match: "exact",
                from: "Additional tagged or ephemeral resources",
                to: "额外标签资源或临时资源"
            },
            {
                kind: "text",
                match: "exact",
                from: "Additional ephemeral resources",
                to: "额外临时资源"
            },
            {
                kind: "text",
                match: "exact",
                from: "Scale your needs beyond the 50 tagged resources or allotted minutes per month for ephemeral resources.",
                to: "将需求扩展到超过 50 个标签资源或每月分配的临时资源分钟数。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Scale your needs beyond the allotted minutes per month for ephemeral resources.",
                to: "按你的需求扩展超出每月分配的临时资源分钟数。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tagged Resources",
                to: "标签资源"
            },
            {
                kind: "text",
                match: "exact",
                from: "Scale your tagged resource capacity beyond the included 50 devices.",
                to: "将标签资源容量扩展到超出包含的 50 台设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Scale your tagged resource capacity beyond the included 50 devices. $1/mo per tagged resource.",
                to: "将标签资源容量扩展到超出包含的 50 台设备。每个标签资源 1 美元/月。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Purchase Tagged Resources",
                to: "购买标签资源"
            },
            {
                kind: "text",
                match: "exact",
                from: "$1 per device per month",
                to: "每台设备每月 1 美元"
            },
            {
                kind: "text",
                match: "exact",
                from: "$1/mo per tagged resource",
                to: "每个标签资源 1 美元/月"
            },
            {
                kind: "text",
                match: "exact",
                from: "Multiple tailnets",
                to: "多个 tailnet"
            },
            {
                kind: "text",
                match: "exact",
                from: "Great option for OEM. Create multiple tailnets under a single organization and IdP. Get separation for testing, development, or automation without adding complexity.",
                to: "适合 OEM。可在单个组织和 IdP 下创建多个 tailnet，为测试、开发或自动化提供隔离且不增加复杂度。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Premium support, dedicated services",
                to: "高级支持与专属服务"
            },
            {
                kind: "text",
                match: "exact",
                from: "Connect across clouds and environments securely, privately, and without complex networking.",
                to: "安全、私密地跨云和跨环境连接，无需复杂网络配置。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Browse the internet privately, and securely with Tailscale and Mullvad.",
                to: "通过 Tailscale 和 Mullvad 私密、安全地浏览互联网。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Browse the internet privately and securely with Tailscale and Mullvad.",
                to: "通过 Tailscale 和 Mullvad 私密、安全地浏览互联网。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Browse the internet privately and securely with Tailscale and Mullvad. $5/mo for every 5 devices.",
                to: "通过 Tailscale 和 Mullvad 私密、安全地浏览互联网。每 5 台设备 5 美元/月。"
            },
            {
                kind: "text",
                match: "exact",
                from: "$5 per month for every 5 devices",
                to: "每 5 台设备每月 5 美元"
            },
            {
                kind: "text",
                match: "exact",
                from: "$5/mo for every 5 devices",
                to: "每 5 台设备 5 美元/月"
            },
            {
                kind: "text",
                match: "exact",
                from: "Get Started",
                to: "开始使用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Looking for specifics?",
                to: "想了解具体细节？"
            },
            {
                kind: "text",
                match: "exact",
                from: "Compare plans in detail",
                to: "详细比较方案"
            },
            {
                kind: "text",
                match: "exact",
                from: "Need help?",
                to: "需要帮助？"
            },
            {
                kind: "text",
                match: "exact",
                from: "Contact support",
                to: "联系支持"
            },
            {
                kind: "text",
                match: "exact",
                from: "Purchase seats",
                to: "购买席位"
            },
            {
                kind: "text",
                match: "exact",
                from: "Seats to purchase",
                to: "要购买的席位数"
            },
            {
                kind: "text",
                match: "exact",
                from: "Currently you have 1 users who would need seats.",
                to: "当前有 1 位用户需要席位。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Frequently asked questions",
                to: "常见问题"
            },
            {
                kind: "text",
                match: "exact",
                from: "Upgrading to",
                to: "升级到"
            },
            {
                kind: "text",
                match: "exact",
                from: "$8 per seat / month",
                to: "每个席位每月 8 美元"
            },
            {
                kind: "text",
                match: "exact",
                from: "$8 × 1 seat",
                to: "8 美元 × 1 个席位"
            },
            {
                kind: "text",
                match: "exact",
                from: "Estimated sales tax",
                to: "预计销售税"
            },
            {
                kind: "text",
                match: "exact",
                from: "Apply promo code",
                to: "应用优惠码"
            },
            {
                kind: "text",
                match: "exact",
                from: "Next payment on",
                to: "下次付款日期"
            },
            {
                kind: "text",
                match: "exact",
                from: "about how Tailscale collects sales tax.",
                to: "了解 Tailscale 如何收取销售税。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Continue to billing details →",
                to: "继续前往计费详情 →"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage add-ons",
                to: "管理附加组件"
            },
            {
                kind: "text",
                match: "exact",
                from: "Select a number of devices that can use Mullvad’s servers as exit nodes. At the end of every billing cycle, you will be billed",
                to: "选择可使用 Mullvad 服务器作为出口节点的设备数量。在每个计费周期结束时，你将按以下数量计费："
            },
            {
                kind: "text",
                match: "exact",
                from: "You will be able to pick which devices can use Mullvad VPN after completing the checkout.",
                to: "完成结账后，你可以选择哪些设备可以使用 Mullvad VPN。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Next billing cycle starts",
                to: "下一计费周期开始于"
            },
            {
                kind: "text",
                match: "exact",
                from: "By clicking continue, you agree to the",
                to: "点击继续即表示你同意"
            },
            {
                kind: "text",
                match: "exact",
                from: "Mullvad VPN Terms For Tailscale Customers",
                to: "面向 Tailscale 客户的 Mullvad VPN 条款"
            }
        ];
        const settingsBillingDictionary = [
            ...adminShellDictionary,
            ...settingsShellDictionary,
            ...settingsBillingRules
        ];

        module.exports = { settingsBillingDictionary };
        },
    "src/dicts/settings-contact-preferences.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const { settingsShellDictionary } = require("src/dicts/settings-shell.ts");
        const settingsContactPreferencesRules = [
            {
                kind: "text",
                match: "exact",
                from: "Define points of contact for different kinds of transactional emails. We will only use these to send essential communications related to the functioning of your tailnet, not marketing-related content. As such, you can’t opt out, and all emails must be verified.",
                to: "为不同类型的事务邮件指定联系人。我们只会用它们发送与 tailnet 运行相关的必要通信，不会发送营销内容。因此你无法选择退出，且所有邮箱都必须完成验证。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Account changes",
                to: "账户变更"
            },
            {
                kind: "text",
                match: "exact",
                from: "Receive communications about important changes to your tailnet.",
                to: "接收有关 tailnet 重要变更的通知。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Configuration issues",
                to: "配置问题"
            },
            {
                kind: "text",
                match: "exact",
                from: "Receive communications about misconfigurations in your tailnet.",
                to: "接收有关 tailnet 配置错误的通知。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Security issues",
                to: "安全问题"
            },
            {
                kind: "text",
                match: "exact",
                from: "Receive communications about security issues affecting your tailnet.",
                to: "接收有关影响你 tailnet 的安全问题通知。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Billing email",
                to: "计费邮箱"
            },
            {
                kind: "text",
                match: "exact",
                from: "Receive communications about billing matters.",
                to: "接收与计费事项有关的通知。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage in Billing",
                to: "在计费页管理"
            }
        ];
        const settingsContactPreferencesDictionary = [
            ...adminShellDictionary,
            ...settingsShellDictionary,
            ...settingsContactPreferencesRules
        ];

        module.exports = { settingsContactPreferencesDictionary };
        },
    "src/dicts/settings-device-management.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const { settingsShellDictionary } = require("src/dicts/settings-shell.ts");
        const settingsDeviceManagementRules = [
            {
                kind: "text",
                match: "exact",
                from: "Manage your tailnet device settings.",
                to: "管理你的 tailnet 设备设置。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device Approval",
                to: "设备审批"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Require new devices to be approved by admins before\\s+they can access the network\\.",
                replace: "要求新设备在访问网络前先由管理员审批。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manually approve new devices",
                to: "手动审批新设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailnet Lock",
                to: "Tailnet Lock"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Manually verify every new device added to your network\\s+without trusting Tailscale’s coordination server\\.",
                replace: "在不信任 Tailscale 协调服务器的情况下，手动验证每一台新加入网络的设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Enable tailnet lock…",
                to: "启用 tailnet lock…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Key Expiry",
                to: "密钥过期"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Set the number of days a device can stay logged in\\s+to Tailscale before it needs to re-authenticate with Google\\.",
                replace: "设置设备在重新通过 Google 身份验证前可保持登录 Tailscale 的天数。"
            },
            {
                kind: "text",
                match: "exact",
                from: "days",
                to: "天"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Must be between\\s+1\\s+and\\s+180\\s+days\\.$",
                replace: "必须在 1 到 180 天之间。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Auto-update Tailscale",
                to: "自动更新 Tailscale"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Default new devices on your network to automatically update to the latest Tailscale version\\. Existing devices are unaffected, but can opt-in from their settings or via MDM\\.",
                replace: "默认让网络中的新设备自动更新到最新 Tailscale 版本。现有设备不受影响，但可在各自设置中或通过 MDM 选择加入。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Auto-update new devices",
                to: "自动更新新设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device Posture Integrations Standard",
                to: "设备状态集成 Standard"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device Posture Integrations",
                to: "设备状态集成"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Enable integrations to use third-party device attributes as part of device postures along with other device properties\\.",
                replace: "启用集成，以便将第三方设备属性与其他设备属性一起用作设备状态的一部分。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device Identity Collection",
                to: "设备身份信息收集"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Collect device identity information \\(e\\.g\\. serial numbers\\) for use in third-party and custom device posture integrations\\.",
                replace: "收集设备身份信息（如序列号），供第三方和自定义设备状态集成使用。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Disabled",
                to: "已禁用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Integrations",
                to: "集成"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Synchronize device posture attributes from third-party systems like CrowdStrike, Microsoft Intune, Jamf Pro, and more\\.",
                replace: "从 CrowdStrike、Microsoft Intune、Jamf Pro 等第三方系统同步设备状态属性。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add an integration...",
                to: "添加集成..."
            },
            {
                kind: "text",
                match: "exact",
                from: "Posture Conditions",
                to: "状态条件"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Use srcPosture in your ACL rules to restrict access from devices with non-compliant posture\\.",
                replace: "在 ACL 规则中使用 srcPosture 来限制来自不合规设备的访问。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage in Access Controls",
                to: "在访问控制页管理"
            },
            {
                kind: "text",
                match: "exact",
                from: "← Back to device management",
                to: "← 返回设备管理"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add a device posture integration",
                to: "添加设备状态集成"
            },
            {
                kind: "text",
                match: "exact",
                from: "Standard",
                to: "标准版"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device posture integrations synchronize data from third-party systems, which can be used as device attributes in your policy file.",
                to: "设备状态集成会同步来自第三方系统的数据，这些数据可在你的策略文件中用作设备属性。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Continue",
                to: "继续"
            }
        ];
        const settingsDeviceManagementDictionary = [
            ...adminShellDictionary,
            ...settingsShellDictionary,
            ...settingsDeviceManagementRules
        ];

        module.exports = { settingsDeviceManagementDictionary };
        },
    "src/dicts/settings-general.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const { settingsShellDictionary } = require("src/dicts/settings-shell.ts");
        const settingsGeneralRules = [
            {
                kind: "text",
                match: "exact",
                from: "Manage your tailnet account settings.",
                to: "管理你的 tailnet 账户设置。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Unique IDs",
                to: "唯一 ID"
            },
            {
                kind: "text",
                match: "exact",
                from: "A unique ID to identify this tailnet in API calls.",
                to: "用于在 API 调用中识别此 tailnet 的唯一 ID。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Display",
                to: "显示"
            },
            {
                kind: "text",
                match: "exact",
                from: "Set a display name to easily recognize this tailnet.",
                to: "设置显示名称以便更容易识别此 tailnet。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Regional Routing",
                to: "区域路由"
            },
            {
                kind: "text",
                match: "exact",
                from: "Regional Routing Premium",
                to: "区域路由 Premium"
            },
            {
                kind: "text",
                match: "exact",
                from: "Premium",
                to: "高级版"
            },
            {
                kind: "text",
                match: "exact",
                from: "Route traffic to the closest available subnet router or app connector region. Available on the Premium plan and above.",
                to: "将流量路由到最近可用的子网路由器或应用连接器区域。Premium 及以上套餐可用。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Allow users to provision HTTPS certificates for their devices.",
                to: "允许用户为其设备申请 HTTPS 证书。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Feature previews",
                to: "功能预览"
            },
            {
                kind: "text",
                match: "exact",
                from: "Get early access to features. Feature previews are available for testing, but still in development. Please",
                to: "提前体验新功能。功能预览可用于测试，但仍在开发中。请"
            },
            {
                kind: "text",
                match: "exact",
                from: "share feedback",
                to: "分享反馈"
            },
            {
                kind: "text",
                match: "exact",
                from: "on how we could make them work better.",
                to: "告诉我们如何把它们做得更好。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Beta",
                to: "测试版"
            },
            {
                kind: "text",
                match: "exact",
                from: "Alpha",
                to: "内测版"
            },
            {
                kind: "text",
                match: "exact",
                from: "Paid add-on",
                to: "付费附加项"
            },
            {
                kind: "text",
                match: "exact",
                from: "Allow users on your network to use Mullvad VPN endpoints as exit-nodes.",
                to: "允许你网络中的用户将 Mullvad VPN 节点用作出口节点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Send Files",
                to: "发送文件"
            },
            {
                kind: "text",
                match: "exact",
                from: "Allow users on your network to send files between their own devices using Taildrop, Tailscale’s built-in file sharing feature.",
                to: "允许你网络中的用户使用 Tailscale 内置文件共享功能 Taildrop，在自己的设备之间发送文件。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Allow users on your network to send files between their\\s+own devices using Taildrop, Tailscale’s built-in file sharing feature\\.$",
                replace: "允许你网络中的用户使用 Tailscale 内置文件共享功能 Taildrop，在自己的设备之间发送文件。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Services Collection",
                to: "服务收集"
            },
            {
                kind: "text",
                match: "exact",
                from: "Collect and display information about services running on your network in the admin panel.",
                to: "在管理面板中收集并显示网络中运行的服务信息。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Collect and display information about services running\\s+on your network in the admin panel\\.$",
                replace: "在管理面板中收集并显示网络中运行的服务信息。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Redesigned MacOS Client UI",
                to: "重新设计的 macOS 客户端界面"
            },
            {
                kind: "text",
                match: "exact",
                from: "Enable the redesigned macOS client with a dedicated windowed interface. Find devices and exit nodes faster with search, get clearer connectivity error messages, and easily access features like Taildrop and ping. Requires Tailscale v1.88 or later.",
                to: "启用重新设计的 macOS 客户端，使用专属窗口式界面。通过搜索更快找到设备和出口节点，获得更清晰的连接错误信息，并更方便地访问 Taildrop 和 ping 等功能。需要 Tailscale v1.88 或更高版本。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Allow users on your network to route traffic from the wider internet to their Tailscale nodes.",
                to: "允许你网络中的用户将更广泛互联网的流量路由到其 Tailscale 节点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Public IP addresses for device posture",
                to: "设备态势的公共IP地址"
            },
            {
                kind: "text",
                match: "exact",
                from: "Use the public IP address a device uses to connect to Tailscale as a Device Posture attribute.",
                to: "将设备用于连接Tailscale的公共IP地址用作设备态势属性。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Allow users on your network to route traffic from the wider\\s+internet to their Tailscale nodes\\.$",
                replace: "允许你网络中的用户将更广泛互联网的流量路由到其 Tailscale 节点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Delete tailnet",
                to: "删除 tailnet"
            },
            {
                kind: "text",
                match: "exact",
                from: "Permanently delete this tailnet. This action cannot be undone.",
                to: "永久删除此 tailnet。此操作无法撤销。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Delete tailnet…",
                to: "删除 tailnet…"
            }
        ];
        const settingsGeneralDictionary = [
            ...adminShellDictionary,
            ...settingsShellDictionary,
            ...settingsGeneralRules
        ];

        module.exports = { settingsGeneralDictionary };
        },
    "src/dicts/settings-keys.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const { settingsShellDictionary } = require("src/dicts/settings-shell.ts");
        const settingsKeysRules = [
            {
                kind: "text",
                match: "exact",
                from: "View and manage your Auth keys and API access tokens.",
                to: "查看并管理你的 Auth key 和 API 访问令牌。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Your private device keys are not included here: they are always private, stay on your device, and are never shared with Tailscale.",
                to: "你的私有设备密钥不包含在这里：它们始终保持私有，留在你的设备上，且从不与 Tailscale 共享。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Auth keys",
                to: "Auth key"
            },
            {
                kind: "text",
                match: "exact",
                from: "Authenticate devices without an interactive login.",
                to: "在无需交互式登录的情况下验证设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Generate auth key…",
                to: "生成 Auth key…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Generate auth key",
                to: "生成 Auth key"
            },
            {
                kind: "text",
                match: "exact",
                from: "You don’t have any auth keys yet",
                to: "你还没有任何 Auth key"
            },
            {
                kind: "text",
                match: "exact",
                from: "API access tokens",
                to: "API 访问令牌"
            },
            {
                kind: "text",
                match: "exact",
                from: "Access tokens give access to the Tailscale API.",
                to: "访问令牌可用于访问 Tailscale API。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Generate access token…",
                to: "生成访问令牌…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Generate API access token",
                to: "生成 API 访问令牌"
            },
            {
                kind: "text",
                match: "exact",
                from: "You don’t have any access tokens yet",
                to: "你还没有任何访问令牌"
            },
            {
                kind: "text",
                match: "exact",
                from: "Description",
                to: "描述"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add an optional description for the key.",
                to: "为密钥添加可选描述。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Reusable",
                to: "可重复使用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Use this key to authenticate more than one device.",
                to: "使用此密钥验证多台设备。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Number of days until this auth key expires\\. This will not affect the\\s+node key expiry\\s+of any machine authenticated with this auth key\\.",
                replace: "此 auth key 过期前的天数。这不会影响任何通过此 auth key 认证设备的节点密钥过期。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Number of days until this auth key expires\\. This will not affect the\\s*$",
                replace: "此 auth key 过期前的天数。这不会影响任何通过此 auth key 认证设备的"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^\\s*of any machine authenticated with this auth key\\.$",
                replace: "。"
            },
            {
                kind: "text",
                match: "exact",
                from: "node key expiry",
                to: "节点密钥过期"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Must be between\\s+1\\s+and\\s+90\\s+days\\.$",
                replace: "必须在 1 到 90 天之间。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device Settings",
                to: "设备设置"
            },
            {
                kind: "text",
                match: "exact",
                from: "These settings will apply to any devices authenticated using this key.",
                to: "这些设置将应用于使用此密钥验证的所有设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Ephemeral",
                to: "临时"
            },
            {
                kind: "text",
                match: "exact",
                from: "Devices authenticated by this key will be automatically removed after going offline.",
                to: "通过此密钥验证的设备在离线后将自动移除。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tags",
                to: "标签"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Devices authenticated by this key will be automatically tagged\\. This will also disable\\s+node key expiry\\s+for the device\\.",
                replace: "通过此密钥验证的设备将自动打标签。这也会禁用该设备的节点密钥过期。"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Devices authenticated by this key will be automatically tagged\\. This will also disable\\s*$",
                replace: "通过此密钥验证的设备将自动打标签。这也会禁用该设备的"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^\\s*for the device\\.$",
                replace: "。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Generate key",
                to: "生成密钥"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manage tags in Access Controls",
                to: "在访问控制页管理标签"
            },
            {
                kind: "text",
                match: "exact",
                from: "Expiration",
                to: "过期"
            },
            {
                kind: "text",
                match: "exact",
                from: "Number of days this key is valid for.",
                to: "此密钥的有效天数。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Generate access token",
                to: "生成访问令牌"
            }
        ];
        const settingsKeysDictionary = [
            ...adminShellDictionary,
            ...settingsShellDictionary,
            ...settingsKeysRules
        ];

        module.exports = { settingsKeysDictionary };
        },
    "src/dicts/settings-policy-file-management.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const { settingsShellDictionary } = require("src/dicts/settings-shell.ts");
        const settingsPolicyFileManagementRules = [
            {
                kind: "text",
                match: "exact",
                from: "Manage how your policy file is maintained.",
                to: "管理你的策略文件维护方式。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Lock editor",
                to: "锁定编辑器"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Prevent users from editing policies in the admin console to avoid conflicts with external management workflows like GitOps or Terraform\\.",
                replace: "防止用户在管理控制台中编辑策略，以避免与 GitOps 或 Terraform 等外部管理流程冲突。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Prevent edits in the admin console",
                to: "禁止在管理控制台中编辑"
            },
            {
                kind: "text",
                match: "exact",
                from: "External reference",
                to: "外部引用"
            },
            {
                kind: "text",
                match: "exact",
                from: "Link to your external tailnet policy definition or management solution.",
                to: "链接到你的外部 tailnet 策略定义或管理方案。"
            }
        ];
        const settingsPolicyFileManagementDictionary = [
            ...adminShellDictionary,
            ...settingsShellDictionary,
            ...settingsPolicyFileManagementRules
        ];

        module.exports = { settingsPolicyFileManagementDictionary };
        },
    "src/dicts/settings-trust-credentials.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const { settingsShellDictionary } = require("src/dicts/settings-shell.ts");
        const settingsTrustCredentialsRules = [
            {
                kind: "text",
                match: "exact",
                from: "New credential",
                to: "新建凭据"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create an interactive login token for a shared resource",
                to: "为共享资源创建交互式登录令牌"
            },
            {
                kind: "text",
                match: "exact",
                from: "Set up a trust relationship with another service provider",
                to: "与另一个服务提供方建立信任关系"
            },
            {
                kind: "text",
                match: "exact",
                from: "Description",
                to: "描述"
            },
            {
                kind: "text",
                match: "exact",
                from: "optional",
                to: "可选"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Description\\s+\\(optional\\)$",
                replace: "描述（可选）"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "^Description\\s+optional$",
                replace: "描述（可选）"
            },
            {
                kind: "text",
                match: "exact",
                from: "Description (optional)",
                to: "描述（可选）"
            },
            {
                kind: "text",
                match: "exact",
                from: "Continue",
                to: "继续"
            },
            {
                kind: "text",
                match: "exact",
                from: "Provide fine grained access to the Tailscale API using OAuth or OIDC tokens.",
                to: "使用 OAuth 或 OIDC 令牌为 Tailscale API 提供细粒度访问控制。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Client ID",
                to: "客户端 ID"
            },
            {
                kind: "text",
                match: "exact",
                from: "Type",
                to: "类型"
            },
            {
                kind: "text",
                match: "exact",
                from: "Updated",
                to: "已更新"
            },
            {
                kind: "text",
                match: "exact",
                from: "Scopes",
                to: "作用域"
            },
            {
                kind: "text",
                match: "exact",
                from: "Trust credentials action menu",
                to: "受信任凭据操作菜单"
            },
            {
                kind: "text",
                match: "exact",
                from: "You do not have any trust credentials",
                to: "你还没有任何受信任凭据"
            },
            {
                kind: "text",
                match: "exact",
                from: "Create a new trust credential",
                to: "创建新的受信任凭据"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "input",
                attr: "placeholder",
                from: "Search by issuer, description, id...",
                to: "按签发方、描述、ID 搜索..."
            },
            {
                kind: "attr",
                match: "exact",
                selector: "input",
                attr: "placeholder",
                from: "Internal reference only",
                to: "仅供内部参考"
            }
        ];
        const settingsTrustCredentialsDictionary = [
            ...adminShellDictionary,
            ...settingsShellDictionary,
            ...settingsTrustCredentialsRules
        ];

        module.exports = { settingsTrustCredentialsDictionary };
        },
    "src/dicts/settings-user-management.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const { settingsShellDictionary } = require("src/dicts/settings-shell.ts");
        const settingsUserManagementRules = [
            {
                kind: "text",
                match: "exact",
                from: "Manage your tailnet user settings.",
                to: "管理你的 tailnet 用户设置。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Identity Provider",
                to: "身份提供商"
            },
            {
                kind: "text",
                match: "exact",
                from: "How users log in to your tailnet.",
                to: "用户如何登录到你的 tailnet。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Contact support",
                to: "联系支持"
            },
            {
                kind: "text",
                match: "exact",
                from: "to change this.",
                to: "以更改此项。"
            },
            {
                kind: "text",
                match: "exact",
                from: "User Approval",
                to: "用户审批"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Require new users to be approved by admins before\\s+they can access the network\\.",
                replace: "要求新用户在访问网络前先由管理员审批。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Manually approve new users",
                to: "手动审批新用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Admin Console Session Timeout",
                to: "管理控制台会话超时"
            },
            {
                kind: "text",
                match: "regex",
                pattern: "Users with access to the Admin console will be logged out\\s+after this time period of inactivity\\.",
                replace: "可访问管理控制台的用户在此时长未活动后将被登出。"
            },
            {
                kind: "text",
                match: "exact",
                from: "36 hours",
                to: "36 小时"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit",
                to: "编辑"
            }
        ];
        const settingsUserManagementDictionary = [
            ...adminShellDictionary,
            ...settingsShellDictionary,
            ...settingsUserManagementRules
        ];

        module.exports = { settingsUserManagementDictionary };
        },
    "src/dicts/settings-webhooks.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const { settingsShellDictionary } = require("src/dicts/settings-shell.ts");
        const settingsWebhooksRules = [
            {
                kind: "text",
                match: "exact",
                from: "Get notified of changes and misconfigurations in your tailnet.",
                to: "在你的 tailnet 发生变更或配置错误时接收通知。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Endpoints",
                to: "端点"
            },
            {
                kind: "text",
                match: "exact",
                from: "View and manage endpoints.",
                to: "查看并管理端点。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Add endpoint...",
                to: "添加端点..."
            },
            {
                kind: "text",
                match: "exact",
                from: "Add endpoint",
                to: "添加端点"
            },
            {
                kind: "text",
                match: "exact",
                from: "You don’t have any endpoints yet",
                to: "你还没有任何端点"
            },
            {
                kind: "text",
                match: "exact",
                from: "Webhook URL",
                to: "Webhook URL"
            },
            {
                kind: "text",
                match: "exact",
                from: "Events selected below will trigger an HTTPS POST request to this URL.",
                to: "下方选择的事件会触发一个发送到此 URL 的 HTTPS POST 请求。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Destination",
                to: "目标平台"
            },
            {
                kind: "text",
                match: "exact",
                from: "optional",
                to: "可选"
            },
            {
                kind: "text",
                match: "exact",
                from: "If selected, we’ll send your webhook events in the format expected by your destination.",
                to: "如果选择了目标平台，我们会按该平台期望的格式发送 webhook 事件。"
            },
            {
                kind: "text",
                match: "exact",
                from: "None",
                to: "无"
            },
            {
                kind: "text",
                match: "exact",
                from: "Events",
                to: "事件"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailnet Management",
                to: "Tailnet 管理"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node was created.",
                to: "节点已创建。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node needs approval.",
                to: "节点需要批准。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node was approved.",
                to: "节点已批准。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node key expiring in less than one day.",
                to: "节点密钥将在一天内过期。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node key recently expired.",
                to: "节点密钥刚刚过期。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node was deleted.",
                to: "节点已删除。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node needs a signature.",
                to: "节点需要签名。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Node was signed.",
                to: "节点已签名。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Tailnet policy file updated.",
                to: "Tailnet 策略文件已更新。"
            },
            {
                kind: "text",
                match: "exact",
                from: "User was created.",
                to: "用户已创建。"
            },
            {
                kind: "text",
                match: "exact",
                from: "User needs approval.",
                to: "用户需要批准。"
            },
            {
                kind: "text",
                match: "exact",
                from: "User was suspended.",
                to: "用户已停用。"
            },
            {
                kind: "text",
                match: "exact",
                from: "User was restored.",
                to: "用户已恢复。"
            },
            {
                kind: "text",
                match: "exact",
                from: "User was deleted.",
                to: "用户已删除。"
            },
            {
                kind: "text",
                match: "exact",
                from: "User was approved.",
                to: "用户已批准。"
            },
            {
                kind: "text",
                match: "exact",
                from: "User role changed.",
                to: "用户角色已变更。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Device Misconfigurations",
                to: "设备配置错误"
            },
            {
                kind: "text",
                match: "exact",
                from: "Subnet has IP forwarding disabled.",
                to: "子网未启用 IP 转发。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Exit node has IP forwarding disabled.",
                to: "出口节点未启用 IP 转发。"
            }
        ];
        const settingsWebhooksDictionary = [
            ...adminShellDictionary,
            ...settingsShellDictionary,
            ...settingsWebhooksRules
        ];

        module.exports = { settingsWebhooksDictionary };
        },
    "src/dicts/users.ts": (module, exports, require) => {
        const { adminShellDictionary } = require("src/dicts/admin-shell.ts");
        const userRules = [
            {
                kind: "text",
                match: "exact",
                from: "Manage the users in your network and their permissions.",
                to: "管理你网络中的用户及其权限。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Status",
                to: "状态"
            },
            {
                kind: "text",
                match: "exact",
                from: "Role",
                to: "角色"
            },
            {
                kind: "text",
                match: "exact",
                from: "Needs Approval",
                to: "需要审批"
            },
            {
                kind: "text",
                match: "exact",
                from: "Invited",
                to: "已邀请"
            },
            {
                kind: "text",
                match: "exact",
                from: "Idle",
                to: "空闲"
            },
            {
                kind: "text",
                match: "exact",
                from: "Suspended",
                to: "已暂停"
            },
            {
                kind: "text",
                match: "exact",
                from: "No status",
                to: "无状态"
            },
            {
                kind: "text",
                match: "exact",
                from: "Occupying a seat",
                to: "占用席位"
            },
            {
                kind: "text",
                match: "exact",
                from: "Not occupying a seat",
                to: "未占用席位"
            },
            {
                kind: "text",
                match: "exact",
                from: "Admin",
                to: "管理员"
            },
            {
                kind: "text",
                match: "exact",
                from: "Network admin",
                to: "网络管理员"
            },
            {
                kind: "text",
                match: "exact",
                from: "IT admin",
                to: "IT 管理员"
            },
            {
                kind: "text",
                match: "exact",
                from: "Auditor",
                to: "审计员"
            },
            {
                kind: "text",
                match: "exact",
                from: "Billing admin",
                to: "计费管理员"
            },
            {
                kind: "text",
                match: "exact",
                from: "user",
                to: "用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "users",
                to: "用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Invite users",
                to: "邀请用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "You can invite users by generating an invite link to share with them.",
                to: "你可以生成邀请链接并分享给用户，以邀请他们加入。"
            },
            {
                kind: "text",
                match: "exact",
                from: "You can invite",
                to: "你可以邀请用户，方法是"
            },
            {
                kind: "text",
                match: "exact",
                from: "users by generating an invite link to share with them.",
                to: "生成邀请链接并分享给他们。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Invite external users",
                to: "邀请外部用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Invite external user",
                to: "邀请外部用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "Invite users to join this tailnet and access its machines, as allowed by ACLs. If you only want to give a user access to one machine, share the machine instead.",
                to: "邀请用户加入此 tailnet，并按 ACL 允许访问其中的设备。如果你只想让某个用户访问一台设备，请改为分享该设备。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Available seats",
                to: "可用席位"
            },
            {
                kind: "text",
                match: "exact",
                from: "Once an invited user joins the tailnet, they will occupy a seat.",
                to: "受邀用户一旦加入 tailnet，就会占用一个席位。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Learn more about seats",
                to: "了解席位"
            },
            {
                kind: "text",
                match: "exact",
                from: "Copy invite link",
                to: "复制邀请链接"
            },
            {
                kind: "text",
                match: "exact",
                from: "Invite via email",
                to: "通过电子邮件邀请"
            },
            {
                kind: "text",
                match: "exact",
                from: "Select role",
                to: "选择角色"
            },
            {
                kind: "text",
                match: "exact",
                from: "Signing up via the link will grant this role.",
                to: "通过该链接注册将获得此角色。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Member",
                to: "成员"
            },
            {
                kind: "text",
                match: "exact",
                from: "Approval is required",
                to: "需要审批"
            },
            {
                kind: "text",
                match: "exact",
                from: "Invited users can only join after being approved by an admin.",
                to: "受邀用户只有在管理员批准后才能加入。"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit in Settings",
                to: "在设置中编辑"
            },
            {
                kind: "text",
                match: "exact",
                from: "User",
                to: "用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "USER",
                to: "用户"
            },
            {
                kind: "text",
                match: "exact",
                from: "ROLE",
                to: "角色"
            },
            {
                kind: "text",
                match: "exact",
                from: "Joined",
                to: "加入时间"
            },
            {
                kind: "text",
                match: "exact",
                from: "JOINED",
                to: "加入时间"
            },
            {
                kind: "text",
                match: "exact",
                from: "Last seen",
                to: "最后在线"
            },
            {
                kind: "text",
                match: "exact",
                from: "LAST SEEN",
                to: "最后在线"
            },
            {
                kind: "text",
                match: "exact",
                from: "Users action menu",
                to: "用户操作"
            },
            {
                kind: "text",
                match: "exact",
                from: "USERS ACTION MENU",
                to: "用户操作"
            },
            {
                kind: "text",
                match: "exact",
                from: "Owner",
                to: "所有者"
            },
            {
                kind: "text",
                match: "exact",
                from: "View devices",
                to: "查看设备"
            },
            {
                kind: "text",
                match: "exact",
                from: "View recent activity",
                to: "查看最近活动"
            },
            {
                kind: "text",
                match: "exact",
                from: "View access control rules",
                to: "查看访问控制规则"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit role…",
                to: "编辑角色…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Edit group membership…",
                to: "编辑群组成员资格…"
            },
            {
                kind: "text",
                match: "exact",
                from: "Delete user…",
                to: "删除用户…"
            },
            {
                kind: "attr",
                match: "exact",
                selector: 'input[type="text"]',
                attr: "placeholder",
                from: "Search users...",
                to: "搜索用户..."
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "aria-label",
                from: "Export users data",
                to: "导出用户数据"
            },
            {
                kind: "attr",
                match: "exact",
                selector: "button",
                attr: "title",
                from: "Export users data",
                to: "导出用户数据"
            }
        ];
        const usersDictionary = [
            ...adminShellDictionary,
            ...userRules
        ];

        module.exports = { usersDictionary };
        },
    "src/dicts/index.ts": (module, exports, require) => {
        const { accessControlsDictionary } = require("src/dicts/access-controls.ts");
        const { appsDictionary } = require("src/dicts/apps.ts");
        const { commonDictionary } = require("src/dicts/common.ts");
        const { dnsDictionary } = require("src/dicts/dns.ts");
        const { homeDictionary } = require("src/dicts/home.ts");
        const { loginDictionary } = require("src/dicts/login.ts");
        const { logsDictionary } = require("src/dicts/logs.ts");
        const { machinesDictionary } = require("src/dicts/machines.ts");
        const { resourceHubDictionary } = require("src/dicts/resource-hub.ts");
        const { servicesDictionary } = require("src/dicts/services.ts");
        const { settingsBillingDictionary } = require("src/dicts/settings-billing.ts");
        const { settingsContactPreferencesDictionary } = require("src/dicts/settings-contact-preferences.ts");
        const { settingsDeviceManagementDictionary } = require("src/dicts/settings-device-management.ts");
        const { settingsGeneralDictionary } = require("src/dicts/settings-general.ts");
        const { settingsKeysDictionary } = require("src/dicts/settings-keys.ts");
        const { settingsPolicyFileManagementDictionary } = require("src/dicts/settings-policy-file-management.ts");
        const { settingsTrustCredentialsDictionary } = require("src/dicts/settings-trust-credentials.ts");
        const { settingsUserManagementDictionary } = require("src/dicts/settings-user-management.ts");
        const { settingsWebhooksDictionary } = require("src/dicts/settings-webhooks.ts");
        const { usersDictionary } = require("src/dicts/users.ts");
        const sharedRules = commonDictionary;
        const pageDictionaries = [
            {
                route: /^\/$/,
                rules: homeDictionary
            },
            {
                route: /^\/login/,
                rules: loginDictionary
            },
            {
                route: /^\/admin\/machines(?:\/[^/]+(?:\/[^/]+)*)?\/?$/,
                rules: machinesDictionary
            },
            {
                route: /^\/admin\/apps\/?$/,
                rules: appsDictionary
            },
            {
                route: /^\/admin\/services(?:\/[^/]+(?:\/[^/]+)*)?\/?$/,
                rules: servicesDictionary
            },
            {
                route: /^\/admin\/users\/?$/,
                rules: usersDictionary
            },
            {
                route: /^\/admin\/acls\/(?:visual\/[^/]+(?:\/[^/]+)*|file|diff|preview)\/?$/,
                rules: accessControlsDictionary
            },
            {
                route: /^\/admin\/logs(?:\/[^/]+)?\/?$/,
                rules: logsDictionary
            },
            {
                route: /^\/admin\/dns\/?$/,
                rules: dnsDictionary
            },
            {
                route: /^\/admin\/settings\/general\/?$/,
                rules: settingsGeneralDictionary
            },
            {
                route: /^\/admin\/settings\/device-management(?:\/[^/]+)*\/?$/,
                rules: settingsDeviceManagementDictionary
            },
            {
                route: /^\/admin\/settings\/policy-file-management\/?$/,
                rules: settingsPolicyFileManagementDictionary
            },
            {
                route: /^\/admin\/settings\/trust-credentials(?:\/[^/]+)*\/?$/,
                rules: settingsTrustCredentialsDictionary
            },
            {
                route: /^\/admin\/settings\/webhooks\/?$/,
                rules: settingsWebhooksDictionary
            },
            {
                route: /^\/admin\/settings\/contact-preferences\/?$/,
                rules: settingsContactPreferencesDictionary
            },
            {
                route: /^\/admin\/settings\/billing(?:\/[^/]+)*\/?$/,
                rules: settingsBillingDictionary
            },
            {
                route: /^\/admin\/settings\/keys(?:\/[^/]+)*\/?$/,
                rules: settingsKeysDictionary
            },
            {
                route: /^\/admin\/settings\/user-management\/?$/,
                rules: settingsUserManagementDictionary
            },
            {
                route: /^\/admin\/resource-hub\/?$/,
                rules: resourceHubDictionary
            }
        ];

        module.exports = { sharedRules, pageDictionaries };
        },
    "src/core/page-detector.ts": (module, exports, require) => {
        const { pageDictionaries, sharedRules } = require("src/dicts/index.ts");
        function resolveRules(pathname) {
            const matchedDictionary = pageDictionaries.find((candidate)=>candidate.route.test(pathname));
            return matchedDictionary ? [
                ...sharedRules,
                ...matchedDictionary.rules
            ] : sharedRules;
        }

        module.exports = { resolveRules };
        },
    "src/core/observer.ts": (module, exports, require) => {
        const OBSERVED_ATTRIBUTES = [
            "aria-label",
            "title",
            "placeholder",
            "data-content"
        ];
        function observeDocument(onMutation) {
            if (!document.body) {
                return null;
            }
            let scheduled = false;
            const observer = new MutationObserver(()=>{
                if (scheduled) {
                    return;
                }
                scheduled = true;
                requestAnimationFrame(()=>{
                    scheduled = false;
                    onMutation();
                });
            });
            const observe = ()=>{
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                    attributes: true,
                    attributeFilter: OBSERVED_ATTRIBUTES
                });
            };
            observe();
            return {
                disconnect () {
                    observer.disconnect();
                },
                reconnect () {
                    observer.disconnect();
                    observe();
                }
            };
        }

        module.exports = { observeDocument };
        },
    "src/core/matcher.ts": (module, exports, require) => {
        function applyTextRules(originalText, rules) {
            for (const rule of rules){
                const nextText = applyTextRule(originalText, rule);
                if (nextText && nextText !== originalText) {
                    return nextText;
                }
            }
            return null;
        }
        function applyAttrRule(originalValue, rule) {
            if (rule.match === "exact") {
                return originalValue === rule.from ? rule.to : null;
            }
            const pattern = new RegExp(rule.pattern, rule.flags);
            return pattern.test(originalValue) ? originalValue.replace(pattern, rule.replace) : null;
        }
        function applyTextRule(originalText, rule) {
            if (rule.match === "exact") {
                const trimmedText = originalText.trim();
                if (trimmedText !== rule.from) {
                    return null;
                }
                return originalText.replace(trimmedText, rule.to);
            }
            const pattern = new RegExp(rule.pattern, rule.flags);
            return pattern.test(originalText) ? originalText.replace(pattern, rule.replace) : null;
        }

        module.exports = { applyTextRules, applyAttrRule };
        },
    "src/core/originals.ts": (module, exports, require) => {
        const textSnapshots = new WeakMap();
        const attrSnapshots = new WeakMap();
        const SKIP_TRANSLATION = Symbol("skip-translation");
        function isSkipTranslation(value) {
            return value === SKIP_TRANSLATION;
        }
        function isTextAlreadyTranslated(node) {
            const snapshot = textSnapshots.get(node);
            if (!snapshot || snapshot.translated === null) {
                return false;
            }
            return (node.textContent ?? "") === snapshot.translated;
        }
        function prepareTextSource(node) {
            const currentText = node.textContent ?? "";
            const snapshot = textSnapshots.get(node);
            if (!snapshot) {
                return currentText;
            }
            if (isTextAlreadyTranslated(node)) {
                return SKIP_TRANSLATION;
            }
            if (currentText !== snapshot.original) {
                snapshot.original = currentText;
                snapshot.translated = null;
            }
            return node.textContent ?? "";
        }
        function hasGroupedDrift(groupedNodes) {
            return groupedNodes.some((node)=>{
                const current = node.textContent ?? "";
                const snapshot = textSnapshots.get(node);
                if (!snapshot || snapshot.translated === null) {
                    return false;
                }
                if (current === snapshot.translated) {
                    return false;
                }
                if (current === "" && snapshot.translated === "") {
                    return false;
                }
                return true;
            });
        }
        function getGroupedFragmentSources(groupedNodes) {
            return groupedNodes.map((node)=>{
                const current = node.textContent ?? "";
                const snapshot = textSnapshots.get(node);
                if (current.length > 0 && current !== snapshot?.translated) {
                    return current;
                }
                return snapshot?.original ?? current;
            });
        }
        function buildGroupedSource(groupedNodes) {
            if (!hasGroupedDrift(groupedNodes)) {
                return groupedNodes.map((node)=>node.textContent ?? "").join("");
            }
            return getGroupedFragmentSources(groupedNodes).join("");
        }
        function rememberTextTranslation(node, originalText, translatedText) {
            textSnapshots.set(node, {
                original: originalText,
                translated: translatedText
            });
        }
        function restoreTextNode(node) {
            const snapshot = textSnapshots.get(node);
            if (!snapshot) {
                return false;
            }
            const currentText = node.textContent ?? "";
            if (snapshot.translated !== null && currentText === snapshot.translated) {
                node.textContent = snapshot.original;
                snapshot.translated = null;
                return true;
            }
            if (currentText !== snapshot.original) {
                snapshot.original = currentText;
                snapshot.translated = null;
            }
            return false;
        }
        function prepareAttributeSource(element, attributeName) {
            const currentValue = element.getAttribute(attributeName);
            if (currentValue === null) {
                return null;
            }
            const attributeMap = attrSnapshots.get(element);
            const snapshot = attributeMap?.get(attributeName);
            if (!snapshot) {
                return currentValue;
            }
            if (snapshot.translated !== null && currentValue === snapshot.translated) {
                return SKIP_TRANSLATION;
            }
            if (currentValue !== snapshot.original) {
                snapshot.original = currentValue;
                snapshot.translated = null;
            }
            return element.getAttribute(attributeName);
        }
        function rememberAttributeTranslation(element, attributeName, originalValue, translatedValue) {
            const attributeMap = ensureAttributeMap(element);
            attributeMap.set(attributeName, {
                original: originalValue,
                translated: translatedValue
            });
        }
        function restoreTrackedAttributes(element) {
            const attributeMap = attrSnapshots.get(element);
            if (!attributeMap) {
                return 0;
            }
            let restoredCount = 0;
            for (const [attributeName, snapshot] of attributeMap.entries()){
                const currentValue = element.getAttribute(attributeName);
                if (snapshot.translated !== null && currentValue === snapshot.translated) {
                    setAttributeValue(element, attributeName, snapshot.original);
                    snapshot.translated = null;
                    restoredCount += 1;
                    continue;
                }
                if (currentValue !== snapshot.original) {
                    snapshot.original = currentValue;
                    snapshot.translated = null;
                }
            }
            return restoredCount;
        }
        function ensureAttributeMap(element) {
            const existingMap = attrSnapshots.get(element);
            if (existingMap) {
                return existingMap;
            }
            const nextMap = new Map();
            attrSnapshots.set(element, nextMap);
            return nextMap;
        }
        function setAttributeValue(element, attributeName, value) {
            if (value === null) {
                element.removeAttribute(attributeName);
                return;
            }
            element.setAttribute(attributeName, value);
        }

        module.exports = { isSkipTranslation, isTextAlreadyTranslated, prepareTextSource, hasGroupedDrift, getGroupedFragmentSources, buildGroupedSource, rememberTextTranslation, restoreTextNode, prepareAttributeSource, rememberAttributeTranslation, restoreTrackedAttributes, SKIP_TRANSLATION };
        },
    "src/utils/dom.ts": (module, exports, require) => {
        function walkTextNodes(root, options = {}) {
            const { includeEmpty = false } = options;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode (node) {
                    if (!includeEmpty && (!node.textContent || node.textContent.trim().length === 0)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    const parent = node.parentElement;
                    if (!parent) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if ([
                        "SCRIPT",
                        "STYLE",
                        "NOSCRIPT"
                    ].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            });
            const textNodes = [];
            let currentNode = walker.nextNode();
            while(currentNode){
                textNodes.push(currentNode);
                currentNode = walker.nextNode();
            }
            return textNodes;
        }
        function selectElements(root, selector) {
            const results = [];
            if (typeof root.matches === "function" && root.matches(selector)) {
                results.push(root);
            }
            if (typeof root.querySelectorAll !== "function") {
                return results;
            }
            results.push(...root.querySelectorAll(selector));
            return results;
        }
        function walkElements(root) {
            return selectElements(root, "*");
        }

        module.exports = { walkTextNodes, selectElements, walkElements };
        },
    "src/core/translator.ts": (module, exports, require) => {
        const { applyAttrRule, applyTextRules } = require("src/core/matcher.ts");
        const { buildGroupedSource, getGroupedFragmentSources, hasGroupedDrift, isSkipTranslation, isTextAlreadyTranslated, prepareAttributeSource, prepareTextSource, rememberAttributeTranslation, rememberTextTranslation, restoreTextNode, restoreTrackedAttributes, SKIP_TRANSLATION } = require("src/core/originals.ts");
        const { selectElements, walkElements, walkTextNodes } = require("src/utils/dom.ts");
        function translateDocument(root, rules) {
            if (!root) {
                return 0;
            }
            const textRules = rules.filter((rule)=>rule.kind === "text");
            const attrRules = rules.filter((rule)=>rule.kind === "attr");
            const attrSources = new WeakMap();
            const translatedAttrs = new WeakMap();
            const consumedTextNodes = new WeakSet();
            let changedCount = 0;
            for (const node of walkTextNodes(root)){
                if (consumedTextNodes.has(node)) {
                    continue;
                }
                const groupedNodes = collectTextSiblings(node);
                if (groupedNodes.length > 1) {
                    if (!hasGroupedDrift(groupedNodes) && groupedNodes.every(isTextAlreadyTranslated)) {
                        for (const groupNode of groupedNodes){
                            consumedTextNodes.add(groupNode);
                        }
                        continue;
                    }
                    const groupedSource = buildGroupedSource(groupedNodes);
                    const groupedNext = applyTextRules(groupedSource, textRules);
                    if (groupedNext && groupedNext !== groupedSource) {
                        const fragmentSources = getGroupedFragmentSources(groupedNodes);
                        groupedNodes[0].textContent = groupedNext;
                        rememberTextTranslation(groupedNodes[0], fragmentSources[0], groupedNext);
                        changedCount += 1;
                        for(let index = 1; index < groupedNodes.length; index += 1){
                            const groupNode = groupedNodes[index];
                            groupNode.textContent = "";
                            rememberTextTranslation(groupNode, fragmentSources[index], "");
                            consumedTextNodes.add(groupNode);
                            changedCount += 1;
                        }
                        consumedTextNodes.add(groupedNodes[0]);
                        continue;
                    }
                }
                if (isTextAlreadyTranslated(node)) {
                    consumedTextNodes.add(node);
                    continue;
                }
                const inlineGroup = collectInlineGroup(node);
                if (inlineGroup) {
                    if (inlineGroup.textNodes.every(isTextAlreadyTranslated)) {
                        for (const textNode of inlineGroup.textNodes){
                            consumedTextNodes.add(textNode);
                        }
                        continue;
                    }
                    const inlineSource = buildInlineGroupSource(inlineGroup.segments);
                    if (isSkipTranslation(inlineSource)) {
                        continue;
                    }
                    const inlineNext = applyTextRules(inlineSource, textRules);
                    if (inlineNext && inlineNext !== inlineSource) {
                        if (applyInlineGroupTranslation(inlineGroup.segments, inlineNext)) {
                            for (const textNode of inlineGroup.textNodes){
                                consumedTextNodes.add(textNode);
                            }
                            changedCount += 1;
                            continue;
                        }
                    }
                }
                const originalText = prepareTextSource(node);
                if (isSkipTranslation(originalText)) {
                    continue;
                }
                const nextText = applyTextRules(originalText, textRules);
                if (!nextText || nextText === originalText) {
                    continue;
                }
                node.textContent = nextText;
                rememberTextTranslation(node, originalText, nextText);
                changedCount += 1;
            }
            for (const rule of attrRules){
                for (const element of selectElements(root, rule.selector)){
                    if (hasTranslatedAttribute(translatedAttrs, element, rule.attr)) {
                        continue;
                    }
                    const originalValue = getAttributeSource(attrSources, element, rule.attr);
                    if (originalValue === null) {
                        continue;
                    }
                    const nextValue = applyAttrRule(originalValue, rule);
                    if (!nextValue || nextValue === originalValue) {
                        continue;
                    }
                    element.setAttribute(rule.attr, nextValue);
                    rememberAttributeTranslation(element, rule.attr, originalValue, nextValue);
                    markTranslatedAttribute(translatedAttrs, element, rule.attr);
                    changedCount += 1;
                }
            }
            return changedCount;
        }
        function restoreDocument(root) {
            if (!root) {
                return 0;
            }
            let restoredCount = 0;
            for (const node of walkTextNodes(root, {
                includeEmpty: true
            })){
                restoredCount += restoreTextNode(node) ? 1 : 0;
            }
            for (const element of walkElements(root)){
                restoredCount += restoreTrackedAttributes(element);
            }
            return restoredCount;
        }
        function getAttributeSource(cache, element, attributeName) {
            const cachedAttributes = cache.get(element);
            if (cachedAttributes?.has(attributeName)) {
                return cachedAttributes.get(attributeName) ?? null;
            }
            const originalValue = prepareAttributeSource(element, attributeName);
            if (originalValue === null || isSkipTranslation(originalValue)) {
                return null;
            }
            const nextAttributes = cachedAttributes ?? new Map();
            nextAttributes.set(attributeName, originalValue);
            cache.set(element, nextAttributes);
            return originalValue;
        }
        function hasTranslatedAttribute(cache, element, attributeName) {
            return cache.get(element)?.has(attributeName) ?? false;
        }
        function markTranslatedAttribute(cache, element, attributeName) {
            const translated = cache.get(element) ?? new Set();
            translated.add(attributeName);
            cache.set(element, translated);
        }
        const INLINE_TAGS = new Set([
            "CODE",
            "STRONG",
            "EM",
            "B",
            "I",
            "SPAN",
            "A",
            "SMALL",
            "SUB",
            "SUP",
            "MARK",
            "ABBR",
            "KBD",
            "SAMP",
            "VAR",
            "TIME"
        ]);
        function isInlineElement(node) {
            return node.nodeType === 1 && INLINE_TAGS.has(node.tagName);
        }
        function isIgnorablePrefixNode(node) {
            if (node.nodeType === 3) {
                return (node.textContent ?? "").trim().length === 0;
            }
            return node.nodeType === 1 && isInlineElement(node);
        }
        function collectInlineGroup(node) {
            const parent = node.parentElement ?? node.parentNode;
            if (!parent) {
                return null;
            }
            const siblings = Array.from(parent.childNodes);
            const index = siblings.indexOf(node);
            if (index < 0) {
                return null;
            }
            for(let siblingIndex = 0; siblingIndex < index; siblingIndex += 1){
                const sibling = siblings[siblingIndex];
                if (!sibling || isIgnorablePrefixNode(sibling)) {
                    continue;
                }
                return null;
            }
            const segments = [];
            const textNodes = [];
            let hasInlineElement = false;
            for(let siblingIndex = index; siblingIndex < siblings.length; siblingIndex += 1){
                const sibling = siblings[siblingIndex];
                if (!sibling) {
                    break;
                }
                if (sibling.nodeType === 3) {
                    segments.push({
                        kind: "text",
                        node: sibling
                    });
                    textNodes.push(sibling);
                    continue;
                }
                if (sibling.nodeType === 1 && sibling.tagName === "BR") {
                    segments.push({
                        kind: "break"
                    });
                    continue;
                }
                if (isInlineElement(sibling)) {
                    hasInlineElement = true;
                    segments.push({
                        kind: "inline",
                        value: sibling.textContent ?? ""
                    });
                    continue;
                }
                break;
            }
            if (!hasInlineElement || segments.length < 2) {
                return null;
            }
            return {
                segments,
                textNodes
            };
        }
        function buildInlineGroupSource(segments) {
            let source = "";
            for (const segment of segments){
                if (segment.kind === "break") {
                    source += " ";
                    continue;
                }
                if (segment.kind === "text") {
                    const textSource = prepareTextSource(segment.node);
                    if (isSkipTranslation(textSource)) {
                        return SKIP_TRANSLATION;
                    }
                    source += textSource;
                    continue;
                }
                source += segment.value;
            }
            return source.replace(/\s+/g, " ").trim();
        }
        function applyInlineGroupTranslation(segments, translated) {
            const inlineValues = segments.filter((segment)=>segment.kind === "inline").map((segment)=>segment.value);
            const textSegments = segments.filter((segment)=>segment.kind === "text");
            let remainder = translated;
            const textParts = [];
            for (const inlineValue of inlineValues){
                const inlineIndex = remainder.indexOf(inlineValue);
                if (inlineIndex < 0) {
                    return false;
                }
                textParts.push(remainder.slice(0, inlineIndex));
                remainder = remainder.slice(inlineIndex + inlineValue.length);
            }
            textParts.push(remainder);
            if (textParts.length !== textSegments.length) {
                return false;
            }
            for(let index = 0; index < textSegments.length; index += 1){
                const segment = textSegments[index];
                const originalText = prepareTextSource(segment.node);
                const nextText = textParts[index];
                if (nextText === originalText) {
                    continue;
                }
                segment.node.textContent = nextText;
                rememberTextTranslation(segment.node, originalText, nextText);
            }
            return true;
        }
        function collectTextSiblings(node) {
            const parent = node.parentElement ?? node.parentNode;
            if (!parent) {
                return [
                    node
                ];
            }
            const siblings = Array.from(parent.childNodes);
            const index = siblings.indexOf(node);
            if (index < 0) {
                return [
                    node
                ];
            }
            let start = index;
            while(start > 0 && siblings[start - 1]?.nodeType === 3){
                start -= 1;
            }
            const textSiblings = [];
            for(let siblingIndex = start; siblingIndex < siblings.length; siblingIndex += 1){
                const sibling = siblings[siblingIndex];
                if (sibling?.nodeType !== 3) {
                    break;
                }
                textSiblings.push(sibling);
            }
            return textSiblings;
        }

        module.exports = { translateDocument, restoreDocument };
        },
    "src/utils/log.ts": (module, exports, require) => {
        const LOG_PREFIX = "[tailscale-chinese]";
        function log(message, extra) {
            if (typeof extra === "undefined") {
                console.info(LOG_PREFIX, message);
                return;
            }
            console.info(LOG_PREFIX, message, extra);
        }

        module.exports = { log };
        },
    "src/core/runtime.ts": (module, exports, require) => {
        const { syncAdminNavigationLayout } = require("src/core/admin-layout.ts");
        const { installControl, uninstallLegacyControl } = require("src/core/control.ts");
        const { observeNavigation } = require("src/core/navigation.ts");
        const { resolveRules } = require("src/core/page-detector.ts");
        const { observeDocument } = require("src/core/observer.ts");
        const { restoreDocument, translateDocument } = require("src/core/translator.ts");
        const { getLanguagePreference } = require("src/state/language.ts");
        const { log } = require("src/utils/log.ts");
        let documentObserver = null;
        let lastTranslatedPath = null;
        function runTranslation() {
            documentObserver?.disconnect();
            try {
                const root = document.body;
                const pathname = window.location.pathname;
                if (getLanguagePreference() !== "zh-CN") {
                    restoreDocument(root);
                    syncAdminNavigationLayout(false);
                    lastTranslatedPath = null;
                    log("language preference is not zh-CN, restored original content");
                    return 0;
                }
                if (lastTranslatedPath !== pathname) {
                    restoreDocument(root);
                }
                const rules = resolveRules(pathname);
                const changedCount = translateDocument(root, rules);
                syncAdminNavigationLayout(true);
                lastTranslatedPath = pathname;
                if (changedCount > 0) {
                    log(`translated ${changedCount} nodes on ${pathname}`);
                }
                return changedCount;
            } finally{
                documentObserver?.reconnect();
            }
        }
        function createScheduledRunner(runNow) {
            let scheduled = false;
            let settleTimers = [];
            return ()=>{
                if (scheduled) {
                    return;
                }
                scheduled = true;
                const flush = ()=>{
                    scheduled = false;
                    runNow();
                    const settle = ()=>{
                        runNow();
                    };
                    if (typeof requestAnimationFrame === "function") {
                        requestAnimationFrame(settle);
                    } else {
                        queueMicrotask(settle);
                    }
                    for (const timer of settleTimers){
                        clearTimeout(timer);
                    }
                    settleTimers = [
                        200,
                        500,
                        1000
                    ].map((delay)=>setTimeout(()=>{
                            runNow();
                        }, delay));
                };
                if (typeof requestAnimationFrame === "function") {
                    requestAnimationFrame(flush);
                    return;
                }
                queueMicrotask(flush);
            };
        }
        function installHoverRerun(rerun) {
            let hoverTimer = null;
            document.addEventListener("mouseover", ()=>{
                if (hoverTimer) {
                    clearTimeout(hoverTimer);
                }
                hoverTimer = setTimeout(()=>{
                    hoverTimer = null;
                    rerun();
                }, 150);
            }, {
                passive: true
            });
        }
        function bootstrap() {
            if (!window.location.hostname.endsWith("tailscale.com")) {
                return;
            }
            const start = ()=>{
                const rerun = createScheduledRunner(runTranslation);
                uninstallLegacyControl();
                installControl(runTranslation);
                installHoverRerun(rerun);
                runTranslation();
                documentObserver = observeDocument(rerun);
                observeNavigation(rerun);
                log("Tailscale Chinese userscript bootstrapped");
            };
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", start, {
                    once: true
                });
                return;
            }
            start();
        }

        module.exports = { bootstrap };
        },
    "src/core/index.ts": (module, exports, require) => {
        const { bootstrap } = require("src/core/runtime.ts");

        module.exports = { bootstrap };
        },
    "src/main.ts": (module, exports, require) => {
        const { bootstrap } = require("src/core/index.ts");
        bootstrap();

        module.exports = {  };
        }
  };

  const cache = {};

  const require = (id) => {
    if (cache[id]) {
      return cache[id].exports;
    }

    if (!modules[id]) {
      throw new Error(`Unknown module: ${id}`);
    }

    const module = { exports: {} };
    cache[id] = module;
    modules[id](module, module.exports, require);
    return module.exports;
  };

  require("src/main.ts");
})();

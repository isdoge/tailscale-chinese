<!-- badges -->
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-√-green.svg)](https://www.tampermonkey.net/)

# Tailscale 官网管理界面汉化插件

Tailscale Admin Console 为主、兼顾官网部分页面的简体中文翻译脚本。

[GitHub](https://github.com/isdoge/tailscale-chinese)
｜
[安装脚本](https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/dist/tailscale-chinese.user.js)
｜
[问题反馈](https://github.com/isdoge/tailscale-chinese/issues)

> 浏览器端 userscript，把 Tailscale 管理台常见文案翻译成简体中文。不是桌面客户端汉化包，也不修改 Tailscale 官方源码。

## 功能

- 汉化 `login.tailscale.com/admin/*` 已支持页面
- 补一部分 `tailscale.com` 官网文案
- 支持文本、按钮、提示、`aria-label`、`placeholder`、`data-content` 等属性翻译
- 兼容单页应用路由切换：自动在路由变更、异步加载、节点重建后重翻译
- 支持中英文切换与原文恢复

## 不是什么

- 不是桌面客户端汉化
- 不是浏览器扩展商店插件
- 不是 Tailscale 官方项目
- 不是整站 100% 完整翻译

## 截图

> 截图待补充：请在登录后的 Tailscale Admin Console 页面截图，放入 `docs/` 目录。

## 安装

### 1. 安装 Tampermonkey

- Chrome / Edge: [Chrome Web Store](https://chromewebstore.google.com/search/tampermonkey)
- 官网: [tampermonkey.net](https://www.tampermonkey.net/)

### 2. 安装脚本

打开以下地址，Tampermonkey 会弹出安装确认：

```text
https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/dist/tailscale-chinese.user.js
```

### 3. 刷新页面使用

脚本匹配范围：

- `https://tailscale.com/*`
- `https://*.tailscale.com/*`

### 当前覆盖页面

管理台：

- `/admin/machines` · `/admin/apps` · `/admin/services` · `/admin/services/*`（含 `new`、`edit`）
- `/admin/users`
- `/admin/acls/visual/*` · `/admin/acls/file` · `/admin/acls/diff` · `/admin/acls/preview`
- `/admin/logs` · `/admin/logs/network`
- `/admin/dns`
- `/admin/settings/general` · `/admin/settings/user-management`
- `/admin/settings/device-management` · `/admin/settings/device-management/posture`
- `/admin/settings/policy-file-management` · `/admin/settings/trust-credentials`
- `/admin/settings/webhooks` · `/admin/settings/contact-preferences`
- `/admin/settings/billing` · `/admin/settings/billing/invoices`
- `/admin/settings/billing/billing-details` · `/admin/settings/billing/plans`
- `/admin/settings/billing/checkout/hybrid_standard`
- `/admin/settings/billing/add/mullvad`
- `/admin/settings/keys`
- `/admin/resource-hub`

仍在持续补齐日志事件枚举、新增 add / checkout / modal 子页、个别动态控件上下文文案。

## 项目特点

**按路由拆分词典** — 只替换当前页面需要处理的文本和属性，不整页 HTML 替换。

**属性翻译** — 同步处理 `aria-label`、`title`、`placeholder`、`data-content`，避免导航宽度抖动等问题。

**单页应用兼容** — Tailscale Admin Console 路由切换、异步加载、节点重建后自动重翻译，不只在首次打开时运行一次。

## 目录

```
├── dist/                          # Tampermonkey 安装产物
│   └── tailscale-chinese.user.js
├── src/
│   ├── core/                      # 运行时（路由、翻译器、观察者）
│   ├── dicts/                     # 按页面拆分的翻译词典
│   ├── state/                     # 语言状态管理
│   ├── types/                     # 类型定义
│   ├── utils/                     # DOM / 日志工具
│   ├── main.ts                    # 入口
│   └── types.ts
├── scripts/                       # 构建与测试
│   ├── build.mjs
│   ├── build.test.mjs
│   └── stage2.test.mjs
├── _upload_exclude/               # 本地开发材料（不提交）
├── PUBLISHING.md
├── package.json
└── .gitignore
```

## 开发

```bash
npm test          # 构建测试 + 阶段校验
npm run build     # 单独构建
```

## 已知边界

- 不是所有页面都已覆盖
- 某些事件码、后端枚举值、动态拼接文本可能残留英文
- Tailscale 页面结构变动后，个别规则可能需要跟进调整

发现漏翻最有帮助的反馈方式：提供具体 URL + 英文文案 + 截图。

## 贡献

欢迎提 Issue 或 PR。补翻译建议按以下顺序：

1. 在真实页面确认英文残留位置
2. 判断所属路由和属性类型（文本 / `aria-label` / `placeholder` 等）
3. 在对应 `src/dicts/*.ts` 里加规则
4. 运行 `npm test` 确认通过
5. 运行 `npm run build`
6. 回真实页面复验后提交 PR

## License

MIT

## 致谢

本项目由 [Codex](https://github.com/openai/codex) 辅助完成翻译词典编写、运行时逻辑和构建脚本。

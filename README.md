<!-- badges -->
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-√-green.svg)](https://www.tampermonkey.net/)

# Tailscale 中文化插件

Tailscale Admin Console 为主、兼顾官网部分页面的简体中文翻译脚本。

[GitHub](https://github.com/isdoge/tailscale-chinese)
｜
[安装脚本](https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/dist/tailscale-chinese.user.js)
｜
[问题反馈](https://github.com/isdoge/tailscale-chinese/issues)

> 浏览器端 userscript，把 Tailscale 管理台常见文案翻译成简体中文。不是桌面客户端汉化包，也不修改 Tailscale 官方源码。

## 词典与更新

- 词典外置为静态 JSON（约 826 条词条 + 正则与属性规则），脚本本体很小。
- 启动时自动拉取一次词典并缓存；之后每次启动优先使用缓存，再尝试在线刷新。
- 下载源依次为 GitHub raw `main`、jsDelivr 镜像、当前版本标签快照；全部失败不影响已加载词典。
- 脚本菜单提供「立即更新中文词典」（手动强制刷新）与「查看词典状态」（版本、来源与条数）。
- 跨标签页使用原生 Web Locks 互斥写入，旧 revision 或同 revision 异内容不会污染当前词典。

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

## 目录

```
├── dist/                          # Tampermonkey 安装产物
│   └── tailscale-chinese.user.js
├── locales/
│   ├── zh-CN.json                 # 唯一源词典：exact 词条
│   ├── rules.json                 # 正则与属性规则（随 envelope 一起外置）
│   └── zh-CN.online.json          # 构建生成的在线 envelope
├── release.config.json            # 词典 revision 与指纹
├── src/
│   ├── core/                      # 运行时（翻译器、观察者、在线词典加载）
│   ├── dicts/index.ts             # 规则合成（从 envelope 构建）
│   ├── state/                     # 语言状态管理
│   ├── types.ts
│   └── main.ts                    # 入口
├── scripts/                       # 构建、bump 与测试
├── package.json
└── .gitignore
```

## 开发

```bash
npm test                    # 构建测试 + 运行时回归
npm run build               # 生成 dist 与在线词典 envelope
npm run dictionary          # 词典内容变化后递增 revision（先改 locales/zh-CN.json）
```

词典只改 `locales/zh-CN.json` 与 `locales/rules.json`；运行时行为修改才进 `src/`。

## 已知边界

- 不是所有页面都已覆盖
- 某些事件码、后端枚举值、动态拼接文本可能残留英文
- 首次安装如遇 GitHub 不可达，页面保持英文，联网后点菜单「立即更新中文词典」即可

发现漏翻最有帮助的反馈方式：提供具体 URL + 英文文案 + 截图。

## 贡献

欢迎提 Issue 或 PR。补翻译建议按以下顺序：

1. 在真实页面确认英文残留位置
2. 修改 **`locales/zh-CN.json`**（exact 词条）或 `locales/rules.json`（正则/属性规则），不再把词典写进 `src/`
3. 运行 `npm run dictionary` 递增词典 revision
4. 运行 `npm test` 与 `npm run build` 确认通过
5. 回真实页面复验后提交不含私密信息的 PR

## License

MIT

## 致谢

本项目由 [Codex](https://github.com/openai/codex) 辅助完成翻译词典编写、运行时逻辑和构建脚本。

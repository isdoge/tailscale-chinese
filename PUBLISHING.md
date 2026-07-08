# Publishing

这份仓库推荐按“源码仓库 + 单文件 userscript 产物”发布。

- 仓库地址：`https://github.com/isdoge/tailscale-chinese`
- 用户安装地址：`https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/dist/tailscale-chinese.user.js`

## 推荐发布结构

提交到 GitHub：

- `src/`
- `scripts/`
- `dist/`
- `README.md`
- `PUBLISHING.md`
- `package.json`
- `.gitignore`

不要提交：

- `_upload_exclude/`
- 本地截图、工作单、阶段材料
- `.codex/`
- `.claude/`

## 发布前检查

1. 确认 `package.json` 的 `version` 已更新。
2. 如果仓库地址已经确定，补齐 `package.json` 里的这些字段：
   - `userscript.namespace`
   - `userscript.homepageURL`
   - `userscript.supportURL`
   - `userscript.updateURL`
   - `userscript.downloadURL`
3. 执行：

```bash
npm test
npm run build
```

4. 确认 `dist/tailscale-chinese.user.js` 已刷新。
5. 再提交源码和 `dist/`。

## GitHub 分发方式

用户真正需要的只有一个安装链接：

```text
https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/dist/tailscale-chinese.user.js
```

推荐做法：

- README 放安装说明
- 仓库保留源码，方便维护者提 PR
- Release 或 README 都指向 `dist/tailscale-chinese.user.js`

## 维护者工作流

1. 在 `src/dicts/` 补词典或在 `src/core/` 修运行时问题。
2. 跑 `npm test`。
3. 跑 `npm run build`。
4. 用本地静态地址或 Raw GitHub 地址安装 `dist/tailscale-chinese.user.js`。
5. 回真实页面验证。

## 为什么不只传一个 js

对用户来说，装一个 `js` 就够。

对维护者来说，只留一个编译后 `js` 会让这些事情都变难：

- 看不清词典改动
- 看不清运行时修复
- 很难做 focused 回归
- 别人几乎无法舒服接手

所以分发单文件，维护保留源码，这是当前最稳的平衡点。

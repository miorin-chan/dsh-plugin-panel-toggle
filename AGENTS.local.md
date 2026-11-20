# AGENTS.local

本文件补充 [通用规则](AGENTS.md)。
项目专属规则在其适用范围内优先。

## 范围与项目文档

用一个快捷键在插件面板与先前页面间切换。
本项目保持独立安装和启停。

[README.md](README.md) 为英文用户说明，[README.zh.md](README.zh.md) 为中文版本。
[项目文档索引](docs/README.md) 指向行为说明、维护约束和验证入口。
设计与开发说明优先用中文。修改文案时同步维护八种 locale（`en zh ja de es fr pt ru`）。
新增设计记录放在 `docs/` 并登记到索引，发布时通过 `CHANGELOG.md` 记录变化。

## 结构

- `client.js` 是浏览器半：手写的 module-loader 产物，不经过构建。
  修改前先读它顶部的机制说明。
- `index.js` 是 Host 半，保持无副作用，只用于让 bundle 行被加载。
- `locale/*.json` 只放 Plugin Manager 读取的 `meta.title` / `meta.description`；
  命令标签等运行时文案在 `client.js` 的 `LABELS` 里。
- `test/client.test.mjs` 用假的 `ctx` 固定四件事：六个平台的默认键位、来处记忆（含鼠标打开插件面板的情形）、
  弹窗与面板缺失时的出口、卸载清理。

## 实现

- 只用公开面：`ctx.shortcuts.register`、`ctx.layout.panelInfo`、`ctx.layout.selectPanel`。
  不读 DSH 内部 store、不写 DOM、不包装别的插件的命令解析器。
- 面板 id `plugins` 归 `@deepseek-ai/dsh-client-ui-plugin-manager` 所有。
  `selectPanel` 对未注册面板会抛错，因此所有选择都走 `select` 函数：失败时回退到会话页（`null`），
  绝不把用户留在空白视图。
- 返回目标只记最后一个非插件面板；不要把插件面板本身写进记忆，否则第二次按下会原地不动。
- 默认键位用 `primary`，由插件层按平台展开；不要手写 `meta` / `control`。
- 注册默认键位可能与既有命令冲突。
  冲突时保留命令但去掉默认键位（fail-open），并在控制台留下警告，让用户能在设置里自己改。
- DSH 升级后先重跑 `node --test`，再在真实界面确认两个方向。
  若面板 id 或 `ctx.layout` 结构变化，插件应失活或静默，而不是报错波及键盘。

将注册与清理放在 `apply` 的 `ctx.effect` 或 `ctx.on` 中，保持 factory 无副作用。
在客户端入口头部记录对 DSH 内部结构的依赖和退化行为。

## 版本与验证

主版本升级由用户决定，常规迭代沿用当前主版本。

- 在项目根运行 `node --test` 和 `node --check client.js && node --check index.js`。
- 在默认工作区根运行 `node tools/new-dsh-plugin/cli.mjs --check plugins/dsh-plugin-panel-toggle`。
- 安装、卸载及实机验证使用一次性 profile。
  报告区分夹具测试和实机观察。
- 用 `docs/scripts/reflow md <path>` 重排修改过的英文 Markdown。
  命令需要 Python 3.11 或更新版本。
- 在项目根运行 `prek install`，之后提交时会自动重排暂存的 Markdown。

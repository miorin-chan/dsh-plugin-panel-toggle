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
插件详情页要整体短、每项一眼能懂。
只展示用户当下需要知道或操作的内容，细节按需展开。

## 结构

`npm run build:tools` 从 `scripts/` 下的 `.mts` 生成同路径 `.mjs`，Git 跟踪 TypeScript 源码。
Node.js 22.18 或更新版本直接运行 `.test.mts`。

- [浏览器源码](src/client/index.ts) 构建为 `client.js`。
  修改前先读源码顶部的机制说明。
- [Host 源码](src/host/index.ts) 构建为 `index.js`，保持无副作用，只用于让 bundle 行被加载。
- Git 忽略 [构建脚本](scripts/build.mts) 生成的 JavaScript 文件，npm 打包时包含这些文件。
  DSH 类型依赖用 `import type` 引入。
- `locale/*.json` 只放 Plugin Manager 读取的 `meta.title` 和 `meta.description`。
  命令标签等运行时文案在浏览器源码的 `LABELS` 里。
- `test/client.test.mts` 用假的 `ctx` 固定四件事：六个平台的默认键位、来处记忆（含鼠标打开插件面板的情形）、
  弹窗与面板缺失时的出口、卸载清理。

## 复用 DSH 原生界面

- 优先复用 DSH 原生组件、行为、主题 token 和同类界面布局，以减少自写代码和维护成本。
- 当前版本有受支持的运行时入口且性能可接受时，优先通过公开插槽、
  组件工厂或宿主提供的可加载模块动态复用，让宿主提供组件实现。
  只有现有组件和扩展点无法满足需求时，才补足必要的插件实现。
- 静态引入或打包官方代码或资源时，在引用处标注上游包名、版本或提交、源码路径及符号名，便于升级时回看和同步，
  并保留适用的许可证与署名。

## 实现

- 常见操作按钮优先使用易识别的图标，仅在图标无法明确表达操作含义时使用可见文字。
- 新增实现用 TypeScript，复用与目标 DSH 版本匹配的官方类型，在接口、配置和事件中保留类型信息，并同步维护类型依赖。
- 新实现限于 DSH 支持的插件 API 和扩展点。
  禁止修改 DSH 源码或安装产物，也禁止用全局猴子补丁或覆写内部实现绕过边界。
  扩展点不足时说明缺口，并将实现限制在插件能力内。
- 只用公开面：`ctx.shortcuts.register`、`ctx.layout.panelInfo`、`ctx.layout.selectPanel`。
  不读 DSH 内部 store、不写 DOM、不包装别的插件的命令解析器。
- 面板 id `plugins` 归 `@deepseek-ai/dsh-client-ui-plugin-manager` 所有。
  `selectPanel` 对未注册面板会抛错，因此所有选择都走 `select` 函数：失败时回退到会话页（`null`），
  绝不把用户留在空白视图。
- 返回目标只记最后一个非插件面板；不要把插件面板本身写进记忆，否则第二次按下会原地不动。
- 默认键位用 `primary`，由插件层按平台展开；不要手写 `meta` / `control`。
- 注册默认键位可能与既有命令冲突。
  冲突时保留命令但去掉默认键位（fail-open），并在控制台留下警告，让用户能在设置里自己改。
- DSH 升级后先更新类型依赖并运行 `npm run check`，再在真实界面确认两个方向。
  若面板 id 或 `ctx.layout` 结构变化，插件应失活或静默，而不是报错波及键盘。

将注册与清理放在 `apply` 的 `ctx.effect` 或 `ctx.on` 中，保持 factory 无副作用。
在客户端入口头部记录对 DSH 内部结构的依赖和退化行为。

## 版本与验证

主版本升级由用户决定，常规迭代沿用当前主版本。

- 新检出后在项目根运行 `npm ci`，安装锁定的开发依赖并生成运行文件。
  改动源码后用 `npm run build` 更新产物，用 `npm test` 重新构建并测试。
- 在 DSH shell 运行 `npm run check`，依次核对产物、运行测试、检查类型并核对当前 DSH 的类型包版本。
  升级 DSH 后先执行 `node scripts/sync-types.mjs` 查看新的固定版本。
- 用 `node --check client.js && node --check index.js` 验证语法，用 `npm pack --dry-run --json` 核对发布文件。
- 在默认工作区根运行 `node tools/new-dsh-plugin/cli.mts --check plugins/dsh-plugin-panel-toggle`。
- 安装、卸载及实机验证使用一次性 profile。
  报告区分夹具测试和实机观察。
- 用 `docs/scripts/reflow md <path>` 重排修改过的英文 Markdown。
  命令需要 Python 3.11 或更新版本。
- 在项目根运行 `prek install`，之后提交时会自动重排暂存的 Markdown。
- 在 DSH 沙箱内提交时，用 `PREK_HOME="${TMPDIR:?}/prek-dsh" git commit -m "<commit message>"`，
  让 reflow 钩子照常运行，并把 `prek` 的缓存和日志写到可写的临时目录。

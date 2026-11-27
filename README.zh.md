# dsh-plugin-panel-toggle

[English](README.md)

为 DeepSeek Harness 增加快捷键（`Mod+Shift+,`，macOS 默认 `⌘⇧,`）：一键切到 **插件** 面板，再按一次回到离开前的页面。
可在 **设置 → 快捷键** 中改键或清除（macOS 上 `Mod` 为 Command，Windows/Linux 为 Ctrl；弹窗打开时不拦截按键）。

需要 DeepSeek Harness `0.2.2-rc.3` 或更新版本及内置「插件」面板（浏览器标签页可能优先占用该组合键）。
可在 **插件模块化改良计划** 中直接开启 **插件面板快捷键**，
或在源码目录运行 `pnpm install` 后从 **插件 → 添加插件** 选择本目录（或执行 `install_bundle`）。

## 界面截图

从「自动化任务」页面按下快捷键后打开的「插件」面板。

![按下插件面板快捷键后打开的插件面板](docs/assets/screenshots/main-light.png)

[深色模式主图](docs/assets/screenshots/main-dark.png)

[项目文档](docs/README.md)

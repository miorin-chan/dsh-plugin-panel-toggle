# dsh-plugin-panel-toggle

Adds one in-app shortcut that switches DeepSeek Harness to the **Plugins** panel and back to the page you left.

| Input | Before | With this plugin |
| --- | --- | --- |
| Mod+Shift+, from the Conversation | nothing | opens the Plugins panel |
| Mod+Shift+, from another panel | nothing | opens the Plugins panel |
| Mod+Shift+, again | nothing | returns to the panel or Conversation you left |
| Mod+Shift+, with a dialog open | nothing | nothing (the dialog keeps the press) |

`Mod` is Command on macOS and Control on Windows and Linux.
The default is `⌘⇧,` on macOS and `Ctrl+Shift+,` elsewhere; rebind it in **Settings** > **Shortcuts**.

## Requirements

- DeepSeek Harness 0.2.2-rc.3 or newer, with the built-in **Plugins** panel available (it ships in the Web app bundle).
- Works in the Desktop window and in the browser page.
  A browser tab's own shortcut handling can still claim the combination first.

## Install

Run `npm ci` in the source checkout to install the development dependencies and build the plugin.
Install this directory as a local bundle: **Plugins** > **Add plugin**,
or let the agent run `install_bundle` on this directory.
The plugin appears in **Plugins** as **Plugins panel shortcut** / **插件面板快捷键**.

## Use

- Press Mod+Shift+, anywhere in the app, including the composer and terminals.
- The first press opens the Plugins panel, keeping whatever tab and bundle details it already had.
- The next press returns to the panel you were on when you first pressed.
  Opening the Plugins panel with the sidebar or another plugin and then pressing the shortcut also returns
  to the page you left.
- The shortcut is listed in **Settings** > **Shortcuts**, so it can be rebound or cleared like any other command.

## Limitations

- While a dialog is open the press is left alone: with a dialog in front,
  switching the page behind it would hide the result of the press.
  Escape dismisses the dialog first.
- A profile without the built-in Plugins panel (for example, a custom profile
  that disables the plugin manager) has no panel to select.
  The shortcut then leaves the current page untouched and logs one warning, instead of failing.
- The return target is one panel deep: the shortcut remembers the last panel that was not the Plugins panel.
  It is not a navigation history.
- Held-key repeats are consumed by the shortcut layer but do not toggle repeatedly; each toggle needs a fresh press.

## Unload

Disable the bundle in **Plugins**. The command and its panel observation are removed;
any key you bound in Settings > Shortcuts remains stored as an override for a later reinstall.

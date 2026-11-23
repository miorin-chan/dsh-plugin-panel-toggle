/**
 * Browser half of `dsh-plugin-panel-toggle`.
 *
 * DeepSeek Harness keeps one global central-panel selection: `null` is the
 * Conversation, and a registered main-panel key such as `plugins` replaces it
 * without changing the current Session. This module contributes one command,
 * `plugins.panel.toggle`, and remembers the panel the user left so the second
 * press returns there. Because the Plugins panel is a global panel, the memory
 * is profile-wide rather than per Session.
 *
 * The `plugins` main-panel key belongs to `@deepseek-ai/dsh-client-ui-plugin-manager`.
 * A profile without that plugin has no such panel: selecting it throws, and the
 * command reports that once instead of breaking the keyboard.
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ShortcutBinding, ShortcutCommand, ShortcutCommandId } from '@deepseek-ai/dsh-client-shortcuts/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'

const NS = 'dsh-plugin-panel-toggle'
const COMMAND_ID = 'plugins.panel.toggle' as ShortcutCommandId
/** Main-panel key owned by `@deepseek-ai/dsh-client-ui-plugin-manager`. */
const PLUGINS_PANEL = 'plugins' as MainPanelId
/** `primary` is Command on macOS and Control elsewhere. */
const BINDING: ShortcutBinding = { code: 'Comma', modifiers: ['primary', 'shift'] }
const LABELS = {
  en: { toggle: 'Toggle plugins panel' },
  zh: { toggle: '切换插件面板' },
  ja: { toggle: 'プラグインパネルを切り替え' },
  es: { toggle: 'Alternar el panel de complementos' },
  fr: { toggle: 'Basculer le panneau des extensions' },
  de: { toggle: 'Plugin-Bereich umschalten' },
  ru: { toggle: 'Переключить панель плагинов' },
  pt: { toggle: 'Alternar o painel de plugins' },
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-plugin-panel-toggle': keyof typeof LABELS.en
  }
}

export const inject = ['shortcuts', 'locale', 'layout']

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, LABELS), `${NS}: locale`)
  const t = ctx.locale.bind(NS)

  /** Last selected panel that was not the Plugins panel; null is the Conversation. */
  let previousPanel: MainPanelId | null = null
  let warnedUnavailable = false

  const activePanel = () => {
    let active: MainPanelId | null | undefined
    try {
      active = ctx.layout.panelInfo.getSnapshot()?.activePanelId
    } catch {
      return null
    }
    return typeof active === 'string' ? active : null
  }

  /** Track the return target from presses that are not this command (sidebar, mouse). */
  const remember = () => {
    const active = activePanel()
    if (active !== PLUGINS_PANEL) previousPanel = active
  }

  ctx.effect(() => {
    remember()
    let unsubscribe: (() => void) | undefined
    try {
      unsubscribe = ctx.layout.panelInfo.subscribe(remember)
    } catch (error) {
      console.warn(`${NS}: the panel selection is not observable`, error)
      return []
    }
    return () => { unsubscribe?.() }
  }, `${NS}: return target`)

  /**
   * Select a panel. A panel unregistered since it was remembered, or a
   * profile without the Plugins panel, falls back to the Conversation so
   * the press never leaves the user on a blank or broken view.
   */
  const select = (panel: MainPanelId | null): boolean => {
    try {
      ctx.layout.selectPanel(panel)
      return true
    } catch (error) {
      if (panel !== null) return select(null)
      if (!warnedUnavailable) {
        warnedUnavailable = true
        console.warn(`${NS}: the Plugins panel is unavailable in this profile`, error)
      }
      return false
    }
  }

  const command: ShortcutCommand = {
    id: COMMAND_ID,
    label: () => t('toggle'),
    aliases: ['plugins', 'plugin manager', 'extensions'],
    defaults: {
      'desktop:macos': BINDING,
      'desktop:windows': BINDING,
      'desktop:linux': BINDING,
      'web:macos': BINDING,
      'web:windows': BINDING,
      'web:linux': BINDING,
    },
    regions: ['page', 'editable', 'terminal'],
    modals: [],
    resolve(context) {
      // An open dialog owns input; switching the page behind it would hide
      // the result of the press rather than show the Plugins panel.
      if (context?.modal !== null && context?.modal !== undefined) return { status: 'pass' }
      const from = activePanel()
      return { status: 'handled', run: () => {
        if (from === PLUGINS_PANEL) {
          select(previousPanel)
          return
        }
        previousPanel = from
        select(PLUGINS_PANEL)
      } }
    },
  }

  ctx.effect(() => {
    try {
      return ctx.shortcuts.register(command)
    } catch (error) {
      // Another command may already own the combination on this profile.
      // Keep the toggle usable by leaving it unbound for Settings > Shortcuts.
      console.warn(`${NS}: the default binding is unavailable`, error)
      try {
        return ctx.shortcuts.register({ ...command, defaults: {} })
      } catch (fallbackError) {
        console.warn(`${NS}: the toggle command could not be registered`, fallbackError)
        return []
      }
    }
  }, `${NS}: toggle command`)
}

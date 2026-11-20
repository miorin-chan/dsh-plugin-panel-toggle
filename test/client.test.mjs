import assert from 'node:assert/strict'
import { test } from 'node:test'

/** Capture the module registration the browser module loader would receive. */
let registration
globalThis.window = {
  __ModuleLoader__: {
    load(entry) {
      registration = entry
    },
  },
}
await import('../client.js')

assert.equal(registration.id, 'dsh-plugin-panel-toggle')
const plugin = registration.factory()

/**
 * Build the smallest faithful Client context around one panel toggle command.
 *
 * `layout` mirrors the host controller: only registered main keys can be
 * selected (null always shows the Conversation), and every selection is
 * published to `panelInfo` subscribers.
 * @param options - initially registered main-panel keys and the active panel.
 * @returns the context, the selection log, and helpers that drive the UI.
 */
function harness({ panels = ['plugins', 'schedule'], active = null } = {}) {
  const registered = [...panels]
  const selections = []
  const commands = []
  const listeners = new Set()
  const disposers = []
  let current = active

  const publish = () => { for (const listener of [...listeners]) listener() }

  const layout = {
    panelInfo: {
      getSnapshot: () => ({ activePanelId: current }),
      subscribe(listener) {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
    },
    selectPanel(panel) {
      if (panel !== null && !registered.includes(panel)) throw new Error(`not registered: ${panel}`)
      selections.push(panel)
      current = panel
      publish()
    },
  }

  const ctx = {
    locale: {
      register() { return () => {} },
      bind() { return key => key },
    },
    layout,
    shortcuts: {
      register(command) {
        commands.push(command)
        return () => {
          const index = commands.indexOf(command)
          if (index >= 0) commands.splice(index, 1)
        }
      },
    },
    effect(callback) {
      const dispose = callback()
      if (typeof dispose === 'function') disposers.push(dispose)
      return dispose
    },
  }

  return {
    ctx,
    commands,
    selections,
    registered,
    get active() { return current },
    /** Simulate a sidebar or mouse selection the shortcut did not cause. */
    click(panel) { layout.selectPanel(panel) },
    press(context = {}) {
      const command = commands[0]
      assert.ok(command, 'the toggle command is registered')
      return command.resolve({ modal: null, region: 'page', target: null, ...context })
    },
    finish() {
      while (disposers.length > 0) disposers.pop()()
    },
  }
}

const BINDING = { code: 'Comma', modifiers: ['primary', 'shift'] }

test('binds Mod+Shift+, in every supported profile', () => {
  const ui = harness()
  plugin.apply(ui.ctx)

  assert.equal(ui.commands.length, 1)
  const [command] = ui.commands
  assert.equal(command.id, 'plugins.panel.toggle')
  assert.equal(typeof command.label(), 'string')
  assert.deepEqual(command.defaults, {
    'desktop:macos': BINDING,
    'desktop:windows': BINDING,
    'desktop:linux': BINDING,
    'web:macos': BINDING,
    'web:windows': BINDING,
    'web:linux': BINDING,
  })
  assert.deepEqual([...command.regions], ['page', 'editable', 'terminal'])
  assert.deepEqual([...command.modals], [])
})

test('switches from the Conversation to the Plugins panel and back', () => {
  const ui = harness()
  plugin.apply(ui.ctx)

  assert.equal(ui.press().status, 'handled')
  ui.press().run()
  assert.equal(ui.active, 'plugins')

  ui.press().run()
  assert.equal(ui.active, null)
  assert.deepEqual(ui.selections, ['plugins', null])
})

test('returns to the panel the user left, not always the Conversation', () => {
  const ui = harness({ active: 'schedule' })
  plugin.apply(ui.ctx)

  ui.press().run()
  assert.equal(ui.active, 'plugins')
  ui.press().run()
  assert.equal(ui.active, 'schedule')
})

test('remembers the page left when the Plugins panel was opened by mouse', () => {
  const ui = harness({ active: 'schedule' })
  plugin.apply(ui.ctx)

  ui.click('plugins')
  assert.equal(ui.active, 'plugins')
  ui.press().run()
  assert.equal(ui.active, 'schedule')
})

test('returns to the Conversation when the app starts on the Plugins panel', () => {
  const ui = harness({ active: 'plugins' })
  plugin.apply(ui.ctx)

  ui.press().run()
  assert.equal(ui.active, null)
})

test('leaves the press alone while a dialog owns input', () => {
  const ui = harness({ active: 'schedule' })
  plugin.apply(ui.ctx)

  assert.deepEqual(ui.press({ modal: 'settings' }), { status: 'pass' })
  assert.equal(ui.active, 'schedule')
  assert.deepEqual(ui.selections, [])
})

test('falls back to the Conversation when the remembered panel is gone', () => {
  const ui = harness({ active: 'schedule' })
  plugin.apply(ui.ctx)
  ui.press().run()
  assert.equal(ui.active, 'plugins')

  ui.registered.splice(ui.registered.indexOf('schedule'), 1)
  ui.press().run()
  assert.equal(ui.active, null)
})

test('does not throw when the profile has no Plugins panel', () => {
  const ui = harness({ active: 'schedule', panels: ['schedule'] })
  plugin.apply(ui.ctx)

  ui.press().run()
  assert.equal(ui.active, null)
})

test('stays usable, unbound, when another command owns the combination', () => {
  const ui = harness()
  const register = ui.ctx.shortcuts.register.bind(ui.ctx.shortcuts)
  let calls = 0
  ui.ctx.shortcuts.register = command => {
    calls += 1
    if (calls === 1) throw new Error('Conflicting shortcut defaults')
    return register(command)
  }
  const warnings = []
  const originalWarn = console.warn
  console.warn = (...args) => { warnings.push(args) }
  try {
    plugin.apply(ui.ctx)
  } finally {
    console.warn = originalWarn
  }

  assert.equal(ui.commands.length, 1)
  assert.deepEqual(ui.commands[0].defaults, {})
  assert.equal(warnings.length, 1)
  ui.press().run()
  assert.equal(ui.active, 'plugins')
})

test('removes the command and stops tracking the panel when unloaded', () => {
  const ui = harness({ active: 'schedule' })
  plugin.apply(ui.ctx)
  assert.equal(ui.commands.length, 1)

  ui.finish()
  assert.equal(ui.commands.length, 0)
  assert.deepEqual(ui.selections, [], 'no selection happens without a press')
})

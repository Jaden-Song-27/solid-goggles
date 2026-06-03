import { app, globalShortcut, screen } from 'electron'
import { createMainWindow, getMainWindow, showMainWindow } from './window'
import { createTray, destroyTray } from './tray'
import { registerIpcHandlers } from './ipc'
import { saveForegroundWindow } from './native-injector'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.on('second-instance', () => {
  const win = getMainWindow()
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.whenReady().then(() => {
  registerIpcHandlers()
  initLaunchOnStartup()
  createMainWindow()
  createTray()
  registerGlobalShortcuts()

  // Auto-show the input panel once the renderer has loaded
  const win = getMainWindow()
  if (win) {
    const showPanel = () => {
      // Center on screen for maximum visibility
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      win.setSize(680, 200) // Taller to be visible
      win.center()
      win.setIgnoreMouseEvents(false)
      win.show()
      win.focus()
      win.webContents.send('ime:toggle-input')
    }

    win.webContents.on('did-finish-load', showPanel)
    // Fallback: if already loaded (dev mode HMR), show immediately
    if (!win.webContents.isLoading()) {
      showPanel()
    }
  }
})

app.on('window-all-closed', (e: Electron.Event) => {
  e.preventDefault()
})

app.on('before-quit', () => {
  destroyTray()
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  const win = getMainWindow()
  if (win) win.show()
})

function registerGlobalShortcuts() {
  function onToggle() {
    const win = getMainWindow()
    if (!win) return
    if (win.isVisible()) {
      win.hide()
      win.webContents.send('ime:toggle-input')
    } else {
      // Save which app has focus BEFORE we steal it
      saveForegroundWindow()
      showMainWindow()
      setTimeout(() => win.webContents.send('ime:toggle-input'), 30)
    }
  }

  // Try multiple shortcuts in order. WPS/WeChat/etc may steal Alt+=,
  // so we fall back to combinations less likely to conflict.
  const shortcuts = [
    'Alt+Z',
    'Ctrl+Alt+Z',
    'Alt+Shift+Z',
    'Alt+=',
  ]

  let registered = false
  for (const key of shortcuts) {
    try {
      const ok = globalShortcut.register(key, onToggle)
      if (ok) {
        console.log('[SmartIME] Registered shortcut:', key)
        registered = true
        break
      }
    } catch {
      // Try next
    }
  }

  if (!registered) {
    console.warn('[SmartIME] Failed to register any global shortcut. Use tray menu to toggle.')
  }
}

/**
 * Read settings.json and sync launch-on-startup to the OS.
 * Called once on app ready, and again whenever settings are saved.
 */
export function initLaunchOnStartup(): void {
  try {
    const settingsPath = join(app.getPath('userData'), 'settings.json')
    if (existsSync(settingsPath)) {
      const raw = readFileSync(settingsPath, 'utf-8')
      const settings = JSON.parse(raw)
      app.setLoginItemSettings({
        openAtLogin: !!settings.launchOnStartup,
      })
    }
  } catch {
    // Settings file doesn't exist yet — use default (off)
    app.setLoginItemSettings({ openAtLogin: false })
  }
}

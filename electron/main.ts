import { app, globalShortcut, screen } from 'electron'
import { createMainWindow, getMainWindow, showMainWindow } from './window'
import { createTray, destroyTray } from './tray'
import { registerIpcHandlers } from './ipc'
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
    if (win) {
      showMainWindow()
      win.webContents.send('ime:toggle-input')
    }
  }

  // Register Alt+= as the toggle shortcut
  try {
    globalShortcut.register('Alt+=', onToggle)
  } catch {
    console.warn('[SmartIME] Failed to register global shortcut. Use tray menu to toggle.')
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

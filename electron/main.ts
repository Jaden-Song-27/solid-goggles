import { app, globalShortcut } from 'electron'
import { createMainWindow, getMainWindow, showMainWindow } from './window'
import { createTray, destroyTray } from './tray'
import { registerIpcHandlers } from './ipc'

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
  createMainWindow()
  createTray()
  registerGlobalShortcuts()
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
  let lastCtrlTime = 0
  const DOUBLE_PRESS_THRESHOLD = 300 // ms

  function onCtrlPress() {
    const now = Date.now()
    if (now - lastCtrlTime < DOUBLE_PRESS_THRESHOLD) {
      const win = getMainWindow()
      if (win) {
        showMainWindow()
        win.webContents.send('ime:toggle-input')
      }
      lastCtrlTime = 0 // reset to prevent triple-tap from re-toggling
      return
    }
    lastCtrlTime = now
  }

  globalShortcut.register('ControlLeft', onCtrlPress)
  globalShortcut.register('ControlRight', onCtrlPress)
}

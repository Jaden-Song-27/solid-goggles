import { ipcMain, dialog, screen, clipboard, app } from 'electron'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { showMainWindow, hideMainWindow, resizeMainWindow, getCursorContext } from '../window'
import { injectText, sendBackspace, forwardCtrlZ } from '../native-injector'

function getUserDataPath(): string {
  return app.getPath('userData')
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function registerIpcHandlers(): void {
  // ---- Window controls ----
  ipcMain.on('ime:show-window', () => showMainWindow())
  ipcMain.on('ime:hide-window', () => hideMainWindow())
  ipcMain.on('ime:resize-window', (_event, w: number, h: number) => resizeMainWindow(w, h))

  // ---- Context: cursor position ----
  ipcMain.handle('context:cursor', () => {
    const point = screen.getCursorScreenPoint()
    return { x: point.x, y: point.y }
  })

  // ---- Context: active app name (best-effort) ----
  ipcMain.handle('context:app-name', () => {
    // On Windows, get the foreground window title
    try {
      const { execSync } = require('child_process')
      if (process.platform === 'win32') {
        // Powershell to get foreground window process name
        const result = execSync(
          'powershell -command "(Get-Process -Id (Get-ForegroundWindow|Select-Object -ExpandProperty ProcessId)).ProcessName"',
          { timeout: 1000, encoding: 'utf-8' },
        )
        return result.trim() || 'unknown'
      }
    } catch {
      // Fallback
    }
    return 'unknown'
  })

  // ---- Context: pre-cursor text (best-effort placeholder) ----
  ipcMain.handle('context:pre-cursor-text', async () => {
    try {
      return getCursorContext()
    } catch {
      return ''
    }
  })

  // ---- Text injection (uses native SendInput / CGEvent / xdotool) ----
  ipcMain.handle('ime:inject-text', async (_event, text: string) => {
    try {
      const success = injectText(text)
      if (!success) {
        // Fallback: copy to clipboard
        clipboard.writeText(text)
        console.log(`[SmartIME] Injection fallback: "${text}" copied to clipboard`)
      }
    } catch (err) {
      console.error('[SmartIME] Injection error:', err)
      clipboard.writeText(text)
    }
  })

  // ---- Regret: send backspace ----
  ipcMain.handle('ime:send-backspace', async (_event, count: number) => {
    try {
      sendBackspace(count)
    } catch (err) {
      console.error('[SmartIME] Backspace error:', err)
    }
  })

  // ---- Clipboard read ----
  ipcMain.handle('clipboard:read', async () => {
    return clipboard.readText()
  })

  // ---- Regret: forward Ctrl+Z to active app ----
  ipcMain.handle('ime:forward-ctrl-z', async () => {
    try {
      forwardCtrlZ()
    } catch (err) {
      console.error('[SmartIME] Forward Ctrl+Z error:', err)
    }
  })

  // ---- Skin: load ----
  ipcMain.handle('skin:load', async (_event, skinId: string) => {
    const skinsDir = join(getUserDataPath(), 'skins')
    const filePath = join(skinsDir, `${skinId}.json`)
    if (existsSync(filePath)) {
      return readFileSync(filePath, 'utf-8')
    }
    return JSON.stringify(null)
  })

  // ---- Skin: save ----
  ipcMain.handle('skin:save', async (_event, skinId: string, config: string) => {
    const skinsDir = join(getUserDataPath(), 'skins')
    ensureDir(skinsDir)
    const filePath = join(skinsDir, `${skinId}.json`)
    writeFileSync(filePath, config, 'utf-8')
  })

  // ---- Skin: export ----
  ipcMain.handle('skin:export', async (_event, skinId: string) => {
    const skinsDir = join(getUserDataPath(), 'skins')
    const filePath = join(skinsDir, `${skinId}.json`)
    if (!existsSync(filePath)) {
      return { success: false, error: 'Skin not found' }
    }
    const result = await dialog.showSaveDialog({
      title: '导出皮肤',
      defaultPath: `${skinId}.smartskin.json`,
      filters: [{ name: 'SmartIME Skin', extensions: ['json'] }],
    })
    if (!result.canceled && result.filePath) {
      const content = readFileSync(filePath, 'utf-8')
      writeFileSync(result.filePath, content, 'utf-8')
      return { success: true }
    }
    return { success: false }
  })

  // ---- Skin: import ----
  ipcMain.handle('skin:import', async () => {
    const result = await dialog.showOpenDialog({
      title: '导入皮肤',
      filters: [{ name: 'SmartIME Skin', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const content = readFileSync(result.filePaths[0], 'utf-8')
      return content
    }
    return JSON.stringify(null)
  })

  // ---- Quick commands ----
  ipcMain.handle('commands:get', async () => {
    const filePath = join(getUserDataPath(), 'commands.json')
    if (existsSync(filePath)) {
      return readFileSync(filePath, 'utf-8')
    }
    return JSON.stringify([])
  })

  ipcMain.handle('commands:save', async (_event, commands: string) => {
    ensureDir(getUserDataPath())
    const filePath = join(getUserDataPath(), 'commands.json')
    writeFileSync(filePath, commands, 'utf-8')
  })

  // ---- Word frequency ----
  ipcMain.on('learning:record', (_event, text: string) => {
    const freqPath = join(getUserDataPath(), 'word-frequency.json')
    let freq: Record<string, number> = {}
    if (existsSync(freqPath)) {
      try {
        freq = JSON.parse(readFileSync(freqPath, 'utf-8'))
      } catch {
        freq = {}
      }
    }
    const words = text.split(/\s+/).filter(Boolean)
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1
    }
    ensureDir(getUserDataPath())
    writeFileSync(freqPath, JSON.stringify(freq), 'utf-8')
  })

  ipcMain.handle('learning:frequency', async () => {
    const freqPath = join(getUserDataPath(), 'word-frequency.json')
    if (existsSync(freqPath)) {
      return readFileSync(freqPath, 'utf-8')
    }
    return JSON.stringify({})
  })

  // ---- Settings ----
  ipcMain.handle('settings:get', async () => {
    const filePath = join(getUserDataPath(), 'settings.json')
    if (existsSync(filePath)) {
      return readFileSync(filePath, 'utf-8')
    }
    return JSON.stringify({
      autoHideDelay: 3000,
      defaultSkinId: 'ghost',
      launchOnStartup: false,
      showSkinBadge: true,
    })
  })

  ipcMain.handle('settings:save', async (_event, json: string) => {
    ensureDir(getUserDataPath())
    const filePath = join(getUserDataPath(), 'settings.json')
    writeFileSync(filePath, json, 'utf-8')
  })
}

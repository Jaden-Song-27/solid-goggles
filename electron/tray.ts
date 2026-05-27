import { Tray, Menu, nativeImage, app, dialog } from 'electron'
import { getMainWindow, showMainWindow, toggleMainWindow } from './window'

let tray: Tray | null = null

/** Built-in skin IDs for the tray menu */
const builtInSkinIds = ['ghost', 'terminal', 'frosted', 'ink', 'minimal']
const builtInSkinLabels: Record<string, string> = {
  ghost: 'Ghost 幽灵',
  terminal: 'Terminal 终端',
  frosted: 'Frosted 冰霜',
  ink: 'Ink 水墨',
  minimal: 'Minimal 极简',
}

function getTrayIcon(): Electron.NativeImage {
  const { join } = require('path')
  // In dev: dist-electron/ → ../resources/
  // In production (packed): resources/app/dist-electron/ → ../../  (the extraResources dir)
  const trayPath = app.isPackaged
    ? join(__dirname, '../../tray-icon.png')
    : join(__dirname, '../resources/tray-icon.png')
  return nativeImage.createFromPath(trayPath).resize({ width: 24, height: 24 })
}

export function createTray(): Tray {
  const icon = getTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('SmartIME - 智能输入法')

  buildMenu()
  tray.on('click', () => toggleMainWindow())

  return tray
}

function buildMenu() {
  if (!tray) return

  const skinItems = builtInSkinIds.map((id) => ({
    label: builtInSkinLabels[id] || id,
    type: 'normal' as const,
    click: () => {
      const win = getMainWindow()
      if (win) {
        win.webContents.send('ime:switch-skin', id)
        if (!win.isVisible()) showMainWindow()
      }
    },
  }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏输入面板',
      click: () => toggleMainWindow(),
    },
    { type: 'separator' },
    {
      label: '皮肤',
      submenu: [
        ...skinItems,
        { type: 'separator' },
        {
          label: '皮肤编辑器',
          click: () => {
            const win = getMainWindow()
            if (win) {
              win.show()
              win.webContents.send('ime:navigate', 'editor')
            }
          },
        },
      ],
    },
    { type: 'separator' },
    {
      label: '快捷指令管理',
      click: () => {
        const win = getMainWindow()
        if (win) {
          win.show()
          win.webContents.send('ime:navigate', 'commands')
        }
      },
    },
    {
      label: '设置',
      click: () => {
        const win = getMainWindow()
        if (win) {
          win.show()
          win.webContents.send('ime:navigate', 'settings')
        }
      },
    },
    { type: 'separator' },
    {
      label: '关于 SmartIME',
      click: () => {
        dialog.showMessageBox({
          type: 'info',
          title: '关于 SmartIME',
          message: 'SmartIME v0.1.0',
          detail: '桌面端智能输入法\nElectron + React + TypeScript',
        })
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit(),
    },
  ])

  tray.setContextMenu(contextMenu)
}

/** Rebuild the tray menu (call when custom skins are added/removed) */
export function refreshTrayMenu(): void {
  buildMenu()
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

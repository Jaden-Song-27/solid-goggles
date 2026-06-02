import { Tray, Menu, nativeImage, app, dialog } from 'electron'
import { getMainWindow, showMainWindow, toggleMainWindow } from './window'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'

let tray: Tray | null = null

/** Built-in skin IDs for the tray menu */
const builtInSkinIds = [
  'ghost', 'terminal', 'frosted', 'ink', 'minimal',
  'glass-purple', 'glass-ocean', 'glass-emerald', 'glass-rose',
  'glass-sunset', 'glass-midnight', 'glass-sky', 'glass-mint',
]
const builtInSkinLabels: Record<string, string> = {
  ghost: 'Ghost 幽灵',
  terminal: 'Terminal 终端',
  frosted: 'Frosted 冰霜',
  ink: 'Ink 水墨',
  minimal: 'Minimal 极简',
  'glass-purple': '紫水晶',
  'glass-ocean': '深海蓝',
  'glass-emerald': '翡翠绿',
  'glass-rose': '玫瑰粉',
  'glass-sunset': '日落橙',
  'glass-midnight': '午夜黑',
  'glass-sky': '天空蓝',
  'glass-mint': '薄荷绿',
}

function getCustomSkinList(): Array<{ id: string; name: string }> {
  try {
    const skinsDir = join(app.getPath('userData'), 'skins')
    if (!existsSync(skinsDir)) return []
    const files = readdirSync(skinsDir).filter((f) => f.endsWith('.json'))
    return files
      .map((f) => {
        try {
          const raw = readFileSync(join(skinsDir, f), 'utf-8')
          const skin = JSON.parse(raw)
          return { id: f.replace('.json', ''), name: skin.name || f }
        } catch {
          return { id: f.replace('.json', ''), name: f.replace('.json', '') }
        }
      })
      .filter((s) => !builtInSkinIds.includes(s.id))
  } catch {
    return []
  }
}

function getTrayIcon(): Electron.NativeImage {
  const { join } = require('path')
  const trayPath = app.isPackaged
    ? join(process.resourcesPath, 'resources', 'tray-icon.png')
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

  const customSkins = getCustomSkinList()

  const skinItems = [
    ...builtInSkinIds.map((id) => ({
      label: builtInSkinLabels[id] || id,
      type: 'normal' as const,
      click: () => {
        const win = getMainWindow()
        if (win) {
          win.webContents.send('ime:switch-skin', id)
          if (!win.isVisible()) showMainWindow()
        }
      },
    })),
    ...(customSkins.length > 0
      ? [{ type: 'separator' as const }]
      : []),
    ...customSkins.map((s) => ({
      label: `${s.name} (自定义)`,
      type: 'normal' as const,
      click: () => {
        const win = getMainWindow()
        if (win) {
          win.webContents.send('ime:switch-skin', s.id)
          if (!win.isVisible()) showMainWindow()
        }
      },
    })),
  ]

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

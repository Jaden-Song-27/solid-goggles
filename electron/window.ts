import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null

const DIST_ELECTRON = join(__dirname)
const DIST = join(DIST_ELECTRON, '../dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

/** Default window dimensions */
const WIN_W = 680
const WIN_H = 72

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: WIN_W,
    height: WIN_H,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: join(DIST_ELECTRON, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(DIST, 'index.html'))
  }

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow?.hide()
  })

  // Blur -> hide: when window loses focus, notify renderer to hide
  mainWindow.on('blur', () => {
    mainWindow?.webContents.send('ime:blur')
    // Small delay to allow click events on candidates to fire before hiding
    setTimeout(() => {
      if (mainWindow && !mainWindow.isFocused()) {
        // Make window click-through when overlay is hidden
        mainWindow.setIgnoreMouseEvents(true, { forward: true })
        mainWindow.webContents.send('ime:hide-request')
      }
    }, 150)
  })

  return mainWindow
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

/**
 * Show the window positioned 15px below the current cursor position.
 * If the cursor position cannot be determined, centers on screen.
 */
export function showMainWindow(): void {
  if (!mainWindow) return

  // Position at cursor + 15px below, then show
  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)
  const { x: displayX, y: displayY, width: displayW, height: displayH } = display.workArea

  let posX = cursorPoint.x - Math.round(WIN_W / 2)
  let posY = cursorPoint.y + 15

  // Clamp to screen bounds
  if (posX < displayX) posX = displayX + 8
  if (posX + WIN_W > displayX + displayW) posX = displayX + displayW - WIN_W - 8
  if (posY + WIN_H > displayY + displayH) {
    // Place above cursor if not enough room below
    posY = cursorPoint.y - WIN_H - 15
  }
  if (posY < displayY) posY = displayY + 8

  mainWindow.setPosition(posX, posY)
  // Enable mouse event capture so candidates are clickable
  mainWindow.setIgnoreMouseEvents(false)
  mainWindow.show()
  mainWindow.focus()
}

export function hideMainWindow(): void {
  if (mainWindow) {
    mainWindow.hide()
  }
}

export function resizeMainWindow(w: number, h: number): void {
  if (mainWindow) {
    mainWindow.setSize(w, h)
    mainWindow.center()
  }
}

export function toggleMainWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    showMainWindow()
  }
}

/**
 * Get up to 30 characters of text before the current cursor position
 * in the active application. Returns empty string on failure.
 *
 * Production implementations:
 *   Windows: UI Automation (IUIAutomationTextPattern)
 *   macOS: Accessibility API (AXUIElementCopyParameterizedAttributeValue)
 *   Linux: AT-SPI / D-Bus
 */
export function getCursorContext(): string {
  // Placeholder — real implementation requires platform accessibility APIs
  return ''
}

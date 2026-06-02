import { execSync } from 'child_process'

// ---- Platform Detection ----
const isWindows = process.platform === 'win32'
const isMacOS = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

/**
 * Escape text for Wscript.Shell.SendKeys.
 * SendKeys interprets { } ( ) + ^ % ~ as special characters.
 */
function escapeForSendKeys(text: string): string {
  return text
    .replace(/\{/g, '{{}')
    .replace(/\}/g, '{}}')
    .replace(/\(/g, '{(}')
    .replace(/\)/g, '{)}')
    .replace(/\+/g, '{+}')
    .replace(/\^/g, '{^}')
    .replace(/%/g, '{%}')
    .replace(/~/g, '{~}')
}

// ---- Win32: SendInput via koffi ----

/** Type-safe koffi FFI references */
interface KoffiStructDescriptor {
  /* opaque — value returned by koffi.struct() */
}
interface KoffiInstance {
  struct(name: string, fields: Record<string, string | KoffiStructDescriptor>): KoffiStructDescriptor
  load(lib: string): { func(signature: string): unknown }
  sizeOf(obj: unknown): number
}

interface SendInputFn {
  (cInputs: number, pInputs: unknown, cbSize: number): number
}

let koffi: KoffiInstance | null = null
let SendInput: SendInputFn | null = null

interface KEYBDINPUT {
  wVk: number
  wScan: number
  dwFlags: number
  time: number
  dwExtraInfo: number
}

interface INPUT_STRUCT {
  type: number
  ki: KEYBDINPUT
}

function loadWin32(): boolean {
  try {
    koffi = require('koffi') as KoffiInstance

    // Register INPUT struct with koffi — required for FFI marshalling.
    // Without this, koffi cannot translate JS objects to the C struct
    // expected by SendInput's INPUT* parameter.
    koffi.struct('INPUT', {
      type: 'uint32',
      ki: koffi.struct('KEYBDINPUT', {
        wVk: 'uint16',
        wScan: 'uint16',
        dwFlags: 'uint32',
        time: 'uint32',
        dwExtraInfo: 'uint64',
      }),
    })

    // Bind SendInput from user32.dll
    SendInput = koffi
      .load('user32.dll')
      .func('uint32 SendInput(uint32 cInputs, INPUT* pInputs, int cbSize)') as SendInputFn

    return true
  } catch {
    koffi = null
    SendInput = null
    return false
  }
}

const KEYEVENTF_UNICODE = 0x0004
const KEYEVENTF_KEYUP = 0x0002
const KEYEVENTF_SCANCODE = 0x0008
const INPUT_KEYBOARD = 1

// Common virtual key codes (Windows)
const VK_BACK = 0x08
const VK_CONTROL = 0x11
const VK_Z = 0x5A
const VK_DELETE = 0x2E

function injectWin32(text: string): boolean {
  if (!koffi || !SendInput) return false

  const inputSize = koffi.sizeOf({ type: 0, ki: { wVk: 0, wScan: 0, dwFlags: 0, time: 0, dwExtraInfo: 0 } })
  const chars = [...text]
  const inputs: INPUT_STRUCT[] = []

  for (const ch of chars) {
    const code = ch.charCodeAt(0)
    // Key down (Unicode)
    inputs.push({
      type: INPUT_KEYBOARD,
      ki: {
        wVk: 0,
        wScan: code,
        dwFlags: KEYEVENTF_UNICODE,
        time: 0,
        dwExtraInfo: 0,
      },
    })
    // Key up (Unicode)
    inputs.push({
      type: INPUT_KEYBOARD,
      ki: {
        wVk: 0,
        wScan: code,
        dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
        time: 0,
        dwExtraInfo: 0,
      },
    })
  }

  // Send in batches of 20 (10 key presses) to avoid overwhelming the input queue
  const BATCH = 20
  for (let i = 0; i < inputs.length; i += BATCH) {
    const batch = inputs.slice(i, i + BATCH)
    const result = SendInput(batch.length, batch, inputSize)
    if (result === 0) return false
  }

  return true
}

// ---- macOS: CGEventPost via koffi ----
// CoreGraphics: CGEventCreateKeyboardEvent + CGEventPost
function injectMacOS(text: string): boolean {
  try {
    // On macOS, use osascript to trigger keystrokes
    // This is a fallback; proper implementation would use koffi + CGEvent
    const escaped = text.replace(/"/g, '\\"')
    execSync(
      `osascript -e 'tell application "System Events" to keystroke "${escaped}"'`,
      { timeout: 2000 },
    )
    return true
  } catch {
    return false
  }
}

// ---- Linux: xdotool ----
function injectLinux(text: string): boolean {
  try {
    execSync(`xdotool type "${text.replace(/"/g, '\\"')}"`, { timeout: 2000 })
    return true
  } catch {
    try {
      // Fallback: xte
      execSync(`xte "str ${text}"`, { timeout: 2000 })
      return true
    } catch {
      return false
    }
  }
}

/**
 * Send a virtual-key based key event (key down + key up).
 * Used for non-Unicode keys like Backspace, Enter, Ctrl, etc.
 */
function sendVKeyWin32(vkCode: number, count: number = 1): boolean {
  if (!koffi || !SendInput) return false

  const inputSize = koffi.sizeOf({ type: 0, ki: { wVk: 0, wScan: 0, dwFlags: 0, time: 0, dwExtraInfo: 0 } })
  const inputs: INPUT_STRUCT[] = []
  for (let i = 0; i < count; i++) {
    inputs.push({ type: INPUT_KEYBOARD, ki: { wVk: vkCode, wScan: 0, dwFlags: 0, time: 0, dwExtraInfo: 0 } })
    inputs.push({ type: INPUT_KEYBOARD, ki: { wVk: vkCode, wScan: 0, dwFlags: KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 } })
  }

  for (let i = 0; i < inputs.length; i += 20) {
    const batch = inputs.slice(i, i + 20)
    SendInput(batch.length, batch, inputSize)
  }

  return true
}

/**
 * Send Ctrl+Z to the currently focused application.
 * Used to forward Ctrl+Z when regret conditions are not met.
 */
function sendCtrlZWin32(): boolean {
  if (!koffi || !SendInput) return false

  const inputSize = koffi.sizeOf({ type: 0, ki: { wVk: 0, wScan: 0, dwFlags: 0, time: 0, dwExtraInfo: 0 } })
  const inputs: INPUT_STRUCT[] = [
    { type: INPUT_KEYBOARD, ki: { wVk: VK_CONTROL, wScan: 0, dwFlags: 0, time: 0, dwExtraInfo: 0 } },
    { type: INPUT_KEYBOARD, ki: { wVk: VK_Z, wScan: 0, dwFlags: 0, time: 0, dwExtraInfo: 0 } },
    { type: INPUT_KEYBOARD, ki: { wVk: VK_Z, wScan: 0, dwFlags: KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 } },
    { type: INPUT_KEYBOARD, ki: { wVk: VK_CONTROL, wScan: 0, dwFlags: KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 } },
  ]

  SendInput(inputs.length, inputs, inputSize)
  return true
}

// ---- Public API ----

let win32Loaded: boolean | null = null

/**
 * Inject text as simulated keyboard input into the currently focused window.
 */
export function injectText(text: string): boolean {
  if (isWindows) {
    if (win32Loaded === null) win32Loaded = loadWin32()
    if (win32Loaded) return injectWin32(text)
    try {
      const escaped = escapeForSendKeys(text).replace(/'/g, "''")
      execSync(
        `powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${escaped}')"`,
        { timeout: 2000 },
      )
      return true
    } catch {
      return false
    }
  }

  if (isMacOS) return injectMacOS(text)
  if (isLinux) return injectLinux(text)
  return false
}

/**
 * Send Backspace key `count` times to delete committed text on regret.
 */
export function sendBackspace(count: number): boolean {
  if (count <= 0) return true

  if (isWindows) {
    if (win32Loaded === null) win32Loaded = loadWin32()
    if (win32Loaded) return sendVKeyWin32(VK_BACK, count)
    try {
      execSync(
        `powershell -command "$wshell = New-Object -ComObject wscript.shell; for($i=0;$i -lt ${count};$i++){$wshell.SendKeys('{BACKSPACE}')}"`,
        { timeout: 3000 },
      )
      return true
    } catch {
      return false
    }
  }

  if (isMacOS) {
    try {
      for (let i = 0; i < count; i++) {
        execSync(
          'osascript -e \'tell application "System Events" to key code 51\'',
          { timeout: 1000 },
        )
      }
      return true
    } catch {
      return false
    }
  }

  if (isLinux) {
    try {
      for (let i = 0; i < count; i++) {
        execSync('xdotool key BackSpace', { timeout: 1000 })
      }
      return true
    } catch {
      return false
    }
  }

  return false
}

/**
 * Forward Ctrl+Z to the active application.
 * Used when regret conditions are not met so the app gets normal undo.
 */
export function forwardCtrlZ(): boolean {
  if (isWindows) {
    if (win32Loaded === null) win32Loaded = loadWin32()
    if (win32Loaded) return sendCtrlZWin32()
    try {
      execSync(
        'powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys(\'^z\')"',
        { timeout: 2000 },
      )
      return true
    } catch {
      return false
    }
  }

  if (isMacOS) {
    try {
      execSync(
        'osascript -e \'tell application "System Events" to keystroke "z" using control down\'',
        { timeout: 2000 },
      )
      return true
    } catch {
      return false
    }
  }

  if (isLinux) {
    try {
      execSync('xdotool key ctrl+z', { timeout: 2000 })
      return true
    } catch {
      return false
    }
  }

  return false
}

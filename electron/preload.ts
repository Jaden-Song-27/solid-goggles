import { contextBridge, ipcRenderer } from 'electron'

export interface ImeAPI {
  // Window controls
  toggleInput: (callback: () => void) => () => void
  onSwitchSkin: (callback: (skinId: string) => void) => () => void
  showWindow: () => void
  hideWindow: () => void
  resizeWindow: (w: number, h: number) => void

  // Navigation
  onNavigate: (callback: (page: string) => void) => () => void

  // Skin operations
  loadSkin: (skinId: string) => Promise<string>
  saveSkin: (skinId: string, config: string) => Promise<void>
  exportSkin: (skinId: string) => Promise<{ success: boolean; error?: string }>
  importSkin: () => Promise<string>

  // Context (cursor position / active app)
  getCursorContext: () => Promise<{ x: number; y: number }>
  getActiveAppName: () => Promise<string>
  getPreCursorText: () => Promise<string>

  // Quick commands
  getCommands: () => Promise<string>
  saveCommands: (commands: string) => Promise<void>

  // Word frequency
  recordInput: (text: string) => void
  getWordFrequency: () => Promise<string>

  // Text injection (Phase 2)
  injectText: (text: string) => Promise<void>

  // Regret mode (Phase 3)
  sendBackspace: (count: number) => Promise<void>
  forwardCtrlZ: () => Promise<void>

  // Settings
  getSettings: () => Promise<string>
  saveSettings: (json: string) => Promise<void>

  // Clipboard (Phase 5)
  readClipboard: () => Promise<string>

  // Blur / hide events from main process
  onBlur: (callback: () => void) => () => void
  onHideRequest: (callback: () => void) => () => void
}

const api: ImeAPI = {
  toggleInput(callback: () => void) {
    const handler = () => callback()
    ipcRenderer.on('ime:toggle-input', handler)
    return () => ipcRenderer.removeListener('ime:toggle-input', handler)
  },

  onSwitchSkin(callback: (skinId: string) => void) {
    const handler = (_event: Electron.IpcRendererEvent, skinId: string) =>
      callback(skinId)
    ipcRenderer.on('ime:switch-skin', handler)
    return () => ipcRenderer.removeListener('ime:switch-skin', handler)
  },

  showWindow() {
    ipcRenderer.send('ime:show-window')
  },

  hideWindow() {
    ipcRenderer.send('ime:hide-window')
  },

  resizeWindow(w: number, h: number) {
    ipcRenderer.send('ime:resize-window', w, h)
  },

  onNavigate(callback: (page: string) => void) {
    const handler = (_event: Electron.IpcRendererEvent, page: string) =>
      callback(page)
    ipcRenderer.on('ime:navigate', handler)
    return () => ipcRenderer.removeListener('ime:navigate', handler)
  },

  async loadSkin(skinId: string) {
    return ipcRenderer.invoke('skin:load', skinId)
  },

  async saveSkin(skinId: string, config: string) {
    return ipcRenderer.invoke('skin:save', skinId, config)
  },

  async exportSkin(skinId: string) {
    return ipcRenderer.invoke('skin:export', skinId)
  },

  async importSkin() {
    return ipcRenderer.invoke('skin:import')
  },

  async getCursorContext() {
    return ipcRenderer.invoke('context:cursor')
  },

  async getActiveAppName() {
    return ipcRenderer.invoke('context:app-name')
  },

  async getPreCursorText() {
    return ipcRenderer.invoke('context:pre-cursor-text')
  },

  async getCommands() {
    return ipcRenderer.invoke('commands:get')
  },

  async saveCommands(commands: string) {
    return ipcRenderer.invoke('commands:save', commands)
  },

  recordInput(text: string) {
    ipcRenderer.send('learning:record', text)
  },

  async getWordFrequency() {
    return ipcRenderer.invoke('learning:frequency')
  },

  async injectText(text: string) {
    return ipcRenderer.invoke('ime:inject-text', text)
  },

  async sendBackspace(count: number) {
    return ipcRenderer.invoke('ime:send-backspace', count)
  },

  async forwardCtrlZ() {
    return ipcRenderer.invoke('ime:forward-ctrl-z')
  },

  async readClipboard() {
    return ipcRenderer.invoke('clipboard:read')
  },

  async getSettings() {
    return ipcRenderer.invoke('settings:get')
  },

  async saveSettings(json: string) {
    return ipcRenderer.invoke('settings:save', json)
  },

  onBlur(callback: () => void) {
    const handler = () => callback()
    ipcRenderer.on('ime:blur', handler)
    return () => ipcRenderer.removeListener('ime:blur', handler)
  },

  onHideRequest(callback: () => void) {
    const handler = () => callback()
    ipcRenderer.on('ime:hide-request', handler)
    return () => ipcRenderer.removeListener('ime:hide-request', handler)
  },
}

contextBridge.exposeInMainWorld('imeAPI', api)

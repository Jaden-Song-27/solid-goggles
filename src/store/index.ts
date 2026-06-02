import { create } from 'zustand'
import type {
  AppState,
  AppSettings,
  SkinConfig,
  InputState,
  Candidate,
  HistoryEntry,
  AppPage,
  QuickCommand,
} from '../types'
import { recordSelection, refreshFrequency } from '../services/pinyin'

interface AppStore extends AppState {
  // Page navigation
  setPage: (page: AppPage) => void

  // Skin management
  setActiveSkin: (skinId: string) => void
  setSkins: (skins: SkinConfig[]) => void
  updateSkin: (skinId: string, config: Partial<SkinConfig>) => void
  addSkin: (skin: SkinConfig) => void
  removeSkin: (skinId: string) => void

  // Input state
  setComposing: (text: string) => void
  setCommitted: (text: string) => void
  setCandidates: (candidates: Candidate[]) => void
  setHighlightedIndex: (index: number) => void
  setVisible: (visible: boolean) => void
  toggleVisible: () => void
  setContext: (context: string) => void
  setCommandMode: (on: boolean) => void
  commitText: (candidate: Candidate) => void

  // Regret mode
  regret: () => void
  canRegret: () => boolean
  clearHistory: () => void
  confirmRegret: (candidate: Candidate) => void
  cancelRegret: () => void
  getRegrettingEntry: () => HistoryEntry | null

  // Quick commands
  setCommands: (commands: QuickCommand[]) => void
  addCommand: (cmd: QuickCommand) => void
  updateCommand: (id: string, cmd: Partial<QuickCommand>) => void
  removeCommand: (id: string) => void
  toggleCommand: (id: string) => void

  // Shared candidate selection (keyboard + click)
  selectCandidate: (candidate: Candidate) => Promise<void>

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

const FOCUS_WAIT_MS = 80 // Time for target app to regain focus after hiding

const initialInputState: InputState = {
  composing: '',
  committed: '',
  candidates: [],
  highlightedIndex: 0,
  isVisible: false,
  mode: 'transient',
  history: [],
  isRegretMode: false,
  context: '',
  isCommandMode: false,
}

const defaultSettings: AppSettings = {
  autoHideDelay: 3000,
  defaultSkinId: 'ghost',
  launchOnStartup: false,
  showSkinBadge: true,
}

// Holds the popped entry during regret mode (not in reactive state)
let _regrettingEntry: HistoryEntry | null = null

// Recent texts memory (loaded once, updated on commit)
let _recentTexts: Candidate[] = []

/** Load recent texts from disk and return as candidates */
export async function loadRecentTexts(): Promise<Candidate[]> {
  if (!window.imeAPI) return []
  try {
    const raw = await window.imeAPI.getRecentTexts()
    const texts: string[] = JSON.parse(raw || '[]')
    _recentTexts = texts.reverse().map((t, i) => ({
      id: `recent-${i}`,
      text: t,
      frequency: 900 - i * 10,
    }))
  } catch {
    _recentTexts = []
  }
  return _recentTexts
}

/** Save a committed text to recent memory */
function saveRecentText(text: string) {
  if (!window.imeAPI || text.length === 0) return
  window.imeAPI.saveRecentText(text)
  // Update in-memory cache
  _recentTexts = _recentTexts.filter((c) => c.text !== text)
  _recentTexts.unshift({ id: `recent-0`, text, frequency: 900 })
  if (_recentTexts.length > 20) _recentTexts = _recentTexts.slice(0, 20)
}

/** Get cached recent texts (no async) */
export function getRecentCandidates(): Candidate[] {
  return _recentTexts
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentPage: 'input',
  activeSkinId: 'ghost',
  skins: [],
  commands: [],
  inputState: { ...initialInputState },
  settings: { ...defaultSettings },

  setPage: (page) => set({ currentPage: page }),

  setActiveSkin: (skinId) => set({ activeSkinId: skinId }),

  setSkins: (skins) => set({ skins }),

  updateSkin: (skinId, config) =>
    set((state) => ({
      skins: state.skins.map((s) =>
        s.id === skinId ? { ...s, ...config } : s,
      ),
    })),

  addSkin: (skin) => {
    window.imeAPI?.refreshTray()
    set((state) => ({
      skins: [...state.skins, skin],
    }))
  },

  removeSkin: (skinId) => {
    window.imeAPI?.refreshTray()
    set((state) => ({
      skins: state.skins.filter((s) => s.id !== skinId),
      activeSkinId:
        state.activeSkinId === skinId
          ? state.skins[0]?.id ?? 'ghost'
          : state.activeSkinId,
    }))
  },

  setComposing: (composing) =>
    set((state) => ({ inputState: { ...state.inputState, composing } })),

  setCommitted: (committed) =>
    set((state) => ({ inputState: { ...state.inputState, committed } })),

  setCandidates: (candidates) =>
    set((state) => ({
      inputState: { ...state.inputState, candidates, highlightedIndex: 0 },
    })),

  setHighlightedIndex: (highlightedIndex) =>
    set((state) => ({ inputState: { ...state.inputState, highlightedIndex } })),

  setVisible: (isVisible) =>
    set((state) => {
      if (isVisible) {
        // Auto-enter regret mode if conditions are met
        const history = state.inputState.history
        if (history.length > 0) {
          const lastEntry = history[history.length - 1]
          if (Date.now() - lastEntry.timestamp <= 2000) {
            // Edge case: quick command (starts with /) — just backspace, no candidates
            if (lastEntry.pinyin.startsWith('/')) {
              if (window.imeAPI) {
                window.imeAPI.sendBackspace(lastEntry.text.length)
              }
              const newHistory = [...history]
              newHistory.pop()
              _regrettingEntry = null
              return {
                inputState: {
                  ...state.inputState,
                  isVisible: false,
                  composing: '',
                  candidates: [],
                  highlightedIndex: 0,
                  isRegretMode: false,
                  context: '',
                  history: newHistory,
                },
              }
            }

            // Edge case: single candidate — just backspace, no candidates
            if (lastEntry.candidates.length <= 1) {
              if (window.imeAPI) {
                window.imeAPI.sendBackspace(lastEntry.text.length)
              }
              const newHistory = [...history]
              newHistory.pop()
              _regrettingEntry = null
              return {
                inputState: {
                  ...state.inputState,
                  isVisible: false,
                  composing: '',
                  candidates: [],
                  highlightedIndex: 0,
                  isRegretMode: false,
                  context: '',
                  history: newHistory,
                },
              }
            }

            // Normal regret: delete old text, show candidates, highlight next
            if (window.imeAPI) {
              window.imeAPI.sendBackspace(lastEntry.text.length)
            }
            const newHistory = [...history]
            newHistory.pop()
            _regrettingEntry = lastEntry
            return {
              inputState: {
                ...state.inputState,
                isVisible: true,
                composing: lastEntry.pinyin,
                candidates: lastEntry.candidates,
                highlightedIndex:
                  (lastEntry.selectedIndex + 1) % Math.max(lastEntry.candidates.length, 1),
                history: newHistory,
                isRegretMode: true,
                context: '',
              },
            }
          }
        }
        // Normal show: fresh session
        _regrettingEntry = null
        return {
          inputState: {
            ...state.inputState,
            isVisible: true,
            composing: '',
            candidates: [],
            highlightedIndex: 0,
            isRegretMode: false,
            context: '',
          },
        }
      }
      // Hide: clear everything
      return {
        inputState: {
          ...state.inputState,
          isVisible: false,
          composing: '',
          candidates: [],
          highlightedIndex: 0,
          isRegretMode: false,
          context: '',
        },
      }
    }),

  toggleVisible: () =>
    set((state) => ({
      inputState: {
        ...state.inputState,
        isVisible: !state.inputState.isVisible,
        ...(state.inputState.isVisible
          ? { composing: '', candidates: [], isRegretMode: false, context: '' }
          : {}),
      },
    })),

  /**
   * Unified candidate selection: commit, animate fade-out, hide, inject text.
   * Used by both keyboard handler (useKeyboard) and click handler (App.tsx).
   */
  selectCandidate: async (candidate: Candidate) => {
    const state = get()
    const isRegret = state.inputState.isRegretMode

    // Commit to history
    if (isRegret) {
      state.confirmRegret(candidate)
    } else {
      state.commitText(candidate)
    }

    // Resolve /clip command placeholder: fetch actual clipboard content
    let resolvedText = candidate.text
    if (state.inputState.composing.startsWith('/clip') && candidate.text === '读取剪贴板中...') {
      if (window.imeAPI) {
        try {
          const clipText = await window.imeAPI.readClipboard()
          resolvedText = clipText || '(剪贴板为空)'
        } catch {
          resolvedText = '(剪贴板读取失败)'
        }
      }
    }

    // Hide the overlay FIRST so the target app regains focus
    if (window.imeAPI) {
      window.imeAPI.hideWindow()
    }
    set((s) => ({
      inputState: {
        ...s.inputState,
        isVisible: false,
        composing: '',
        candidates: [],
        highlightedIndex: 0,
        isRegretMode: false,
        context: '',
      },
    }))

    // Wait for target app to regain focus
    await new Promise((resolve) => setTimeout(resolve, FOCUS_WAIT_MS))

    // Now inject into the focused app
    if (window.imeAPI) {
      try {
        await window.imeAPI.injectText(resolvedText)
      } catch {
        console.warn('[SmartIME] Text injection failed, text may be in clipboard')
      }
    }
  },

  setContext: (context) =>
    set((state) => ({ inputState: { ...state.inputState, context } })),

  setCommandMode: (on) =>
    set((state) => ({ inputState: { ...state.inputState, isCommandMode: on } })),

  commitText: (candidate) => {
    const state = get()
    const entry: HistoryEntry = {
      pinyin: state.inputState.composing || (_regrettingEntry?.pinyin ?? ''),
      text: candidate.text,
      candidates: [...state.inputState.candidates],
      selectedIndex: state.inputState.highlightedIndex,
      timestamp: Date.now(),
      processName: '',
    }

    // Try to get active app name for regret mode context
    if (window.imeAPI) {
      window.imeAPI.getActiveAppName().then((name) => {
        entry.processName = name
      })
      window.imeAPI.recordInput(candidate.text)
    }

    recordSelection(candidate.text, candidate.text.length === 1)
    refreshFrequency()
    saveRecentText(candidate.text)

    set((s) => ({
      inputState: {
        ...s.inputState,
        committed: s.inputState.committed + candidate.text,
        composing: '',
        candidates: [],
        highlightedIndex: 0,
        isRegretMode: false,
        history: [...s.inputState.history, entry].slice(-50),
      },
    }))
  },

  regret: () => {
    const state = get()
    const history = [...state.inputState.history]
    if (history.length === 0) return

    const lastEntry = history.pop()!

    // Only allow regret within 2 seconds
    if (Date.now() - lastEntry.timestamp > 2000) {
      set((s) => ({
        inputState: { ...s.inputState, history, isRegretMode: false },
      }))
      return
    }

    // Edge case: quick command or single candidate — just delete, no candidates
    if (lastEntry.pinyin.startsWith('/') || lastEntry.candidates.length <= 1) {
      if (window.imeAPI) {
        window.imeAPI.sendBackspace(lastEntry.text.length)
      }
      set((s) => ({
        inputState: { ...s.inputState, history, isRegretMode: false },
      }))
      _regrettingEntry = null
      return
    }

    // Delete old text via backspace
    if (window.imeAPI) {
      window.imeAPI.sendBackspace(lastEntry.text.length)
    }

    // Remove committed text from session tracker
    const committed = state.inputState.committed
    const newCommitted = committed.slice(
      0,
      committed.length - lastEntry.text.length,
    )

    _regrettingEntry = lastEntry

    set((s) => ({
      inputState: {
        ...s.inputState,
        committed: newCommitted,
        candidates: lastEntry.candidates,
        highlightedIndex:
          (lastEntry.selectedIndex + 1) % Math.max(lastEntry.candidates.length, 1),
        history,
        isRegretMode: true,
      },
    }))
  },

  canRegret: () => {
    const state = get()
    if (state.inputState.history.length === 0) return false
    const lastEntry =
      state.inputState.history[state.inputState.history.length - 1]
    return Date.now() - lastEntry.timestamp <= 2000
  },

  confirmRegret: (candidate) => {
    const entry = _regrettingEntry
    const state = get()

    // Create updated history entry with new selection
    const newEntry: HistoryEntry = {
      pinyin: entry?.pinyin ?? state.inputState.composing,
      text: candidate.text,
      candidates: [...state.inputState.candidates],
      selectedIndex: state.inputState.highlightedIndex,
      timestamp: Date.now(),
      processName: entry?.processName ?? '',
    }

    if (window.imeAPI) {
      window.imeAPI.recordInput(candidate.text)
    }

    recordSelection(candidate.text, candidate.text.length === 1)
    refreshFrequency()
    saveRecentText(candidate.text)

    _regrettingEntry = null

    set((s) => ({
      inputState: {
        ...s.inputState,
        committed: s.inputState.committed + candidate.text,
        composing: '',
        candidates: [],
        highlightedIndex: 0,
        isRegretMode: false,
        history: [...s.inputState.history, newEntry].slice(-50),
      },
    }))
  },

  cancelRegret: () => {
    const entry = _regrettingEntry
    _regrettingEntry = null

    if (entry) {
      // Re-inject original text
      if (window.imeAPI) {
        window.imeAPI.injectText(entry.text)
      }
      // Restore history entry
      set((s) => ({
        inputState: {
          ...s.inputState,
          committed: s.inputState.committed + entry.text,
          composing: '',
          candidates: [],
          highlightedIndex: 0,
          isRegretMode: false,
          history: [...s.inputState.history, entry].slice(-50),
        },
      }))
    } else {
      set((s) => ({
        inputState: {
          ...s.inputState,
          composing: '',
          candidates: [],
          highlightedIndex: 0,
          isRegretMode: false,
        },
      }))
    }
  },

  getRegrettingEntry: () => _regrettingEntry,

  clearHistory: () => {
    _regrettingEntry = null
    set((state) => ({
      inputState: { ...state.inputState, history: [], isRegretMode: false },
    }))
  },

  setCommands: (commands) => set({ commands }),

  addCommand: (cmd) =>
    set((state) => ({
      commands: [...state.commands, cmd],
    })),

  updateCommand: (id, partial) =>
    set((state) => ({
      commands: state.commands.map((c) =>
        c.id === id ? { ...c, ...partial } : c,
      ),
    })),

  removeCommand: (id) =>
    set((state) => ({
      commands: state.commands.filter((c) => c.id !== id),
    })),

  toggleCommand: (id) =>
    set((state) => ({
      commands: state.commands.map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled } : c,
      ),
    })),

  // Settings
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  loadSettings: async () => {
    if (!window.imeAPI) return
    try {
      const raw = await window.imeAPI.getSettings()
      if (raw) {
        const parsed = JSON.parse(raw)
        set((state) => ({
          settings: { ...state.settings, ...parsed },
          activeSkinId: parsed.defaultSkinId || state.activeSkinId,
        }))
      }
    } catch {
      // Use defaults
    }
  },

  saveSettings: async () => {
    if (!window.imeAPI) return
    const { settings } = get()
    await window.imeAPI.saveSettings(JSON.stringify(settings))
  },
}))

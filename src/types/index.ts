// ============ Skin System Types ============

export interface SkinWindowConfig {
  /** CSS color or gradient string (e.g. 'linear-gradient(...)') */
  background: string
  /** Border radius in px */
  borderRadius: number
  /** Inner padding in px */
  padding: number
  /** CSS box-shadow string */
  boxShadow: string
  /** Opacity 0-1 */
  opacity: number
  /** Backdrop blur in px, 0 = no blur */
  backdropBlur: number
}

export interface SkinPinyinConfig {
  fontSize: number
  fontFamily: string
  color: string
  letterSpacing: number
  /** Divider line between pinyin and candidates area */
  dividerColor: string
  dividerWidth: number
  /** Divider style: 'solid' | 'dashed' | 'dotted' | 'none' */
  dividerStyle: 'solid' | 'dashed' | 'dotted' | 'none'
}

export interface SkinCandidateStateStyle {
  bg: string
  color: string
  /** Optional text-decoration */
  textDecoration?: string
}

export interface SkinCandidateConfig {
  /** Arrangement direction */
  direction: 'horizontal' | 'vertical' | 'grid'
  /** Gap between candidates in px */
  gap: number
  /** Candidate item border radius */
  borderRadius: number
  /** Candidate item padding (CSS string like "4px 10px") */
  padding: string
  fontSize: number
  fontFamily: string
  /** Color of the index label (1, 2, 3...) */
  labelColor: string
  /** Three visual states */
  states: {
    normal: SkinCandidateStateStyle
    hover: SkinCandidateStateStyle
    active: SkinCandidateStateStyle
  }
}

export interface SkinAnimationConfig {
  /** Popup animation type */
  enterType: 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'none'
  /** Dismiss animation type */
  exitType: 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'none'
  /** Animation duration in ms */
  duration: number
  /** Skin-switching transition */
  transitionType: 'crossfade' | 'instant'
}

export interface SkinConfig {
  id: string
  name: string
  version: string
  author: string
  description: string

  window: SkinWindowConfig
  pinyin: SkinPinyinConfig
  candidateContainer: SkinCandidateConfig
  /** Per-item candidate config (uses same structure; direction/gap ignored here) */
  candidate: SkinCandidateConfig
  animation: SkinAnimationConfig

  /** User CSS overrides, appended after default styles */
  customCSS: string
}

// ============ Input / Candidate Types ============

export interface Candidate {
  id: string
  text: string
  /** Frequency score for local learning */
  frequency: number
}

export interface HistoryEntry {
  /** Original pinyin string */
  pinyin: string
  /** Committed text */
  text: string
  /** All candidates at that moment */
  candidates: Candidate[]
  /** Selected candidate index */
  selectedIndex: number
  /** Unix timestamp (ms) */
  timestamp: number
  /** Process name of the target app */
  processName: string
}

export interface InputState {
  /** Current pinyin composing input */
  composing: string
  /** Accumulated committed text in current session */
  committed: string
  /** Candidate list */
  candidates: Candidate[]
  /** Highlighted candidate index */
  highlightedIndex: number
  /** Whether input overlay is visible */
  isVisible: boolean
  /** Whether in transient mode */
  mode: 'transient' | 'persistent'
  /** Upload history stack (max 50) */
  history: HistoryEntry[]
  /** Whether regret mode is active */
  isRegretMode: boolean
  /** Context text (up to 30 chars before cursor, read on activation) */
  context: string
  /** Whether currently in quick-command mode (triggered by /) */
  isCommandMode: boolean
}

// ============ Quick Command Types ============

export interface QuickCommand {
  id: string
  trigger: string
  description: string
  template: string
  enabled: boolean
}

// ============ App Settings Types ============

export interface AppSettings {
  /** Auto-hide delay in ms (0 = disabled) */
  autoHideDelay: number
  /** Default skin ID on app startup */
  defaultSkinId: string
  /** Launch on system startup */
  launchOnStartup: boolean
  /** Show skin badge on overlay */
  showSkinBadge: boolean
}

// ============ App State Types ============

export type AppPage = 'input' | 'skins' | 'editor' | 'commands' | 'settings'

export interface AppState {
  currentPage: AppPage
  activeSkinId: string
  skins: SkinConfig[]
  commands: QuickCommand[]
  inputState: InputState
  settings: AppSettings
}

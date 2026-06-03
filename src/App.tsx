import { useRef, useEffect, useState, lazy, Suspense } from 'react'
import { useAppStore } from './store'
import { useImeBridge, useSkin, useAutoHide, useKeyboard } from './hooks'
import { validateSkinConfig } from './skins/engine'
import { builtInSkins } from './skins'
import { initFrequency } from './services/pinyin'
import { loadRecentTexts, getRecentCandidates } from './store'
import type { SkinConfig, Candidate } from './types'

const SkinEditor = lazy(() => import('./components/SkinEditor'))
const SettingsPage = lazy(() => import('./components/SettingsPage'))
const CommandsPage = lazy(() => import('./components/CommandsPage'))

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const loadSettings = useAppStore((s) => s.loadSettings)

  // Initialize word frequency data, recent texts, and settings on startup
  useEffect(() => {
    initFrequency()
    loadSettings()
    loadRecentTexts()
  }, [])

  useImeBridge()
  useSkin(containerRef)
  useAutoHide(overlayRef)
  useKeyboard()

  const currentPage = useAppStore((s) => s.currentPage)
  const isVisible = useAppStore((s) => s.inputState.isVisible)
  const composing = useAppStore((s) => s.inputState.composing)
  const candidates = useAppStore((s) => s.inputState.candidates)
  const highlightedIndex = useAppStore((s) => s.inputState.highlightedIndex)
  const isRegretMode = useAppStore((s) => s.inputState.isRegretMode)
  const activeSkinId = useAppStore((s) => s.activeSkinId)
  const setVisible = useAppStore((s) => s.setVisible)
  const addSkin = useAppStore((s) => s.addSkin)
  const setActiveSkin = useAppStore((s) => s.setActiveSkin)
  const setPage = useAppStore((s) => s.setPage)

  const [dragOver, setDragOver] = useState(false)

  // Resize window based on current page
  useEffect(() => {
    if (!window.imeAPI) return
    if (currentPage === 'input') {
      window.imeAPI.resizeWindow(1360, 144)
    } else {
      window.imeAPI.resizeWindow(1200, 800)
    }
  }, [currentPage])

  // Show window when navigating to editor/settings pages
  useEffect(() => {
    if (currentPage !== 'input' && window.imeAPI) {
      window.imeAPI.showWindow()
    }
  }, [currentPage])

  // Sync window visibility to main process
  useEffect(() => {
    if (!window.imeAPI) return
    if (!isVisible) window.imeAPI.hideWindow()
    // Don't showWindow here — main process already did it for shortcut path.
    // This effect only handles the HIDE path to keep main process in sync.
  }, [isVisible])

  // Lightweight pop-in animation — no JS animation, CSS-only for speed
  useEffect(() => {
    const el = overlayRef.current
    if (!el || !isVisible) return
    el.style.opacity = '0'
    el.style.transform = 'scale(0.97)'
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 100ms ease-out, transform 100ms ease-out'
      el.style.opacity = '1'
      el.style.transform = 'scale(1)'
      setTimeout(() => {
        el.style.transition = ''
      }, 100)
    })
  }, [isVisible])

  // Drag-drop skin file import
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.name.endsWith('.json') && !file.name.endsWith('.skin.json')) continue

      try {
        const text = await file.text()
        const raw = JSON.parse(text)
        const ghostSkin = builtInSkins[0]
        const validated = validateSkinConfig(raw, ghostSkin)
        addSkin(validated)
        setActiveSkin(validated.id)
      } catch {
        // Silently skip invalid files
      }
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: currentPage === 'input' ? 'transparent' : '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: dragOver ? '2px dashed #6C5CE7' : 'none',
      }}
      onMouseDown={(e) => {
        if (currentPage === 'input') {
          e.stopPropagation()
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {currentPage === 'input' && isVisible && (
        <div ref={overlayRef} className="ime-overlay" style={{ maxWidth: '95%' }}>
          {/* Pinyin composing area */}
          <span className="ime-pinyin-text">
            {isRegretMode
              ? (composing || '(后悔)')
              : (composing || '')}
            {!isRegretMode && composing.length === 0 && (
              <span className="ime-recent-label">最近使用</span>
            )}
            <span className="ime-composing-cursor" />
          </span>

          {/* Recent texts shown when no typing */}
          {!isRegretMode && composing.length === 0 && candidates.length === 0 && (
            <div className="ime-candidates">
              {getRecentCandidates().slice(0, 10).map((c, i) => (
                <span
                  key={c.id}
                  className="ime-candidate"
                  onClick={() => {
                    useAppStore.getState().selectCandidate(c)
                  }}
                >
                  {c.text}
                </span>
              ))}
              {getRecentCandidates().length === 0 && (
                <span style={{ color: 'var(--ime-pinyin-color, #888)', opacity: 0.5, fontSize: 'inherit' }}>
                  输入拼音开始...
                </span>
              )}
            </div>
          )}

          {/* Divider */}
          {(composing.length > 0 || candidates.length > 0) && (
            <div className="ime-pinyin-divider" />
          )}

          {/* Regret mode indicator */}
          {isRegretMode && (
            <span className="ime-regret-indicator">↩ 后悔</span>
          )}

          {/* Candidates */}
          {candidates.length > 0 && (
            <div className="ime-candidates">
              {candidates.slice(0, 9).map((c, i) => (
                <span
                  key={c.id}
                  className={`ime-candidate ${i === highlightedIndex ? 'selected' : ''}`}
                  onClick={() => {
                    useAppStore.getState().selectCandidate(c)
                  }}
                >
                  <span className="ime-candidate-index">{i + 1}</span>
                  {c.text}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {candidates.length > 0 && (
            <div className="ime-actions">
              <button
                className="ime-action-btn ime-action-confirm"
                onClick={() => {
                  const store = useAppStore.getState()
                  const c = store.inputState.candidates[store.inputState.highlightedIndex]
                  if (!c) return
                  // If it's a hint, append space. Otherwise select.
                  if (store.inputState.composing.startsWith('/') && c.text.includes('—')) {
                    useAppStore.getState().setComposing(store.inputState.composing + ' ')
                  } else {
                    store.selectCandidate(c)
                  }
                }}
                title="确认 (Space)"
              >
                ↵
              </button>
              <button
                className="ime-action-btn ime-action-close"
                onClick={() => {
                  useAppStore.getState().setComposing('')
                  useAppStore.getState().setCandidates([])
                  useAppStore.getState().setVisible(false)
                }}
                title="关闭 (Esc)"
              >
                ✕
              </button>
            </div>
          )}

          {/* Skin badge */}
          {useAppStore.getState().settings.showSkinBadge && (
            <span className="ime-skin-badge">{activeSkinId}</span>
          )}
        </div>
      )}

      {currentPage !== 'input' && (
        <Suspense fallback={<div style={{ color: '#888', padding: 20 }}>加载中...</div>}>
          {currentPage === 'editor' && <SkinEditor />}
          {currentPage === 'commands' && <CommandsPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </Suspense>
      )}

      {/* Drag overlay hint */}
      {dragOver && (
        <div style={dragOverlayStyle}>
          拖放 .skin.json 文件以导入皮肤
        </div>
      )}
    </div>
  )
}

const dragOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(108, 92, 231, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6C5CE7',
  fontSize: 16,
  fontWeight: 600,
  pointerEvents: 'none',
  zIndex: 100,
}

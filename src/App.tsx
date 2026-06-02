import { useRef, useEffect, useState, lazy, Suspense } from 'react'
import { useAppStore } from './store'
import { useImeBridge, useSkin, useAutoHide, useKeyboard } from './hooks'
import { validateSkinConfig } from './skins/engine'
import { builtInSkins } from './skins'
import { initFrequency } from './services/pinyin'
import type { SkinConfig } from './types'

const SkinEditor = lazy(() => import('./components/SkinEditor'))
const SettingsPage = lazy(() => import('./components/SettingsPage'))
const CommandsPage = lazy(() => import('./components/CommandsPage'))

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const loadSettings = useAppStore((s) => s.loadSettings)

  // Initialize word frequency data and settings on startup
  useEffect(() => {
    initFrequency()
    loadSettings()
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
      window.imeAPI.resizeWindow(680, 72)
    } else {
      window.imeAPI.resizeWindow(800, 550)
    }
  }, [currentPage])

  // Show window when navigating to editor/settings pages
  useEffect(() => {
    if (currentPage !== 'input' && window.imeAPI) {
      window.imeAPI.showWindow()
    }
  }, [currentPage])

  // Notify main process of visibility changes to control mouse passthrough
  useEffect(() => {
    if (!window.imeAPI) return
    if (isVisible) {
      window.imeAPI.showWindow()
    } else {
      window.imeAPI.hideWindow()
    }
  }, [isVisible])

  // Fetch pre-cursor context when IME overlay becomes visible
  useEffect(() => {
    if (isVisible && window.imeAPI) {
      window.imeAPI.getPreCursorText().then((ctx) => {
        if (ctx) {
          useAppStore.getState().setContext(ctx)
        }
      })
    }
  }, [isVisible])

  // Web Animations API: popup animation when overlay appears
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    if (isVisible) {
      el.style.opacity = '0'
      el.style.transform = 'scale(0.95)'

      requestAnimationFrame(() => {
        el.animate(
          [
            { opacity: 0, transform: 'scale(0.95)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          {
            duration: 150,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards',
          },
        ).onfinish = () => {
          el.style.opacity = ''
          el.style.transform = ''
        }
      })
    }
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
              : (composing || '开始输入...')}
            <span className="ime-composing-cursor" />
          </span>

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

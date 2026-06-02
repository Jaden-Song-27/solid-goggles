import { useEffect } from 'react'
import { useAppStore } from '../store'
import { getCandidates } from '../services/pinyin'

// Batch candidate updates with rAF to prevent UI blocking on fast typing
let _rafId: number | null = null
function scheduleCandidates(setter: () => void) {
  if (_rafId !== null) cancelAnimationFrame(_rafId)
  _rafId = requestAnimationFrame(() => {
    _rafId = null
    setter()
  })
}

/**
 * Keyboard handler for the IME overlay.
 *
 * Input flow:
 * - a-z: append to composing pinyin string → update candidates in real time
 * - Backspace: remove last char from composing
 * - 1-9: select candidate → inject text → hide
 * - Arrow keys: navigate candidates
 * - Enter/Space: confirm highlighted candidate → inject → hide
 * - Ctrl+Z: regret mode
 * - Escape: cancel → hide without injection
 */
export function useKeyboard() {
  const isVisible = useAppStore((s) => s.inputState.isVisible)
  const composing = useAppStore((s) => s.inputState.composing)
  const candidates = useAppStore((s) => s.inputState.candidates)
  const highlightedIndex = useAppStore((s) => s.inputState.highlightedIndex)
  const isRegretMode = useAppStore((s) => s.inputState.isRegretMode)

  const setComposing = useAppStore((s) => s.setComposing)
  const setCandidates = useAppStore((s) => s.setCandidates)
  const setHighlightedIndex = useAppStore((s) => s.setHighlightedIndex)
  const selectCandidate = useAppStore((s) => s.selectCandidate)
  const setVisible = useAppStore((s) => s.setVisible)
  const regret = useAppStore((s) => s.regret)
  const cancelRegret = useAppStore((s) => s.cancelRegret)

  useEffect(() => {
    if (!isVisible) return

    function handleKeyDown(e: KeyboardEvent) {
      // ---- Ctrl+Z: Regret mode / continuous regret ----
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        regret()
        return
      }

      // ---- Escape ----
      if (e.key === 'Escape') {
        e.preventDefault()
        if (isRegretMode) {
          // Keep original selection: re-inject original text, restore history
          cancelRegret()
          setVisible(false)
        } else {
          setComposing('')
          setCandidates([])
          setVisible(false)
        }
        return
      }

      // ---- Regret mode: number keys select new candidate ----
      if (isRegretMode && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (index < candidates.length) {
          selectCandidate(candidates[index])
        }
        return
      }

      // ---- Regret mode: Space/Enter confirm highlighted ----
      if (isRegretMode && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        if (candidates.length > 0 && candidates[highlightedIndex]) {
          selectCandidate(candidates[highlightedIndex])
        }
        return
      }

      // ---- Regret mode: Tab/Arrow keys navigate ----
      if (isRegretMode && (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        e.preventDefault()
        const next =
          highlightedIndex < candidates.length - 1
            ? highlightedIndex + 1
            : 0
        setHighlightedIndex(next)
        return
      }

      if (isRegretMode && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
        e.preventDefault()
        const prev =
          highlightedIndex > 0
            ? highlightedIndex - 1
            : Math.max(candidates.length - 1, 0)
        setHighlightedIndex(prev)
        return
      }

      // ---- Regret mode: typing exits regret and starts new session ----
      if (isRegretMode && /^[a-zA-Z/]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setVisible(true)
        setComposing(e.key.toLowerCase())
        return
      }

      // ---- Normal mode: Letters (a-z) and / for commands ----
      if (!isRegretMode && /^[a-zA-Z/]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const updated = composing + e.key.toLowerCase()
        setComposing(updated)
        setCandidates(getCandidates(updated))
        return
      }

      // ---- Command mode: digits and math symbols (for /calc, /trans args) ----
      if (!isRegretMode && composing.startsWith('/') && /^[\d+\-*/().%^]$/.test(e.key)) {
        e.preventDefault()
        const updated = composing + e.key
        setComposing(updated)
        scheduleCandidates(() => setCandidates(getCandidates(updated)))
        return
      }

      // ---- Normal mode: Space ----
      if (!isRegretMode && e.key === ' ' && composing.length > 0) {
        e.preventDefault()
        // Command mode: if we have results, select. Otherwise append space for args.
        if (composing.startsWith('/')) {
          if (!composing.includes(' ') && candidates.length === 0) {
            // No space yet and no results → type an argument
            setComposing(composing + ' ')
            return
          }
          if (candidates.length > 0 && candidates[highlightedIndex]) {
            selectCandidate(candidates[highlightedIndex])
            return
          }
        }
        if (candidates.length > 0 && candidates[highlightedIndex]) {
          selectCandidate(candidates[highlightedIndex])
        }
        return
      }

      // ---- Normal mode: Enter ----
      if (!isRegretMode && e.key === 'Enter') {
        e.preventDefault()
        if (candidates.length > 0 && candidates[highlightedIndex]) {
          const first = candidates[0]
          const isHint = first && first.text.includes('—')
          if (composing.startsWith('/') && isHint) {
            // Hint text → append space instead of injecting
            setComposing(composing + ' ')
            return
          }
          selectCandidate(candidates[highlightedIndex])
        }
        return
      }

      // ---- Normal mode: Backspace ----
      if (!isRegretMode && e.key === 'Backspace') {
        e.preventDefault()
        if (composing.length > 0) {
          const updated = composing.slice(0, -1)
          setComposing(updated)
          if (updated.length > 0) {
            scheduleCandidates(() => setCandidates(getCandidates(updated)))
          } else {
            setCandidates([])
          }
        }
        return
      }

      // ---- Normal mode: Number keys 1-9 ----
      if (!isRegretMode && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (index < candidates.length) {
          selectCandidate(candidates[index])
        }
        return
      }

      // ---- Arrow keys (both modes) ----
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        const next =
          highlightedIndex < candidates.length - 1
            ? highlightedIndex + 1
            : 0
        setHighlightedIndex(next)
        return
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const prev =
          highlightedIndex > 0
            ? highlightedIndex - 1
            : Math.max(candidates.length - 1, 0)
        setHighlightedIndex(prev)
        return
      }

      // ---- Tab: Cycle candidates (both modes) ----
      if (!isRegretMode && e.key === 'Tab') {
        e.preventDefault()
        const next =
          highlightedIndex < candidates.length - 1
            ? highlightedIndex + 1
            : 0
        setHighlightedIndex(next)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isVisible,
    isRegretMode,
    composing,
    candidates,
    highlightedIndex,
    setComposing,
    setCandidates,
    setHighlightedIndex,
    selectCandidate,
    setVisible,
    regret,
    cancelRegret,
  ])
}

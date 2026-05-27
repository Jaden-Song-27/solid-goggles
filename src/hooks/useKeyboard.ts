import { useEffect, useCallback } from 'react'
import { useAppStore } from '../store'
import { getCandidates } from '../services/pinyin'

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
  const commitText = useAppStore((s) => s.commitText)
  const setVisible = useAppStore((s) => s.setVisible)
  const regret = useAppStore((s) => s.regret)
  const confirmRegret = useAppStore((s) => s.confirmRegret)
  const cancelRegret = useAppStore((s) => s.cancelRegret)

  const injectAndHide = useCallback(async (text: string) => {
    // Resolve /clip command: fetch actual clipboard content
    let resolvedText = text
    if (composing.startsWith('/clip') && text === '读取剪贴板中...') {
      if (window.imeAPI) {
        try {
          const clipText = await window.imeAPI.readClipboard()
          resolvedText = clipText || '(剪贴板为空)'
        } catch {
          resolvedText = '(剪贴板读取失败)'
        }
      }
    }

    // Apply fade-out CSS animation class (100ms keyframe in global.css)
    const el = document.querySelector('.ime-overlay')
    if (el) {
      el.classList.add('ime-fading-out')
    }

    // Wait for fade-out animation to complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Hide the React overlay
    setVisible(false)

    // Brief delay to ensure the window is visually empty before text injection
    await new Promise((resolve) => setTimeout(resolve, 30))

    // Inject text into the active application
    if (window.imeAPI) {
      try {
        await window.imeAPI.injectText(resolvedText)
      } catch {
        console.warn('[SmartIME] Text injection failed, text may be in clipboard')
      }
    }
  }, [setVisible, composing])

  useEffect(() => {
    if (!isVisible) return

    function handleKeyDown(e: KeyboardEvent) {
      // ---- Ctrl+Z: Regret mode / continuous regret ----
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        if (isRegretMode) {
          // Continuous regret: go back one more entry
          regret()
        } else {
          regret()
        }
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
          confirmRegret(candidates[index])
          injectAndHide(candidates[index].text)
        }
        return
      }

      // ---- Regret mode: Space/Enter confirm highlighted ----
      if (isRegretMode && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        if (candidates.length > 0 && candidates[highlightedIndex]) {
          confirmRegret(candidates[highlightedIndex])
          injectAndHide(candidates[highlightedIndex].text)
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
      if (isRegretMode && /^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setVisible(true) // trigger clean session via setVisible
        setComposing(e.key.toLowerCase())
        return
      }

      // ---- Normal mode: Letters (a-z) ----
      if (!isRegretMode && /^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const updated = composing + e.key.toLowerCase()
        setComposing(updated)
        const newCandidates = getCandidates(updated)
        setCandidates(newCandidates)
        return
      }

      // ---- Command mode: digits and math symbols (for /calc, /trans args) ----
      if (!isRegretMode && composing.startsWith('/') && /^[\d+\-*/().%^]$/.test(e.key)) {
        e.preventDefault()
        const updated = composing + e.key
        setComposing(updated)
        setCandidates(getCandidates(updated))
        return
      }

      // ---- Normal mode: Space ----
      if (!isRegretMode && e.key === ' ' && composing.length > 0) {
        e.preventDefault()
        // In command mode (/trans, /calc): append space for typing arguments
        if (composing.startsWith('/')) {
          const updated = composing + ' '
          setComposing(updated)
          setCandidates(getCandidates(updated))
          return
        }
        if (candidates.length > 0 && candidates[highlightedIndex]) {
          const text = candidates[highlightedIndex].text
          commitText(candidates[highlightedIndex])
          injectAndHide(text)
        }
        return
      }

      // ---- Normal mode: Enter ----
      if (!isRegretMode && e.key === 'Enter') {
        e.preventDefault()
        if (candidates.length > 0 && candidates[highlightedIndex]) {
          const text = candidates[highlightedIndex].text
          commitText(candidates[highlightedIndex])
          injectAndHide(text)
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
            setCandidates(getCandidates(updated))
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
          const text = candidates[index].text
          commitText(candidates[index])
          injectAndHide(text)
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
    commitText,
    setVisible,
    regret,
    confirmRegret,
    cancelRegret,
    injectAndHide,
  ])
}

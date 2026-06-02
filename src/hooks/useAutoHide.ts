import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'

/**
 * Auto-hide the input overlay after a configurable period of inactivity.
 *
 * Timeline:
 * - 0.0s: start countdown when isVisible && composing === ''
 * - (delay - 0.8s): begin breathing warning animation
 * - delay: fade out (0.1s) then hide
 *
 * Any keystroke resets the timer.
 * When autoHideDelay is 0, auto-hide is disabled.
 *
 * @param overlayRef - React ref to the IME overlay DOM element.
 *   Accepts a RefObject from useRef or a callback for direct element access.
 */
const BREATHING_ADVANCE = 800 // Start warning 0.8s before hide
const FADE_OUT_DURATION = 100

export function useAutoHide(overlayRef?: React.RefObject<HTMLDivElement | null>) {
  const isVisible = useAppStore((s) => s.inputState.isVisible)
  const composing = useAppStore((s) => s.inputState.composing)
  const autoHideDelay = useAppStore((s) => s.settings.autoHideDelay)
  const setVisible = useAppStore((s) => s.setVisible)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const breathingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Get the overlay element via the provided ref, falling back to querySelector. */
  function getOverlayEl(): HTMLElement | null {
    if (overlayRef?.current) return overlayRef.current
    // Fallback for cases where ref hasn't been wired up yet
    return document.querySelector('.ime-overlay') as HTMLElement | null
  }

  useEffect(() => {
    if (!isVisible) {
      removeBreathing()
      removeFadeOut()
      return
    }

    // Clear all timers when user is actively typing
    if (composing.length > 0) {
      clearAllTimers()
      removeBreathing()
      return
    }

    // Start countdown when visible and idle (only if delay > 0)
    if (isVisible && composing.length === 0 && autoHideDelay > 0) {
      clearAllTimers()

      const breathingStart = Math.max(0, autoHideDelay - BREATHING_ADVANCE)

      // Start breathing warning
      if (breathingStart > 0) {
        breathingRef.current = setTimeout(() => {
          requestAnimationFrame(() => {
            const el = getOverlayEl()
            if (el) {
              el.classList.add('ime-breathing')
            }
          })
        }, breathingStart)
      }

      // Hide at configured delay
      timerRef.current = setTimeout(() => {
        requestAnimationFrame(() => {
          const el = getOverlayEl()
          if (el) {
            el.classList.add('ime-fading-out')
          }

          hideRef.current = setTimeout(() => {
            setVisible(false)
            removeBreathing()
            removeFadeOut()
          }, FADE_OUT_DURATION)
        })
      }, autoHideDelay)
    }

    return () => {
      clearAllTimers()
    }
  }, [isVisible, composing, autoHideDelay, setVisible])

  function clearAllTimers() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (breathingRef.current) { clearTimeout(breathingRef.current); breathingRef.current = null }
    if (hideRef.current) { clearTimeout(hideRef.current); hideRef.current = null }
  }

  function removeBreathing() {
    const el = getOverlayEl()
    if (el) el.classList.remove('ime-breathing')
  }

  function removeFadeOut() {
    const el = getOverlayEl()
    if (el) el.classList.remove('ime-fading-out')
  }
}

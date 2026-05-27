import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { builtInSkins, applySkin } from '../skins'

/**
 * Loads and applies the active skin to the container element.
 * On first load, initializes built-in skins in the store.
 * When skin switches, performs a crossfade transition.
 */
export function useSkin(containerRef: React.RefObject<HTMLElement | null>) {
  const activeSkinId = useAppStore((s) => s.activeSkinId)
  const skins = useAppStore((s) => s.skins)
  const setSkins = useAppStore((s) => s.setSkins)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Initialize built-in skins in the store on first load
  useEffect(() => {
    if (skins.length === 0) {
      setSkins(builtInSkins)
    }
  }, [])

  // Apply skin CSS to the container whenever activeSkinId or skins change
  useEffect(() => {
    const container = containerRef.current
    if (!container || skins.length === 0) return

    // Clean up previous skin injection
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    // Find active skin (check both built-ins and custom skins)
    const currentSkin =
      skins.find((s) => s.id === activeSkinId) ||
      builtInSkins.find((s) => s.id === activeSkinId) ||
      builtInSkins[0]

    if (currentSkin) {
      cleanupRef.current = applySkin(container, currentSkin)
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [activeSkinId, skins])
}

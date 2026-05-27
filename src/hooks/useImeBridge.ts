import { useEffect } from 'react'
import { useAppStore } from '../store'

/**
 * Bridges Electron IPC events to the React store.
 */
export function useImeBridge() {
  const toggleVisible = useAppStore((s) => s.toggleVisible)
  const setPage = useAppStore((s) => s.setPage)
  const setActiveSkin = useAppStore((s) => s.setActiveSkin)
  const setVisible = useAppStore((s) => s.setVisible)

  useEffect(() => {
    if (!window.imeAPI) return

    // Double Ctrl to toggle input visibility
    const unsubToggle = window.imeAPI.toggleInput(() => {
      toggleVisible()
    })

    // Skin switch from tray menu
    const unsubSkin = window.imeAPI.onSwitchSkin((skinId: string) => {
      setActiveSkin(skinId)
    })

    // Navigation from tray menu
    const unsubNav = window.imeAPI.onNavigate((page: string) => {
      setPage(page as 'input' | 'skins' | 'editor' | 'commands' | 'settings')
    })

    // Hide request from main process (window blur)
    const unsubHide = window.imeAPI.onHideRequest(() => {
      setVisible(false)
    })

    return () => {
      unsubToggle()
      unsubSkin()
      unsubNav()
      unsubHide()
    }
  }, [toggleVisible, setPage, setActiveSkin, setVisible])
}

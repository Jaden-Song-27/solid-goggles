import type { SkinConfig } from '../types'
import { ghostSkin } from './ghost'
import { terminalSkin } from './terminal'
import { frostedSkin } from './frosted'
import { inkSkin } from './ink'
import { minimalSkin } from './minimal'
import { glassSkins } from './glass'

/** All built-in skins in display order */
export const builtInSkins: SkinConfig[] = [
  ghostSkin,
  terminalSkin,
  frostedSkin,
  inkSkin,
  minimalSkin,
  ...glassSkins,
]

/** Get a built-in skin by ID */
export function getBuiltInSkin(id: string): SkinConfig | undefined {
  return builtInSkins.find((s) => s.id === id)
}

export { ghostSkin, terminalSkin, frostedSkin, inkSkin, minimalSkin }
export { skinToCSSVars, generateSkinCSS, applySkin, crossfadeSkin } from './engine'

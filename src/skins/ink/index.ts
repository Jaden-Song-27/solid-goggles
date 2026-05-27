import type { SkinConfig } from '../../types'

/**
 * Ink — 米白背景，衬线字体，竖排候选，中式留白，淡入
 */
export const inkSkin: SkinConfig = {
  id: 'ink',
  name: 'Ink',
  version: '1.0.0',
  author: 'SmartIME',
  description: '米白背景，衬线字体，竖排候选，中式留白，淡入',

  window: {
    background: 'rgba(252, 250, 245, 0.94)',
    borderRadius: 4,
    padding: 20,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    opacity: 0.98,
    backdropBlur: 4,
  },

  pinyin: {
    fontSize: 18,
    fontFamily: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", Georgia, serif',
    color: '#2C2C2C',
    letterSpacing: 4,
    dividerColor: '#C8C0B0',
    dividerWidth: 1,
    dividerStyle: 'solid',
  },

  candidateContainer: {
    direction: 'vertical',
    gap: 8,
    borderRadius: 2,
    padding: '8px 12px',
    fontSize: 18,
    fontFamily: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", Georgia, serif',
    labelColor: '#B0A898',
    states: {
      normal: {
        bg: 'transparent',
        color: '#3A3A3A',
      },
      hover: {
        bg: 'rgba(180, 160, 130, 0.12)',
        color: '#1A1A1A',
      },
      active: {
        bg: '#C8B898',
        color: '#FFFFFF',
      },
    },
  },

  candidate: {
    direction: 'vertical',
    gap: 0,
    borderRadius: 2,
    padding: '6px 16px',
    fontSize: 18,
    fontFamily: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", Georgia, serif',
    labelColor: '#B0A898',
    states: {
      normal: {
        bg: 'transparent',
        color: '#3A3A3A',
      },
      hover: {
        bg: 'rgba(180, 160, 130, 0.12)',
        color: '#1A1A1A',
      },
      active: {
        bg: '#C8B898',
        color: '#FFFFFF',
      },
    },
  },

  animation: {
    enterType: 'fade',
    exitType: 'fade',
    duration: 300,
    transitionType: 'crossfade',
  },

  customCSS: '',
}

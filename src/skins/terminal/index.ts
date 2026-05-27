import type { SkinConfig } from '../../types'

/**
 * Terminal — 纯黑背景，绿色等宽字体，直角，无动画
 */
export const terminalSkin: SkinConfig = {
  id: 'terminal',
  name: 'Terminal',
  version: '1.0.0',
  author: 'SmartIME',
  description: '纯黑背景，绿色等宽字体，直角，无动画，终端风格',

  window: {
    background: '#000000',
    borderRadius: 0,
    padding: 12,
    boxShadow: '0 0 0 1px #33FF33',
    opacity: 1,
    backdropBlur: 0,
  },

  pinyin: {
    fontSize: 16,
    fontFamily: '"Courier New", "Fira Code", "Cascadia Code", monospace',
    color: '#33FF33',
    letterSpacing: 0,
    dividerColor: '#33FF33',
    dividerWidth: 1,
    dividerStyle: 'dashed',
  },

  candidateContainer: {
    direction: 'horizontal',
    gap: 4,
    borderRadius: 0,
    padding: '2px 8px',
    fontSize: 14,
    fontFamily: '"Courier New", "Fira Code", "Cascadia Code", monospace',
    labelColor: '#33FF3388',
    states: {
      normal: {
        bg: 'transparent',
        color: '#33FF33',
      },
      hover: {
        bg: '#33FF3322',
        color: '#00FF00',
      },
      active: {
        bg: '#33FF33',
        color: '#000000',
      },
    },
  },

  candidate: {
    direction: 'horizontal',
    gap: 0,
    borderRadius: 0,
    padding: '2px 8px',
    fontSize: 14,
    fontFamily: '"Courier New", "Fira Code", "Cascadia Code", monospace',
    labelColor: '#33FF3388',
    states: {
      normal: {
        bg: 'transparent',
        color: '#33FF33',
      },
      hover: {
        bg: '#33FF3322',
        color: '#00FF00',
      },
      active: {
        bg: '#33FF33',
        color: '#000000',
      },
    },
  },

  animation: {
    enterType: 'none',
    exitType: 'none',
    duration: 0,
    transitionType: 'instant',
  },

  customCSS: '',
}

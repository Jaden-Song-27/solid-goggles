import type { SkinConfig } from '../../types'

/**
 * Ghost (默认) — 半透明灰黑背景，毛玻璃，圆角14px，缩放弹出
 * 配合瞬态模式，低调融入桌面
 */
export const ghostSkin: SkinConfig = {
  id: 'ghost',
  name: 'Ghost',
  version: '1.0.0',
  author: 'SmartIME',
  description: '半透明灰黑背景，毛玻璃，缩放弹出，适合瞬态输入',

  window: {
    background: '#1a1a1a',
    borderRadius: 14,
    padding: 14,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    opacity: 1,
    backdropBlur: 16,
  },

  pinyin: {
    fontSize: 36,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    color: '#ffffff',
    letterSpacing: 4,
    dividerColor: 'rgba(255, 255, 255, 0.25)',
    dividerWidth: 2,
    dividerStyle: 'solid',
  },

  candidateContainer: {
    direction: 'horizontal',
    gap: 12,
    borderRadius: 8,
    padding: '8px 20px',
    fontSize: 32,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    labelColor: 'rgba(255, 255, 255, 0.55)',
    states: {
      normal: {
        bg: 'transparent',
        color: '#ffffff',
      },
      hover: {
        bg: 'rgba(255, 255, 255, 0.12)',
        color: '#ffffff',
      },
      active: {
        bg: '#6C5CE7',
        color: '#FFFFFF',
      },
    },
  },

  candidate: {
    direction: 'horizontal',
    gap: 0,
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 32,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    labelColor: 'rgba(255, 255, 255, 0.55)',
    states: {
      normal: {
        bg: 'transparent',
        color: '#ffffff',
      },
      hover: {
        bg: 'rgba(255, 255, 255, 0.12)',
        color: '#ffffff',
      },
      active: {
        bg: '#6C5CE7',
        color: '#FFFFFF',
      },
    },
  },

  animation: {
    enterType: 'scale',
    exitType: 'fade',
    duration: 150,
    transitionType: 'crossfade',
  },

  customCSS: '',
}

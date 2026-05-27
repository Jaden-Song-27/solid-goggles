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
    background: 'rgba(32, 32, 36, 0.88)',
    borderRadius: 14,
    padding: 14,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
    opacity: 1,
    backdropBlur: 16,
  },

  pinyin: {
    fontSize: 18,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 2,
    dividerColor: 'rgba(255, 255, 255, 0.12)',
    dividerWidth: 1,
    dividerStyle: 'solid',
  },

  candidateContainer: {
    direction: 'horizontal',
    gap: 6,
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    labelColor: 'rgba(255, 255, 255, 0.40)',
    states: {
      normal: {
        bg: 'transparent',
        color: 'rgba(255, 255, 255, 0.85)',
      },
      hover: {
        bg: 'rgba(255, 255, 255, 0.10)',
        color: 'rgba(255, 255, 255, 0.95)',
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
    fontSize: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    labelColor: 'rgba(255, 255, 255, 0.40)',
    states: {
      normal: {
        bg: 'transparent',
        color: 'rgba(255, 255, 255, 0.85)',
      },
      hover: {
        bg: 'rgba(255, 255, 255, 0.10)',
        color: 'rgba(255, 255, 255, 0.95)',
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

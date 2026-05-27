import type { SkinConfig } from '../../types'

/**
 * Frosted — 强毛玻璃，大圆角，大间距，iOS 风格，滑动弹出
 */
export const frostedSkin: SkinConfig = {
  id: 'frosted',
  name: 'Frosted',
  version: '1.0.0',
  author: 'SmartIME',
  description: '强毛玻璃，大圆角，大间距，iOS 风格，滑动弹出',

  window: {
    background: 'rgba(250, 250, 252, 0.82)',
    borderRadius: 22,
    padding: 18,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
    opacity: 1,
    backdropBlur: 30,
  },

  pinyin: {
    fontSize: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif',
    color: '#1D1D1F',
    letterSpacing: 3,
    dividerColor: 'rgba(0, 0, 0, 0.08)',
    dividerWidth: 1,
    dividerStyle: 'solid',
  },

  candidateContainer: {
    direction: 'horizontal',
    gap: 10,
    borderRadius: 12,
    padding: '6px 14px',
    fontSize: 17,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
    labelColor: '#8E8E93',
    states: {
      normal: {
        bg: 'transparent',
        color: '#1D1D1F',
      },
      hover: {
        bg: 'rgba(0, 0, 0, 0.06)',
        color: '#000000',
      },
      active: {
        bg: '#007AFF',
        color: '#FFFFFF',
      },
    },
  },

  candidate: {
    direction: 'horizontal',
    gap: 0,
    borderRadius: 10,
    padding: '6px 16px',
    fontSize: 17,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
    labelColor: '#8E8E93',
    states: {
      normal: {
        bg: 'transparent',
        color: '#1D1D1F',
      },
      hover: {
        bg: 'rgba(0, 0, 0, 0.06)',
        color: '#000000',
      },
      active: {
        bg: '#007AFF',
        color: '#FFFFFF',
      },
    },
  },

  animation: {
    enterType: 'slide-down',
    exitType: 'fade',
    duration: 250,
    transitionType: 'crossfade',
  },

  customCSS: '',
}

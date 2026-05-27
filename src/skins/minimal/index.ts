import type { SkinConfig } from '../../types'

/**
 * Minimal — 完全无背景，纯文字浮在屏幕上，极小间距
 */
export const minimalSkin: SkinConfig = {
  id: 'minimal',
  name: 'Minimal',
  version: '1.0.0',
  author: 'SmartIME',
  description: '完全无背景，纯文字浮在屏幕上，极小间距',

  window: {
    background: 'transparent',
    borderRadius: 0,
    padding: 8,
    boxShadow: 'none',
    opacity: 1,
    backdropBlur: 0,
  },

  pinyin: {
    fontSize: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    color: '#FFFFFF',
    letterSpacing: 1,
    dividerColor: 'rgba(255, 255, 255, 0.2)',
    dividerWidth: 1,
    dividerStyle: 'dotted',
  },

  candidateContainer: {
    direction: 'horizontal',
    gap: 2,
    borderRadius: 0,
    padding: '1px 6px',
    fontSize: 15,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    labelColor: 'rgba(255, 255, 255, 0.50)',
    states: {
      normal: {
        bg: 'transparent',
        color: '#FFFFFF',
        textDecoration: 'none',
      },
      hover: {
        bg: 'transparent',
        color: '#FFFFFF',
        textDecoration: 'underline',
      },
      active: {
        bg: 'rgba(255, 255, 255, 0.25)',
        color: '#FFFFFF',
        textDecoration: 'none',
      },
    },
  },

  candidate: {
    direction: 'horizontal',
    gap: 0,
    borderRadius: 0,
    padding: '2px 6px',
    fontSize: 15,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    labelColor: 'rgba(255, 255, 255, 0.50)',
    states: {
      normal: {
        bg: 'transparent',
        color: '#FFFFFF',
        textDecoration: 'none',
      },
      hover: {
        bg: 'transparent',
        color: '#FFFFFF',
        textDecoration: 'underline',
      },
      active: {
        bg: 'rgba(255, 255, 255, 0.25)',
        color: '#FFFFFF',
        textDecoration: 'none',
      },
    },
  },

  animation: {
    enterType: 'fade',
    exitType: 'fade',
    duration: 100,
    transitionType: 'instant',
  },

  customCSS: `
    .ime-overlay {
      text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    }
  `,
}

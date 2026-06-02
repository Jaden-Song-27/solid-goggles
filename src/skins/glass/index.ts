import type { SkinConfig } from '../../types'

/**
 * Create a colorful frosted-glass skin variant.
 * Strong backdrop-blur + semi-transparent tinted background.
 */
function glassSkin(color: {
  id: string
  name: string
  bg: string       // semi-transparent tinted background
  accent: string   // accent color for active candidate
  text: string     // text color
  subtitle: string // label/secondary text color
}): SkinConfig {
  return {
    id: color.id,
    name: color.name,
    version: '1.0.0',
    author: 'SmartIME',
    description: `毛玻璃质感 — ${color.name}`,

    window: {
      background: color.bg,
      borderRadius: 20,
      padding: 16,
      boxShadow: `0 8px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.15)`,
      opacity: 1,
      backdropBlur: 30,
    },

    pinyin: {
      fontSize: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif',
      color: color.text,
      letterSpacing: 2,
      dividerColor: color.subtitle,
      dividerWidth: 1,
      dividerStyle: 'solid' as const,
    },

    candidateContainer: {
      direction: 'horizontal' as const,
      gap: 8,
      borderRadius: 12,
      padding: '6px 12px',
      fontSize: 17,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
      labelColor: color.subtitle,
      states: {
        normal: { bg: 'transparent', color: color.text },
        hover: { bg: 'rgba(255,255,255,0.15)', color: color.text },
        active: { bg: color.accent, color: '#FFFFFF' },
      },
    },

    candidate: {
      direction: 'horizontal' as const,
      gap: 0,
      borderRadius: 10,
      padding: '6px 16px',
      fontSize: 17,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
      labelColor: color.subtitle,
      states: {
        normal: { bg: 'transparent', color: color.text },
        hover: { bg: 'rgba(255,255,255,0.15)', color: color.text },
        active: { bg: color.accent, color: '#FFFFFF' },
      },
    },

    animation: {
      enterType: 'scale' as const,
      exitType: 'fade' as const,
      duration: 200,
      transitionType: 'crossfade' as const,
    },

    customCSS: `
      .ime-overlay {
        background: ${color.bg} !important;
        backdrop-filter: blur(30px) saturate(180%);
        -webkit-backdrop-filter: blur(30px) saturate(180%);
        border: 1px solid rgba(255,255,255,0.18);
      }
      .ime-candidate {
        transition: all 0.15s ease;
      }
      .ime-candidate:hover {
        transform: translateY(-1px);
      }
      .ime-pinyin-text {
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
    `,
  }
}

// ── Color palette ──────────────────────────────────────────

export const glassPurple = glassSkin({
  id: 'glass-purple',
  name: '紫水晶',
  bg: 'rgba(100, 60, 180, 0.50)',
  accent: '#A855F7',
  text: 'rgba(255, 255, 255, 0.95)',
  subtitle: 'rgba(255, 255, 255, 0.45)',
})

export const glassOcean = glassSkin({
  id: 'glass-ocean',
  name: '深海蓝',
  bg: 'rgba(20, 80, 180, 0.48)',
  accent: '#3B82F6',
  text: 'rgba(255, 255, 255, 0.95)',
  subtitle: 'rgba(200, 220, 255, 0.50)',
})

export const glassEmerald = glassSkin({
  id: 'glass-emerald',
  name: '翡翠绿',
  bg: 'rgba(20, 140, 100, 0.48)',
  accent: '#10B981',
  text: 'rgba(255, 255, 255, 0.95)',
  subtitle: 'rgba(180, 240, 210, 0.50)',
})

export const glassRose = glassSkin({
  id: 'glass-rose',
  name: '玫瑰粉',
  bg: 'rgba(200, 60, 110, 0.45)',
  accent: '#F43F5E',
  text: 'rgba(255, 255, 255, 0.95)',
  subtitle: 'rgba(255, 200, 215, 0.50)',
})

export const glassSunset = glassSkin({
  id: 'glass-sunset',
  name: '日落橙',
  bg: 'rgba(200, 100, 30, 0.48)',
  accent: '#F97316',
  text: 'rgba(255, 255, 255, 0.95)',
  subtitle: 'rgba(255, 210, 170, 0.50)',
})

export const glassMidnight = glassSkin({
  id: 'glass-midnight',
  name: '午夜黑',
  bg: 'rgba(15, 15, 35, 0.65)',
  accent: '#6C5CE7',
  text: 'rgba(255, 255, 255, 0.92)',
  subtitle: 'rgba(180, 180, 200, 0.40)',
})

export const glassSky = glassSkin({
  id: 'glass-sky',
  name: '天空蓝',
  bg: 'rgba(60, 160, 230, 0.42)',
  accent: '#0EA5E9',
  text: 'rgba(255, 255, 255, 0.95)',
  subtitle: 'rgba(200, 230, 255, 0.50)',
})

export const glassMint = glassSkin({
  id: 'glass-mint',
  name: '薄荷绿',
  bg: 'rgba(40, 170, 150, 0.45)',
  accent: '#14B8A6',
  text: 'rgba(255, 255, 255, 0.95)',
  subtitle: 'rgba(180, 240, 230, 0.50)',
})

// Export all glass skins
export const glassSkins: SkinConfig[] = [
  glassPurple,
  glassOcean,
  glassEmerald,
  glassRose,
  glassSunset,
  glassMidnight,
  glassSky,
  glassMint,
]

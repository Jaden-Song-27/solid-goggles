import type { SkinConfig } from '../types'

/**
 * Convert a SkinConfig into CSS custom properties.
 * These get set on the .ime-overlay container.
 */
export function skinToCSSVars(skin: SkinConfig): Record<string, string> {
  const { window: w, pinyin: p, candidate: c, candidateContainer: cc, animation: a } = skin

  return {
    // --- Window ---
    '--ime-window-bg': w.background,
    '--ime-window-radius': `${w.borderRadius}px`,
    '--ime-window-padding': `${w.padding}px`,
    '--ime-window-shadow': w.boxShadow,
    '--ime-window-opacity': `${w.opacity}`,
    '--ime-window-blur': w.backdropBlur > 0 ? `blur(${w.backdropBlur}px)` : 'none',

    // --- Pinyin area ---
    '--ime-pinyin-font-size': `${p.fontSize}px`,
    '--ime-pinyin-font-family': p.fontFamily,
    '--ime-pinyin-color': p.color,
    '--ime-pinyin-letter-spacing': `${p.letterSpacing}px`,
    '--ime-pinyin-divider-color': p.dividerColor,
    '--ime-pinyin-divider-width': `${p.dividerWidth}px`,
    '--ime-pinyin-divider-style': p.dividerStyle,

    // --- Candidate container ---
    '--ime-candidate-direction': cc.direction === 'vertical' ? 'column' : 'row',
    '--ime-candidate-gap': `${cc.gap}px`,

    // --- Candidate item ---
    '--ime-candidate-radius': `${c.borderRadius}px`,
    '--ime-candidate-padding': c.padding,
    '--ime-candidate-font-size': `${c.fontSize}px`,
    '--ime-candidate-font-family': c.fontFamily,
    '--ime-candidate-label-color': c.labelColor,

    // States: normal
    '--ime-candidate-normal-bg': c.states.normal.bg,
    '--ime-candidate-normal-color': c.states.normal.color,
    '--ime-candidate-normal-decoration': c.states.normal.textDecoration || 'none',

    // States: hover
    '--ime-candidate-hover-bg': c.states.hover.bg,
    '--ime-candidate-hover-color': c.states.hover.color,
    '--ime-candidate-hover-decoration': c.states.hover.textDecoration || 'none',

    // States: active
    '--ime-candidate-active-bg': c.states.active.bg,
    '--ime-candidate-active-color': c.states.active.color,
    '--ime-candidate-active-decoration': c.states.active.textDecoration || 'none',

    // --- Animation ---
    '--ime-anim-duration': `${a.duration}ms`,
  }
}

/**
 * Generate a complete CSS string for a skin, including customCSS overrides.
 */
export function generateSkinCSS(skin: SkinConfig): string {
  const baseCSS = `
    .ime-overlay {
      background: var(--ime-window-bg);
      border-radius: var(--ime-window-radius);
      padding: var(--ime-window-padding);
      box-shadow: var(--ime-window-shadow);
      opacity: var(--ime-window-opacity);
      backdrop-filter: var(--ime-window-blur);
      -webkit-backdrop-filter: var(--ime-window-blur);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: opacity var(--ime-anim-duration) ease-out;
      will-change: opacity, transform;
    }

    .ime-overlay.fading {
      opacity: 0;
    }

    /* -- Pinyin area -- */
    .ime-pinyin-text {
      font-size: var(--ime-pinyin-font-size);
      font-family: var(--ime-pinyin-font-family);
      color: var(--ime-pinyin-color);
      letter-spacing: var(--ime-pinyin-letter-spacing);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .ime-pinyin-divider {
      width: var(--ime-pinyin-divider-width);
      height: 24px;
      background: var(--ime-pinyin-divider-color);
      border: none;
      flex-shrink: 0;
      border-left: var(--ime-pinyin-divider-width) var(--ime-pinyin-divider-style) var(--ime-pinyin-divider-color);
    }

    /* -- Candidates area -- */
    .ime-candidates {
      display: flex;
      flex-direction: var(--ime-candidate-direction);
      gap: var(--ime-candidate-gap);
      align-items: center;
      flex-wrap: wrap;
    }

    .ime-candidate {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border-radius: var(--ime-candidate-radius);
      padding: var(--ime-candidate-padding);
      font-size: var(--ime-candidate-font-size);
      font-family: var(--ime-candidate-font-family);
      background: var(--ime-candidate-normal-bg);
      color: var(--ime-candidate-normal-color);
      text-decoration: var(--ime-candidate-normal-decoration);
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
      white-space: nowrap;
    }

    .ime-candidate:hover {
      background: var(--ime-candidate-hover-bg);
      color: var(--ime-candidate-hover-color);
      text-decoration: var(--ime-candidate-hover-decoration);
    }

    .ime-candidate.selected {
      background: var(--ime-candidate-active-bg);
      color: var(--ime-candidate-active-color);
      text-decoration: var(--ime-candidate-active-decoration);
    }

    .ime-candidate-index {
      font-size: calc(var(--ime-candidate-font-size) * 0.7);
      color: var(--ime-candidate-label-color);
      min-width: 1em;
      text-align: right;
    }

    /* -- Cursor / composing indicator -- */
    .ime-composing-cursor {
      display: inline-block;
      width: 2px;
      height: calc(var(--ime-pinyin-font-size) * 1.1);
      background: var(--ime-pinyin-color);
      margin-left: 2px;
      animation: ime-cursor-blink 0.8s step-end infinite;
    }

    @keyframes ime-cursor-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    /* -- Regret indicator -- */
    .ime-regret-indicator {
      font-size: calc(var(--ime-pinyin-font-size) * 0.6);
      color: var(--ime-candidate-active-bg);
      animation: ime-regret-pulse 0.8s ease-in-out infinite;
    }

    @keyframes ime-regret-pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 0.2; }
    }

    /* -- Animations -- */
    @keyframes ime-pop-in-scale {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes ime-pop-in-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes ime-pop-in-slide-down {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes ime-pop-in-slide-up {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    ${skin.customCSS}
  `

  return baseCSS
}

/**
 * Apply a skin to a DOM container element.
 * Returns a cleanup function that removes all injected styles.
 */
export function applySkin(container: HTMLElement, skin: SkinConfig): () => void {
  const vars = skinToCSSVars(skin)

  // Apply CSS variables
  for (const [key, value] of Object.entries(vars)) {
    container.style.setProperty(key, value)
  }

  // Animate entrance
  const enterMap: Record<string, string> = {
    scale: 'ime-pop-in-scale',
    fade: 'ime-pop-in-fade',
    'slide-down': 'ime-pop-in-slide-down',
    'slide-up': 'ime-pop-in-slide-up',
  }
  const animName = enterMap[skin.animation.enterType]
  if (animName && skin.animation.enterType !== 'none') {
    container.style.animation = `${animName} ${skin.animation.duration}ms ease-out`
  }

  // Inject custom CSS
  let styleEl: HTMLStyleElement | null = null
  if (skin.customCSS) {
    styleEl = document.createElement('style')
    styleEl.textContent = skin.customCSS
    document.head.appendChild(styleEl)
  }

  return () => {
    if (styleEl) {
      document.head.removeChild(styleEl)
    }
    for (const key of Object.keys(vars)) {
      container.style.removeProperty(key)
    }
    container.style.animation = ''
  }
}

/**
 * Crossfade between two skins on a container element.
 * Applies the new skin after a brief fade-out / fade-in cycle.
 */
export function crossfadeSkin(
  container: HTMLElement,
  cleanupRef: { current: (() => void) | null },
  newSkin: SkinConfig,
): void {
  // Fade out
  container.style.transition = 'opacity 150ms ease-out'
  container.style.opacity = '0'

  setTimeout(() => {
    // Switch skin while invisible
    if (cleanupRef.current) {
      cleanupRef.current()
    }
    cleanupRef.current = applySkin(container, newSkin)

    // Fade in
    requestAnimationFrame(() => {
      container.style.opacity = '1'
      setTimeout(() => {
        container.style.transition = ''
      }, 150)
    })
  }, 150)
}

/**
 * Detect whether the browser supports backdrop-filter.
 * Returns false if not supported, so UI can fall back to solid background.
 */
export function supportsBackdropFilter(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('backdrop-filter', 'blur(1px)')
}

/**
 * Validate and fill missing fields in a skin config with defaults.
 * Used when importing skin files that may be incomplete.
 */
export function validateSkinConfig(raw: Partial<SkinConfig>, baseSkin: SkinConfig): SkinConfig {
  return {
    id: raw.id || baseSkin.id,
    name: raw.name || baseSkin.name,
    version: raw.version || '1.0.0',
    author: raw.author || 'Unknown',
    description: raw.description || '',
    window: { ...baseSkin.window, ...raw.window },
    pinyin: { ...baseSkin.pinyin, ...raw.pinyin },
    candidateContainer: { ...baseSkin.candidateContainer, ...raw.candidateContainer },
    candidate: { ...baseSkin.candidate, ...raw.candidate },
    animation: { ...baseSkin.animation, ...raw.animation },
    customCSS: raw.customCSS ?? '',
  }
}


import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '../store'
import { applySkin, skinToCSSVars, validateSkinConfig } from '../skins/engine'
import { builtInSkins } from '../skins'
import type { SkinConfig, Candidate } from '../types'

const DEMO_CANDIDATES: Candidate[] = [
  { id: '1', text: '你好', frequency: 100 },
  { id: '2', text: '尼好', frequency: 20 },
  { id: '3', text: '你号', frequency: 15 },
  { id: '4', text: '拟好', frequency: 10 },
  { id: '5', text: '逆豪', frequency: 5 },
]

type PanelSection = 'basic' | 'candidates' | 'animation' | 'advanced'

export default function SkinEditor() {
  const activeSkinId = useAppStore((s) => s.activeSkinId)
  const skins = useAppStore((s) => s.skins)
  const setActiveSkin = useAppStore((s) => s.setActiveSkin)
  const updateSkin = useAppStore((s) => s.updateSkin)
  const addSkin = useAppStore((s) => s.addSkin)
  const setPage = useAppStore((s) => s.setPage)

  const allSkins = skins.length > 0 ? skins : builtInSkins
  const skin = allSkins.find((s) => s.id === activeSkinId) || allSkins[0]

  const [editingSkin, setEditingSkin] = useState<SkinConfig>(() => JSON.parse(JSON.stringify(skin)))
  const [expandedSection, setExpandedSection] = useState<PanelSection | null>('basic')
  const previewRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Apply skin to preview area
  useEffect(() => {
    const container = previewRef.current
    if (!container) return
    if (cleanupRef.current) {
      cleanupRef.current()
    }
    cleanupRef.current = applySkin(container, editingSkin)
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [editingSkin])

  // Sync when activeSkinId changes from outside
  useEffect(() => {
    const current = allSkins.find((s) => s.id === activeSkinId)
    if (current) {
      setEditingSkin(JSON.parse(JSON.stringify(current)))
    }
  }, [activeSkinId])

  const updateField = useCallback(
    (path: string[], value: unknown) => {
      setEditingSkin((prev) => {
        const next = JSON.parse(JSON.stringify(prev))
        let obj = next
        for (let i = 0; i < path.length - 1; i++) {
          obj = obj[path[i]]
        }
        obj[path[path.length - 1]] = value
        return next
      })
    },
    [],
  )

  const handleSave = () => {
    if (skins.some((s) => s.id === editingSkin.id)) {
      updateSkin(editingSkin.id, editingSkin)
    } else {
      addSkin(editingSkin)
    }
    setActiveSkin(editingSkin.id)
  }

  const handleSaveAs = () => {
    const name = prompt('输入皮肤名称：', editingSkin.name + ' (副本)')
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const newSkin: SkinConfig = {
      ...editingSkin,
      id: id || 'custom-' + Date.now(),
      name,
      version: '1.0.0',
      author: 'User',
    }
    addSkin(newSkin)
    setActiveSkin(newSkin.id)
    setEditingSkin(JSON.parse(JSON.stringify(newSkin)))
  }

  const handleImport = async () => {
    if (!window.imeAPI) return
    const content = await window.imeAPI.importSkin()
    if (!content || content === 'null') return
    try {
      const raw = JSON.parse(content)
      const ghostSkin = builtInSkins[0]
      const validated = validateSkinConfig(raw, ghostSkin)
      addSkin(validated)
      setActiveSkin(validated.id)
      setEditingSkin(JSON.parse(JSON.stringify(validated)))
    } catch {
      alert('皮肤文件格式无效')
    }
  }

  const handleReset = () => {
    const original = builtInSkins.find((s) => s.id === activeSkinId)
    if (original) {
      setEditingSkin(JSON.parse(JSON.stringify(original)))
    }
  }

  const handleExport = async () => {
    if (!window.imeAPI) return
    await window.imeAPI.saveSkin(editingSkin.id, JSON.stringify(editingSkin, null, 2))
    await window.imeAPI.exportSkin(editingSkin.id)
  }

  const toggleSection = (section: PanelSection) => {
    setExpandedSection((prev) => (prev === section ? null : section))
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={() => setPage('input')} style={styles.backBtn}>
          ← 返回
        </button>
        <span style={styles.title}>皮肤编辑器</span>
        <select
          value={activeSkinId}
          onChange={(e) => setActiveSkin(e.target.value)}
          style={styles.skinSelect}
        >
          {allSkins.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.main}>
        {/* Left: Preview */}
        <div style={styles.previewPanel}>
          <h3 style={styles.previewLabel}>实时预览</h3>
          <div style={styles.previewWrapper}>
            <div ref={previewRef} style={styles.previewOverlay}>
              <span style={styles.previewPinyin}>ni hao</span>
              <div style={styles.previewDivider} />
              <div style={styles.previewCandidates}>
                {DEMO_CANDIDATES.map((c, i) => (
                  <span
                    key={c.id}
                    className={`ime-candidate ${i === 0 ? 'selected' : ''}`}
                  >
                    <span className="ime-candidate-index">{i + 1}</span>
                    {c.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Parameter Panels */}
        <div style={styles.paramsPanel}>
          <Section
            title="基础设置"
            expanded={expandedSection === 'basic'}
            onToggle={() => toggleSection('basic')}
          >
            <SliderField
              label="圆角 (px)"
              value={editingSkin.window.borderRadius}
              min={0} max={30}
              onChange={(v) => updateField(['window', 'borderRadius'], v)}
            />
            <SliderField
              label="内边距 (px)"
              value={editingSkin.window.padding}
              min={0} max={40}
              onChange={(v) => updateField(['window', 'padding'], v)}
            />
            <SliderField
              label="透明度"
              value={Math.round(editingSkin.window.opacity * 100)}
              min={20} max={100}
              onChange={(v) => updateField(['window', 'opacity'], v / 100)}
            />
            <SliderField
              label="毛玻璃模糊度 (px)"
              value={editingSkin.window.backdropBlur}
              min={0} max={50}
              onChange={(v) => updateField(['window', 'backdropBlur'], v)}
            />
            <ColorField
              label="背景色"
              value={editingSkin.window.background}
              onChange={(v) => updateField(['window', 'background'], v)}
            />
            <TextField
              label="阴影"
              value={editingSkin.window.boxShadow}
              onChange={(v) => updateField(['window', 'boxShadow'], v)}
            />
          </Section>

          <Section
            title="候选词"
            expanded={expandedSection === 'candidates'}
            onToggle={() => toggleSection('candidates')}
          >
            <SliderField
              label="字号"
              value={editingSkin.candidate.fontSize}
              min={10} max={28}
              onChange={(v) => {
                updateField(['candidate', 'fontSize'], v)
                updateField(['candidateContainer', 'fontSize'], v)
              }}
            />
            <SliderField
              label="间距 (px)"
              value={editingSkin.candidateContainer.gap}
              min={0} max={30}
              onChange={(v) => updateField(['candidateContainer', 'gap'], v)}
            />
            <SliderField
              label="候选词圆角 (px)"
              value={editingSkin.candidate.borderRadius}
              min={0} max={20}
              onChange={(v) => updateField(['candidate', 'borderRadius'], v)}
            />
            <SelectField
              label="排列方向"
              value={editingSkin.candidateContainer.direction}
              options={[
                { value: 'horizontal', label: '横向' },
                { value: 'vertical', label: '纵向' },
                { value: 'grid', label: '网格' },
              ]}
              onChange={(v) => {
                updateField(['candidateContainer', 'direction'], v)
                updateField(['candidate', 'direction'], v)
              }}
            />
            <ColorField
              label="普通背景"
              value={editingSkin.candidate.states.normal.bg}
              onChange={(v) => updateField(['candidate', 'states', 'normal', 'bg'], v)}
            />
            <ColorField
              label="普通文字色"
              value={editingSkin.candidate.states.normal.color}
              onChange={(v) => updateField(['candidate', 'states', 'normal', 'color'], v)}
            />
            <ColorField
              label="悬停背景"
              value={editingSkin.candidate.states.hover.bg}
              onChange={(v) => updateField(['candidate', 'states', 'hover', 'bg'], v)}
            />
            <ColorField
              label="选中背景"
              value={editingSkin.candidate.states.active.bg}
              onChange={(v) => updateField(['candidate', 'states', 'active', 'bg'], v)}
            />
            <ColorField
              label="选中文字色"
              value={editingSkin.candidate.states.active.color}
              onChange={(v) => updateField(['candidate', 'states', 'active', 'color'], v)}
            />
          </Section>

          <Section
            title="动画"
            expanded={expandedSection === 'animation'}
            onToggle={() => toggleSection('animation')}
          >
            <SelectField
              label="唤出动效"
              value={editingSkin.animation.enterType}
              options={[
                { value: 'scale', label: '缩放' },
                { value: 'fade', label: '淡入' },
                { value: 'slide-down', label: '下滑' },
                { value: 'slide-up', label: '上滑' },
                { value: 'none', label: '无' },
              ]}
              onChange={(v) => updateField(['animation', 'enterType'], v)}
            />
            <SelectField
              label="消失动效"
              value={editingSkin.animation.exitType}
              options={[
                { value: 'fade', label: '淡出' },
                { value: 'scale', label: '缩放' },
                { value: 'slide-up', label: '上滑' },
                { value: 'slide-down', label: '下滑' },
                { value: 'none', label: '无' },
              ]}
              onChange={(v) => updateField(['animation', 'exitType'], v)}
            />
            <SliderField
              label="动画时长 (ms)"
              value={editingSkin.animation.duration}
              min={0} max={600}
              onChange={(v) => updateField(['animation', 'duration'], v)}
            />
            <SelectField
              label="皮肤切换过渡"
              value={editingSkin.animation.transitionType}
              options={[
                { value: 'crossfade', label: '交叉淡入淡出' },
                { value: 'instant', label: '即时切换' },
              ]}
              onChange={(v) => updateField(['animation', 'transitionType'], v)}
            />
          </Section>

          <Section
            title="高级 — 自定义 CSS"
            expanded={expandedSection === 'advanced'}
            onToggle={() => toggleSection('advanced')}
          >
            <div style={styles.cssHelp}>
              直接输入 CSS 规则，将追加到皮肤样式末尾。可用于微调样式细节。
            </div>
            <textarea
              value={editingSkin.customCSS}
              onChange={(e) => updateField(['customCSS'], e.target.value)}
              style={styles.cssEditor}
              spellCheck={false}
              placeholder="/* 自定义 CSS */&#10;.ime-candidate {&#10;  font-weight: bold;&#10;}"
            />
          </Section>
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={styles.actionBar}>
        <button onClick={handleSave} style={styles.btn}>保存</button>
        <button onClick={handleSaveAs} style={styles.btn}>另存为</button>
        <button onClick={handleImport} style={styles.btn}>导入皮肤文件</button>
        <button onClick={handleExport} style={styles.btn}>导出当前皮肤</button>
        <button onClick={handleReset} style={styles.btnSecondary}>重置为默认</button>
      </div>
    </div>
  )
}

// ---- Sub-components ----

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={styles.section}>
      <div onClick={onToggle} style={styles.sectionHeader}>
        <span>{expanded ? '▾' : '▸'} {title}</span>
      </div>
      {expanded && <div style={styles.sectionBody}>{children}</div>}
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}: {value}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={styles.slider}
      />
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={toHex(value)}
          onChange={(e) => onChange(e.target.value)}
          style={styles.colorInput}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.textInputSmall}
        />
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.textInput}
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ---- Helpers ----

/** Attempt to extract a hex color from a CSS color string. Falls back to #000. */
function toHex(cssColor: string): string {
  // Parse rgba(r, g, b, a)
  const rgba = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgba) {
    const r = parseInt(rgba[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgba[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgba[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  // Return as-is if it looks like a hex color
  if (cssColor.startsWith('#')) return cssColor
  if (cssColor === 'transparent') return '#000000'
  return '#6C5CE7'
}

// ---- Inline styles (avoid importing CSS file) ----

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    height: '100%',
    background: '#1a1a2e',
    color: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
    fontSize: 13,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#ccc',
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    flex: 1,
  },
  skinSelect: {
    background: '#2a2a40',
    color: '#e0e0e0',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 12,
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  previewPanel: {
    flex: 1,
    padding: 12,
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 280,
  },
  previewLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontWeight: 400,
  },
  previewWrapper: {
    flex: 1,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    padding: 20,
  },
  previewOverlay: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  previewPinyin: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
    whiteSpace: 'nowrap',
  },
  previewDivider: {
    width: 1,
    height: 24,
    background: 'rgba(255,255,255,0.12)',
    flexShrink: 0,
  },
  previewCandidates: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  paramsPanel: {
    width: 320,
    overflow: 'auto',
    padding: 8,
    flexShrink: 0,
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    padding: '8px 10px',
    cursor: 'pointer',
    userSelect: 'none',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
  },
  sectionBody: {
    padding: '8px 4px',
  },
  field: {
    marginBottom: 10,
  },
  fieldLabel: {
    display: 'block',
    fontSize: 11,
    color: '#999',
    marginBottom: 3,
  },
  slider: {
    width: '100%',
    accentColor: '#6C5CE7',
  },
  colorInput: {
    width: 32,
    height: 28,
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
  },
  textInput: {
    width: '100%',
    background: '#2a2a40',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    color: '#e0e0e0',
    padding: '4px 8px',
    fontSize: 11,
  },
  textInputSmall: {
    flex: 1,
    background: '#2a2a40',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    color: '#e0e0e0',
    padding: '4px 8px',
    fontSize: 11,
  },
  select: {
    width: '100%',
    background: '#2a2a40',
    color: '#e0e0e0',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
  },
  cssHelp: {
    fontSize: 11,
    color: '#777',
    marginBottom: 8,
  },
  cssEditor: {
    width: '100%',
    height: 120,
    background: '#111122',
    color: '#aaccff',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    fontFamily: '"Fira Code", "Cascadia Code", monospace',
    resize: 'vertical',
    tabSize: 2,
  },
  actionBar: {
    display: 'flex',
    gap: 8,
    padding: '8px 12px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  btn: {
    background: '#6C5CE7',
    color: '#fff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
  btnSecondary: {
    background: 'transparent',
    color: '#aaa',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  },
}

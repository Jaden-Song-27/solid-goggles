import { useEffect } from 'react'
import { useAppStore } from '../store'
import { builtInSkins } from '../skins'

export default function SettingsPage() {
  const settings = useAppStore((s) => s.settings)
  const activeSkinId = useAppStore((s) => s.activeSkinId)
  const skins = useAppStore((s) => s.skins)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const saveSettings = useAppStore((s) => s.saveSettings)
  const loadSettings = useAppStore((s) => s.loadSettings)
  const setActiveSkin = useAppStore((s) => s.setActiveSkin)
  const setPage = useAppStore((s) => s.setPage)

  useEffect(() => {
    loadSettings()
  }, [])

  const allSkins = skins.length > 0 ? skins : builtInSkins

  const handleChange = (key: string, value: unknown) => {
    updateSettings({ [key]: value })
  }

  const handleSave = async () => {
    await saveSettings()
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={() => setPage('input')} style={styles.backBtn}>
          ← 返回
        </button>
        <span style={styles.title}>设置</span>
      </div>

      <div style={styles.body}>
        {/* Default Skin */}
        <div style={styles.group}>
          <label style={styles.label}>默认皮肤</label>
          <p style={styles.desc}>应用启动时使用的皮肤</p>
          <select
            value={settings.defaultSkinId}
            onChange={(e) => handleChange('defaultSkinId', e.target.value)}
            style={styles.select}
          >
            {allSkins.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Auto-hide Delay */}
        <div style={styles.group}>
          <label style={styles.label}>
            自动隐藏延迟：{settings.autoHideDelay === 0 ? '禁用' : `${settings.autoHideDelay / 1000} 秒`}
          </label>
          <p style={styles.desc}>输入面板无操作后自动隐藏的时间。设为 0 禁用自动隐藏。</p>
          <input
            type="range"
            min={0}
            max={10000}
            step={500}
            value={settings.autoHideDelay}
            onChange={(e) => handleChange('autoHideDelay', Number(e.target.value))}
            style={styles.slider}
          />
          <div style={styles.presets}>
            {[
              { label: '禁用', value: 0 },
              { label: '1秒', value: 1000 },
              { label: '2秒', value: 2000 },
              { label: '3秒', value: 3000 },
              { label: '5秒', value: 5000 },
              { label: '10秒', value: 10000 },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleChange('autoHideDelay', preset.value)}
                style={{
                  ...styles.presetBtn,
                  ...(settings.autoHideDelay === preset.value ? styles.presetBtnActive : {}),
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Show Skin Badge */}
        <div style={styles.group}>
          <label style={styles.label}>显示皮肤标签</label>
          <p style={styles.desc}>在输入面板右上角显示当前皮肤名称</p>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={settings.showSkinBadge}
              onChange={(e) => handleChange('showSkinBadge', e.target.checked)}
              style={styles.checkbox}
            />
            <span>{settings.showSkinBadge ? '已启用' : '已禁用'}</span>
          </label>
        </div>

        {/* Launch on Startup */}
        <div style={styles.group}>
          <label style={styles.label}>开机自启</label>
          <p style={styles.desc}>系统启动时自动运行 SmartIME</p>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={settings.launchOnStartup}
              onChange={(e) => handleChange('launchOnStartup', e.target.checked)}
              style={styles.checkbox}
            />
            <span>{settings.launchOnStartup ? '已启用' : '已禁用'}</span>
          </label>
        </div>

        {/* About */}
        <div style={styles.group}>
          <label style={styles.label}>关于 SmartIME</label>
          <div style={styles.aboutBox}>
            <div style={styles.aboutRow}>
              <span style={styles.aboutKey}>版本</span>
              <span style={styles.aboutVal}>v0.1.0</span>
            </div>
            <div style={styles.aboutRow}>
              <span style={styles.aboutKey}>技术栈</span>
              <span style={styles.aboutVal}>Electron + React + TypeScript</span>
            </div>
            <div style={styles.aboutRow}>
              <span style={styles.aboutKey}>内置皮肤</span>
              <span style={styles.aboutVal}>{builtInSkins.map((s) => s.name).join(', ')}</span>
            </div>
            <div style={styles.aboutRow}>
              <span style={styles.aboutKey}>当前皮肤</span>
              <span style={styles.aboutVal}>{activeSkinId}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.actionBar}>
        <button onClick={handleSave} style={styles.saveBtn}>保存设置</button>
      </div>
    </div>
  )
}

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
  body: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#ddd',
  },
  desc: {
    fontSize: 11,
    color: '#777',
    margin: 0,
  },
  select: {
    background: '#2a2a40',
    color: '#e0e0e0',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 13,
    width: 220,
  },
  slider: {
    width: '100%',
    maxWidth: 300,
    accentColor: '#6C5CE7',
  },
  presets: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  presetBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#aaa',
    padding: '3px 10px',
    borderRadius: 4,
    fontSize: 11,
    cursor: 'pointer',
  },
  presetBtnActive: {
    background: '#6C5CE7',
    color: '#fff',
    borderColor: '#6C5CE7',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 13,
    color: '#ccc',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: '#6C5CE7',
    cursor: 'pointer',
  },
  aboutBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  aboutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
  },
  aboutKey: {
    color: '#888',
  },
  aboutVal: {
    color: '#ccc',
  },
  actionBar: {
    padding: '8px 12px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  saveBtn: {
    background: '#6C5CE7',
    color: '#fff',
    border: 'none',
    padding: '6px 18px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
}

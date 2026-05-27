import { useState } from 'react'
import { useAppStore } from '../store'
import type { QuickCommand } from '../types'
import { getAllCommands } from '../services/commands'

export default function CommandsPage() {
  const commands = useAppStore((s) => s.commands)
  const addCommand = useAppStore((s) => s.addCommand)
  const updateCommand = useAppStore((s) => s.updateCommand)
  const removeCommand = useAppStore((s) => s.removeCommand)
  const toggleCommand = useAppStore((s) => s.toggleCommand)
  const setPage = useAppStore((s) => s.setPage)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const [form, setForm] = useState({ trigger: '', description: '', template: '' })

  const builtInCmds = getAllCommands()

  const startAdd = () => {
    setForm({ trigger: '', description: '', template: '' })
    setIsAdding(true)
    setEditingId(null)
  }

  const startEdit = (cmd: QuickCommand) => {
    setForm({ trigger: cmd.trigger, description: cmd.description, template: cmd.template })
    setEditingId(cmd.id)
    setIsAdding(false)
  }

  const cancelForm = () => {
    setIsAdding(false)
    setEditingId(null)
    setForm({ trigger: '', description: '', template: '' })
  }

  const handleSave = () => {
    if (!form.trigger.trim() || !form.description.trim()) return

    const trigger = form.trigger.startsWith('/') ? form.trigger.trim() : '/' + form.trigger.trim()

    if (isAdding) {
      const newCmd: QuickCommand = {
        id: 'custom-' + Date.now(),
        trigger,
        description: form.description.trim(),
        template: form.template.trim(),
        enabled: true,
      }
      addCommand(newCmd)
    } else if (editingId) {
      updateCommand(editingId, {
        trigger,
        description: form.description.trim(),
        template: form.template.trim(),
      })
    }

    cancelForm()
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={() => setPage('input')} style={styles.backBtn}>
          ← 返回
        </button>
        <span style={styles.title}>快捷指令管理</span>
        <button onClick={startAdd} style={styles.addBtn}>+ 新建指令</button>
      </div>

      <div style={styles.body}>
        {/* Built-in commands (read-only) */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>内置指令</h3>
          <div style={styles.list}>
            {builtInCmds.map((cmd) => {
              const customCmd = commands.find((c) => c.trigger === cmd.trigger)
              const enabled = customCmd ? customCmd.enabled : true
              return (
                <div key={cmd.trigger} style={styles.cmdItem}>
                  <div style={styles.cmdLeft}>
                    <span style={styles.cmdTrigger}>{cmd.trigger}</span>
                    <span style={styles.cmdSep}>—</span>
                    <span style={styles.cmdDesc}>{cmd.description}</span>
                    <span style={styles.badgeBuiltin}>内置</span>
                  </div>
                  <label style={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => {
                        if (customCmd) {
                          toggleCommand(customCmd.id)
                        }
                      }}
                      style={styles.checkbox}
                    />
                  </label>
                </div>
              )
            })}
          </div>
        </div>

        {/* Custom commands */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>自定义指令</h3>

          {(isAdding || editingId) && (
            <div style={styles.formCard}>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>触发词（如 /email）</label>
                <input
                  type="text"
                  value={form.trigger}
                  onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
                  placeholder="/trigger"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>描述</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="简短描述指令用途"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>模板内容</label>
                <textarea
                  value={form.template}
                  onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
                  placeholder="输入 /trigger 时上屏的内容"
                  style={styles.textarea}
                  rows={3}
                />
              </div>
              <div style={styles.formActions}>
                <button onClick={handleSave} style={styles.saveBtn}>保存</button>
                <button onClick={cancelForm} style={styles.cancelBtn}>取消</button>
              </div>
            </div>
          )}

          <div style={styles.list}>
            {commands.length === 0 && (
              <div style={styles.emptyHint}>暂无自定义指令。点击"+ 新建指令"创建。</div>
            )}
            {commands.map((cmd) => (
              <div key={cmd.id} style={styles.cmdItem}>
                <div style={styles.cmdLeft}>
                  <span style={styles.cmdTrigger}>{cmd.trigger}</span>
                  <span style={styles.cmdSep}>—</span>
                  <span style={styles.cmdDesc}>{cmd.description}</span>
                  <span style={styles.badgeCustom}>自定义</span>
                  {!cmd.enabled && <span style={styles.badgeDisabled}>已禁用</span>}
                </div>
                <div style={styles.cmdActions}>
                  <button
                    onClick={() => startEdit(cmd)}
                    style={styles.actionBtn}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => removeCommand(cmd.id)}
                    style={styles.deleteBtn}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
  addBtn: {
    background: '#6C5CE7',
    color: '#fff',
    border: 'none',
    padding: '4px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: {},
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cmdItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 6,
  },
  cmdLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  cmdTrigger: {
    fontFamily: '"Fira Code", monospace',
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: 600,
    background: 'rgba(108,92,231,0.15)',
    padding: '1px 6px',
    borderRadius: 3,
  },
  cmdSep: {
    color: '#555',
  },
  cmdDesc: {
    fontSize: 12,
    color: '#bbb',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badgeBuiltin: {
    fontSize: 10,
    color: '#888',
    background: 'rgba(255,255,255,0.06)',
    padding: '1px 6px',
    borderRadius: 3,
  },
  badgeCustom: {
    fontSize: 10,
    color: '#F0A060',
    background: 'rgba(240,160,96,0.12)',
    padding: '1px 6px',
    borderRadius: 3,
  },
  badgeDisabled: {
    fontSize: 10,
    color: '#E06060',
    background: 'rgba(224,96,96,0.12)',
    padding: '1px 6px',
    borderRadius: 3,
  },
  toggleLabel: { cursor: 'pointer' },
  checkbox: {
    width: 15,
    height: 15,
    accentColor: '#6C5CE7',
    cursor: 'pointer',
  },
  cmdActions: {
    display: 'flex',
    gap: 6,
    marginLeft: 12,
    flexShrink: 0,
  },
  actionBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: '#aaa',
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    cursor: 'pointer',
  },
  deleteBtn: {
    background: 'rgba(224,90,90,0.15)',
    border: 'none',
    color: '#E06060',
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    cursor: 'pointer',
  },
  emptyHint: {
    color: '#666',
    fontSize: 12,
    padding: '12px 0',
    textAlign: 'center',
  },
  formCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(108,92,231,0.3)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  field: {},
  fieldLabel: {
    display: 'block',
    fontSize: 11,
    color: '#888',
    marginBottom: 3,
  },
  input: {
    width: '100%',
    background: '#111122',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    color: '#e0e0e0',
    padding: '6px 10px',
    fontSize: 12,
  },
  textarea: {
    width: '100%',
    background: '#111122',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    color: '#e0e0e0',
    padding: '6px 10px',
    fontSize: 12,
    fontFamily: '"Fira Code", monospace',
    resize: 'vertical',
  },
  formActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  saveBtn: {
    background: '#6C5CE7',
    color: '#fff',
    border: 'none',
    padding: '4px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
  },
  cancelBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: '#aaa',
    padding: '4px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
  },
}

import type { Candidate } from '../types'
import { translateWord, translateSentence } from './translator'
import { useAppStore } from '../store'

// ---- Command Definition ----

interface CommandDef {
  trigger: string
  description: string
  execute: () => Candidate[]
}

// ---- Command Registry ----

const commands: Map<string, CommandDef> = new Map()

function register(trigger: string, description: string, execute: () => Candidate[]): void {
  commands.set(trigger, { trigger, description, execute })
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

// /date — current date
register('/date', '当前日期', () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  return [{ id: 'cmd-date-1', text: `${y}-${m}-${d}`, frequency: 1000 }]
})

// /time — current time
register('/time', '当前时间', () => {
  const now = new Date()
  const h = pad(now.getHours())
  const m = pad(now.getMinutes())
  const s = pad(now.getSeconds())
  return [
    { id: 'cmd-time-1', text: `${h}:${m}:${s}`, frequency: 1000 },
    { id: 'cmd-time-2', text: `${h}:${m}`, frequency: 900 },
  ]
})

// /datetime — date + time
register('/datetime', '日期+时间', () => {
  const now = new Date()
  const y = now.getFullYear()
  const mo = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const h = pad(now.getHours())
  const mi = pad(now.getMinutes())
  return [
    { id: 'cmd-dt-1', text: `${y}-${mo}-${d} ${h}:${mi}`, frequency: 1000 },
  ]
})

// /clip — clipboard content (placeholder — actual clipboard read is async)
register('/clip', '剪贴板内容', () => {
  // The actual clipboard content is fetched async via IPC in the UI layer.
  // This placeholder is shown while the real content loads.
  return [{ id: 'cmd-clip-1', text: '读取剪贴板中...', frequency: 600 }]
})

// /calc — calculator mode (trigger, actual calc is done in math expression path)
register('/calc', '计算器模式', () => {
  return [
    { id: 'cmd-calc-info', text: '输入数学表达式', frequency: 1000 },
    { id: 'cmd-calc-eg1', text: '23*47+15', frequency: 500 },
    { id: 'cmd-calc-eg2', text: '(100-20)/4', frequency: 400 },
  ]
})

// /trans — translation mode
register('/trans', '英译中', () => {
  return [
    { id: 'cmd-trans-info', text: '输入英文单词或短语', frequency: 800 },
    { id: 'cmd-trans-eg1', text: 'hello → 你好', frequency: 500 },
    { id: 'cmd-trans-eg2', text: 'thank you → 谢谢', frequency: 400 },
  ]
})

// ---- Public API ----

/**
 * Check if the input is a command trigger.
 * Returns the command definition or null.
 */
export function matchCommand(input: string): CommandDef | null {
  const trimmed = input.trim().toLowerCase()

  // Exact match first
  if (commands.has(trimmed)) {
    return commands.get(trimmed)!
  }

  // Prefix match (user is still typing the command)
  for (const [trigger, def] of commands) {
    if (trigger.startsWith(trimmed) && trimmed.length >= 2) {
      return {
        trigger,
        description: def.description,
        execute: () => [
          { id: 'cmd-hint', text: `${trigger} — ${def.description}`, frequency: 900 },
        ],
      }
    }
  }

  return null
}

/**
 * Get all registered commands (for the commands management page).
 */
export function getAllCommands(): { trigger: string; description: string }[] {
  return Array.from(commands.entries()).map(([trigger, def]) => ({
    trigger,
    description: def.description,
  }))
}

/** Get custom commands from the store that are enabled. */
function getCustomCommands(): { trigger: string; description: string; template: string }[] {
  try {
    const store = useAppStore.getState()
    return store.commands.filter((c) => c.enabled).map((c) => ({
      trigger: c.trigger,
      description: c.description,
      template: c.template,
    }))
  } catch {
    return []
  }
}

/**
 * Execute a command by its trigger string.
 */
export function executeCommand(input: string): Candidate[] {
  const trimmed = input.trim().toLowerCase()
  const cmd = commands.get(trimmed)
  if (cmd) return cmd.execute()

  // Check custom commands for exact match
  const customCmds = getCustomCommands()
  const customMatch = customCmds.find((c) => c.trigger === trimmed)
  if (customMatch) {
    if (customMatch.template) {
      return [{ id: 'custom-exact', text: customMatch.template, frequency: 1000 }]
    }
    return [{ id: 'custom-info', text: `${customMatch.trigger} — ${customMatch.description}`, frequency: 800 }]
  }

  // Check if this is a command with arguments (e.g., "/trans hello")
  const spaceIdx = trimmed.indexOf(' ')
  if (spaceIdx > 1) {
    const trigger = trimmed.substring(0, spaceIdx)
    const arg = trimmed.substring(spaceIdx + 1).trim()
    if (arg) {
      // Check built-in commands
      if (commands.has(trigger)) {
        return executeCommandWithArg(trigger, arg)
      }
      // Check custom commands
      const customWithArg = customCmds.find((c) => c.trigger === trigger)
      if (customWithArg) {
        // Replace $1, $input, $arg placeholders in template
        let text = customWithArg.template || arg
        text = text.replace(/\$input|\$arg|\$1/g, arg)
        return [{ id: 'custom-arg', text, frequency: 1000 }]
      }
    }
  }

  // If user typed just "/", show all available commands
  if (trimmed === '/' || trimmed === '') {
    const builtIn = getAllCommands().map((c, i) => ({
      id: `cmd-list-${i}`,
      text: `${c.trigger} — ${c.description}`,
      frequency: 900 - i * 10,
    }))
    const custom = customCmds.map((c, i) => ({
      id: `cmd-custom-${i}`,
      text: `${c.trigger} — ${c.description}`,
      frequency: 700 - i * 10,
    }))
    return [...builtIn, ...custom]
  }

  // Partial match — show matching commands (built-in + custom)
  const results: Candidate[] = []
  for (const [trigger, def] of commands) {
    if (trigger.startsWith(trimmed)) {
      results.push({
        id: `cmd-match-${trigger}`,
        text: `${trigger} — ${def.description}`,
        frequency: 800 - results.length * 10,
      })
    }
  }
  for (const c of customCmds) {
    if (c.trigger.startsWith(trimmed)) {
      results.push({
        id: `cmd-custom-${c.trigger}`,
        text: `${c.trigger} — ${c.description}`,
        frequency: 700 - results.length * 10,
      })
    }
  }
  return results
}

/** Handle commands that take arguments (translation, calculation). */
function executeCommandWithArg(trigger: string, arg: string): Candidate[] {
  switch (trigger) {
    case '/trans': {
      const sentenceResult = translateSentence(arg)
      const wordResult = translateWord(arg)
      const candidates: Candidate[] = []
      if (wordResult) {
        candidates.push({ id: 'trans-1', text: wordResult, frequency: 1000 })
      }
      if (sentenceResult !== wordResult) {
        candidates.push({ id: 'trans-2', text: sentenceResult, frequency: 900 })
      }
      if (candidates.length === 0) {
        candidates.push({
          id: 'trans-none',
          text: `未找到"${arg}"的翻译`,
          frequency: 500,
        })
      }
      return candidates
    }
    case '/calc': {
      // Math evaluation is handled by the general math path in pinyin.ts
      // Here we just forward to the math evaluator
      try {
        const sanitized = arg.replace(/\s+/g, '')
        if (/^[\d+\-*/().%^]+$/.test(sanitized)) {
          const result = new Function(`return (${sanitized})`)()
          if (typeof result === 'number' && isFinite(result)) {
            return [{ id: 'calc-result', text: String(result), frequency: 1000 }]
          }
        }
      } catch { /* ignore */ }
      return [{ id: 'calc-error', text: '无效的数学表达式', frequency: 500 }]
    }
    case '/clip':
      // /clip doesn't take arguments — handled by UI layer
      return [{ id: 'cmd-clip-1', text: '读取剪贴板中...', frequency: 600 }]
    default:
      // For custom commands: show the template text
      return [{ id: 'cmd-arg', text: arg, frequency: 800 }]
  }
}

/**
 * Check if input starts with '/' for command mode activation.
 */
export function isCommandTrigger(input: string): boolean {
  return input.startsWith('/')
}

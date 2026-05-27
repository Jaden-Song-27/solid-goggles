import type { Candidate } from '../types'
import { PINYIN_SYLLABLES } from './pinyin-syllables'
import { PINYIN_DICT } from './pinyin-dict'
import { useAppStore } from '../store'
import { isCommandTrigger, executeCommand } from './commands'

// ---- User Frequency Cache ----

let _userFrequency: Record<string, number> = {}
let _frequencyLoaded = false

async function loadFrequency(): Promise<void> {
  if (_frequencyLoaded) return
  _frequencyLoaded = true
  if (window.imeAPI) {
    try {
      const raw = await window.imeAPI.getWordFrequency()
      _userFrequency = JSON.parse(raw || '{}')
    } catch {
      _userFrequency = {}
    }
  }
}

function getUserFreqBoost(text: string): number {
  let boost = 0
  // Check stored frequency
  if (_userFrequency[text]) {
    boost += _userFrequency[text] * 5
  }
  // Check current session history
  const history = useAppStore.getState().inputState.history
  for (const entry of history) {
    if (entry.text === text) boost += 15
    // Check if this text is part of a multi-char selection (user-created word)
    if (entry.text.includes(text) && entry.text.length > text.length) boost += 2
  }
  return boost
}

/** Add a user-created word (consecutive single-char selections) to frequency data */
function detectUserWord(lastTwo: string[]): void {
  if (lastTwo.length >= 2) {
    const word = lastTwo.join('')
    if (word.length >= 2 && word.length <= 8) {
      _userFrequency[word] = (_userFrequency[word] || 0) + 3
      // Persist
      if (window.imeAPI) {
        window.imeAPI.recordInput(word)
      }
    }
  }
}

// Track recent single-char selections for user word detection
let _recentSingleChars: string[] = []

export function recordSelection(text: string, isSingleChar: boolean): void {
  if (isSingleChar) {
    _recentSingleChars.push(text)
    if (_recentSingleChars.length > 4) _recentSingleChars.shift()
    detectUserWord(_recentSingleChars)
  } else {
    // Multi-char selection resets the single-char chain
    if (text.length >= 2) {
      _recentSingleChars = []
    }
    // Record for frequency
    if (window.imeAPI) {
      window.imeAPI.recordInput(text)
    }
    _userFrequency[text] = (_userFrequency[text] || 0) + 1
  }
}

/** Preload frequency data (call on app init) */
export function initFrequency(): void {
  loadFrequency()
}

/**
 * Segment a pinyin string into valid syllables using greedy longest-match.
 * "nihao" → ["ni", "hao"]
 * "shanghai" → ["shang", "hai"]
 * "xian" → ["xian"]  (not "xi"+"an", this is the ambiguity)
 */
export function segmentPinyin(input: string): string[][] {
  if (!input) return [[]]

  const results: string[][] = []
  const maxLen = 6 // longest pinyin syllable is 6 chars (zhuang, chuang, shuang)

  function backtrack(pos: number, path: string[]) {
    if (pos >= input.length) {
      results.push([...path])
      return
    }

    // Try to match from current position
    for (let len = Math.min(maxLen, input.length - pos); len >= 1; len--) {
      const candidate = input.substring(pos, pos + len)
      if (PINYIN_SYLLABLES.has(candidate)) {
        backtrack(pos + len, [...path, candidate])
      }
    }

    // If no syllable matched at this position, try single char (may be acronym)
    if (path.length === 0 || results.length === 0) {
      // Fail-safe: treat each char as acronym input
      // This handles cases like "nh" for "ni hao"
    }
  }

  backtrack(0, [])
  return results
}

/**
 * For acronym-style input ("nh" → ["ni", "hao"] matching),
 * expand each acronym letter to possible full syllables.
 */
function expandAcronym(input: string): string[][] {
  const result: string[][] = []

  function backtrack(pos: number, current: string[]) {
    if (pos >= input.length) {
      result.push([...current])
      return
    }

    const ch = input[pos]
    // Find all syllables starting with this character
    const matches: string[] = []
    for (const syl of PINYIN_SYLLABLES) {
      if (syl.startsWith(ch)) matches.push(syl)
    }
    // Sort by frequency (shorter syllables are more common)
    matches.sort((a, b) => a.length - b.length)

    // Only take top 5 to avoid combinatorial explosion
    for (const match of matches.slice(0, 5)) {
      backtrack(pos + 1, [...current, match])
    }
  }

  backtrack(0, [])
  return result.slice(0, 20)
}

/**
 * Get candidates for a pinyin input string.
 *
 * Strategy:
 * 1. Clean and normalize input
 * 2. Try exact syllable segmentation
 * 3. Combine character candidates from each syllable
 * 4. If no results, try acronym expansion
 */
export function getCandidates(input: string): Candidate[] {
  const normalized = input.toLowerCase().trim().replace(/\s+/g, '')
  if (!normalized) return []

  // ---- Command mode (starts with '/') ----
  if (isCommandTrigger(input)) {
    return executeCommand(normalized)
  }

  // ---- Math expression detection ----
  const mathResult = getMathCandidate(normalized)
  const mathCandidates = mathResult ? [mathResult] : []

  // ---- Pinyin → Hanzi ----
  const segmentations = segmentPinyin(normalized)
  let bestSegments: string[] = []

  if (segmentations.length > 0) {
    bestSegments = segmentations[0]
  } else {
    const expanded = expandAcronym(normalized)
    if (expanded.length > 0) {
      bestSegments = expanded[0]
    }
  }

  if (bestSegments.length === 0) {
    bestSegments = [normalized]
  }

  const pinyinResults = combineCandidates(bestSegments)

  // Prepend math result if available
  return [...mathCandidates, ...pinyinResults]
}

/** Check for math expression and return result as a candidate, or null. */
function getMathCandidate(input: string): Candidate | null {
  // Skip pure pinyin input (contains only letters)
  if (/^[a-zA-Z]+$/.test(input)) return null

  // Check for math expression pattern
  if (!isMathExpression(input)) return null

  const result = evaluateMath(input)
  if (result === null) return null

  return {
    id: 'math-result',
    text: String(result),
    frequency: 2000,
  }
}

/**
 * Combine character candidates from multiple syllables into word candidates.
 * "ni" + "hao" → cross product of ni-chars × hao-chars
 */
function combineCandidates(syllables: string[]): Candidate[] {
  // Get character lists for each syllable
  const charLists: string[][] = syllables.map((syl) => {
    const dict = PINYIN_DICT[syl]
    if (dict) return dict.slice(0, 8)
    return [syl]
  })

  if (charLists.length === 0) return []

  // For single syllable: return individual chars as candidates
  if (charLists.length === 1) {
    return charLists[0].map((char, i) => {
      const boost = getUserFreqBoost(char)
      return {
        id: `c-${i}`,
        text: char,
        frequency: 100 + boost - i * 3,
      }
    })
  }

  // For multi-syllable: generate word combinations
  const words: Candidate[] = []
  const [first, ...rest] = charLists
  const topFirst = first.slice(0, 4)

  for (const ch1 of topFirst) {
    for (const ch2 of rest[0]?.slice(0, 4) || ['']) {
      const word = ch1 + (ch2 || '')
      if (word.length >= 2) {
        const boost = getUserFreqBoost(word)
        words.push({
          id: `c-${words.length}`,
          text: word,
          frequency: 100 + boost - words.length * 2,
        })
      }
    }
  }

  // Add remaining first-syllable chars as single-char candidates
  for (const ch of first.slice(4)) {
    words.push({
      id: `c-${words.length}`,
      text: ch,
      frequency: 70 - words.length,
    })
  }

  // Sort by frequency
  words.sort((a, b) => b.frequency - a.frequency)

  return words.slice(0, 50)
}

/**
 * Check if input starts with '/' for command mode
 */
export function isCommandMode(input: string): boolean {
  return input.startsWith('/')
}

/**
 * Check if input looks like a math expression
 */
export function isMathExpression(input: string): boolean {
  const cleaned = input.trim()
  return /^[\d\s+\-*/().%^]+$/.test(cleaned) && /\d/.test(cleaned)
}

/**
 * Safely evaluate a math expression
 */
export function evaluateMath(expr: string): number | null {
  try {
    const sanitized = expr.replace(/\s+/g, '')
    if (!/^[\d+\-*/().%^]+$/.test(sanitized)) return null
    const result = new Function(`return (${sanitized})`)()
    if (typeof result === 'number' && isFinite(result)) return result
    return null
  } catch {
    return null
  }
}

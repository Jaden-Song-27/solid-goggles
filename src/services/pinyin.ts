import type { Candidate } from '../types'
import { PINYIN_SYLLABLES } from './pinyin-syllables'
import { PINYIN_DICT } from './pinyin-dict'
import { useAppStore } from '../store'
import { isCommandTrigger, executeCommand } from './commands'
import { safeEvaluate, isMathExpression } from './safe-math'

// ---- Performance Optimizations ----

/** Pre-built index: first letter → sorted syllables (built once at init) */
const acronymIndex: Record<string, string[]> = {}
function buildAcronymIndex() {
  for (const syl of PINYIN_SYLLABLES) {
    const key = syl[0]
    if (!acronymIndex[key]) acronymIndex[key] = []
    acronymIndex[key].push(syl)
  }
  // Sort each bucket by length (shorter = more common)
  for (const key of Object.keys(acronymIndex)) {
    acronymIndex[key].sort((a, b) => a.length - b.length)
  }
}
buildAcronymIndex()

/** Simple LRU cache for getCandidates */
const candidateCache = new Map<string, Candidate[]>()
const CACHE_MAX = 50

// ---- User Frequency Cache ----

let _userFrequency: Record<string, number> = {}
let _frequencyLoaded = false

async function loadFrequency(): Promise<void> {
  if (_frequencyLoaded) return
  _frequencyLoaded = true
  await refreshFrequencyInternal()
}

async function refreshFrequencyInternal(): Promise<void> {
  if (window.imeAPI) {
    try {
      const raw = await window.imeAPI.getWordFrequency()
      _userFrequency = JSON.parse(raw || '{}')
    } catch {
      _userFrequency = {}
    }
  }
}

/** Reload frequency data from disk (call after committing text to keep data fresh). */
export function refreshFrequency(): void {
  refreshFrequencyInternal()
  candidateCache.clear()
}

// Cached history-based boosts (rebuilt when history changes)
let _historyBoostCache: Map<string, number> = new Map()
let _historyBoostVersion = -1

function getHistoryVersion(): number {
  return useAppStore.getState().inputState.history.length
}

function getHistoryBoosts(): Map<string, number> {
  const version = getHistoryVersion()
  if (version === _historyBoostVersion) return _historyBoostCache

  const boosts = new Map<string, number>()
  const history = useAppStore.getState().inputState.history
  for (const entry of history) {
    boosts.set(entry.text, (boosts.get(entry.text) || 0) + 15)
    // Substring matches for multi-char words
    if (entry.text.length > 1) {
      for (let i = 0; i < entry.text.length; i++) {
        const sub = entry.text[i]
        boosts.set(sub, (boosts.get(sub) || 0) + 2)
      }
    }
  }
  _historyBoostCache = boosts
  _historyBoostVersion = version
  return boosts
}

function getUserFreqBoost(text: string): number {
  let boost = 0
  if (_userFrequency[text]) {
    boost += _userFrequency[text] * 5
  }
  boost += getHistoryBoosts().get(text) || 0
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

  let found = 0
  function backtrack(pos: number, path: string[]) {
    if (found >= 10) return // Limit to first 10 segmentations
    if (pos >= input.length) {
      results.push([...path])
      found++
      return
    }
    for (let len = Math.min(maxLen, input.length - pos); len >= 1; len--) {
      const candidate = input.substring(pos, pos + len)
      if (PINYIN_SYLLABLES.has(candidate)) {
        backtrack(pos + len, [...path, candidate])
        if (found >= 10) return
      }
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
  const len = input.length

  function backtrack(pos: number, current: string[]) {
    if (pos >= len) {
      result.push([...current])
      return
    }
    const matches = acronymIndex[input[pos]]
    if (!matches) return
    // Take top 5 to avoid combinatorial explosion
    const limit = Math.min(matches.length, 5)
    for (let i = 0; i < limit; i++) {
      backtrack(pos + 1, [...current, matches[i]])
      if (result.length >= 20) return // Early exit
    }
  }

  backtrack(0, [])
  return result
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
  // Use cache for instant response on repeated prefixes
  const cacheKey = input.toLowerCase().trim()
  const cached = candidateCache.get(cacheKey)
  if (cached) return cached

  const normalized = cacheKey.replace(/\s+/g, '')
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
  const results = [...mathCandidates, ...pinyinResults]

  // Cache result (LRU eviction)
  if (candidateCache.size >= CACHE_MAX) {
    const firstKey = candidateCache.keys().next().value
    if (firstKey !== undefined) candidateCache.delete(firstKey)
  }
  candidateCache.set(cacheKey, results)

  return results
}

/** Clear the candidate cache (call when frequency data changes) */
export function clearCandidateCache(): void {
  candidateCache.clear()
}

/** Check for math expression and return result as a candidate, or null. */
function getMathCandidate(input: string): Candidate | null {
  // Skip pure pinyin input (contains only letters)
  if (/^[a-zA-Z]+$/.test(input)) return null

  // Check for math expression pattern
  if (!isMathExpression(input)) return null

  const result = safeEvaluate(input)
  if (result === null) return null

  return {
    id: 'math-result',
    text: String(result),
    frequency: 2000,
  }
}

/**
 * Combine character candidates from multiple syllables into word candidates.
 * "ni" + "hao" + "ma" → cross product of ni-chars × hao-chars × ma-chars
 * Supports up to 6 syllables efficiently.
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

  // For multi-syllable: generate full word combinations using iterative combination
  const words: Candidate[] = []

  // Take top characters from each syllable (top 4 for first, top 3 for others
  // to avoid combinatorial explosion with 3+ syllables)
  const trimmedLists = charLists.map((chars, idx) =>
    idx === 0 ? chars.slice(0, 4) : chars.slice(0, 3)
  )

  // Iterative combination: start with first syllable chars, then combine with each subsequent
  let combos: string[] = trimmedLists[0]
  for (let si = 1; si < trimmedLists.length; si++) {
    const next: string[] = []
    for (const prefix of combos.slice(0, 20)) {
      for (const ch of trimmedLists[si]) {
        next.push(prefix + ch)
      }
    }
    combos = next.slice(0, 50)
  }

  for (const word of combos) {
    if (word.length >= 2) {
      const boost = getUserFreqBoost(word)
      words.push({
        id: `c-${words.length}`,
        text: word,
        frequency: 100 + boost - words.length * 2,
      })
    }
  }

  // Add remaining first-syllable chars as single-char candidates
  const firstList = charLists[0]
  for (const ch of firstList.slice(4)) {
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
 * Check if input looks like a math expression.
 * Re-exported from safe-math for backward compatibility.
 */
export { isMathExpression } from './safe-math'

/**
 * Safely evaluate a math expression.
 * Re-exported from safe-math for backward compatibility.
 */
export { safeEvaluate as evaluateMath } from './safe-math'

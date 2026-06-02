/**
 * Safe math expression evaluator.
 *
 * Uses a recursive descent parser instead of eval()/new Function() to
 * prevent arbitrary code execution from user-supplied math expressions.
 *
 * Supported: +, -, *, /, %, **, (), decimals, unary minus
 */

type Token =
  | { type: 'number'; value: number }
  | { type: 'op'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'eof' }

class Tokenizer {
  private pos = 0

  constructor(private input: string) {}

  next(): Token {
    this.skipWhitespace()
    if (this.pos >= this.input.length) return { type: 'eof' }

    const ch = this.input[this.pos]

    // Numbers (integer or decimal)
    if (/[0-9.]/.test(ch)) {
      let num = ''
      let hasDot = false
      while (this.pos < this.input.length) {
        const c = this.input[this.pos]
        if (c === '.') {
          if (hasDot) break // Reject multiple decimal points
          hasDot = true
          num += c
          this.pos++
        } else if (/[0-9]/.test(c)) {
          num += c
          this.pos++
        } else {
          break
        }
      }
      return { type: 'number', value: parseFloat(num) }
    }

    // Operators
    if ('+-*/%^()'.includes(ch)) {
      this.pos++
      // Two-char operators: **
      if (ch === '*' && this.pos < this.input.length && this.input[this.pos] === '*') {
        this.pos++
        return { type: 'op', value: '**' }
      }
      if (ch === '(') return { type: 'lparen' }
      if (ch === ')') return { type: 'rparen' }
      // Map ^ to ** for exponentiation
      if (ch === '^') return { type: 'op', value: '**' }
      return { type: 'op', value: ch }
    }

    throw new Error(`Unexpected character: '${ch}' at position ${this.pos}`)
  }

  private skipWhitespace() {
    while (this.pos < this.input.length && this.input[this.pos] === ' ') {
      this.pos++
    }
  }
}

class Parser {
  private tokenizer: Tokenizer
  private current: Token

  constructor(input: string) {
    this.tokenizer = new Tokenizer(input)
    this.current = this.tokenizer.next()
  }

  parse(): number {
    const result = this.expr()
    if (this.current.type !== 'eof') {
      throw new Error(`Unexpected token after expression`)
    }
    return result
  }

  private eat(expected?: string) {
    if (expected && this.current.type === 'op' && this.current.value !== expected) {
      throw new Error(`Expected '${expected}' but got '${this.current.value}'`)
    }
    this.current = this.tokenizer.next()
  }

  /** expr := term (('+' | '-') term)* */
  private expr(): number {
    let left = this.term()
    while (this.current.type === 'op' && (this.current.value === '+' || this.current.value === '-')) {
      const op = this.current.value
      this.eat()
      const right = this.term()
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  /** term := unary (('*' | '/' | '%' | '**') unary)* */
  private term(): number {
    let left = this.unary()
    while (
      this.current.type === 'op' &&
      (this.current.value === '*' || this.current.value === '/' || this.current.value === '%' || this.current.value === '**')
    ) {
      const op = this.current.value
      this.eat()
      const right = this.unary()
      switch (op) {
        case '*': left = left * right; break
        case '/':
          if (right === 0) throw new Error('Division by zero')
          left = left / right
          break
        case '%':
          if (right === 0) throw new Error('Modulo by zero')
          left = left % right
          break
        case '**': left = left ** right; break
      }
    }
    return left
  }

  /** unary := ('+' | '-')? factor */
  private unary(): number {
    if (this.current.type === 'op' && this.current.value === '-') {
      this.eat()
      return -this.factor()
    }
    if (this.current.type === 'op' && this.current.value === '+') {
      this.eat()
      return this.factor()
    }
    return this.factor()
  }

  /** factor := number | '(' expr ')' */
  private factor(): number {
    if (this.current.type === 'number') {
      const val = this.current.value
      this.eat()
      return val
    }
    if (this.current.type === 'lparen') {
      this.eat()
      const val = this.expr()
      // TypeScript can't track mutation of this.current through method calls,
      // so we cast the type for this comparison.
      if ((this.current.type as Token['type']) !== 'rparen') {
        throw new Error('Missing closing parenthesis')
      }
      this.eat()
      return val
    }
    throw new Error(`Unexpected token: ${JSON.stringify(this.current)}`)
  }
}

/**
 * Safely evaluate a math expression.
 * Returns the numeric result, or null if the expression is invalid.
 */
export function safeEvaluate(expr: string): number | null {
  try {
    const sanitized = expr.replace(/\s+/g, '')
    if (!sanitized) return null
    // Only allow digits, operators, decimal point, parentheses
    if (!/^[\d+\-*/().%^]+$/.test(sanitized)) return null
    const parser = new Parser(sanitized)
    const result = parser.parse()
    if (typeof result === 'number' && isFinite(result)) return result
    return null
  } catch {
    return null
  }
}

/**
 * Check if input looks like a math expression.
 */
export function isMathExpression(input: string): boolean {
  const cleaned = input.trim()
  return /^[\d\s+\-*/().%^]+$/.test(cleaned) && /\d/.test(cleaned)
}

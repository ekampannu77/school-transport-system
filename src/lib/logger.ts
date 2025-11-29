type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  data?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private minLevel: LogLevel
  private context?: string

  constructor(context?: string) {
    this.context = context
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  private formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify(entry)
    }

    // Human-readable format for development
    const { timestamp, level, message, context, data, error } = entry
    let output = `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${context ? `[${context}] ` : ''}${message}`

    if (data && Object.keys(data).length > 0) {
      output += `\n  Data: ${JSON.stringify(data, null, 2)}`
    }

    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`
      if (error.stack) {
        output += `\n  Stack: ${error.stack}`
      }
    }

    return output
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    const formatted = this.formatLog(entry)

    switch (level) {
      case 'debug':
        console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data)
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const err = error instanceof Error ? error : undefined
    const extraData = error instanceof Error ? data : { ...(data || {}), error }
    this.log('error', message, extraData, err)
  }

  child(context: string): Logger {
    return new Logger(this.context ? `${this.context}:${context}` : context)
  }
}

// Create a default logger instance
export const logger = new Logger()

// Create context-specific loggers
export const createLogger = (context: string): Logger => new Logger(context)

// Pre-configured loggers for common contexts
export const authLogger = createLogger('auth')
export const fleetLogger = createLogger('fleet')
export const driverLogger = createLogger('driver')
export const studentLogger = createLogger('student')
export const paymentLogger = createLogger('payment')
export const expenseLogger = createLogger('expense')
export const fuelLogger = createLogger('fuel')
export const routeLogger = createLogger('route')
export const alertLogger = createLogger('alert')

export default logger

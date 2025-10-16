import dotenv from 'dotenv';

dotenv.config({ path: '.env' })

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    CRITICAL = 3
}

const COLORS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '\x1b[90m',    // Gray
    [LogLevel.INFO]: '\x1b[97m',     // White
    [LogLevel.WARN]: '\x1b[33m',     // Yellow
    [LogLevel.CRITICAL]: '\x1b[31m'  // Red
}

const EMOJI: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '🔍',
    [LogLevel.INFO]: '💡',
    [LogLevel.WARN]: '⚠️',
    [LogLevel.CRITICAL]: '🔥'
}
const RESET = '\x1b[0m'

export function log(message: any): void;
export function log(message: any, severity: LogLevel): void;
export function log(message: any, level: LogLevel = LogLevel.DEBUG) {
    const enabled = process.env.LOGGING_ENABLED === 'true'
    const threshold = parseInt(process.env.MINIMUM_LOG_LEVEL || LogLevel.DEBUG.toString())
    if (!enabled || level < threshold) return

    const color = COLORS[level] || ''
    const emoji = EMOJI[level] || ''
    const label = LogLevel[level]
    const padded = label.padStart(9) // e.g. "INFO " → length 5
    console.log(`${color}[${emoji}${padded}]${RESET} ${message.toString()}`)
}

export default { LogLevel, log }
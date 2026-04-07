import morgan from 'morgan'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

// Role colors for console
const ROLE_COLORS: Record<string, string> = {
  admin:        '\x1b[35m', // Magenta
  doctor:       '\x1b[36m', // Cyan
  receptionist: '\x1b[34m', // Blue
  lab:          '\x1b[33m', // Yellow
  pharmacist:   '\x1b[32m', // Green
  dispensary:   '\x1b[92m', // Bright Green
  manager:      '\x1b[95m', // Bright Magenta
  patient:      '\x1b[37m', // White
  system:       '\x1b[90m', // Gray (no auth)
}

// Status colors
const STATUS_COLOR = (status: number): string => {
  if (status >= 500) return '\x1b[31m' // Red
  if (status >= 400) return '\x1b[33m' // Yellow
  if (status >= 300) return '\x1b[36m' // Cyan
  if (status >= 200) return '\x1b[32m' // Green
  return '\x1b[37m'
}

// Method colors
const METHOD_COLOR: Record<string, string> = {
  GET:    '\x1b[32m', // Green
  POST:   '\x1b[34m', // Blue
  PUT:    '\x1b[33m', // Yellow
  PATCH:  '\x1b[33m', // Yellow
  DELETE: '\x1b[31m', // Red
}

const RESET = '\x1b[0m'
const BOLD  = '\x1b[1m'

// Get role from JWT token in request
const getRoleFromRequest = (req: Request): string => {
  try {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return 'system'

    const token = auth.replace('Bearer ', '')
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { role: string }

    return decoded.role || 'system'
  } catch {
    return 'system'
  }
}

// Custom morgan token — role
morgan.token('role', (req: Request) => {
  return getRoleFromRequest(req)
})

// Custom morgan token — colored role badge
morgan.token('role-badge', (req: Request) => {
  const role = getRoleFromRequest(req)
  const color = ROLE_COLORS[role] || ROLE_COLORS.system
  const label = role.toUpperCase().padEnd(12)
  return `${BOLD}${color}[${label}]${RESET}`
})

// Custom morgan token — colored method
morgan.token('colored-method', (req: Request) => {
  const method = req.method
  const color = METHOD_COLOR[method] || '\x1b[37m'
  return `${BOLD}${color}${method.padEnd(6)}${RESET}`
})

// Custom morgan token — colored status
morgan.token('colored-status', (
  _req: Request,
  res: Response
) => {
  const status = res.statusCode
  const color = STATUS_COLOR(status)
  return `${BOLD}${color}${status}${RESET}`
})

// Custom morgan token — response time with color
morgan.token('colored-time', (
  req: Request,
  res: Response
) => {
  // @ts-ignore
  const time = morgan['response-time'](req, res, 0)
  const ms = parseFloat(time || '0')
  let color = '\x1b[32m' // Green — fast
  if (ms > 500) color = '\x1b[31m' // Red — slow
  else if (ms > 200) color = '\x1b[33m' // Yellow — medium
  return `${color}${ms.toFixed(0)}ms${RESET}`
})

// Custom morgan token — timestamp
morgan.token('timestamp', () => {
  return new Date().toLocaleTimeString('en-PK', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
})

// Final format string:
// [13:45:22] [ADMIN       ] GET    /api/patients 200 245ms
const MMH_LOG_FORMAT =
  ':timestamp :role-badge :colored-method ' +
  ':url :colored-status :colored-time - :res[content-length]'

export const requestLogger = morgan(MMH_LOG_FORMAT, {
  // Skip logging for health check endpoint
  skip: (req) => req.url === '/health',
})

// Separate logger for errors only (status >= 400)
export const errorLogger = morgan(MMH_LOG_FORMAT, {
  skip: (_req, res) => res.statusCode < 400,
  stream: process.stderr,
})

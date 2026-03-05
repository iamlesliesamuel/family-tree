import type { NextRequest } from 'next/server'

export function getEditedBy(req: NextRequest, fallback?: unknown): string | null {
  const header = req.headers.get('x-edited-by')
  if (header && header.trim()) return header.trim().slice(0, 120)
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim().slice(0, 120)
  return null
}

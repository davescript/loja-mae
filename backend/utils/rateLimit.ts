import type { D1Database } from '@cloudflare/workers-types'
import { executeOne, executeRun } from './db'

export async function checkRateLimit(
  db: D1Database,
  key: string,
  route: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString()

  const row = await executeOne<{ id: number; count: number }>(
    db,
    'SELECT id, count FROM rate_limits WHERE key = ? AND route = ? AND window_start = ?',
    [key, route, windowStart]
  )

  if (!row) {
    await executeRun(db, 'INSERT INTO rate_limits (key, route, window_start, count) VALUES (?, ?, ?, 1)', [
      key,
      route,
      windowStart,
    ])
    return { allowed: true, remaining: limit - 1 }
  }

  const newCount = row.count + 1
  await executeRun(db, 'UPDATE rate_limits SET count = ? WHERE id = ?', [newCount, row.id])
  return { allowed: newCount <= limit, remaining: Math.max(0, limit - newCount) }
}

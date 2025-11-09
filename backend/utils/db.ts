import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export function getDb(env: any): D1Database {
  if (!env.DB) {
    throw new Error('D1 database not available');
  }
  return env.DB;
}

export function getR2Bucket(env: any): R2Bucket {
  if (!env.R2) {
    throw new Error('R2 bucket not available');
  }
  return env.R2;
}

export async function executeQuery<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const stmt = db.prepare(query);
    // Bind all parameters at once if there are any
    const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await boundStmt.all<T>();
    return result.results || [];
  } catch (error) {
    console.error('Database query error:', error, 'Query:', query, 'Params:', params);
    throw error;
  }
}

export async function executeOne<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const stmt = db.prepare(query);
    // Bind all parameters at once if there are any
    const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await boundStmt.first<T>();
    return result || null;
  } catch (error) {
    console.error('Database query error:', error, 'Query:', query, 'Params:', params);
    throw error;
  }
}

export async function executeRun(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<{ success: boolean; meta: any }> {
  try {
    const stmt = db.prepare(query);
    // Bind all parameters at once if there are any
    const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await boundStmt.run();
    return {
      success: result.success,
      meta: result.meta,
    };
  } catch (error) {
    console.error('Database execute error:', error, 'Query:', query, 'Params:', params);
    throw error;
  }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function centsToBRL(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function brlToCents(brl: string): number {
  return Math.round(parseFloat(brl.replace(',', '.')) * 100);
}


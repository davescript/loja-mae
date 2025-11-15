import type { D1Database } from '@cloudflare/workers-types';
import { executeRun, executeQuery, executeOne } from '../utils/db';

/**
 * Atualiza o segmento de um cliente baseado em seu comportamento
 */
export async function updateCustomerSegment(db: D1Database, customerId: number): Promise<void> {
  // Buscar estatísticas do cliente
  const stats = await executeOne<{
    orders_count: number;
    lifetime_value_cents: number;
    last_order_at: string | null;
  }>(
    db,
    `SELECT 
      COUNT(*) as orders_count,
      COALESCE(SUM(total_cents), 0) as lifetime_value_cents,
      MAX(created_at) as last_order_at
     FROM orders
     WHERE customer_id = ? AND payment_status = 'paid'`,
    [customerId]
  );

  if (!stats) {
    return;
  }

  let segment = 'new';
  const ordersCount = stats.orders_count || 0;
  const lifetimeValue = stats.lifetime_value_cents || 0;
  const lastOrderAt = stats.last_order_at;

  // Calcular se está inativo (último pedido há mais de 180 dias)
  const daysSinceLastOrder = lastOrderAt
    ? (Date.now() - new Date(lastOrderAt).getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  if (daysSinceLastOrder > 180 && ordersCount > 0) {
    segment = 'inactive';
  } else if (ordersCount >= 10 || lifetimeValue >= 50000) {
    // VIP: 10+ pedidos OU €500+
    segment = 'vip';
  } else if (ordersCount >= 2 || lifetimeValue >= 5000) {
    // Regular: 2-10 pedidos OU €50-500
    segment = 'regular';
  } else {
    // New: < 2 pedidos E < €50
    segment = 'new';
  }

  // Atualizar cliente
  await executeRun(
    db,
    `UPDATE customers 
     SET segment = ?,
         lifetime_value_cents = ?,
         last_order_at = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [segment, lifetimeValue, lastOrderAt, customerId]
  );
}

/**
 * Atualiza segmentos de todos os clientes (executar via cron)
 */
export async function updateAllCustomerSegments(db: D1Database): Promise<{ updated: number }> {
  const customers = await executeQuery<{ id: number }>(
    db,
    'SELECT id FROM customers WHERE is_active = 1'
  );

  let updated = 0;
  for (const customer of customers || []) {
    try {
      await updateCustomerSegment(db, customer.id);
      updated++;
    } catch (error) {
      console.error(`Error updating segment for customer ${customer.id}:`, error);
    }
  }

  return { updated };
}

/**
 * Lista clientes por segmento
 */
export async function getCustomersBySegment(
  db: D1Database,
  segment: 'new' | 'regular' | 'vip' | 'inactive',
  limit: number = 100
): Promise<any[]> {
  const customers = await executeQuery(
    db,
    `SELECT id, email, first_name, last_name, segment, lifetime_value_cents, last_order_at 
     FROM customers 
     WHERE segment = ? AND is_active = 1
     ORDER BY lifetime_value_cents DESC
     LIMIT ?`,
    [segment, limit]
  );

  return customers || [];
}


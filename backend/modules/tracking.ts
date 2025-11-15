import type { D1Database } from '@cloudflare/workers-types';
import { executeQuery, executeOne, executeRun } from '../utils/db';

export interface TrackingEvent {
  id: number;
  order_id: number;
  event_type: 'created' | 'paid' | 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
  location?: string | null;
  description?: string | null;
  created_at: string;
}

/**
 * Adiciona um evento de rastreamento
 */
export async function addTrackingEvent(
  db: D1Database,
  orderId: number,
  eventType: TrackingEvent['event_type'],
  description?: string,
  location?: string
): Promise<TrackingEvent> {
  const result = await executeRun(
    db,
    `INSERT INTO order_tracking_events (order_id, event_type, location, description)
     VALUES (?, ?, ?, ?)`,
    [orderId, eventType, location || null, description || null]
  );

  if (!result.success) {
    throw new Error('Failed to create tracking event');
  }

  const event = await executeOne<TrackingEvent>(
    db,
    'SELECT * FROM order_tracking_events WHERE id = ?',
    [result.meta.last_row_id]
  );

  if (!event) {
    throw new Error('Failed to retrieve tracking event');
  }

  return event;
}

/**
 * Lista eventos de rastreamento de um pedido
 */
export async function getTrackingEvents(
  db: D1Database,
  orderId: number
): Promise<TrackingEvent[]> {
  const events = await executeQuery<TrackingEvent>(
    db,
    'SELECT * FROM order_tracking_events WHERE order_id = ? ORDER BY created_at ASC',
    [orderId]
  );

  return events || [];
}

/**
 * Atualiza informações de rastreio do pedido
 */
export async function updateOrderTracking(
  db: D1Database,
  orderId: number,
  data: {
    tracking_number?: string;
    carrier?: string;
    shipped_at?: string;
    delivered_at?: string;
    estimated_delivery?: string;
  }
): Promise<void> {
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (data.tracking_number !== undefined) {
    updateFields.push('tracking_number = ?');
    updateValues.push(data.tracking_number);
  }

  if (data.carrier !== undefined) {
    updateFields.push('carrier = ?');
    updateValues.push(data.carrier);
  }

  if (data.shipped_at !== undefined) {
    updateFields.push('shipped_at = ?');
    updateValues.push(data.shipped_at);
  }

  if (data.delivered_at !== undefined) {
    updateFields.push('delivered_at = ?');
    updateValues.push(data.delivered_at);
  }

  if (data.estimated_delivery !== undefined) {
    updateFields.push('estimated_delivery = ?');
    updateValues.push(data.estimated_delivery);
  }

  if (updateFields.length === 0) {
    return;
  }

  updateFields.push('updated_at = datetime("now")');

  await executeRun(
    db,
    `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
    [...updateValues, orderId]
  );
}

/**
 * Marcar pedido como enviado
 */
export async function markAsShipped(
  db: D1Database,
  orderId: number,
  trackingNumber: string,
  carrier: string,
  estimatedDelivery?: string
): Promise<void> {
  const now = new Date().toISOString();

  await executeRun(
    db,
    `UPDATE orders 
     SET status = 'shipped',
         fulfillment_status = 'fulfilled',
         tracking_number = ?,
         carrier = ?,
         shipped_at = ?,
         estimated_delivery = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [trackingNumber, carrier, now, estimatedDelivery || null, orderId]
  );

  // Adicionar evento de rastreamento
  await addTrackingEvent(
    db,
    orderId,
    'shipped',
    `Pedido enviado via ${carrier} - Código: ${trackingNumber}`,
    'Centro de Distribuição'
  );
}

/**
 * Marcar pedido como entregue
 */
export async function markAsDelivered(
  db: D1Database,
  orderId: number,
  location?: string
): Promise<void> {
  const now = new Date().toISOString();

  await executeRun(
    db,
    `UPDATE orders 
     SET status = 'delivered',
         delivered_at = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [now, orderId]
  );

  // Adicionar evento de rastreamento
  await addTrackingEvent(
    db,
    orderId,
    'delivered',
    'Pedido entregue ao destinatário',
    location || 'Endereço de entrega'
  );
}


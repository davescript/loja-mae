import type { Env } from '../../../types';
import { getDb } from '../../../utils/db';
import { successResponse, errorResponse } from '../../../utils/response';
import { handleError } from '../../../utils/errors';
import { requireAdmin } from '../../../utils/auth';
import {
  updateOrderTracking,
  markAsShipped,
  markAsDelivered,
  addTrackingEvent,
  getTrackingEvents,
} from '../../../modules/tracking';

/**
 * PUT /api/admin/orders/:id/tracking - Atualizar informações de rastreamento
 */
export async function handleUpdateTracking(request: Request, env: Env, orderId: string): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);
    const id = parseInt(orderId);
    const body = await request.json() as {
      tracking_number?: string;
      carrier?: string;
      estimated_delivery?: string;
    };

    await updateOrderTracking(db, id, body);

    return successResponse({ message: 'Tracking information updated' });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

/**
 * POST /api/admin/orders/:id/ship - Marcar como enviado
 */
export async function handleMarkAsShipped(request: Request, env: Env, orderId: string): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);
    const id = parseInt(orderId);
    const body = await request.json() as {
      tracking_number: string;
      carrier: string;
      estimated_delivery?: string;
    };

    if (!body.tracking_number || !body.carrier) {
      return errorResponse('tracking_number and carrier are required', 400);
    }

    await markAsShipped(db, id, body.tracking_number, body.carrier, body.estimated_delivery);

    return successResponse({ message: 'Order marked as shipped' });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

/**
 * POST /api/admin/orders/:id/deliver - Marcar como entregue
 */
export async function handleMarkAsDelivered(request: Request, env: Env, orderId: string): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);
    const id = parseInt(orderId);
    const body = await request.json() as {
      location?: string;
    };

    await markAsDelivered(db, id, body.location);

    return successResponse({ message: 'Order marked as delivered' });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

/**
 * POST /api/admin/orders/:id/tracking-event - Adicionar evento manual
 */
export async function handleAddTrackingEvent(request: Request, env: Env, orderId: string): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);
    const id = parseInt(orderId);
    const body = await request.json() as {
      event_type: 'created' | 'paid' | 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
      description?: string;
      location?: string;
    };

    if (!body.event_type) {
      return errorResponse('event_type is required', 400);
    }

    const event = await addTrackingEvent(db, id, body.event_type, body.description, body.location);

    return successResponse({ event, message: 'Tracking event added' });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

/**
 * GET /api/admin/orders/:id/tracking - Buscar eventos de rastreamento
 */
export async function handleGetTrackingEvents(request: Request, env: Env, orderId: string): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);
    const id = parseInt(orderId);

    const events = await getTrackingEvents(db, id);

    return successResponse({ events });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}


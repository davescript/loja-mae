import type { Env } from '../../../types';
import { getDb, executeQuery } from '../../../utils/db';
import { successResponse, errorResponse } from '../../../utils/response';
import { handleError } from '../../../utils/errors';
import { requireAdmin } from '../../../utils/auth';

/**
 * Endpoint para polling eficiente de atualizações de pedidos
 * Retorna apenas pedidos criados ou atualizados após um timestamp
 */
export async function handleGetOrderUpdates(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);
    const url = new URL(request.url);
    
    const lastUpdatedAt = url.searchParams.get('lastUpdatedAt');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!lastUpdatedAt) {
      return errorResponse('lastUpdatedAt parameter is required', 400);
    }

    // Buscar pedidos atualizados após o timestamp
    const updatedOrders = await executeQuery<{
      id: number;
      order_number: string;
      status: string;
      payment_status: string;
      total_cents: number;
      updated_at: string;
      created_at: string;
    }>(
      db,
      `SELECT 
        id, order_number, status, payment_status, total_cents, updated_at, created_at
      FROM orders
      WHERE updated_at > ? OR created_at > ?
      ORDER BY updated_at DESC
      LIMIT ?`,
      [lastUpdatedAt, lastUpdatedAt, limit]
    );

    return successResponse({
      orders: updatedOrders || [],
      count: updatedOrders?.length || 0,
      lastUpdatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}


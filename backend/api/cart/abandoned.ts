import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';
import {
  listAbandonedCarts,
  getCart,
  getCartItems,
  markCartAsAbandoned,
  getAbandonedCarts,
} from '../../modules/carts';
import { sendAbandonedCartEmail } from '../../services/email';

/**
 * GET /api/admin/carts/abandoned
 * Lista carrinhos abandonados para o admin
 */
export async function handleListAbandonedCarts(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as
      | 'open'
      | 'abandoned'
      | 'recovered'
      | 'completed'
      | null;
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    const result = await listAbandonedCarts(db, {
      status: status || undefined,
      page,
      pageSize,
    });

    // Buscar itens de cada carrinho
    const cartsWithItems = await Promise.all(
      result.items.map(async (cart) => {
        const items = await getCartItems(db, cart.id);
        return {
          ...cart,
          items,
        };
      })
    );

    return successResponse({
      items: cartsWithItems,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

/**
 * GET /api/admin/carts/abandoned/:cartId
 * Detalhes de um carrinho abandonado
 */
export async function handleGetAbandonedCart(
  request: Request,
  env: Env,
  cartId: string
): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);

    const cart = await getCart(db, cartId);
    if (!cart) {
      return errorResponse('Cart not found', 404);
    }

    const items = await getCartItems(db, cartId);

    return successResponse({
      ...cart,
      items,
    });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

/**
 * POST /api/admin/carts/abandoned/:cartId/send-email
 * Envia email de recuperação manualmente
 */
export async function handleSendRecoveryEmail(
  request: Request,
  env: Env,
  cartId: string
): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);

    const cart = await getCart(db, cartId);
    if (!cart) {
      return errorResponse('Cart not found', 404);
    }

    if (!cart.email) {
      return errorResponse('Cart has no email address', 400);
    }

    const items = await getCartItems(db, cartId);
    const success = await sendAbandonedCartEmail(env, cart, items);

    if (success) {
      return successResponse({ message: 'Email sent successfully' });
    } else {
      return errorResponse('Failed to send email', 500);
    }
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

/**
 * POST /api/cart/mark-abandoned
 * Marca carrinhos como abandonados (chamado pelo CRON)
 */
export async function handleMarkAbandoned(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Verificar se é chamado pelo CRON (pode adicionar autenticação específica)
    const db = getDb(env);

    const abandonedCarts = await getAbandonedCarts(db, 1); // 1 hora
    let marked = 0;

    for (const cart of abandonedCarts) {
      await markCartAsAbandoned(db, cart.id);
      marked++;
    }

    return successResponse({
      message: `Marked ${marked} carts as abandoned`,
      count: marked,
    });
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}


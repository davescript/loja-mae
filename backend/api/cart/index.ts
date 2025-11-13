import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth } from '../../utils/auth';
import { executeQuery, executeOne, executeRun } from '../../utils/db';
import {
  createOrUpdateCart,
  getCartByUser,
  getCart,
  addItemToCart,
  getCartItems,
  updateCartItemQuantity,
  removeCartItem,
  markCartAsRecovered,
  markCartAsCompleted,
} from '../../modules/carts';

export async function handleCartRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const db = getDb(env);
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/cart - Get cart items
    // Suporta cart_id na query string para recuperação de carrinho abandonado
    if (method === 'GET' && path === '/api/cart') {
      try {
        const url = new URL(request.url);
        const cartId = url.searchParams.get('cart_id');
        
        // Se tem cart_id, buscar carrinho específico (para recuperação)
        if (cartId) {
          const cart = await getCart(db, cartId);
          if (!cart) {
            return errorResponse('Cart not found', 404);
          }
          
          const items = await getCartItems(db, cartId);
          
          // Transformar para formato esperado pelo frontend
          const cartItems = items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            title: item.product_name,
            price_cents: item.price_cents,
            quantity: item.quantity,
            image_url: item.image_url || null,
            sku: item.sku || null,
          }));
          
          return successResponse({
            cart_id: cart.id,
            items: cartItems,
            total_cents: cart.total_cents,
          });
        }
        
        // Buscar carrinho do usuário logado
        try {
          const user = await requireAuth(request, env, 'both');
          
          if (user.type === 'customer') {
            // Buscar ou criar carrinho
            const cart = await getCartByUser(db, user.id, null);
            
            if (cart) {
              const items = await getCartItems(db, cart.id);
              const cartItems = items.map((item) => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                title: item.product_name,
                price_cents: item.price_cents,
                quantity: item.quantity,
                image_url: item.image_url || null,
                sku: item.sku || null,
              }));
              
              return successResponse({
                cart_id: cart.id,
                items: cartItems,
                total_cents: cart.total_cents,
              });
            }
          }
        } catch {
          // Guest - tentar buscar por session_id
          const sessionId = request.headers.get('x-session-id') || 
                           new URL(request.url).searchParams.get('session_id');
          
          if (sessionId) {
            const cart = await getCartByUser(db, null, sessionId);
            if (cart) {
              const items = await getCartItems(db, cart.id);
              const cartItems = items.map((item) => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                title: item.product_name,
                price_cents: item.price_cents,
                quantity: item.quantity,
                image_url: item.image_url || null,
                sku: item.sku || null,
              }));
              
              return successResponse({
                cart_id: cart.id,
                items: cartItems,
                total_cents: cart.total_cents,
              });
            }
          }
        }
        
        return successResponse({ items: [], cart_id: null, total_cents: 0 });
      } catch (error) {
        const { message, status } = handleError(error);
        return errorResponse(message, status);
      }
    }

    // PUT /api/cart - Sync cart items
    if (method === 'PUT' && path === '/api/cart') {
      try {
        const user = await requireAuth(request, env, 'customer');
        const body = await request.json() as { items: Array<{
          product_id: number;
          variant_id?: number | null;
          quantity: number;
          price_cents: number;
          title: string;
          image_url?: string | null;
        }> };

        // Clear existing cart
        await executeRun(
          db,
          'DELETE FROM cart_items WHERE customer_id = ?',
          [user.id]
        );

        // Add new items
        for (const item of body.items) {
          await executeRun(
            db,
            `INSERT INTO cart_items (customer_id, product_id, variant_id, quantity, price_cents, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
              user.id,
              item.product_id,
              item.variant_id || null,
              item.quantity,
              item.price_cents,
            ]
          );
        }

        return successResponse({ message: 'Cart synced' });
      } catch (error) {
        const { message, status } = handleError(error);
        return errorResponse(message, status);
      }
    }

    // POST /api/cart - Add item to cart
    if (method === 'POST' && path === '/api/cart') {
      try {
        const user = await requireAuth(request, env, 'customer');
        const body = await request.json() as {
          product_id: number;
          variant_id?: number | null;
          quantity: number;
        };

        // Check if item already exists
        const existing = await executeOne(
          db,
          'SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
          [user.id, body.product_id, body.variant_id || null, body.variant_id || null]
        );

        if (existing) {
          // Update quantity
          await executeRun(
            db,
            'UPDATE cart_items SET quantity = quantity + ?, updated_at = datetime("now") WHERE id = ?',
            [body.quantity, existing.id]
          );
        } else {
          // Get product price
          const product = await executeOne<{ price_cents: number }>(
            db,
            'SELECT price_cents FROM products WHERE id = ?',
            [body.product_id]
          );

          if (!product) {
            return errorResponse('Product not found', 404);
          }

          let priceCents = product.price_cents;

          if (body.variant_id) {
            const variant = await executeOne<{ price_cents: number }>(
              db,
              'SELECT price_cents FROM product_variants WHERE id = ?',
              [body.variant_id]
            );
            if (variant) {
              priceCents = variant.price_cents;
            }
          }

          // Add new item
          await executeRun(
            db,
            `INSERT INTO cart_items (customer_id, product_id, variant_id, quantity, price_cents, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
              user.id,
              body.product_id,
              body.variant_id || null,
              body.quantity,
              priceCents,
            ]
          );
        }

        return successResponse({ message: 'Item added to cart' });
      } catch (error) {
        const { message, status } = handleError(error);
        return errorResponse(message, status);
      }
    }

    // DELETE /api/cart/:productId/:variantId? - Remove item
    if (method === 'DELETE' && path.startsWith('/api/cart/')) {
      try {
        const user = await requireAuth(request, env, 'customer');
        const parts = path.split('/');
        const productId = parseInt(parts[3]);
        const variantId = parts[4] ? parseInt(parts[4]) : null;

        await executeRun(
          db,
          'DELETE FROM cart_items WHERE customer_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
          [user.id, productId, variantId, variantId]
        );

        return successResponse({ message: 'Item removed from cart' });
      } catch (error) {
        const { message, status } = handleError(error);
        return errorResponse(message, status);
      }
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}


import type { D1Database } from '@cloudflare/workers-types';
import { executeQuery, executeOne, executeRun } from '../utils/db';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface Cart {
  id: string;
  customer_id?: number | null;
  session_id?: string | null;
  email?: string | null;
  status: 'open' | 'abandoned' | 'recovered' | 'completed';
  total_cents: number;
  updated_at: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: number;
  product_name: string;
  variant_id?: number | null;
  quantity: number;
  price_cents: number;
  image_url?: string | null;
  sku?: string | null;
}

/**
 * Gera um UUID v4 simples
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Cria ou atualiza um carrinho
 */
export async function createOrUpdateCart(
  db: D1Database,
  data: {
    customer_id?: number | null;
    session_id?: string | null;
    email?: string | null;
  }
): Promise<Cart> {
  // Tentar encontrar carrinho existente
  let cart: Cart | null = null;

  if (data.customer_id) {
    cart = await executeOne<Cart>(
      db,
      `SELECT * FROM carts WHERE customer_id = ? AND status = 'open' ORDER BY updated_at DESC LIMIT 1`,
      [data.customer_id]
    );
  } else if (data.session_id) {
    cart = await executeOne<Cart>(
      db,
      `SELECT * FROM carts WHERE session_id = ? AND status = 'open' ORDER BY updated_at DESC LIMIT 1`,
      [data.session_id]
    );
  }

  if (cart) {
    // Atualizar timestamp
    await executeRun(
      db,
      `UPDATE carts SET updated_at = datetime('now') WHERE id = ?`,
      [cart.id]
    );
    cart.updated_at = new Date().toISOString();
    return cart;
  }

  // Criar novo carrinho
  const cartId = generateUUID();
  await executeRun(
    db,
    `INSERT INTO carts (id, customer_id, session_id, email, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'open', datetime('now'), datetime('now'))`,
    [cartId, data.customer_id || null, data.session_id || null, data.email || null]
  );

  const newCart = await executeOne<Cart>(
    db,
    'SELECT * FROM carts WHERE id = ?',
    [cartId]
  );

  if (!newCart) {
    throw new Error('Failed to create cart');
  }

  return newCart;
}

/**
 * Busca carrinho por ID
 */
export async function getCart(
  db: D1Database,
  cartId: string
): Promise<Cart | null> {
  return executeOne<Cart>(db, 'SELECT * FROM carts WHERE id = ?', [cartId]);
}

/**
 * Busca carrinho por customer_id ou session_id
 */
export async function getCartByUser(
  db: D1Database,
  customerId?: number | null,
  sessionId?: string | null
): Promise<Cart | null> {
  if (customerId) {
    return executeOne<Cart>(
      db,
      `SELECT * FROM carts WHERE customer_id = ? AND status = 'open' ORDER BY updated_at DESC LIMIT 1`,
      [customerId]
    );
  }
  if (sessionId) {
    return executeOne<Cart>(
      db,
      `SELECT * FROM carts WHERE session_id = ? AND status = 'open' ORDER BY updated_at DESC LIMIT 1`,
      [sessionId]
    );
  }
  return null;
}

/**
 * Adiciona item ao carrinho
 */
export async function addItemToCart(
  db: D1Database,
  cartId: string,
  data: {
    product_id: number;
    product_name: string;
    variant_id?: number | null;
    quantity: number;
    price_cents: number;
    image_url?: string | null;
    sku?: string | null;
  }
): Promise<CartItem> {
  // Verificar se item já existe
  const existing = await executeOne<CartItem>(
    db,
    `SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))`,
    [cartId, data.product_id, data.variant_id || null, data.variant_id || null]
  );

  if (existing) {
    // Atualizar quantidade
    await executeRun(
      db,
      `UPDATE cart_items SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?`,
      [data.quantity, existing.id]
    );
    return {
      ...existing,
      quantity: existing.quantity + data.quantity,
    };
  }

  // Adicionar novo item
  const itemId = generateUUID();
  await executeRun(
    db,
    `INSERT INTO cart_items (id, cart_id, product_id, product_name, variant_id, quantity, price_cents, image_url, sku, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      itemId,
      cartId,
      data.product_id,
      data.product_name,
      data.variant_id || null,
      data.quantity,
      data.price_cents,
      data.image_url || null,
      data.sku || null,
    ]
  );

  const item = await executeOne<CartItem>(
    db,
    'SELECT * FROM cart_items WHERE id = ?',
    [itemId]
  );

  if (!item) {
    throw new Error('Failed to create cart item');
  }

  // Atualizar total do carrinho
  await updateCartTotal(db, cartId);
  // Atualizar timestamp do carrinho
  await executeRun(
    db,
    `UPDATE carts SET updated_at = datetime('now') WHERE id = ?`,
    [cartId]
  );

  return item;
}

/**
 * Atualiza quantidade de um item
 */
export async function updateCartItemQuantity(
  db: D1Database,
  itemId: string,
  quantity: number
): Promise<void> {
  if (quantity <= 0) {
    await executeRun(db, 'DELETE FROM cart_items WHERE id = ?', [itemId]);
  } else {
    await executeRun(
      db,
      `UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?`,
      [quantity, itemId]
    );
  }

  // Buscar cart_id do item
  const item = await executeOne<{ cart_id: string }>(
    db,
    'SELECT cart_id FROM cart_items WHERE id = ?',
    [itemId]
  );

  if (item) {
    await updateCartTotal(db, item.cart_id);
    await executeRun(
      db,
      `UPDATE carts SET updated_at = datetime('now') WHERE id = ?`,
      [item.cart_id]
    );
  }
}

/**
 * Remove item do carrinho
 */
export async function removeCartItem(
  db: D1Database,
  itemId: string
): Promise<void> {
  const item = await executeOne<{ cart_id: string }>(
    db,
    'SELECT cart_id FROM cart_items WHERE id = ?',
    [itemId]
  );

  await executeRun(db, 'DELETE FROM cart_items WHERE id = ?', [itemId]);

  if (item) {
    await updateCartTotal(db, item.cart_id);
    await executeRun(
      db,
      `UPDATE carts SET updated_at = datetime('now') WHERE id = ?`,
      [item.cart_id]
    );
  }
}

/**
 * Atualiza total do carrinho
 */
async function updateCartTotal(db: D1Database, cartId: string): Promise<void> {
  const result = await executeOne<{ total: number }>(
    db,
    `SELECT SUM(quantity * price_cents) as total FROM cart_items WHERE cart_id = ?`,
    [cartId]
  );

  const total = result?.total || 0;
  await executeRun(
    db,
    `UPDATE carts SET total_cents = ? WHERE id = ?`,
    [total, cartId]
  );
}

/**
 * Busca itens do carrinho
 */
export async function getCartItems(
  db: D1Database,
  cartId: string
): Promise<CartItem[]> {
  const items = await executeQuery<CartItem>(
    db,
    `SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC`,
    [cartId]
  );
  return items || [];
}

/**
 * Marca carrinho como recuperado (após checkout)
 */
export async function markCartAsRecovered(
  db: D1Database,
  cartId: string
): Promise<void> {
  await executeRun(
    db,
    `UPDATE carts SET status = 'recovered', updated_at = datetime('now') WHERE id = ?`,
    [cartId]
  );
}

/**
 * Marca carrinho como completado
 */
export async function markCartAsCompleted(
  db: D1Database,
  cartId: string
): Promise<void> {
  await executeRun(
    db,
    `UPDATE carts SET status = 'completed', updated_at = datetime('now') WHERE id = ?`,
    [cartId]
  );
}

/**
 * Busca carrinhos abandonados (não atualizados há mais de 1 hora)
 */
export async function getAbandonedCarts(
  db: D1Database,
  hoursAgo: number = 1
): Promise<Cart[]> {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);
  const cutoffISO = cutoffTime.toISOString();

  const carts = await executeQuery<Cart>(
    db,
    `SELECT * FROM carts 
     WHERE status = 'open' 
     AND updated_at < ? 
     ORDER BY updated_at ASC`,
    [cutoffISO]
  );

  return carts || [];
}

/**
 * Marca carrinho como abandonado
 */
export async function markCartAsAbandoned(
  db: D1Database,
  cartId: string
): Promise<void> {
  await executeRun(
    db,
    `UPDATE carts SET status = 'abandoned', updated_at = datetime('now') WHERE id = ?`,
    [cartId]
  );
}

/**
 * Lista carrinhos abandonados para admin
 */
export async function listAbandonedCarts(
  db: D1Database,
  filters: {
    status?: 'open' | 'abandoned' | 'recovered' | 'completed';
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{ items: Cart[]; total: number }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let whereClause = '1=1';
  const params: any[] = [];

  if (filters.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  // Buscar carrinhos
  const carts = await executeQuery<Cart>(
    db,
    `SELECT * FROM carts WHERE ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  // Contar total
  const countResult = await executeOne<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM carts WHERE ${whereClause}`,
    params
  );

  return {
    items: carts || [],
    total: countResult?.count || 0,
  };
}

/**
 * Cria log de abandono
 */
export async function createAbandonmentLog(
  db: D1Database,
  cartId: string,
  email: string,
  recoveryLink: string
): Promise<string> {
  const logId = generateUUID();
  await executeRun(
    db,
    `INSERT INTO cart_abandonment_log (id, cart_id, email_address, recovery_link, email_sent, created_at)
     VALUES (?, ?, ?, ?, 0, datetime('now'))`,
    [logId, cartId, email, recoveryLink]
  );
  return logId;
}

/**
 * Marca email como enviado
 */
export async function markEmailAsSent(
  db: D1Database,
  logId: string
): Promise<void> {
  await executeRun(
    db,
    `UPDATE cart_abandonment_log SET email_sent = 1, email_sent_at = datetime('now') WHERE id = ?`,
    [logId]
  );
}


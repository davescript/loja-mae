import type { D1Database } from '@cloudflare/workers-types';
import { executeQuery, executeOne, executeRun } from '../utils/db';

export interface Favorite {
  id: number;
  customer_id: number;
  product_id: number;
  created_at: string;
}

/**
 * Adiciona um produto aos favoritos do cliente
 */
export async function addFavorite(
  db: D1Database,
  customerId: number,
  productId: number
): Promise<Favorite> {
  // Verificar se já existe
  const existing = await executeOne<Favorite>(
    db,
    `SELECT * FROM favorites WHERE customer_id = ? AND product_id = ?`,
    [customerId, productId]
  );

  if (existing) {
    return existing;
  }

  // Inserir novo favorito
  const result = await executeRun(
    db,
    `INSERT INTO favorites (customer_id, product_id) VALUES (?, ?)`,
    [customerId, productId]
  );

  const favorite = await executeOne<Favorite>(
    db,
    `SELECT * FROM favorites WHERE id = ?`,
    [result.meta.last_row_id]
  );

  if (!favorite) {
    throw new Error('Failed to create favorite');
  }

  return favorite;
}

/**
 * Remove um produto dos favoritos do cliente
 */
export async function removeFavorite(
  db: D1Database,
  customerId: number,
  productId: number
): Promise<boolean> {
  const result = await executeRun(
    db,
    `DELETE FROM favorites WHERE customer_id = ? AND product_id = ?`,
    [customerId, productId]
  );

  return result.meta.changes > 0;
}

/**
 * Lista todos os favoritos de um cliente
 */
export async function getCustomerFavorites(
  db: D1Database,
  customerId: number
): Promise<number[]> {
  const favorites = await executeQuery<Favorite>(
    db,
    `SELECT product_id FROM favorites WHERE customer_id = ? ORDER BY created_at DESC`,
    [customerId]
  );

  return favorites?.map((f) => f.product_id) || [];
}

/**
 * Verifica se um produto está nos favoritos do cliente
 */
export async function isFavorite(
  db: D1Database,
  customerId: number,
  productId: number
): Promise<boolean> {
  const favorite = await executeOne<Favorite>(
    db,
    `SELECT id FROM favorites WHERE customer_id = ? AND product_id = ?`,
    [customerId, productId]
  );

  return !!favorite;
}

/**
 * Lista todos os favoritos com detalhes do produto (para admin)
 */
export async function getAllFavoritesWithProducts(
  db: D1Database,
  limit: number = 100,
  offset: number = 0
): Promise<Array<Favorite & { customer_email?: string; product_title?: string }>> {
  const favorites = await executeQuery<Favorite & { customer_email?: string; product_title?: string }>(
    db,
    `SELECT 
      f.*,
      c.email as customer_email,
      p.title as product_title
    FROM favorites f
    LEFT JOIN customers c ON f.customer_id = c.id
    LEFT JOIN products p ON f.product_id = p.id
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return favorites || [];
}

/**
 * Conta total de favoritos
 */
export async function getFavoritesCount(db: D1Database): Promise<number> {
  const result = await executeOne<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM favorites`
  );

  return result?.count || 0;
}

/**
 * Conta favoritos por cliente
 */
export async function getFavoritesCountByCustomer(
  db: D1Database,
  customerId: number
): Promise<number> {
  const result = await executeOne<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM favorites WHERE customer_id = ?`,
    [customerId]
  );

  return result?.count || 0;
}

/**
 * Lista favoritos de um cliente com detalhes do produto
 */
export async function getCustomerFavoritesWithProducts(
  db: D1Database,
  customerId: number
): Promise<Array<{ product_id: number; product_title?: string; created_at: string }>> {
  const favorites = await executeQuery<{ product_id: number; product_title?: string; created_at: string }>(
    db,
    `SELECT 
      f.product_id,
      p.title as product_title,
      f.created_at
    FROM favorites f
    LEFT JOIN products p ON f.product_id = p.id
    WHERE f.customer_id = ?
    ORDER BY f.created_at DESC`,
    [customerId]
  );

  return favorites || [];
}


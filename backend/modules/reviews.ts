import type { D1Database } from '@cloudflare/workers-types';
import { executeQuery, executeOne, executeRun } from '../utils/db';
import { NotFoundError } from '../utils/errors';

export interface Review {
  id: number;
  product_id: number;
  customer_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  comment: string | null;
  verified_purchase: number;
  is_approved: number;
  is_featured: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export async function createReview(
  db: D1Database,
  data: {
    product_id: number;
    customer_id: number;
    order_id?: number | null;
    rating: number;
    title?: string;
    comment?: string;
    verified_purchase?: boolean;
  }
): Promise<Review> {
  const result = await executeRun(
    db,
    `INSERT INTO product_reviews (product_id, customer_id, order_id, rating, title, comment, verified_purchase)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.product_id,
      data.customer_id,
      data.order_id || null,
      data.rating,
      data.title || null,
      data.comment || null,
      data.verified_purchase ? 1 : 0,
    ]
  );

  const review = await executeOne<Review>(
    db,
    'SELECT * FROM product_reviews WHERE id = ?',
    [result.meta.last_row_id]
  );

  if (!review) {
    throw new Error('Failed to retrieve created review');
  }

  return review;
}

export async function getProductReviews(
  db: D1Database,
  productId: number,
  filters: { approved_only?: boolean; limit?: number; offset?: number } = {}
): Promise<Review[]> {
  const { approved_only = true, limit = 10, offset = 0 } = filters;

  let whereClause = 'WHERE product_id = ?';
  const params: any[] = [productId];

  if (approved_only) {
    whereClause += ' AND is_approved = 1';
  }

  const reviews = await executeQuery<Review>(
    db,
    `SELECT * FROM product_reviews ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return reviews || [];
}

export async function approveReview(db: D1Database, reviewId: number): Promise<void> {
  await executeRun(
    db,
    'UPDATE product_reviews SET is_approved = 1, updated_at = datetime("now") WHERE id = ?',
    [reviewId]
  );
}

export async function markReviewHelpful(
  db: D1Database,
  reviewId: number,
  customerId: number,
  isHelpful: boolean
): Promise<void> {
  // Inserir ou atualizar
  await executeRun(
    db,
    `INSERT INTO review_helpfulness (review_id, customer_id, is_helpful)
     VALUES (?, ?, ?)
     ON CONFLICT(review_id, customer_id) DO UPDATE SET is_helpful = ?`,
    [reviewId, customerId, isHelpful ? 1 : 0, isHelpful ? 1 : 0]
  );

  // Atualizar contador
  const count = await executeOne<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM review_helpfulness WHERE review_id = ? AND is_helpful = 1',
    [reviewId]
  );

  await executeRun(
    db,
    'UPDATE product_reviews SET helpful_count = ? WHERE id = ?',
    [count?.count || 0, reviewId]
  );
}

export async function getProductRatingStats(
  db: D1Database,
  productId: number
): Promise<{ averageRating: number; totalReviews: number; distribution: Record<number, number> }> {
  const stats = await executeOne<{ avg_rating: number; total: number }>(
    db,
    `SELECT AVG(rating) as avg_rating, COUNT(*) as total 
     FROM product_reviews 
     WHERE product_id = ? AND is_approved = 1`,
    [productId]
  );

  const distribution: Record<number, number> = {};
  for (let i = 1; i <= 5; i++) {
    const result = await executeOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM product_reviews WHERE product_id = ? AND rating = ? AND is_approved = 1',
      [productId, i]
    );
    distribution[i] = result?.count || 0;
  }

  return {
    averageRating: stats?.avg_rating || 0,
    totalReviews: stats?.total || 0,
    distribution,
  };
}


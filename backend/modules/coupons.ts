import type { D1Database } from '@cloudflare/workers-types';
import { executeQuery, executeOne, executeRun } from '../utils/db';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { Coupon } from '@shared/types';

export async function createCoupon(
  db: D1Database,
  data: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_purchase_cents?: number;
    max_discount_cents?: number | null;
    usage_limit?: number | null;
    customer_limit?: number;
    starts_at?: string | null;
    expires_at?: string | null;
    is_active?: number;
  }
): Promise<Coupon> {
  // Check if code exists
  const existing = await executeOne<{ id: number }>(
    db,
    'SELECT id FROM coupons WHERE code = ?',
    [data.code.toUpperCase()]
  );

  if (existing) {
    throw new ValidationError('Coupon code already exists');
  }

  // Validate value
  if (data.type === 'percentage' && (data.value < 1 || data.value > 100)) {
    throw new ValidationError('Percentage value must be between 1 and 100');
  }

  if (data.type === 'fixed' && data.value < 1) {
    throw new ValidationError('Fixed value must be greater than 0');
  }

  const result = await executeRun(
    db,
    `INSERT INTO coupons (
      code, type, value, min_purchase_cents, max_discount_cents,
      usage_limit, customer_limit, starts_at, expires_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.code.toUpperCase(),
      data.type,
      data.value,
      data.min_purchase_cents || 0,
      data.max_discount_cents || null,
      data.usage_limit || null,
      data.customer_limit || 1,
      data.starts_at || null,
      data.expires_at || null,
      data.is_active ?? 1,
    ]
  );

  if (!result.success) {
    throw new Error('Failed to create coupon');
  }

  const coupon = await executeOne<Coupon>(
    db,
    'SELECT * FROM coupons WHERE id = ?',
    [result.meta.last_row_id]
  );

  if (!coupon) {
    throw new Error('Failed to retrieve created coupon');
  }

  return coupon;
}

export async function getCoupon(
  db: D1Database,
  id: number
): Promise<Coupon | null> {
  return executeOne<Coupon>(
    db,
    'SELECT * FROM coupons WHERE id = ?',
    [id]
  );
}

export async function getCouponByCode(
  db: D1Database,
  code: string
): Promise<Coupon | null> {
  return executeOne<Coupon>(
    db,
    'SELECT * FROM coupons WHERE code = ?',
    [code.toUpperCase()]
  );
}

export async function validateCoupon(
  db: D1Database,
  code: string,
  totalCents: number,
  customerId?: number | null
): Promise<{ coupon: Coupon; discount_cents: number }> {
  const coupon = await getCouponByCode(db, code);
  if (!coupon) {
    throw new NotFoundError('Coupon not found');
  }

  if (coupon.is_active === 0) {
    throw new ValidationError('Coupon is not active');
  }

  // Check dates
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    throw new ValidationError('Coupon is not yet valid');
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    throw new ValidationError('Coupon has expired');
  }

  // Check minimum purchase
  if (totalCents < coupon.min_purchase_cents) {
    throw new ValidationError(`Minimum purchase of ${coupon.min_purchase_cents / 100} required`);
  }

  // Check usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    throw new ValidationError('Coupon usage limit reached');
  }

  // Check customer limit
  if (customerId) {
    const customerUsage = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM coupon_usage 
       WHERE coupon_id = ? AND customer_id = ?`,
      [coupon.id, customerId]
    );

    if (customerUsage && customerUsage.count >= coupon.customer_limit) {
      throw new ValidationError('Coupon usage limit reached for this customer');
    }
  }

  // Calculate discount
  let discountCents = 0;
  if (coupon.type === 'percentage') {
    discountCents = Math.floor((totalCents * coupon.value) / 100);
    if (coupon.max_discount_cents && discountCents > coupon.max_discount_cents) {
      discountCents = coupon.max_discount_cents;
    }
  } else {
    discountCents = coupon.value;
    if (discountCents > totalCents) {
      discountCents = totalCents;
    }
  }

  return { coupon, discount_cents: discountCents };
}

export async function applyCoupon(
  db: D1Database,
  couponId: number,
  orderId: number,
  customerId?: number | null
): Promise<void> {
  await executeRun(
    db,
    `INSERT INTO coupon_usage (coupon_id, customer_id, order_id)
     VALUES (?, ?, ?)`,
    [couponId, customerId || null, orderId]
  );

  await executeRun(
    db,
    'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
    [couponId]
  );
}

export async function listCoupons(
  db: D1Database,
  filters: {
    page?: number;
    pageSize?: number;
    is_active?: number;
    search?: string;
  } = {}
): Promise<{ items: Coupon[]; total: number }> {
  const { page = 1, pageSize = 20, is_active, search } = filters;

  let whereClause = '1=1';
  const params: any[] = [];

  if (is_active !== undefined) {
    whereClause += ' AND is_active = ?';
    params.push(is_active);
  }

  if (search) {
    whereClause += ' AND code LIKE ?';
    params.push(`%${search.toUpperCase()}%`);
  }

  const offset = (page - 1) * pageSize;

  const [items, totalResult] = await Promise.all([
    executeQuery<Coupon>(
      db,
      `SELECT * FROM coupons WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ),
    executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM coupons WHERE ${whereClause}`,
      params
    ),
  ]);

  return {
    items: items || [],
    total: totalResult?.count || 0,
  };
}

export async function updateCoupon(
  db: D1Database,
  id: number,
  data: Partial<{
    type: 'percentage' | 'fixed';
    value: number;
    min_purchase_cents: number;
    max_discount_cents: number | null;
    usage_limit: number | null;
    customer_limit: number;
    starts_at: string | null;
    expires_at: string | null;
    is_active: number;
  }>
): Promise<Coupon> {
  const coupon = await getCoupon(db, id);
  if (!coupon) {
    throw new NotFoundError('Coupon not found');
  }

  // Validate value if provided
  if (data.type !== undefined || data.value !== undefined) {
    const type = data.type || coupon.type;
    const value = data.value || coupon.value;

    if (type === 'percentage' && (value < 1 || value > 100)) {
      throw new ValidationError('Percentage value must be between 1 and 100');
    }

    if (type === 'fixed' && value < 1) {
      throw new ValidationError('Fixed value must be greater than 0');
    }
  }

  const updateFields: string[] = [];
  const updateValues: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  });

  if (updateFields.length === 0) {
    return coupon;
  }

  updateFields.push('updated_at = ?');
  updateValues.push(new Date().toISOString());
  updateValues.push(id);

  await executeRun(
    db,
    `UPDATE coupons SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const updated = await getCoupon(db, id);
  if (!updated) {
    throw new Error('Failed to retrieve updated coupon');
  }

  return updated;
}

export async function deleteCoupon(db: D1Database, id: number): Promise<void> {
  const coupon = await getCoupon(db, id);
  if (!coupon) {
    throw new NotFoundError('Coupon not found');
  }

  await executeRun(db, 'DELETE FROM coupons WHERE id = ?', [id]);
}


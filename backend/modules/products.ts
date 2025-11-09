import type { D1Database } from '@cloudflare/workers-types';
import { executeQuery, executeOne, executeRun, generateSlug } from '../utils/db';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { Product, ProductImage, ProductVariant } from '@shared/types';

export async function createProduct(
  db: D1Database,
  data: {
    title: string;
    description?: string | null;
    short_description?: string | null;
    price_cents: number;
    compare_at_price_cents?: number | null;
    sku?: string | null;
    barcode?: string | null;
    stock_quantity?: number;
    track_inventory?: number;
    weight_grams?: number | null;
    status?: string;
    featured?: number;
    category_id?: number | null;
    meta_title?: string | null;
    meta_description?: string | null;
  }
): Promise<Product> {
  // Generate slug
  const slug = generateSlug(data.title);
  
  // Check if slug exists
  const existing = await executeOne<{ id: number }>(
    db,
    'SELECT id FROM products WHERE slug = ?',
    [slug]
  );
  
  if (existing) {
    throw new ValidationError('Product with this title already exists');
  }

  // Insert product
  const result = await executeRun(
    db,
    `INSERT INTO products (
      title, slug, description, short_description, price_cents, compare_at_price_cents,
      sku, barcode, stock_quantity, track_inventory, weight_grams, status, featured,
      category_id, meta_title, meta_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      slug,
      data.description || null,
      data.short_description || null,
      data.price_cents,
      data.compare_at_price_cents || null,
      data.sku || null,
      data.barcode || null,
      data.stock_quantity || 0,
      data.track_inventory ?? 1,
      data.weight_grams || null,
      data.status || 'draft',
      data.featured || 0,
      data.category_id || null,
      data.meta_title || null,
      data.meta_description || null,
    ]
  );

  if (!result.success) {
    throw new Error('Failed to create product');
  }

  const product = await executeOne<Product>(
    db,
    'SELECT * FROM products WHERE id = ?',
    [result.meta.last_row_id]
  );

  if (!product) {
    throw new Error('Failed to retrieve created product');
  }

  return product;
}

export async function getProduct(
  db: D1Database,
  id: number,
  includeRelations: boolean = false
): Promise<Product | null> {
  const product = await executeOne<Product>(
    db,
    'SELECT * FROM products WHERE id = ?',
    [id]
  );

  if (!product) {
    return null;
  }

  if (includeRelations) {
    const [images, variants, category] = await Promise.all([
      executeQuery<ProductImage>(
        db,
        'SELECT * FROM product_images WHERE product_id = ? ORDER BY position ASC, id ASC',
        [id]
      ),
      executeQuery<ProductVariant>(
        db,
        'SELECT * FROM product_variants WHERE product_id = ? ORDER BY position ASC, id ASC',
        [id]
      ),
      product.category_id
        ? executeOne<any>(
            db,
            'SELECT * FROM categories WHERE id = ?',
            [product.category_id]
          )
        : null,
    ]);

    return {
      ...product,
      images: images || [],
      variants: variants || [],
      category: category || undefined,
    };
  }

  return product;
}

export async function getProductBySlug(
  db: D1Database,
  slug: string,
  includeRelations: boolean = false
): Promise<Product | null> {
  const product = await executeOne<Product>(
    db,
    'SELECT * FROM products WHERE slug = ?',
    [slug]
  );

  if (!product) {
    return null;
  }

  if (includeRelations) {
    return getProduct(db, product.id, true);
  }

  return product;
}

export async function listProducts(
  db: D1Database,
  filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    category_id?: number;
    status?: string;
    featured?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{ items: Product[]; total: number }> {
  const {
    page = 1,
    pageSize = 20,
    search,
    category_id,
    status,
    featured,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  let whereClause = '1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (title LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (category_id) {
    whereClause += ' AND category_id = ?';
    params.push(category_id);
  }

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (featured !== undefined) {
    whereClause += ' AND featured = ?';
    params.push(featured);
  }

  const offset = (page - 1) * pageSize;
  const orderBy = `${sortBy} ${sortOrder.toUpperCase()}`;

  const [items, totalResult] = await Promise.all([
    executeQuery<Product>(
      db,
      `SELECT * FROM products WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ),
    executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM products WHERE ${whereClause}`,
      params
    ),
  ]);

  return {
    items: items || [],
    total: totalResult?.count || 0,
  };
}

export async function updateProduct(
  db: D1Database,
  id: number,
  data: Partial<{
    title: string;
    description: string | null;
    short_description: string | null;
    price_cents: number;
    compare_at_price_cents: number | null;
    sku: string | null;
    barcode: string | null;
    stock_quantity: number;
    track_inventory: number;
    weight_grams: number | null;
    status: string;
    featured: number;
    category_id: number | null;
    meta_title: string | null;
    meta_description: string | null;
  }>
): Promise<Product> {
  const product = await getProduct(db, id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // If title changed, regenerate slug
  if (data.title && data.title !== product.title) {
    const newSlug = generateSlug(data.title);
    const existing = await executeOne<{ id: number }>(
      db,
      'SELECT id FROM products WHERE slug = ? AND id != ?',
      [newSlug, id]
    );

    if (existing) {
      throw new ValidationError('Product with this title already exists');
    }

    data = { ...data, slug: newSlug } as any;
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
    return product;
  }

  updateFields.push('updated_at = ?');
  updateValues.push(new Date().toISOString());
  updateValues.push(id);

  await executeRun(
    db,
    `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const updated = await getProduct(db, id);
  if (!updated) {
    throw new Error('Failed to retrieve updated product');
  }

  return updated;
}

export async function deleteProduct(db: D1Database, id: number): Promise<void> {
  const product = await getProduct(db, id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  await executeRun(db, 'DELETE FROM products WHERE id = ?', [id]);
}

export async function addProductImage(
  db: D1Database,
  productId: number,
  imageUrl: string,
  imageKey: string,
  altText?: string | null,
  position?: number,
  isPrimary?: number
): Promise<ProductImage> {
  const product = await getProduct(db, productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // If this is the first image, make it primary
  const existingImages = await executeQuery<ProductImage>(
    db,
    'SELECT * FROM product_images WHERE product_id = ?',
    [productId]
  );

  if (existingImages.length === 0) {
    isPrimary = 1;
  } else if (isPrimary === 1) {
    // Remove primary from other images
    await executeRun(
      db,
      'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
      [productId]
    );
  }

  const result = await executeRun(
    db,
    `INSERT INTO product_images (product_id, image_url, image_key, alt_text, position, is_primary)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      productId,
      imageUrl,
      imageKey,
      altText || null,
      position || existingImages.length,
      isPrimary || 0,
    ]
  );

  if (!result.success) {
    throw new Error('Failed to add product image');
  }

  const image = await executeOne<ProductImage>(
    db,
    'SELECT * FROM product_images WHERE id = ?',
    [result.meta.last_row_id]
  );

  if (!image) {
    throw new Error('Failed to retrieve created image');
  }

  return image;
}

export async function removeProductImage(
  db: D1Database,
  imageId: number
): Promise<void> {
  const image = await executeOne<ProductImage>(
    db,
    'SELECT * FROM product_images WHERE id = ?',
    [imageId]
  );

  if (!image) {
    throw new NotFoundError('Image not found');
  }

  await executeRun(db, 'DELETE FROM product_images WHERE id = ?', [imageId]);
}

export async function createProductVariant(
  db: D1Database,
  data: {
    product_id: number;
    title: string;
    price_cents: number;
    compare_at_price_cents?: number | null;
    sku?: string | null;
    barcode?: string | null;
    stock_quantity?: number;
    track_inventory?: number;
    weight_grams?: number | null;
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
    position?: number;
  }
): Promise<ProductVariant> {
  const product = await getProduct(db, data.product_id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const result = await executeRun(
    db,
    `INSERT INTO product_variants (
      product_id, title, price_cents, compare_at_price_cents, sku, barcode,
      stock_quantity, track_inventory, weight_grams, option1, option2, option3, position
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.product_id,
      data.title,
      data.price_cents,
      data.compare_at_price_cents || null,
      data.sku || null,
      data.barcode || null,
      data.stock_quantity || 0,
      data.track_inventory ?? 1,
      data.weight_grams || null,
      data.option1 || null,
      data.option2 || null,
      data.option3 || null,
      data.position || 0,
    ]
  );

  if (!result.success) {
    throw new Error('Failed to create product variant');
  }

  const variant = await executeOne<ProductVariant>(
    db,
    'SELECT * FROM product_variants WHERE id = ?',
    [result.meta.last_row_id]
  );

  if (!variant) {
    throw new Error('Failed to retrieve created variant');
  }

  return variant;
}

export async function updateProductVariant(
  db: D1Database,
  id: number,
  data: Partial<{
    title: string;
    price_cents: number;
    compare_at_price_cents: number | null;
    sku: string | null;
    barcode: string | null;
    stock_quantity: number;
    track_inventory: number;
    weight_grams: number | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    position: number;
  }>
): Promise<ProductVariant> {
  const variant = await executeOne<ProductVariant>(
    db,
    'SELECT * FROM product_variants WHERE id = ?',
    [id]
  );

  if (!variant) {
    throw new NotFoundError('Variant not found');
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
    return variant;
  }

  updateFields.push('updated_at = ?');
  updateValues.push(new Date().toISOString());
  updateValues.push(id);

  await executeRun(
    db,
    `UPDATE product_variants SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const updated = await executeOne<ProductVariant>(
    db,
    'SELECT * FROM product_variants WHERE id = ?',
    [id]
  );

  if (!updated) {
    throw new Error('Failed to retrieve updated variant');
  }

  return updated;
}

export async function deleteProductVariant(db: D1Database, id: number): Promise<void> {
  const variant = await executeOne<ProductVariant>(
    db,
    'SELECT * FROM product_variants WHERE id = ?',
    [id]
  );

  if (!variant) {
    throw new NotFoundError('Variant not found');
  }

  await executeRun(db, 'DELETE FROM product_variants WHERE id = ?', [id]);
}


import type { D1Database } from '@cloudflare/workers-types';
import { executeQuery, executeOne, executeRun, generateSlug } from '../utils/db';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { Category } from '@shared/types';

export async function createCategory(
  db: D1Database,
  data: {
    name: string;
    description?: string | null;
    parent_id?: number | null;
    image_url?: string | null;
    is_active?: number;
  }
): Promise<Category> {
  // Generate slug
  const slug = generateSlug(data.name);

  // Check if slug exists
  const existing = await executeOne<{ id: number }>(
    db,
    'SELECT id FROM categories WHERE slug = ?',
    [slug]
  );

  if (existing) {
    throw new ValidationError('Category with this name already exists');
  }

  // Validate parent_id if provided
  if (data.parent_id) {
    const parent = await executeOne<{ id: number }>(
      db,
      'SELECT id FROM categories WHERE id = ?',
      [data.parent_id]
    );

    if (!parent) {
      throw new NotFoundError('Parent category not found');
    }
  }

  const result = await executeRun(
    db,
    `INSERT INTO categories (name, slug, description, parent_id, image_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      slug,
      data.description || null,
      data.parent_id || null,
      data.image_url || null,
      data.is_active ?? 1,
    ]
  );

  if (!result.success) {
    throw new Error('Failed to create category');
  }

  const category = await executeOne<Category>(
    db,
    'SELECT * FROM categories WHERE id = ?',
    [result.meta.last_row_id]
  );

  if (!category) {
    throw new Error('Failed to retrieve created category');
  }

  return category;
}

export async function getCategory(
  db: D1Database,
  id: number,
  includeChildren: boolean = false
): Promise<Category | null> {
  const category = await executeOne<Category>(
    db,
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );

  if (!category) {
    return null;
  }

  if (includeChildren) {
    const children = await executeQuery<Category>(
      db,
      'SELECT * FROM categories WHERE parent_id = ? ORDER BY name ASC',
      [id]
    );
    return { ...category, children: children || [] };
  }

  return category;
}

export async function getCategoryBySlug(
  db: D1Database,
  slug: string
): Promise<Category | null> {
  return executeOne<Category>(
    db,
    'SELECT * FROM categories WHERE slug = ?',
    [slug]
  );
}

export async function listCategories(
  db: D1Database,
  filters: {
    parent_id?: number | null;
    is_active?: number;
  } = {}
): Promise<Category[]> {
  let whereClause = '1=1';
  const params: any[] = [];

  if (filters.parent_id !== undefined) {
    if (filters.parent_id === null) {
      whereClause += ' AND parent_id IS NULL';
    } else {
      whereClause += ' AND parent_id = ?';
      params.push(filters.parent_id);
    }
  }

  if (filters.is_active !== undefined) {
    whereClause += ' AND is_active = ?';
    params.push(filters.is_active);
  }

  const categories = await executeQuery<Category>(
    db,
    `SELECT * FROM categories WHERE ${whereClause} ORDER BY name ASC`,
    params
  );

  return categories || [];
}

export async function updateCategory(
  db: D1Database,
  id: number,
  data: Partial<{
    name: string;
    description: string | null;
    parent_id: number | null;
    image_url: string | null;
    is_active: number;
  }>
): Promise<Category> {
  const category = await getCategory(db, id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // If name changed, regenerate slug
  if (data.name && data.name !== category.name) {
    const newSlug = generateSlug(data.name);
    const existing = await executeOne<{ id: number }>(
      db,
      'SELECT id FROM categories WHERE slug = ? AND id != ?',
      [newSlug, id]
    );

    if (existing) {
      throw new ValidationError('Category with this name already exists');
    }

    data = { ...data, slug: newSlug } as any;
  }

  // Validate parent_id if provided
  if (data.parent_id !== undefined && data.parent_id !== null) {
    if (data.parent_id === id) {
      throw new ValidationError('Category cannot be its own parent');
    }

    const parent = await executeOne<{ id: number }>(
      db,
      'SELECT id FROM categories WHERE id = ?',
      [data.parent_id]
    );

    if (!parent) {
      throw new NotFoundError('Parent category not found');
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
    return category;
  }

  updateFields.push('updated_at = ?');
  updateValues.push(new Date().toISOString());
  updateValues.push(id);

  await executeRun(
    db,
    `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const updated = await getCategory(db, id);
  if (!updated) {
    throw new Error('Failed to retrieve updated category');
  }

  return updated;
}

export async function deleteCategory(db: D1Database, id: number): Promise<void> {
  const category = await getCategory(db, id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check if category has children
  const children = await executeQuery<Category>(
    db,
    'SELECT id FROM categories WHERE parent_id = ?',
    [id]
  );

  if (children && children.length > 0) {
    throw new ValidationError('Cannot delete category with children. Please delete or move children first.');
  }

  // Check if category has products
  const products = await executeQuery<{ id: number }>(
    db,
    'SELECT id FROM products WHERE category_id = ? LIMIT 1',
    [id]
  );

  if (products && products.length > 0) {
    throw new ValidationError('Cannot delete category with products. Please reassign products first.');
  }

  await executeRun(db, 'DELETE FROM categories WHERE id = ?', [id]);
}


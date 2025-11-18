import type { Env } from '../../types';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb, executeQuery, executeOne, executeRun } from '../../utils/db';
import { requireAdmin } from '../../utils/auth';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { z } from 'zod';

const collectionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['manual', 'automatic']).default('manual'),
  is_active: z.boolean().default(true),
});

const collectionRuleSchema = z.object({
  field: z.enum(['category', 'tag', 'price', 'stock', 'featured']),
  operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in']),
  value: z.string(),
});

const updateCollectionSchema = collectionSchema.partial();

// Helper para gerar slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper para aplicar regras automáticas
async function applyAutomaticRules(db: D1Database, collectionId: number) {
  const rules = await executeQuery(
    db,
    'SELECT * FROM collection_rules WHERE collection_id = ?',
    [collectionId]
  );

  if (!rules || rules.length === 0) {
    return;
  }

  // Limpar produtos atuais da coleção automática
  await executeRun(
    db,
    'DELETE FROM collection_products WHERE collection_id = ?',
    [collectionId]
  );

  // Construir query baseada nas regras
  let productQuery = 'SELECT DISTINCT p.id FROM products p WHERE p.is_active = 1';
  const params: any[] = [];

  for (const rule of rules) {
    if (rule.field === 'category') {
      if (rule.operator === 'equals') {
        productQuery += ' AND p.category_id = ?';
        params.push(parseInt(rule.value));
      } else if (rule.operator === 'in') {
        const ids = rule.value.split(',').map((id: string) => parseInt(id.trim()));
        productQuery += ` AND p.category_id IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      }
    } else if (rule.field === 'price') {
      if (rule.operator === 'greater_than') {
        productQuery += ' AND p.price_cents > ?';
        params.push(parseFloat(rule.value) * 100);
      } else if (rule.operator === 'less_than') {
        productQuery += ' AND p.price_cents < ?';
        params.push(parseFloat(rule.value) * 100);
      }
    } else if (rule.field === 'stock') {
      if (rule.operator === 'greater_than') {
        productQuery += ' AND p.stock_quantity > ?';
        params.push(parseInt(rule.value));
      } else if (rule.operator === 'less_than') {
        productQuery += ' AND p.stock_quantity < ?';
        params.push(parseInt(rule.value));
      }
    } else if (rule.field === 'featured') {
      if (rule.operator === 'equals') {
        productQuery += ' AND p.is_featured = ?';
        params.push(rule.value === 'true' ? 1 : 0);
      }
    }
  }

  const matchingProducts = await executeQuery<{ id: number }>(db, productQuery, params);

  if (matchingProducts && matchingProducts.length > 0) {
    for (let i = 0; i < matchingProducts.length; i++) {
      await executeRun(
        db,
        'INSERT INTO collection_products (collection_id, product_id, position) VALUES (?, ?, ?)',
        [collectionId, matchingProducts[i].id, i]
      );
    }
  }
}

export async function handleAdminCollectionsRoutes(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // GET /api/admin/collections - List collections
    if (method === 'GET' && path === '/api/admin/collections') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const search = url.searchParams.get('search') || '';

      let query = `
        SELECT 
          c.*,
          COUNT(DISTINCT cp.product_id) as product_count
        FROM collections c
        LEFT JOIN collection_products cp ON c.id = cp.collection_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        query += ' AND (c.name LIKE ? OR c.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      params.push(pageSize, (page - 1) * pageSize);

      const collections = await executeQuery(db, query, params);

      // Buscar regras para coleções automáticas
      for (const collection of collections || []) {
        if (collection.type === 'automatic') {
          const rules = await executeQuery(
            db,
            'SELECT * FROM collection_rules WHERE collection_id = ?',
            [collection.id]
          );
          collection.rules = rules || [];
        }
      }

      const totalResult = await executeOne<{ count: number }>(
        db,
        'SELECT COUNT(*) as count FROM collections WHERE 1=1' + (search ? ' AND (name LIKE ? OR description LIKE ?)' : ''),
        search ? [`%${search}%`, `%${search}%`] : []
      );

      return successResponse({
        items: collections || [],
        total: totalResult?.count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalResult?.count || 0) / pageSize),
      });
    }

    // GET /api/admin/collections/:id - Get collection
    if (method === 'GET' && path.match(/^\/api\/admin\/collections\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      const collection = await executeOne(db, 'SELECT * FROM collections WHERE id = ?', [id]);

      if (!collection) {
        return errorResponse('Coleção não encontrada', 404);
      }

      // Buscar produtos
      const products = await executeQuery(
        db,
        'SELECT p.* FROM products p INNER JOIN collection_products cp ON p.id = cp.product_id WHERE cp.collection_id = ? ORDER BY cp.position',
        [id]
      );
      collection.products = products || [];

      // Buscar regras se for automática
      if (collection.type === 'automatic') {
        const rules = await executeQuery(
          db,
          'SELECT * FROM collection_rules WHERE collection_id = ?',
          [id]
        );
        collection.rules = rules || [];
      }

      return successResponse(collection);
    }

    // POST /api/admin/collections - Create collection
    if (method === 'POST' && path === '/api/admin/collections') {
      const body = await request.json() as any;
      const validated = collectionSchema.parse(body);

      const slug = validated.slug || generateSlug(validated.name);

      // Verificar se slug já existe
      const existing = await executeOne(db, 'SELECT * FROM collections WHERE slug = ?', [slug]);
      if (existing) {
        return errorResponse('Slug já existe', 400);
      }

      const result = await executeRun(
        db,
        `INSERT INTO collections (name, slug, description, type, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          validated.name,
          slug,
          validated.description || null,
          validated.type,
          validated.is_active ? 1 : 0,
        ]
      );

      const collectionId = result.meta.last_row_id;

      // Se for automática e tiver regras, aplicar
      if (validated.type === 'automatic' && (body as any).rules && Array.isArray((body as any).rules)) {
        for (const rule of (body as any).rules) {
          const validatedRule = collectionRuleSchema.parse(rule);
          await executeRun(
            db,
            'INSERT INTO collection_rules (collection_id, field, operator, value, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
            [collectionId, validatedRule.field, validatedRule.operator, validatedRule.value]
          );
        }
        await applyAutomaticRules(db, collectionId);
      }

      // Se for manual e tiver produtos, adicionar
      if (validated.type === 'manual' && (body as any).product_ids && Array.isArray((body as any).product_ids)) {
        for (let i = 0; i < (body as any).product_ids.length; i++) {
          await executeRun(
            db,
            'INSERT INTO collection_products (collection_id, product_id, position) VALUES (?, ?, ?)',
            [collectionId, (body as any).product_ids[i], i]
          );
        }
      }

      const collection = await executeOne(db, 'SELECT * FROM collections WHERE id = ?', [collectionId]);
      return successResponse(collection, 'Coleção criada com sucesso');
    }

    // PUT /api/admin/collections/:id - Update collection
    if (method === 'PUT' && path.match(/^\/api\/admin\/collections\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      const body = await request.json() as any;
      const validated = updateCollectionSchema.parse(body);

      const existing = await executeOne(db, 'SELECT * FROM collections WHERE id = ?', [id]);
      if (!existing) {
        return errorResponse('Coleção não encontrada', 404);
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (validated.name !== undefined) {
        updates.push('name = ?');
        params.push(validated.name);
      }
      if (validated.slug !== undefined) {
        // Verificar se novo slug já existe
        const slugExists = await executeOne(db, 'SELECT * FROM collections WHERE slug = ? AND id != ?', [validated.slug, id]);
        if (slugExists) {
          return errorResponse('Slug já existe', 400);
        }
        updates.push('slug = ?');
        params.push(validated.slug);
      }
      if (validated.description !== undefined) {
        updates.push('description = ?');
        params.push(validated.description || null);
      }
      if (validated.type !== undefined) {
        updates.push('type = ?');
        params.push(validated.type);
      }
      if (validated.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(validated.is_active ? 1 : 0);
      }

      if (updates.length > 0) {
        updates.push('updated_at = datetime("now")');
        params.push(id);
        await executeRun(db, `UPDATE collections SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      // Atualizar regras se for automática
      if (validated.type === 'automatic' && body.rules !== undefined) {
        await executeRun(db, 'DELETE FROM collection_rules WHERE collection_id = ?', [id]);
        if (Array.isArray(body.rules)) {
          for (const rule of body.rules) {
            const validatedRule = collectionRuleSchema.parse(rule);
            await executeRun(
              db,
              'INSERT INTO collection_rules (collection_id, field, operator, value, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
              [id, validatedRule.field, validatedRule.operator, validatedRule.value]
            );
          }
        }
        await applyAutomaticRules(db, id);
      }

      // Atualizar produtos se for manual
      if (validated.type === 'manual' && body.product_ids !== undefined) {
        await executeRun(db, 'DELETE FROM collection_products WHERE collection_id = ?', [id]);
        if (Array.isArray(body.product_ids)) {
          for (let i = 0; i < body.product_ids.length; i++) {
            await executeRun(
              db,
              'INSERT INTO collection_products (collection_id, product_id, position) VALUES (?, ?, ?)',
              [id, body.product_ids[i], i]
            );
          }
        }
      }

      const collection = await executeOne(db, 'SELECT * FROM collections WHERE id = ?', [id]);
      return successResponse(collection, 'Coleção atualizada com sucesso');
    }

    // DELETE /api/admin/collections/:id - Delete collection
    if (method === 'DELETE' && path.match(/^\/api\/admin\/collections\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');

      const existing = await executeOne(db, 'SELECT * FROM collections WHERE id = ?', [id]);
      if (!existing) {
        return errorResponse('Coleção não encontrada', 404);
      }

      await executeRun(db, 'DELETE FROM collections WHERE id = ?', [id]);

      return successResponse({ id }, 'Coleção deletada com sucesso');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}


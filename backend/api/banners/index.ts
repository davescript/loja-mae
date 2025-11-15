import type { Env } from '../../types';
import { getDb, executeQuery, executeOne, executeRun } from '../../utils/db';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';
import { z } from 'zod';

const createBannerSchema = z.object({
  title: z.string().min(1),
  link_url: z.string().url().optional().nullable(),
  position: z.enum(['home_hero', 'home_top', 'home_bottom', 'category', 'product', 'sidebar']),
  order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

const updateBannerSchema = createBannerSchema.partial();

export async function handleBannersRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    const db = getDb(env);

    // List banners: GET /api/banners
    if (method === 'GET' && path === '/api/banners') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const position = url.searchParams.get('position');
      const isActive = url.searchParams.get('is_active');
      
      let whereClause = '1=1';
      const params: any[] = [];

      if (position) {
        whereClause += ' AND position = ?';
        params.push(position);
      }

      if (isActive !== null && isActive !== undefined && isActive !== '') {
        whereClause += ' AND is_active = ?';
        params.push(isActive === 'true' ? 1 : 0);
      }

      // Check date range
      const now = new Date().toISOString();
      whereClause += ' AND (start_date IS NULL OR start_date <= ?)';
      params.push(now);
      whereClause += ' AND (end_date IS NULL OR end_date >= ?)';
      params.push(now);

      const offset = (page - 1) * pageSize;

      console.log(`[BANNERS_API] Buscando banners: position=${position}, is_active=${isActive}, now=${now}`);
      console.log(`[BANNERS_API] SQL: SELECT * FROM banners WHERE ${whereClause} ORDER BY \`order\` ASC, created_at DESC LIMIT ? OFFSET ?`);
      console.log(`[BANNERS_API] Params:`, params);

      const [items, totalResult] = await Promise.all([
        executeQuery(
          db,
          `SELECT * FROM banners WHERE ${whereClause} ORDER BY \`order\` ASC, created_at DESC LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        ),
        executeOne<{ count: number }>(
          db,
          `SELECT COUNT(*) as count FROM banners WHERE ${whereClause}`,
          params
        ),
      ]);

      console.log(`[BANNERS_API] Encontrados ${items?.length || 0} banner(s) de ${totalResult?.count || 0} total`);
      if (items && items.length > 0) {
        console.log(`[BANNERS_API] Banners:`, items.map((b: any) => ({ id: b.id, title: b.title, position: b.position, is_active: b.is_active, start_date: b.start_date, end_date: b.end_date, image_url: b.image_url })));
      }

      return successResponse({
        items: items || [],
        total: totalResult?.count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalResult?.count || 0) / pageSize),
      });
    }

    // Get banner: GET /api/banners/:id
    if (method === 'GET' && path.match(/^\/api\/banners\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      const banner = await executeOne(db, 'SELECT * FROM banners WHERE id = ?', [id]);

      if (!banner) {
        return notFoundResponse('Banner not found');
      }

      return successResponse(banner);
    }

    // Create banner: POST /api/banners (Admin only)
    if (method === 'POST' && path === '/api/banners') {
      await requireAdmin(request, env);

      const contentType = request.headers.get('Content-Type') || '';
      
      if (contentType.includes('multipart/form-data')) {
        // FormData com imagem
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const linkUrl = formData.get('link_url') as string || null;
        const position = formData.get('position') as string;
        const order = parseInt(formData.get('order') as string || '0');
        const isActive = formData.get('is_active') === 'true';
        const startDate = formData.get('start_date') as string || null;
        const endDate = formData.get('end_date') as string || null;
        const imageFile = formData.get('image') as File;

        if (!title || !position) {
          return errorResponse('title and position are required', 400);
        }

        let imageUrl: string | null = null;

        // Upload de imagem para R2
        if (imageFile && imageFile.size > 0) {
          const r2 = env.R2;
          const key = `banners/${Date.now()}-${imageFile.name}`;
          
          await r2.put(key, imageFile.stream(), {
            httpMetadata: {
              contentType: imageFile.type,
            },
          });

          // URL pública do R2 - ajustar conforme configuração
          imageUrl = `/api/images/${key}`;
        }

        const result = await executeRun(
          db,
          `INSERT INTO banners (title, image_url, link_url, position, \`order\`, is_active, start_date, end_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [title, imageUrl, linkUrl, position, order, isActive ? 1 : 0, startDate, endDate]
        );

        const banner = await executeOne(
          db,
          'SELECT * FROM banners WHERE id = ?',
          [result.meta.last_row_id]
        );

        return successResponse(banner, 'Banner created successfully');
      } else {
        // JSON sem imagem
        const body = await request.json();
        const validated = createBannerSchema.parse(body);

        const result = await executeRun(
          db,
          `INSERT INTO banners (title, image_url, link_url, position, \`order\`, is_active, start_date, end_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            validated.title,
            null,
            validated.link_url || null,
            validated.position,
            validated.order || 0,
            validated.is_active ? 1 : 0,
            validated.start_date || null,
            validated.end_date || null,
          ]
        );

        const banner = await executeOne(
          db,
          'SELECT * FROM banners WHERE id = ?',
          [result.meta.last_row_id]
        );

        return successResponse(banner, 'Banner created successfully');
      }
    }

    // Update banner: PUT /api/banners/:id (Admin only)
    if (method === 'PUT' && path.match(/^\/api\/banners\/\d+$/)) {
      await requireAdmin(request, env);
      const id = parseInt(path.split('/').pop() || '0');

      const contentType = request.headers.get('Content-Type') || '';
      
      if (contentType.includes('multipart/form-data')) {
        // FormData com possível nova imagem
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const linkUrl = formData.get('link_url') as string || null;
        const position = formData.get('position') as string;
        const order = parseInt(formData.get('order') as string || '0');
        const isActive = formData.get('is_active') === 'true';
        const startDate = formData.get('start_date') as string || null;
        const endDate = formData.get('end_date') as string || null;
        const imageFile = formData.get('image') as File;

        // Buscar banner existente
        const existingBanner = await executeOne<{ image_url: string | null }>(
          db,
          'SELECT image_url FROM banners WHERE id = ?',
          [id]
        );

        if (!existingBanner) {
          return notFoundResponse('Banner not found');
        }

        let imageUrl = existingBanner.image_url;

        // Upload de nova imagem se fornecida
        if (imageFile && imageFile.size > 0) {
          const r2 = env.R2;
          const key = `banners/${Date.now()}-${imageFile.name}`;
          
          await r2.put(key, imageFile.stream(), {
            httpMetadata: {
              contentType: imageFile.type,
            },
          });

          // URL pública do R2 - ajustar conforme configuração
          imageUrl = `/api/images/${key}`;

          // Deletar imagem antiga do R2 se existir
          if (existingBanner.image_url) {
            try {
              const oldKey = existingBanner.image_url.split('/').slice(-2).join('/');
              await r2.delete(oldKey);
            } catch (err) {
              console.error('Error deleting old banner image:', err);
            }
          }
        }

        await executeRun(
          db,
          `UPDATE banners 
           SET title = ?, image_url = ?, link_url = ?, position = ?, \`order\` = ?, is_active = ?, start_date = ?, end_date = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [title, imageUrl, linkUrl, position, order, isActive ? 1 : 0, startDate, endDate, id]
        );

        const banner = await executeOne(db, 'SELECT * FROM banners WHERE id = ?', [id]);
        return successResponse(banner, 'Banner updated successfully');
      } else {
        // JSON sem imagem
        const body = await request.json();
        const validated = updateBannerSchema.parse(body);

        const updateFields: string[] = [];
        const updateValues: any[] = [];

        if (validated.title !== undefined) {
          updateFields.push('title = ?');
          updateValues.push(validated.title);
        }
        if (validated.link_url !== undefined) {
          updateFields.push('link_url = ?');
          updateValues.push(validated.link_url);
        }
        if (validated.position !== undefined) {
          updateFields.push('position = ?');
          updateValues.push(validated.position);
        }
        if (validated.order !== undefined) {
          updateFields.push('`order` = ?');
          updateValues.push(validated.order);
        }
        if (validated.is_active !== undefined) {
          updateFields.push('is_active = ?');
          updateValues.push(validated.is_active ? 1 : 0);
        }
        if (validated.start_date !== undefined) {
          updateFields.push('start_date = ?');
          updateValues.push(validated.start_date);
        }
        if (validated.end_date !== undefined) {
          updateFields.push('end_date = ?');
          updateValues.push(validated.end_date);
        }

        if (updateFields.length === 0) {
          return errorResponse('No fields to update', 400);
        }

        updateFields.push('updated_at = datetime("now")');
        updateValues.push(id);

        await executeRun(
          db,
          `UPDATE banners SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );

        const banner = await executeOne(db, 'SELECT * FROM banners WHERE id = ?', [id]);
        return successResponse(banner, 'Banner updated successfully');
      }
    }

    // Delete banner: DELETE /api/banners/:id (Admin only)
    if (method === 'DELETE' && path.match(/^\/api\/banners\/\d+$/)) {
      await requireAdmin(request, env);
      const id = parseInt(path.split('/').pop() || '0');

      // Buscar banner para deletar imagem do R2
      const banner = await executeOne<{ image_url: string | null }>(
        db,
        'SELECT image_url FROM banners WHERE id = ?',
        [id]
      );

      if (!banner) {
        return notFoundResponse('Banner not found');
      }

      // Deletar imagem do R2 se existir
      if (banner.image_url) {
        try {
          const r2 = env.R2;
          const key = banner.image_url.split('/').slice(-2).join('/');
          await r2.delete(key);
        } catch (err) {
          console.error('Error deleting banner image from R2:', err);
        }
      }

      await executeRun(db, 'DELETE FROM banners WHERE id = ?', [id]);

      return successResponse(null, 'Banner deleted successfully');
    }

    // Record click: POST /api/banners/:id/click
    if (method === 'POST' && path.match(/^\/api\/banners\/\d+\/click$/)) {
      const id = parseInt(path.split('/')[3] || '0');

      await executeRun(
        db,
        'UPDATE banners SET clicks = COALESCE(clicks, 0) + 1 WHERE id = ?',
        [id]
      );

      return successResponse({ success: true });
    }

    // Record impression: POST /api/banners/:id/impression
    if (method === 'POST' && path.match(/^\/api\/banners\/\d+\/impression$/)) {
      const id = parseInt(path.split('/')[3] || '0');

      await executeRun(
        db,
        'UPDATE banners SET impressions = COALESCE(impressions, 0) + 1 WHERE id = ?',
        [id]
      );

      return successResponse({ success: true });
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}


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
  media_type: z.enum(['image', 'video']).default('image'),
  video_url: z.string().url().optional().nullable(),
  video_poster_url: z.string().url().optional().nullable(),
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
        // FormData com imagem ou vídeo
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const linkUrl = formData.get('link_url') as string || null;
        const position = formData.get('position') as string;
        const order = parseInt(formData.get('order') as string || '0');
        const isActive = formData.get('is_active') === 'true';
        const startDate = formData.get('start_date') as string || null;
        const endDate = formData.get('end_date') as string || null;
        const mediaType = (formData.get('media_type') as string) || 'image';
        const imageFile = formData.get('image') as File;
        const videoFile = formData.get('video') as File;
        const videoPosterFile = formData.get('video_poster') as File;
        const videoUrl = formData.get('video_url') as string || null; // URL externa de vídeo

        if (!title || !position) {
          return errorResponse('title and position are required', 400);
        }

        const r2 = env.R2;
        let imageUrl: string | null = null;
        let videoUrlFinal: string | null = null;
        let videoPosterUrl: string | null = null;

        if (mediaType === 'video') {
          // Upload de vídeo para R2 ou usar URL externa
          if (videoUrl) {
            // URL externa (YouTube, Vimeo, etc.)
            videoUrlFinal = videoUrl;
          } else if (videoFile && videoFile.size > 0) {
            // Upload de vídeo para R2
            const key = `banners/videos/${Date.now()}-${videoFile.name}`;
            await r2.put(key, videoFile.stream(), {
              httpMetadata: {
                contentType: videoFile.type || 'video/mp4',
              },
            });
            videoUrlFinal = `/api/images/${key}`;
          }

          // Upload de imagem de capa (poster) para o vídeo
          if (videoPosterFile && videoPosterFile.size > 0) {
            const key = `banners/posters/${Date.now()}-${videoPosterFile.name}`;
            await r2.put(key, videoPosterFile.stream(), {
              httpMetadata: {
                contentType: videoPosterFile.type,
              },
            });
            videoPosterUrl = `/api/images/${key}`;
          }
        } else {
          // Upload de imagem para R2
          if (imageFile && imageFile.size > 0) {
            const key = `banners/${Date.now()}-${imageFile.name}`;
            await r2.put(key, imageFile.stream(), {
              httpMetadata: {
                contentType: imageFile.type,
              },
            });
            imageUrl = `/api/images/${key}`;
          }
        }

        const result = await executeRun(
          db,
          `INSERT INTO banners (title, image_url, link_url, position, \`order\`, is_active, start_date, end_date, media_type, video_url, video_poster_url, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [title, imageUrl, linkUrl, position, order, isActive ? 1 : 0, startDate, endDate, mediaType, videoUrlFinal, videoPosterUrl]
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
          `INSERT INTO banners (title, image_url, link_url, position, \`order\`, is_active, start_date, end_date, media_type, video_url, video_poster_url, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            validated.title,
            null,
            validated.link_url || null,
            validated.position,
            validated.order || 0,
            validated.is_active ? 1 : 0,
            validated.start_date || null,
            validated.end_date || null,
            validated.media_type || 'image',
            validated.video_url || null,
            validated.video_poster_url || null,
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
        // FormData com possível nova imagem ou vídeo
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const linkUrl = formData.get('link_url') as string || null;
        const position = formData.get('position') as string;
        const order = parseInt(formData.get('order') as string || '0');
        const isActive = formData.get('is_active') === 'true';
        const startDate = formData.get('start_date') as string || null;
        const endDate = formData.get('end_date') as string || null;
        const mediaType = (formData.get('media_type') as string) || 'image';
        const imageFile = formData.get('image') as File;
        const videoFile = formData.get('video') as File;
        const videoPosterFile = formData.get('video_poster') as File;
        const videoUrl = formData.get('video_url') as string || null;

        // Buscar banner existente
        const existingBanner = await executeOne<{ 
          image_url: string | null;
          video_url: string | null;
          video_poster_url: string | null;
        }>(
          db,
          'SELECT image_url, video_url, video_poster_url FROM banners WHERE id = ?',
          [id]
        );

        if (!existingBanner) {
          return notFoundResponse('Banner not found');
        }

        const r2 = env.R2;
        let imageUrl = existingBanner.image_url;
        let videoUrlFinal = existingBanner.video_url;
        let videoPosterUrl = existingBanner.video_poster_url;

        if (mediaType === 'video') {
          // Processar vídeo
          if (videoUrl) {
            // URL externa
            videoUrlFinal = videoUrl;
          } else if (videoFile && videoFile.size > 0) {
            // Upload de novo vídeo
            const key = `banners/videos/${Date.now()}-${videoFile.name}`;
            await r2.put(key, videoFile.stream(), {
              httpMetadata: {
                contentType: videoFile.type || 'video/mp4',
              },
            });
            videoUrlFinal = `/api/images/${key}`;

            // Deletar vídeo antigo se existir
            if (existingBanner.video_url && !existingBanner.video_url.startsWith('http')) {
              try {
                const oldKey = existingBanner.video_url.split('/').slice(-2).join('/');
                await r2.delete(oldKey);
              } catch (err) {
                console.error('Error deleting old banner video:', err);
              }
            }
          }

          // Processar poster do vídeo
          if (videoPosterFile && videoPosterFile.size > 0) {
            const key = `banners/posters/${Date.now()}-${videoPosterFile.name}`;
            await r2.put(key, videoPosterFile.stream(), {
              httpMetadata: {
                contentType: videoPosterFile.type,
              },
            });
            videoPosterUrl = `/api/images/${key}`;

            // Deletar poster antigo se existir
            if (existingBanner.video_poster_url) {
              try {
                const oldKey = existingBanner.video_poster_url.split('/').slice(-2).join('/');
                await r2.delete(oldKey);
              } catch (err) {
                console.error('Error deleting old banner poster:', err);
              }
            }
          }
        } else {
          // Upload de nova imagem se fornecida
          if (imageFile && imageFile.size > 0) {
            const key = `banners/${Date.now()}-${imageFile.name}`;
            await r2.put(key, imageFile.stream(), {
              httpMetadata: {
                contentType: imageFile.type,
              },
            });
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
        }

        await executeRun(
          db,
          `UPDATE banners 
           SET title = ?, image_url = ?, link_url = ?, position = ?, \`order\` = ?, is_active = ?, start_date = ?, end_date = ?, media_type = ?, video_url = ?, video_poster_url = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [title, imageUrl, linkUrl, position, order, isActive ? 1 : 0, startDate, endDate, mediaType, videoUrlFinal, videoPosterUrl, id]
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
        if (validated.media_type !== undefined) {
          updateFields.push('media_type = ?');
          updateValues.push(validated.media_type);
        }
        if (validated.video_url !== undefined) {
          updateFields.push('video_url = ?');
          updateValues.push(validated.video_url);
        }
        if (validated.video_poster_url !== undefined) {
          updateFields.push('video_poster_url = ?');
          updateValues.push(validated.video_poster_url);
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

      // Buscar banner para deletar mídia do R2
      const banner = await executeOne<{ 
        image_url: string | null;
        video_url: string | null;
        video_poster_url: string | null;
      }>(
        db,
        'SELECT image_url, video_url, video_poster_url FROM banners WHERE id = ?',
        [id]
      );

      if (!banner) {
        return notFoundResponse('Banner not found');
      }

      // Deletar mídia do R2 se existir
      const r2 = env.R2;
      try {
        if (banner.image_url && !banner.image_url.startsWith('http')) {
          const key = banner.image_url.split('/').slice(-2).join('/');
          await r2.delete(key);
        }
        if (banner.video_url && !banner.video_url.startsWith('http')) {
          const key = banner.video_url.split('/').slice(-2).join('/');
          await r2.delete(key);
        }
        if (banner.video_poster_url) {
          const key = banner.video_poster_url.split('/').slice(-2).join('/');
          await r2.delete(key);
        }
      } catch (err) {
        console.error('Error deleting banner media from R2:', err);
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


import type { Env } from '../../types';
import { getDb, executeQuery, executeOne, executeRun } from '../../utils/db';
import { requireAdmin } from '../../utils/auth';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { z } from 'zod';

const campaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['discount', 'banner', 'email', 'social']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']).default('draft'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().optional(),
  spent: z.number().default(0),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  conversions: z.number().default(0),
  content: z.string().optional(),
});

const updateCampaignSchema = campaignSchema.partial();

export async function handleCampaignsRoutes(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // GET /api/admin/campaigns - List campaigns
    if (method === 'GET' && path === '/api/admin/campaigns') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const search = url.searchParams.get('search') || '';
      const status = url.searchParams.get('status') || '';

      let query = 'SELECT * FROM campaigns WHERE 1=1';
      const params: any[] = [];

      if (search) {
        query += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(pageSize, (page - 1) * pageSize);

      const campaigns = await executeQuery(db, query, params);
      const totalResult = await executeOne<{ count: number }>(
        db,
        'SELECT COUNT(*) as count FROM campaigns WHERE 1=1' + (search ? ' AND (name LIKE ? OR description LIKE ?)' : '') + (status ? ' AND status = ?' : ''),
        search ? [`%${search}%`, `%${search}%`] : status ? [status] : []
      );

      return successResponse({
        items: campaigns || [],
        total: totalResult?.count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalResult?.count || 0) / pageSize),
      });
    }

    // GET /api/admin/campaigns/:id - Get campaign
    if (method === 'GET' && path.match(/^\/api\/admin\/campaigns\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      const campaign = await executeOne(db, 'SELECT * FROM campaigns WHERE id = ?', [id]);

      if (!campaign) {
        return errorResponse('Campanha não encontrada', 404);
      }

      return successResponse(campaign);
    }

    // POST /api/admin/campaigns - Create campaign
    if (method === 'POST' && path === '/api/admin/campaigns') {
      const body = await request.json();
      const validated = campaignSchema.parse(body);

      const result = await executeRun(
        db,
        `INSERT INTO campaigns (
          name, description, type, status, start_date, end_date,
          budget, spent, impressions, clicks, conversions, content,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          validated.name,
          validated.description || null,
          validated.type,
          validated.status,
          validated.start_date || null,
          validated.end_date || null,
          validated.budget || null,
          validated.spent || 0,
          validated.impressions || 0,
          validated.clicks || 0,
          validated.conversions || 0,
          validated.content || null,
        ]
      );

      const campaign = await executeOne(db, 'SELECT * FROM campaigns WHERE id = ?', [result.meta.last_row_id]);

      return successResponse(campaign, 'Campanha criada com sucesso');
    }

    // PUT /api/admin/campaigns/:id - Update campaign
    if (method === 'PUT' && path.match(/^\/api\/admin\/campaigns\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      const body = await request.json();
      const validated = updateCampaignSchema.parse(body);

      const existing = await executeOne(db, 'SELECT * FROM campaigns WHERE id = ?', [id]);
      if (!existing) {
        return errorResponse('Campanha não encontrada', 404);
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (validated.name !== undefined) {
        updates.push('name = ?');
        params.push(validated.name);
      }
      if (validated.description !== undefined) {
        updates.push('description = ?');
        params.push(validated.description || null);
      }
      if (validated.type !== undefined) {
        updates.push('type = ?');
        params.push(validated.type);
      }
      if (validated.status !== undefined) {
        updates.push('status = ?');
        params.push(validated.status);
      }
      if (validated.start_date !== undefined) {
        updates.push('start_date = ?');
        params.push(validated.start_date || null);
      }
      if (validated.end_date !== undefined) {
        updates.push('end_date = ?');
        params.push(validated.end_date || null);
      }
      if (validated.budget !== undefined) {
        updates.push('budget = ?');
        params.push(validated.budget || null);
      }
      if (validated.spent !== undefined) {
        updates.push('spent = ?');
        params.push(validated.spent);
      }
      if (validated.impressions !== undefined) {
        updates.push('impressions = ?');
        params.push(validated.impressions);
      }
      if (validated.clicks !== undefined) {
        updates.push('clicks = ?');
        params.push(validated.clicks);
      }
      if (validated.conversions !== undefined) {
        updates.push('conversions = ?');
        params.push(validated.conversions);
      }
      if (validated.content !== undefined) {
        updates.push('content = ?');
        params.push(validated.content || null);
      }

      if (updates.length === 0) {
        return errorResponse('Nenhum campo para atualizar', 400);
      }

      updates.push('updated_at = datetime("now")');
      params.push(id);

      await executeRun(
        db,
        `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      const campaign = await executeOne(db, 'SELECT * FROM campaigns WHERE id = ?', [id]);

      return successResponse(campaign, 'Campanha atualizada com sucesso');
    }

    // DELETE /api/admin/campaigns/:id - Delete campaign
    if (method === 'DELETE' && path.match(/^\/api\/admin\/campaigns\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');

      const existing = await executeOne(db, 'SELECT * FROM campaigns WHERE id = ?', [id]);
      if (!existing) {
        return errorResponse('Campanha não encontrada', 404);
      }

      await executeRun(db, 'DELETE FROM campaigns WHERE id = ?', [id]);

      return successResponse({ id }, 'Campanha deletada com sucesso');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}


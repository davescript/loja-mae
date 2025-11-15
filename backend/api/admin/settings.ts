import type { Env } from '../../types';
import { getDb, executeOne, executeRun } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';
import { z } from 'zod';

// Schema for updating general settings
const updateSettingsSchema = z.object({
  store_name: z.string().min(1).optional(),
  store_currency: z.string().length(3).optional(), // e.g., "EUR", "USD"
  stripe_public_key: z.string().optional(),
  stripe_secret_key: z.string().optional(), // Should be handled securely, not directly via API
  // Add other settings as needed
});

export async function handleSettingsRoutes(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env); // Ensure only admins can access settings
    const url = new URL(request.url);
    const method = request.method;

    // GET /api/admin/settings - Get all settings
    if (method === 'GET' && url.pathname === '/api/admin/settings') {
      const db = getDb(env);
      const settings = await executeOne<{
        store_name: string;
        store_currency: string;
        stripe_public_key: string;
      }>(db, `SELECT store_name, store_currency, stripe_public_key FROM settings WHERE id = 1`); // Assuming a single settings row
      
      if (!settings) {
        return errorResponse('Settings not found', 404);
      }
      return successResponse(settings);
    }

    // PUT /api/admin/settings - Update settings
    if (method === 'PUT' && url.pathname === '/api/admin/settings') {
      const body = await request.json();
      const validated = updateSettingsSchema.parse(body);
      const db = getDb(env);

      // Construct update query dynamically
      const updates: string[] = [];
      const params: (string | number)[] = [];

      if (validated.store_name !== undefined) {
        updates.push('store_name = ?');
        params.push(validated.store_name);
      }
      if (validated.store_currency !== undefined) {
        updates.push('store_currency = ?');
        params.push(validated.store_currency);
      }
      if (validated.stripe_public_key !== undefined) {
        updates.push('stripe_public_key = ?');
        params.push(validated.stripe_public_key);
      }
      // Note: stripe_secret_key should ideally be managed via environment variables or a more secure method,
      // not directly updated via a public API endpoint. For this task, we'll include it for completeness
      // but emphasize security best practices.
      if (validated.stripe_secret_key !== undefined) {
        updates.push('stripe_secret_key = ?');
        params.push(validated.stripe_secret_key);
      }

      if (updates.length === 0) {
        return errorResponse('No valid fields to update', 400);
      }

      const updateQuery = `UPDATE settings SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = 1`;
      await executeRun(db, updateQuery, params);

      return successResponse(null, 'Settings updated successfully');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

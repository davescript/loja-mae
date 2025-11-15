import type { Env } from '../../types';
import { getDb, executeOne, executeRun, executeQuery } from '../../utils/db';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin, hashPassword, comparePassword } from '../../utils/auth';
import { z } from 'zod';

// Schema for creating a new admin user
const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
  role: z.enum(['super_admin', 'admin', 'editor']).default('editor'),
  is_active: z.number().int().min(0).max(1).default(1),
});

// Schema for updating an existing admin user
const updateAdminSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['super_admin', 'admin', 'editor']).optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

export async function handleAdminUsersRoutes(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env, ['super_admin']); // Only super_admin can manage other admins
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // List admin users: GET /api/admin/users
    if (method === 'GET' && path === '/api/admin/users') {
      const db = getDb(env);
      const admins = await executeQuery<{
        id: number;
        email: string;
        name: string;
        role: string;
        is_active: number;
        created_at: string;
      }>(db, `SELECT id, email, name, role, is_active, created_at FROM admins`);
      return successResponse({ items: admins });
    }

    // Get single admin user: GET /api/admin/users/:id
    if (method === 'GET' && path.match(/^\/api\/admin\/users\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);
      const admin = await executeOne<{
        id: number;
        email: string;
        name: string;
        role: string;
        is_active: number;
        created_at: string;
      }>(db, `SELECT id, email, name, role, is_active, created_at FROM admins WHERE id = ?`, [id]);
      if (!admin) {
        return notFoundResponse('Admin user not found');
      }
      return successResponse(admin);
    }

    // Create admin user: POST /api/admin/users
    if (method === 'POST' && path === '/api/admin/users') {
      const body = await request.json();
      const validated = createAdminSchema.parse(body);
      const db = getDb(env);

      const existingAdmin = await executeOne<{ id: number }>(db, 'SELECT id FROM admins WHERE email = ?', [validated.email.toLowerCase()]);
      if (existingAdmin) {
        return errorResponse('Admin with this email already exists', 409);
      }

      const passwordHash = await hashPassword(validated.password);
      const result = await executeRun(
        db,
        'INSERT INTO admins (email, password_hash, name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
        [validated.email.toLowerCase(), passwordHash, validated.name || null, validated.role, validated.is_active]
      );
      const newAdmin = await executeOne<{
        id: number;
        email: string;
        name: string;
        role: string;
        is_active: number;
      }>(db, `SELECT id, email, name, role, is_active FROM admins WHERE id = ?`, [result.meta.last_row_id]);
      return successResponse(newAdmin, 'Admin user created successfully');
    }

    // Update admin user: PUT /api/admin/users/:id
    if (method === 'PUT' && path.match(/^\/api\/admin\/users\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      const body = await request.json();
      const validated = updateAdminSchema.parse(body);
      const db = getDb(env);

      const currentAdmin = await executeOne<{ id: number; password_hash: string | null }>(db, 'SELECT id, password_hash FROM admins WHERE id = ?', [id]);
      if (!currentAdmin) {
        return notFoundResponse('Admin user not found');
      }

      const updates: string[] = [];
      const params: (string | number)[] = [];

      if (validated.email !== undefined) {
        updates.push('email = ?');
        params.push(validated.email.toLowerCase());
      }
      if (validated.password !== undefined) {
        const newPasswordHash = await hashPassword(validated.password);
        updates.push('password_hash = ?');
        params.push(newPasswordHash);
      }
      if (validated.name !== undefined) {
        updates.push('name = ?');
        params.push(validated.name);
      }
      if (validated.role !== undefined) {
        updates.push('role = ?');
        params.push(validated.role);
      }
      if (validated.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(validated.is_active);
      }

      if (updates.length === 0) {
        return errorResponse('No valid fields to update', 400);
      }

      const updateQuery = `UPDATE admins SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
      params.push(id);
      await executeRun(db, updateQuery, params);

      const updatedAdmin = await executeOne<{
        id: number;
        email: string;
        name: string;
        role: string;
        is_active: number;
      }>(db, `SELECT id, email, name, role, is_active FROM admins WHERE id = ?`, [id]);
      return successResponse(updatedAdmin, 'Admin user updated successfully');
    }

    // Delete admin user: DELETE /api/admin/users/:id
    if (method === 'DELETE' && path.match(/^\/api\/admin\/users\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);

      // Prevent super_admin from deleting themselves or the last super_admin
      const authUser = await requireAdmin(request, env, ['super_admin']);
      if (authUser.id === id) {
        return errorResponse('Cannot delete your own admin account', 403);
      }
      const superAdminsCount = await executeOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM admins WHERE role = 'super_admin'`);
      const targetAdmin = await executeOne<{ role: string }>(db, `SELECT role FROM admins WHERE id = ?`, [id]);
      if (targetAdmin?.role === 'super_admin' && (superAdminsCount?.count || 0) <= 1) {
        return errorResponse('Cannot delete the last super admin account', 403);
      }

      await executeRun(db, `DELETE FROM admins WHERE id = ?`, [id]);
      return successResponse(null, 'Admin user deleted successfully');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

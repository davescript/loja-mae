import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';
import {
  createCategory,
  getCategory,
  getCategoryBySlug,
  listCategories,
  updateCategory,
  deleteCategory,
} from '../../modules/categories';
import { createCategorySchema, updateCategorySchema, listCategoriesSchema } from '../../validators/categories';

export async function handleCategoriesRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // List categories: GET /api/categories
    if (method === 'GET' && path === '/api/categories') {
      const params = Object.fromEntries(url.searchParams.entries());
      const validated = listCategoriesSchema.parse(params);
      const db = getDb(env);
      const categories = await listCategories(db, validated);
      return successResponse(categories);
    }

    // Get category: GET /api/categories/:id
    if (method === 'GET' && path.match(/^\/api\/categories\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);
      const category = await getCategory(db, id, true);
      if (!category) {
        return notFoundResponse('Category not found');
      }
      return successResponse(category);
    }

    // Get category by slug: GET /api/categories/slug/:slug
    if (method === 'GET' && path.match(/^\/api\/categories\/slug\/[^/]+$/)) {
      const slug = path.split('/').pop() || '';
      const db = getDb(env);
      const category = await getCategoryBySlug(db, slug);
      if (!category) {
        return notFoundResponse('Category not found');
      }
      return successResponse(category);
    }

    // Create category: POST /api/categories
    if (method === 'POST' && path === '/api/categories') {
      await requireAdmin(request, env);
      const body = await request.json();
      const validated = createCategorySchema.parse(body);
      const db = getDb(env);
      const category = await createCategory(db, validated);
      return successResponse(category, 'Category created successfully');
    }

    // Update category: PUT /api/categories/:id
    if (method === 'PUT' && path.match(/^\/api\/categories\/\d+$/)) {
      await requireAdmin(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const body = await request.json();
      const validated = updateCategorySchema.parse(body);
      const db = getDb(env);
      const category = await updateCategory(db, id, validated);
      return successResponse(category, 'Category updated successfully');
    }

    // Delete category: DELETE /api/categories/:id
    if (method === 'DELETE' && path.match(/^\/api\/categories\/\d+$/)) {
      await requireAdmin(request, env);
      const id = parseInt(path.split('/').pop() || '0');
      const db = getDb(env);
      await deleteCategory(db, id);
      return successResponse(null, 'Category deleted successfully');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}


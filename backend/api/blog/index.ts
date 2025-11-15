import type { Env } from '../../types'
import { getDb } from '../../utils/db'
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response'
import { handleError } from '../../utils/errors'
import { requireAdmin } from '../../utils/auth'
import { listPublishedPosts, listAllPosts, getPostBySlug, createPost, updatePost, deletePost } from '../../modules/blog'
import { createBlogPostSchema, updateBlogPostSchema } from '../../validators/blog'
import { ValidationError } from '../../utils/errors'
import { generateSlug } from '../../utils/db'
import { executeOne } from '../../utils/db'

export async function handleBlogRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method
    const db = getDb(env)

    // Public list: GET /api/blog
    if (method === 'GET' && path === '/api/blog') {
      const page = parseInt(url.searchParams.get('page') || '1')
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
      const result = await listPublishedPosts(db, page, pageSize)
      return successResponse({ items: result.items, total: result.total, page, pageSize, totalPages: Math.ceil(result.total / pageSize) })
    }

    // Public get by slug: GET /api/blog/:slug
    if (method === 'GET' && path.match(/^\/api\/blog\/[^/]+$/)) {
      const slug = path.split('/').pop() || ''
      const post = await getPostBySlug(db, slug)
      if (!post || post.status !== 'published') {
        return notFoundResponse('Post not found')
      }
      return successResponse(post)
    }

    // Admin list: GET /api/admin/blog
    if (method === 'GET' && path === '/api/admin/blog') {
      await requireAdmin(request, env)
      const page = parseInt(url.searchParams.get('page') || '1')
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
      const search = url.searchParams.get('search') || undefined
      const result = await listAllPosts(db, page, pageSize, search)
      return successResponse({ items: result.items, total: result.total, page, pageSize, totalPages: Math.ceil(result.total / pageSize) })
    }

    // Admin create: POST /api/admin/blog
    if (method === 'POST' && path === '/api/admin/blog') {
      await requireAdmin(request, env)
      const body = await request.json()
      let validated: any
      try {
        validated = createBlogPostSchema.parse(body)
      } catch (e: any) {
        throw new ValidationError('Invalid blog post data')
      }
      const slug = (validated.slug && validated.slug.trim().length > 0) ? validated.slug.trim() : generateSlug(validated.title)
      // enforce unique slug
      const exists = await executeOne<{ id: number }>(db, 'SELECT id FROM blog_posts WHERE slug = ?', [slug])
      if (exists) {
        throw new ValidationError('Slug já existe. Escolha outro.')
      }
      const post = await createPost(db, { ...validated, slug })
      return successResponse(post, 'Post created')
    }

    // Admin update: PUT /api/admin/blog/:id
    if (method === 'PUT' && path.match(/^\/api\/admin\/blog\/\d+$/)) {
      await requireAdmin(request, env)
      const id = parseInt(path.split('/').pop() || '0')
      const body = await request.json()
      let validated
      try {
        validated = updateBlogPostSchema.parse(body)
      } catch (e: any) {
        throw new ValidationError('Invalid blog post data')
      }
      const post = await updatePost(db, id, validated)
      return successResponse(post, 'Post updated')
    }

    // Admin delete: DELETE /api/admin/blog/:id
    if (method === 'DELETE' && path.match(/^\/api\/admin\/blog\/\d+$/)) {
      await requireAdmin(request, env)
      const id = parseInt(path.split('/').pop() || '0')
      await deletePost(db, id)
      return successResponse({ deleted: true })
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    const { message, status, details } = handleError(error)
    return errorResponse(message, status, details)
  }
}

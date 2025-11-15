import type { D1Database } from '@cloudflare/workers-types'
import type { BlogPost } from '@shared/types'
import { executeQuery, executeOne, executeRun } from '../utils/db'

export async function listPublishedPosts(db: D1Database, page: number = 1, pageSize: number = 10): Promise<{ items: BlogPost[]; total: number }> {
  const offset = (page - 1) * pageSize
  const [items, total] = await Promise.all([
    executeQuery<BlogPost>(db, `SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?`, [pageSize, offset]),
    executeOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published'`, [])
  ])
  return { items: items || [], total: total?.count || 0 }
}

export async function listAllPosts(db: D1Database, page: number = 1, pageSize: number = 20, search?: string): Promise<{ items: BlogPost[]; total: number }> {
  const offset = (page - 1) * pageSize
  let where = '1=1'
  const params: any[] = []
  if (search) {
    where += ' AND (title LIKE ? OR slug LIKE ? OR excerpt LIKE ?)'
    const term = `%${search}%`
    params.push(term, term, term)
  }
  const [items, total] = await Promise.all([
    executeQuery<BlogPost>(db, `SELECT * FROM blog_posts WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset]),
    executeOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM blog_posts WHERE ${where}`, params)
  ])
  return { items: items || [], total: total?.count || 0 }
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<BlogPost | null> {
  return await executeOne<BlogPost>(db, `SELECT * FROM blog_posts WHERE slug = ?`, [slug])
}

export async function createPost(db: D1Database, data: Partial<BlogPost>): Promise<BlogPost> {
  const now = new Date().toISOString()
  const result = await executeRun(
    db,
    `INSERT INTO blog_posts (title, slug, content, excerpt, status, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.slug, data.content, data.excerpt || null, data.status || 'draft', data.published_at || null, now, now]
  )
  const post = await executeOne<BlogPost>(db, `SELECT * FROM blog_posts WHERE id = ?`, [result.meta.last_row_id])
  return post as BlogPost
}

export async function updatePost(db: D1Database, id: number, data: Partial<BlogPost>): Promise<BlogPost> {
  const fields: string[] = []
  const values: any[] = []
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined) {
      fields.push(`${k} = ?`)
      values.push(v)
    }
  })
  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  await executeRun(db, `UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`, values)
  const post = await executeOne<BlogPost>(db, `SELECT * FROM blog_posts WHERE id = ?`, [id])
  return post as BlogPost
}

export async function deletePost(db: D1Database, id: number): Promise<void> {
  await executeRun(db, `DELETE FROM blog_posts WHERE id = ?`, [id])
}

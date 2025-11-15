import { z } from 'zod'

export const createBlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional().default(''),
  content: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  published_at: z.string().optional().nullable(),
})

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  published_at: z.string().optional().nullable(),
})

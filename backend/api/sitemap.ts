import type { Env } from '../types';
import { getDb, executeQuery } from '../utils/db';

const SITE_URL = 'https://www.leiasabores.pt';

const STATIC_PAGES = ['/', '/products', '/categories', '/about', '/contact', '/blog', '/shipping', '/returns', '/privacy', '/terms'];

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value.replace(' ', 'T') + (value.includes('Z') ? '' : 'Z'));
  return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

// GET /api/sitemap.xml - sitemap gerado a partir dos produtos, categorias e posts publicados
export async function handleSitemap(env: Env): Promise<Response> {
  const db = getDb(env);

  const [products, categories, posts] = await Promise.all([
    executeQuery<{ slug: string; updated_at: string | null }>(
      db,
      "SELECT slug, updated_at FROM products WHERE status = 'active' ORDER BY updated_at DESC"
    ),
    executeQuery<{ slug: string; updated_at: string | null }>(
      db,
      'SELECT slug, updated_at FROM categories WHERE is_active = 1'
    ),
    executeQuery<{ slug: string; updated_at: string | null }>(
      db,
      "SELECT slug, updated_at FROM blog_posts WHERE status = 'published'"
    ).catch(() => []),
  ]);

  const urls: { loc: string; lastmod?: string | null }[] = [
    ...STATIC_PAGES.map((page) => ({ loc: `${SITE_URL}${page}` })),
    ...categories.map((c) => ({ loc: `${SITE_URL}/products?category=${encodeURIComponent(c.slug)}`, lastmod: toDate(c.updated_at) })),
    ...products.map((p) => ({ loc: `${SITE_URL}/product/${encodeURIComponent(p.slug)}`, lastmod: toDate(p.updated_at) })),
    ...posts.map((p) => ({ loc: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`, lastmod: toDate(p.updated_at) })),
  ];

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map((u) => `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

import type { Env } from '../../types';
import { getDb, executeOne, executeQuery } from '../../utils/db';
import { requireAdmin } from '../../utils/auth';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { CJClient, SupplierError } from '../../services/cj';
import { importCJProduct, syncCJStock } from '../../modules/dropshipping';
import { z } from 'zod';

const importSchema = z.object({
  cjProductId: z.string().min(1),
  markupPercent: z.number().min(0).max(500).optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  categoryId: z.number().int().positive().nullable().optional(),
  preferredCountryCode: z.string().length(2).nullable().optional(),
});

const syncStockSchema = z.object({
  productId: z.number().int().positive().optional(),
  skus: z.array(z.string().min(1)).max(50).optional(),
  preferredCountryCode: z.string().length(2).nullable().optional(),
});

type TokenStatus = {
  access_token_expires_at: string;
};

type SupplierStatusRow = {
  is_active: number;
};

type ApiLogRow = {
  id: string;
  method: string;
  endpoint: string;
  status_code: number | null;
  request_id: string | null;
  success: number;
  duration_ms: number | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
};

export async function handleAdminDropshippingRoutes(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);

    const db = getDb(env);
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const client = new CJClient(env, db);

    if (method === 'GET' && path === '/api/admin/dropshipping/cj/status') {
      const token = await executeOne<TokenStatus>(
        db,
        'SELECT access_token_expires_at FROM supplier_auth_tokens WHERE supplier_code = ?',
        ['cj']
      );
      const supplier = await executeOne<SupplierStatusRow>(
        db,
        'SELECT is_active FROM suppliers WHERE code = ?',
        ['cj']
      );

      let verified = false;
      let verifyError: string | null = null;
      if (url.searchParams.get('verify') === '1') {
        try {
          await client.authenticate();
          verified = true;
        } catch (error) {
          verifyError = error instanceof Error ? error.message : 'Could not verify CJ credentials';
        }
      }

      return successResponse({
        configured: Boolean(env.CJ_API_KEY),
        hasApiKey: Boolean(env.CJ_API_KEY),
        hasPlatformToken: Boolean(env.CJ_PLATFORM_TOKEN),
        baseUrl: env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1',
        defaultWarehouseCountry: env.CJ_DEFAULT_WAREHOUSE_COUNTRY || null,
        tokenCached: Boolean(token),
        tokenExpiresAt: token?.access_token_expires_at || null,
        supplierActive: supplier?.is_active !== 0,
        verified,
        verifyError,
      });
    }

    if (method === 'GET' && path === '/api/admin/dropshipping/cj/search') {
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
      const keyword = url.searchParams.get('keyword') || undefined;
      const countryCode = url.searchParams.get('countryCode') || undefined;

      const products = await client.listProducts({ page, pageSize, keyword, countryCode });
      return successResponse(products);
    }

    if (method === 'GET' && path.match(/^\/api\/admin\/dropshipping\/cj\/products\/[^/]+$/)) {
      const cjProductId = path.split('/').pop();
      if (!cjProductId) {
        return errorResponse('CJ product id is required', 400);
      }

      const product = await client.getProduct(cjProductId);
      return successResponse(product);
    }

    if (method === 'POST' && path === '/api/admin/dropshipping/cj/import') {
      const body = importSchema.parse(await request.json());
      const result = await importCJProduct(db, client, {
        cjProductId: body.cjProductId,
        markupPercent: body.markupPercent,
        status: body.status,
        categoryId: body.categoryId,
        preferredCountryCode: body.preferredCountryCode || env.CJ_DEFAULT_WAREHOUSE_COUNTRY || null,
      });

      return successResponse(result, result.imported ? 'CJ product imported as draft' : 'CJ product already imported');
    }

    if (method === 'POST' && path === '/api/admin/dropshipping/cj/sync-stock') {
      const body = syncStockSchema.parse(await request.json());
      const result = await syncCJStock(db, client, {
        productId: body.productId,
        skus: body.skus,
        preferredCountryCode: body.preferredCountryCode || env.CJ_DEFAULT_WAREHOUSE_COUNTRY || null,
      });

      return successResponse(result, 'CJ stock sync completed');
    }

    if (method === 'GET' && path === '/api/admin/dropshipping/cj/logs') {
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
      const logs = await executeQuery<ApiLogRow>(
        db,
        `SELECT id, method, endpoint, status_code, request_id, success, duration_ms,
                error_code, error_message, created_at
         FROM supplier_api_logs
         WHERE supplier_id = 'cj'
         ORDER BY created_at DESC
         LIMIT ?`,
        [limit]
      );

      return successResponse(logs);
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof SupplierError) {
      return errorResponse(error.message, error.retryable ? 503 : 400, {
        code: error.code,
        requestId: error.requestId,
      });
    }

    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../types';
import { executeOne, executeRun } from '../utils/db';

const DEFAULT_CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';
const CJ_SUPPLIER_ID = 'cj';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 3;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type CJEnvelope<T> = {
  code?: number;
  result?: boolean;
  success?: boolean;
  message?: string | null;
  data?: T;
  requestId?: string;
};

type AuthTokenPayload = {
  openId?: number | string;
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken?: string;
  refreshTokenExpiryDate?: string;
};

type CachedToken = {
  access_token: string;
  access_token_expires_at: string;
  refresh_token: string | null;
  refresh_token_expires_at: string | null;
  open_id: string | null;
};

export type CJProductSearchInput = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  countryCode?: string;
};

export type CJOrderProduct = {
  vid?: string;
  sku?: string;
  quantity: number;
  unitPrice?: string;
  storeLineItemId?: string;
};

export type CJShippingAddress = {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string | null;
  city: string;
  province?: string | null;
  postalCode: string;
  country: string;
  countryCode: string;
  phone?: string | null;
};

export type CJPlaceOrderInput = {
  orderNumber: string;
  products: CJOrderProduct[];
  shippingAddress: CJShippingAddress;
  note?: string | null;
  logisticsName?: string | null;
  fromCountryCode?: string | null;
  payType?: 1 | 2 | 3;
};

export class SupplierError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public requestId?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SupplierError';
  }
}

export class CJClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly env: Env,
    private readonly db: D1Database,
    options?: { timeoutMs?: number }
  ) {
    this.baseUrl = (env.CJ_API_BASE_URL || DEFAULT_CJ_BASE_URL).replace(/\/$/, '');
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async authenticate(): Promise<string> {
    const cached = await executeOne<CachedToken>(
      this.db,
      'SELECT access_token, access_token_expires_at, refresh_token, refresh_token_expires_at, open_id FROM supplier_auth_tokens WHERE supplier_code = ?',
      [CJ_SUPPLIER_ID]
    );

    if (cached && this.isFuture(cached.access_token_expires_at, TOKEN_REFRESH_BUFFER_MS)) {
      return cached.access_token;
    }

    if (
      cached?.refresh_token &&
      cached.refresh_token_expires_at &&
      this.isFuture(cached.refresh_token_expires_at, TOKEN_REFRESH_BUFFER_MS)
    ) {
      try {
        const refreshed = await this.requestWithoutAuth<AuthTokenPayload>('POST', '/authentication/refreshAccessToken', {
          refreshToken: cached.refresh_token,
        });
        await this.persistToken(refreshed);
        return refreshed.accessToken;
      } catch (error) {
        console.warn('[CJ] Refresh token failed, trying API key auth:', error);
      }
    }

    const apiKey = this.env.CJ_API_KEY;
    if (!apiKey) {
      throw new SupplierError('CJ_API_KEY is not configured', 'CJ_NOT_CONFIGURED', false);
    }

    const token = await this.requestWithoutAuth<AuthTokenPayload>('POST', '/authentication/getAccessToken', {
      apiKey,
    });
    await this.persistToken(token);
    return token.accessToken;
  }

  async listProducts(input: CJProductSearchInput = {}): Promise<unknown> {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
    });

    if (input.keyword) {
      params.set('keyWord', input.keyword);
    }
    if (input.countryCode) {
      params.set('countryCode', input.countryCode.toUpperCase());
    }

    return this.requestWithAuth<unknown>('GET', `/product/listV2?${params.toString()}`);
  }

  async getProduct(productId: string): Promise<unknown> {
    const params = new URLSearchParams({
      pid: productId,
      features: 'enable_inventory',
    });
    return this.requestWithAuth<unknown>('GET', `/product/query?${params.toString()}`);
  }

  async getVariantsByProduct(productId: string): Promise<unknown> {
    const params = new URLSearchParams({
      pid: productId,
      features: 'enable_inventory',
    });
    return this.requestWithAuth<unknown>('GET', `/product/variant/query?${params.toString()}`);
  }

  async getVariantByVid(variantId: string): Promise<unknown> {
    const params = new URLSearchParams({
      vid: variantId,
      features: 'enable_inventory',
    });
    return this.requestWithAuth<unknown>('GET', `/product/variant/queryByVid?${params.toString()}`);
  }

  async queryStockBySku(sku: string): Promise<unknown> {
    const params = new URLSearchParams({ sku });
    return this.requestWithAuth<unknown>('GET', `/product/stock/queryBySku?${params.toString()}`);
  }

  async queryStockByVid(variantId: string): Promise<unknown> {
    const params = new URLSearchParams({ vid: variantId });
    return this.requestWithAuth<unknown>('GET', `/product/stock/queryByVid?${params.toString()}`);
  }

  async queryInventoryByProduct(productId: string): Promise<unknown> {
    const params = new URLSearchParams({ pid: productId });
    return this.requestWithAuth<unknown>('GET', `/product/stock/getInventoryByPid?${params.toString()}`);
  }

  async placeOrder(input: CJPlaceOrderInput): Promise<unknown> {
    const body: JsonObject = {
      orderNumber: input.orderNumber,
      shippingZip: input.shippingAddress.postalCode,
      shippingCountry: input.shippingAddress.country,
      shippingCountryCode: input.shippingAddress.countryCode.toUpperCase(),
      shippingProvince: input.shippingAddress.province || '',
      shippingCity: input.shippingAddress.city,
      shippingAddress: [input.shippingAddress.line1, input.shippingAddress.line2].filter(Boolean).join(' '),
      shippingCustomerName: `${input.shippingAddress.firstName} ${input.shippingAddress.lastName}`.trim(),
      shippingPhone: input.shippingAddress.phone || '',
      remark: input.note || '',
      payType: input.payType ?? 3,
      products: input.products.map((product) => ({
        ...(product.vid ? { vid: product.vid } : {}),
        ...(product.sku ? { sku: product.sku } : {}),
        quantity: product.quantity,
        ...(product.unitPrice ? { unitPrice: product.unitPrice } : {}),
        ...(product.storeLineItemId ? { storeLineItemId: product.storeLineItemId } : {}),
      })),
    };

    if (input.logisticsName) {
      body.logisticName = input.logisticsName;
    }
    if (input.fromCountryCode) {
      body.fromCountryCode = input.fromCountryCode.toUpperCase();
    }

    return this.requestWithAuth<unknown>('POST', '/shopping/order/createOrderV3', body);
  }

  async getOrderStatus(cjOrderId: string): Promise<unknown> {
    const params = new URLSearchParams({ orderId: cjOrderId });
    return this.requestWithAuth<unknown>('GET', `/shopping/order/getOrderDetail?${params.toString()}`);
  }

  async getTracking(trackNumbers: string[]): Promise<unknown> {
    const params = new URLSearchParams();
    for (const trackNumber of trackNumbers) {
      params.append('trackNumber', trackNumber);
    }
    return this.requestWithAuth<unknown>('GET', `/logistic/trackInfo?${params.toString()}`);
  }

  async syncStock(skus: string[]): Promise<Array<{ sku: string; stock: unknown }>> {
    const uniqueSkus = Array.from(new Set(skus)).slice(0, 50);
    const results: Array<{ sku: string; stock: unknown }> = [];

    for (const sku of uniqueSkus) {
      results.push({ sku, stock: await this.queryStockBySku(sku) });
    }

    return results;
  }

  private async requestWithAuth<T>(method: HttpMethod, path: string, body?: JsonObject): Promise<T> {
    const accessToken = await this.authenticate();
    return this.request<T>(method, path, body, accessToken);
  }

  private async requestWithoutAuth<T>(method: HttpMethod, path: string, body?: JsonObject): Promise<T> {
    return this.request<T>(method, path, body);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: JsonObject,
    accessToken?: string
  ): Promise<T> {
    let lastError: SupplierError | null = null;

    for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt++) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (accessToken) {
          headers['CJ-Access-Token'] = accessToken;
        }
        if (this.env.CJ_PLATFORM_TOKEN) {
          headers.platformToken = this.env.CJ_PLATFORM_TOKEN;
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        const durationMs = Date.now() - startedAt;
        const responseBody = (await response.json().catch(() => null)) as unknown;
        const envelope = toCJEnvelope<T>(responseBody);
        await this.logCall(method, path, response.status, durationMs, envelope, response.ok);

        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          const error = new SupplierError(
            `CJ HTTP ${response.status}`,
            `CJ_HTTP_${response.status}`,
            retryable,
            envelope?.requestId,
            response.status
          );
          if (retryable && attempt < DEFAULT_RETRIES) {
            lastError = error;
            await delay(backoffMs(attempt));
            continue;
          }
          throw error;
        }

        if (!envelope) {
          throw new SupplierError('Invalid CJ response', 'CJ_INVALID_RESPONSE', false);
        }

        const success = envelope.success === true || envelope.result === true || envelope.code === 200;
        if (!success) {
          throw new SupplierError(
            envelope.message || 'CJ API error',
            envelope.code ? `CJ_${envelope.code}` : 'CJ_API_ERROR',
            false,
            envelope.requestId,
            response.status
          );
        }

        return envelope.data as T;
      } catch (error) {
        const supplierError = normalizeSupplierError(error);
        lastError = supplierError;

        await this.logCall(method, path, undefined, Date.now() - startedAt, undefined, false, supplierError);

        if (!supplierError.retryable || attempt === DEFAULT_RETRIES) {
          throw supplierError;
        }

        await delay(backoffMs(attempt));
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError || new SupplierError('CJ request failed', 'CJ_REQUEST_FAILED', true);
  }

  private async persistToken(payload: AuthTokenPayload): Promise<void> {
    await executeRun(
      this.db,
      `INSERT OR REPLACE INTO supplier_auth_tokens (
        supplier_code, access_token, access_token_expires_at, refresh_token,
        refresh_token_expires_at, open_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        CJ_SUPPLIER_ID,
        payload.accessToken,
        payload.accessTokenExpiryDate,
        payload.refreshToken || null,
        payload.refreshTokenExpiryDate || null,
        payload.openId ? String(payload.openId) : null,
      ]
    );
  }

  private isFuture(date: string, bufferMs = 0): boolean {
    const time = Date.parse(date);
    return Number.isFinite(time) && time - bufferMs > Date.now();
  }

  private async logCall(
    method: HttpMethod,
    endpoint: string,
    statusCode: number | undefined,
    durationMs: number,
    envelope: CJEnvelope<unknown> | undefined,
    ok: boolean,
    error?: SupplierError
  ): Promise<void> {
    try {
      await executeRun(
        this.db,
        `INSERT INTO supplier_api_logs (
          id, supplier_id, method, endpoint, status_code, request_id, success,
          duration_ms, error_code, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          crypto.randomUUID(),
          CJ_SUPPLIER_ID,
          method,
          endpoint,
          statusCode || null,
          envelope?.requestId || error?.requestId || null,
          ok ? 1 : 0,
          durationMs,
          error?.code || null,
          error?.message || envelope?.message || null,
        ]
      );
    } catch (logError) {
      console.warn('[CJ] Could not persist supplier API log:', logError);
    }
  }
}

function toCJEnvelope<T>(value: unknown): CJEnvelope<T> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    code: typeof value.code === 'number' ? value.code : undefined,
    result: typeof value.result === 'boolean' ? value.result : undefined,
    success: typeof value.success === 'boolean' ? value.success : undefined,
    message: typeof value.message === 'string' || value.message === null ? value.message : undefined,
    data: value.data as T,
    requestId: typeof value.requestId === 'string' ? value.requestId : undefined,
  };
}

function normalizeSupplierError(error: unknown): SupplierError {
  if (error instanceof SupplierError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new SupplierError('CJ request timed out', 'CJ_TIMEOUT', true);
  }

  if (error instanceof Error) {
    return new SupplierError(error.message, 'CJ_NETWORK_ERROR', true);
  }

  return new SupplierError('Unknown CJ error', 'CJ_UNKNOWN_ERROR', true);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  return 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
}

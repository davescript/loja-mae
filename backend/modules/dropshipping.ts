import type { D1Database } from '@cloudflare/workers-types';
import type { CJImportResult } from '@shared/types';
import { executeOne, executeQuery, executeRun, generateSlug } from '../utils/db';
import { ValidationError } from '../utils/errors';
import type { CJClient } from '../services/cj';

type JsonRecord = Record<string, unknown>;

type ImportCJProductInput = {
  cjProductId: string;
  markupPercent?: number;
  status?: 'draft' | 'active' | 'archived';
  categoryId?: number | null;
  preferredCountryCode?: string | null;
};

type SyncStockInput = {
  productId?: number;
  skus?: string[];
  preferredCountryCode?: string | null;
};

type SupplierVariantRow = {
  id: string;
  variant_id: number;
  product_id: number;
  supplier_sku: string;
  supplier_variant_id: string | null;
};

type StockChoice = {
  quantity: number;
  countryCode: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
};

export async function importCJProduct(
  db: D1Database,
  client: CJClient,
  input: ImportCJProductInput
): Promise<CJImportResult> {
  const cjProductId = input.cjProductId.trim();
  if (!cjProductId) {
    throw new ValidationError('cjProductId is required');
  }

  const existing = await executeOne<{ product_id: number; title: string }>(
    db,
    `SELECT sp.product_id, p.title
     FROM supplier_products sp
     INNER JOIN products p ON p.id = sp.product_id
     WHERE sp.supplier_id = 'cj' AND sp.supplier_product_id = ?`,
    [cjProductId]
  );

  if (existing) {
    return {
      productId: existing.product_id,
      imported: false,
      title: existing.title,
      variantsCreated: 0,
      imagesCreated: 0,
    };
  }

  const [productPayload, variantsPayload, inventoryPayload] = await Promise.all([
    client.getProduct(cjProductId),
    client.getVariantsByProduct(cjProductId).catch(() => null),
    client.queryInventoryByProduct(cjProductId).catch(() => null),
  ]);

  const productRecord = unwrapRecord(productPayload);
  const variants = extractVariants(productRecord, variantsPayload);

  if (variants.length === 0) {
    variants.push(productRecord);
  }

  const markupPercent = input.markupPercent ?? 70;
  const title = readString(productRecord, [
    'productNameEn',
    'productName',
    'nameEn',
    'name',
    'title',
  ]) || `CJ Product ${cjProductId}`;
  const description = readString(productRecord, [
    'description',
    'descriptionEn',
    'productDescription',
    'productDescriptionEn',
    'remark',
  ]);
  const supplierSku = readString(productRecord, ['productSku', 'productSKU', 'sku', 'productCode']);
  const images = extractImageUrls(productRecord);
  const firstVariant = variants[0] || productRecord;
  const firstCostCents = extractCostCents(firstVariant, productRecord);
  const firstPriceCents = markupPrice(firstCostCents, markupPercent);
  const firstStock = chooseStock(
    extractStockRows(firstVariant, inventoryPayload),
    input.preferredCountryCode
  );

  const slug = await uniqueSlug(db, title, cjProductId);
  const result = await executeRun(
    db,
    `INSERT INTO products (
      title, slug, description, short_description, price_cents, compare_at_price_cents,
      sku, barcode, stock_quantity, track_inventory, weight_grams, status, featured,
      category_id, meta_title, meta_description, supplier_type, cj_product_id,
      cj_product_sku, supplier_source_country_code, supplier_delivery_min_days,
      supplier_delivery_max_days, supplier_last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      title,
      slug,
      description,
      null,
      firstPriceCents,
      null,
      supplierSku,
      null,
      firstStock.quantity,
      1,
      readInteger(firstVariant, ['variantWeight', 'weight', 'weightGram', 'weight_grams']),
      input.status || 'draft',
      0,
      input.categoryId || null,
      title,
      description ? description.slice(0, 500) : null,
      'cj',
      cjProductId,
      supplierSku,
      firstStock.countryCode,
      null,
      null,
    ]
  );

  if (!result.success) {
    throw new Error('Failed to import CJ product');
  }

  const productId = result.meta.last_row_id as number;
  let imagesCreated = 0;

  for (let index = 0; index < images.length; index += 1) {
    await executeRun(
      db,
      `INSERT INTO product_images (
        product_id, image_url, image_key, alt_text, position, is_primary, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        productId,
        images[index],
        `cj/${cjProductId}/${index}`,
        title,
        index,
        index === 0 ? 1 : 0,
      ]
    );
    imagesCreated += 1;
  }

  await executeRun(
    db,
    `INSERT INTO supplier_products (
      id, product_id, supplier_id, supplier_product_id, supplier_product_sku,
      source_country_code, delivery_min_days, delivery_max_days, raw_json,
      last_synced_at, created_at, updated_at
    ) VALUES (?, ?, 'cj', ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
    [
      crypto.randomUUID(),
      productId,
      cjProductId,
      supplierSku,
      firstStock.countryCode,
      null,
      null,
      JSON.stringify(productRecord),
    ]
  );

  let variantsCreated = 0;
  for (let index = 0; index < variants.length; index += 1) {
    const variant = variants[index] || productRecord;
    const costCents = extractCostCents(variant, productRecord);
    const priceCents = markupPrice(costCents, markupPercent);
    const stock = chooseStock(extractStockRows(variant, inventoryPayload), input.preferredCountryCode);
    const variantId = readString(variant, ['vid', 'variantId', 'variantID', 'id']);
    const variantSku =
      readString(variant, ['variantSku', 'variantSKU', 'sku', 'productSku']) ||
      variantId ||
      `${supplierSku || cjProductId}-${index + 1}`;
    const variantTitle =
      readString(variant, ['variantNameEn', 'variantName', 'nameEn', 'name', 'title']) ||
      readVariantOptions(variant) ||
      'Default';

    const variantResult = await executeRun(
      db,
      `INSERT INTO product_variants (
        product_id, title, price_cents, compare_at_price_cents, sku, barcode,
        stock_quantity, track_inventory, weight_grams, option1, option2, option3,
        position, cj_variant_id, cj_sku, supplier_cost_cents,
        supplier_shipping_cost_cents, supplier_currency, supplier_source_country_code,
        supplier_warehouse_id, supplier_warehouse_name, supplier_last_synced_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [
        productId,
        variantTitle,
        priceCents,
        null,
        variantSku,
        null,
        stock.quantity,
        1,
        readInteger(variant, ['variantWeight', 'weight', 'weightGram', 'weight_grams']),
        readString(variant, ['variantKey', 'option1', 'color', 'size']),
        null,
        null,
        index,
        variantId,
        variantSku,
        costCents,
        0,
        'USD',
        stock.countryCode,
        stock.warehouseId,
        stock.warehouseName,
      ]
    );

    const localVariantId = variantResult.meta.last_row_id as number;
    await executeRun(
      db,
      `INSERT INTO supplier_variant_mappings (
        id, variant_id, product_id, supplier_id, supplier_product_id,
        supplier_variant_id, supplier_sku, cost_cents, shipping_cost_cents,
        currency, stock_quantity, source_country_code, warehouse_id, warehouse_name,
        last_synced_at, raw_json, created_at, updated_at
      ) VALUES (?, ?, ?, 'cj', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'), datetime('now'))`,
      [
        crypto.randomUUID(),
        localVariantId,
        productId,
        cjProductId,
        variantId,
        variantSku,
        costCents,
        0,
        'USD',
        stock.quantity,
        stock.countryCode,
        stock.warehouseId,
        stock.warehouseName,
        JSON.stringify(variant),
      ]
    );

    variantsCreated += 1;
  }

  await refreshProductStock(db, productId);

  return {
    productId,
    imported: true,
    title,
    variantsCreated,
    imagesCreated,
  };
}

export async function syncCJStock(
  db: D1Database,
  client: CJClient,
  input: SyncStockInput = {}
): Promise<{ synced: number; failed: number; results: Array<{ sku: string; stockQuantity?: number; error?: string }> }> {
  const params: Array<string | number> = [];
  const where: string[] = ["supplier_id = 'cj'"];

  if (input.productId) {
    where.push('product_id = ?');
    params.push(input.productId);
  }

  if (input.skus && input.skus.length > 0) {
    const skus = input.skus.slice(0, 50);
    where.push(`supplier_sku IN (${skus.map(() => '?').join(',')})`);
    params.push(...skus);
  }

  const rows = await executeQuery<SupplierVariantRow>(
    db,
    `SELECT id, variant_id, product_id, supplier_sku, supplier_variant_id
     FROM supplier_variant_mappings
     WHERE ${where.join(' AND ')}
     ORDER BY last_synced_at ASC
     LIMIT 50`,
    params
  );

  let synced = 0;
  let failed = 0;
  const results: Array<{ sku: string; stockQuantity?: number; error?: string }> = [];
  const touchedProducts = new Set<number>();

  for (const row of rows) {
    try {
      const payload = await client.queryStockBySku(row.supplier_sku);
      const stock = chooseStock(extractStockRows(payload, null), input.preferredCountryCode);

      await executeRun(
        db,
        `UPDATE supplier_variant_mappings
         SET stock_quantity = ?, source_country_code = ?, warehouse_id = ?,
             warehouse_name = ?, last_synced_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ?`,
        [stock.quantity, stock.countryCode, stock.warehouseId, stock.warehouseName, row.id]
      );

      await executeRun(
        db,
        `UPDATE product_variants
         SET stock_quantity = ?, supplier_source_country_code = ?, supplier_warehouse_id = ?,
             supplier_warehouse_name = ?, supplier_last_synced_at = datetime('now'),
             updated_at = datetime('now')
         WHERE id = ?`,
        [stock.quantity, stock.countryCode, stock.warehouseId, stock.warehouseName, row.variant_id]
      );

      touchedProducts.add(row.product_id);
      results.push({ sku: row.supplier_sku, stockQuantity: stock.quantity });
      synced += 1;
    } catch (error) {
      failed += 1;
      results.push({
        sku: row.supplier_sku,
        error: error instanceof Error ? error.message : 'Unknown stock sync error',
      });
    }
  }

  for (const productId of touchedProducts) {
    await refreshProductStock(db, productId);
  }

  return { synced, failed, results };
}

async function refreshProductStock(db: D1Database, productId: number): Promise<void> {
  await executeRun(
    db,
    `UPDATE products
     SET stock_quantity = (
       SELECT COALESCE(SUM(stock_quantity), 0)
       FROM product_variants
       WHERE product_id = ?
     ),
     supplier_last_synced_at = datetime('now'),
     updated_at = datetime('now')
     WHERE id = ?`,
    [productId, productId]
  );
}

async function uniqueSlug(db: D1Database, title: string, cjProductId: string): Promise<string> {
  const baseSlug = generateSlug(title) || `cj-product-${cjProductId}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await executeOne<{ id: number }>(db, 'SELECT id FROM products WHERE slug = ?', [slug])) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

function unwrapRecord(value: unknown): JsonRecord {
  if (isRecord(value)) {
    if (isRecord(value.product)) return value.product;
    if (isRecord(value.item)) return value.item;
    return value;
  }
  throw new ValidationError('CJ returned an invalid product payload');
}

function extractVariants(product: JsonRecord, variantsPayload: unknown): JsonRecord[] {
  const fromProduct = firstRecordArray(product, [
    'variants',
    'variantList',
    'productVariants',
    'productVariantList',
    'variantInfoList',
  ]);
  if (fromProduct.length > 0) return fromProduct;

  if (Array.isArray(variantsPayload)) {
    return variantsPayload.filter(isRecord);
  }
  if (isRecord(variantsPayload)) {
    return firstRecordArray(variantsPayload, ['variants', 'variantList', 'list', 'records', 'content']);
  }

  return [];
}

function extractImageUrls(product: JsonRecord): string[] {
  const images = new Set<string>();
  const candidateKeys = [
    'productImage',
    'productImageUrl',
    'bigImage',
    'image',
    'imageUrl',
    'variantImage',
  ];

  for (const key of candidateKeys) {
    const value = product[key];
    if (typeof value === 'string' && isHttpUrl(value)) {
      images.add(value);
    }
  }

  const arrays = ['productImageSet', 'images', 'imageList', 'productImages'];
  for (const key of arrays) {
    const value = product[key];
    if (!Array.isArray(value)) continue;

    for (const item of value) {
      if (typeof item === 'string' && isHttpUrl(item)) {
        images.add(item);
      } else if (isRecord(item)) {
        const url = readString(item, ['url', 'imageUrl', 'productImage', 'src']);
        if (url && isHttpUrl(url)) images.add(url);
      }
    }
  }

  return Array.from(images).slice(0, 12);
}

function extractCostCents(variant: JsonRecord, product: JsonRecord): number {
  const amount =
    readNumber(variant, ['variantSellPrice', 'sellPrice', 'price', 'cost', 'variantPrice']) ??
    readNumber(product, ['sellPrice', 'price', 'productPrice', 'cost']) ??
    0;
  return Math.max(0, Math.round(amount * 100));
}

function markupPrice(costCents: number, markupPercent: number): number {
  if (costCents <= 0) return 0;
  return Math.ceil(costCents * (1 + Math.max(0, markupPercent) / 100));
}

function extractStockRows(source: unknown, inventoryPayload: unknown): JsonRecord[] {
  const rows: JsonRecord[] = [];
  const sourceRecord = isRecord(source) ? source : null;
  const sourceVariantId = sourceRecord
    ? readString(sourceRecord, ['vid', 'variantId', 'variantID', 'id'])
    : null;

  if (Array.isArray(source)) {
    rows.push(...source.filter(isRecord));
  } else if (sourceRecord) {
    rows.push(...firstRecordArray(sourceRecord, ['inventories', 'inventory', 'stock', 'stockList']));
  }

  if (isRecord(inventoryPayload)) {
    rows.push(...firstRecordArray(inventoryPayload, ['inventories', 'inventory', 'stock', 'stockList']));
    const variantInventories = firstRecordArray(inventoryPayload, ['variantInventories']);
    for (const variantInventory of variantInventories) {
      const inventoryVariantId = readString(variantInventory, ['vid', 'variantId', 'variantID', 'id']);
      if (!sourceVariantId || !inventoryVariantId || inventoryVariantId === sourceVariantId) {
        rows.push(...firstRecordArray(variantInventory, ['inventory', 'inventories', 'stock']));
      }
    }
  } else if (Array.isArray(inventoryPayload)) {
    rows.push(...inventoryPayload.filter(isRecord));
  }

  return rows;
}

function chooseStock(rows: JsonRecord[], preferredCountryCode?: string | null): StockChoice {
  if (rows.length === 0) {
    return { quantity: 0, countryCode: preferredCountryCode?.toUpperCase() || null, warehouseId: null, warehouseName: null };
  }

  const preferred = preferredCountryCode
    ? rows.find((row) => readString(row, ['countryCode'])?.toUpperCase() === preferredCountryCode.toUpperCase())
    : undefined;
  const chosen = preferred || rows.reduce((best, row) => {
    return stockQuantity(row) > stockQuantity(best) ? row : best;
  }, rows[0]);

  return {
    quantity: stockQuantity(chosen),
    countryCode: readString(chosen, ['countryCode', 'country'])?.toUpperCase() || null,
    warehouseId: stringOrNumber(chosen, ['areaId', 'stockId', 'warehouseId', 'storageId']),
    warehouseName: readString(chosen, ['areaEn', 'countryNameEn', 'warehouseName', 'storageName']) || null,
  };
}

function stockQuantity(row: JsonRecord): number {
  return Math.max(
    0,
    readInteger(row, [
      'totalInventoryNum',
      'totalInventory',
      'inventory',
      'cjInventoryNum',
      'cjInventory',
      'factoryInventoryNum',
      'factoryInventory',
      'storageNum',
    ]) || 0
  );
}

function readVariantOptions(record: JsonRecord): string | null {
  const keys = ['variantKey', 'variantKeyEn', 'option1', 'option2', 'option3'];
  const values = keys.map((key) => record[key]).filter((value): value is string => typeof value === 'string' && value.trim() !== '');
  return values.length > 0 ? values.join(' / ') : null;
}

function firstRecordArray(record: JsonRecord, keys: string[]): JsonRecord[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  return [];
}

function readString(record: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

function stringOrNumber(record: JsonRecord, keys: string[]): string | null {
  return readString(record, keys);
}

function readNumber(record: JsonRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value.replace(',', '.'));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readInteger(record: JsonRecord, keys: string[]): number | null {
  const value = readNumber(record, keys);
  return value === null ? null : Math.round(value);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('https://') || value.startsWith('http://');
}

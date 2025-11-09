import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';
import { createProduct, addProductImage, getProduct } from '../../modules/products';
import { createProductSchema } from '../../validators/products';
import { uploadImage } from '../../utils/r2';
import { getR2Bucket } from '../../utils/db';

export async function handleCreateProduct(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    
    const formData = await request.formData();
    const db = getDb(env);
    const r2 = getR2Bucket(env);
    
    // Parse product data
    const productData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string | null,
      short_description: formData.get('short_description') as string | null,
      price_cents: parseInt(formData.get('price_cents') as string),
      compare_at_price_cents: formData.get('compare_at_price_cents') 
        ? parseInt(formData.get('compare_at_price_cents') as string) 
        : null,
      sku: formData.get('sku') as string | null,
      barcode: formData.get('barcode') as string | null,
      stock_quantity: formData.get('stock_quantity') 
        ? parseInt(formData.get('stock_quantity') as string) 
        : 0,
      track_inventory: formData.get('track_inventory') === '1' ? 1 : 0,
      weight_grams: formData.get('weight_grams') 
        ? parseInt(formData.get('weight_grams') as string) 
        : null,
      status: (formData.get('status') as string) || 'draft',
      featured: formData.get('featured') === '1' ? 1 : 0,
      category_id: formData.get('category_id') 
        ? parseInt(formData.get('category_id') as string) 
        : null,
      meta_title: formData.get('meta_title') as string | null,
      meta_description: formData.get('meta_description') as string | null,
    };
    
    const validated = createProductSchema.parse(productData);
    const product = await createProduct(db, validated);
    
    // Handle images
    const imageEntries = formData.getAll('images');
    for (let i = 0; i < imageEntries.length; i++) {
      const image = imageEntries[i];
      if (image && typeof image === 'object' && 'size' in image && (image as any).size > 0) {
        const file = image as File;
        const { key, url } = await uploadImage(r2, file, 'products');
        await addProductImage(
          db,
          product.id,
          url,
          key,
          formData.get(`image_alt_${i}`) as string | null,
          i,
          i === 0 ? 1 : 0
        );
      }
    }
    
    // Return product with relations
    const productWithRelations = await getProduct(db, product.id, true);
    
    return successResponse(productWithRelations, 'Product created successfully');
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}


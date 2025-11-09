import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';
import { updateProduct, getProduct, addProductImage, removeProductImage } from '../../modules/products';
import { updateProductSchema } from '../../validators/products';
import { uploadImage, removeImage } from '../../utils/r2';
import { getR2Bucket } from '../../utils/db';

export async function handleUpdateProduct(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1]);
    
    if (isNaN(id)) {
      return errorResponse('Invalid product ID', 400);
    }
    
    const formData = await request.formData();
    const db = getDb(env);
    const r2 = getR2Bucket(env);
    
    // Parse product data
    const productData: any = {};
    if (formData.has('title')) productData.title = formData.get('title') as string;
    if (formData.has('description')) productData.description = formData.get('description') as string | null;
    if (formData.has('short_description')) productData.short_description = formData.get('short_description') as string | null;
    if (formData.has('price_cents')) productData.price_cents = parseInt(formData.get('price_cents') as string);
    if (formData.has('compare_at_price_cents')) {
      const value = formData.get('compare_at_price_cents') as string;
      productData.compare_at_price_cents = value ? parseInt(value) : null;
    }
    if (formData.has('sku')) productData.sku = formData.get('sku') as string | null;
    if (formData.has('barcode')) productData.barcode = formData.get('barcode') as string | null;
    if (formData.has('stock_quantity')) productData.stock_quantity = parseInt(formData.get('stock_quantity') as string);
    if (formData.has('track_inventory')) productData.track_inventory = formData.get('track_inventory') === '1' ? 1 : 0;
    if (formData.has('weight_grams')) {
      const value = formData.get('weight_grams') as string;
      productData.weight_grams = value ? parseInt(value) : null;
    }
    if (formData.has('status')) productData.status = formData.get('status') as string;
    if (formData.has('featured')) productData.featured = formData.get('featured') === '1' ? 1 : 0;
    if (formData.has('category_id')) {
      const value = formData.get('category_id') as string;
      productData.category_id = value ? parseInt(value) : null;
    }
    if (formData.has('meta_title')) productData.meta_title = formData.get('meta_title') as string | null;
    if (formData.has('meta_description')) productData.meta_description = formData.get('meta_description') as string | null;
    
    const validated = updateProductSchema.parse(productData);
    const product = await updateProduct(db, id, validated);
    
    // Handle image deletions
    const deletedImages = formData.getAll('deleted_images') as string[];
    for (const imageKey of deletedImages) {
      if (imageKey) {
        const imageId = parseInt(imageKey);
        if (!isNaN(imageId)) {
          const productData = await getProduct(db, id, true);
          const image = productData?.images?.find(img => img.id === imageId);
          if (image) {
            await removeProductImage(db, imageId);
            await removeImage(r2, image.image_key);
          }
        }
      }
    }
    
    // Handle new images
    const imageEntries = formData.getAll('images');
    const productDataWithImages = await getProduct(db, id, true);
    const currentImageCount = productDataWithImages?.images?.length || 0;
    
    for (let i = 0; i < imageEntries.length; i++) {
      const image = imageEntries[i];
      if (image && typeof image === 'object' && 'size' in image && (image as any).size > 0) {
        const file = image as File;
        const { key, url } = await uploadImage(r2, file, 'products');
        await addProductImage(
          db,
          id,
          url,
          key,
          formData.get(`image_alt_${i}`) as string | null,
          currentImageCount + i,
          0
        );
      }
    }
    
    // Return product with relations
    const updatedProduct = await getProduct(db, id, true);
    
    return successResponse(updatedProduct, 'Product updated successfully');
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}


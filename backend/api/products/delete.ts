import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';
import { deleteProduct, getProduct } from '../../modules/products';
import { removeImage } from '../../utils/r2';
import { getR2Bucket } from '../../utils/db';

export async function handleDeleteProduct(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = parseInt(pathParts[pathParts.length - 1]);
    
    if (isNaN(id)) {
      return errorResponse('Invalid product ID', 400);
    }
    
    const db = getDb(env);
    const r2 = getR2Bucket(env);
    
    // Check if product has orders before deletion
    const orderItemsCheck = await db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').bind(id).first<{ count: number }>();
    const hasOrders = orderItemsCheck && orderItemsCheck.count > 0;
    
    // Get product images before deletion/archiving
    const product = await getProduct(db, id, true);
    
    if (hasOrders) {
      // Archive product instead of deleting (preserves order history)
      await deleteProduct(db, id, false);
      
      // Delete images from R2 even when archiving (to free up space)
      if (product?.images) {
        for (const image of product.images) {
          try {
            await removeImage(r2, image.image_key);
          } catch (error) {
            console.error(`Error deleting image ${image.image_key}:`, error);
          }
        }
      }
      
      return successResponse(null, `Product archived successfully (had ${orderItemsCheck.count} order item(s)). Product removed from favorites and cart, but order history preserved.`);
    } else {
      // Full deletion (no orders)
      if (product?.images) {
        // Delete images from R2
        for (const image of product.images) {
          try {
            await removeImage(r2, image.image_key);
          } catch (error) {
            console.error(`Error deleting image ${image.image_key}:`, error);
          }
        }
      }
      
      await deleteProduct(db, id, true);
      
      return successResponse(null, 'Product deleted successfully');
    }
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}


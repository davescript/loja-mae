import type { Env } from '../../types';
import { getR2Bucket } from '../../utils/r2';
import { handleCORS } from '../../utils/cors';
import { errorResponse } from '../../utils/response';

export async function handleImageRequest(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Extract image key from path: /api/images/products/123-abc.jpg
    const imageKeyMatch = path.match(/^\/api\/images\/(.+)$/);
    if (!imageKeyMatch) {
      return errorResponse('Invalid image path', 400);
    }
    
    const imageKey = imageKeyMatch[1];
    const r2 = getR2Bucket(env);
    
    // Get image from R2
    const object = await r2.get(imageKey);
    
    if (!object) {
      return errorResponse('Image not found', 404);
    }
    
    // Get content type from object metadata
    const contentType = object.httpMetadata?.contentType || 'image/jpeg';
    const cacheControl = object.httpMetadata?.cacheControl || 'public, max-age=31536000';
    
    // Convert R2 object body to Response
    // object.body is a ReadableStream, which is compatible with Response
    const body = object.body as ReadableStream<Uint8Array> | null;
    
    if (!body) {
      return errorResponse('Image body not available', 500);
    }
    
    // Return image with proper headers
    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return errorResponse('Failed to serve image', 500);
  }
}


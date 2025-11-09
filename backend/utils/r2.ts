import type { R2Bucket } from '@cloudflare/workers-types';

export function getR2Bucket(env: any): R2Bucket {
  if (!env.R2) {
    throw new Error('R2 bucket not available');
  }
  return env.R2;
}

export async function uploadImage(
  r2: R2Bucket,
  file: File,
  folder: string = 'products'
): Promise<{ key: string; url: string }> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.');
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit.');
  }

  // Generate unique key
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop();
  const key = `${folder}/${timestamp}-${random}.${extension}`;

  // Upload to R2 - Convert file to array buffer for R2
  const arrayBuffer = await file.arrayBuffer();
  await r2.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000',
    },
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Generate public URL using Worker proxy route
  // Images will be served via /api/images/{key}
  const publicUrl = generatePublicUrl(key);

  return { key, url: publicUrl };
}

export async function removeImage(r2: R2Bucket, key: string): Promise<void> {
  try {
    await r2.delete(key);
  } catch (error) {
    console.error('Error removing image from R2:', error);
    throw error;
  }
}

export function generatePublicUrl(key: string, publicDomain?: string, apiBaseUrl?: string): string {
  // Use the Worker API to serve images via proxy
  // Format: https://api.leiasabores.pt/api/images/{key}
  // Or: https://loja-mae-api.davecdl.workers.dev/api/images/{key}
  
  // For production, configure a public domain for R2 in Cloudflare Dashboard
  // Then use: https://{public-domain}/{key}
  
  if (publicDomain) {
    return `https://${publicDomain}/${key}`;
  }
  
  // Use Worker proxy route to serve images
  // Default to production API URL
  const baseUrl = apiBaseUrl || 'https://loja-mae-api.davecdl.workers.dev';
  return `${baseUrl}/api/images/${key}`;
}

export async function getImageUrl(
  r2: R2Bucket,
  key: string,
  publicDomain?: string
): Promise<string | null> {
  try {
    const object = await r2.head(key);
    if (!object) {
      return null;
    }
    return generatePublicUrl(key, publicDomain);
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
}


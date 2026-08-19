export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGINS: string;
  ENVIRONMENT: string;
  OPENAI_API_KEY?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string; // Opcional - se não configurado, usa fallback
  CJ_API_KEY?: string;
  CJ_PLATFORM_TOKEN?: string;
  CJ_API_BASE_URL?: string;
  CJ_DEFAULT_WAREHOUSE_COUNTRY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  WORKERS_SUBDOMAIN?: string;
  WORKER_NAME?: string;
  APP_URL?: string;
}

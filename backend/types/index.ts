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
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
}


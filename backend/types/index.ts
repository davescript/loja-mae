export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGINS: string;
  ENVIRONMENT: string;
}


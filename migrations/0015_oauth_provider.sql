-- Migration: OAuth Provider Column
-- Created: 2024-11-18
-- Description: Adiciona campo oauth_provider para identificar método de autenticação OAuth

ALTER TABLE customers ADD COLUMN oauth_provider TEXT CHECK(oauth_provider IN ('google', 'apple'));

CREATE INDEX IF NOT EXISTS idx_customers_oauth_provider ON customers(oauth_provider);


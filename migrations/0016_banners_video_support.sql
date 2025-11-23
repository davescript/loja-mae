-- Migration: Suporte a Vídeos em Banners
-- Created: 2025-01-XX

-- Adicionar campos para suporte a vídeos
ALTER TABLE banners ADD COLUMN media_type TEXT DEFAULT 'image' CHECK(media_type IN ('image', 'video'));
ALTER TABLE banners ADD COLUMN video_url TEXT;
ALTER TABLE banners ADD COLUMN video_poster_url TEXT;

-- Criar índice para busca por tipo de mídia
CREATE INDEX IF NOT EXISTS idx_banners_media_type ON banners(media_type);


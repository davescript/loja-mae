-- Migration: Sistema de Banners para Marketing

CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  position TEXT NOT NULL CHECK(position IN ('home_hero', 'home_top', 'home_bottom', 'category', 'product', 'sidebar')),
  `order` INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(`order`);
CREATE INDEX IF NOT EXISTS idx_banners_start_date ON banners(start_date);
CREATE INDEX IF NOT EXISTS idx_banners_end_date ON banners(end_date);


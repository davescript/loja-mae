-- Migration: Newsletter Subscribers
-- Created: 2025-11-24

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'unsubscribed')),
  source TEXT DEFAULT 'website',
  subscribed_at TEXT DEFAULT (datetime('now')),
  unsubscribed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);

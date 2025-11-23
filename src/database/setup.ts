/**
 * SQLite Database Setup
 * Uses Expo SQLite for offline-first data storage
 */

import * as SQLite from 'expo-sqlite';
import { DB_CONFIG } from '../constants';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and create tables
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DB_CONFIG.NAME);

  // Create catalog_items table (supports Music, Movies, Video Games)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS catalog_items (
      id TEXT PRIMARY KEY,
      upc TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'Music',
      title TEXT NOT NULL,
      year INTEGER,
      genre TEXT,
      cover_art_url TEXT,
      description TEXT,

      -- Music fields
      artist TEXT,
      album TEXT,
      label TEXT,
      track_list TEXT,
      discogs_id TEXT,
      musicbrainz_id TEXT,
      duration INTEGER,

      -- Movie fields
      director TEXT,
      studio TEXT,
      cast TEXT,
      rating TEXT,
      runtime INTEGER,
      tmdb_id TEXT,
      imdb_id TEXT,

      -- Video Game fields
      developer TEXT,
      publisher TEXT,
      game_rating TEXT,
      players TEXT,
      igdb_id TEXT,
      platform TEXT,

      -- Common fields
      format TEXT NOT NULL,
      condition TEXT NOT NULL,
      action_tag TEXT NOT NULL,
      location TEXT,
      notes TEXT,
      photos TEXT,
      quantity INTEGER DEFAULT 1,
      estimated_value REAL,

      -- Collector features
      custom_tags TEXT,
      acquisition_date TEXT,
      purchase_price REAL,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      needs_sync INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_catalog_upc ON catalog_items(upc);
    CREATE INDEX IF NOT EXISTS idx_catalog_media_type ON catalog_items(media_type);
    CREATE INDEX IF NOT EXISTS idx_catalog_action_tag ON catalog_items(action_tag);
    CREATE INDEX IF NOT EXISTS idx_catalog_format ON catalog_items(format);
  `);

  // Add new columns if upgrading from old schema
  await db.execAsync(`
    ALTER TABLE catalog_items ADD COLUMN custom_tags TEXT;
  `).catch(() => {}); // Ignore if column exists

  await db.execAsync(`
    ALTER TABLE catalog_items ADD COLUMN acquisition_date TEXT;
  `).catch(() => {});

  await db.execAsync(`
    ALTER TABLE catalog_items ADD COLUMN purchase_price REAL;
  `).catch(() => {});

  // Create pending_scans table for offline queue
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_scans (
      id TEXT PRIMARY KEY,
      upc TEXT NOT NULL,
      media_type TEXT DEFAULT 'Music',
      scanned_at TEXT NOT NULL,
      pending INTEGER DEFAULT 1,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_pending_scans_pending ON pending_scans(pending);
  `);

  // Create price_data table for marketplace prices
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS price_data (
      upc TEXT PRIMARY KEY,
      media_type TEXT NOT NULL DEFAULT 'Music',
      median_price REAL,
      min_price REAL,
      max_price REAL,
      sample_size INTEGER,
      last_updated TEXT NOT NULL,
      source TEXT NOT NULL
    );
  `);

  // Create wishlist_items table for wanted items
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id TEXT PRIMARY KEY,
      upc TEXT,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      director TEXT,
      developer TEXT,
      format TEXT,
      year INTEGER,
      max_price REAL,
      priority TEXT NOT NULL DEFAULT 'medium',
      notes TEXT,
      cover_art_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_wishlist_media_type ON wishlist_items(media_type);
    CREATE INDEX IF NOT EXISTS idx_wishlist_priority ON wishlist_items(priority);
  `);

  console.log('Database initialized successfully');
  return db;
}

/**
 * Get the database instance
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

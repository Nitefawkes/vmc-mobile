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

  // Create catalog_items table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS catalog_items (
      id TEXT PRIMARY KEY,
      upc TEXT NOT NULL,
      artist TEXT NOT NULL,
      title TEXT NOT NULL,
      album TEXT,
      year INTEGER,
      genre TEXT,
      label TEXT,
      cover_art_url TEXT,
      track_list TEXT,
      discogs_id TEXT,
      musicbrainz_id TEXT,
      format TEXT NOT NULL,
      condition TEXT NOT NULL,
      action_tag TEXT NOT NULL,
      location TEXT,
      notes TEXT,
      photos TEXT,
      quantity INTEGER DEFAULT 1,
      estimated_value REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      needs_sync INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_catalog_upc ON catalog_items(upc);
    CREATE INDEX IF NOT EXISTS idx_catalog_action_tag ON catalog_items(action_tag);
    CREATE INDEX IF NOT EXISTS idx_catalog_format ON catalog_items(format);
  `);

  // Create pending_scans table for offline queue
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_scans (
      id TEXT PRIMARY KEY,
      upc TEXT NOT NULL,
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
      median_price REAL,
      min_price REAL,
      max_price REAL,
      sample_size INTEGER,
      last_updated TEXT NOT NULL,
      source TEXT NOT NULL
    );
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

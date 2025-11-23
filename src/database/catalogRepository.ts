/**
 * Catalog Item Repository
 * CRUD operations for catalog items
 */

import { getDatabase } from './setup';
import { CatalogItem, ActionTag, ItemCondition, MusicFormat } from '../types';

/**
 * Insert a new catalog item
 */
export async function insertCatalogItem(item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO catalog_items (
      id, upc, artist, title, album, year, genre, label,
      cover_art_url, track_list, discogs_id, musicbrainz_id,
      format, condition, action_tag, location, notes, photos,
      quantity, estimated_value, created_at, updated_at, needs_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      item.upc,
      item.metadata.artist,
      item.metadata.title,
      item.metadata.album || null,
      item.metadata.year || null,
      item.metadata.genre ? JSON.stringify(item.metadata.genre) : null,
      item.metadata.label || null,
      item.metadata.coverArtUrl || null,
      item.metadata.trackList ? JSON.stringify(item.metadata.trackList) : null,
      item.metadata.discogsId || null,
      item.metadata.musicbrainzId || null,
      item.format,
      item.condition,
      item.actionTag,
      item.location || null,
      item.notes || null,
      item.photos ? JSON.stringify(item.photos) : null,
      item.quantity,
      item.estimatedValue || null,
      now,
      now,
      item.needsSync ? 1 : 0,
    ]
  );

  return id;
}

/**
 * Get all catalog items with optional filters
 */
export async function getCatalogItems(filters?: {
  format?: MusicFormat;
  actionTag?: ActionTag;
  searchQuery?: string;
}): Promise<CatalogItem[]> {
  const db = getDatabase();
  let query = 'SELECT * FROM catalog_items WHERE 1=1';
  const params: any[] = [];

  if (filters?.format) {
    query += ' AND format = ?';
    params.push(filters.format);
  }

  if (filters?.actionTag) {
    query += ' AND action_tag = ?';
    params.push(filters.actionTag);
  }

  if (filters?.searchQuery) {
    query += ' AND (artist LIKE ? OR title LIKE ? OR album LIKE ?)';
    const searchTerm = `%${filters.searchQuery}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC';

  const rows = await db.getAllAsync(query, params);
  return rows.map(mapRowToCatalogItem);
}

/**
 * Get a single catalog item by ID
 */
export async function getCatalogItemById(id: string): Promise<CatalogItem | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM catalog_items WHERE id = ?', [id]);
  return row ? mapRowToCatalogItem(row) : null;
}

/**
 * Update a catalog item
 */
export async function updateCatalogItem(id: string, updates: Partial<CatalogItem>): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.condition) {
    setClauses.push('condition = ?');
    params.push(updates.condition);
  }

  if (updates.actionTag) {
    setClauses.push('action_tag = ?');
    params.push(updates.actionTag);
  }

  if (updates.location !== undefined) {
    setClauses.push('location = ?');
    params.push(updates.location);
  }

  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    params.push(updates.notes);
  }

  if (updates.quantity !== undefined) {
    setClauses.push('quantity = ?');
    params.push(updates.quantity);
  }

  if (updates.estimatedValue !== undefined) {
    setClauses.push('estimated_value = ?');
    params.push(updates.estimatedValue);
  }

  if (updates.photos) {
    setClauses.push('photos = ?');
    params.push(JSON.stringify(updates.photos));
  }

  setClauses.push('updated_at = ?');
  params.push(now);

  params.push(id);

  await db.runAsync(
    `UPDATE catalog_items SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Delete a catalog item
 */
export async function deleteCatalogItem(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM catalog_items WHERE id = ?', [id]);
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<{
  totalItems: number;
  itemsToSell: number;
  itemsToDonate: number;
  estimatedTotal: number;
}> {
  const db = getDatabase();

  const totalResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM catalog_items');
  const sellResult = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM catalog_items WHERE action_tag = ?',
    [ActionTag.SELL]
  );
  const donateResult = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM catalog_items WHERE action_tag = ?',
    [ActionTag.DONATE]
  );
  const valueResult = await db.getFirstAsync(
    'SELECT SUM(estimated_value * quantity) as total FROM catalog_items WHERE action_tag = ?',
    [ActionTag.SELL]
  );

  return {
    totalItems: (totalResult as any)?.count || 0,
    itemsToSell: (sellResult as any)?.count || 0,
    itemsToDonate: (donateResult as any)?.count || 0,
    estimatedTotal: (valueResult as any)?.total || 0,
  };
}

/**
 * Helper: Map database row to CatalogItem
 */
function mapRowToCatalogItem(row: any): CatalogItem {
  return {
    id: row.id,
    upc: row.upc,
    metadata: {
      upc: row.upc,
      artist: row.artist,
      title: row.title,
      album: row.album,
      year: row.year,
      genre: row.genre ? JSON.parse(row.genre) : undefined,
      label: row.label,
      coverArtUrl: row.cover_art_url,
      trackList: row.track_list ? JSON.parse(row.track_list) : undefined,
      discogsId: row.discogs_id,
      musicbrainzId: row.musicbrainz_id,
    },
    format: row.format,
    condition: row.condition,
    actionTag: row.action_tag,
    location: row.location,
    notes: row.notes,
    photos: row.photos ? JSON.parse(row.photos) : undefined,
    quantity: row.quantity,
    estimatedValue: row.estimated_value,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    needsSync: row.needs_sync === 1,
  };
}

/**
 * Helper: Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

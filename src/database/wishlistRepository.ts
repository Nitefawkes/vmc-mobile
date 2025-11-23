/**
 * Wishlist Repository
 * CRUD operations for wishlist items (wanted items)
 */

import { getDatabase } from './setup';
import { WishlistItem, MediaType, MusicFormat, MovieFormat, GamePlatform } from '../types';

/**
 * Insert a new wishlist item
 */
export async function insertWishlistItem(
  item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO wishlist_items (
      id, upc, media_type, title, artist, director, developer,
      format, year, max_price, priority, notes, cover_art_url,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      item.upc || null,
      item.mediaType,
      item.title,
      item.artist || null,
      item.director || null,
      item.developer || null,
      item.format || null,
      item.year || null,
      item.maxPrice || null,
      item.priority,
      item.notes || null,
      item.coverArtUrl || null,
      now,
      now,
    ]
  );

  return id;
}

/**
 * Get all wishlist items with optional filters
 */
export async function getWishlistItems(filters?: {
  mediaType?: MediaType;
  priority?: 'low' | 'medium' | 'high';
}): Promise<WishlistItem[]> {
  const db = getDatabase();
  let query = 'SELECT * FROM wishlist_items WHERE 1=1';
  const params: any[] = [];

  if (filters?.mediaType) {
    query += ' AND media_type = ?';
    params.push(filters.mediaType);
  }

  if (filters?.priority) {
    query += ' AND priority = ?';
    params.push(filters.priority);
  }

  query += ' ORDER BY priority DESC, created_at DESC';

  const rows = await db.getAllAsync(query, params);
  return rows.map(mapRowToWishlistItem);
}

/**
 * Get a single wishlist item by ID
 */
export async function getWishlistItemById(id: string): Promise<WishlistItem | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM wishlist_items WHERE id = ?', [id]);
  return row ? mapRowToWishlistItem(row) : null;
}

/**
 * Update a wishlist item
 */
export async function updateWishlistItem(
  id: string,
  updates: Partial<WishlistItem>
): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    params.push(updates.title);
  }

  if (updates.maxPrice !== undefined) {
    setClauses.push('max_price = ?');
    params.push(updates.maxPrice);
  }

  if (updates.priority !== undefined) {
    setClauses.push('priority = ?');
    params.push(updates.priority);
  }

  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    params.push(updates.notes);
  }

  setClauses.push('updated_at = ?');
  params.push(now);

  params.push(id);

  await db.runAsync(
    `UPDATE wishlist_items SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Delete a wishlist item
 */
export async function deleteWishlistItem(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM wishlist_items WHERE id = ?', [id]);
}

/**
 * Get wishlist statistics
 */
export async function getWishlistStats(): Promise<{
  totalItems: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  totalBudget: number;
  byMediaType: Record<MediaType, number>;
}> {
  const db = getDatabase();

  const totalResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM wishlist_items');
  const highPriorityResult = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM wishlist_items WHERE priority = ?',
    ['high']
  );
  const mediumPriorityResult = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM wishlist_items WHERE priority = ?',
    ['medium']
  );
  const lowPriorityResult = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM wishlist_items WHERE priority = ?',
    ['low']
  );
  const budgetResult = await db.getFirstAsync(
    'SELECT SUM(max_price) as total FROM wishlist_items WHERE max_price IS NOT NULL'
  );

  // Count by media type
  const musicCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM wishlist_items WHERE media_type = ?',
    [MediaType.MUSIC]
  );
  const movieCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM wishlist_items WHERE media_type = ?',
    [MediaType.MOVIE]
  );
  const gameCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM wishlist_items WHERE media_type = ?',
    [MediaType.VIDEO_GAME]
  );

  return {
    totalItems: (totalResult as any)?.count || 0,
    highPriority: (highPriorityResult as any)?.count || 0,
    mediumPriority: (mediumPriorityResult as any)?.count || 0,
    lowPriority: (lowPriorityResult as any)?.count || 0,
    totalBudget: (budgetResult as any)?.total || 0,
    byMediaType: {
      [MediaType.MUSIC]: (musicCount as any)?.count || 0,
      [MediaType.MOVIE]: (movieCount as any)?.count || 0,
      [MediaType.VIDEO_GAME]: (gameCount as any)?.count || 0,
    },
  };
}

/**
 * Check if an item is in wishlist by UPC
 */
export async function checkWishlistByUpc(upc: string): Promise<WishlistItem | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync(
    'SELECT * FROM wishlist_items WHERE upc = ? LIMIT 1',
    [upc]
  );
  return row ? mapRowToWishlistItem(row) : null;
}

/**
 * Helper: Map database row to WishlistItem
 */
function mapRowToWishlistItem(row: any): WishlistItem {
  return {
    id: row.id,
    upc: row.upc,
    mediaType: row.media_type as MediaType,
    title: row.title,
    artist: row.artist,
    director: row.director,
    developer: row.developer,
    format: row.format as MusicFormat | MovieFormat | GamePlatform | undefined,
    year: row.year,
    maxPrice: row.max_price,
    priority: row.priority as 'low' | 'medium' | 'high',
    notes: row.notes,
    coverArtUrl: row.cover_art_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Helper: Generate unique ID
 */
function generateId(): string {
  return `wl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

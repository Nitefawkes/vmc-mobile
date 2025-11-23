/**
 * Catalog Item Repository - Multi-Media Support
 * CRUD operations for Music, Movies, and Video Games
 */

import { getDatabase } from './setup';
import {
  CatalogItem,
  ActionTag,
  ItemCondition,
  MediaType,
  MusicFormat,
  MovieFormat,
  GamePlatform,
  MusicMetadata,
  MovieMetadata,
  GameMetadata,
  isMusicMetadata,
  isMovieMetadata,
  isGameMetadata,
  getMediaTypeFromFormat,
} from '../types';

/**
 * Insert a new catalog item (supports all media types)
 */
export async function insertCatalogItem(
  item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  const metadata = item.metadata;
  const mediaType = item.mediaType;

  // Build column list and values based on media type
  const columns = [
    'id', 'upc', 'media_type', 'title', 'year', 'genre',
    'cover_art_url', 'description', 'format', 'condition', 'action_tag',
    'location', 'notes', 'photos', 'quantity', 'estimated_value',
    'created_at', 'updated_at', 'needs_sync'
  ];

  const values: any[] = [
    id,
    item.upc,
    mediaType,
    metadata.title,
    metadata.year || null,
    metadata.genre ? JSON.stringify(metadata.genre) : null,
    metadata.coverArtUrl || null,
    metadata.description || null,
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
  ];

  // Add media-specific fields
  if (isMusicMetadata(metadata)) {
    columns.push('artist', 'album', 'label', 'track_list', 'discogs_id', 'musicbrainz_id', 'duration');
    values.push(
      metadata.artist,
      metadata.album || null,
      metadata.label || null,
      metadata.trackList ? JSON.stringify(metadata.trackList) : null,
      metadata.discogsId || null,
      metadata.musicbrainzId || null,
      metadata.duration || null
    );
  } else if (isMovieMetadata(metadata)) {
    columns.push('director', 'studio', 'cast', 'rating', 'runtime', 'tmdb_id', 'imdb_id');
    values.push(
      metadata.director || null,
      metadata.studio || null,
      metadata.cast ? JSON.stringify(metadata.cast) : null,
      metadata.rating || null,
      metadata.runtime || null,
      metadata.tmdbId || null,
      metadata.imdbId || null
    );
  } else if (isGameMetadata(metadata)) {
    columns.push('developer', 'publisher', 'game_rating', 'players', 'igdb_id', 'platform');
    values.push(
      metadata.developer || null,
      metadata.publisher || null,
      metadata.rating || null,
      metadata.players || null,
      metadata.igdbId || null,
      metadata.platform || null
    );
  }

  const placeholders = values.map(() => '?').join(', ');
  const query = `INSERT INTO catalog_items (${columns.join(', ')}) VALUES (${placeholders})`;

  await db.runAsync(query, values);
  return id;
}

/**
 * Get all catalog items with optional filters
 */
export async function getCatalogItems(filters?: {
  mediaType?: MediaType;
  format?: MusicFormat | MovieFormat | GamePlatform;
  actionTag?: ActionTag;
  searchQuery?: string;
}): Promise<CatalogItem[]> {
  const db = getDatabase();
  let query = 'SELECT * FROM catalog_items WHERE 1=1';
  const params: any[] = [];

  if (filters?.mediaType) {
    query += ' AND media_type = ?';
    params.push(filters.mediaType);
  }

  if (filters?.format) {
    query += ' AND format = ?';
    params.push(filters.format);
  }

  if (filters?.actionTag) {
    query += ' AND action_tag = ?';
    params.push(filters.actionTag);
  }

  if (filters?.searchQuery) {
    // Search across all media type fields
    query += ` AND (
      title LIKE ? OR
      artist LIKE ? OR
      album LIKE ? OR
      director LIKE ? OR
      studio LIKE ? OR
      developer LIKE ? OR
      publisher LIKE ?
    )`;
    const searchTerm = `%${filters.searchQuery}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
export async function updateCatalogItem(
  id: string,
  updates: Partial<CatalogItem>
): Promise<void> {
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
  byMediaType: Record<MediaType, number>;
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

  // Count by media type
  const musicCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM catalog_items WHERE media_type = ?',
    [MediaType.MUSIC]
  );
  const movieCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM catalog_items WHERE media_type = ?',
    [MediaType.MOVIE]
  );
  const gameCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM catalog_items WHERE media_type = ?',
    [MediaType.VIDEO_GAME]
  );

  return {
    totalItems: (totalResult as any)?.count || 0,
    itemsToSell: (sellResult as any)?.count || 0,
    itemsToDonate: (donateResult as any)?.count || 0,
    estimatedTotal: (valueResult as any)?.total || 0,
    byMediaType: {
      [MediaType.MUSIC]: (musicCount as any)?.count || 0,
      [MediaType.MOVIE]: (movieCount as any)?.count || 0,
      [MediaType.VIDEO_GAME]: (gameCount as any)?.count || 0,
    },
  };
}

/**
 * Helper: Map database row to CatalogItem
 */
function mapRowToCatalogItem(row: any): CatalogItem {
  const mediaType = row.media_type as MediaType;
  let metadata: MusicMetadata | MovieMetadata | GameMetadata;

  // Build metadata based on media type
  if (mediaType === MediaType.MUSIC) {
    metadata = {
      upc: row.upc,
      title: row.title,
      artist: row.artist || 'Unknown Artist',
      album: row.album,
      year: row.year,
      genre: row.genre ? JSON.parse(row.genre) : undefined,
      label: row.label,
      coverArtUrl: row.cover_art_url,
      description: row.description,
      trackList: row.track_list ? JSON.parse(row.track_list) : undefined,
      discogsId: row.discogs_id,
      musicbrainzId: row.musicbrainz_id,
      duration: row.duration,
    } as MusicMetadata;
  } else if (mediaType === MediaType.MOVIE) {
    metadata = {
      upc: row.upc,
      title: row.title,
      year: row.year,
      genre: row.genre ? JSON.parse(row.genre) : undefined,
      coverArtUrl: row.cover_art_url,
      description: row.description,
      director: row.director,
      studio: row.studio,
      cast: row.cast ? JSON.parse(row.cast) : undefined,
      rating: row.rating,
      runtime: row.runtime,
      tmdbId: row.tmdb_id,
      imdbId: row.imdb_id,
    } as MovieMetadata;
  } else {
    // Video Game
    metadata = {
      upc: row.upc,
      title: row.title,
      year: row.year,
      genre: row.genre ? JSON.parse(row.genre) : undefined,
      coverArtUrl: row.cover_art_url,
      description: row.description,
      developer: row.developer,
      publisher: row.publisher,
      rating: row.game_rating,
      players: row.players,
      igdbId: row.igdb_id,
      platform: row.platform,
    } as GameMetadata;
  }

  return {
    id: row.id,
    upc: row.upc,
    mediaType,
    metadata,
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

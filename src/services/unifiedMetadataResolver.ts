/**
 * Unified Metadata Resolver
 * Routes UPC lookups to the appropriate API based on media type
 */

import { MediaType, ItemMetadata, MusicMetadata, MovieMetadata, GameMetadata } from '../types';
import { resolveMetadata as resolveMusicMetadata } from './metadataResolver';
import { resolveMovieMetadata } from './movieMetadataResolver';
import { resolveGameMetadata } from './gameMetadataResolver';

/**
 * Main unified resolver - routes to correct service based on media type
 */
export async function resolveMetadataUnified(
  upc: string,
  mediaType: MediaType
): Promise<ItemMetadata | null> {
  console.log(`[UnifiedMetadataResolver] Resolving ${mediaType} UPC: ${upc}`);
  const startTime = Date.now();

  let metadata: ItemMetadata | null = null;

  try {
    switch (mediaType) {
      case MediaType.MUSIC:
        metadata = await resolveMusicMetadata(upc) as MusicMetadata | null;
        break;

      case MediaType.MOVIE:
        metadata = await resolveMovieMetadata(upc);
        break;

      case MediaType.VIDEO_GAME:
        metadata = await resolveGameMetadata(upc);
        break;

      default:
        console.error(`[UnifiedMetadataResolver] Unknown media type: ${mediaType}`);
        return null;
    }

    const duration = Date.now() - startTime;

    if (metadata) {
      console.log(`[UnifiedMetadataResolver] Success for ${mediaType} in ${duration}ms`);
    } else {
      console.warn(`[UnifiedMetadataResolver] No metadata found for ${mediaType} after ${duration}ms`);
    }

    return metadata;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[UnifiedMetadataResolver] Error for ${mediaType} after ${duration}ms:`, error);
    return null;
  }
}

/**
 * Batch resolve multiple UPCs of the same media type
 */
export async function resolveBatchUnified(
  items: Array<{ upc: string; mediaType: MediaType }>
): Promise<Map<string, ItemMetadata | null>> {
  const results = new Map<string, ItemMetadata | null>();

  for (const item of items) {
    const metadata = await resolveMetadataUnified(item.upc, item.mediaType);
    results.set(item.upc, metadata);

    // Rate limiting - wait 1 second between requests to respect API limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Auto-detect media type from UPC (basic heuristic)
 * Returns null if detection is uncertain - user should select manually
 *
 * Note: This is NOT reliable. UPCs don't contain media type information.
 * In production, use:
 * 1. User selection (recommended)
 * 2. UPC database lookup service
 * 3. Machine learning on UPC patterns
 */
export function detectMediaTypeFromUPC(upc: string): MediaType | null {
  // This is a placeholder - UPC alone cannot reliably determine media type
  // The user should always select the media type manually

  console.warn('[UnifiedMetadataResolver] Auto-detection not reliable - user should select media type');
  return null;
}

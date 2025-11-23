/**
 * Video Game Metadata Resolver Service
 *
 * Note: IGDB (Twitch) API requires OAuth2 authentication which is complex for mobile apps.
 * This implementation provides a fallback system for now.
 *
 * Future improvements:
 * - Implement IGDB OAuth2 flow with secure token storage
 * - Use UPC database lookup service
 * - Integrate with PriceCharting API (has UPC support)
 */

import { GameMetadata, GamePlatform, GameRating } from '../types';

/**
 * Resolve video game metadata by UPC
 * Currently returns fallback metadata - requires UPC database or IGDB integration
 */
export async function resolveGameMetadata(upc: string): Promise<GameMetadata | null> {
  console.log(`[GameMetadataResolver] Resolving UPC: ${upc}`);
  const startTime = Date.now();

  // IGDB requires OAuth2 authentication which is complex for mobile apps
  // Options for future implementation:
  // 1. IGDB API with OAuth2 flow
  // 2. PriceCharting API (has UPC support for games)
  // 3. UPC database lookup service
  // 4. Backend proxy service to handle authentication

  const duration = Date.now() - startTime;
  console.warn(`[GameMetadataResolver] UPC lookup not implemented, using fallback (${duration}ms)`);

  return createFallbackGameMetadata(upc);
}

/**
 * Query by game title (for manual search - future implementation)
 */
export async function queryGameByTitle(
  title: string,
  platform?: GamePlatform
): Promise<GameMetadata | null> {
  console.log(`[GameMetadataResolver] Title search not implemented: ${title}`);
  return null;
}

/**
 * Create fallback game metadata when API lookup fails
 */
function createFallbackGameMetadata(upc: string): GameMetadata {
  return {
    upc,
    title: 'Unknown Game',
    description: 'Metadata not found. Please edit manually and specify the platform.',
  };
}

/**
 * Helper: Detect likely platform from UPC prefix (very basic heuristic)
 * This is NOT reliable but can provide a starting guess
 */
export function detectPlatformFromUPC(upc: string): GamePlatform | undefined {
  // Common UPC prefixes (these are examples, not comprehensive)
  // Nintendo products often start with 045496
  // Sony products often start with 711719
  // Microsoft products often start with 885370

  if (upc.startsWith('045496')) {
    return GamePlatform.SWITCH; // Recent Nintendo
  } else if (upc.startsWith('711719')) {
    return GamePlatform.PS5; // Recent Sony
  } else if (upc.startsWith('885370')) {
    return GamePlatform.XBOX_SERIES; // Recent Microsoft
  }

  // Default to undefined - user must select
  return undefined;
}

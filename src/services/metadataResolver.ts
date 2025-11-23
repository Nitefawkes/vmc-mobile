/**
 * Metadata Resolver Service
 * Cascade lookup: Discogs → MusicBrainz → Fallback
 * Target: 90% success rate, median response ≤ 600ms
 */

import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../constants';
import { ItemMetadata, DiscogsRelease, MusicBrainzRelease } from '../types';

const discogsClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.DISCOGS_BASE_URL,
  timeout: API_CONFIG.METADATA_RESOLVER_TIMEOUT,
  headers: {
    'User-Agent': 'VintageMusicCatalog/1.0',
  },
});

const musicBrainzClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.MUSICBRAINZ_BASE_URL,
  timeout: API_CONFIG.METADATA_RESOLVER_TIMEOUT,
  headers: {
    'User-Agent': 'VintageMusicCatalog/1.0 (contact@vmc.app)',
  },
});

/**
 * Main resolver function - tries Discogs first, then MusicBrainz
 */
export async function resolveMetadata(upc: string): Promise<ItemMetadata | null> {
  console.log(`[MetadataResolver] Resolving UPC: ${upc}`);
  const startTime = Date.now();

  try {
    // Try Discogs first
    const discogsData = await queryDiscogs(upc);
    if (discogsData) {
      const duration = Date.now() - startTime;
      console.log(`[MetadataResolver] Discogs success in ${duration}ms`);
      return discogsData;
    }
  } catch (error) {
    console.warn('[MetadataResolver] Discogs failed:', error);
  }

  try {
    // Fallback to MusicBrainz
    const musicBrainzData = await queryMusicBrainz(upc);
    if (musicBrainzData) {
      const duration = Date.now() - startTime;
      console.log(`[MetadataResolver] MusicBrainz success in ${duration}ms`);
      return musicBrainzData;
    }
  } catch (error) {
    console.warn('[MetadataResolver] MusicBrainz failed:', error);
  }

  // All lookups failed
  const duration = Date.now() - startTime;
  console.error(`[MetadataResolver] All lookups failed for ${upc} after ${duration}ms`);
  return null;
}

/**
 * Query Discogs API by UPC barcode
 */
async function queryDiscogs(upc: string): Promise<ItemMetadata | null> {
  try {
    // Search by barcode
    const searchResponse = await discogsClient.get('/database/search', {
      params: {
        barcode: upc,
        type: 'release',
      },
    });

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return null;
    }

    // Get the first result
    const firstResult = searchResponse.data.results[0];

    // Fetch full release details
    const releaseResponse = await discogsClient.get(`/releases/${firstResult.id}`);
    const release: DiscogsRelease = releaseResponse.data;

    return normalizeDiscogsRelease(release, upc);
  } catch (error) {
    console.error('[Discogs] Query error:', error);
    return null;
  }
}

/**
 * Query MusicBrainz API by UPC barcode
 */
async function queryMusicBrainz(upc: string): Promise<ItemMetadata | null> {
  try {
    const response = await musicBrainzClient.get('/release', {
      params: {
        query: `barcode:${upc}`,
        fmt: 'json',
      },
    });

    if (!response.data.releases || response.data.releases.length === 0) {
      return null;
    }

    const release: MusicBrainzRelease = response.data.releases[0];
    return normalizeMusicBrainzRelease(release, upc);
  } catch (error) {
    console.error('[MusicBrainz] Query error:', error);
    return null;
  }
}

/**
 * Normalize Discogs release to ItemMetadata
 */
function normalizeDiscogsRelease(release: DiscogsRelease, upc: string): ItemMetadata {
  const coverArt = release.images?.find((img) => img.type === 'primary') || release.images?.[0];

  return {
    upc,
    artist: release.artists?.map((a) => a.name).join(', ') || 'Unknown Artist',
    title: release.title || 'Unknown Title',
    year: release.year,
    genre: release.genres,
    label: release.labels?.[0]?.name,
    coverArtUrl: coverArt?.uri,
    trackList: release.tracklist?.map((t) => `${t.position}. ${t.title}`),
    discogsId: release.id.toString(),
  };
}

/**
 * Normalize MusicBrainz release to ItemMetadata
 */
function normalizeMusicBrainzRelease(release: MusicBrainzRelease, upc: string): ItemMetadata {
  const year = release.date ? parseInt(release.date.substring(0, 4), 10) : undefined;

  return {
    upc,
    artist: release['artist-credit']?.map((a) => a.name).join(', ') || 'Unknown Artist',
    title: release.title || 'Unknown Title',
    year,
    label: release['label-info']?.[0]?.label?.name,
    musicbrainzId: release.id,
  };
}

/**
 * Batch resolve multiple UPCs (for offline sync)
 */
export async function resolveBatch(upcs: string[]): Promise<Map<string, ItemMetadata | null>> {
  const results = new Map<string, ItemMetadata | null>();

  for (const upc of upcs) {
    const metadata = await resolveMetadata(upc);
    results.set(upc, metadata);

    // Rate limiting - wait 1 second between requests to respect API limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Core Type Definitions for VMC Mobile
 */

// Item condition types
export enum ItemCondition {
  MINT = 'Mint',
  NEAR_MINT = 'Near Mint',
  VERY_GOOD = 'Very Good',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
}

// Action tags for items
export enum ActionTag {
  SELL = 'SELL',
  DONATE = 'DONATE',
  KEEP = 'KEEP',
  UNDECIDED = 'UNDECIDED',
}

// Format types
export enum MusicFormat {
  CASSETTE = 'Cassette',
  VINYL = 'Vinyl',
  CD = 'CD',
  EIGHT_TRACK = '8-Track',
  REEL_TO_REEL = 'Reel-to-Reel',
}

// Item metadata from external APIs
export interface ItemMetadata {
  upc?: string;
  artist: string;
  title: string;
  album?: string;
  year?: number;
  genre?: string[];
  label?: string;
  coverArtUrl?: string;
  trackList?: string[];
  discogsId?: string;
  musicbrainzId?: string;
}

// Scanned item in the catalog
export interface CatalogItem {
  id: string;
  upc: string;
  metadata: ItemMetadata;
  format: MusicFormat;
  condition: ItemCondition;
  actionTag: ActionTag;
  location?: string;
  notes?: string;
  photos?: string[];
  quantity: number;
  estimatedValue?: number;
  createdAt: Date;
  updatedAt: Date;
  needsSync: boolean;
}

// Pending scan queue item
export interface PendingScan {
  id: string;
  upc: string;
  scannedAt: Date;
  pending: boolean;
  retryCount: number;
  lastError?: string;
}

// Marketplace price data
export interface PriceData {
  upc: string;
  medianPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  sampleSize: number;
  lastUpdated: Date;
  source: 'discogs' | 'ebay' | 'aggregate';
}

// External API response types
export interface DiscogsRelease {
  id: number;
  title: string;
  artists: Array<{ name: string }>;
  year?: number;
  genres?: string[];
  labels?: Array<{ name: string }>;
  images?: Array<{ uri: string; type: string }>;
  tracklist?: Array<{ title: string; position: string }>;
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  'artist-credit': Array<{ name: string }>;
  date?: string;
  'label-info'?: Array<{ label: { name: string } }>;
}

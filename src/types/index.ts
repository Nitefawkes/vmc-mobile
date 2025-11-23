/**
 * Core Type Definitions for VMC Mobile
 * Expanded to support Music, Movies, and Video Games
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

// Media type categories
export enum MediaType {
  MUSIC = 'Music',
  MOVIE = 'Movie',
  VIDEO_GAME = 'Video Game',
}

// Music formats
export enum MusicFormat {
  CASSETTE = 'Cassette',
  VINYL = 'Vinyl',
  CD = 'CD',
  EIGHT_TRACK = '8-Track',
  REEL_TO_REEL = 'Reel-to-Reel',
}

// Movie formats
export enum MovieFormat {
  VHS = 'VHS',
  DVD = 'DVD',
  BLU_RAY = 'Blu-ray',
  LASERDISC = 'LaserDisc',
  FOUR_K_UHD = '4K UHD',
}

// Video game formats/platforms
export enum GamePlatform {
  // Nintendo
  NES = 'NES',
  SNES = 'SNES',
  N64 = 'N64',
  GAMECUBE = 'GameCube',
  WII = 'Wii',
  WII_U = 'Wii U',
  SWITCH = 'Switch',
  GAME_BOY = 'Game Boy',
  GBA = 'Game Boy Advance',
  DS = 'Nintendo DS',
  THREE_DS = '3DS',

  // Sony
  PLAYSTATION = 'PlayStation',
  PS2 = 'PlayStation 2',
  PS3 = 'PlayStation 3',
  PS4 = 'PlayStation 4',
  PS5 = 'PlayStation 5',
  PSP = 'PSP',
  PS_VITA = 'PS Vita',

  // Microsoft
  XBOX = 'Xbox',
  XBOX_360 = 'Xbox 360',
  XBOX_ONE = 'Xbox One',
  XBOX_SERIES = 'Xbox Series X/S',

  // Sega
  GENESIS = 'Sega Genesis',
  SATURN = 'Sega Saturn',
  DREAMCAST = 'Dreamcast',
  GAME_GEAR = 'Game Gear',

  // Atari
  ATARI_2600 = 'Atari 2600',
  ATARI_7800 = 'Atari 7800',

  // PC
  PC = 'PC',
}

// Movie ratings
export enum MovieRating {
  G = 'G',
  PG = 'PG',
  PG_13 = 'PG-13',
  R = 'R',
  NC_17 = 'NC-17',
  UNRATED = 'Unrated',
  NOT_RATED = 'Not Rated',
}

// Game ratings (ESRB)
export enum GameRating {
  EC = 'Early Childhood',
  E = 'Everyone',
  E10 = 'Everyone 10+',
  T = 'Teen',
  M = 'Mature 17+',
  AO = 'Adults Only 18+',
  RP = 'Rating Pending',
}

// Base metadata interface
export interface BaseMetadata {
  upc?: string;
  title: string;
  year?: number;
  genre?: string[];
  coverArtUrl?: string;
  description?: string;
}

// Music-specific metadata
export interface MusicMetadata extends BaseMetadata {
  artist: string;
  album?: string;
  label?: string;
  trackList?: string[];
  discogsId?: string;
  musicbrainzId?: string;
  duration?: number; // in seconds
}

// Movie-specific metadata
export interface MovieMetadata extends BaseMetadata {
  director?: string;
  studio?: string;
  cast?: string[];
  rating?: MovieRating;
  runtime?: number; // in minutes
  tmdbId?: string;
  imdbId?: string;
}

// Video game-specific metadata
export interface GameMetadata extends BaseMetadata {
  developer?: string;
  publisher?: string;
  rating?: GameRating;
  players?: string; // e.g., "1-4 players"
  igdbId?: string;
  platform?: GamePlatform;
}

// Union type for all metadata
export type ItemMetadata = MusicMetadata | MovieMetadata | GameMetadata;

// Type guards
export function isMusicMetadata(metadata: ItemMetadata): metadata is MusicMetadata {
  return 'artist' in metadata;
}

export function isMovieMetadata(metadata: ItemMetadata): metadata is MovieMetadata {
  return 'director' in metadata || 'cast' in metadata;
}

export function isGameMetadata(metadata: ItemMetadata): metadata is GameMetadata {
  return 'developer' in metadata || 'publisher' in metadata;
}

// Scanned item in the catalog
export interface CatalogItem {
  id: string;
  upc: string;
  mediaType: MediaType;
  metadata: ItemMetadata;
  format: MusicFormat | MovieFormat | GamePlatform;
  condition: ItemCondition;
  actionTag: ActionTag;
  location?: string;
  notes?: string;
  photos?: string[];
  customTags?: string[]; // Custom organizational tags
  quantity: number;
  estimatedValue?: number;
  acquisitionDate?: Date; // When item was acquired
  purchasePrice?: number; // Original purchase price
  createdAt: Date;
  updatedAt: Date;
  needsSync: boolean;
}

// Wishlist item - items collector wants to acquire
export interface WishlistItem {
  id: string;
  upc?: string; // Optional - might not know UPC yet
  mediaType: MediaType;
  title: string;
  artist?: string; // For music
  director?: string; // For movies
  developer?: string; // For games
  format?: MusicFormat | MovieFormat | GamePlatform;
  year?: number;
  maxPrice?: number; // Maximum willing to pay
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  coverArtUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pending scan queue item
export interface PendingScan {
  id: string;
  upc: string;
  mediaType?: MediaType;
  scannedAt: Date;
  pending: boolean;
  retryCount: number;
  lastError?: string;
}

// Marketplace price data
export interface PriceData {
  upc: string;
  mediaType: MediaType;
  medianPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  sampleSize: number;
  lastUpdated: Date;
  source: 'discogs' | 'ebay' | 'pricecharting' | 'aggregate';
}

// External API response types

// Discogs (Music)
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

// MusicBrainz (Music)
export interface MusicBrainzRelease {
  id: string;
  title: string;
  'artist-credit': Array<{ name: string }>;
  date?: string;
  'label-info'?: Array<{ label: { name: string } }>;
}

// TMDb (Movies)
export interface TMDbMovie {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  vote_average?: number;
  imdb_id?: string;
}

// OMDb (Movies - alternative)
export interface OMDbMovie {
  Title: string;
  Year: string;
  Rated?: string;
  Director?: string;
  Actors?: string;
  Plot?: string;
  Poster?: string;
  Genre?: string;
  Runtime?: string;
  imdbRating?: string;
  imdbID?: string;
  Response?: string;
}

// IGDB (Video Games)
export interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  cover?: { url: string };
  genres?: Array<{ name: string }>;
  release_dates?: Array<{ human: string }>;
  involved_companies?: Array<{ company: { name: string }; developer: boolean; publisher: boolean }>;
  platforms?: Array<{ name: string }>;
}

// Helper function to get format options by media type
export function getFormatOptions(mediaType: MediaType): Array<MusicFormat | MovieFormat | GamePlatform> {
  switch (mediaType) {
    case MediaType.MUSIC:
      return Object.values(MusicFormat);
    case MediaType.MOVIE:
      return Object.values(MovieFormat);
    case MediaType.VIDEO_GAME:
      return Object.values(GamePlatform);
    default:
      return [];
  }
}

// Helper to get media type from format
export function getMediaTypeFromFormat(
  format: MusicFormat | MovieFormat | GamePlatform
): MediaType {
  if (Object.values(MusicFormat).includes(format as MusicFormat)) {
    return MediaType.MUSIC;
  }
  if (Object.values(MovieFormat).includes(format as MovieFormat)) {
    return MediaType.MOVIE;
  }
  return MediaType.VIDEO_GAME;
}

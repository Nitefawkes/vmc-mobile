/**
 * App-wide constants
 */

// API endpoints
export const API_CONFIG = {
  // Music APIs
  DISCOGS_BASE_URL: 'https://api.discogs.com',
  MUSICBRAINZ_BASE_URL: 'https://musicbrainz.org/ws/2',

  // Movie APIs
  OMDB_BASE_URL: 'https://www.omdbapi.com',
  OMDB_API_KEY: '', // User needs to add their own key from omdbapi.com

  // Video Game APIs
  // Note: IGDB requires OAuth2, implement later if needed

  METADATA_RESOLVER_TIMEOUT: 10000, // 10 seconds
  MAX_RETRY_ATTEMPTS: 3,
};

// Database
export const DB_CONFIG = {
  NAME: 'vmc.db',
  VERSION: 1,
};

// Scan settings
export const SCAN_CONFIG = {
  TARGET_SCAN_TIME: 5000, // 5 seconds from scan to save
  DECODE_ACCURACY_TARGET: 0.95, // 95% accuracy
  SUPPORTED_BARCODE_FORMATS: ['upc_a', 'upc_e', 'ean_13', 'ean_8'],
  HAPTIC_FEEDBACK_ENABLED: true,
};

// Sync settings
export const SYNC_CONFIG = {
  MAX_OFFLINE_DAYS: 3, // Show warning after 3 days
  BATCH_SIZE: 10, // Process 10 items per sync batch
  SYNC_INTERVAL: 300000, // 5 minutes
};

// Value engine thresholds
export const VALUE_CONFIG = {
  DEFAULT_SELL_THRESHOLD: 10, // $10 default threshold
  ALWAYS_SELL_DUPLICATES: true,
};

// UI/UX
export const UI_CONFIG = {
  RAPID_MODE_DEFAULT: false,
  ITEMS_PER_PAGE: 20,
  THEME: {
    PRIMARY: '#1a1a2e',
    SECONDARY: '#16213e',
    ACCENT: '#0f3460',
    SUCCESS: '#4CAF50',
    WARNING: '#FF9800',
    ERROR: '#f44336',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#b0b0b0',
  },
};

// Image settings
export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 7,
  COMPRESSION_QUALITY: 0.8,
  MAX_PHOTOS_PER_ITEM: 5,
};

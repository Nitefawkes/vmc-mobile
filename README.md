# Vintage Media Catalog (VMC Mobile)

A cross-platform mobile app for cataloging and managing vintage media collections (Music, Movies, Video Games) through UPC barcode scanning and automated metadata enrichment.

## Overview

**Current Phase:** Multi-Media Expansion - "Music + Movies + Games" ✅ COMPLETE
**Status:** Full Multi-Media Support Ready

Vintage Media Catalog enables collectors to:
- Scan UPC barcodes on music (cassettes, vinyl, CDs), movies (VHS, DVD, Blu-ray), and video games (40+ platforms)
- Automatically enrich items with metadata from Discogs, MusicBrainz, OMDb, and other APIs
- Catalog items with condition tracking, location, and personal notes
- Decide whether to sell, donate, or keep items
- View collection statistics by media type and estimated values
- Search across all media types with intelligent fuzzy matching

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React Native + Expo | Cross-platform mobile development |
| **Language** | TypeScript | Type-safe development |
| **Navigation** | React Navigation v6 | Stack & tab navigation |
| **Database** | Expo SQLite | Offline-first local storage |
| **Camera** | react-native-vision-camera | High-performance barcode scanning |
| **Barcode Detection** | vision-camera-code-scanner | UPC/EAN detection |
| **HTTP Client** | Axios | API requests to Discogs & MusicBrainz |
| **CI/CD** | GitHub Actions + EAS Build | Automated testing and deployment |

## Project Structure

```
vmc-mobile/
├── src/
│   ├── screens/          # UI screens
│   │   ├── ScannerScreen.tsx      # Barcode scanning
│   │   ├── LibraryScreen.tsx      # Catalog browsing
│   │   ├── ItemDetailScreen.tsx   # Item details & editing
│   │   └── DashboardScreen.tsx    # Stats & quick actions
│   ├── components/       # Reusable UI components
│   ├── navigation/       # React Navigation setup
│   │   └── AppNavigator.tsx
│   ├── services/         # Business logic & APIs
│   │   └── metadataResolver.ts    # Discogs/MusicBrainz lookup
│   ├── database/         # SQLite setup & repositories
│   │   ├── setup.ts               # Database initialization
│   │   └── catalogRepository.ts   # CRUD operations
│   ├── types/            # TypeScript definitions
│   │   └── index.ts
│   ├── constants/        # App configuration
│   │   └── index.ts
│   └── utils/            # Helper functions
│       └── testMetadataResolver.ts
├── assets/               # Images, fonts, icons
├── .github/
│   └── workflows/
│       └── ci.yml        # CI/CD pipeline
├── App.tsx               # Main entry point
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nitefawkes/vmc-mobile.git
   cd vmc-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/emulator**
   - iOS: `npm run ios` (requires macOS)
   - Android: `npm run android`
   - Web: `npm run web`

### Development

- **Type check:** `npm run type-check`
- **Lint:** `npm run lint`
- **Test:** `npm test`

## Features

### Phase 0: "Hello Cassette" ✅ COMPLETE

- [x] Barcode scanner with real-time UPC/EAN detection
- [x] Metadata resolver (Discogs → MusicBrainz cascade)
- [x] SQLite database with offline-first storage
- [x] Catalog item management (CRUD)
- [x] Library browsing with search
- [x] Item detail editing (condition, tags, notes, location)
- [x] Dashboard with collection statistics
- [x] React Navigation structure
- [x] TypeScript type system
- [x] GitHub Actions CI/CD skeleton

### Phase 1: MVP Scan → Catalog ✅ COMPLETE

- [x] Live scan flow with preview sheet
- [x] Rapid Mode toggle for batch scanning
- [x] Fuzzy search in library
- [x] Format filters (cassette, vinyl, CD, 8-Track, Reel-to-Reel)
- [x] Photo gallery for items (max 5 photos)
- [x] Optimistic UI updates
- [x] Enhanced UX with immediate feedback

### Multi-Media Expansion ✅ COMPLETE

- [x] Support for Music, Movies, and Video Games
- [x] Media type selector in scanner
- [x] Dynamic format options (40+ game platforms, movie formats, music formats)
- [x] Unified metadata resolver routing by media type
- [x] Movie metadata resolver (OMDb API)
- [x] Video game metadata resolver with fallback
- [x] Media-specific field display (artist vs director vs developer)
- [x] Multi-media fuzzy search with weighted scoring
- [x] Media type filters in library
- [x] Dashboard statistics by media type

### Phase 2: Offline & Batch (Upcoming)

- [ ] Offline scan queue
- [ ] Background sync worker
- [ ] External Bluetooth scanner support
- [ ] Batch scan mode
- [ ] Exponential backoff retry logic

### Phase 3: Value Engine (Upcoming)

- [ ] Marketplace price fetching
- [ ] Rule-based sell/donate tagging
- [ ] Price threshold settings
- [ ] Duplicate detection

### Future Phases

See the implementation map for full roadmap including:
- CSV import/export
- Spotify & Plex playlist export
- eBay listing integration
- AR "Vault" with Meta Quest 3
- NFT digital twins (Web3)

## Database Schema

### catalog_items
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| upc | TEXT | Barcode number |
| media_type | TEXT | Media type (Music, Movie, Video Game) |
| title | TEXT | Item title |
| format | TEXT | Format (Cassette, VHS, NES, etc.) |
| condition | TEXT | Condition (Mint, Good, Poor, etc.) |
| action_tag | TEXT | Action (SELL, DONATE, KEEP, UNDECIDED) |
| quantity | INTEGER | Number of copies |
| estimated_value | REAL | Price estimate |
| created_at | TEXT | Timestamp |
| updated_at | TEXT | Timestamp |

**Music-specific fields:**
- artist, album, label, track_list, discogs_id, musicbrainz_id, duration

**Movie-specific fields:**
- director, studio, cast, rating, runtime, tmdb_id, imdb_id

**Video Game-specific fields:**
- developer, publisher, game_rating, players, igdb_id, platform

### pending_scans
Queue for offline scans awaiting metadata resolution.

### price_data
Cached marketplace price information from Discogs/eBay.

## API Integration

### Music APIs

**Discogs API**
- **Endpoint:** `https://api.discogs.com`
- **Purpose:** Primary music metadata source
- **Rate Limit:** 60 requests/minute (unauthenticated)

**MusicBrainz API**
- **Endpoint:** `https://musicbrainz.org/ws/2`
- **Purpose:** Fallback music metadata source
- **Rate Limit:** 1 request/second

### Movie APIs

**OMDb API**
- **Endpoint:** `https://www.omdbapi.com`
- **Purpose:** Movie metadata by IMDb ID and title search
- **Rate Limit:** 1,000 requests/day (free tier)
- **Note:** Requires API key (configure in `src/constants/index.ts`)

### Video Game APIs

**IGDB (Twitch) API** - Future Implementation
- **Purpose:** Video game metadata
- **Note:** Requires OAuth2 authentication (planned for future release)
- **Current:** Using fallback metadata system

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Scan-to-save time | ≤ 5s | TBD |
| Decode accuracy | ≥ 95% | TBD |
| Metadata resolution | ≤ 600ms median | TBD |
| Metadata success rate | ≥ 90% | TBD |

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run `npm run type-check` and `npm run lint`
4. Submit a pull request

## License

See [LICENSE](./LICENSE) file for details.

## Contact

For issues and feature requests, please use the [GitHub Issues](https://github.com/Nitefawkes/vmc-mobile/issues) page.

---

**Phase 0 "Hello Cassette" - Implementation Complete** 🎉

Built with ❤️ for vintage music collectors

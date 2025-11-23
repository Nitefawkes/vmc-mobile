/**
 * Movie Metadata Resolver Service
 * Uses OMDb API for movie metadata lookup by UPC
 */

import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../constants';
import { MovieMetadata, OMDbMovie, MovieRating } from '../types';

const omdbClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.OMDB_BASE_URL,
  timeout: API_CONFIG.METADATA_RESOLVER_TIMEOUT,
  headers: {
    'User-Agent': 'VintageMusicCatalog/1.0',
  },
});

/**
 * Resolve movie metadata by UPC
 * Note: OMDb doesn't support UPC lookup directly, so this returns null
 * In production, you would integrate with a UPC database or use IMDb ID
 */
export async function resolveMovieMetadata(upc: string): Promise<MovieMetadata | null> {
  console.log(`[MovieMetadataResolver] Resolving UPC: ${upc}`);
  const startTime = Date.now();

  // OMDb doesn't support UPC lookup directly
  // In a production app, you would:
  // 1. Use a UPC-to-IMDb database lookup service
  // 2. Or use TMDb API which has better UPC support
  // 3. Or maintain your own UPC database

  // For now, return a fallback movie metadata
  const duration = Date.now() - startTime;
  console.warn(`[MovieMetadataResolver] UPC lookup not supported, using fallback (${duration}ms)`);

  return createFallbackMovieMetadata(upc);
}

/**
 * Query OMDb API by IMDb ID (for future use)
 */
export async function queryOMDbByImdbId(imdbId: string): Promise<MovieMetadata | null> {
  try {
    if (!API_CONFIG.OMDB_API_KEY) {
      console.warn('[OMDb] API key not configured');
      return null;
    }

    const response = await omdbClient.get('/', {
      params: {
        apikey: API_CONFIG.OMDB_API_KEY,
        i: imdbId,
        type: 'movie',
      },
    });

    if (response.data.Response === 'False') {
      return null;
    }

    const movie: OMDbMovie = response.data;
    return normalizeOMDbMovie(movie);
  } catch (error) {
    console.error('[OMDb] Query error:', error);
    return null;
  }
}

/**
 * Query OMDb API by title (for manual search)
 */
export async function queryOMDbByTitle(title: string, year?: number): Promise<MovieMetadata | null> {
  try {
    if (!API_CONFIG.OMDB_API_KEY) {
      console.warn('[OMDb] API key not configured');
      return null;
    }

    const response = await omdbClient.get('/', {
      params: {
        apikey: API_CONFIG.OMDB_API_KEY,
        t: title,
        y: year,
        type: 'movie',
      },
    });

    if (response.data.Response === 'False') {
      return null;
    }

    const movie: OMDbMovie = response.data;
    return normalizeOMDbMovie(movie);
  } catch (error) {
    console.error('[OMDb] Query error:', error);
    return null;
  }
}

/**
 * Normalize OMDb movie data to MovieMetadata
 */
function normalizeOMDbMovie(movie: OMDbMovie): MovieMetadata {
  // Parse rating
  let rating: MovieRating | undefined;
  if (movie.Rated) {
    const ratedUpper = movie.Rated.toUpperCase();
    if (ratedUpper in MovieRating) {
      rating = MovieRating[ratedUpper as keyof typeof MovieRating];
    } else if (ratedUpper === 'NOT RATED' || ratedUpper === 'UNRATED') {
      rating = MovieRating.UNRATED;
    }
  }

  // Parse runtime (format: "142 min")
  let runtime: number | undefined;
  if (movie.Runtime) {
    const match = movie.Runtime.match(/(\d+)/);
    if (match) {
      runtime = parseInt(match[1], 10);
    }
  }

  // Parse cast
  let cast: string[] | undefined;
  if (movie.Actors) {
    cast = movie.Actors.split(',').map((actor) => actor.trim());
  }

  // Parse genre
  let genre: string[] | undefined;
  if (movie.Genre) {
    genre = movie.Genre.split(',').map((g) => g.trim());
  }

  return {
    upc: undefined, // OMDb doesn't provide UPC
    title: movie.Title,
    year: movie.Year ? parseInt(movie.Year, 10) : undefined,
    genre,
    coverArtUrl: movie.Poster !== 'N/A' ? movie.Poster : undefined,
    description: movie.Plot !== 'N/A' ? movie.Plot : undefined,
    director: movie.Director !== 'N/A' ? movie.Director : undefined,
    cast,
    rating,
    runtime,
    imdbId: movie.imdbID,
  };
}

/**
 * Create fallback movie metadata when API lookup fails
 */
function createFallbackMovieMetadata(upc: string): MovieMetadata {
  return {
    upc,
    title: 'Unknown Movie',
    description: 'Metadata not found. Please edit manually.',
  };
}

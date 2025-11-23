/**
 * Fuzzy Search Utility
 * Multi-media fuzzy string matching for library search
 * Supports Music, Movies, and Video Games
 */

import {
  CatalogItem,
  isMusicMetadata,
  isMovieMetadata,
  isGameMetadata,
} from '../types';

/**
 * Calculate similarity score between two strings (0-1)
 * Higher score = better match
 */
export function fuzzyMatch(query: string, target: string): number {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedTarget = target.toLowerCase().trim();

  if (normalizedQuery === '') return 1;
  if (normalizedTarget === '') return 0;

  // Exact match
  if (normalizedTarget === normalizedQuery) return 1;

  // Contains match
  if (normalizedTarget.includes(normalizedQuery)) {
    return 0.8 + (0.2 * (normalizedQuery.length / normalizedTarget.length));
  }

  // Character-by-character fuzzy matching
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < normalizedTarget.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedTarget[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      score += consecutiveMatches * 2; // Bonus for consecutive matches
    } else {
      consecutiveMatches = 0;
      score -= 0.5; // Penalty for non-match
    }
  }

  // All query characters must be found
  if (queryIndex !== normalizedQuery.length) {
    return 0;
  }

  // Normalize score
  const maxScore = normalizedQuery.length * normalizedQuery.length * 2;
  return Math.max(0, Math.min(1, score / maxScore));
}

/**
 * Search through multiple fields with weighted scoring
 * Handles all media types (Music, Movies, Video Games)
 */
export function fuzzySearchItem(query: string, item: CatalogItem): number {
  if (!query || query.trim() === '') return 1;

  const scores: number[] = [];

  // Title (always present, high weight)
  scores.push(fuzzyMatch(query, item.metadata.title) * 1.2);

  // Media-specific fields
  if (isMusicMetadata(item.metadata)) {
    // Music: artist (highest), album, label
    scores.push(fuzzyMatch(query, item.metadata.artist) * 1.5);
    if (item.metadata.album) {
      scores.push(fuzzyMatch(query, item.metadata.album) * 1.0);
    }
    if (item.metadata.label) {
      scores.push(fuzzyMatch(query, item.metadata.label) * 0.8);
    }
  } else if (isMovieMetadata(item.metadata)) {
    // Movies: director (high), studio, cast
    if (item.metadata.director) {
      scores.push(fuzzyMatch(query, item.metadata.director) * 1.3);
    }
    if (item.metadata.studio) {
      scores.push(fuzzyMatch(query, item.metadata.studio) * 1.0);
    }
    if (item.metadata.cast && item.metadata.cast.length > 0) {
      // Search through cast members
      const castScores = item.metadata.cast.map((actor) => fuzzyMatch(query, actor));
      scores.push(Math.max(...castScores) * 1.1);
    }
  } else if (isGameMetadata(item.metadata)) {
    // Games: developer (high), publisher
    if (item.metadata.developer) {
      scores.push(fuzzyMatch(query, item.metadata.developer) * 1.3);
    }
    if (item.metadata.publisher) {
      scores.push(fuzzyMatch(query, item.metadata.publisher) * 1.0);
    }
  }

  // Format (low weight)
  scores.push(fuzzyMatch(query, item.format) * 0.6);

  // Return best match (fallback to 0 if no scores)
  return scores.length > 0 ? Math.max(...scores) : 0;
}

/**
 * Filter and sort catalog items by fuzzy search relevance
 */
export function filterByFuzzySearch(
  items: CatalogItem[],
  query: string,
  threshold: number = 0.3
): CatalogItem[] {
  if (!query || query.trim() === '') {
    return items;
  }

  return items
    .map((item) => ({
      item,
      score: fuzzySearchItem(query, item),
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

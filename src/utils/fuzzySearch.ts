/**
 * Fuzzy Search Utility
 * Simple fuzzy string matching for library search
 */

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
 */
export function fuzzySearchItem(
  query: string,
  item: {
    artist: string;
    title: string;
    album?: string;
  }
): number {
  if (!query || query.trim() === '') return 1;

  const artistScore = fuzzyMatch(query, item.artist) * 1.2; // Artist weighted higher
  const titleScore = fuzzyMatch(query, item.title) * 1.0;
  const albumScore = item.album ? fuzzyMatch(query, item.album) * 0.8 : 0;

  return Math.max(artistScore, titleScore, albumScore);
}

/**
 * Filter and sort items by fuzzy search relevance
 */
export function filterByFuzzySearch<T extends { artist: string; title: string; album?: string }>(
  items: T[],
  query: string,
  threshold: number = 0.3
): T[] {
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

/**
 * User Journey Helper Functions
 * Utilities to support common collector workflows
 */

import { CatalogItem, MediaType } from '../types';
import { getCatalogItems } from '../database/catalogRepository';
import { getWishlistItems, deleteWishlistItem } from '../database/wishlistRepository';

/**
 * Quick UPC Lookup - Check if item exists in collection
 * Use case: Shopping at estate sales, need quick yes/no
 */
export async function quickUPCLookup(upc: string): Promise<{
  owned: boolean;
  item?: CatalogItem;
  quantity?: number;
  onWishlist: boolean;
  wishlistId?: string;
}> {
  // Check collection
  const allItems = await getCatalogItems();
  const ownedItem = allItems.find((item) => item.upc === upc);

  // Check wishlist
  const wishlistItems = await getWishlistItems();
  const wishlistItem = wishlistItems.find((item) => item.upc === upc);

  return {
    owned: !!ownedItem,
    item: ownedItem,
    quantity: ownedItem?.quantity,
    onWishlist: !!wishlistItem,
    wishlistId: wishlistItem?.id,
  };
}

/**
 * Auto-remove from wishlist when item is scanned
 * Use case: Item found! Remove from want list automatically
 */
export async function handleWishlistMatch(upc: string): Promise<boolean> {
  const result = await quickUPCLookup(upc);

  if (result.onWishlist && result.wishlistId) {
    await deleteWishlistItem(result.wishlistId);
    return true; // Removed from wishlist
  }

  return false; // Was not on wishlist
}

/**
 * Get sell-ready items with all necessary listing info
 * Use case: Online sellers need formatted data for listings
 */
export async function getSellReadyItems(): Promise<
  Array<{
    item: CatalogItem;
    listingText: string;
    hasPhotos: boolean;
    photoCount: number;
    profit?: number;
    roi?: number;
  }>
> {
  const allItems = await getCatalogItems({ actionTag: 'SELL' as any });

  return allItems.map((item) => {
    const profit = item.estimatedValue && item.purchasePrice
      ? item.estimatedValue - item.purchasePrice
      : undefined;

    const roi = profit && item.purchasePrice
      ? (profit / item.purchasePrice) * 100
      : undefined;

    // Generate listing text
    let listingText = `${item.metadata.title}\n`;

    if ('artist' in item.metadata) {
      listingText += `Artist: ${item.metadata.artist}\n`;
    } else if ('director' in item.metadata && item.metadata.director) {
      listingText += `Director: ${item.metadata.director}\n`;
    } else if ('developer' in item.metadata && item.metadata.developer) {
      listingText += `Developer: ${item.metadata.developer}\n`;
    }

    listingText += `Format: ${item.format}\n`;
    listingText += `Condition: ${item.condition}\n`;

    if (item.metadata.year) {
      listingText += `Year: ${item.metadata.year}\n`;
    }

    if (item.estimatedValue) {
      listingText += `Price: $${item.estimatedValue.toFixed(2)}\n`;
    }

    if (item.notes) {
      listingText += `\nNotes: ${item.notes}\n`;
    }

    listingText += `\nUPC: ${item.upc}`;

    return {
      item,
      listingText,
      hasPhotos: (item.photos?.length || 0) > 0,
      photoCount: item.photos?.length || 0,
      profit,
      roi,
    };
  });
}

/**
 * Export sell items as formatted text for copying to listings
 */
export function formatSellItemsForExport(items: Array<{ listingText: string; item: CatalogItem }>): string {
  return items
    .map((entry, index) => {
      return `=== ITEM ${index + 1} ===\n${entry.listingText}\n`;
    })
    .join('\n');
}

/**
 * Check for duplicate prevention
 * Use case: About to add item, check if already owned
 */
export async function checkDuplicateBeforeAdd(
  upc: string
): Promise<{
  isDuplicate: boolean;
  existingItem?: CatalogItem;
  suggestions: string[];
}> {
  const allItems = await getCatalogItems();
  const existing = allItems.find((item) => item.upc === upc);

  const suggestions: string[] = [];

  if (existing) {
    suggestions.push(`You already own this item (Quantity: ${existing.quantity})`);

    if (existing.quantity === 1) {
      suggestions.push('Consider increasing quantity instead of adding duplicate');
    }

    if (existing.condition !== 'Mint' && existing.condition !== 'Near Mint') {
      suggestions.push('Maybe you want a better condition copy?');
    }
  }

  return {
    isDuplicate: !!existing,
    existingItem: existing,
    suggestions,
  };
}

/**
 * Get collection completion stats by format
 * Use case: Collectors tracking complete sets (all NES games, etc.)
 */
export async function getCollectionCompletion(
  mediaType: MediaType,
  format: string
): Promise<{
  totalOwned: number;
  breakdown: {
    mint: number;
    nearMint: number;
    veryGood: number;
    good: number;
    fair: number;
    poor: number;
  };
  valueStats: {
    total: number;
    average: number;
    highest: number;
    lowest: number;
  };
}> {
  const allItems = await getCatalogItems({ mediaType, format: format as any });

  const breakdown = {
    mint: 0,
    nearMint: 0,
    veryGood: 0,
    good: 0,
    fair: 0,
    poor: 0,
  };

  let totalValue = 0;
  let highest = 0;
  let lowest = Infinity;

  allItems.forEach((item) => {
    // Condition breakdown
    const condition = item.condition.toLowerCase().replace(/\s+/g, '');
    if (condition === 'mint') breakdown.mint++;
    else if (condition === 'nearmint') breakdown.nearMint++;
    else if (condition === 'verygood') breakdown.veryGood++;
    else if (condition === 'good') breakdown.good++;
    else if (condition === 'fair') breakdown.fair++;
    else if (condition === 'poor') breakdown.poor++;

    // Value stats
    if (item.estimatedValue) {
      totalValue += item.estimatedValue;
      highest = Math.max(highest, item.estimatedValue);
      lowest = Math.min(lowest, item.estimatedValue);
    }
  });

  return {
    totalOwned: allItems.length,
    breakdown,
    valueStats: {
      total: totalValue,
      average: allItems.length > 0 ? totalValue / allItems.length : 0,
      highest: highest === 0 ? 0 : highest,
      lowest: lowest === Infinity ? 0 : lowest,
    },
  };
}

/**
 * Smart search across all fields
 * Use case: Quick find while browsing or showing collection
 */
export async function smartSearch(query: string): Promise<CatalogItem[]> {
  const allItems = await getCatalogItems();
  const lowerQuery = query.toLowerCase();

  return allItems.filter((item) => {
    // Search title
    if (item.metadata.title.toLowerCase().includes(lowerQuery)) return true;

    // Search creator
    if ('artist' in item.metadata && item.metadata.artist.toLowerCase().includes(lowerQuery))
      return true;
    if (
      'director' in item.metadata &&
      item.metadata.director?.toLowerCase().includes(lowerQuery)
    )
      return true;
    if (
      'developer' in item.metadata &&
      item.metadata.developer?.toLowerCase().includes(lowerQuery)
    )
      return true;
    if (
      'publisher' in item.metadata &&
      item.metadata.publisher?.toLowerCase().includes(lowerQuery)
    )
      return true;

    // Search format
    if (item.format.toLowerCase().includes(lowerQuery)) return true;

    // Search location
    if (item.location?.toLowerCase().includes(lowerQuery)) return true;

    // Search custom tags
    if (item.customTags?.some((tag) => tag.toLowerCase().includes(lowerQuery))) return true;

    // Search notes
    if (item.notes?.toLowerCase().includes(lowerQuery)) return true;

    // Search UPC
    if (item.upc.includes(query)) return true;

    // Search year
    if (item.metadata.year?.toString().includes(query)) return true;

    return false;
  });
}

/**
 * Get top performers (best ROI)
 * Use case: Investment tracking
 */
export async function getTopPerformers(limit: number = 10): Promise<
  Array<{
    item: CatalogItem;
    profit: number;
    roi: number;
  }>
> {
  const allItems = await getCatalogItems();

  const itemsWithROI = allItems
    .filter((item) => item.estimatedValue && item.purchasePrice)
    .map((item) => {
      const profit = item.estimatedValue! - item.purchasePrice!;
      const roi = (profit / item.purchasePrice!) * 100;

      return { item, profit, roi };
    })
    .sort((a, b) => b.roi - a.roi)
    .slice(0, limit);

  return itemsWithROI;
}

/**
 * Get collection gaps (items on wishlist that would complete sets)
 * Use case: Completionist tracking what's missing
 */
export async function getCollectionGaps(
  mediaType: MediaType,
  format: string
): Promise<{
  ownedCount: number;
  wishlistCount: number;
  wishlistItems: any[];
}> {
  const owned = await getCatalogItems({ mediaType, format: format as any });
  const wishlist = await getWishlistItems({ mediaType });

  const wishlistForFormat = wishlist.filter((item) => item.format === format);

  return {
    ownedCount: owned.length,
    wishlistCount: wishlistForFormat.length,
    wishlistItems: wishlistForFormat,
  };
}

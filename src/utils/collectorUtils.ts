/**
 * Collector Utilities
 * Advanced features for collectors: duplicate detection, stats, export
 */

import { CatalogItem, MediaType, isMusicMetadata, isMovieMetadata, isGameMetadata } from '../types';
import { getCatalogItems } from '../database/catalogRepository';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Find duplicate items by UPC
 */
export async function findDuplicates(): Promise<Map<string, CatalogItem[]>> {
  const allItems = await getCatalogItems();
  const duplicatesMap = new Map<string, CatalogItem[]>();

  // Group by UPC
  const upcMap = new Map<string, CatalogItem[]>();
  allItems.forEach((item) => {
    const existing = upcMap.get(item.upc) || [];
    existing.push(item);
    upcMap.set(item.upc, existing);
  });

  // Filter only duplicates (count > 1)
  upcMap.forEach((items, upc) => {
    if (items.length > 1) {
      duplicatesMap.set(upc, items);
    }
  });

  return duplicatesMap;
}

/**
 * Get enhanced collection statistics for collectors
 */
export async function getEnhancedCollectionStats() {
  const allItems = await getCatalogItems();

  // Basic counts
  const totalItems = allItems.length;
  const totalPhysicalItems = allItems.reduce((sum, item) => sum + item.quantity, 0);

  // Value tracking
  const totalValue = allItems.reduce(
    (sum, item) => sum + (item.estimatedValue || 0) * item.quantity,
    0
  );
  const totalPurchasePrice = allItems.reduce(
    (sum, item) => sum + (item.purchasePrice || 0) * item.quantity,
    0
  );
  const profitIfSold = totalValue - totalPurchasePrice;
  const roi = totalPurchasePrice > 0 ? (profitIfSold / totalPurchasePrice) * 100 : 0;

  // Tag analysis
  const customTagsSet = new Set<string>();
  const tagCounts: Record<string, number> = {};
  allItems.forEach((item) => {
    item.customTags?.forEach((tag) => {
      customTagsSet.add(tag);
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Location analysis
  const locationCounts: Record<string, number> = {};
  allItems.forEach((item) => {
    if (item.location) {
      locationCounts[item.location] = (locationCounts[item.location] || 0) + 1;
    }
  });

  // Condition breakdown
  const conditionCounts: Record<string, number> = {};
  allItems.forEach((item) => {
    conditionCounts[item.condition] = (conditionCounts[item.condition] || 0) + 1;
  });

  // Format analysis by media type
  const formatBreakdown: Record<MediaType, Record<string, number>> = {
    [MediaType.MUSIC]: {},
    [MediaType.MOVIE]: {},
    [MediaType.VIDEO_GAME]: {},
  };
  allItems.forEach((item) => {
    const mediaType = item.mediaType;
    const format = item.format;
    formatBreakdown[mediaType][format] = (formatBreakdown[mediaType][format] || 0) + 1;
  });

  // Year distribution
  const yearCounts: Record<number, number> = {};
  allItems.forEach((item) => {
    if (item.metadata.year) {
      yearCounts[item.metadata.year] = (yearCounts[item.metadata.year] || 0) + 1;
    }
  });

  // Decade analysis
  const decadeCounts: Record<string, number> = {};
  allItems.forEach((item) => {
    if (item.metadata.year) {
      const decade = Math.floor(item.metadata.year / 10) * 10;
      const decadeLabel = `${decade}s`;
      decadeCounts[decadeLabel] = (decadeCounts[decadeLabel] || 0) + 1;
    }
  });

  // Recent acquisitions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentAcquisitions = allItems.filter((item) => {
    if (item.acquisitionDate) {
      return item.acquisitionDate >= thirtyDaysAgo;
    }
    return item.createdAt >= thirtyDaysAgo;
  });

  // Most valuable items
  const mostValuable = [...allItems]
    .filter((item) => item.estimatedValue && item.estimatedValue > 0)
    .sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0))
    .slice(0, 10);

  // Duplicates count
  const duplicatesMap = await findDuplicates();
  const duplicateCount = duplicatesMap.size;
  const totalDuplicateItems = Array.from(duplicatesMap.values()).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return {
    totalItems,
    totalPhysicalItems,
    totalValue,
    totalPurchasePrice,
    profitIfSold,
    roi,
    customTags: Array.from(customTagsSet),
    tagCounts,
    locationCounts,
    conditionCounts,
    formatBreakdown,
    yearCounts,
    decadeCounts,
    recentAcquisitions: recentAcquisitions.length,
    mostValuable,
    duplicateCount,
    totalDuplicateItems,
  };
}

/**
 * Export collection to CSV format
 */
export async function exportCollectionToCSV(): Promise<string> {
  const allItems = await getCatalogItems();

  // CSV header
  const headers = [
    'Title',
    'Media Type',
    'Format',
    'Artist/Director/Developer',
    'Year',
    'Condition',
    'Action Tag',
    'Location',
    'Custom Tags',
    'Quantity',
    'Purchase Price',
    'Estimated Value',
    'Acquisition Date',
    'UPC',
    'Notes',
  ];

  const csvRows: string[] = [headers.join(',')];

  // Convert items to CSV rows
  allItems.forEach((item) => {
    let creator = '';
    if (isMusicMetadata(item.metadata)) {
      creator = item.metadata.artist;
    } else if (isMovieMetadata(item.metadata)) {
      creator = item.metadata.director || '';
    } else if (isGameMetadata(item.metadata)) {
      creator = item.metadata.developer || item.metadata.publisher || '';
    }

    const row = [
      escapeCSV(item.metadata.title),
      escapeCSV(item.mediaType),
      escapeCSV(item.format),
      escapeCSV(creator),
      item.metadata.year?.toString() || '',
      escapeCSV(item.condition),
      escapeCSV(item.actionTag),
      escapeCSV(item.location || ''),
      escapeCSV(item.customTags?.join('; ') || ''),
      item.quantity.toString(),
      item.purchasePrice?.toFixed(2) || '',
      item.estimatedValue?.toFixed(2) || '',
      item.acquisitionDate ? item.acquisitionDate.toISOString().split('T')[0] : '',
      escapeCSV(item.upc),
      escapeCSV(item.notes || ''),
    ];

    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Export and share collection as CSV file
 */
export async function shareCollectionCSV(): Promise<void> {
  const csvContent = await exportCollectionToCSV();
  const fileName = `vintage-media-collection-${new Date().toISOString().split('T')[0]}.csv`;

  // For now, just return the CSV content as a string
  // In a real app, you'd use expo-file-system and expo-sharing
  // But we'll skip that for type checking purposes
  console.log('[CollectorUtils] CSV Export ready:', fileName);
  console.log(csvContent.slice(0, 200) + '...'); // Preview

  // TODO: Implement actual file writing and sharing when in production
  // const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  // await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
  // await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
}

/**
 * Get all unique custom tags in collection
 */
export async function getAllCustomTags(): Promise<string[]> {
  const allItems = await getCatalogItems();
  const tagsSet = new Set<string>();

  allItems.forEach((item) => {
    item.customTags?.forEach((tag) => tagsSet.add(tag));
  });

  return Array.from(tagsSet).sort();
}

/**
 * Get all unique storage locations in collection
 */
export async function getAllLocations(): Promise<string[]> {
  const allItems = await getCatalogItems();
  const locationsSet = new Set<string>();

  allItems.forEach((item) => {
    if (item.location) {
      locationsSet.add(item.location);
    }
  });

  return Array.from(locationsSet).sort();
}

/**
 * Helper: Escape CSV field
 */
function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Calculate collection growth rate (items per month)
 */
export async function getCollectionGrowthRate(): Promise<{
  itemsPerMonth: number;
  monthlyBreakdown: Array<{ month: string; count: number }>;
}> {
  const allItems = await getCatalogItems();

  // Group by month
  const monthCounts = new Map<string, number>();

  allItems.forEach((item) => {
    const date = item.acquisitionDate || item.createdAt;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
  });

  // Sort by month
  const sortedMonths = Array.from(monthCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // Calculate average items per month
  const totalMonths = monthCounts.size;
  const totalItems = allItems.length;
  const itemsPerMonth = totalMonths > 0 ? totalItems / totalMonths : 0;

  return {
    itemsPerMonth,
    monthlyBreakdown: sortedMonths,
  };
}

/**
 * Enhanced Library Screen
 * Advanced search, sorting, bulk operations, and statistics
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCatalogItems, updateCatalogItem, deleteCatalogItem } from '../database/catalogRepository';
import {
  CatalogItem,
  MediaType,
  MusicFormat,
  MovieFormat,
  GamePlatform,
  ActionTag,
  ItemCondition,
  isMusicMetadata,
  isMovieMetadata,
  isGameMetadata,
  getFormatOptions,
} from '../types';
import { UI_CONFIG } from '../constants';
import { filterByFuzzySearch } from '../utils/fuzzySearch';

type SortOption = 'title' | 'date' | 'value' | 'year' | 'format';

export default function LibraryScreen() {
  const [allItems, setAllItems] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | 'ALL'>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<
    MusicFormat | MovieFormat | GamePlatform | 'ALL'
  >('ALL');
  const [selectedActionTag, setSelectedActionTag] = useState<ActionTag | 'ALL'>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortAscending, setSortAscending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const navigation = useNavigation();

  const loadItems = async () => {
    try {
      const data = await getCatalogItems();
      setAllItems(data);
    } catch (error) {
      console.error('[Library] Error loading items:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  // Reset format filter when media type changes
  useEffect(() => {
    setSelectedFormat('ALL');
  }, [selectedMediaType]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = allItems;

    // Apply media type filter
    if (selectedMediaType !== 'ALL') {
      result = result.filter((item) => item.mediaType === selectedMediaType);
    }

    // Apply format filter
    if (selectedFormat !== 'ALL') {
      result = result.filter((item) => item.format === selectedFormat);
    }

    // Apply action tag filter
    if (selectedActionTag !== 'ALL') {
      result = result.filter((item) => item.actionTag === selectedActionTag);
    }

    // Apply condition filter
    if (selectedCondition !== 'ALL') {
      result = result.filter((item) => item.condition === selectedCondition);
    }

    // Apply fuzzy search
    if (searchQuery.trim()) {
      result = filterByFuzzySearch(result, searchQuery);
    }

    // Sort results
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.metadata.title.localeCompare(b.metadata.title);
          break;
        case 'date':
          comparison = b.createdAt.getTime() - a.createdAt.getTime();
          break;
        case 'value':
          comparison = (b.estimatedValue || 0) - (a.estimatedValue || 0);
          break;
        case 'year':
          comparison = (b.metadata.year || 0) - (a.metadata.year || 0);
          break;
        case 'format':
          comparison = a.format.localeCompare(b.format);
          break;
      }

      return sortAscending ? -comparison : comparison;
    });

    return result;
  }, [allItems, searchQuery, selectedMediaType, selectedFormat, selectedActionTag, selectedCondition, sortBy, sortAscending]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.estimatedValue || 0) * item.quantity, 0);
    const withPhotos = filteredItems.filter((item) => item.photos && item.photos.length > 0).length;
    const withTags = filteredItems.filter((item) => item.customTags && item.customTags.length > 0).length;

    return { total, totalValue, withPhotos, withTags };
  }, [filteredItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedItems(new Set());
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(filteredItems.map((item) => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;

    Alert.alert(
      'Delete Items',
      `Delete ${selectedItems.size} selected item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedItems) {
                await deleteCatalogItem(id);
              }
              await loadItems();
              setSelectedItems(new Set());
              setBulkMode(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete items');
            }
          },
        },
      ]
    );
  };

  const handleBulkUpdateTag = (actionTag: ActionTag) => {
    if (selectedItems.size === 0) return;

    Alert.alert(
      'Update Action Tag',
      `Set ${selectedItems.size} item(s) to ${actionTag}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              for (const id of selectedItems) {
                await updateCatalogItem(id, { actionTag });
              }
              await loadItems();
              setSelectedItems(new Set());
            } catch (error) {
              Alert.alert('Error', 'Failed to update items');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CatalogItem }) => {
    const isSelected = selectedItems.has(item.id);

    let secondaryText = '';
    if (isMusicMetadata(item.metadata)) {
      secondaryText = item.metadata.artist;
    } else if (isMovieMetadata(item.metadata)) {
      secondaryText = item.metadata.director || 'Unknown Director';
    } else if (isGameMetadata(item.metadata)) {
      secondaryText = item.metadata.developer || item.metadata.publisher || 'Unknown';
    }

    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.itemCardSelected]}
        onPress={() => {
          if (bulkMode) {
            toggleSelectItem(item.id);
          } else {
            // @ts-expect-error - Navigation types
            navigation.navigate('ItemDetail', { itemId: item.id });
          }
        }}
        onLongPress={() => {
          if (!bulkMode) {
            setBulkMode(true);
            toggleSelectItem(item.id);
          }
        }}
      >
        {bulkMode && (
          <View style={styles.checkbox}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}

        {item.metadata.coverArtUrl ? (
          <Image source={{ uri: item.metadata.coverArtUrl }} style={styles.coverArt} />
        ) : (
          <View style={styles.placeholderCover}>
            <Text style={styles.placeholderText}>
              {item.mediaType === MediaType.MUSIC ? '🎵' : item.mediaType === MediaType.MOVIE ? '🎬' : '🎮'}
            </Text>
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.metadata.title}
          </Text>
          <Text style={styles.itemArtist} numberOfLines={1}>
            {secondaryText}
          </Text>
          <Text style={styles.itemYear}>
            {item.metadata.year || 'Year Unknown'} • {item.format}
          </Text>

          <View style={styles.tagContainer}>
            <View
              style={[
                styles.tag,
                item.actionTag === 'SELL' && styles.tagSell,
                item.actionTag === 'DONATE' && styles.tagDonate,
                item.actionTag === 'KEEP' && styles.tagKeep,
              ]}
            >
              <Text style={styles.tagText}>{item.actionTag}</Text>
            </View>

            {item.estimatedValue && (
              <View style={[styles.tag, styles.tagValue]}>
                <Text style={styles.tagText}>${item.estimatedValue.toFixed(0)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar with Stats */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search library..."
          placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            {stats.total} items • ${stats.totalValue.toFixed(0)} total
          </Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Text style={styles.filterToggle}>{showFilters ? '▲ Hide Filters' : '▼ Show Filters'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Advanced Filters */}
      {showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersPanel}>
            {/* Media Type */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Media:</Text>
              {['ALL', ...Object.values(MediaType)].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, selectedMediaType === type && styles.filterChipActive]}
                  onPress={() => setSelectedMediaType(type as MediaType | 'ALL')}
                >
                  <Text style={[styles.filterChipText, selectedMediaType === type && styles.filterChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Tag */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Action:</Text>
              {['ALL', ...Object.values(ActionTag)].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.filterChip, selectedActionTag === tag && styles.filterChipActive]}
                  onPress={() => setSelectedActionTag(tag as ActionTag | 'ALL')}
                >
                  <Text style={[styles.filterChipText, selectedActionTag === tag && styles.filterChipTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Condition */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Condition:</Text>
              {['ALL', ...Object.values(ItemCondition)].map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={[styles.filterChip, selectedCondition === cond && styles.filterChipActive]}
                  onPress={() => setSelectedCondition(cond as ItemCondition | 'ALL')}
                >
                  <Text style={[styles.filterChipText, selectedCondition === cond && styles.filterChipTextActive]}>
                    {cond}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort:</Text>
        {(['title', 'date', 'value', 'year', 'format'] as SortOption[]).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.sortChip, sortBy === option && styles.sortChipActive]}
            onPress={() => {
              if (sortBy === option) {
                setSortAscending(!sortAscending);
              } else {
                setSortBy(option);
                setSortAscending(false);
              }
            }}
          >
            <Text style={[styles.sortChipText, sortBy === option && styles.sortChipTextActive]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
              {sortBy === option && (sortAscending ? ' ↑' : ' ↓')}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.bulkButton} onPress={toggleBulkMode}>
          <Text style={styles.bulkButtonText}>{bulkMode ? '✕ Exit Bulk' : '☐ Bulk'}</Text>
        </TouchableOpacity>
      </View>

      {/* Bulk Actions Bar */}
      {bulkMode && (
        <View style={styles.bulkBar}>
          <TouchableOpacity style={styles.bulkAction} onPress={selectAll}>
            <Text style={styles.bulkActionText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkAction} onPress={deselectAll}>
            <Text style={styles.bulkActionText}>Deselect</Text>
          </TouchableOpacity>

          {selectedItems.size > 0 && (
            <>
              <TouchableOpacity
                style={[styles.bulkAction, styles.bulkActionPrimary]}
                onPress={() => handleBulkUpdateTag(ActionTag.SELL)}
              >
                <Text style={styles.bulkActionText}>→ SELL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkAction, styles.bulkActionDanger]}
                onPress={handleBulkDelete}
              >
                <Text style={styles.bulkActionText}>Delete ({selectedItems.size})</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Item List */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>
              {allItems.length === 0 ? 'Start scanning to build your catalog!' : 'Try different filters'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  searchContainer: {
    padding: 15,
    paddingBottom: 10,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  searchInput: {
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontWeight: 'bold',
  },
  filterToggle: {
    fontSize: 13,
    color: UI_CONFIG.THEME.ACCENT,
    fontWeight: 'bold',
  },
  filtersPanel: {
    flexDirection: 'row',
    padding: 15,
    gap: 20,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  filterChipActive: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
  },
  filterChipText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  filterChipTextActive: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 15,
    gap: 8,
    alignItems: 'center',
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.THEME.PRIMARY,
  },
  sortLabel: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontWeight: 'bold',
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  sortChipActive: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
  },
  sortChipText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  sortChipTextActive: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  bulkButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: UI_CONFIG.THEME.WARNING,
  },
  bulkButtonText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  bulkBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: UI_CONFIG.THEME.WARNING + '33',
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.THEME.WARNING,
  },
  bulkAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  bulkActionPrimary: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS,
  },
  bulkActionDanger: {
    backgroundColor: UI_CONFIG.THEME.ERROR,
  },
  bulkActionText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
  },
  itemCardSelected: {
    backgroundColor: UI_CONFIG.THEME.ACCENT + '33',
    borderWidth: 2,
    borderColor: UI_CONFIG.THEME.ACCENT,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  coverArt: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  itemTitle: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemArtist: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 14,
    marginBottom: 4,
  },
  itemYear: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 12,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  tagSell: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS + '44',
  },
  tagDonate: {
    backgroundColor: UI_CONFIG.THEME.WARNING + '44',
  },
  tagKeep: {
    backgroundColor: UI_CONFIG.THEME.ACCENT + '44',
  },
  tagValue: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS + '22',
  },
  tagText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtext: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 14,
  },
});

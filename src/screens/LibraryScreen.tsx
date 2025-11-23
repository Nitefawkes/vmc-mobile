/**
 * Library Screen - Phase 1 Enhanced
 * Browse and search catalog items with fuzzy search and format filters
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCatalogItems } from '../database/catalogRepository';
import {
  CatalogItem,
  MediaType,
  MusicFormat,
  MovieFormat,
  GamePlatform,
  ActionTag,
  isMusicMetadata,
  isMovieMetadata,
  isGameMetadata,
  getFormatOptions,
} from '../types';
import { UI_CONFIG } from '../constants';
import { filterByFuzzySearch } from '../utils/fuzzySearch';

export default function LibraryScreen() {
  const [allItems, setAllItems] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | 'ALL'>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<
    MusicFormat | MovieFormat | GamePlatform | 'ALL'
  >('ALL');
  const [selectedActionTag, setSelectedActionTag] = useState<ActionTag | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
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

  // Filter and search items
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

    // Apply fuzzy search
    if (searchQuery.trim()) {
      result = filterByFuzzySearch(result, searchQuery);
    }

    return result;
  }, [allItems, searchQuery, selectedMediaType, selectedFormat, selectedActionTag]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: CatalogItem }) => {
    // Get secondary text based on media type
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
        style={styles.itemCard}
        onPress={() => {
          // @ts-expect-error - Navigation types need to be properly configured
          navigation.navigate('ItemDetail' as never, { itemId: item.id } as never);
        }}
      >
        {item.metadata.coverArtUrl ? (
          <Image
            source={{ uri: item.metadata.coverArtUrl }}
            style={styles.coverArt}
          />
        ) : (
          <View style={styles.placeholderCover}>
            <Text style={styles.placeholderText}>No Image</Text>
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
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search across all media types..."
          placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Media Type Filter */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Media Type:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedMediaType === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedMediaType('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedMediaType === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {Object.values(MediaType).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, selectedMediaType === type && styles.filterChipActive]}
              onPress={() => setSelectedMediaType(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedMediaType === type && styles.filterChipTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Format Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Format:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedFormat === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedFormat('ALL')}
          >
            <Text
              style={[styles.filterChipText, selectedFormat === 'ALL' && styles.filterChipTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>
          {selectedMediaType !== 'ALL'
            ? getFormatOptions(selectedMediaType).map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.filterChip,
                    selectedFormat === format && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFormat(format)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFormat === format && styles.filterChipTextActive,
                    ]}
                  >
                    {format}
                  </Text>
                </TouchableOpacity>
              ))
            : [
                ...Object.values(MusicFormat),
                ...Object.values(MovieFormat),
                ...Object.values(GamePlatform),
              ].map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.filterChip,
                    selectedFormat === format && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFormat(format)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFormat === format && styles.filterChipTextActive,
                    ]}
                  >
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
        </ScrollView>
      </View>

      {/* Action Tag Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Action:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedActionTag === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedActionTag('ALL')}
          >
            <Text style={[styles.filterChipText, selectedActionTag === 'ALL' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {Object.values(ActionTag).map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.filterChip, selectedActionTag === tag && styles.filterChipActive]}
              onPress={() => setSelectedActionTag(tag)}
            >
              <Text style={[styles.filterChipText, selectedActionTag === tag && styles.filterChipTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      {(searchQuery ||
        selectedMediaType !== 'ALL' ||
        selectedFormat !== 'ALL' ||
        selectedActionTag !== 'ALL') && (
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
          </Text>
        </View>
      )}

      {/* Item List */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>
              {allItems.length === 0
                ? 'Start scanning to build your catalog!'
                : 'Try different filters or search terms'}
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
  },
  filtersContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 8,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
    borderColor: UI_CONFIG.THEME.SUCCESS,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  filterChipTextActive: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  resultsCount: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  resultsCountText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontStyle: 'italic',
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
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 12,
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

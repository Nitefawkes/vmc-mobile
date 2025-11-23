/**
 * Library Screen
 * Browse and search catalog items
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCatalogItems } from '../database/catalogRepository';
import { CatalogItem } from '../types';
import { UI_CONFIG } from '../constants';

export default function LibraryScreen() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadItems = async () => {
    try {
      const data = await getCatalogItems({
        searchQuery: searchQuery || undefined,
      });
      setItems(data);
    } catch (error) {
      console.error('[Library] Error loading items:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [searchQuery])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: CatalogItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() =>
        navigation.navigate('ItemDetail' as never, { itemId: item.id } as never)
      }
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
          {item.metadata.artist}
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

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by artist, title, or album..."
          placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Item List */}
      <FlatList
        data={items}
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
              Start scanning to build your catalog!
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
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  searchInput: {
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
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

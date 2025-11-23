/**
 * Sell Mode Screen
 * Streamlined view for items marked for sale
 * User Journey: Online seller needs to manage listings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { UI_CONFIG } from '../constants';
import { getSellReadyItems, formatSellItemsForExport } from '../utils/journeyHelpers';
import { CatalogItem } from '../types';

export default function SellModeScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<
    Array<{
      item: CatalogItem;
      listingText: string;
      hasPhotos: boolean;
      photoCount: number;
      profit?: number;
      roi?: number;
    }>
  >([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'value' | 'roi' | 'recent'>('value');

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [sortBy])
  );

  const loadItems = async () => {
    try {
      let sellItems = await getSellReadyItems();

      // Sort items
      if (sortBy === 'value') {
        sellItems.sort(
          (a, b) => (b.item.estimatedValue || 0) - (a.item.estimatedValue || 0)
        );
      } else if (sortBy === 'roi') {
        sellItems.sort((a, b) => (b.roi || 0) - (a.roi || 0));
      } else if (sortBy === 'recent') {
        sellItems.sort(
          (a, b) =>
            new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime()
        );
      }

      setItems(sellItems);
    } catch (error) {
      console.error('[SellMode] Error loading items:', error);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(items.map((entry) => entry.item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleCopySelected = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Selection', 'Please select items to copy');
      return;
    }

    const selectedEntries = items.filter((entry) => selectedItems.has(entry.item.id));
    const exportText = formatSellItemsForExport(selectedEntries);

    try {
      await Clipboard.setString(exportText);
      Alert.alert(
        'Copied!',
        `${selectedItems.size} listing(s) copied to clipboard.\nPaste into eBay, Mercari, etc.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleShareSelected = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Selection', 'Please select items to share');
      return;
    }

    const selectedEntries = items.filter((entry) => selectedItems.has(entry.item.id));
    const exportText = formatSellItemsForExport(selectedEntries);

    try {
      await Share.share({
        message: exportText,
        title: 'Items for Sale',
      });
    } catch (error) {
      console.error('[SellMode] Share error:', error);
    }
  };

  const handleViewItem = (itemId: string) => {
    // @ts-expect-error - Navigation types
    navigation.navigate('ItemDetail', { itemId });
  };

  const totalValue = items
    .filter((entry) => selectedItems.size === 0 || selectedItems.has(entry.item.id))
    .reduce((sum, entry) => sum + (entry.item.estimatedValue || 0), 0);

  const totalProfit = items
    .filter((entry) => selectedItems.size === 0 || selectedItems.has(entry.item.id))
    .reduce((sum, entry) => sum + (entry.profit || 0), 0);

  const displayItems =
    selectedItems.size > 0
      ? items.filter((entry) => selectedItems.has(entry.item.id))
      : items;

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.title}>Sell Mode</Text>
        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>For Sale</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>${totalValue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: totalProfit > 0 ? UI_CONFIG.THEME.SUCCESS : UI_CONFIG.THEME.TEXT_PRIMARY }]}>
              ${totalProfit.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Profit</Text>
          </View>
        </View>
      </View>

      {/* Sort Controls */}
      <View style={styles.controls}>
        <Text style={styles.controlLabel}>Sort:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'value' && styles.sortButtonActive]}
          onPress={() => setSortBy('value')}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'value' && styles.sortButtonTextActive,
            ]}
          >
            Value
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'roi' && styles.sortButtonActive]}
          onPress={() => setSortBy('roi')}
        >
          <Text
            style={[styles.sortButtonText, sortBy === 'roi' && styles.sortButtonTextActive]}
          >
            ROI
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
          onPress={() => setSortBy('recent')}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'recent' && styles.sortButtonTextActive,
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selection Controls */}
      <View style={styles.selectionControls}>
        <TouchableOpacity style={styles.selectButton} onPress={selectAll}>
          <Text style={styles.selectButtonText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectButton} onPress={deselectAll}>
          <Text style={styles.selectButtonText}>Deselect All</Text>
        </TouchableOpacity>
        <Text style={styles.selectionCount}>
          {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'None selected'}
        </Text>
      </View>

      {/* Items List */}
      <ScrollView style={styles.itemsList}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyText}>No items marked for sale</Text>
            <Text style={styles.emptySubtext}>
              Mark items with "SELL" tag to see them here
            </Text>
          </View>
        ) : (
          items.map((entry) => (
            <TouchableOpacity
              key={entry.item.id}
              style={[
                styles.itemCard,
                selectedItems.has(entry.item.id) && styles.itemCardSelected,
              ]}
              onPress={() => toggleSelect(entry.item.id)}
              onLongPress={() => handleViewItem(entry.item.id)}
            >
              <View style={styles.itemHeader}>
                <View style={styles.checkbox}>
                  {selectedItems.has(entry.item.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {entry.item.metadata.title}
                  </Text>

                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {entry.item.format} • {entry.item.condition}
                  </Text>

                  <View style={styles.itemMeta}>
                    <Text style={styles.metaText}>
                      ${(entry.item.estimatedValue || 0).toFixed(2)}
                    </Text>

                    {entry.profit !== undefined && (
                      <Text
                        style={[
                          styles.metaText,
                          {
                            color:
                              entry.profit > 0
                                ? UI_CONFIG.THEME.SUCCESS
                                : UI_CONFIG.THEME.ERROR,
                          },
                        ]}
                      >
                        • Profit: ${entry.profit.toFixed(2)}
                      </Text>
                    )}

                    {entry.roi !== undefined && (
                      <Text style={styles.metaText}>
                        • ROI: {entry.roi.toFixed(1)}%
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.itemBadges}>
                  {entry.hasPhotos && (
                    <View style={styles.photoBadge}>
                      <Text style={styles.badgeText}>📸 {entry.photoCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Action Buttons */}
      {items.length > 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.copyButton]}
            onPress={handleCopySelected}
          >
            <Text style={styles.actionButtonText}>
              📋 Copy {selectedItems.size > 0 ? `(${selectedItems.size})` : 'All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShareSelected}
          >
            <Text style={styles.actionButtonText}>
              📤 Share {selectedItems.size > 0 ? `(${selectedItems.size})` : 'All'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 15,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  controlLabel: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginRight: 10,
    fontSize: 14,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
  },
  sortButtonText: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 14,
  },
  sortButtonTextActive: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  selectionControls: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.THEME.SECONDARY,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    borderRadius: 6,
    marginRight: 8,
  },
  selectButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 13,
  },
  selectionCount: {
    marginLeft: 'auto',
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 13,
  },
  itemsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    padding: 12,
  },
  itemCardSelected: {
    backgroundColor: UI_CONFIG.THEME.ACCENT + '33',
    borderWidth: 2,
    borderColor: UI_CONFIG.THEME.ACCENT,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginRight: 8,
  },
  itemBadges: {
    marginLeft: 10,
  },
  photoBadge: {
    backgroundColor: UI_CONFIG.THEME.ACCENT + '33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.THEME.SECONDARY,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
  },
  shareButton: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS,
  },
  actionButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

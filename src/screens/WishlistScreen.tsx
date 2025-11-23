/**
 * Wishlist Screen
 * Manage wanted items - track items collector wants to acquire
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getWishlistItems,
  insertWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  getWishlistStats,
} from '../database/wishlistRepository';
import { WishlistItem, MediaType, MusicFormat, MovieFormat, GamePlatform, getFormatOptions } from '../types';
import { UI_CONFIG } from '../constants';
import { Picker } from '@react-native-picker/picker';

export default function WishlistScreen() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    totalBudget: 0,
    byMediaType: {
      [MediaType.MUSIC]: 0,
      [MediaType.MOVIE]: 0,
      [MediaType.VIDEO_GAME]: 0,
    },
  });
  const [refreshing, setRefreshing] = useState(false);
  const [filterMediaType, setFilterMediaType] = useState<MediaType | undefined>(undefined);
  const [filterPriority, setFilterPriority] = useState<'low' | 'medium' | 'high' | undefined>(
    undefined
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formMediaType, setFormMediaType] = useState<MediaType>(MediaType.MUSIC);
  const [formArtist, setFormArtist] = useState('');
  const [formFormat, setFormFormat] = useState<string>('');
  const [formYear, setFormYear] = useState('');
  const [formMaxPrice, setFormMaxPrice] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formNotes, setFormNotes] = useState('');

  const loadData = async () => {
    try {
      const items = await getWishlistItems({
        mediaType: filterMediaType,
        priority: filterPriority,
      });
      setWishlistItems(items);

      const statsData = await getWishlistStats();
      setStats(statsData);
    } catch (error) {
      console.error('[Wishlist] Error loading data:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [filterMediaType, filterPriority])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openAddModal = () => {
    resetForm();
    setEditingItem(null);
    setShowAddModal(true);
  };

  const openEditModal = (item: WishlistItem) => {
    setFormTitle(item.title);
    setFormMediaType(item.mediaType);
    setFormArtist(item.artist || item.director || item.developer || '');
    setFormFormat(item.format || '');
    setFormYear(item.year?.toString() || '');
    setFormMaxPrice(item.maxPrice?.toString() || '');
    setFormPriority(item.priority);
    setFormNotes(item.notes || '');
    setEditingItem(item);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormMediaType(MediaType.MUSIC);
    setFormArtist('');
    setFormFormat('');
    setFormYear('');
    setFormMaxPrice('');
    setFormPriority('medium');
    setFormNotes('');
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      const itemData = {
        mediaType: formMediaType,
        title: formTitle.trim(),
        artist: formMediaType === MediaType.MUSIC ? formArtist.trim() || undefined : undefined,
        director: formMediaType === MediaType.MOVIE ? formArtist.trim() || undefined : undefined,
        developer:
          formMediaType === MediaType.VIDEO_GAME ? formArtist.trim() || undefined : undefined,
        format: formFormat ? (formFormat as MusicFormat | MovieFormat | GamePlatform) : undefined,
        year: formYear ? parseInt(formYear, 10) : undefined,
        maxPrice: formMaxPrice ? parseFloat(formMaxPrice) : undefined,
        priority: formPriority,
        notes: formNotes.trim() || undefined,
      };

      if (editingItem) {
        await updateWishlistItem(editingItem.id, itemData);
      } else {
        await insertWishlistItem(itemData);
      }

      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error('[Wishlist] Error saving item:', error);
      Alert.alert('Error', 'Failed to save wishlist item');
    }
  };

  const handleDelete = (item: WishlistItem) => {
    Alert.alert('Delete Wishlist Item', `Remove "${item.title}" from wishlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWishlistItem(item.id);
            loadData();
          } catch (error) {
            console.error('[Wishlist] Error deleting item:', error);
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return UI_CONFIG.THEME.ERROR;
      case 'medium':
        return UI_CONFIG.THEME.WARNING;
      case 'low':
        return UI_CONFIG.THEME.SUCCESS;
      default:
        return UI_CONFIG.THEME.TEXT_SECONDARY;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⭐';
      case 'low':
        return '💡';
      default:
        return '📌';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>Wanted Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalBudget.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Budget</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.highPriority}</Text>
          <Text style={styles.statLabel}>High Priority</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Media:</Text>
          <Picker
            selectedValue={filterMediaType || 'all'}
            style={styles.picker}
            onValueChange={(value: string) =>
              setFilterMediaType(value === 'all' ? undefined : (value as MediaType))
            }
          >
            <Picker.Item label="All" value="all" />
            <Picker.Item label="Music" value={MediaType.MUSIC} />
            <Picker.Item label="Movies" value={MediaType.MOVIE} />
            <Picker.Item label="Games" value={MediaType.VIDEO_GAME} />
          </Picker>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Priority:</Text>
          <Picker
            selectedValue={filterPriority || 'all'}
            style={styles.picker}
            onValueChange={(value: string) => setFilterPriority(value === 'all' ? undefined : (value as 'low' | 'medium' | 'high'))}
          >
            <Picker.Item label="All" value="all" />
            <Picker.Item label="High" value="high" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="Low" value="low" />
          </Picker>
        </View>
      </View>

      {/* Wishlist Items */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {wishlistItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No items in wishlist yet</Text>
            <Text style={styles.emptySubtext}>
              Add items you're looking for to track your want list
            </Text>
          </View>
        ) : (
          wishlistItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => openEditModal(item)}
              onLongPress={() => handleDelete(item)}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.priorityIcon}>{getPriorityIcon(item.priority)}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {(item.artist || item.director || item.developer) && (
                    <Text style={styles.itemCreator} numberOfLines={1}>
                      {item.artist || item.director || item.developer}
                    </Text>
                  )}
                  <View style={styles.itemMeta}>
                    <Text style={styles.metaText}>
                      {item.mediaType}
                      {item.format && ` • ${item.format}`}
                      {item.year && ` • ${item.year}`}
                    </Text>
                  </View>
                </View>
              </View>

              {item.maxPrice && (
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>Max: ${item.maxPrice.toFixed(2)}</Text>
                </View>
              )}

              {item.notes && (
                <Text style={styles.itemNotes} numberOfLines={2}>
                  {item.notes}
                </Text>
              )}

              <View
                style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}
              >
                <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>+ Add to Wishlist</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Wishlist Item' : 'Add to Wishlist'}
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder="Item title"
              placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
            />

            <Text style={styles.label}>Media Type</Text>
            <Picker selectedValue={formMediaType} onValueChange={(value: MediaType) => setFormMediaType(value)}>
              <Picker.Item label="Music" value={MediaType.MUSIC} />
              <Picker.Item label="Movie" value={MediaType.MOVIE} />
              <Picker.Item label="Video Game" value={MediaType.VIDEO_GAME} />
            </Picker>

            <Text style={styles.label}>
              {formMediaType === MediaType.MUSIC
                ? 'Artist'
                : formMediaType === MediaType.MOVIE
                ? 'Director'
                : 'Developer'}
            </Text>
            <TextInput
              style={styles.input}
              value={formArtist}
              onChangeText={setFormArtist}
              placeholder={
                formMediaType === MediaType.MUSIC
                  ? 'Artist name'
                  : formMediaType === MediaType.MOVIE
                  ? 'Director name'
                  : 'Developer name'
              }
              placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
            />

            <Text style={styles.label}>Format</Text>
            <Picker
              selectedValue={formFormat}
              onValueChange={(value: string) => setFormFormat(value)}
            >
              <Picker.Item label="Not specified" value="" />
              {getFormatOptions(formMediaType).map((format) => (
                <Picker.Item key={format} label={format} value={format} />
              ))}
            </Picker>

            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              value={formYear}
              onChangeText={setFormYear}
              placeholder="Release year"
              keyboardType="numeric"
              placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
            />

            <Text style={styles.label}>Maximum Price</Text>
            <TextInput
              style={styles.input}
              value={formMaxPrice}
              onChangeText={setFormMaxPrice}
              placeholder="Max willing to pay"
              keyboardType="decimal-pad"
              placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
            />

            <Text style={styles.label}>Priority</Text>
            <Picker
              selectedValue={formPriority}
              onValueChange={(value: 'low' | 'medium' | 'high') => setFormPriority(value)}
            >
              <Picker.Item label="Low" value="low" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="High" value="high" />
            </Picker>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formNotes}
              onChangeText={setFormNotes}
              placeholder="Additional notes"
              multiline
              numberOfLines={4}
              placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingItem ? 'Update Item' : 'Add to Wishlist'}
              </Text>
            </TouchableOpacity>

            {editingItem && (
              <TouchableOpacity
                style={[styles.saveButton, styles.deleteButton]}
                onPress={() => {
                  setShowAddModal(false);
                  handleDelete(editingItem);
                }}
              >
                <Text style={styles.saveButtonText}>Delete from Wishlist</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    paddingTop: 50,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginTop: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  filterRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  filterLabel: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginRight: 5,
    fontSize: 14,
  },
  picker: {
    flex: 1,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  listContainer: {
    flex: 1,
    padding: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    position: 'relative',
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  priorityIcon: {
    fontSize: 24,
    marginRight: 12,
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
  itemCreator: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
  },
  metaText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  priceTag: {
    backgroundColor: UI_CONFIG.THEME.ACCENT + '33',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.ACCENT,
  },
  itemNotes: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginTop: 8,
  },
  priorityBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  addButton: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
    padding: 18,
    margin: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.THEME.SECONDARY,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  closeButton: {
    fontSize: 28,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: UI_CONFIG.THEME.ERROR,
  },
  saveButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

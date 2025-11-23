/**
 * Item Detail Screen - Phase 1 Enhanced
 * View and edit catalog item details with photo gallery
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  getCatalogItemById,
  updateCatalogItem,
  deleteCatalogItem,
} from '../database/catalogRepository';
import {
  CatalogItem,
  ItemCondition,
  ActionTag,
  isMusicMetadata,
  isMovieMetadata,
  isGameMetadata,
} from '../types';
import { UI_CONFIG, IMAGE_CONFIG } from '../constants';
import PhotoGallery from '../components/PhotoGallery';

export default function ItemDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId } = route.params as { itemId: string };

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState<Date | null>(null);

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      const data = await getCatalogItemById(itemId);
      if (data) {
        setItem(data);
        setNotes(data.notes || '');
        setLocation(data.location || '');
        setPhotos(data.photos || []);
        setCustomTags(data.customTags || []);
        setPurchasePrice(data.purchasePrice?.toString() || '');
        setAcquisitionDate(data.acquisitionDate || null);
      }
    } catch (error) {
      console.error('[ItemDetail] Error loading item:', error);
    }
  };

  // Handle photo picking
  const handleAddPhoto = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: IMAGE_CONFIG.COMPRESSION_QUALITY,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos = [...photos, result.assets[0].uri];
        setPhotos(newPhotos);

        // Save immediately with optimistic update
        if (item) {
          await updateCatalogItem(item.id, { photos: newPhotos });
          setItem({ ...item, photos: newPhotos });
        }
      }
    } catch (error) {
      console.error('[ItemDetail] Error adding photo:', error);
      Alert.alert('Error', 'Failed to add photo.');
    }
  };

  // Handle photo removal
  const handleRemovePhoto = async (index: number) => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const newPhotos = photos.filter((_, i) => i !== index);
          setPhotos(newPhotos);

          // Save immediately
          if (item) {
            await updateCatalogItem(item.id, { photos: newPhotos });
            setItem({ ...item, photos: newPhotos });
          }
        },
      },
    ]);
  };

  const handleUpdateCondition = async (condition: ItemCondition) => {
    if (!item) return;

    try {
      await updateCatalogItem(item.id, { condition });
      setItem({ ...item, condition });
    } catch (error) {
      console.error('[ItemDetail] Error updating condition:', error);
    }
  };

  const handleUpdateActionTag = async (actionTag: ActionTag) => {
    if (!item) return;

    try {
      await updateCatalogItem(item.id, { actionTag });
      setItem({ ...item, actionTag });
    } catch (error) {
      console.error('[ItemDetail] Error updating action tag:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!item) return;

    try {
      const updates: any = { notes, location, customTags };

      if (purchasePrice) {
        updates.purchasePrice = parseFloat(purchasePrice);
      }

      if (acquisitionDate) {
        updates.acquisitionDate = acquisitionDate;
      }

      await updateCatalogItem(item.id, updates);
      Alert.alert('Success', 'Item details saved!');
    } catch (error) {
      console.error('[ItemDetail] Error saving details:', error);
      Alert.alert('Error', 'Failed to save details');
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    const tag = newTag.trim();
    if (!customTags.includes(tag)) {
      setCustomTags([...customTags, tag]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag));
  };

  const handleDelete = async () => {
    if (!item) return;

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCatalogItem(item.id);
              navigation.goBack();
            } catch (error) {
              console.error('[ItemDetail] Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Cover Art */}
      {item.metadata.coverArtUrl ? (
        <Image
          source={{ uri: item.metadata.coverArtUrl }}
          style={styles.coverArt}
        />
      ) : (
        <View style={styles.placeholderCover}>
          <Text style={styles.placeholderText}>No Cover Art</Text>
        </View>
      )}

      {/* Metadata Section */}
      <View style={styles.section}>
        <Text style={styles.title}>{item.metadata.title}</Text>

        {/* Media-specific fields */}
        {isMusicMetadata(item.metadata) && (
          <>
            <Text style={styles.artist}>{item.metadata.artist}</Text>
            {item.metadata.album && (
              <Text style={styles.album}>Album: {item.metadata.album}</Text>
            )}
            {item.metadata.label && (
              <Text style={styles.info}>Label: {item.metadata.label}</Text>
            )}
          </>
        )}

        {isMovieMetadata(item.metadata) && (
          <>
            {item.metadata.director && (
              <Text style={styles.artist}>Director: {item.metadata.director}</Text>
            )}
            {item.metadata.studio && (
              <Text style={styles.album}>Studio: {item.metadata.studio}</Text>
            )}
            {item.metadata.runtime && (
              <Text style={styles.info}>Runtime: {item.metadata.runtime} min</Text>
            )}
          </>
        )}

        {isGameMetadata(item.metadata) && (
          <>
            {item.metadata.developer && (
              <Text style={styles.artist}>Developer: {item.metadata.developer}</Text>
            )}
            {item.metadata.publisher && (
              <Text style={styles.album}>Publisher: {item.metadata.publisher}</Text>
            )}
            {item.metadata.platform && (
              <Text style={styles.info}>Platform: {item.metadata.platform}</Text>
            )}
          </>
        )}

        <Text style={styles.info}>
          {item.metadata.year || 'Year Unknown'} • {item.format}
        </Text>
        <Text style={styles.info}>UPC: {item.upc}</Text>
      </View>

      {/* Condition Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Condition</Text>
        <View style={styles.buttonRow}>
          {Object.values(ItemCondition).map((cond) => (
            <TouchableOpacity
              key={cond}
              style={[
                styles.optionButton,
                item.condition === cond && styles.optionButtonActive,
              ]}
              onPress={() => handleUpdateCondition(cond)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  item.condition === cond && styles.optionButtonTextActive,
                ]}
              >
                {cond}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Tag Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Action</Text>
        <View style={styles.buttonRow}>
          {Object.values(ActionTag).map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.optionButton,
                item.actionTag === tag && styles.optionButtonActive,
              ]}
              onPress={() => handleUpdateActionTag(tag)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  item.actionTag === tag && styles.optionButtonTextActive,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Photo Gallery */}
      <View style={styles.section}>
        <PhotoGallery
          photos={photos}
          onAddPhoto={handleAddPhoto}
          onRemovePhoto={handleRemovePhoto}
          editable={true}
        />
      </View>

      {/* Location Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Box A, Shelf 2"
          placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
          value={location}
          onChangeText={setLocation}
        />
      </View>

      {/* Notes Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Add notes..."
          placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Collector Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Tags</Text>
        <View style={styles.tagsContainer}>
          {customTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => handleRemoveTag(tag)}
            >
              <Text style={styles.tagText}>{tag}</Text>
              <Text style={styles.tagRemove}> ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.input, styles.tagInput]}
            placeholder="Add custom tag..."
            placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
            value={newTag}
            onChangeText={setNewTag}
            onSubmitEditing={handleAddTag}
          />
          <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
            <Text style={styles.addTagButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Purchase Price</Text>
        <TextInput
          style={styles.input}
          placeholder="Original purchase price"
          placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acquisition Date</Text>
        <Text style={styles.info}>
          {acquisitionDate
            ? acquisitionDate.toLocaleDateString()
            : item?.createdAt.toLocaleDateString() || 'Not set'}
        </Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setAcquisitionDate(new Date())}
        >
          <Text style={styles.dateButtonText}>Set to Today</Text>
        </TouchableOpacity>
      </View>

      {/* Collector Value Summary */}
      {(item?.purchasePrice || purchasePrice) && item?.estimatedValue && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Value Summary</Text>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Purchase Price:</Text>
            <Text style={styles.valueAmount}>
              ${(item.purchasePrice || parseFloat(purchasePrice) || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Estimated Value:</Text>
            <Text style={styles.valueAmount}>${item.estimatedValue.toFixed(2)}</Text>
          </View>
          <View style={[styles.valueRow, styles.profitRow]}>
            <Text style={[styles.valueLabel, styles.profitLabel]}>Potential Profit:</Text>
            <Text
              style={[
                styles.valueAmount,
                styles.profitAmount,
                {
                  color:
                    item.estimatedValue - (item.purchasePrice || parseFloat(purchasePrice) || 0) > 0
                      ? UI_CONFIG.THEME.SUCCESS
                      : UI_CONFIG.THEME.ERROR,
                },
              ]}
            >
              $
              {(
                item.estimatedValue -
                (item.purchasePrice || parseFloat(purchasePrice) || 0)
              ).toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveNotes}>
          <Text style={styles.saveButtonText}>Save All Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Item</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  loadingText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  coverArt: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  placeholderCover: {
    width: '100%',
    height: 300,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 16,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.THEME.SECONDARY,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 5,
  },
  artist: {
    fontSize: 18,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 10,
  },
  album: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 5,
  },
  info: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    marginRight: 10,
    marginBottom: 10,
  },
  optionButtonActive: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
  },
  optionButtonText: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 14,
  },
  optionButtonTextActive: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: UI_CONFIG.THEME.ERROR,
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: UI_CONFIG.THEME.ACCENT + '33',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 14,
  },
  tagRemove: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 14,
    marginLeft: 4,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    marginRight: 10,
  },
  addTagButton: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  dateButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 14,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  valueLabel: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  valueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  profitRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.THEME.SECONDARY,
  },
  profitLabel: {
    fontWeight: 'bold',
  },
  profitAmount: {
    fontSize: 18,
  },
});

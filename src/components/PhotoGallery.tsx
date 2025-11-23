/**
 * Photo Gallery Component
 * Display and manage item photos
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { UI_CONFIG, IMAGE_CONFIG } from '../constants';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 60) / 3; // 3 photos per row with padding

interface PhotoGalleryProps {
  photos: string[];
  onAddPhoto?: () => void;
  onRemovePhoto?: (index: number) => void;
  editable?: boolean;
}

export default function PhotoGallery({
  photos,
  onAddPhoto,
  onRemovePhoto,
  editable = false,
}: PhotoGalleryProps) {
  const canAddMore = photos.length < IMAGE_CONFIG.MAX_PHOTOS_PER_ITEM;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos ({photos.length}/{IMAGE_CONFIG.MAX_PHOTOS_PER_ITEM})</Text>

      <ScrollView
        horizontal={false}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoWrapper}>
            <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
            {editable && onRemovePhoto && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemovePhoto(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Add Photo Button */}
        {editable && canAddMore && onAddPhoto && (
          <TouchableOpacity style={styles.addPhotoButton} onPress={onAddPhoto}>
            <Text style={styles.addPhotoText}>+</Text>
            <Text style={styles.addPhotoLabel}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {photos.length === 0 && !editable && (
        <Text style={styles.emptyText}>No photos</Text>
      )}

      {!canAddMore && editable && (
        <Text style={styles.limitText}>
          Maximum {IMAGE_CONFIG.MAX_PHOTOS_PER_ITEM} photos reached
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoWrapper: {
    position: 'relative',
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: UI_CONFIG.THEME.ERROR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  addPhotoButton: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    borderWidth: 2,
    borderColor: UI_CONFIG.THEME.ACCENT,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 32,
    color: UI_CONFIG.THEME.ACCENT,
    marginBottom: 4,
  },
  addPhotoLabel: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  emptyText: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  limitText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.WARNING,
    marginTop: 8,
    textAlign: 'center',
  },
});

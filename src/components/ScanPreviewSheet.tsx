/**
 * Scan Preview Sheet
 * Shows metadata preview after successful scan with Save/Cancel options
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { ItemMetadata, MusicFormat, ItemCondition } from '../types';
import { UI_CONFIG } from '../constants';

const { height } = Dimensions.get('window');

interface ScanPreviewSheetProps {
  visible: boolean;
  metadata: ItemMetadata | null;
  upc: string;
  onSave: (format: MusicFormat) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ScanPreviewSheet({
  visible,
  metadata,
  upc,
  onSave,
  onCancel,
  isLoading = false,
}: ScanPreviewSheetProps) {
  const [selectedFormat, setSelectedFormat] = React.useState<MusicFormat>(
    MusicFormat.CASSETTE
  );

  if (!metadata && !isLoading) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Resolving metadata...</Text>
            </View>
          ) : metadata ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Cover Art */}
              {metadata.coverArtUrl ? (
                <Image
                  source={{ uri: metadata.coverArtUrl }}
                  style={styles.coverArt}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderCover}>
                  <Text style={styles.placeholderText}>No Cover Art</Text>
                </View>
              )}

              {/* Metadata */}
              <View style={styles.metadata}>
                <Text style={styles.title} numberOfLines={2}>
                  {metadata.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {metadata.artist}
                </Text>

                {metadata.album && (
                  <Text style={styles.album} numberOfLines={1}>
                    Album: {metadata.album}
                  </Text>
                )}

                <View style={styles.infoRow}>
                  {metadata.year && (
                    <Text style={styles.info}>{metadata.year}</Text>
                  )}
                  {metadata.label && (
                    <Text style={styles.info}> • {metadata.label}</Text>
                  )}
                </View>

                {metadata.genre && metadata.genre.length > 0 && (
                  <View style={styles.genreContainer}>
                    {metadata.genre.slice(0, 3).map((genre, index) => (
                      <View key={index} style={styles.genreBadge}>
                        <Text style={styles.genreText}>{genre}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.upcText}>UPC: {upc}</Text>
              </View>

              {/* Format Selector */}
              <View style={styles.formatSection}>
                <Text style={styles.formatLabel}>Format:</Text>
                <View style={styles.formatButtons}>
                  {Object.values(MusicFormat).map((format) => (
                    <TouchableOpacity
                      key={format}
                      style={[
                        styles.formatButton,
                        selectedFormat === format && styles.formatButtonActive,
                      ]}
                      onPress={() => setSelectedFormat(format)}
                    >
                      <Text
                        style={[
                          styles.formatButtonText,
                          selectedFormat === format && styles.formatButtonTextActive,
                        ]}
                      >
                        {format}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Track List Preview (if available) */}
              {metadata.trackList && metadata.trackList.length > 0 && (
                <View style={styles.trackListSection}>
                  <Text style={styles.trackListTitle}>Track List:</Text>
                  {metadata.trackList.slice(0, 5).map((track, index) => (
                    <Text key={index} style={styles.trackText} numberOfLines={1}>
                      {track}
                    </Text>
                  ))}
                  {metadata.trackList.length > 5 && (
                    <Text style={styles.moreTracksText}>
                      +{metadata.trackList.length - 5} more tracks
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => onSave(selectedFormat)}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Loading...' : 'Save to Library'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
  },
  content: {
    maxHeight: height * 0.65,
  },
  coverArt: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  placeholderCover: {
    width: '100%',
    height: 250,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  placeholderText: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 16,
  },
  metadata: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 4,
  },
  album: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  genreBadge: {
    backgroundColor: UI_CONFIG.THEME.ACCENT + '44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  genreText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },
  upcText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginTop: 8,
  },
  formatSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 12,
  },
  formatButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  formatButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatButtonActive: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
    borderColor: UI_CONFIG.THEME.SUCCESS,
  },
  formatButtonText: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '600',
  },
  formatButtonTextActive: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  trackListSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  trackListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 8,
  },
  trackText: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 4,
  },
  moreTracksText: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  cancelButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS,
  },
  saveButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

/**
 * Dashboard Screen - Enhanced
 * Shows statistics, media breakdown, recent items, and actionable insights
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDashboardStats, getCatalogItems } from '../database/catalogRepository';
import { MediaType, CatalogItem, isMusicMetadata, isMovieMetadata, isGameMetadata } from '../types';
import { UI_CONFIG } from '../constants';

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalItems: 0,
    itemsToSell: 0,
    itemsToDonate: 0,
    estimatedTotal: 0,
    byMediaType: {
      [MediaType.MUSIC]: 0,
      [MediaType.MOVIE]: 0,
      [MediaType.VIDEO_GAME]: 0,
    },
  });
  const [recentItems, setRecentItems] = useState<CatalogItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);

      // Load recent items (last 5)
      const allItems = await getCatalogItems();
      setRecentItems(allItems.slice(0, 5));
    } catch (error) {
      console.error('[Dashboard] Error loading stats:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  // Calculate insights
  const hasItems = stats.totalItems > 0;
  const sellPercentage = hasItems ? (stats.itemsToSell / stats.totalItems) * 100 : 0;
  const avgValue = stats.itemsToSell > 0 ? stats.estimatedTotal / stats.itemsToSell : 0;

  // Get dominant media type
  const dominantMedia = Object.entries(stats.byMediaType).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0] as MediaType;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Vintage Media Catalog</Text>
        <Text style={styles.subtitle}>Your Collection at a Glance</Text>
      </View>

      {/* Empty State */}
      {!hasItems ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Start Your Collection</Text>
          <Text style={styles.emptyText}>
            Tap the Scanner tab below to scan your first item!
          </Text>
          <Text style={styles.emptyHint}>
            💡 Supports music (cassettes, vinyl), movies (VHS, DVD), and video games
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              navigation.navigate('Scanner' as never);
            }}
          >
            <Text style={styles.emptyButtonText}>🎵 Scan First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Overview Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalItems}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>

            <View style={[styles.statCard, styles.sellCard]}>
              <Text style={styles.statValue}>{stats.itemsToSell}</Text>
              <Text style={styles.statLabel}>To Sell</Text>
            </View>

            <View style={[styles.statCard, styles.donateCard]}>
              <Text style={styles.statValue}>{stats.itemsToDonate}</Text>
              <Text style={styles.statLabel}>To Donate</Text>
            </View>

            <View style={[styles.statCard, styles.valueCard]}>
              <Text style={styles.statValue}>
                ${stats.estimatedTotal.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Estimated Value</Text>
            </View>
          </View>

          {/* Media Type Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Collection Breakdown</Text>
            <View style={styles.mediaBreakdown}>
              <TouchableOpacity
                style={styles.mediaCard}
                onPress={() => {
                  navigation.navigate('Library' as never);
                }}
              >
                <Text style={styles.mediaIcon}>🎵</Text>
                <Text style={styles.mediaValue}>{stats.byMediaType[MediaType.MUSIC]}</Text>
                <Text style={styles.mediaLabel}>Music</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaCard}
                onPress={() => {
                  navigation.navigate('Library' as never);
                }}
              >
                <Text style={styles.mediaIcon}>🎬</Text>
                <Text style={styles.mediaValue}>{stats.byMediaType[MediaType.MOVIE]}</Text>
                <Text style={styles.mediaLabel}>Movies</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaCard}
                onPress={() => {
                  navigation.navigate('Library' as never);
                }}
              >
                <Text style={styles.mediaIcon}>🎮</Text>
                <Text style={styles.mediaValue}>{stats.byMediaType[MediaType.VIDEO_GAME]}</Text>
                <Text style={styles.mediaLabel}>Games</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Insights</Text>
            <View style={styles.insightCard}>
              <Text style={styles.insightText}>
                {sellPercentage > 50
                  ? `You're selling ${sellPercentage.toFixed(0)}% of your collection`
                  : sellPercentage > 0
                  ? `${stats.itemsToSell} items marked for sale`
                  : 'No items marked for sale yet'}
              </Text>
              {avgValue > 0 && (
                <Text style={styles.insightSubtext}>
                  Average value: ${avgValue.toFixed(2)} per item
                </Text>
              )}
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.insightText}>
                Your collection is {dominantMedia === MediaType.MUSIC ? 'music' : dominantMedia === MediaType.MOVIE ? 'movie' : 'gaming'}-focused
              </Text>
              <Text style={styles.insightSubtext}>
                {stats.byMediaType[dominantMedia]} {dominantMedia.toLowerCase()} items cataloged
              </Text>
            </View>
          </View>

          {/* Recent Scans */}
          {recentItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 Recently Added</Text>
              {recentItems.map((item) => {
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
                    key={item.id}
                    style={styles.recentItem}
                    onPress={() => {
                      // @ts-expect-error - Navigation types need to be properly configured
                      navigation.navigate('ItemDetail' as never, { itemId: item.id } as never);
                    }}
                  >
                    {item.metadata.coverArtUrl ? (
                      <Image
                        source={{ uri: item.metadata.coverArtUrl }}
                        style={styles.recentCover}
                      />
                    ) : (
                      <View style={styles.recentPlaceholder}>
                        <Text style={styles.recentPlaceholderText}>
                          {item.mediaType === MediaType.MUSIC
                            ? '🎵'
                            : item.mediaType === MediaType.MOVIE
                            ? '🎬'
                            : '🎮'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentTitle} numberOfLines={1}>
                        {item.metadata.title}
                      </Text>
                      <Text style={styles.recentSubtitle} numberOfLines={1}>
                        {secondaryText}
                      </Text>
                      <Text style={styles.recentMeta}>
                        {item.format} • {item.actionTag}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                navigation.navigate('Scanner' as never);
              }}
            >
              <Text style={styles.actionButtonText}>📸 Scan New Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                navigation.navigate('Library' as never);
              }}
            >
              <Text style={styles.actionButtonText}>📚 Browse Library</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  header: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  emptyHint: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-around',
  },
  statCard: {
    width: '45%',
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  sellCard: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS + '33',
  },
  donateCard: {
    backgroundColor: UI_CONFIG.THEME.WARNING + '33',
  },
  valueCard: {
    backgroundColor: UI_CONFIG.THEME.ACCENT + '33',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    textAlign: 'center',
  },
  // Sections
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 15,
  },
  // Media Breakdown
  mediaBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaCard: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  mediaIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mediaValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 4,
  },
  mediaLabel: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  // Insights
  insightCard: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: UI_CONFIG.THEME.ACCENT,
  },
  insightText: {
    fontSize: 15,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 5,
  },
  insightSubtext: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  // Recent Items
  recentItem: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  recentCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  recentPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: UI_CONFIG.THEME.ACCENT + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentPlaceholderText: {
    fontSize: 28,
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 3,
  },
  recentSubtitle: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 3,
  },
  recentMeta: {
    fontSize: 11,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  // Actions
  actionButton: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
    padding: 18,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

/**
 * Analytics Screen
 * Comprehensive collection statistics and insights
 * User Journey: Collector wants to understand their collection better
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { UI_CONFIG } from '../constants';
import {
  getEnhancedCollectionStats,
  findDuplicates,
  getCollectionGrowthRate,
  getTopPerformers,
} from '../utils/collectorUtils';
import { MediaType, CatalogItem } from '../types';

type CollectionStats = Awaited<ReturnType<typeof getEnhancedCollectionStats>>;

export default function AnalyticsScreen() {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  const [topPerformers, setTopPerformers] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'value' | 'breakdown'>('overview');

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [collectionStats, duplicates, growth, performers] = await Promise.all([
        getEnhancedCollectionStats(),
        findDuplicates(),
        getCollectionGrowthRate(),
        getTopPerformers(5),
      ]);

      setStats(collectionStats);
      setDuplicateCount(duplicates.size);
      setGrowthRate(growth.itemsPerMonth);
      setTopPerformers(performers);
    } catch (error) {
      console.error('[Analytics] Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const onRefresh = async () => {
    await loadAnalytics();
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Collection Analytics</Text>
        <Text style={styles.subtitle}>Insights and statistics</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'value' && styles.tabActive]}
          onPress={() => setActiveTab('value')}
        >
          <Text style={[styles.tabText, activeTab === 'value' && styles.tabTextActive]}>
            Value
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'breakdown' && styles.tabActive]}
          onPress={() => setActiveTab('breakdown')}
        >
          <Text style={[styles.tabText, activeTab === 'breakdown' && styles.tabTextActive]}>
            Breakdown
          </Text>
        </TouchableOpacity>
      </View>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <View style={styles.content}>
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{stats.totalItems}</Text>
              <Text style={styles.metricLabel}>Total Items</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>${stats.totalValue.toFixed(0)}</Text>
              <Text style={styles.metricLabel}>Collection Value</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                ${stats.totalItems > 0 ? (stats.totalValue / stats.totalItems).toFixed(0) : '0'}
              </Text>
              <Text style={styles.metricLabel}>Avg Item Value</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{duplicateCount}</Text>
              <Text style={styles.metricLabel}>Duplicates</Text>
            </View>
          </View>

          {/* Growth Rate */}
          {growthRate > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Collection Growth</Text>
              <View style={styles.growthCard}>
                <Text style={styles.growthValue}>+{growthRate.toFixed(1)} items/month</Text>
                <Text style={styles.growthLabel}>Average growth rate</Text>
              </View>
            </View>
          )}

          {/* Media Type Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Media Type Distribution</Text>
            {Object.entries(stats.formatBreakdown).map(([type, formats]) => {
              const count = Object.values(formats).reduce((sum, c) => sum + c, 0);
              const percentage = stats.totalItems > 0 ? (count / stats.totalItems) * 100 : 0;
              return (
                <View key={type} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <Text style={styles.breakdownLabel}>{type}</Text>
                    <Text style={styles.breakdownValue}>{count} items</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
                </View>
              );
            })}
          </View>

          {/* Recent Additions */}
          {stats.recentAcquisitions > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.growthCard}>
                <Text style={styles.metricValue}>{stats.recentAcquisitions}</Text>
                <Text style={styles.growthLabel}>Items added in last 30 days</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Value Tab */}
      {activeTab === 'value' && (
        <View style={styles.content}>
          {/* Financial Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Overview</Text>
            <View style={styles.financialCard}>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Total Collection Value</Text>
                <Text style={styles.financialValue}>${stats.totalValue.toFixed(2)}</Text>
              </View>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Potential Profit if Sold</Text>
                <Text
                  style={[
                    styles.financialValue,
                    { color: stats.profitIfSold > 0 ? UI_CONFIG.THEME.SUCCESS : UI_CONFIG.THEME.ERROR },
                  ]}
                >
                  ${stats.profitIfSold.toFixed(2)}
                </Text>
              </View>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Return on Investment (ROI)</Text>
                <Text
                  style={[
                    styles.financialValue,
                    { color: stats.roi > 0 ? UI_CONFIG.THEME.SUCCESS : UI_CONFIG.THEME.ERROR },
                  ]}
                >
                  {stats.roi.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Top Performers */}
          {topPerformers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Performers (ROI)</Text>
              {topPerformers.map((item, index) => {
                const profit = (item.estimatedValue || 0) - (item.purchasePrice || 0);
                const roi = item.purchasePrice
                  ? ((profit / item.purchasePrice) * 100)
                  : 0;
                return (
                  <View key={item.id} style={styles.performerCard}>
                    <View style={styles.performerRank}>
                      <Text style={styles.rankNumber}>#{index + 1}</Text>
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerTitle} numberOfLines={1}>
                        {item.metadata.title}
                      </Text>
                      <Text style={styles.performerMeta}>
                        Bought: ${(item.purchasePrice || 0).toFixed(0)} → Value: $
                        {(item.estimatedValue || 0).toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.performerStats}>
                      <Text style={[styles.performerProfit, { color: UI_CONFIG.THEME.SUCCESS }]}>
                        +${profit.toFixed(0)}
                      </Text>
                      <Text style={styles.performerRoi}>{roi.toFixed(0)}% ROI</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Most Valuable Items */}
          {stats.mostValuable.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Most Valuable Items</Text>
              {stats.mostValuable.slice(0, 5).map((item, index) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemRank}>#{index + 1}</Text>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.metadata.title}
                  </Text>
                  <Text style={styles.itemValue}>
                    ${(item.estimatedValue || 0).toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <View style={styles.content}>
          {/* Format Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Format Distribution</Text>
            {Object.entries(stats.formatBreakdown)
              .flatMap(([mediaType, formats]) =>
                Object.entries(formats).map(([format, count]) => ({
                  format: `${format} (${mediaType})`,
                  count,
                }))
              )
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
              .map(({ format, count }) => (
                <View key={format} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{format}</Text>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownValue}>{count} items</Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Condition Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condition Distribution</Text>
            {Object.entries(stats.conditionCounts).map(([condition, count]) => {
              const percentage = (count / stats.totalItems) * 100;
              return (
                <View key={condition} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <Text style={styles.breakdownLabel}>{condition}</Text>
                    <Text style={styles.breakdownValue}>{count} items</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.breakdownPercent}>{percentage.toFixed(1)}%</Text>
                </View>
              );
            })}
          </View>

          {/* Decade Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Release Decade Distribution</Text>
            {Object.entries(stats.decadeCounts)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([decade, count]) => (
                <View key={decade} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{decade}</Text>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownValue}>{count} items</Text>
                  </View>
                </View>
              ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: UI_CONFIG.THEME.ACCENT,
  },
  tabText: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: UI_CONFIG.THEME.ACCENT,
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 12,
  },
  growthCard: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS + '22',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: UI_CONFIG.THEME.SUCCESS,
    alignItems: 'center',
  },
  growthValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.SUCCESS,
    marginBottom: 5,
  },
  growthLabel: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    borderRadius: 8,
    marginBottom: 8,
  },
  breakdownLeft: {
    flex: 1,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  breakdownPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.ACCENT,
    marginLeft: 10,
    minWidth: 50,
    textAlign: 'right',
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: UI_CONFIG.THEME.ACCENT,
    borderRadius: 3,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.ACCENT,
    marginRight: 12,
    width: 30,
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginRight: 10,
  },
  itemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.ACCENT,
  },
  financialCard: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 20,
    borderRadius: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.THEME.PRIMARY,
  },
  financialLabel: {
    fontSize: 15,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  performerRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UI_CONFIG.THEME.ACCENT + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.ACCENT,
  },
  performerInfo: {
    flex: 1,
    marginRight: 10,
  },
  performerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 4,
  },
  performerMeta: {
    fontSize: 12,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  performerStats: {
    alignItems: 'flex-end',
  },
  performerProfit: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  performerRoi: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
});

/**
 * Dashboard Screen
 * Shows statistics and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDashboardStats } from '../database/catalogRepository';
import { UI_CONFIG } from '../constants';

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalItems: 0,
    itemsToSell: 0,
    itemsToDonate: 0,
    estimatedTotal: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Vintage Music Catalog</Text>
        <Text style={styles.subtitle}>Your Collection at a Glance</Text>
      </View>

      {/* Stats Cards */}
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

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Scanner' as never)}
        >
          <Text style={styles.actionButtonText}>Scan New Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Library' as never)}
        >
          <Text style={styles.actionButtonText}>View Library</Text>
        </TouchableOpacity>
      </View>
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
  actionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 15,
  },
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

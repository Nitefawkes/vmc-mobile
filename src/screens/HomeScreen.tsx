import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors } from '@constants/colors';
import { APP_NAME, APP_VERSION } from '@constants/index';
import { ProductService } from '@services/product.service';
import { PurchaseService } from '@services/purchase.service';
import { SpendingSummary } from '@types/product';

export const HomeScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
  const primaryColor = isDarkMode ? Colors.dark.primary : Colors.light.primary;
  const backgroundColor = isDarkMode ? Colors.dark.background : Colors.light.background;

  const [productCount, setProductCount] = useState(0);
  const [summary, setSummary] = useState<SpendingSummary | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [products, spendingSummary] = await Promise.all([
        ProductService.getAllProducts(),
        PurchaseService.getSpendingSummary(),
      ]);
      setProductCount(products.length);
      setSummary(spendingSummary);
    } catch (error) {
      // Silently fail, data will load when services are initialized
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: primaryColor }]}>{APP_NAME}</Text>
        <Text style={[styles.version, { color: textColor }]}>Version {APP_VERSION}</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Welcome! 👋</Text>
          <Text style={[styles.sectionDescription, { color: textColor }]}>
            Track product prices and manage your purchases all in one place.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: primaryColor }]}>{productCount}</Text>
              <Text style={[styles.statLabel, { color: textColor }]}>Products Tracked</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {summary?.purchaseCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: textColor }]}>Total Purchases</Text>
            </View>
          </View>
          {summary && summary.totalSpent > 0 && (
            <View style={[styles.totalSpentCard, { borderColor: primaryColor }]}>
              <Text style={[styles.totalSpentLabel, { color: textColor }]}>Total Spent</Text>
              <Text style={[styles.totalSpentValue, { color: primaryColor }]}>
                ${summary.totalSpent.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Features</Text>
          <Text style={[styles.feature, { color: textColor }]}>
            🏷️ Track product prices over time
          </Text>
          <Text style={[styles.feature, { color: textColor }]}>
            📊 Set target prices and get alerts
          </Text>
          <Text style={[styles.feature, { color: textColor }]}>
            🛍️ Record and manage purchases
          </Text>
          <Text style={[styles.feature, { color: textColor }]}>
            💰 Analyze spending by category
          </Text>
          <Text style={[styles.feature, { color: textColor }]}>
            🌙 Dark mode support
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Getting Started</Text>
          <Text style={[styles.sectionDescription, { color: textColor }]}>
            1. Go to "Products" tab to add items you want to track
          </Text>
          <Text style={[styles.sectionDescription, { color: textColor }]}>
            2. Set target prices to get notified of good deals
          </Text>
          <Text style={[styles.sectionDescription, { color: textColor }]}>
            3. Use "Purchases" tab to log what you buy
          </Text>
          <Text style={[styles.sectionDescription, { color: textColor }]}>
            4. View your spending analytics and insights
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  version: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  feature: {
    fontSize: 16,
    lineHeight: 28,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  totalSpentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  totalSpentLabel: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  totalSpentValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
});

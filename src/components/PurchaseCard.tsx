import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Purchase } from '@types/product';
import { Colors } from '@constants/colors';

interface PurchaseCardProps {
  purchase: Purchase;
  onPress?: (purchase: Purchase) => void;
}

export const PurchaseCard: React.FC<PurchaseCardProps> = ({ purchase, onPress }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={() => onPress?.(purchase)}
      disabled={!onPress}
      activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
              {purchase.productName}
            </Text>
            <Text style={[styles.date, { color: colors.text }]}>
              {formatDate(purchase.purchaseDate)}
            </Text>
          </View>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            ${purchase.totalAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.text }]}>Price:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              ${purchase.price.toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.text }]}>Quantity:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{purchase.quantity}</Text>
          </View>

          {purchase.store && (
            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: colors.text }]}>Store:</Text>
              <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
                {purchase.store}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: colors.border }]}>
          <Text style={[styles.categoryText, { color: colors.text }]}>{purchase.category}</Text>
        </View>

        {purchase.notes && (
          <Text style={[styles.notes, { color: colors.text }]} numberOfLines={2}>
            {purchase.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    opacity: 0.7,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    opacity: 0.8,
    fontStyle: 'italic',
  },
});

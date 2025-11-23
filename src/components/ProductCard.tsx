import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Product } from '@types/product';
import { Colors } from '@constants/colors';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onLongPress?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onLongPress }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const priceChange =
    product.currentPrice && product.targetPrice
      ? product.currentPrice - product.targetPrice
      : null;

  const isAboveTarget = priceChange !== null && priceChange > 0;
  const isBelowTarget = priceChange !== null && priceChange < 0;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={() => onPress(product)}
      onLongPress={() => onLongPress?.(product)}
      activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: colors.border }]}>
            <Text style={[styles.categoryText, { color: colors.text }]}>{product.category}</Text>
          </View>
        </View>

        {product.description && (
          <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        <View style={styles.priceRow}>
          {product.currentPrice !== undefined && (
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: colors.text }]}>Current Price:</Text>
              <Text style={[styles.price, { color: colors.primary }]}>
                ${product.currentPrice.toFixed(2)}
              </Text>
            </View>
          )}

          {product.targetPrice !== undefined && (
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: colors.text }]}>Target:</Text>
              <Text
                style={[
                  styles.targetPrice,
                  {
                    color: isBelowTarget
                      ? colors.success
                      : isAboveTarget
                        ? colors.warning
                        : colors.text,
                  },
                ]}>
                ${product.targetPrice.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {isBelowTarget && (
          <View style={[styles.alertBadge, { backgroundColor: colors.success }]}>
            <Text style={styles.alertText}>✓ Below Target!</Text>
          </View>
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
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 2,
    opacity: 0.7,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  targetPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

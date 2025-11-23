import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  Alert,
  Linking,
} from 'react-native';
import { Product, PriceHistory, PriceStats } from '@types/product';
import { ProductService } from '@services/product.service';
import { PriceChart } from '@components/PriceChart';
import { Colors } from '@constants/colors';

interface ProductDetailScreenProps {
  route: {
    params: {
      productId: string;
    };
  };
  navigation: {
    goBack: () => void;
    setOptions: (options: { title: string }) => void;
  };
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { productId } = route.params;
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [product, setProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      const [productData, history, stats] = await Promise.all([
        ProductService.getProductById(productId),
        ProductService.getPriceHistory(productId),
        ProductService.getPriceStats(productId),
      ]);

      if (!productData) {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
        return;
      }

      setProduct(productData);
      setPriceHistory(history);
      setPriceStats(stats);
      navigation.setOptions({ title: productData.name });
    } catch (error) {
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrice = async () => {
    if (!newPrice || !product) {
      return;
    }

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      await ProductService.updateProduct(product.id, { currentPrice: price });
      setNewPrice('');
      await loadProductDetails();
      Alert.alert('Success', 'Price updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update price');
    }
  };

  const handleOpenUrl = async () => {
    if (!product?.url) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(product.url);
      if (canOpen) {
        await Linking.openURL(product.url);
      } else {
        Alert.alert('Error', 'Cannot open URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  if (!product) {
    return null;
  }

  const isPriceGood =
    product.currentPrice !== undefined &&
    product.targetPrice !== undefined &&
    product.currentPrice <= product.targetPrice;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Product Info */}
        <View style={[styles.card, { backgroundColor: colors.border }]}>
          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>

          {product.description && (
            <Text style={[styles.description, { color: colors.text }]}>
              {product.description}
            </Text>
          )}

          <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>

          {product.url && (
            <TouchableOpacity
              style={[styles.urlButton, { borderColor: colors.primary }]}
              onPress={handleOpenUrl}>
              <Text style={[styles.urlButtonText, { color: colors.primary }]}>View Product</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Current Price */}
        {product.currentPrice !== undefined && (
          <View style={[styles.card, { backgroundColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Price</Text>
            <Text style={[styles.currentPrice, { color: colors.primary }]}>
              ${product.currentPrice.toFixed(2)}
            </Text>

            {product.targetPrice !== undefined && (
              <>
                <Text style={[styles.targetLabel, { color: colors.text }]}>
                  Target: ${product.targetPrice.toFixed(2)}
                </Text>

                {isPriceGood && (
                  <View style={[styles.goodDealBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.goodDealText}>✓ Great Deal!</Text>
                  </View>
                )}

                {!isPriceGood && priceStats && (
                  <Text style={[styles.priceDiff, { color: colors.warning }]}>
                    ${(product.currentPrice - product.targetPrice).toFixed(2)} above target
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Price Statistics */}
        {priceStats && (
          <View style={[styles.card, { backgroundColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Statistics</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Average</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  ${priceStats.averagePrice.toFixed(2)}
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Change</Text>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        priceStats.priceChange < 0
                          ? colors.success
                          : priceStats.priceChange > 0
                            ? colors.error
                            : colors.text,
                    },
                  ]}>
                  {priceStats.priceChange >= 0 ? '+' : ''}
                  {priceStats.priceChangePercentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Add Price */}
        <View style={[styles.card, { backgroundColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Update Price</Text>
          <View style={styles.addPriceRow}>
            <TextInput
              style={[styles.priceInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Enter new price"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddPrice}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Chart */}
        {priceHistory.length > 0 && (
          <PriceChart priceHistory={priceHistory} targetPrice={product.targetPrice} />
        )}

        {/* Price History List */}
        <View style={[styles.card, { backgroundColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Price History ({priceHistory.length})
          </Text>

          {priceHistory.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No price history yet. Add a price to start tracking.
            </Text>
          ) : (
            <View style={styles.historyList}>
              {priceHistory
                .slice()
                .reverse()
                .map(record => (
                  <View key={record.id} style={styles.historyItem}>
                    <View>
                      <Text style={[styles.historyPrice, { color: colors.text }]}>
                        ${record.price.toFixed(2)}
                      </Text>
                      <Text style={[styles.historyDate, { color: colors.text }]}>
                        {formatDate(record.recordedAt)}
                      </Text>
                    </View>
                    {record.source && (
                      <Text style={[styles.historySource, { color: colors.text }]}>
                        {record.source}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* Metadata */}
        <View style={[styles.card, { backgroundColor: colors.border }]}>
          <Text style={[styles.metadataText, { color: colors.text }]}>
            Created: {formatDate(product.createdAt)}
          </Text>
          <Text style={[styles.metadataText, { color: colors.text }]}>
            Updated: {formatDate(product.updatedAt)}
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
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  urlButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  urlButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  targetLabel: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  priceDiff: {
    fontSize: 14,
    fontWeight: '500',
  },
  goodDealBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  goodDealText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addPriceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  historyPrice: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  historySource: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingVertical: 16,
  },
  metadataText: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
});

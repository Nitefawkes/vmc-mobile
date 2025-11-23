import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Product, ProductCategory } from '@types/product';
import { ProductService } from '@services/product.service';
import { ProductCard } from '@components/ProductCard';
import { EmptyState } from '@components/EmptyState';
import { Colors } from '@constants/colors';

export const ProductsScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>(ProductCategory.ELECTRONICS);
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formTargetPrice, setFormTargetPrice] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const allProducts = await ProductService.getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormCategory(ProductCategory.ELECTRONICS);
    setFormCurrentPrice('');
    setFormTargetPrice('');
    setFormUrl('');
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormCategory(product.category);
    setFormCurrentPrice(product.currentPrice?.toString() || '');
    setFormTargetPrice(product.targetPrice?.toString() || '');
    setFormUrl(product.url || '');
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    try {
      const productData = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
        currentPrice: formCurrentPrice ? parseFloat(formCurrentPrice) : undefined,
        targetPrice: formTargetPrice ? parseFloat(formTargetPrice) : undefined,
        url: formUrl.trim() || undefined,
      };

      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await ProductService.createProduct(productData);
        Alert.alert('Success', 'Product added successfully');
      }

      setModalVisible(false);
      await loadProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ProductService.deleteProduct(product.id);
            await loadProducts();
            Alert.alert('Success', 'Product deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Price Tracker</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddProduct}>
          <Text style={styles.addButtonText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.border, color: colors.text }]}
        placeholder="Search products..."
        placeholderTextColor={isDarkMode ? '#999' : '#666'}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title={searchQuery ? 'No Results' : 'No Products Yet'}
          message={
            searchQuery
              ? 'Try adjusting your search'
              : 'Add products to track their prices over time'
          }
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={product => {
                Alert.alert(product.name, 'Choose an action', [
                  { text: 'Edit', onPress: () => handleEditProduct(product) },
                  { text: 'Delete', onPress: () => handleDeleteProduct(product), style: 'destructive' },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelButton, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            <TouchableOpacity onPress={handleSaveProduct}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text }]}>Product Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
              value={formName}
              onChangeText={setFormName}
              placeholder="Enter product name"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
            />

            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.border, color: colors.text }]}
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder="Enter description"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {Object.values(ProductCategory).map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.border },
                    formCategory === category && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFormCategory(category)}>
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: formCategory === category ? '#FFF' : colors.text },
                    ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Current Price</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
              value={formCurrentPrice}
              onChangeText={setFormCurrentPrice}
              placeholder="0.00"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: colors.text }]}>Target Price</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
              value={formTargetPrice}
              onChangeText={setFormTargetPrice}
              placeholder="0.00"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: colors.text }]}>Product URL</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
              value={formUrl}
              onChangeText={setFormUrl}
              placeholder="https://..."
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              keyboardType="url"
              autoCapitalize="none"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

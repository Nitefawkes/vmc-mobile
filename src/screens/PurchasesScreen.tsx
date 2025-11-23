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
import { Purchase, ProductCategory, SpendingSummary } from '@types/product';
import { PurchaseService } from '@services/purchase.service';
import { ProductService } from '@services/product.service';
import { PurchaseCard } from '@components/PurchaseCard';
import { EmptyState } from '@components/EmptyState';
import { Colors } from '@constants/colors';

export const PurchasesScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [formProductName, setFormProductName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formCategory, setFormCategory] = useState<ProductCategory>(ProductCategory.GROCERIES);
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStore, setFormStore] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [allPurchases, spendingSummary] = await Promise.all([
        PurchaseService.getAllPurchases(),
        PurchaseService.getSpendingSummary(),
      ]);
      setPurchases(allPurchases);
      setSummary(spendingSummary);
    } catch (error) {
      Alert.alert('Error', 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddPurchase = () => {
    setFormProductName('');
    setFormPrice('');
    setFormQuantity('1');
    setFormCategory(ProductCategory.GROCERIES);
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormStore('');
    setFormNotes('');
    setModalVisible(true);
  };

  const handleSavePurchase = async () => {
    if (!formProductName.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    if (!formPrice || parseFloat(formPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      await PurchaseService.createPurchase({
        productName: formProductName.trim(),
        price: parseFloat(formPrice),
        quantity: parseInt(formQuantity) || 1,
        category: formCategory,
        purchaseDate: formPurchaseDate,
        store: formStore.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });

      Alert.alert('Success', 'Purchase recorded successfully');
      setModalVisible(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save purchase');
    }
  };

  const handleDeletePurchase = (purchase: Purchase) => {
    Alert.alert(
      'Delete Purchase',
      `Are you sure you want to delete this purchase of "${purchase.productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PurchaseService.deletePurchase(purchase.id);
              await loadData();
              Alert.alert('Success', 'Purchase deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete purchase');
            }
          },
        },
      ],
    );
  };

  const filteredPurchases = purchases.filter(
    p =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.store?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Purchases</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddPurchase}>
          <Text style={styles.addButtonText}>+ Add Purchase</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={[styles.summaryCard, { backgroundColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                ${summary.totalSpent.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Purchases</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {summary.purchaseCount}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Avg. Purchase</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                ${summary.averagePurchaseAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.border, color: colors.text }]}
        placeholder="Search purchases..."
        placeholderTextColor={isDarkMode ? '#999' : '#666'}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      ) : filteredPurchases.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title={searchQuery ? 'No Results' : 'No Purchases Yet'}
          message={
            searchQuery
              ? 'Try adjusting your search'
              : 'Start tracking your purchases to analyze spending'
          }
        />
      ) : (
        <FlatList
          data={filteredPurchases}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PurchaseCard
              purchase={item}
              onPress={purchase => handleDeletePurchase(purchase)}
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Purchase</Text>
            <TouchableOpacity onPress={handleSavePurchase}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text }]}>Product Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
              value={formProductName}
              onChangeText={setFormProductName}
              placeholder="What did you buy?"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: colors.text }]}>Price *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
                  value={formPrice}
                  onChangeText={setFormPrice}
                  placeholder="0.00"
                  placeholderTextColor={isDarkMode ? '#999' : '#666'}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: colors.text }]}>Quantity</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
                  value={formQuantity}
                  onChangeText={setFormQuantity}
                  placeholder="1"
                  placeholderTextColor={isDarkMode ? '#999' : '#666'}
                  keyboardType="number-pad"
                />
              </View>
            </View>

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

            <Text style={[styles.label, { color: colors.text }]}>Purchase Date</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
              value={formPurchaseDate}
              onChangeText={setFormPurchaseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
            />

            <Text style={[styles.label, { color: colors.text }]}>Store</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
              value={formStore}
              onChangeText={setFormStore}
              placeholder="Where did you buy it?"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
            />

            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.border, color: colors.text }]}
              value={formNotes}
              onChangeText={setFormNotes}
              placeholder="Any additional notes..."
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              multiline
              numberOfLines={3}
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
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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

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
  Switch,
  Modal,
} from 'react-native';
import { ProductCategory } from '@types/product';
import { BudgetStatus } from '@types/budget';
import { BudgetService } from '@services/budget.service';
import { ProductService } from '@services/product.service';
import { PurchaseService } from '@services/purchase.service';
import { Colors } from '@constants/colors';

export const SettingsScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(
    ProductCategory.GROCERIES,
  );
  const [budgetAmount, setBudgetAmount] = useState('');

  useEffect(() => {
    loadBudgetStatuses();
  }, []);

  const loadBudgetStatuses = async () => {
    try {
      const statuses = await BudgetService.getAllBudgetStatuses();
      setBudgetStatuses(statuses);
    } catch (error) {
      Alert.alert('Error', 'Failed to load budget information');
    }
  };

  const handleAddBudget = () => {
    setBudgetAmount('');
    setModalVisible(true);
  };

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    try {
      await BudgetService.createBudget(selectedCategory, amount);
      Alert.alert('Success', 'Budget created successfully');
      setModalVisible(false);
      await loadBudgetStatuses();
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        Alert.alert('Error', 'Budget already exists for this category. Please edit the existing one.');
      } else {
        Alert.alert('Error', 'Failed to create budget');
      }
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all products, purchases, and budgets. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                ProductService.clearAllData(),
                PurchaseService.clearAllData(),
                BudgetService.clearAllData(),
              ]);
              Alert.alert('Success', 'All data cleared');
              await loadBudgetStatuses();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Category Budgets */}
        <View style={[styles.section, { backgroundColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Budgets</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddBudget}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {budgetStatuses.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No budgets set. Tap "+ Add" to create your first budget.
            </Text>
          ) : (
            budgetStatuses.map(status => {
              const progressColor = status.isOverBudget
                ? colors.error
                : status.percentageUsed > 80
                  ? colors.warning
                  : colors.success;

              return (
                <View key={status.category} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={[styles.budgetCategory, { color: colors.text }]}>
                      {status.category}
                    </Text>
                    <Text style={[styles.budgetAmount, { color: colors.text }]}>
                      ${status.spent.toFixed(2)} / ${status.limit.toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(status.percentageUsed, 100)}%`,
                          backgroundColor: progressColor,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.budgetFooter}>
                    <Text style={[styles.budgetPercent, { color: progressColor }]}>
                      {status.percentageUsed.toFixed(0)}% used
                    </Text>
                    <Text style={[styles.budgetRemaining, { color: colors.text }]}>
                      ${Math.abs(status.remaining).toFixed(2)}{' '}
                      {status.isOverBudget ? 'over' : 'remaining'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* App Info */}
        <View style={[styles.section, { backgroundColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Version</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>0.1.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>License</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Apache 2.0</Text>
          </View>
        </View>

        {/* Data Management */}
        <View style={[styles.section, { backgroundColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>

          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: colors.error }]}
            onPress={handleClearAllData}>
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>Clear All Data</Text>
          </TouchableOpacity>

          <Text style={[styles.warningText, { color: colors.text }]}>
            Warning: This action cannot be undone
          </Text>
        </View>
      </View>

      {/* Add Budget Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelButton, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Budget</Text>
            <TouchableOpacity onPress={handleSaveBudget}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {Object.values(ProductCategory).map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.border },
                    selectedCategory === category && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSelectedCategory(category)}>
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: selectedCategory === category ? '#FFF' : colors.text },
                    ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Monthly Budget</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              placeholder="Enter amount"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </Modal>
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
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingVertical: 16,
  },
  budgetItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 14,
    opacity: 0.8,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetPercent: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetRemaining: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    opacity: 0.7,
  },
  dangerButton: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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

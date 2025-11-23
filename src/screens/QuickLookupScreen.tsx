/**
 * Quick Lookup Screen
 * Fast UPC lookup for shopping - check if you own an item
 * User Journey: Estate sale hunter needs instant yes/no
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { UI_CONFIG } from '../constants';
import { quickUPCLookup, checkDuplicateBeforeAdd } from '../utils/journeyHelpers';
import { CatalogItem } from '../types';

export default function QuickLookupScreen() {
  const [upc, setUpc] = useState('');
  const [result, setResult] = useState<{
    owned: boolean;
    item?: CatalogItem;
    quantity?: number;
    onWishlist: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleLookup = async () => {
    if (!upc.trim()) {
      Alert.alert('Error', 'Please enter a UPC code');
      return;
    }

    setLoading(true);

    try {
      const lookupResult = await quickUPCLookup(upc.trim());
      setResult(lookupResult);

      // Add to history
      if (!history.includes(upc.trim())) {
        setHistory([upc.trim(), ...history.slice(0, 9)]); // Keep last 10
      }
    } catch (error) {
      console.error('[QuickLookup] Error:', error);
      Alert.alert('Error', 'Failed to lookup UPC');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUpc('');
    setResult(null);
  };

  const handleHistoryItem = (historicUpc: string) => {
    setUpc(historicUpc);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Lookup</Text>
        <Text style={styles.subtitle}>
          Fast UPC check for shopping
        </Text>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter UPC code"
          placeholderTextColor={UI_CONFIG.THEME.TEXT_SECONDARY}
          value={upc}
          onChangeText={setUpc}
          keyboardType="numeric"
          autoFocus
          onSubmitEditing={handleLookup}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.lookupButton]}
            onPress={handleLookup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Checking...' : '🔍 Look Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Result Section */}
      {result && (
        <View style={styles.resultSection}>
          {result.owned ? (
            <>
              {/* Already Owned */}
              <View style={[styles.resultCard, styles.ownedCard]}>
                <Text style={styles.resultIcon}>✅</Text>
                <Text style={styles.resultTitle}>YOU OWN THIS</Text>
                <Text style={styles.resultSubtitle}>
                  Quantity: {result.quantity}
                </Text>
              </View>

              {result.item && (
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle}>{result.item.metadata.title}</Text>

                  {'artist' in result.item.metadata && (
                    <Text style={styles.itemInfo}>
                      Artist: {result.item.metadata.artist}
                    </Text>
                  )}

                  {'director' in result.item.metadata && result.item.metadata.director && (
                    <Text style={styles.itemInfo}>
                      Director: {result.item.metadata.director}
                    </Text>
                  )}

                  {'developer' in result.item.metadata && result.item.metadata.developer && (
                    <Text style={styles.itemInfo}>
                      Developer: {result.item.metadata.developer}
                    </Text>
                  )}

                  <Text style={styles.itemInfo}>Format: {result.item.format}</Text>
                  <Text style={styles.itemInfo}>Condition: {result.item.condition}</Text>

                  {result.item.location && (
                    <Text style={styles.itemInfo}>Location: {result.item.location}</Text>
                  )}

                  {result.item.estimatedValue && (
                    <Text style={styles.itemValue}>
                      Value: ${result.item.estimatedValue.toFixed(2)}
                    </Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              {/* Not Owned */}
              <View style={[styles.resultCard, styles.notOwnedCard]}>
                <Text style={styles.resultIcon}>❌</Text>
                <Text style={styles.resultTitle}>NOT IN COLLECTION</Text>
                <Text style={styles.resultSubtitle}>
                  This item is not in your collection
                </Text>
              </View>

              {result.onWishlist && (
                <View style={[styles.wishlistBanner]}>
                  <Text style={styles.wishlistIcon}>🎯</Text>
                  <Text style={styles.wishlistText}>ON YOUR WISHLIST!</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Quick Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
        <Text style={styles.tipText}>
          • Use this while shopping to instantly check if you own an item
        </Text>
        <Text style={styles.tipText}>
          • Items on your wishlist will show a special notification
        </Text>
        <Text style={styles.tipText}>
          • Recent lookups appear below for quick re-checking
        </Text>
      </View>

      {/* History */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Lookups</Text>
          {history.map((historicUpc, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyItem}
              onPress={() => handleHistoryItem(historicUpc)}
            >
              <Text style={styles.historyUpc}>{historicUpc}</Text>
              <Text style={styles.historyAction}>Tap to recheck</Text>
            </TouchableOpacity>
          ))}
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
  header: {
    padding: 20,
    paddingTop: 60,
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
  inputSection: {
    padding: 20,
  },
  input: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    padding: 16,
    borderRadius: 12,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  lookupButton: {
    backgroundColor: UI_CONFIG.THEME.ACCENT,
  },
  clearButton: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
  },
  buttonText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultSection: {
    padding: 20,
    paddingTop: 10,
  },
  resultCard: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  ownedCard: {
    backgroundColor: UI_CONFIG.THEME.SUCCESS + '33',
    borderWidth: 3,
    borderColor: UI_CONFIG.THEME.SUCCESS,
  },
  notOwnedCard: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    borderWidth: 3,
    borderColor: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
  itemDetails: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 20,
    borderRadius: 12,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 12,
  },
  itemInfo: {
    fontSize: 15,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 6,
  },
  itemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.ACCENT,
    marginTop: 10,
  },
  wishlistBanner: {
    backgroundColor: UI_CONFIG.THEME.WARNING + '33',
    borderWidth: 3,
    borderColor: UI_CONFIG.THEME.WARNING,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  wishlistText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
  },
  tipsSection: {
    padding: 20,
    backgroundColor: UI_CONFIG.THEME.SECONDARY + '66',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    marginBottom: 6,
    lineHeight: 20,
  },
  historySection: {
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: UI_CONFIG.THEME.SECONDARY,
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyUpc: {
    fontSize: 16,
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  historyAction: {
    fontSize: 13,
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
  },
});

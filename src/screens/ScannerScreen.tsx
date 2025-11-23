/**
 * Scanner Screen
 * Real-time UPC barcode scanning with Vision Camera
 * Target: ≤5s scan-to-save time, ≥95% accuracy
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Vibration } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import { resolveMetadata } from '../services/metadataResolver';
import { insertCatalogItem } from '../database/catalogRepository';
import { UI_CONFIG, SCAN_CONFIG } from '../constants';
import { MusicFormat, ItemCondition, ActionTag } from '../types';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedUPC, setLastScannedUPC] = useState<string | null>(null);

  const device = useCameraDevice('back');
  const navigation = useNavigation();

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle barcode detection
  const handleBarcodeDetected = useCallback(
    async (codes: any[]) => {
      if (isProcessing || codes.length === 0) return;

      const code = codes[0];
      const upc = code.value;

      // Prevent duplicate scans
      if (upc === lastScannedUPC) return;

      setIsProcessing(true);
      setLastScannedUPC(upc);

      // Haptic feedback
      if (SCAN_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
        Vibration.vibrate(100);
      }

      console.log(`[Scanner] Detected UPC: ${upc}`);

      try {
        // Resolve metadata
        const metadata = await resolveMetadata(upc);

        if (!metadata) {
          Alert.alert(
            'No Metadata Found',
            `Could not find information for UPC: ${upc}. Save anyway?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  setIsProcessing(false);
                  setLastScannedUPC(null);
                },
              },
              {
                text: 'Save Manually',
                onPress: () => {
                  // TODO: Navigate to manual entry screen
                  setIsProcessing(false);
                  setLastScannedUPC(null);
                },
              },
            ]
          );
          return;
        }

        // Save to database
        const itemId = await insertCatalogItem({
          upc,
          metadata,
          format: MusicFormat.CASSETTE, // Default, can be changed later
          condition: ItemCondition.GOOD,
          actionTag: ActionTag.UNDECIDED,
          quantity: 1,
          needsSync: false,
        });

        console.log(`[Scanner] Item saved with ID: ${itemId}`);

        // Show success and navigate to item detail
        Alert.alert(
          'Success!',
          `Added: ${metadata.artist} - ${metadata.title}`,
          [
            {
              text: 'View Details',
              onPress: () => {
                navigation.navigate('ItemDetail' as never, { itemId } as never);
                setIsProcessing(false);
                setLastScannedUPC(null);
              },
            },
            {
              text: 'Scan Another',
              onPress: () => {
                setIsProcessing(false);
                setLastScannedUPC(null);
              },
              style: 'cancel',
            },
          ]
        );
      } catch (error) {
        console.error('[Scanner] Error:', error);
        Alert.alert('Error', 'Failed to process scan. Please try again.');
        setIsProcessing(false);
        setLastScannedUPC(null);
      }
    },
    [isProcessing, lastScannedUPC, navigation]
  );

  // Code scanner configuration
  const codeScanner = useCodeScanner({
    codeTypes: ['upc-a', 'upc-e', 'ean-13', 'ean-8'],
    onCodeScanned: handleBarcodeDetected,
  });

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isProcessing}
        codeScanner={codeScanner}
      />

      {/* Reticle overlay */}
      <View style={styles.overlay}>
        <View style={styles.reticle}>
          <Text style={styles.reticleText}>
            {isProcessing ? 'Processing...' : 'Align barcode in frame'}
          </Text>
        </View>
      </View>

      {/* Status indicator */}
      {isProcessing && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>Resolving metadata...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
  },
  permissionText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 300,
    height: 200,
    borderWidth: 3,
    borderColor: UI_CONFIG.THEME.SUCCESS,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  reticleText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: UI_CONFIG.THEME.ACCENT,
    padding: 15,
    borderRadius: 10,
  },
  statusText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

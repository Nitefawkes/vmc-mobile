/**
 * Scanner Screen - Phase 1 Enhanced
 * Real-time UPC barcode scanning with preview sheet and Rapid Mode
 * Target: ≤5s scan-to-save time, ≥95% accuracy
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Vibration, TouchableOpacity, Switch } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveMetadata } from '../services/metadataResolver';
import { insertCatalogItem } from '../database/catalogRepository';
import { UI_CONFIG, SCAN_CONFIG } from '../constants';
import { MusicFormat, ItemCondition, ActionTag, ItemMetadata } from '../types';
import ScanPreviewSheet from '../components/ScanPreviewSheet';

const RAPID_MODE_KEY = '@rapid_mode_enabled';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedUPC, setLastScannedUPC] = useState<string | null>(null);
  const [rapidMode, setRapidMode] = useState(SCAN_CONFIG.RAPID_MODE_DEFAULT);
  const [showPreview, setShowPreview] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState<ItemMetadata | null>(null);
  const [currentUPC, setCurrentUPC] = useState<string>('');

  const device = useCameraDevice('back');
  const navigation = useNavigation();

  // Load rapid mode preference
  useEffect(() => {
    AsyncStorage.getItem(RAPID_MODE_KEY).then((value) => {
      if (value !== null) {
        setRapidMode(value === 'true');
      }
    });
  }, []);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Toggle rapid mode
  const toggleRapidMode = useCallback(async () => {
    const newValue = !rapidMode;
    setRapidMode(newValue);
    await AsyncStorage.setItem(RAPID_MODE_KEY, String(newValue));
  }, [rapidMode]);

  // Handle save from preview sheet
  const handleSave = useCallback(
    async (format: MusicFormat) => {
      if (!currentMetadata || !currentUPC) return;

      try {
        const itemId = await insertCatalogItem({
          upc: currentUPC,
          metadata: currentMetadata,
          format,
          condition: ItemCondition.GOOD,
          actionTag: ActionTag.UNDECIDED,
          quantity: 1,
          needsSync: false,
        });

        console.log(`[Scanner] Item saved with ID: ${itemId}`);
        setShowPreview(false);
        setCurrentMetadata(null);
        setCurrentUPC('');

        if (rapidMode) {
          // Rapid Mode: Reset immediately for next scan
          setIsProcessing(false);
          setLastScannedUPC(null);
          Vibration.vibrate(50); // Quick success feedback
        } else {
          // Normal Mode: Navigate to item detail
          setIsProcessing(false);
          setLastScannedUPC(null);
          navigation.navigate('ItemDetail' as never, { itemId } as never);
        }
      } catch (error) {
        console.error('[Scanner] Save error:', error);
        Alert.alert('Error', 'Failed to save item. Please try again.');
        setIsProcessing(false);
        setLastScannedUPC(null);
      }
    },
    [currentMetadata, currentUPC, rapidMode, navigation]
  );

  // Handle cancel from preview sheet
  const handleCancel = useCallback(() => {
    setShowPreview(false);
    setCurrentMetadata(null);
    setCurrentUPC('');
    setIsProcessing(false);
    setLastScannedUPC(null);
  }, []);

  // Handle barcode detection
  const handleBarcodeDetected = useCallback(
    async (codes: any[]) => {
      if (isProcessing || codes.length === 0 || showPreview) return;

      const code = codes[0];
      const upc = code.value;

      // Prevent duplicate scans
      if (upc === lastScannedUPC) return;

      setIsProcessing(true);
      setLastScannedUPC(upc);
      setCurrentUPC(upc);

      // Haptic feedback
      if (SCAN_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
        Vibration.vibrate(100);
      }

      console.log(`[Scanner] Detected UPC: ${upc}`);

      try {
        // Show preview sheet immediately (loading state)
        setShowPreview(true);

        // Resolve metadata
        const metadata = await resolveMetadata(upc);

        if (!metadata) {
          setShowPreview(false);
          Alert.alert(
            'No Metadata Found',
            `Could not find information for UPC: ${upc}. Try scanning again or enter manually.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsProcessing(false);
                  setLastScannedUPC(null);
                },
              },
            ]
          );
          return;
        }

        // Update preview with metadata
        setCurrentMetadata(metadata);
      } catch (error) {
        console.error('[Scanner] Error:', error);
        setShowPreview(false);
        Alert.alert('Error', 'Failed to resolve metadata. Please try again.');
        setIsProcessing(false);
        setLastScannedUPC(null);
      }
    },
    [isProcessing, lastScannedUPC, showPreview]
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
        isActive={!isProcessing && !showPreview}
        codeScanner={codeScanner}
      />

      {/* Rapid Mode Toggle */}
      <View style={styles.rapidModeContainer}>
        <View style={styles.rapidModeToggle}>
          <Text style={styles.rapidModeText}>Rapid Mode</Text>
          <Switch
            value={rapidMode}
            onValueChange={toggleRapidMode}
            trackColor={{
              false: UI_CONFIG.THEME.SECONDARY,
              true: UI_CONFIG.THEME.SUCCESS,
            }}
            thumbColor={UI_CONFIG.THEME.TEXT_PRIMARY}
          />
        </View>
        {rapidMode && (
          <Text style={styles.rapidModeHint}>
            Auto-continue after save
          </Text>
        )}
      </View>

      {/* Reticle overlay */}
      <View style={styles.overlay}>
        <View style={styles.reticle}>
          <Text style={styles.reticleText}>
            {isProcessing ? 'Processing...' : 'Align barcode in frame'}
          </Text>
        </View>
      </View>

      {/* Preview Sheet */}
      <ScanPreviewSheet
        visible={showPreview}
        metadata={currentMetadata}
        upc={currentUPC}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isProcessing && !currentMetadata}
      />
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
  rapidModeContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  rapidModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 10,
  },
  rapidModeText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: 'bold',
  },
  rapidModeHint: {
    color: UI_CONFIG.THEME.TEXT_SECONDARY,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
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
});

/**
 * Vintage Music Catalog - Main App Entry Point
 * Phase 0: "Hello Cassette" - Core scanning and cataloging functionality
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/setup';
import { UI_CONFIG } from './src/constants';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('[App] Initializing database...');
        await initDatabase();
        console.log('[App] Database initialized successfully');
        setIsReady(true);
      } catch (err) {
        console.error('[App] Initialization error:', err);
        setError('Failed to initialize app. Please restart.');
      }
    }

    prepare();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={UI_CONFIG.THEME.ACCENT} />
        <Text style={styles.loadingText}>Initializing...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.THEME.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: UI_CONFIG.THEME.TEXT_PRIMARY,
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    color: UI_CONFIG.THEME.ERROR,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

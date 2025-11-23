import React from 'react';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors } from '@constants/colors';
import { APP_NAME, APP_VERSION } from '@constants/index';

export const HomeScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
  const primaryColor = isDarkMode ? Colors.dark.primary : Colors.light.primary;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: primaryColor }]}>{APP_NAME}</Text>
        <Text style={[styles.version, { color: textColor }]}>Version {APP_VERSION}</Text>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Welcome!</Text>
          <Text style={[styles.sectionDescription, { color: textColor }]}>
            This is a React Native application built with TypeScript.
          </Text>
          <Text style={[styles.sectionDescription, { color: textColor }]}>
            Start by editing App.tsx or src/screens/HomeScreen.tsx to build your app.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Features</Text>
          <Text style={[styles.feature, { color: textColor }]}>✓ TypeScript support</Text>
          <Text style={[styles.feature, { color: textColor }]}>✓ ESLint & Prettier configured</Text>
          <Text style={[styles.feature, { color: textColor }]}>✓ Jest testing setup</Text>
          <Text style={[styles.feature, { color: textColor }]}>✓ Path aliases configured</Text>
          <Text style={[styles.feature, { color: textColor }]}>✓ Dark mode support</Text>
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
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  version: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  feature: {
    fontSize: 16,
    lineHeight: 28,
    marginLeft: 8,
  },
});

/**
 * Main App Navigator
 * Stack + Bottom Tabs navigation structure
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../constants';

// Import screens (will be created next)
import ScannerScreen from '../screens/ScannerScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WishlistScreen from '../screens/WishlistScreen';
import QuickLookupScreen from '../screens/QuickLookupScreen';
import SellModeScreen from '../screens/SellModeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

// Navigation type definitions
export type RootStackParamList = {
  MainTabs: undefined;
  ItemDetail: { itemId: string };
  QuickLookup: undefined;
  SellMode: undefined;
  Analytics: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Scanner: undefined;
  Library: undefined;
  Wishlist: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Bottom Tab Navigator
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: UI_CONFIG.THEME.PRIMARY,
        },
        headerTintColor: UI_CONFIG.THEME.TEXT_PRIMARY,
        tabBarStyle: {
          backgroundColor: UI_CONFIG.THEME.PRIMARY,
        },
        tabBarActiveTintColor: UI_CONFIG.THEME.ACCENT,
        tabBarInactiveTintColor: UI_CONFIG.THEME.TEXT_SECONDARY,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barcode-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root Stack Navigator
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: UI_CONFIG.THEME.PRIMARY,
          },
          headerTintColor: UI_CONFIG.THEME.TEXT_PRIMARY,
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ItemDetail"
          component={ItemDetailScreen}
          options={{ title: 'Item Details' }}
        />
        <Stack.Screen
          name="QuickLookup"
          component={QuickLookupScreen}
          options={{ title: 'Quick Lookup' }}
        />
        <Stack.Screen
          name="SellMode"
          component={SellModeScreen}
          options={{ title: 'Sell Mode' }}
        />
        <Stack.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{ title: 'Collection Analytics' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

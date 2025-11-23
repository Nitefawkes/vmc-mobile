/**
 * Main App Navigator
 * Stack + Bottom Tabs navigation structure
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UI_CONFIG } from '../constants';

// Import screens (will be created next)
import ScannerScreen from '../screens/ScannerScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WishlistScreen from '../screens/WishlistScreen';

// Navigation type definitions
export type RootStackParamList = {
  MainTabs: undefined;
  ItemDetail: { itemId: string };
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
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Scan',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          title: 'Library',
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          title: 'Wishlist',
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

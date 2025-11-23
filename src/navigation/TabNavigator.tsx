import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { HomeScreen } from '@screens/HomeScreen';
import { ProductsScreen } from '@screens/ProductsScreen';
import { PurchasesScreen } from '@screens/PurchasesScreen';
import { Colors } from '@constants/colors';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
          headerTitle: 'VMC Mobile',
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="🏷️" color={color} />,
          headerTitle: 'Price Tracker',
        }}
      />
      <Tab.Screen
        name="Purchases"
        component={PurchasesScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="🛍️" color={color} />,
          headerTitle: 'Purchase History',
        }}
      />
    </Tab.Navigator>
  );
};

// Simple icon component using emoji
const TabIcon: React.FC<{ icon: string; color: string }> = ({ icon }) => {
  return <>{icon}</>;
};

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import { ProductsScreen } from '@screens/ProductsScreen';
import { ProductDetailScreen } from '@screens/ProductDetailScreen';
import { Colors } from '@constants/colors';

export type ProductsStackParamList = {
  ProductsList: undefined;
  ProductDetail: { productId: string };
};

const Stack = createStackNavigator<ProductsStackParamList>();

export const ProductsStackNavigator: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="ProductsList"
        component={ProductsScreen}
        options={{
          headerShown: false, // Tab navigator will show the header
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          headerTitle: 'Product Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

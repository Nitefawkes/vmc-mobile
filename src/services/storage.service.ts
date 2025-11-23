/**
 * Storage Service
 * Handles persistent data storage using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@utils/logger';

export class StorageService {
  private static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      logger.debug(`Stored data for key: ${key}`);
    } catch (error) {
      logger.error(`Error storing data for key: ${key}`, error);
      throw error;
    }
  }

  private static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        return null;
      }
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      logger.error(`Error retrieving data for key: ${key}`, error);
      throw error;
    }
  }

  private static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      logger.debug(`Removed data for key: ${key}`);
    } catch (error) {
      logger.error(`Error removing data for key: ${key}`, error);
      throw error;
    }
  }

  private static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      logger.error('Error getting all keys', error);
      throw error;
    }
  }

  private static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      logger.debug('Cleared all storage');
    } catch (error) {
      logger.error('Error clearing storage', error);
      throw error;
    }
  }

  // Public API
  static async save<T>(key: string, value: T): Promise<void> {
    return this.setItem(key, value);
  }

  static async load<T>(key: string): Promise<T | null> {
    return this.getItem<T>(key);
  }

  static async delete(key: string): Promise<void> {
    return this.removeItem(key);
  }

  static async getKeys(): Promise<string[]> {
    return this.getAllKeys();
  }

  static async clearAll(): Promise<void> {
    return this.clear();
  }

  // Batch operations
  static async saveMultiple(items: Array<[string, unknown]>): Promise<void> {
    try {
      const pairs = items.map(([key, value]) => [key, JSON.stringify(value)]);
      await AsyncStorage.multiSet(pairs as [string, string][]);
      logger.debug(`Stored ${items.length} items`);
    } catch (error) {
      logger.error('Error storing multiple items', error);
      throw error;
    }
  }

  static async loadMultiple<T>(keys: string[]): Promise<Map<string, T>> {
    try {
      const result = await AsyncStorage.multiGet(keys);
      const map = new Map<string, T>();
      result.forEach(([key, value]) => {
        if (value !== null) {
          map.set(key, JSON.parse(value) as T);
        }
      });
      return map;
    } catch (error) {
      logger.error('Error loading multiple items', error);
      throw error;
    }
  }
}

// Storage keys constants
export const STORAGE_KEYS = {
  PRODUCTS: 'products',
  PURCHASES: 'purchases',
  PRICE_HISTORY: 'price_history',
  PRICE_ALERTS: 'price_alerts',
  USER_PREFERENCES: 'user_preferences',
} as const;

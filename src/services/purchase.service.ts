/**
 * Purchase Service
 * Manages purchase tracking and spending analytics
 */

import { Purchase, ProductCategory, SpendingSummary } from '@types/product';
import { StorageService, STORAGE_KEYS } from './storage.service';
import { logger } from '@utils/logger';

export class PurchaseService {
  private static purchases: Purchase[] = [];
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const purchases = await StorageService.load<Purchase[]>(STORAGE_KEYS.PURCHASES);
      this.purchases = purchases || [];
      this.initialized = true;
      logger.info(`Loaded ${this.purchases.length} purchases`);
    } catch (error) {
      logger.error('Error initializing PurchaseService', error);
      throw error;
    }
  }

  private static async savePurchases(): Promise<void> {
    await StorageService.save(STORAGE_KEYS.PURCHASES, this.purchases);
  }

  // Purchase CRUD operations
  static async getAllPurchases(): Promise<Purchase[]> {
    await this.initialize();
    return [...this.purchases].sort(
      (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    );
  }

  static async getPurchaseById(id: string): Promise<Purchase | null> {
    await this.initialize();
    return this.purchases.find(p => p.id === id) || null;
  }

  static async createPurchase(
    purchaseData: Omit<Purchase, 'id' | 'totalAmount' | 'createdAt'>,
  ): Promise<Purchase> {
    await this.initialize();

    const totalAmount = purchaseData.price * purchaseData.quantity;
    const purchase: Purchase = {
      ...purchaseData,
      id: this.generateId(),
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    this.purchases.push(purchase);
    await this.savePurchases();

    logger.info(`Created purchase: ${purchase.productName} - $${totalAmount}`);
    return purchase;
  }

  static async updatePurchase(id: string, updates: Partial<Purchase>): Promise<Purchase> {
    await this.initialize();

    const index = this.purchases.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Purchase not found: ${id}`);
    }

    const updatedPurchase: Purchase = {
      ...this.purchases[index],
      ...updates,
      id, // Ensure ID doesn't change
    };

    // Recalculate total if price or quantity changed
    if (updates.price !== undefined || updates.quantity !== undefined) {
      updatedPurchase.totalAmount = updatedPurchase.price * updatedPurchase.quantity;
    }

    this.purchases[index] = updatedPurchase;
    await this.savePurchases();

    logger.info(`Updated purchase: ${id}`);
    return updatedPurchase;
  }

  static async deletePurchase(id: string): Promise<void> {
    await this.initialize();

    this.purchases = this.purchases.filter(p => p.id !== id);
    await this.savePurchases();

    logger.info(`Deleted purchase: ${id}`);
  }

  // Analytics
  static async getSpendingSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<SpendingSummary> {
    await this.initialize();

    let filteredPurchases = this.purchases;

    if (startDate) {
      filteredPurchases = filteredPurchases.filter(
        p => new Date(p.purchaseDate) >= new Date(startDate),
      );
    }

    if (endDate) {
      filteredPurchases = filteredPurchases.filter(
        p => new Date(p.purchaseDate) <= new Date(endDate),
      );
    }

    const totalSpent = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const purchaseCount = filteredPurchases.length;
    const averagePurchaseAmount = purchaseCount > 0 ? totalSpent / purchaseCount : 0;

    const spendingByCategory: Record<ProductCategory, number> = {} as Record<
      ProductCategory,
      number
    >;

    filteredPurchases.forEach(purchase => {
      const category = purchase.category;
      spendingByCategory[category] = (spendingByCategory[category] || 0) + purchase.totalAmount;
    });

    const topCategory =
      (Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a)[0]?.[0] as
        | ProductCategory
        | undefined) || ProductCategory.OTHER;

    return {
      totalSpent,
      purchaseCount,
      averagePurchaseAmount,
      topCategory,
      spendingByCategory,
    };
  }

  static async getPurchasesByCategory(category: ProductCategory): Promise<Purchase[]> {
    await this.initialize();
    return this.purchases
      .filter(p => p.category === category)
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  static async getPurchasesByProduct(productId: string): Promise<Purchase[]> {
    await this.initialize();
    return this.purchases
      .filter(p => p.productId === productId)
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  static async getPurchasesByDateRange(startDate: string, endDate: string): Promise<Purchase[]> {
    await this.initialize();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.purchases
      .filter(p => {
        const purchaseDate = new Date(p.purchaseDate);
        return purchaseDate >= start && purchaseDate <= end;
      })
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  static async searchPurchases(query: string): Promise<Purchase[]> {
    await this.initialize();
    const lowerQuery = query.toLowerCase();
    return this.purchases.filter(
      p =>
        p.productName.toLowerCase().includes(lowerQuery) ||
        p.store?.toLowerCase().includes(lowerQuery) ||
        p.notes?.toLowerCase().includes(lowerQuery),
    );
  }

  // Statistics
  static async getTotalSpentByMonth(year: number): Promise<Map<number, number>> {
    await this.initialize();
    const monthlySpending = new Map<number, number>();

    for (let month = 0; month < 12; month++) {
      monthlySpending.set(month, 0);
    }

    this.purchases.forEach(purchase => {
      const date = new Date(purchase.purchaseDate);
      if (date.getFullYear() === year) {
        const month = date.getMonth();
        monthlySpending.set(month, (monthlySpending.get(month) || 0) + purchase.totalAmount);
      }
    });

    return monthlySpending;
  }

  // Utility
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static async clearAllData(): Promise<void> {
    this.purchases = [];
    await this.savePurchases();
    logger.info('Cleared all purchase data');
  }
}

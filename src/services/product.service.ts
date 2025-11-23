/**
 * Product Service
 * Manages products and price tracking
 */

import { Product, PriceHistory, PriceStats, PriceAlert } from '@types/product';
import { StorageService, STORAGE_KEYS } from './storage.service';
import { logger } from '@utils/logger';

export class ProductService {
  private static products: Product[] = [];
  private static priceHistory: PriceHistory[] = [];
  private static priceAlerts: PriceAlert[] = [];
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const products = await StorageService.load<Product[]>(STORAGE_KEYS.PRODUCTS);
      const priceHistory = await StorageService.load<PriceHistory[]>(
        STORAGE_KEYS.PRICE_HISTORY,
      );
      const priceAlerts = await StorageService.load<PriceAlert[]>(STORAGE_KEYS.PRICE_ALERTS);

      this.products = products || [];
      this.priceHistory = priceHistory || [];
      this.priceAlerts = priceAlerts || [];
      this.initialized = true;

      logger.info(
        `Loaded ${this.products.length} products, ${this.priceHistory.length} price records`,
      );
    } catch (error) {
      logger.error('Error initializing ProductService', error);
      throw error;
    }
  }

  private static async saveProducts(): Promise<void> {
    await StorageService.save(STORAGE_KEYS.PRODUCTS, this.products);
  }

  private static async savePriceHistory(): Promise<void> {
    await StorageService.save(STORAGE_KEYS.PRICE_HISTORY, this.priceHistory);
  }

  private static async savePriceAlerts(): Promise<void> {
    await StorageService.save(STORAGE_KEYS.PRICE_ALERTS, this.priceAlerts);
  }

  // Product CRUD operations
  static async getAllProducts(): Promise<Product[]> {
    await this.initialize();
    return [...this.products];
  }

  static async getProductById(id: string): Promise<Product | null> {
    await this.initialize();
    return this.products.find(p => p.id === id) || null;
  }

  static async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Product> {
    await this.initialize();

    const now = new Date().toISOString();
    const product: Product = {
      ...productData,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.products.push(product);
    await this.saveProducts();

    // Add initial price if provided
    if (product.currentPrice !== undefined) {
      await this.addPriceRecord(product.id, product.currentPrice);
    }

    logger.info(`Created product: ${product.name}`);
    return product;
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    await this.initialize();

    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product not found: ${id}`);
    }

    const updatedProduct: Product = {
      ...this.products[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    this.products[index] = updatedProduct;
    await this.saveProducts();

    // Add price record if price changed
    if (
      updates.currentPrice !== undefined &&
      updates.currentPrice !== this.products[index].currentPrice
    ) {
      await this.addPriceRecord(id, updates.currentPrice);
    }

    logger.info(`Updated product: ${id}`);
    return updatedProduct;
  }

  static async deleteProduct(id: string): Promise<void> {
    await this.initialize();

    this.products = this.products.filter(p => p.id !== id);
    this.priceHistory = this.priceHistory.filter(ph => ph.productId !== id);
    this.priceAlerts = this.priceAlerts.filter(pa => pa.productId !== id);

    await Promise.all([this.saveProducts(), this.savePriceHistory(), this.savePriceAlerts()]);

    logger.info(`Deleted product: ${id}`);
  }

  // Price tracking
  static async addPriceRecord(
    productId: string,
    price: number,
    source?: string,
  ): Promise<PriceHistory> {
    await this.initialize();

    const priceRecord: PriceHistory = {
      id: this.generateId(),
      productId,
      price,
      recordedAt: new Date().toISOString(),
      source,
    };

    this.priceHistory.push(priceRecord);
    await this.savePriceHistory();

    logger.info(`Added price record: ${price} for product ${productId}`);
    return priceRecord;
  }

  static async getPriceHistory(productId: string): Promise<PriceHistory[]> {
    await this.initialize();
    return this.priceHistory
      .filter(ph => ph.productId === productId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  }

  static async getPriceStats(productId: string): Promise<PriceStats | null> {
    const history = await this.getPriceHistory(productId);

    if (history.length === 0) {
      return null;
    }

    const prices = history.map(h => h.price);
    const currentPrice = prices[prices.length - 1];
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    const previousPrice = prices.length > 1 ? prices[prices.length - 2] : currentPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercentage =
      previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

    return {
      currentPrice,
      lowestPrice,
      highestPrice,
      averagePrice,
      priceChange,
      priceChangePercentage,
    };
  }

  // Price alerts
  static async createPriceAlert(productId: string, targetPrice: number): Promise<PriceAlert> {
    await this.initialize();

    const alert: PriceAlert = {
      id: this.generateId(),
      productId,
      targetPrice,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.priceAlerts.push(alert);
    await this.savePriceAlerts();

    // Update product target price
    await this.updateProduct(productId, { targetPrice });

    logger.info(`Created price alert for product ${productId} at ${targetPrice}`);
    return alert;
  }

  static async getActiveAlertsForProduct(productId: string): Promise<PriceAlert[]> {
    await this.initialize();
    return this.priceAlerts.filter(pa => pa.productId === productId && pa.isActive);
  }

  static async checkPriceAlerts(productId: string, currentPrice: number): Promise<PriceAlert[]> {
    const alerts = await this.getActiveAlertsForProduct(productId);
    return alerts.filter(alert => currentPrice <= alert.targetPrice);
  }

  // Search and filter
  static async searchProducts(query: string): Promise<Product[]> {
    await this.initialize();
    const lowerQuery = query.toLowerCase();
    return this.products.filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery),
    );
  }

  static async getProductsByCategory(category: string): Promise<Product[]> {
    await this.initialize();
    return this.products.filter(p => p.category === category);
  }

  // Utility
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static async clearAllData(): Promise<void> {
    this.products = [];
    this.priceHistory = [];
    this.priceAlerts = [];
    await Promise.all([this.saveProducts(), this.savePriceHistory(), this.savePriceAlerts()]);
    logger.info('Cleared all product data');
  }
}

import { PurchaseService } from '../purchase.service';
import { ProductCategory } from '@types/product';

describe('PurchaseService', () => {
  beforeEach(async () => {
    await PurchaseService.clearAllData();
  });

  describe('Purchase CRUD', () => {
    it('should create a purchase', async () => {
      const purchase = await PurchaseService.createPurchase({
        productName: 'Test Product',
        price: 19.99,
        quantity: 2,
        category: ProductCategory.GROCERIES,
        purchaseDate: '2024-01-15',
        store: 'Test Store',
      });

      expect(purchase.id).toBeDefined();
      expect(purchase.productName).toBe('Test Product');
      expect(purchase.totalAmount).toBe(39.98);
    });

    it('should get all purchases sorted by date', async () => {
      await PurchaseService.createPurchase({
        productName: 'Product 1',
        price: 10,
        quantity: 1,
        category: ProductCategory.GROCERIES,
        purchaseDate: '2024-01-15',
      });

      await PurchaseService.createPurchase({
        productName: 'Product 2',
        price: 20,
        quantity: 1,
        category: ProductCategory.ELECTRONICS,
        purchaseDate: '2024-01-20',
      });

      const purchases = await PurchaseService.getAllPurchases();
      expect(purchases).toHaveLength(2);
      // Should be sorted by date descending
      expect(purchases[0].purchaseDate).toBe('2024-01-20');
    });

    it('should update a purchase and recalculate total', async () => {
      const purchase = await PurchaseService.createPurchase({
        productName: 'Test Product',
        price: 10,
        quantity: 2,
        category: ProductCategory.GROCERIES,
        purchaseDate: '2024-01-15',
      });

      const updated = await PurchaseService.updatePurchase(purchase.id, {
        quantity: 3,
      });

      expect(updated.totalAmount).toBe(30);
    });

    it('should delete a purchase', async () => {
      const purchase = await PurchaseService.createPurchase({
        productName: 'To Delete',
        price: 10,
        quantity: 1,
        category: ProductCategory.GROCERIES,
        purchaseDate: '2024-01-15',
      });

      await PurchaseService.deletePurchase(purchase.id);

      const retrieved = await PurchaseService.getPurchaseById(purchase.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Analytics', () => {
    it('should calculate spending summary correctly', async () => {
      await PurchaseService.createPurchase({
        productName: 'Product 1',
        price: 10,
        quantity: 2,
        category: ProductCategory.GROCERIES,
        purchaseDate: '2024-01-15',
      });

      await PurchaseService.createPurchase({
        productName: 'Product 2',
        price: 30,
        quantity: 1,
        category: ProductCategory.ELECTRONICS,
        purchaseDate: '2024-01-16',
      });

      const summary = await PurchaseService.getSpendingSummary();

      expect(summary.totalSpent).toBe(50);
      expect(summary.purchaseCount).toBe(2);
      expect(summary.averagePurchaseAmount).toBe(25);
      expect(summary.spendingByCategory[ProductCategory.GROCERIES]).toBe(20);
      expect(summary.spendingByCategory[ProductCategory.ELECTRONICS]).toBe(30);
    });

    it('should filter purchases by date range', async () => {
      await PurchaseService.createPurchase({
        productName: 'Product 1',
        price: 10,
        quantity: 1,
        category: ProductCategory.GROCERIES,
        purchaseDate: '2024-01-10',
      });

      await PurchaseService.createPurchase({
        productName: 'Product 2',
        price: 20,
        quantity: 1,
        category: ProductCategory.GROCERIES,
        purchaseDate: '2024-01-20',
      });

      await PurchaseService.createPurchase({
        productName: 'Product 3',
        price: 30,
        quantity: 1,
        category: ProductCategory.GROCERIES,
        purchaseDate: '2024-01-30',
      });

      const filtered = await PurchaseService.getPurchasesByDateRange(
        '2024-01-15',
        '2024-01-25',
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].productName).toBe('Product 2');
    });
  });

  describe('Search', () => {
    it('should search purchases by product name', async () => {
      await PurchaseService.createPurchase({
        productName: 'iPhone 15',
        price: 999,
        quantity: 1,
        category: ProductCategory.ELECTRONICS,
        purchaseDate: '2024-01-15',
      });

      await PurchaseService.createPurchase({
        productName: 'Samsung Galaxy',
        price: 899,
        quantity: 1,
        category: ProductCategory.ELECTRONICS,
        purchaseDate: '2024-01-16',
      });

      const results = await PurchaseService.searchPurchases('iPhone');
      expect(results).toHaveLength(1);
      expect(results[0].productName).toBe('iPhone 15');
    });
  });
});

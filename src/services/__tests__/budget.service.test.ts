import { BudgetService } from '../budget.service';
import { PurchaseService } from '../purchase.service';
import { ProductCategory } from '@types/product';

describe('BudgetService', () => {
  beforeEach(async () => {
    await BudgetService.clearAllData();
    await PurchaseService.clearAllData();
  });

  describe('Budget CRUD', () => {
    it('should create a budget', async () => {
      const budget = await BudgetService.createBudget(ProductCategory.GROCERIES, 500);

      expect(budget.id).toBeDefined();
      expect(budget.category).toBe(ProductCategory.GROCERIES);
      expect(budget.monthlyLimit).toBe(500);
      expect(budget.isActive).toBe(true);
    });

    it('should not allow duplicate budgets for same category', async () => {
      await BudgetService.createBudget(ProductCategory.GROCERIES, 500);

      await expect(
        BudgetService.createBudget(ProductCategory.GROCERIES, 600),
      ).rejects.toThrow('already exists');
    });

    it('should get all budgets', async () => {
      await BudgetService.createBudget(ProductCategory.GROCERIES, 500);
      await BudgetService.createBudget(ProductCategory.ELECTRONICS, 1000);

      const budgets = await BudgetService.getAllBudgets();
      expect(budgets).toHaveLength(2);
    });

    it('should update a budget', async () => {
      const budget = await BudgetService.createBudget(ProductCategory.GROCERIES, 500);

      const updated = await BudgetService.updateBudget(budget.id, {
        monthlyLimit: 600,
      });

      expect(updated.monthlyLimit).toBe(600);
    });

    it('should delete a budget', async () => {
      const budget = await BudgetService.createBudget(ProductCategory.GROCERIES, 500);

      await BudgetService.deleteBudget(budget.id);

      const retrieved = await BudgetService.getBudgetByCategory(ProductCategory.GROCERIES);
      expect(retrieved).toBeNull();
    });
  });

  describe('Budget Status', () => {
    it('should calculate budget status correctly', async () => {
      await BudgetService.createBudget(ProductCategory.GROCERIES, 500);

      const now = new Date();
      const thisMonth = now.toISOString().split('T')[0];

      await PurchaseService.createPurchase({
        productName: 'Groceries',
        price: 100,
        quantity: 1,
        category: ProductCategory.GROCERIES,
        purchaseDate: thisMonth,
      });

      await PurchaseService.createPurchase({
        productName: 'More Groceries',
        price: 50,
        quantity: 2,
        category: ProductCategory.GROCERIES,
        purchaseDate: thisMonth,
      });

      const status = await BudgetService.getBudgetStatus(ProductCategory.GROCERIES);

      expect(status).not.toBeNull();
      expect(status?.limit).toBe(500);
      expect(status?.spent).toBe(200); // 100 + (50 * 2)
      expect(status?.remaining).toBe(300);
      expect(status?.percentageUsed).toBe(40);
      expect(status?.isOverBudget).toBe(false);
    });

    it('should detect over-budget status', async () => {
      await BudgetService.createBudget(ProductCategory.GROCERIES, 100);

      const now = new Date();
      const thisMonth = now.toISOString().split('T')[0];

      await PurchaseService.createPurchase({
        productName: 'Expensive Groceries',
        price: 150,
        quantity: 1,
        category: ProductCategory.GROCERIES,
        purchaseDate: thisMonth,
      });

      const status = await BudgetService.getBudgetStatus(ProductCategory.GROCERIES);

      expect(status?.isOverBudget).toBe(true);
      expect(status?.remaining).toBe(-50);
      expect(status?.percentageUsed).toBe(150);
    });
  });

  describe('User Preferences', () => {
    it('should return default preferences', async () => {
      const prefs = await BudgetService.getPreferences();

      expect(prefs.defaultCurrency).toBe('USD');
      expect(prefs.notificationsEnabled).toBe(true);
      expect(prefs.priceAlertsEnabled).toBe(true);
      expect(prefs.budgetAlertsEnabled).toBe(true);
      expect(prefs.darkModeEnabled).toBeNull();
    });

    it('should update preferences', async () => {
      const updated = await BudgetService.updatePreferences({
        notificationsEnabled: false,
        defaultCurrency: 'EUR',
      });

      expect(updated.notificationsEnabled).toBe(false);
      expect(updated.defaultCurrency).toBe('EUR');

      // Verify persistence
      const retrieved = await BudgetService.getPreferences();
      expect(retrieved.notificationsEnabled).toBe(false);
      expect(retrieved.defaultCurrency).toBe('EUR');
    });
  });
});

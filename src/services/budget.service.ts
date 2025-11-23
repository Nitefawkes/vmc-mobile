/**
 * Budget Service
 * Manages category budgets and user preferences
 */

import { CategoryBudget, UserPreferences, BudgetStatus } from '@types/budget';
import { ProductCategory } from '@types/product';
import { StorageService, STORAGE_KEYS } from './storage.service';
import { PurchaseService } from './purchase.service';
import { logger } from '@utils/logger';

const BUDGET_KEY = 'category_budgets';
const PREFERENCES_KEY = 'user_preferences';

export class BudgetService {
  private static budgets: CategoryBudget[] = [];
  private static preferences: UserPreferences | null = null;
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const budgets = await StorageService.load<CategoryBudget[]>(BUDGET_KEY);
      const prefs = await StorageService.load<UserPreferences>(PREFERENCES_KEY);

      this.budgets = budgets || [];
      this.preferences = prefs || this.getDefaultPreferences();
      this.initialized = true;

      logger.info(`Loaded ${this.budgets.length} category budgets`);
    } catch (error) {
      logger.error('Error initializing BudgetService', error);
      throw error;
    }
  }

  private static getDefaultPreferences(): UserPreferences {
    return {
      defaultCurrency: 'USD',
      notificationsEnabled: true,
      priceAlertsEnabled: true,
      budgetAlertsEnabled: true,
      darkModeEnabled: null,
    };
  }

  private static async saveBudgets(): Promise<void> {
    await StorageService.save(BUDGET_KEY, this.budgets);
  }

  private static async savePreferences(): Promise<void> {
    await StorageService.save(PREFERENCES_KEY, this.preferences);
  }

  // Budget CRUD
  static async getAllBudgets(): Promise<CategoryBudget[]> {
    await this.initialize();
    return [...this.budgets];
  }

  static async getBudgetByCategory(category: ProductCategory): Promise<CategoryBudget | null> {
    await this.initialize();
    return this.budgets.find(b => b.category === category) || null;
  }

  static async createBudget(
    category: ProductCategory,
    monthlyLimit: number,
  ): Promise<CategoryBudget> {
    await this.initialize();

    const existing = await this.getBudgetByCategory(category);
    if (existing) {
      throw new Error(`Budget already exists for category: ${category}`);
    }

    const now = new Date().toISOString();
    const budget: CategoryBudget = {
      id: this.generateId(),
      category,
      monthlyLimit,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.budgets.push(budget);
    await this.saveBudgets();

    logger.info(`Created budget for ${category}: $${monthlyLimit}/month`);
    return budget;
  }

  static async updateBudget(id: string, updates: Partial<CategoryBudget>): Promise<CategoryBudget> {
    await this.initialize();

    const index = this.budgets.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error(`Budget not found: ${id}`);
    }

    const updatedBudget: CategoryBudget = {
      ...this.budgets[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    this.budgets[index] = updatedBudget;
    await this.saveBudgets();

    logger.info(`Updated budget: ${id}`);
    return updatedBudget;
  }

  static async deleteBudget(id: string): Promise<void> {
    await this.initialize();

    this.budgets = this.budgets.filter(b => b.id !== id);
    await this.saveBudgets();

    logger.info(`Deleted budget: ${id}`);
  }

  // Budget status and analytics
  static async getBudgetStatus(category: ProductCategory): Promise<BudgetStatus | null> {
    const budget = await this.getBudgetByCategory(category);
    if (!budget || !budget.isActive) {
      return null;
    }

    // Get current month spending
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const purchases = await PurchaseService.getPurchasesByDateRange(startOfMonth, endOfMonth);
    const categoryPurchases = purchases.filter(p => p.category === category);
    const spent = categoryPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

    const remaining = budget.monthlyLimit - spent;
    const percentageUsed = (spent / budget.monthlyLimit) * 100;
    const isOverBudget = spent > budget.monthlyLimit;

    return {
      category,
      limit: budget.monthlyLimit,
      spent,
      remaining,
      percentageUsed,
      isOverBudget,
    };
  }

  static async getAllBudgetStatuses(): Promise<BudgetStatus[]> {
    await this.initialize();
    const statuses: BudgetStatus[] = [];

    for (const budget of this.budgets.filter(b => b.isActive)) {
      const status = await this.getBudgetStatus(budget.category);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  // User preferences
  static async getPreferences(): Promise<UserPreferences> {
    await this.initialize();
    return this.preferences!;
  }

  static async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    await this.initialize();

    this.preferences = {
      ...this.preferences!,
      ...updates,
    };

    await this.savePreferences();
    logger.info('Updated user preferences');
    return this.preferences;
  }

  // Utility
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static async clearAllData(): Promise<void> {
    this.budgets = [];
    this.preferences = this.getDefaultPreferences();
    await Promise.all([this.saveBudgets(), this.savePreferences()]);
    logger.info('Cleared all budget data');
  }
}

/**
 * Budget and Settings Types
 */

import { ProductCategory } from './product';

export interface CategoryBudget {
  id: string;
  category: ProductCategory;
  monthlyLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  defaultCurrency: string;
  notificationsEnabled: boolean;
  priceAlertsEnabled: boolean;
  budgetAlertsEnabled: boolean;
  darkModeEnabled: boolean | null; // null = system default
}

export interface BudgetStatus {
  category: ProductCategory;
  limit: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

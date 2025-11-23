/**
 * Common type definitions for the application
 */

export type NavigationParams = {
  Home: undefined;
  Products: undefined;
  Purchases: undefined;
  AddProduct: { productId?: string };
  AddPurchase: { productId?: string };
  ProductDetail: { productId: string };
  PurchaseDetail: { purchaseId: string };
};

export type Theme = 'light' | 'dark';

export type AppState = 'active' | 'background' | 'inactive';

// Re-export product types
export * from './product';

/**
 * Product and Price Tracking Types
 */

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  imageUrl?: string;
  currentPrice?: number;
  targetPrice?: number;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  recordedAt: string;
  source?: string;
}

export interface Purchase {
  id: string;
  productId?: string;
  productName: string;
  price: number;
  quantity: number;
  totalAmount: number;
  category: ProductCategory;
  purchaseDate: string;
  store?: string;
  notes?: string;
  receiptImageUrl?: string;
  createdAt: string;
}

export enum ProductCategory {
  ELECTRONICS = 'Electronics',
  GROCERIES = 'Groceries',
  CLOTHING = 'Clothing',
  HOME = 'Home & Garden',
  HEALTH = 'Health & Beauty',
  SPORTS = 'Sports & Outdoors',
  TOYS = 'Toys & Games',
  BOOKS = 'Books & Media',
  AUTOMOTIVE = 'Automotive',
  OTHER = 'Other',
}

export interface PriceAlert {
  id: string;
  productId: string;
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
}

export interface PriceStats {
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceChange: number;
  priceChangePercentage: number;
}

export interface SpendingSummary {
  totalSpent: number;
  purchaseCount: number;
  averagePurchaseAmount: number;
  topCategory: ProductCategory;
  spendingByCategory: Record<ProductCategory, number>;
}

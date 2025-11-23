import { ProductService } from '../product.service';
import { ProductCategory } from '@types/product';

describe('ProductService', () => {
  beforeEach(async () => {
    await ProductService.clearAllData();
  });

  describe('Product CRUD', () => {
    it('should create a product', async () => {
      const product = await ProductService.createProduct({
        name: 'Test Product',
        description: 'A test product',
        category: ProductCategory.ELECTRONICS,
        currentPrice: 99.99,
        targetPrice: 79.99,
      });

      expect(product.id).toBeDefined();
      expect(product.name).toBe('Test Product');
      expect(product.currentPrice).toBe(99.99);
      expect(product.targetPrice).toBe(79.99);
    });

    it('should get all products', async () => {
      await ProductService.createProduct({
        name: 'Product 1',
        category: ProductCategory.ELECTRONICS,
      });

      await ProductService.createProduct({
        name: 'Product 2',
        category: ProductCategory.GROCERIES,
      });

      const products = await ProductService.getAllProducts();
      expect(products).toHaveLength(2);
    });

    it('should get product by id', async () => {
      const created = await ProductService.createProduct({
        name: 'Test Product',
        category: ProductCategory.ELECTRONICS,
      });

      const retrieved = await ProductService.getProductById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Test Product');
    });

    it('should update a product', async () => {
      const product = await ProductService.createProduct({
        name: 'Original Name',
        category: ProductCategory.ELECTRONICS,
      });

      const updated = await ProductService.updateProduct(product.id, {
        name: 'Updated Name',
        currentPrice: 149.99,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.currentPrice).toBe(149.99);
    });

    it('should delete a product', async () => {
      const product = await ProductService.createProduct({
        name: 'To Delete',
        category: ProductCategory.ELECTRONICS,
      });

      await ProductService.deleteProduct(product.id);

      const retrieved = await ProductService.getProductById(product.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Price Tracking', () => {
    it('should add price records when creating a product with price', async () => {
      const product = await ProductService.createProduct({
        name: 'Priced Product',
        category: ProductCategory.ELECTRONICS,
        currentPrice: 99.99,
      });

      const history = await ProductService.getPriceHistory(product.id);
      expect(history).toHaveLength(1);
      expect(history[0].price).toBe(99.99);
    });

    it('should calculate price stats correctly', async () => {
      const product = await ProductService.createProduct({
        name: 'Test Product',
        category: ProductCategory.ELECTRONICS,
        currentPrice: 100,
      });

      await ProductService.addPriceRecord(product.id, 120);
      await ProductService.addPriceRecord(product.id, 90);

      const stats = await ProductService.getPriceStats(product.id);

      expect(stats).not.toBeNull();
      expect(stats?.lowestPrice).toBe(90);
      expect(stats?.highestPrice).toBe(120);
      expect(stats?.currentPrice).toBe(90);
    });
  });

  describe('Search and Filter', () => {
    it('should search products by name', async () => {
      await ProductService.createProduct({
        name: 'iPhone 15',
        category: ProductCategory.ELECTRONICS,
      });

      await ProductService.createProduct({
        name: 'Samsung Galaxy',
        category: ProductCategory.ELECTRONICS,
      });

      const results = await ProductService.searchProducts('iPhone');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('iPhone 15');
    });

    it('should filter products by category', async () => {
      await ProductService.createProduct({
        name: 'Product 1',
        category: ProductCategory.ELECTRONICS,
      });

      await ProductService.createProduct({
        name: 'Product 2',
        category: ProductCategory.GROCERIES,
      });

      const electronics = await ProductService.getProductsByCategory(
        ProductCategory.ELECTRONICS,
      );
      expect(electronics).toHaveLength(1);
      expect(electronics[0].category).toBe(ProductCategory.ELECTRONICS);
    });
  });
});

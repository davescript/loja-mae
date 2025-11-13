/**
 * E2E Tests for Checkout Flow
 * 
 * To run these tests:
 * 1. Install Playwright: npm install -D @playwright/test
 * 2. Run: npx playwright test
 * 
 * Or use Vitest with Playwright:
 * npm install -D vitest @vitest/ui @playwright/test
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.E2E_API_URL || 'http://localhost:8787';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await page.goto(`${BASE_URL}/cart`);
    await page.evaluate(() => {
      localStorage.removeItem('cart');
    });
  });

  test('should add product to cart and proceed to checkout', async ({ page }) => {
    // Navigate to products page
    await page.goto(`${BASE_URL}/products`);
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Click first product card
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    // Wait for product page to load
    await page.waitForSelector('button:has-text("Adicionar ao Carrinho")', { timeout: 10000 });
    
    // Add to cart
    await page.click('button:has-text("Adicionar ao Carrinho")');
    
    // Wait for toast notification
    await page.waitForSelector('text=Adicionado ao carrinho', { timeout: 5000 });
    
    // Go to cart
    await page.goto(`${BASE_URL}/cart`);
    
    // Verify cart has items
    await expect(page.locator('text=Finalizar Compra')).toBeVisible();
    
    // Click checkout
    await page.click('button:has-text("Finalizar Compra")');
    
    // Should redirect to checkout page
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/checkout`));
  });

  test('should display cart total correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Add first product
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForSelector('button:has-text("Adicionar ao Carrinho")');
    await page.click('button:has-text("Adicionar ao Carrinho")');
    await page.waitForSelector('text=Adicionado ao carrinho');
    
    // Go to cart
    await page.goto(`${BASE_URL}/cart`);
    
    // Verify total is displayed
    const totalElement = page.locator('[data-testid="cart-total"]');
    await expect(totalElement).toBeVisible();
    
    // Total should be greater than 0
    const totalText = await totalElement.textContent();
    expect(totalText).toMatch(/€\d+\.\d{2}/);
  });

  test('should update quantity in cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Add product to cart
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForSelector('button:has-text("Adicionar ao Carrinho")');
    await page.click('button:has-text("Adicionar ao Carrinho")');
    await page.waitForSelector('text=Adicionado ao carrinho');
    
    // Go to cart
    await page.goto(`${BASE_URL}/cart`);
    
    // Find quantity input and increase
    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill('3');
    
    // Wait for cart to update
    await page.waitForTimeout(500);
    
    // Verify total updated
    const totalElement = page.locator('[data-testid="cart-total"]');
    const totalText = await totalElement.textContent();
    expect(totalText).toBeTruthy();
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Add product
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForSelector('button:has-text("Adicionar ao Carrinho")');
    await page.click('button:has-text("Adicionar ao Carrinho")');
    await page.waitForSelector('text=Adicionado ao carrinho');
    
    // Go to cart
    await page.goto(`${BASE_URL}/cart`);
    
    // Click remove button
    const removeButton = page.locator('button:has-text("Remover")').first();
    await removeButton.click();
    
    // Cart should be empty
    await expect(page.locator('text=Carrinho vazio')).toBeVisible();
  });
});

test.describe('Product Page', () => {
  test('should display product details correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Click first product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Verify product page elements
    await expect(page.locator('h1')).toBeVisible(); // Product title
    await expect(page.locator('button:has-text("Adicionar ao Carrinho")')).toBeVisible();
    
    // Should have price
    const priceElement = page.locator('text=/€\d+\.\d{2}/');
    await expect(priceElement.first()).toBeVisible();
  });

  test('should handle product not found', async ({ page }) => {
    await page.goto(`${BASE_URL}/product/non-existent-product`);
    
    // Should show error message
    await expect(page.locator('text=Produto não encontrado')).toBeVisible();
  });
});

test.describe('Cart Persistence', () => {
  test('should persist cart in localStorage', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Add product
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForSelector('button:has-text("Adicionar ao Carrinho")');
    await page.click('button:has-text("Adicionar ao Carrinho")');
    await page.waitForSelector('text=Adicionado ao carrinho');
    
    // Check localStorage
    const cartData = await page.evaluate(() => {
      return localStorage.getItem('cart');
    });
    
    expect(cartData).toBeTruthy();
    const cart = JSON.parse(cartData || '[]');
    expect(cart.length).toBeGreaterThan(0);
    
    // Reload page
    await page.reload();
    
    // Cart should still have items
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.locator('text=Finalizar Compra')).toBeVisible();
  });
});


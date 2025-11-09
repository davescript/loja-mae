import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Storefront routes
import StorefrontLayout from './storefront/layout/Layout';
import HomePage from './storefront/pages/index';
import ProductsPage from './storefront/pages/products';
import CollectionsPage from './storefront/pages/collections';
import CategoriesPage from './storefront/pages/categories';
import AboutPage from './storefront/pages/about';
import ContactPage from './storefront/pages/contact';
import ProductPage from './storefront/pages/product/[slug]';
import CartPage from './storefront/pages/cart';
import CheckoutPage from './storefront/pages/checkout';
import LoginPage from './storefront/pages/login';
import RegisterPage from './storefront/pages/register';
import AccountPage from './storefront/pages/account';
import FavoritesPage from './storefront/pages/favorites';
import OrdersPage from './storefront/pages/orders';

// Admin routes
import AdminLayout from './admin/layout/Layout';
import AdminLoginPage from './admin/pages/login';
import AdminDashboardPage from './admin/pages/dashboard';
import AdminProductsPage from './admin/pages/products';
import AdminCategoriesPage from './admin/pages/categories';
import AdminOrdersPage from './admin/pages/orders';
import AdminCustomersPage from './admin/pages/customers';
import AdminCouponsPage from './admin/pages/coupons';
import AdminSettingsPage from './admin/pages/settings';

function App() {
  return (
    <Routes>
      {/* Storefront Routes */}
      <Route path="/" element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

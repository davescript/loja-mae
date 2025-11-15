import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AdminAuthGuard } from './components/AuthGuard';

// Storefront routes
import StorefrontLayout from './storefront/layout/Layout';
import HomePage from './storefront/pages/index';
import ProductsPage from './storefront/pages/products';
import CollectionsPage from './storefront/pages/collections';
import CategoriesPage from './storefront/pages/categories';
import AboutPage from './storefront/pages/about';
import BlogListPage from './storefront/pages/blog';
import BlogPostPage from './storefront/pages/blog/[slug]';
import ContactPage from './storefront/pages/contact';
import PrivacyPage from './storefront/pages/privacy';
import TermsPage from './storefront/pages/terms';
import ShippingPage from './storefront/pages/shipping';
import ProductPage from './storefront/pages/product/[slug]';
import CartPage from './storefront/pages/cart';
import CheckoutPage from './storefront/pages/checkout';
import CheckoutSuccessPage from './storefront/pages/checkout/success';
import CheckoutFailedPage from './storefront/pages/checkout/failed';
import LoginPage from './storefront/pages/login';
import RegisterPage from './storefront/pages/register';
import AccountPage from './storefront/pages/account';
import FavoritesPage from './storefront/pages/favorites';
import OrdersPage from './storefront/pages/orders';

// Customer Portal Layout and Pages
import CustomerPortalLayout from './storefront/layout/CustomerPortalLayout';
import CustomerDashboardPage from './storefront/pages/account/dashboard';
import CustomerOrdersPage from './storefront/pages/account/orders';
import CustomerOrderDetailsPage from './storefront/pages/account/orders/[orderNumber]';
import CustomerProfilePage from './storefront/pages/account/profile';
import CustomerAddressesPage from './storefront/pages/account/addresses';
import CustomerPaymentsPage from './storefront/pages/account/payments';
import CustomerSupportPage from './storefront/pages/account/support';
import CustomerNotificationsPage from './storefront/pages/account/notifications';

// Admin routes
import AdminLayout from './admin/layout/AdvancedLayout';
import AdminLoginPage from './admin/pages/login';
import AdminDashboardPage from './admin/pages/dashboard';
import AdminProductsPage from './admin/pages/products-advanced';
import AdminCategoriesPage from './admin/pages/categories-advanced';
import AdminCollectionsPage from './admin/pages/collections';
import AdminOrdersPage from './admin/pages/orders-advanced';
import AdminAbandonedCartsPage from './admin/pages/abandoned-carts';
import AdminCustomersPage from './admin/pages/customers-advanced';
import AdminCustomerDetailsPage from './admin/pages/customers/[id]';
import AdminFavoritesPage from './admin/pages/favorites';
import AdminMarketingPage from './admin/pages/marketing';
import AdminCouponsPage from './admin/pages/coupons-advanced';
import AdminCampaignsPage from './admin/pages/campaigns';
import AdminBannersPage from './admin/pages/banners';
import AdminBlogPage from './admin/pages/blog';
import AdminAnalyticsPage from './admin/pages/analytics';
import AdminSettingsPage from './admin/pages/settings-advanced';

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
        <Route path="blog" element={<BlogListPage />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="shipping" element={<ShippingPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="checkout/failed" element={<CheckoutFailedPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        
        {/* Customer Portal Routes - New Portal (replaces old /account) */}
        <Route path="account" element={<CustomerPortalLayout />}>
          <Route index element={<CustomerDashboardPage />} />
          <Route path="orders" element={<CustomerOrdersPage />} />
          <Route path="orders/:orderNumber" element={<CustomerOrderDetailsPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="addresses" element={<CustomerAddressesPage />} />
          <Route path="payments" element={<CustomerPaymentsPage />} />
          <Route path="support" element={<CustomerSupportPage />} />
          <Route path="notifications" element={<CustomerNotificationsPage />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminAuthGuard><AdminLayout /></AdminAuthGuard>}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="collections" element={<AdminCollectionsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="abandoned-carts" element={<AdminAbandonedCartsPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="customers/:id" element={<AdminCustomerDetailsPage />} />
        <Route path="favorites" element={<AdminFavoritesPage />} />
        <Route path="marketing" element={<AdminMarketingPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="campaigns" element={<AdminCampaignsPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="blog" element={<AdminBlogPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

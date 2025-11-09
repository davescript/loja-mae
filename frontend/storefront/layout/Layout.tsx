import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import AppSidebar from '../components/app/AppSidebar';
import Topbar from '../components/app/Topbar';
import MobileBottomBar from '../components/app/MobileBottomBar';
import FloatingCartButton from '../components/app/FloatingCartButton';
import Breadcrumbs from '../components/app/Breadcrumbs';
import FilterDrawer from '../components/app/FilterDrawer';
import CategoriesModal from '../components/app/CategoriesModal';

export default function StorefrontLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenCategories={() => setCategoriesOpen(true)} onOpenFilters={() => setFiltersOpen(true)} />
        <Breadcrumbs />
        <main className="flex-1 px-4 lg:px-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        <MobileBottomBar />
        <FloatingCartButton />
      </div>
      <FilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
      <CategoriesModal open={categoriesOpen} onOpenChange={setCategoriesOpen} />
    </div>
  );
}

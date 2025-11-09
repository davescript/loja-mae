import { Outlet, Link, Navigate } from 'react-router-dom';

export default function AdminLayout() {
  // TODO: Add admin auth check
  const isAuthenticated = false; // Replace with actual auth check

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Admin</h1>
        </div>
        <nav className="mt-4">
          <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-gray-700">
            Dashboard
          </Link>
          <Link to="/admin/products" className="block px-4 py-2 hover:bg-gray-700">
            Produtos
          </Link>
          <Link to="/admin/categories" className="block px-4 py-2 hover:bg-gray-700">
            Categorias
          </Link>
          <Link to="/admin/orders" className="block px-4 py-2 hover:bg-gray-700">
            Pedidos
          </Link>
          <Link to="/admin/customers" className="block px-4 py-2 hover:bg-gray-700">
            Clientes
          </Link>
          <Link to="/admin/coupons" className="block px-4 py-2 hover:bg-gray-700">
            Cupons
          </Link>
          <Link to="/admin/settings" className="block px-4 py-2 hover:bg-gray-700">
            Configurações
          </Link>
        </nav>
      </aside>
      <main className="flex-1 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
}


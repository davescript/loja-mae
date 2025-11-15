import { Outlet, Link, Navigate, useLocation } from "react-router-dom"
import { useAdminAuth } from "../../hooks/useAdminAuth"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Ticket,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  BarChart3,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Heart,
  Mail,
} from "lucide-react"
import { Topbar } from "../components/common/Topbar"
import { Breadcrumbs } from "../components/common/Breadcrumbs"
import { Toaster } from "../components/common/Toaster"
import { cn } from "../../utils/cn"

export default function AdvancedLayout() {
  const { admin, isAuthenticated, isLoading, logout } = useAdminAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  const navItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/products", icon: Package, label: "Produtos" },
    { path: "/admin/orders", icon: ShoppingCart, label: "Pedidos" },
    { path: "/admin/customers", icon: Users, label: "Clientes" },
    { path: "/admin/favorites", icon: Heart, label: "Favoritos" },
    { path: "/admin/categories", icon: FolderTree, label: "Catálogo" },
    { path: "/admin/collections", icon: Package, label: "Coleções" },
    {
      path: "/admin/marketing",
      icon: Megaphone,
      label: "Marketing",
    },
    { path: "/admin/contact-messages", icon: Mail, label: "Mensagens" },
    { path: "/admin/blog", icon: FileText, label: "Blog" },
    { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/admin/settings", icon: Settings, label: "Configurações" },
  ]

  const sidebarWidth = sidebarOpen ? "w-64" : "w-20"

  return (
    <div className="min-h-screen flex bg-white">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-gray-900 text-white transition-all duration-300",
          sidebarWidth
        )}
      >
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 mb-8">
            {sidebarOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">LM</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Leiasabores</h1>
                  <p className="text-xs text-gray-400">Admin Panel</p>
                </div>
              </motion.div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg mx-auto">
                <span className="text-white font-bold text-lg">LM</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-800 transition-colors ml-auto"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/")
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", sidebarOpen && "mr-3")} />
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-primary/20 flex-shrink-0">
                  {admin?.name?.charAt(0).toUpperCase() || admin?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{admin?.name || admin?.email?.split('@')[0]}</p>
                    <p className="text-xs text-gray-400 truncate">{admin?.email}</p>
                  </div>
                )}
                <button
                  onClick={logout}
                  className={cn(
                    "p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors",
                    !sidebarOpen && "mx-auto"
                  )}
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-40 bg-gray-900 text-white"
          >
            <div className="flex flex-col h-full pt-16">
              <nav className="flex-1 px-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
              <div className="border-t border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{admin?.name}</p>
                    <p className="text-xs text-gray-400">{admin?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          sidebarOpen ? "md:pl-64" : "md:pl-20"
        )}
      >
        <Topbar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}


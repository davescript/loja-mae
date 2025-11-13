import { Link, useLocation } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "../../../utils/cn"

export function Breadcrumbs() {
  const location = useLocation()
  const paths = location.pathname.split("/").filter(Boolean)

  const breadcrumbMap: Record<string, string> = {
    admin: "Admin",
    dashboard: "Dashboard",
    products: "Produtos",
    orders: "Pedidos",
    customers: "Clientes",
    categories: "Categorias",
    coupons: "Cupons",
    settings: "Configurações",
    marketing: "Marketing",
    blog: "Blog",
    analytics: "Analytics",
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link
        to="/admin/dashboard"
        className="hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1
        const href = `/${paths.slice(0, index + 1).join("/")}`
        const label = breadcrumbMap[path] || path

        return (
          <div key={path} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link
                to={href}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}


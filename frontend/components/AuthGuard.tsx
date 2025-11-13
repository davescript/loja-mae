import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function AdminAuthGuard({ children, requireAdmin = true }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && requireAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}


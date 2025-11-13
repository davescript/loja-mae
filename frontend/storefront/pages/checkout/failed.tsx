import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, AlertCircle, Home, ShoppingBag, RefreshCw } from 'lucide-react'
import { Button } from '../../../admin/components/ui/button'

export default function CheckoutFailedPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const error = searchParams.get('error') || 'O pagamento não pôde ser processado.'

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-8"
        >
          <XCircle className="w-20 h-20 mx-auto mb-4 text-red-500" />
          <h1 className="text-4xl font-bold mb-2">Pagamento Falhou</h1>
          <p className="text-lg text-muted-foreground mb-4">{error}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-lg p-8 shadow-sm border text-left mb-8"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">O que pode ter acontecido?</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Dados do cartão incorretos</li>
                <li>Saldo insuficiente</li>
                <li>Cartão expirado ou bloqueado</li>
                <li>Problema temporário com o processador de pagamento</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button onClick={() => navigate('/cart')}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button onClick={() => navigate('/products')} variant="outline">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Continuar Comprando
          </Button>
          <Link to="/">
            <Button variant="ghost">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}


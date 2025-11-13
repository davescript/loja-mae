import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { formatPrice } from '../../utils/format'
import { motion } from 'framer-motion'
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '../../admin/components/ui/button'
import { useToast } from '../../admin/hooks/useToast'

export default function CartPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore()

  const total = getTotal()
  const itemCount = getItemCount()

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione produtos ao carrinho antes de finalizar a compra.',
        variant: 'destructive',
      })
      return
    }
    navigate('/checkout')
  }

  const handleClearCart = () => {
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
      clearCart()
      toast({
        title: 'Carrinho limpo',
        description: 'Todos os itens foram removidos do carrinho.',
      })
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h1>
            <p className="text-muted-foreground mb-8">
              Adicione produtos ao carrinho para começar a comprar
            </p>
            <Button onClick={() => navigate('/products')} size="lg">
              Continuar Comprando
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Carrinho de Compras</h1>
          <Button variant="outline" onClick={handleClearCart}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Carrinho
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Itens */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={`${item.product_id}-${item.variant_id || 'default'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-lg p-6 shadow-sm border flex flex-col md:flex-row gap-4"
              >
                {/* Imagem */}
                <div className="w-full md:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    {item.sku && (
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    )}
                    <p className="text-xl font-bold text-primary mt-2">
                      {formatPrice(item.price_cents)}
                    </p>
                  </div>

                  {/* Controles de Quantidade */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 border rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                        className="p-2 hover:bg-muted transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                        className="p-2 hover:bg-muted transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatPrice(item.price_cents * item.quantity)}
                      </p>
                      <button
                        onClick={() => {
                          removeItem(item.product_id, item.variant_id)
                          toast({
                            title: 'Item removido',
                            description: `${item.title} foi removido do carrinho.`,
                          })
                        }}
                        className="text-sm text-red-600 hover:text-red-700 mt-1 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-lg p-6 shadow-sm border sticky top-4"
            >
              <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                  <span className="font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Portes</span>
                  <span className="font-medium">Calculado no checkout</span>
                </div>
                <div className="border-t pt-4 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full"
                size="lg"
              >
                Finalizar Compra
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <button
                onClick={() => navigate('/products')}
                className="w-full mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Continuar Comprando
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

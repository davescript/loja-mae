import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '@shared/types';

type QuickViewModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: Product;
};

export default function QuickViewModal({ open, onOpenChange, product }: QuickViewModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed inset-0 m-auto w-[95%] max-w-xl rounded-2xl bg-white p-6 shadow-elevated">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium">Quick View</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Fechar" className="p-2 rounded-xl hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          {product ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.images?.[0]?.image_url && (
                <img src={product.images[0].image_url} alt={product.title} className="w-full rounded-xl" />
              )}
              <div>
                <p className="font-medium">{product.title}</p>
                <p className="mt-2 text-primary font-semibold">R$ {(product.price_cents / 100).toFixed(2).replace('.', ',')}</p>
                <Link to={`/product/${product.slug}`} className="mt-4 inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground">Ver detalhes</Link>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-muted-foreground">Carregando produto...</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


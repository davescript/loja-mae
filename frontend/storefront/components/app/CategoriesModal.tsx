import * as Dialog from '@radix-ui/react-dialog';
import { X, Layers, CupSoda, PartyPopper, Box } from 'lucide-react';
import { Link } from 'react-router-dom';

type CategoriesModalProps = { open: boolean; onOpenChange: (v: boolean) => void };

const cats = [
  { to: '/categories?type=formas', label: 'Formas de Bolo', icon: Layers },
  { to: '/categories?type=toppers', label: 'Toppers', icon: CupSoda },
  { to: '/categories?type=caixas', label: 'Caixas', icon: Box },
  { to: '/categories?type=baloes', label: 'Balões', icon: PartyPopper },
];

export default function CategoriesModal({ open, onOpenChange }: CategoriesModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed inset-0 m-auto w-[95%] max-w-lg rounded-2xl bg-white p-6 shadow-elevated">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium">Categorias</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Fechar" className="p-2 rounded-xl hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {cats.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-muted">
                <Icon className="w-5 h-5" />
                <span className="text-sm">{label}</span>
              </Link>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

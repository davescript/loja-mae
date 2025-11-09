import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

type FilterDrawerProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApply?: (selected: Record<string, string[]>) => void;
};

export default function FilterDrawer({ open, onOpenChange, onApply }: FilterDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-[90%] max-w-sm bg-white shadow-elevated p-6">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium">Filtros</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Fechar" className="p-2 rounded-xl hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-4 space-y-6">
            <div>
              <p className="text-sm font-medium">Cores</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['creme','rosa','lilás','dourado','branco'].map((c) => (
                  <button key={c} className="px-3 py-2 rounded-full bg-secondary text-sm">{c}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Materiais</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['papel','acetato','plástico','metal','madeira'].map((c) => (
                  <button key={c} className="px-3 py-2 rounded-full bg-secondary text-sm">{c}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Ocasião</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['aniversário','casamento','chá-baby','corporativo'].map((c) => (
                  <button key={c} className="px-3 py-2 rounded-full bg-secondary text-sm">{c}</button>
                ))}
              </div>
            </div>
          </div>
          <button
            className="mt-8 w-full px-4 py-3 rounded-full bg-primary text-primary-foreground"
            onClick={() => onApply?.({})}
          >
            Aplicar filtros
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


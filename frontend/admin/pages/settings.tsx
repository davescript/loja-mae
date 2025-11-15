import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, Settings as SettingsIcon, Store, CreditCard } from 'lucide-react';
import {
  Input,
  Button,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui';
import { useToast } from '../hooks/useToast';

type Settings = {
  store_name: string;
  store_currency: string;
  stripe_public_key: string;
  stripe_secret_key?: string; // Not fetched directly, but can be updated
};

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<Partial<Settings>>({});
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const response = await apiRequest<Settings>('/api/admin/settings');
      return response.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name,
        store_currency: settings.store_currency,
        stripe_public_key: settings.stripe_public_key,
      });
    }
  }, [settings]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      return apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast({ title: 'Configurações salvas', description: 'As configurações foram atualizadas com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar configurações.', variant: 'destructive' });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-2">Gerencie as configurações gerais da sua loja</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Store className="w-5 h-5" />
                Informações da Loja
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="store_name">Nome da Loja</Label>
                  <Input
                    id="store_name"
                    name="store_name"
                    value={formData.store_name || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="store_currency">Moeda</Label>
                  <Input
                    id="store_currency"
                    name="store_currency"
                    value={formData.store_currency || ''}
                    onChange={handleChange}
                    maxLength={3}
                    placeholder="Ex: EUR, USD"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Stripe Settings */}
            <div className="col-span-1">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5" />
                Configurações Stripe
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stripe_public_key">Chave Pública Stripe</Label>
                  <Input
                    id="stripe_public_key"
                    name="stripe_public_key"
                    value={formData.stripe_public_key || ''}
                    onChange={handleChange}
                    placeholder="pk_live_..."
                  />
                </div>
                <div>
                  <Label htmlFor="stripe_secret_key">Chave Secreta Stripe</Label>
                  <Input
                    id="stripe_secret_key"
                    name="stripe_secret_key"
                    type="password"
                    value={formData.stripe_secret_key || ''}
                    onChange={handleChange}
                    placeholder="sk_live_..."
                    // Nota: A chave secreta deve ser tratada com extrema segurança.
                    // Idealmente, não seria atualizada diretamente via um campo de formulário.
                    // Para fins de demonstração/desenvolvimento, está aqui.
                  />
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </form>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
                toastMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{toastMessage.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { CJAdminStatus, CJImportResult } from '@shared/types';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';

type ApiLog = {
  id: string;
  method: string;
  endpoint: string;
  status_code: number | null;
  request_id: string | null;
  success: number;
  duration_ms: number | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
};

type Toast = {
  type: 'success' | 'error';
  message: string;
};

export default function AdminDropshippingPage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [countryCode, setCountryCode] = useState('PT');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [markupPercent, setMarkupPercent] = useState(70);
  const [toast, setToast] = useState<Toast | null>(null);
  const [searchPayload, setSearchPayload] = useState<unknown>(null);

  const statusQuery = useQuery({
    queryKey: ['admin', 'dropshipping', 'cj', 'status'],
    queryFn: async () => {
      const response = await apiRequest<CJAdminStatus>('/api/admin/dropshipping/cj/status');
      return response.data;
    },
  });

  const logsQuery = useQuery({
    queryKey: ['admin', 'dropshipping', 'cj', 'logs'],
    queryFn: async () => {
      const response = await apiRequest<ApiLog[]>('/api/admin/dropshipping/cj/logs?limit=20');
      return response.data || [];
    },
  });

  const products = useMemo(() => extractCJProducts(searchPayload), [searchPayload]);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest<CJAdminStatus>('/api/admin/dropshipping/cj/status?verify=1');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dropshipping', 'cj', 'status'] });
      if (data?.verified) {
        showToast('success', 'Credenciais CJ verificadas com sucesso.');
      } else {
        showToast('error', data?.verifyError || 'Não foi possível verificar as credenciais CJ.');
      }
    },
    onError: (error: Error) => showToast('error', error.message),
  });

  const searchMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '20',
      });
      if (keyword.trim()) params.set('keyword', keyword.trim());
      if (countryCode.trim()) params.set('countryCode', countryCode.trim().toUpperCase());

      const response = await apiRequest<unknown>(`/api/admin/dropshipping/cj/search?${params.toString()}`);
      return response.data;
    },
    onSuccess: (data) => setSearchPayload(data),
    onError: (error: Error) => showToast('error', error.message),
  });

  const importMutation = useMutation({
    mutationFn: async (cjProductId: string) => {
      const response = await apiRequest<CJImportResult>('/api/admin/dropshipping/cj/import', {
        method: 'POST',
        body: JSON.stringify({
          cjProductId,
          markupPercent,
          status: 'draft',
          preferredCountryCode: countryCode.trim().toUpperCase() || 'PT',
        }),
      });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dropshipping', 'cj', 'logs'] });
      showToast(
        'success',
        result?.imported
          ? `Produto importado como rascunho: ${result.title}`
          : `Produto já estava importado: ${result?.title || 'CJ'}`
      );
    },
    onError: (error: Error) => showToast('error', error.message),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/dropshipping/cj/sync-stock', {
        method: 'POST',
        body: JSON.stringify({
          preferredCountryCode: countryCode.trim().toUpperCase() || 'PT',
        }),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dropshipping', 'cj', 'logs'] });
      showToast('success', 'Stock CJ sincronizado.');
    },
    onError: (error: Error) => showToast('error', error.message),
  });

  const status = statusQuery.data;

  function showToast(type: Toast['type'], message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4500);
  }

  function handleImport(cjProductId: string) {
    if (!cjProductId.trim()) {
      showToast('error', 'Escolhe ou cola um CJ product ID.');
      return;
    }
    importMutation.mutate(cjProductId.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dropshipping</h1>
          <p className="mt-1 text-gray-600">Importa produtos CJ, sincroniza stock e prepara fulfillment rápido.</p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
        >
          {syncMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          Sincronizar stock
        </button>
      </div>

      {toast && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatusCard
          label="CJ API"
          value={status?.configured ? 'Configurada' : 'Sem chave'}
          healthy={Boolean(status?.configured)}
        />
        <StatusCard
          label="Token"
          value={status?.tokenCached ? 'Em cache' : 'Sem cache'}
          healthy={Boolean(status?.tokenCached)}
        />
        <StatusCard
          label="Fornecedor"
          value={status?.supplierActive ? 'Ativo' : 'Inativo'}
          healthy={Boolean(status?.supplierActive)}
        />
        <StatusCard
          label="Armazém alvo"
          value={status?.defaultWarehouseCountry || countryCode || 'PT'}
          healthy
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <label className="flex-1">
            <span className="mb-2 block text-sm font-medium text-gray-700">Pesquisar na CJ</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Ex: coffee grinder, kitchen, pet..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="w-full md:w-32">
            <span className="mb-2 block text-sm font-medium text-gray-700">País stock</span>
            <input
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value.toUpperCase().slice(0, 2))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <button
            onClick={() => searchMutation.mutate()}
            disabled={searchMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {searchMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            Procurar
          </button>
          <button
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {verifyMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            Testar CJ
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <label className="flex-1">
            <span className="mb-2 block text-sm font-medium text-gray-700">Importar por CJ product ID</span>
            <input
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              placeholder="Cole aqui o ID da CJ"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="w-full md:w-44">
            <span className="mb-2 block text-sm font-medium text-gray-700">Margem %</span>
            <input
              type="number"
              min={0}
              max={500}
              value={markupPercent}
              onChange={(event) => setMarkupPercent(Number(event.target.value))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <button
            onClick={() => handleImport(selectedProductId)}
            disabled={importMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
          >
            {importMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            Importar rascunho
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">Resultados CJ</h2>
          <p className="text-sm text-gray-500">Escolhe um produto, importa como rascunho e revê antes de publicar.</p>
        </div>
        {searchMutation.isPending ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            A procurar produtos na CJ...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Sem resultados ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3">CJ ID</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Preço</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img src={product.image} alt={product.title} className="h-12 w-12 rounded object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                            <Truck className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="max-w-md truncate font-medium text-gray-900">{product.title}</p>
                          <p className="text-xs text-gray-500">{product.countryCode || 'Origem não informada'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{product.id}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{product.sku || '-'}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{product.price || '-'}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedProductId(product.id);
                          handleImport(product.id);
                        }}
                        disabled={importMutation.isPending}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
                      >
                        Importar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">Logs CJ recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Quando</th>
                <th className="px-5 py-3">Endpoint</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(logsQuery.data || []).map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-4 text-sm text-gray-600">{new Date(log.created_at).toLocaleString('pt-PT')}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">
                    <span className="font-semibold">{log.method}</span> {log.endpoint}
                    {log.error_message && <p className="mt-1 text-xs text-red-600">{log.error_message}</p>}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className={log.success ? 'text-green-700' : 'text-red-700'}>
                      {log.success ? 'OK' : log.error_code || 'Erro'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</td>
                </tr>
              ))}
              {!logsQuery.data?.length && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                    Ainda não há chamadas CJ registadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, healthy }: { label: string; value: string; healthy: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {healthy ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

type CJProductListItem = {
  id: string;
  title: string;
  sku: string | null;
  image: string | null;
  price: string | null;
  countryCode: string | null;
};

function extractCJProducts(payload: unknown): CJProductListItem[] {
  const records = findFirstArray(payload).filter(isRecord);
  return records
    .map((record) => {
      const id = readString(record, ['pid', 'productId', 'id', 'productID']);
      if (!id) return null;
      return {
        id,
        title: readString(record, ['productNameEn', 'productName', 'nameEn', 'name', 'title']) || `CJ Product ${id}`,
        sku: readString(record, ['productSku', 'productSKU', 'sku', 'productCode']),
        image: readImage(record),
        price: readString(record, ['sellPrice', 'price', 'productPrice', 'listedPrice']),
        countryCode: readString(record, ['countryCode', 'sourceCountryCode']),
      };
    })
    .filter((item): item is CJProductListItem => item !== null);
}

function findFirstArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  for (const key of ['list', 'records', 'content', 'items', 'data', 'products']) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    if (isRecord(nested)) {
      const nestedArray = findFirstArray(nested);
      if (nestedArray.length > 0) return nestedArray;
    }
  }

  return [];
}

function readImage(record: Record<string, unknown>): string | null {
  const direct = readString(record, ['productImage', 'productImageUrl', 'bigImage', 'image', 'imageUrl']);
  if (direct) return direct;

  for (const key of ['productImageSet', 'images', 'imageList']) {
    const value = record[key];
    if (!Array.isArray(value)) continue;
    const first = value[0];
    if (typeof first === 'string') return first;
    if (isRecord(first)) {
      return readString(first, ['url', 'imageUrl', 'productImage', 'src']);
    }
  }

  return null;
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

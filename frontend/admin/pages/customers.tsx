import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Customer, Address } from '@shared/types';
import { DataTable, type Column } from '../components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { MapPin, Mail, Phone, Calendar, User } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer & { addresses?: Address[] } | null>(null);

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['admin', 'customers', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(search && { search }),
      });
      const response = await apiRequest<{ items: Customer[]; total: number; totalPages: number }>(
        `/api/customers?${params.toString()}`
      );
      return response.data || { items: [], total: 0, totalPages: 0 };
    },
  });

  const handleViewCustomer = async (customer: Customer) => {
    try {
      const response = await apiRequest<Customer & { addresses?: Address[] }>(
        `/api/customers/${customer.id}`
      );
      setSelectedCustomer(response.data || null);
    } catch (error) {
      console.error('Erro ao carregar detalhes do cliente:', error);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      accessor: (customer) => customer.id,
    },
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      accessor: (customer) => (
        <div>
          <div className="font-medium">
            {customer.first_name || customer.last_name
              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
              : 'Sem nome'}
          </div>
          <div className="text-sm text-muted-foreground">{customer.email}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      accessor: (customer) => customer.email,
    },
    {
      key: 'phone',
      header: 'Telefone',
      accessor: (customer) => customer.phone || '-',
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (customer) => (
        <Badge variant={customer.is_active === 1 ? 'default' : 'secondary'}>
          {customer.is_active === 1 ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Cadastrado em',
      sortable: true,
      accessor: (customer) => {
        const date = new Date(customer.created_at);
        return date.toLocaleDateString('pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      accessor: (customer) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewCustomer(customer)}
        >
          Ver Detalhes
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus clientes e visualize todas as informações
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : (
            <DataTable
              data={customersData?.items || []}
              columns={columns}
              page={page}
              totalPages={customersData?.totalPages || 0}
              onPageChange={setPage}
              total={customersData?.total || 0}
            />
          )}
        </CardContent>
      </Card>

      {/* Customer Details Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ID</label>
                        <p className="text-sm font-medium">{selectedCustomer.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div>
                          <Badge variant={selectedCustomer.is_active === 1 ? 'default' : 'secondary'}>
                            {selectedCustomer.is_active === 1 ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </label>
                        <p className="text-sm">{selectedCustomer.email}</p>
                      </div>
                      {selectedCustomer.phone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Telefone
                          </label>
                          <p className="text-sm">{selectedCustomer.phone}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nome</label>
                        <p className="text-sm">
                          {selectedCustomer.first_name || selectedCustomer.last_name
                            ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim()
                            : 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Cadastrado em
                        </label>
                        <p className="text-sm">
                          {new Date(selectedCustomer.created_at).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {selectedCustomer.updated_at && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Última atualização</label>
                          <p className="text-sm">
                            {new Date(selectedCustomer.updated_at).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Addresses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Endereços ({selectedCustomer.addresses?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                      <div className="space-y-4">
                        {selectedCustomer.addresses.map((address) => (
                          <div
                            key={address.id}
                            className="p-4 border rounded-lg space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {address.type === 'shipping'
                                    ? 'Entrega'
                                    : address.type === 'billing'
                                    ? 'Faturação'
                                    : 'Ambos'}
                                </Badge>
                                {address.is_default === 1 && (
                                  <Badge>Principal</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-sm space-y-1">
                              <p className="font-medium">
                                {address.first_name} {address.last_name}
                              </p>
                              {address.company && <p>{address.company}</p>}
                              <p>{address.address_line1}</p>
                              {address.address_line2 && <p>{address.address_line2}</p>}
                              <p>
                                {address.postal_code} {address.city}
                              </p>
                              {address.state && <p>{address.state}</p>}
                              <p>{address.country}</p>
                              {address.phone && (
                                <p className="mt-2 flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {address.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

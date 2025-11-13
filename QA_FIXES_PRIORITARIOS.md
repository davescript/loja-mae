# 🔧 CORREÇÕES PRIORITÁRIAS - QA REPORT

Este documento lista as correções mais urgentes identificadas no relatório de QA.

---

## 🔴 P0 - CRÍTICOS (Corrigir Imediatamente)

### 1. Proteção XSS - Sanitização de Dados

**Arquivo:** `frontend/storefront/pages/product/[slug].tsx`

**Problema:** Descrições renderizadas sem sanitização

**Correção:**
```typescript
import DOMPurify from 'dompurify';

// No componente
<div 
  dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(product.description || '') 
  }} 
/>
```

---

### 2. Validação Client-Side em Formulários

**Arquivo:** `frontend/admin/pages/products-advanced.tsx`

**Problema:** Sem validação antes do submit

**Correção:**
```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  price_cents: z.number().min(0.01, "Preço inválido"),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

---

### 3. Validação de Upload de Imagens

**Arquivo:** `frontend/admin/pages/products-advanced.tsx`

**Correção:**
```typescript
const validateImage = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return 'Apenas imagens JPG, PNG ou WebP são permitidas';
  }
  if (file.size > maxSize) {
    return 'Imagem muito grande (máximo 5MB)';
  }
  return null;
};
```

---

### 4. Error Handling Centralizado

**Arquivo:** `frontend/utils/api.ts`

**Correção:**
```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
  }
}

export async function apiRequest<T>(...): Promise<ApiResponse<T>> {
  try {
    // ... código existente
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Erro de conexão', 0, 'NETWORK_ERROR');
  }
}
```

---

### 5. Queries N+1 - Otimização

**Arquivo:** `backend/modules/products.ts`

**Correção:**
```typescript
// Usar JOIN para carregar imagens de uma vez
const query = `
  SELECT 
    p.*,
    json_group_array(
      json_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'position', pi.position
      )
    ) as images_json
  FROM products p
  LEFT JOIN product_images pi ON p.id = pi.product_id
  WHERE ${whereClause}
  GROUP BY p.id
  ORDER BY ${safeSortBy} ${safeSortOrder}
  LIMIT ? OFFSET ?
`;

// Parse JSON no resultado
items = items.map(item => ({
  ...item,
  images: JSON.parse(item.images_json || '[]')
}));
```

---

## 🟠 P1 - ALTOS (Corrigir em Breve)

### 6. AuthGuard para Rotas Protegidas

**Arquivo:** `frontend/components/AuthGuard.tsx` (criar)

**Correção:**
```typescript
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}
```

---

### 7. Rate Limiting na API

**Arquivo:** `backend/utils/rateLimit.ts` (criar)

**Correção:**
```typescript
// Implementar rate limiting usando Cloudflare Workers KV ou D1
const rateLimiter = {
  async check(ip: string, endpoint: string): Promise<boolean> {
    // Verificar limites por IP/endpoint
    // Retornar true se dentro do limite
  }
};
```

---

### 8. Validação de Datas

**Arquivo:** `frontend/admin/pages/coupons-advanced.tsx`

**Correção:**
```typescript
const validateDates = (startDate: string, endDate: string): string | null => {
  if (startDate && endDate) {
    if (new Date(startDate) >= new Date(endDate)) {
      return 'Data de início deve ser anterior à data de término';
    }
  }
  if (endDate && new Date(endDate) < new Date()) {
    return 'Data de término não pode ser no passado';
  }
  return null;
};
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Instalar DOMPurify: `npm install dompurify @types/dompurify`
- [ ] Adicionar validação Zod em todos os formulários
- [ ] Criar AuthGuard component
- [ ] Implementar validação de upload
- [ ] Otimizar queries N+1
- [ ] Adicionar error handling centralizado
- [ ] Implementar rate limiting
- [ ] Adicionar validação de datas
- [ ] Testar todas as correções
- [ ] Atualizar documentação

---

*Documento gerado em 13/11/2025*


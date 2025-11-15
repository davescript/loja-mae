# 🛍️ Loja Mãe - Ecommerce Nível Amazon/Shopify

> **Sistema de E-commerce Empresarial Completo**  
> Stack moderna, escalável, sem mensalidades. Pronto para produção.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

---

## 🌟 Features Principais

### 🎯 Checkout Estilo Amazon
- ✅ Workflow em 2 etapas (Endereço → Pagamento)
- ✅ Seleção de endereços salvos + cadastro inline
- ✅ Integração Stripe Payment Intents + Webhooks
- ✅ Validação rigorosa antes do pagamento

### 📦 Rastreamento Completo
- ✅ Tracking number, transportadora, previsão de entrega
- ✅ Timeline visual animada de status
- ✅ Eventos detalhados (created → paid → shipped → delivered)
- ✅ Notificações automáticas por email

### 👥 Gestão Inteligente de Clientes
- ✅ Segmentação automática (New, Regular, VIP, Inactive)
- ✅ Lifetime value e histórico completo
- ✅ Dashboard com KPIs em tempo real
- ✅ Endereços salvos e preferências

### ⭐ Reviews e Avaliações
- ✅ Sistema 1-5 estrelas
- ✅ Badge "Compra Verificada"
- ✅ Aprovação por admin
- ✅ Sistema de "útil" para reviews

### 📧 Notificações Automáticas
- ✅ Email de confirmação de pedido
- ✅ Email de envio (com tracking)
- ✅ Email de entrega
- ✅ Alertas de estoque baixo
- ✅ Templates HTML profissionais

### 📊 Dashboard Admin Completo
- ✅ Vendas hoje/mês com comparação
- ✅ Pedidos e conversão
- ✅ Ticket médio
- ✅ Gráficos últimos 7 dias
- ✅ Top 5 produtos

### 🔒 Segurança Enterprise
- ✅ JWT autenticação
- ✅ HttpOnly cookies
- ✅ Validação Zod em todas entradas
- ✅ CORS configurável
- ✅ Rate limiting preparado

---

## 🚀 Stack Tecnológica

### Backend
- **Cloudflare Workers** - Edge computing, latência global < 50ms
- **D1 (SQLite)** - Database serverless escalável
- **R2** - Object storage para imagens
- **TypeScript** - Type safety completo
- **Zod** - Validação de schemas
- **JWT** - Autenticação segura

### Frontend
- **React 18** + **Vite** - Build ultra-rápido
- **TailwindCSS** + **shadcn/ui** - UI profissional
- **Framer Motion** - Animações suaves
- **React Query** - Cache inteligente
- **Zustand** - Estado global com persist

### Pagamentos
- **Stripe Payment Intents** - Pagamentos SCA-ready
- **Webhooks** - Confirmação assíncrona
- **Strong Customer Authentication** - PSD2 compliant

---

## 📚 Documentação

- **[FEATURES.md](./FEATURES.md)** - Lista completa de funcionalidades
- **[DEPLOY.md](./DEPLOY.md)** - Guia de deploy passo a passo
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Documentação completa da API

---

## 🏗️ Arquitetura

```
loja-mae/
├── backend/              # Cloudflare Workers API
│   ├── api/             # Rotas REST
│   │   ├── admin/       # Endpoints admin
│   │   ├── stripe/      # Webhooks Stripe
│   │   ├── customers/   # Portal cliente
│   │   └── products/    # Catálogo
│   ├── modules/         # Lógica de negócio
│   │   ├── orders.ts
│   │   ├── tracking.ts
│   │   ├── reviews.ts
│   │   └── segments.ts
│   ├── services/        # Serviços externos
│   │   └── notifications.ts
│   └── utils/           # Utilitários
├── frontend/            # React SPA
│   ├── admin/          # Painel admin
│   ├── storefront/     # Loja
│   ├── store/          # Zustand stores
│   └── components/     # UI components
├── migrations/         # SQL migrations (10)
└── shared/            # Tipos compartilhados
```

---

## 🎯 Início Rápido

### Pré-requisitos
```bash
node >= 18
npm >= 9
wrangler >= 3.0
```

### Instalação

```bash
# Clone o repo
git clone https://github.com/SEU-USUARIO/loja-mae.git
cd loja-mae

# Instalar dependências
npm install

# Configurar secrets
cp .dev.vars.example .dev.vars
# Editar .dev.vars com suas chaves

# Rodar localmente
npm run dev

# Backend: http://localhost:8787
# Frontend: http://localhost:5173
```

### Deploy Produção

```bash
# Criar D1 database
wrangler d1 create loja-mae-db

# Aplicar migrations
./scripts/apply-migrations.sh

# Deploy backend
cd backend && wrangler deploy

# Deploy frontend
cd frontend && npm run build
npx wrangler pages deploy dist
```

📖 **[Guia completo de deploy](./DEPLOY.md)**

---

## 📊 Banco de Dados

### 10 Migrations Aplicadas

- ✅ 0001_init - Schema inicial
- ✅ 0002_favorites - Sistema de favoritos
- ✅ 0003_banners - Banners promocionais
- ✅ 0004_analytics - Analytics e métricas
- ✅ 0005_notifications - Notificações cliente
- ✅ 0006_shipping_address_id - Link endereços
- ✅ 0007_order_tracking - Rastreamento pedidos
- ✅ 0008_product_reviews - Avaliações produtos
- ✅ 0009_customer_segments - Segmentação clientes
- ✅ 0010_inventory_alerts - Alertas de estoque

### Principais Tabelas

```sql
products, product_images, product_variants, categories
customers, addresses, customer_segments
orders, order_items, order_tracking_events
favorites, cart_items, coupons
product_reviews, review_helpfulness
inventory_alerts, inventory_thresholds
admins, sessions, notifications
```

---

## 🎨 Screenshots

### Storefront
- Home page moderna e responsiva
- Grid de produtos com lazy loading
- Página de produto com galeria
- Checkout em 2 etapas
- Carrinho persistente

### Admin
- Dashboard com KPIs em tempo real
- Gestão de produtos avançada
- Timeline visual de pedidos
- Painel de clientes com segmentação
- Analytics e relatórios

---

## 🔐 Segurança

- ✅ JWT com HS256
- ✅ HttpOnly cookies para sessões
- ✅ CORS restritivo
- ✅ Validação Zod em todas as entradas
- ✅ Prepared statements (SQL injection protection)
- ✅ Rate limiting (preparado)
- ✅ XSS sanitization
- ✅ HTTPS obrigatório em produção

---

## 📈 Performance

- ✅ **Edge Computing** - Cloudflare Workers em 300+ cidades
- ✅ **< 50ms latency** global
- ✅ **Query Optimization** - Índices estratégicos
- ✅ **Image Optimization** - R2 + CDN
- ✅ **Code Splitting** - Vite + dynamic imports
- ✅ **Cache Headers** - Agressivo para assets estáticos

---

## 🧪 Testes

```bash
# Testes unitários (preparado)
npm test

# Testes e2e (preparado)
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Roadmap

### ✅ Completo
- [x] Checkout completo com endereços
- [x] Rastreamento de pedidos
- [x] Reviews e avaliações
- [x] Segmentação de clientes
- [x] Notificações automáticas
- [x] Dashboard admin KPIs
- [x] Sistema de estoque

### 🚧 Próximos Passos
- [ ] Motor de promoções avançado (BOGO, desconto progressivo)
- [ ] Sistema de cupons com regras
- [ ] Integração API transportadoras (tracking real)
- [ ] Cálculo de frete dinâmico
- [ ] Programa de fidelidade
- [ ] Chat ao vivo / chatbot IA
- [ ] PWA + notificações push
- [ ] Multi-moeda e i18n

---

## 💰 Custo Operacional

### Cloudflare (100% Free Tier)
- Workers: 100.000 requests/dia grátis
- D1: 5GB storage + 5M reads/dia
- R2: 10GB storage + 1M operations/mês
- Pages: Deploy ilimitados

### Stripe
- 1,5% + €0,25 por transação europeia
- Sem taxas mensais

**Custo estimado para 1000 pedidos/mês: ~€15-20 (só Stripe)**

---

## 📞 Suporte

- 📧 Email: suporte@leiasabores.pt
- 📚 Docs: [FEATURES.md](./FEATURES.md)
- 🐛 Issues: [GitHub Issues](https://github.com/SEU-USUARIO/loja-mae/issues)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## 🎉 Créditos

Desenvolvido com ❤️ usando:
- [React](https://reactjs.org/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Stripe](https://stripe.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

## 🌟 Star History

Se este projeto te ajudou, considere dar uma ⭐!

---

**Sistema pronto para escalar de 0 a milhões de pedidos/mês. 🚀**

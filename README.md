# Loja Mãe - E-commerce Full Stack

E-commerce completo full stack desenvolvido com React + Vite + TypeScript no frontend e Cloudflare Workers + D1 + R2 no backend.

## 🚀 Stack Tecnológico

### Frontend
- React 18 + Vite
- TypeScript
- TailwindCSS + shadcn/ui
- Framer Motion
- React Query
- React Router

### Backend
- Cloudflare Workers
- Cloudflare D1 (SQLite)
- Cloudflare R2 (Storage)
- Zod (Validação)
- JWT (Autenticação)
- Stripe (Pagamentos)

## 📁 Estrutura do Projeto

```
/
├── backend/
│   ├── api/           # Rotas da API
│   ├── modules/       # Lógica de negócio
│   ├── utils/         # Utilitários
│   ├── validators/    # Validators Zod
│   └── types/         # Tipos TypeScript
├── frontend/
│   ├── admin/         # Painel administrativo
│   ├── storefront/    # Loja para clientes
│   ├── hooks/         # React Hooks
│   └── utils/         # Utilitários
├── migrations/        # Migrations D1
├── shared/           # Código compartilhado
└── scripts/          # Scripts utilitários
```

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd loja-mãe
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

4. Configure o Cloudflare:
```bash
# Login no Cloudflare
npx wrangler login

# Crie o banco D1
npx wrangler d1 create loja-mae-db

# Atualize o database_id no wrangler.toml

# Crie o bucket R2
npx wrangler r2 bucket create loja-mae-images

# Configure os secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

5. Execute as migrations:
```bash
npm run d1:migrate
```

## 🚀 Desenvolvimento

### Backend
```bash
npm run dev:backend
```

### Frontend
```bash
npm run dev:frontend
```

### Ambos
```bash
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 🚢 Deploy

```bash
npm run deploy
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia backend e frontend em desenvolvimento
- `npm run dev:backend` - Inicia apenas o backend
- `npm run dev:frontend` - Inicia apenas o frontend
- `npm run build` - Build do projeto
- `npm run deploy` - Deploy para Cloudflare
- `npm run d1:migrate` - Executa migrations D1
- `npm run typecheck` - Verifica tipos TypeScript

## 🔐 Autenticação

### Cliente
- JWT token armazenado no localStorage
- Endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`

### Admin
- Cookie httpOnly para segurança
- Endpoint: `/api/auth/admin/login`

## 💳 Pagamentos

Integração com Stripe:
- Payment Intents para checkout
- Webhook para atualização de pedidos
- Endpoints: `/api/stripe/checkout`, `/api/stripe/webhook`

## 📊 Banco de Dados

### Tabelas Principais
- `products` - Produtos
- `categories` - Categorias
- `customers` - Clientes
- `orders` - Pedidos
- `coupons` - Cupons
- `cart_items` - Itens do carrinho
- `favorites` - Favoritos

## 🖼️ Storage

Imagens armazenadas no Cloudflare R2:
- Upload automático com validação
- URLs públicas
- Suporte a múltiplas imagens por produto

## 📄 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

## 📧 Contato

Para dúvidas ou suporte, entre em contato: contato@loja-mae.com


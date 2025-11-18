# 💰 Custo Operacional Detalhado - Loja Mãe

## Infraestrutura Atual

### 🆓 Cloudflare (100% GRÁTIS no Free Tier)

#### Cloudflare Workers
- **Plano:** Free Tier
- **Incluído:** 100.000 requests/dia (3M/mês)
- **Custo:** €0,00/mês
- **Após limite:** €0,15 por 1M requests adicionais

**Uso estimado:**
- 1.000 pedidos/mês = ~50.000 requests/mês
- 5.000 pedidos/mês = ~250.000 requests/mês
- ✅ Dentro do Free Tier até ~3.000 pedidos/mês

---

#### Cloudflare D1 (Database)
- **Plano:** Free Tier
- **Storage:** 5 GB incluídos
- **Leituras:** 5 milhões/dia incluídas
- **Escritas:** 100.000/dia incluídas
- **Custo:** €0,00/mês

**Uso estimado:**
- 1.000 pedidos/mês = ~50.000 escritas + 500.000 leituras/mês
- ✅ Dentro do Free Tier até 50.000+ pedidos/mês

---

#### Cloudflare R2 (Storage de Imagens)
- **Plano:** Free Tier
- **Storage:** 10 GB incluídos
- **Operações:** 1 milhão/mês incluídas
- **Tráfego saída:** Ilimitado GRÁTIS (diferencial!)
- **Custo:** €0,00/mês

**Uso estimado:**
- 500 produtos × 5 imagens × 500KB = ~1,25 GB
- ✅ Dentro do Free Tier até 2.000+ produtos

---

#### Cloudflare Pages (Frontend)
- **Plano:** Free Tier
- **Deploys:** Ilimitados
- **Bandwidth:** Ilimitado
- **Builds:** 500/mês incluídos
- **Custo:** €0,00/mês

**Uso estimado:**
- 5-10 deploys/mês
- ✅ Sempre grátis

---

### 💳 Stripe (Pagamentos)

#### Taxas de Transação
- **Cartões Europeus:** 1,5% + €0,25 por transação
- **Cartões não-Europeus:** 3,25% + €0,25 por transação
- **Taxa mensal:** €0,00 (sem mensalidade!)
- **Setup fee:** €0,00

**Exemplos práticos:**

| Pedidos/Mês | Ticket Médio | Faturamento | Taxa Stripe | Custo Efetivo |
|-------------|--------------|-------------|-------------|---------------|
| 100         | €50          | €5.000      | €100        | 2,0%          |
| 500         | €75          | €37.500     | €688        | 1,83%         |
| 1.000       | €100         | €100.000    | €1.750      | 1,75%         |
| 5.000       | €150         | €750.000    | €11.875     | 1,58%         |

**Cálculo:**
```
Taxa = (Valor × 1,5%) + €0,25
```

---

### 📧 Email (MailChannels via Cloudflare)

- **Plano:** Grátis via Cloudflare Workers
- **Limite:** 100.000 emails/dia
- **Custo:** €0,00/mês

**Uso estimado:**
- 1.000 pedidos/mês × 3 emails (confirmação + envio + entrega) = 3.000 emails/mês
- ✅ Sempre grátis

---

## 💰 Custo Total por Cenário

### Cenário 1: Startup (100 pedidos/mês)
| Serviço           | Custo      |
|-------------------|------------|
| Cloudflare        | €0         |
| Stripe (€50/ped)  | €100       |
| Email             | €0         |
| **TOTAL**         | **€100**   |

**Margem:** 98% (€4.900 líquido de €5.000 bruto)

---

### Cenário 2: Crescimento (500 pedidos/mês)
| Serviço            | Custo      |
|--------------------|------------|
| Cloudflare         | €0         |
| Stripe (€75/ped)   | €688       |
| Email              | €0         |
| **TOTAL**          | **€688**   |

**Margem:** 98,2% (€36.812 líquido de €37.500 bruto)

---

### Cenário 3: Estabelecido (1.000 pedidos/mês)
| Serviço             | Custo      |
|---------------------|------------|
| Cloudflare          | €0         |
| Stripe (€100/ped)   | €1.750     |
| Email               | €0         |
| **TOTAL**           | **€1.750** |

**Margem:** 98,25% (€98.250 líquido de €100.000 bruto)

---

### Cenário 4: Scale-up (5.000 pedidos/mês)
| Serviço             | Custo       |
|---------------------|-------------|
| Cloudflare Workers  | €75*        |
| Cloudflare D1       | €0          |
| Cloudflare R2       | €0          |
| Stripe (€150/ped)   | €11.875     |
| Email               | €0          |
| **TOTAL**           | **€11.950** |

**Margem:** 98,4% (€738.050 líquido de €750.000 bruto)

*Workers ultrapassam Free Tier, mas custo ainda mínimo

---

## 📊 Comparação com Concorrentes

### Shopify
| Plano              | Custo Mensal | Taxa Transação | Custo 1K Pedidos |
|--------------------|--------------|----------------|------------------|
| Basic              | €29          | 2,0% + €0,25   | €2.279           |
| Shopify            | €79          | 1,8% + €0,25   | €2.079           |
| Advanced           | €289         | 1,6% + €0,25   | €1.939           |
| **Loja Mãe**       | **€0**       | **1,5% + €0,25** | **€1.750**     |

**Economia anual (1K pedidos/mês):**
- vs Shopify Basic: €6.348/ano
- vs Shopify Standard: €3.948/ano
- vs Shopify Advanced: €2.268/ano

---

### WooCommerce + WP Engine
| Item                | Custo Mensal |
|---------------------|--------------|
| Hosting WP Engine   | €30          |
| Tema Premium        | €5 (anual)   |
| Plugins             | €20          |
| SSL                 | €0           |
| CDN                 | €10          |
| Backups             | €5           |
| **Total Mensal**    | **€70**      |

**+ Stripe:** €1.750 (1K pedidos)  
**Total:** €2.590/mês

**Loja Mãe:** €1.750/mês  
**Economia:** €840/mês = €10.080/ano

---

### Magento (Adobe Commerce)
| Item                | Custo Mensal |
|---------------------|--------------|
| Hosting Cloud       | €500+        |
| Licença             | €2.000+      |
| Manutenção          | €500         |
| **Total Mensal**    | **€3.000+**  |

**+ Stripe:** €1.750  
**Total:** €4.750+/mês

**Loja Mãe:** €1.750/mês  
**Economia:** €3.000+/mês = €36.000+/ano

---

## 🎯 Quando Escalar para Paid Tier?

### Cloudflare Workers Paid ($5/mês)
**Considerar quando:**
- Ultrapassar 100K requests/dia (3M/mês)
- ~3.000+ pedidos/mês
- CPU time > 50ms médio

**Benefícios do Paid:**
- 10 milhões requests incluídos
- CPU time ilimitado
- Suporte prioritário

---

### Cloudflare R2 Paid
**Considerar quando:**
- Storage > 10 GB (2.000+ produtos com muitas imagens)
- Operações > 1M/mês

**Custo adicional:**
- Storage: $0,015/GB/mês (~€0,014)
- 20 GB = ~€0,28/mês (praticamente zero)

---

## 💡 Otimizações de Custo

### 1. Cache Agressivo
```typescript
// Reduz requests repetidos
Cache-Control: public, max-age=3600
```
**Economia:** 30-50% de requests

---

### 2. Image Optimization
```bash
# Converter para WebP, reduzir qualidade
cwebp -q 80 image.jpg -o image.webp
```
**Economia:** 60-80% de storage

---

### 3. Lazy Loading
```jsx
<img loading="lazy" />
```
**Economia:** 40% de bandwidth

---

### 4. Database Indexing
```sql
CREATE INDEX idx_orders_created_at ON orders(created_at);
```
**Economia:** 50-70% de read operations

---

## 📈 Projeção de Crescimento

| Pedidos/Mês | Faturamento | Custo Infra | Custo Stripe | Total Custo | Margem  |
|-------------|-------------|-------------|--------------|-------------|---------|
| 100         | €5.000      | €0          | €100         | €100        | 98,0%   |
| 500         | €37.500     | €0          | €688         | €688        | 98,2%   |
| 1.000       | €100.000    | €0          | €1.750       | €1.750      | 98,3%   |
| 5.000       | €750.000    | €75         | €11.875      | €11.950     | 98,4%   |
| 10.000      | €1.500.000  | €150        | €23.750      | €23.900     | 98,4%   |
| 50.000      | €7.500.000  | €500        | €118.750     | €119.250    | 98,4%   |

**Observação:** Margem permanece constante ~98,4% independente da escala!

---

## 🎁 Custos Evitados

### Com Loja Mãe você NÃO paga por:

✅ Servidor dedicado (€100-500/mês)  
✅ VPS/Cloud hosting (€50-300/mês)  
✅ CDN separado (€20-100/mês)  
✅ SSL certificado (€50/ano)  
✅ Backup service (€20-50/mês)  
✅ Monitoring tools (€30-100/mês)  
✅ Plataforma SaaS (€29-289/mês)  
✅ Plugins premium (€50-200/mês)  
✅ Suporte técnico (€100-500/mês)  
✅ DevOps/Infra engineer (€3.000-6.000/mês)

**Total evitado:** €3.500-8.000/mês = €42.000-96.000/ano

---

## 🏆 Resumo Executivo

### Custo Real Mensal (1.000 pedidos/mês):

```
Infraestrutura Cloudflare:  €0
Processamento Stripe:       €1.750
Email Transacional:         €0
───────────────────────────────────
TOTAL:                      €1.750
```

### ROI:

- **Investimento inicial:** €0 (código open source)
- **Payback period:** Imediato
- **Break-even:** Primeiro pedido
- **Escalabilidade:** Ilimitada

---

## 📞 Conclusão

**Loja Mãe oferece:**

✅ Custo operacional de **apenas 1,75%** do faturamento  
✅ Sem custos fixos mensais  
✅ Sem surpresas na fatura  
✅ Escalabilidade automática incluída  
✅ Performance global premium  
✅ Economia de **€36.000-96.000/ano** vs soluções tradicionais  

**O sistema mais econômico do mercado mantendo qualidade enterprise.** 🚀


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURAÇÃO DE LIMITES - VERSÃO SIMPLIFICADA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Como usar este arquivo:
 * 1. Copie este arquivo para limits.ts
 * 2. Ajuste os valores abaixo conforme sua necessidade
 * 3. Faça redeploy do backend
 * 
 * DICAS:
 * - Valores MAIORES = mais permissivo, maior custo potencial
 * - Valores MENORES = mais restritivo, menor custo
 * - Comece conservador e aumente conforme necessário
 */

export const LIMITS = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. RATE LIMITING (Limites de Requisições)
  // ═══════════════════════════════════════════════════════════════════════════
  
  RATE_LIMIT: {
    
    // Visitantes não autenticados (por IP)
    IP: {
      WINDOW_MS: 60 * 1000,           // 1 minuto (não mude)
      MAX_REQUESTS: 60,                // 👈 AJUSTE AQUI: quantas requisições por minuto?
      // Recomendado: 60 para uso normal, 120 se tiver muito tráfego legítimo
    },
    
    // Clientes autenticados
    CUSTOMER: {
      WINDOW_MS: 60 * 60 * 1000,      // 1 hora (não mude)
      MAX_REQUESTS: 600,               // 👈 AJUSTE AQUI: quantas requisições por hora?
      // Recomendado: 600 para uso normal, 1200 para heavy users
    },
    
    // Admins
    ADMIN: {
      WINDOW_MS: 60 * 60 * 1000,      // 1 hora
      MAX_REQUESTS: 3000,              // 👈 AJUSTE AQUI: admins precisam de mais
      // Recomendado: 3000 (admins fazem muitas operações)
    },
    
    // Endpoints críticos (pagamento, checkout)
    CRITICAL: {
      WINDOW_MS: 60 * 1000,           // 1 minuto
      MAX_REQUESTS: 5,                 // 👈 AJUSTE AQUI: limite bem baixo para segurança
      // Recomendado: 5 (evita fraude e tentativas de ataque)
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. FILAS (Queues)
  // ═══════════════════════════════════════════════════════════════════════════
  
  QUEUE: {
    
    MAX_RETRIES: 3,                    // 👈 AJUSTE: tentativas antes de desistir
    // Recomendado: 3 (mais que isso raramente ajuda)
    
    RETRY_DELAYS: [1000, 5000, 15000], // 👈 AJUSTE: delays entre tentativas (ms)
    // Recomendado: [1s, 5s, 15s] - backoff exponencial
    // Aumente se quiser dar mais tempo: [2000, 10000, 30000]
    
    MAX_JOBS_PER_MINUTE: 100,          // 👈 AJUSTE: jobs processados por minuto
    // Recomendado: 100 para custo controlado
    // Aumente para 200 se tiver fila acumulada frequentemente
    // Reduza para 50 se quiser gastar menos
    
    MAX_QUEUE_SIZE: 10000,             // 👈 AJUSTE: tamanho máximo da fila
    // Recomendado: 10000
    // Se atingir isso constantemente, tem algo errado!
    
    BATCH_SIZE: 10,                    // 👈 AJUSTE: jobs processados por vez
    // Recomendado: 10 (bom balanço)
    // Aumente para 20 se processar rápido
    
    JOB_TIMEOUT: 30000,                // 👈 AJUSTE: timeout por job (ms)
    // Recomendado: 30s
    // Jobs lentos (PDF, emails) podem precisar de 60000 (60s)
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CRON JOBS (Tarefas Agendadas)
  // ═══════════════════════════════════════════════════════════════════════════
  
  CRON: {
    
    MIN_INTERVAL_MINUTES: 5,           // 👈 AJUSTE: intervalo mínimo permitido
    // Recomendado: 5 minutos
    // NUNCA coloque menos que 5! (custa caro e não precisa)
    
    // Rastreamento de pedidos (CTT, etc)
    SYNC_TRACKING: {
      MAX_ORDERS_PER_RUN: 100,         // 👈 AJUSTE: pedidos sincronizados por vez
      // Recomendado: 100
      // Aumente para 200 se tiver muitos pedidos
      
      INTERVAL_MINUTES: 15,            // 👈 AJUSTE: rodar a cada X minutos
      // Recomendado: 15 minutos (bom balanço)
      // Reduza para 30 se quiser economizar
    },
    
    // Atualizar segmentação de clientes
    UPDATE_SEGMENTS: {
      MAX_CUSTOMERS_PER_RUN: 500,      // 👈 AJUSTE: clientes processados por vez
      // Recomendado: 500
      
      INTERVAL_MINUTES: 60,            // 👈 AJUSTE: rodar a cada X minutos
      // Recomendado: 60 minutos (1x por hora é suficiente)
    },
    
    // Verificar estoque baixo
    CHECK_INVENTORY: {
      MAX_PRODUCTS_PER_RUN: 1000,      // 👈 AJUSTE: produtos verificados por vez
      // Recomendado: 1000
      
      INTERVAL_MINUTES: 30,            // 👈 AJUSTE: rodar a cada X minutos
      // Recomendado: 30 minutos
    },
    
    // Limpar carrinhos antigos
    CLEANUP_OLD_CARTS: {
      MAX_ROWS_PER_RUN: 1000,          // 👈 AJUSTE: linhas deletadas por vez
      // Recomendado: 1000
      
      INTERVAL_MINUTES: 1440,          // 👈 AJUSTE: 1440 = 1x por dia
      // Recomendado: 1x por dia é suficiente
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PROTEÇÃO CONTRA LOOPS
  // ═══════════════════════════════════════════════════════════════════════════
  
  RECURSION: {
    
    MAX_DEPTH: 3,                      // 👈 AJUSTE: níveis de recursão permitidos
    // Recomendado: 3 (mais que isso é raramente necessário)
    // NÃO coloque mais de 5! (risco de loop infinito)
    
    MAX_ITERATIONS: 10,                // 👈 AJUSTE: iterações em loops
    // Recomendado: 10
    // Aumente para 50 se tiver loops legítimos grandes
    
    TIMEOUT_MS: 5000,                  // 👈 AJUSTE: timeout máximo (ms)
    // Recomendado: 5 segundos
    // Aumente para 10000 (10s) se precisar processar muito
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. GERAÇÃO DE ARQUIVOS (PDF, Excel, Imagens)
  // ═══════════════════════════════════════════════════════════════════════════
  
  FILE_GENERATION: {
    
    MAX_INPUT_SIZE_MB: 10,             // 👈 AJUSTE: tamanho máximo de upload
    // Recomendado: 10 MB
    // Aumente para 20 se precisar aceitar arquivos maiores
    
    // PDFs (faturas, relatórios)
    PDF: {
      MAX_PER_HOUR: 50,                // 👈 AJUSTE: PDFs por hora por usuário
      // Recomendado: 50
      // Aumente para 100 se admins gerarem muitos relatórios
      
      MAX_PAGES: 100,                  // 👈 AJUSTE: páginas máximas por PDF
      // Recomendado: 100 páginas
    },
    
    // Planilhas Excel
    EXCEL: {
      MAX_PER_HOUR: 20,                // 👈 AJUSTE: planilhas por hora
      // Recomendado: 20
      
      MAX_ROWS: 50000,                 // 👈 AJUSTE: linhas máximas
      // Recomendado: 50.000 linhas
      // Reduzir para 10.000 se quiser economizar memória
    },
    
    // Imagens (produtos, banners)
    IMAGE: {
      MAX_PER_HOUR: 100,               // 👈 AJUSTE: uploads por hora
      // Recomendado: 100
      
      MAX_DIMENSION: 4096,             // 👈 AJUSTE: largura/altura máxima (px)
      // Recomendado: 4096px (4K)
      // Reduzir para 2048 se quiser economizar storage
    },
    
    CACHE_TTL_HOURS: 24,               // 👈 AJUSTE: tempo de cache no R2
    // Recomendado: 24 horas
    // Aumente para 168 (1 semana) se arquivos mudarem pouco
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. MODO DEGRADADO (Proteção contra sobrecarga)
  // ═══════════════════════════════════════════════════════════════════════════
  
  DEGRADED_MODE: {
    
    // Quando ativar o modo degradado?
    TRIGGERS: {
      
      QUEUE_SIZE: 8000,                // 👈 AJUSTE: ativar se fila > X jobs
      // Recomendado: 8000
      // Reduza para 5000 se quiser proteção mais agressiva
      
      AVERAGE_RESPONSE_TIME_MS: 3000,  // 👈 AJUSTE: ativar se latência > X ms
      // Recomendado: 3000ms (3 segundos)
      // Reduza para 2000 se quiser resposta mais rápida sempre
      
      ERROR_RATE_PERCENT: 10,          // 👈 AJUSTE: ativar se erros > X%
      // Recomendado: 10%
      // Reduza para 5% se quiser ser mais conservador
      
      RETRY_COUNT: 500,                // 👈 AJUSTE: ativar se retries > X
      // Recomendado: 500 em 5 minutos
    },
    
    // O que desativar no modo degradado
    DISABLE_FEATURES: [
      'reports_heavy',                 // Relatórios pesados
      'exports_bulk',                  // Exportações em massa
      'email_marketing',               // Emails marketing (não transacionais)
      'analytics_complex',             // Analytics complexos
    ],
    
    // O que SEMPRE manter ativo (CRÍTICO)
    CRITICAL_FEATURES: [
      'auth',                          // Login/Logout
      'checkout',                      // Finalizar compra
      'stripe_webhook',                // Webhooks Stripe
      'order_status',                  // Atualização de pedidos
      'email_transactional',           // Emails transacionais
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. MONITORAMENTO E ALERTAS
  // ═══════════════════════════════════════════════════════════════════════════
  
  MONITORING: {
    
    METRICS_INTERVAL_MS: 60000,        // 👈 AJUSTE: coletar métricas a cada X ms
    // Recomendado: 60000 (1 minuto)
    // Não coloque menos que 30000 (30s) - gera muito dado!
    
    // Quando enviar alertas?
    ALERTS: {
      
      REQUESTS_PER_MIN_THRESHOLD: 10000,  // 👈 AJUSTE: alertar se req/min > X
      // Recomendado: 10000
      // Ajuste baseado no seu tráfego normal
      
      QUEUE_SIZE_THRESHOLD: 5000,         // 👈 AJUSTE: alertar se fila > X
      // Recomendado: 5000
      // Se atingir isso, algo está errado!
      
      FAILED_JOBS_THRESHOLD: 100,         // 👈 AJUSTE: alertar se falhas > X
      // Recomendado: 100
      // Menos de 100 pode gerar muitos falsos positivos
      
      PDF_GENERATION_THRESHOLD: 500,      // 👈 AJUSTE: alertar se PDFs/hora > X
      // Recomendado: 500
      
      AVG_RESPONSE_TIME_THRESHOLD: 2000,  // 👈 AJUSTE: alertar se latência > X ms
      // Recomendado: 2000ms (2 segundos)
      // Usuários esperam resposta em menos de 2s
    },
    
    LOG_LEVELS: {
      RATE_LIMIT_HIT: 'warn',          // Nível de log quando rate limit é atingido
      DEAD_LETTER_QUEUE: 'error',      // Nível de log para DLQ
      RECURSION_LIMIT: 'warn',         // Nível de log para loops
      DEGRADED_MODE_ACTIVE: 'error',   // Nível de log para modo degradado
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. DATABASE (Limites de queries)
  // ═══════════════════════════════════════════════════════════════════════════
  
  DATABASE: {
    
    MAX_PAGE_SIZE: 100,                // 👈 AJUSTE: máximo de itens por página
    // Recomendado: 100
    // NUNCA mais de 1000! (muito lento)
    
    DEFAULT_PAGE_SIZE: 20,             // 👈 AJUSTE: tamanho padrão de página
    // Recomendado: 20 (bom para UX)
    
    MAX_QUERY_TIME_MS: 5000,           // 👈 AJUSTE: timeout de query (ms)
    // Recomendado: 5000 (5 segundos)
    // Queries mais lentas devem ser otimizadas!
    
    MAX_BATCH_INSERT: 1000,            // 👈 AJUSTE: inserções por batch
    // Recomendado: 1000
    // D1 tem limite de tamanho de transação
    
    MAX_BATCH_UPDATE: 500,             // 👈 AJUSTE: updates por batch
    // Recomendado: 500
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. STORAGE (R2 - Armazenamento de arquivos)
  // ═══════════════════════════════════════════════════════════════════════════
  
  STORAGE: {
    
    MAX_UPLOAD_SIZE_MB: 10,            // 👈 AJUSTE: upload máximo
    // Recomendado: 10 MB
    // Aumente para 20 se precisar aceitar vídeos/arquivos grandes
    
    MAX_IMAGE_SIZE_MB: 5,              // 👈 AJUSTE: imagem máxima
    // Recomendado: 5 MB
    
    MAX_UPLOADS_PER_HOUR: 1000,        // 👈 AJUSTE: uploads por hora
    // Recomendado: 1000
    // Previne abuso e controla custo de storage
    
    TEMP_FILE_TTL_HOURS: 24,           // 👈 AJUSTE: deletar temporários após X horas
    // Recomendado: 24 horas
    
    OLD_BACKUP_DAYS: 30,               // 👈 AJUSTE: manter backups por X dias
    // Recomendado: 30 dias
    // Aumente para 90 se precisar de histórico maior
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. APIs EXTERNAS (Stripe, CTT, etc)
  // ═══════════════════════════════════════════════════════════════════════════
  
  EXTERNAL_API: {
    
    TIMEOUT_MS: 10000,                 // 👈 AJUSTE: timeout para APIs externas (ms)
    // Recomendado: 10000 (10 segundos)
    // APIs externas podem ser lentas
    
    MAX_RETRIES: 3,                    // 👈 AJUSTE: tentativas de retry
    // Recomendado: 3
    
    RETRY_DELAY_MS: 2000,              // 👈 AJUSTE: delay entre retries (ms)
    // Recomendado: 2000 (2 segundos)
    
    STRIPE_MAX_PER_SECOND: 10,         // 👈 AJUSTE: chamadas Stripe por segundo
    // Recomendado: 10
    // Stripe permite 100/s, mas 10 é seguro
    
    CTT_TRACKING_MAX_PER_MINUTE: 60,   // 👈 AJUSTE: tracking CTT por minuto
    // Recomendado: 60
    // APIs de tracking costumam ter rate limit
  },

} as const;

// ═══════════════════════════════════════════════════════════════════════════
// PRESETS PRONTOS (escolha um e copie os valores acima)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PRESET 1: CONSERVADOR (Menor custo, mais restrições)
 * Use se: está começando, quer gastar o mínimo
 * 
 * Ajustes principais:
 * - MAX_JOBS_PER_MINUTE: 50
 * - CRON intervalos maiores (30min, 2h)
 * - MAX_PER_HOUR reduzidos pela metade
 * - Rate limits mais baixos
 */

/**
 * PRESET 2: BALANCEADO (Padrão recomendado)
 * Use se: tráfego normal, quer bom balanço
 * 
 * Valores já estão configurados acima ☝️
 * Este é o preset padrão recomendado!
 */

/**
 * PRESET 3: AGRESSIVO (Maior performance, maior custo)
 * Use se: muito tráfego, precisa processar rápido
 * 
 * Ajustes principais:
 * - MAX_JOBS_PER_MINUTE: 200
 * - CRON intervalos menores (5min, 30min)
 * - MAX_PER_HOUR dobrados
 * - Rate limits mais altos
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DICAS FINAIS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1. COMECE CONSERVADOR
 *    - É mais fácil aumentar limites do que lidar com custos altos
 * 
 * 2. MONITORE SEMPRE
 *    - Veja os logs para identificar se algum limite está muito baixo
 * 
 * 3. AJUSTE GRADUALMENTE
 *    - Aumente 20-30% por vez, não dobre de uma vez
 * 
 * 4. DOCUMENTE MUDANÇAS
 *    - Anote por que mudou cada valor (para referência futura)
 * 
 * 5. TESTE EM STAGING
 *    - Teste novos limites em ambiente de teste antes de produção
 */


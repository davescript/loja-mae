/**
 * CONFIGURAÇÃO CENTRALIZADA DE LIMITES
 * 
 * Todos os limites do sistema em um único lugar.
 * Ajuste aqui para controlar escalabilidade vs custo.
 */

export const LIMITS = {
  // ═══════════════════════════════════════════════════════════
  // 1. RATE LIMITING
  // ═══════════════════════════════════════════════════════════
  RATE_LIMIT: {
    // Por IP (visitantes não autenticados)
    IP: {
      WINDOW_MS: 60 * 1000, // 1 minuto
      MAX_REQUESTS: 60, // 60 req/min = 1 req/segundo médio
    },
    
    // Por usuário autenticado (customer)
    CUSTOMER: {
      WINDOW_MS: 60 * 60 * 1000, // 1 hora
      MAX_REQUESTS: 600, // 600 req/hora = 10 req/min médio
    },
    
    // Por admin autenticado
    ADMIN: {
      WINDOW_MS: 60 * 60 * 1000, // 1 hora
      MAX_REQUESTS: 3000, // 3000 req/hora = 50 req/min médio
    },
    
    // Endpoints críticos (checkout, pagamento)
    CRITICAL: {
      WINDOW_MS: 60 * 1000, // 1 minuto
      MAX_REQUESTS: 5, // Máximo 5 tentativas de pagamento por minuto
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 2. QUEUES (FILAS)
  // ═══════════════════════════════════════════════════════════
  QUEUE: {
    // Tentativas de retry
    MAX_RETRIES: 3,
    
    // Backoff exponencial (ms)
    RETRY_DELAYS: [1000, 5000, 15000], // 1s, 5s, 15s
    
    // Máximo de jobs processados por minuto (por consumer)
    MAX_JOBS_PER_MINUTE: 100,
    
    // Tamanho máximo da fila antes de ativar proteção
    MAX_QUEUE_SIZE: 10000,
    
    // Batch size para processamento
    BATCH_SIZE: 10,
    
    // Timeout por job (ms)
    JOB_TIMEOUT: 30000, // 30 segundos
  },

  // ═══════════════════════════════════════════════════════════
  // 3. CRON JOBS
  // ═══════════════════════════════════════════════════════════
  CRON: {
    // Frequências permitidas (minutos)
    MIN_INTERVAL_MINUTES: 5, // Nunca executar com menos de 5 minutos
    
    // Limites por execução
    SYNC_TRACKING: {
      MAX_ORDERS_PER_RUN: 100, // Máximo 100 rastreamentos por execução
      INTERVAL_MINUTES: 15, // A cada 15 minutos
    },
    
    UPDATE_SEGMENTS: {
      MAX_CUSTOMERS_PER_RUN: 500, // Máximo 500 clientes por execução
      INTERVAL_MINUTES: 60, // A cada 1 hora
    },
    
    CHECK_INVENTORY: {
      MAX_PRODUCTS_PER_RUN: 1000, // Máximo 1000 produtos por execução
      INTERVAL_MINUTES: 30, // A cada 30 minutos
    },
    
    CLEANUP_OLD_CARTS: {
      MAX_ROWS_PER_RUN: 1000,
      INTERVAL_MINUTES: 1440, // A cada 24 horas
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 4. PROTEÇÃO CONTRA LOOPS
  // ═══════════════════════════════════════════════════════════
  RECURSION: {
    MAX_DEPTH: 3, // Máximo 3 níveis de recursão
    MAX_ITERATIONS: 10, // Máximo 10 iterações em loops
    TIMEOUT_MS: 5000, // 5 segundos para operações recursivas
  },

  // ═══════════════════════════════════════════════════════════
  // 5. GERAÇÃO DE ARQUIVOS (PDF, Excel, Imagens)
  // ═══════════════════════════════════════════════════════════
  FILE_GENERATION: {
    // Tamanho máximo de entrada
    MAX_INPUT_SIZE_MB: 10,
    
    // Limites por hora (por usuário)
    PDF: {
      MAX_PER_HOUR: 50, // Máximo 50 PDFs por hora por usuário
      MAX_PAGES: 100, // Máximo 100 páginas por PDF
    },
    
    EXCEL: {
      MAX_PER_HOUR: 20, // Máximo 20 planilhas por hora
      MAX_ROWS: 50000, // Máximo 50k linhas
    },
    
    IMAGE: {
      MAX_PER_HOUR: 100, // Máximo 100 imagens por hora
      MAX_DIMENSION: 4096, // Máximo 4096px por lado
    },
    
    // Cache no R2
    CACHE_TTL_HOURS: 24, // Cache por 24 horas
  },

  // ═══════════════════════════════════════════════════════════
  // 6. MODO DEGRADADO
  // ═══════════════════════════════════════════════════════════
  DEGRADED_MODE: {
    // Ativar quando:
    TRIGGERS: {
      QUEUE_SIZE: 8000, // Fila > 8000 jobs
      AVERAGE_RESPONSE_TIME_MS: 3000, // Tempo médio > 3s
      ERROR_RATE_PERCENT: 10, // Taxa de erro > 10%
      RETRY_COUNT: 500, // Mais de 500 retries em 5 minutos
    },
    
    // O que desativar no modo degradado
    DISABLE_FEATURES: [
      'reports_heavy', // Relatórios pesados
      'exports_bulk', // Exportações em massa
      'email_marketing', // Emails marketing (não transacionais)
      'analytics_complex', // Analytics complexos
    ],
    
    // O que SEMPRE manter ativo
    CRITICAL_FEATURES: [
      'auth', // Login/Logout
      'checkout', // Finalizar compra
      'stripe_webhook', // Webhooks Stripe
      'order_status', // Atualização de pedidos
      'email_transactional', // Emails transacionais
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 7. MONITORAMENTO E ALERTAS
  // ═══════════════════════════════════════════════════════════
  MONITORING: {
    // Métricas a coletar
    METRICS_INTERVAL_MS: 60000, // Coletar métricas a cada 1 minuto
    
    // Alertas
    ALERTS: {
      // Alerta quando requisições/min exceder
      REQUESTS_PER_MIN_THRESHOLD: 10000,
      
      // Alerta quando fila exceder
      QUEUE_SIZE_THRESHOLD: 5000,
      
      // Alerta quando jobs falham
      FAILED_JOBS_THRESHOLD: 100,
      
      // Alerta quando PDFs gerados excedem
      PDF_GENERATION_THRESHOLD: 500, // Por hora
      
      // Alerta quando tempo de resposta médio excede (ms)
      AVG_RESPONSE_TIME_THRESHOLD: 2000,
    },
    
    // Logs
    LOG_LEVELS: {
      RATE_LIMIT_HIT: 'warn',
      DEAD_LETTER_QUEUE: 'error',
      RECURSION_LIMIT: 'warn',
      DEGRADED_MODE_ACTIVE: 'error',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 8. DATABASE
  // ═══════════════════════════════════════════════════════════
  DATABASE: {
    // Paginação
    MAX_PAGE_SIZE: 100, // Nunca retornar mais de 100 itens por página
    DEFAULT_PAGE_SIZE: 20,
    
    // Queries
    MAX_QUERY_TIME_MS: 5000, // 5 segundos
    
    // Batch operations
    MAX_BATCH_INSERT: 1000, // Máximo 1000 inserções por batch
    MAX_BATCH_UPDATE: 500, // Máximo 500 updates por batch
  },

  // ═══════════════════════════════════════════════════════════
  // 9. STORAGE (R2)
  // ═══════════════════════════════════════════════════════════
  STORAGE: {
    // Tamanhos máximos
    MAX_UPLOAD_SIZE_MB: 10, // Upload máximo 10MB
    MAX_IMAGE_SIZE_MB: 5, // Imagem máxima 5MB
    
    // Limites de operações
    MAX_UPLOADS_PER_HOUR: 1000, // Máximo 1000 uploads por hora
    
    // Cleanup automático
    TEMP_FILE_TTL_HOURS: 24, // Deletar arquivos temporários após 24h
    OLD_BACKUP_DAYS: 30, // Manter backups por 30 dias
  },

  // ═══════════════════════════════════════════════════════════
  // 10. API EXTERNAS (Stripe, CTT, etc)
  // ═══════════════════════════════════════════════════════════
  EXTERNAL_API: {
    // Timeout
    TIMEOUT_MS: 10000, // 10 segundos
    
    // Retry
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
    
    // Rate limiting (para não saturar APIs externas)
    STRIPE_MAX_PER_SECOND: 10,
    CTT_TRACKING_MAX_PER_MINUTE: 60,
  },
} as const;

/**
 * CUSTOS ESTIMADOS POR OPERAÇÃO
 * 
 * Use para calcular impacto de mudanças nos limites
 */
export const COST_ESTIMATES = {
  // Cloudflare Workers
  WORKER_REQUEST: 0.00000015, // €0.15 por 1M requests após free tier
  
  // D1 Database
  D1_READ: 0.000001, // €0.001 por 1M reads após free tier
  D1_WRITE: 0.000001, // €0.001 por 1M writes após free tier
  
  // R2 Storage
  R2_STORAGE_GB_MONTH: 0.015, // €0.015 por GB/mês após free tier
  R2_OPERATION: 0.0000036, // €0.0036 por 1M ops após free tier
  
  // Queue
  QUEUE_OPERATION: 0.0000004, // €0.0004 por 1M ops
  
  // Cron Trigger
  CRON_EXECUTION: 0, // Grátis (usa Workers requests)
} as const;

/**
 * COMO AJUSTAR OS LIMITES
 * 
 * 1. Aumente RATE_LIMIT se tiver tráfego legítimo bloqueado
 * 2. Reduza MAX_QUEUE_SIZE se quiser gastar menos em retries
 * 3. Aumente CRON intervalos para reduzir custo (menos execuções)
 * 4. Reduza MAX_JOBS_PER_MINUTE para processar mais devagar (menor pico de custo)
 * 5. Ajuste DEGRADED_MODE.TRIGGERS para ativar proteção mais cedo/tarde
 */

/**
 * ESTIMATIVA DE CUSTO MENSAL
 * 
 * Baseado nos limites acima, para 1.000 pedidos/mês:
 * 
 * - Workers: ~50K requests/mês = GRÁTIS (dentro do free tier de 100K/dia)
 * - D1: ~500K reads + 50K writes/mês = GRÁTIS (dentro do free tier)
 * - R2: ~2GB storage + 10K ops/mês = GRÁTIS (dentro do free tier)
 * - Queue: ~5K operations/mês = GRÁTIS ou ~€0.002
 * - Cron: Incluído no Workers = GRÁTIS
 * 
 * TOTAL INFRAESTRUTURA: €0 até ~3.000 pedidos/mês
 * 
 * Após free tier (3.000+ pedidos/mês):
 * - Workers: ~€0.03/dia = €0.90/mês
 * - D1: ~€0.01/mês
 * - R2: ~€0.03/mês
 * - TOTAL: ~€1/mês + Stripe (1,5% + €0.25/transação)
 */


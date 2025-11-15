import { LIMITS } from '../config/limits';

/**
 * GERENCIADOR DE FILAS COM LIMITES
 * 
 * - Retry com backoff exponencial
 * - Dead Letter Queue (DLQ)
 * - Limites de processamento
 * - Proteção contra sobrecarga
 */

interface QueueJob<T = any> {
  id: string;
  type: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  scheduledFor?: number;
  lastError?: string;
}

interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  dlq: number;
}

export class QueueManager {
  private queue: Queue;
  private dlq: Queue; // Dead Letter Queue
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    dlq: 0,
  };
  private processing: Set<string> = new Set();
  private lastMinuteCount: number = 0;
  private lastMinuteReset: number = Date.now();

  constructor(queue: Queue, dlq: Queue) {
    this.queue = queue;
    this.dlq = dlq;
  }

  /**
   * Adiciona job à fila
   */
  async enqueue<T>(type: string, payload: T, options?: {
    delay?: number; // Delay em ms
    maxAttempts?: number;
  }): Promise<string> {
    // Verificar tamanho da fila
    if (this.stats.pending >= LIMITS.QUEUE.MAX_QUEUE_SIZE) {
      console.error('[QUEUE] Queue size limit reached:', this.stats.pending);
      throw new Error(`Queue size limit (${LIMITS.QUEUE.MAX_QUEUE_SIZE}) exceeded`);
    }

    const job: QueueJob<T> = {
      id: crypto.randomUUID(),
      type,
      payload,
      attempts: 0,
      maxAttempts: options?.maxAttempts || LIMITS.QUEUE.MAX_RETRIES,
      createdAt: Date.now(),
      scheduledFor: options?.delay ? Date.now() + options.delay : undefined,
    };

    await this.queue.send(job, {
      delaySeconds: options?.delay ? Math.floor(options.delay / 1000) : undefined,
    });

    this.stats.pending++;
    console.log(`[QUEUE] Job enqueued: ${job.id} (${type})`);

    return job.id;
  }

  /**
   * Processa job da fila
   */
  async process(
    handler: (type: string, payload: any) => Promise<void>
  ): Promise<void> {
    // Verificar limite de processamento por minuto
    const now = Date.now();
    if (now - this.lastMinuteReset >= 60000) {
      // Resetar contador a cada minuto
      this.lastMinuteCount = 0;
      this.lastMinuteReset = now;
    }

    if (this.lastMinuteCount >= LIMITS.QUEUE.MAX_JOBS_PER_MINUTE) {
      console.warn('[QUEUE] Rate limit reached, skipping processing');
      return;
    }

    // Buscar próximo batch
    const batch = await this.queue.batch({
      max: LIMITS.QUEUE.BATCH_SIZE,
    });

    for (const message of batch.messages) {
      const job = message.body as QueueJob;

      // Verificar se já está processando (deduplicação)
      if (this.processing.has(job.id)) {
        continue;
      }

      this.processing.add(job.id);
      this.stats.processing++;
      this.lastMinuteCount++;

      try {
        // Timeout no processamento
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Job timeout')), LIMITS.QUEUE.JOB_TIMEOUT)
        );

        await Promise.race([
          handler(job.type, job.payload),
          timeoutPromise,
        ]);

        // Sucesso
        message.ack();
        this.stats.completed++;
        this.stats.processing--;
        this.stats.pending--;
        this.processing.delete(job.id);

        console.log(`[QUEUE] Job completed: ${job.id}`);

      } catch (error: any) {
        job.attempts++;
        job.lastError = error.message || 'Unknown error';

        console.error(`[QUEUE] Job failed (attempt ${job.attempts}/${job.maxAttempts}):`, job.id, error);

        this.stats.processing--;
        this.processing.delete(job.id);

        if (job.attempts >= job.maxAttempts) {
          // Enviar para Dead Letter Queue
          await this.sendToDLQ(job, error);
          message.ack(); // Remove da fila principal
          this.stats.pending--;
          this.stats.failed++;
          this.stats.dlq++;

          console.error(`[QUEUE] Job sent to DLQ: ${job.id}`);
        } else {
          // Retry com backoff exponencial
          const delay = this.calculateBackoff(job.attempts);
          
          await this.queue.send(job, {
            delaySeconds: Math.floor(delay / 1000),
          });

          message.ack(); // Remove da fila para re-adicionar com delay
          console.log(`[QUEUE] Job retry scheduled: ${job.id} (delay: ${delay}ms)`);
        }
      }
    }
  }

  /**
   * Calcula delay de retry com backoff exponencial + jitter
   */
  private calculateBackoff(attempt: number): number {
    const delays = LIMITS.QUEUE.RETRY_DELAYS;
    const baseDelay = delays[Math.min(attempt - 1, delays.length - 1)];
    
    // Adicionar jitter (±20%)
    const jitter = baseDelay * 0.2 * (Math.random() - 0.5) * 2;
    
    return Math.max(1000, baseDelay + jitter);
  }

  /**
   * Envia job para Dead Letter Queue
   */
  private async sendToDLQ(job: QueueJob, error: Error): Promise<void> {
    const dlqEntry = {
      ...job,
      failedAt: Date.now(),
      finalError: error.message,
      stack: error.stack,
    };

    await this.dlq.send(dlqEntry);

    // TODO: Notificar admin sobre job na DLQ
    console.error('[QUEUE] DLQ notification:', {
      jobId: job.id,
      type: job.type,
      attempts: job.attempts,
      error: error.message,
    });
  }

  /**
   * Retorna estatísticas da fila
   */
  async getStats(): Promise<QueueStats> {
    // Atualizar stats em tempo real se possível
    // (CloudFlare Queues não tem API de stats direto, então usamos contadores internos)
    return { ...this.stats };
  }

  /**
   * Reprocessa job da DLQ
   */
  async retryFromDLQ(jobId: string): Promise<void> {
    // Buscar job na DLQ e recolocar na fila principal
    // Implementação depende de como a DLQ é estruturada
    console.log(`[QUEUE] Retrying job from DLQ: ${jobId}`);
  }
}

/**
 * Exemplo de uso:
 * 
 * ```typescript
 * const queueManager = new QueueManager(env.MY_QUEUE, env.MY_DLQ);
 * 
 * // Adicionar job
 * await queueManager.enqueue('send_email', {
 *   to: 'user@example.com',
 *   subject: 'Welcome',
 * });
 * 
 * // Processar jobs (em consumer worker)
 * await queueManager.process(async (type, payload) => {
 *   if (type === 'send_email') {
 *     await sendEmail(payload);
 *   }
 * });
 * 
 * // Ver estatísticas
 * const stats = await queueManager.getStats();
 * console.log(stats);
 * ```
 */

/**
 * TIPOS DE JOBS SUGERIDOS
 */
export enum JobType {
  SEND_EMAIL = 'send_email',
  GENERATE_PDF = 'generate_pdf',
  SYNC_TRACKING = 'sync_tracking',
  UPDATE_INVENTORY = 'update_inventory',
  PROCESS_REFUND = 'process_refund',
  UPDATE_SEGMENTS = 'update_segments',
  CLEANUP_OLD_DATA = 'cleanup_old_data',
}


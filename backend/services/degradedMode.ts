import { LIMITS } from '../config/limits';

/**
 * MODO DEGRADADO (DEGRADED MODE)
 * 
 * Desativa funcionalidades não críticas quando o sistema está sob carga
 */

interface SystemMetrics {
  queueSize: number;
  averageResponseTimeMs: number;
  errorRatePercent: number;
  retryCount: number;
}

interface DegradedModeStatus {
  active: boolean;
  triggers: string[];
  disabledFeatures: string[];
  timestamp: number;
}

export class DegradedModeManager {
  private status: DegradedModeStatus = {
    active: false,
    triggers: [],
    disabledFeatures: [],
    timestamp: 0,
  };

  /**
   * Verifica se deve ativar modo degradado
   */
  checkAndUpdate(metrics: SystemMetrics): DegradedModeStatus {
    const triggers: string[] = [];

    // Verificar triggers
    if (metrics.queueSize > LIMITS.DEGRADED_MODE.TRIGGERS.QUEUE_SIZE) {
      triggers.push(`Queue size: ${metrics.queueSize} > ${LIMITS.DEGRADED_MODE.TRIGGERS.QUEUE_SIZE}`);
    }

    if (metrics.averageResponseTimeMs > LIMITS.DEGRADED_MODE.TRIGGERS.AVERAGE_RESPONSE_TIME_MS) {
      triggers.push(`Response time: ${metrics.averageResponseTimeMs}ms > ${LIMITS.DEGRADED_MODE.TRIGGERS.AVERAGE_RESPONSE_TIME_MS}ms`);
    }

    if (metrics.errorRatePercent > LIMITS.DEGRADED_MODE.TRIGGERS.ERROR_RATE_PERCENT) {
      triggers.push(`Error rate: ${metrics.errorRatePercent}% > ${LIMITS.DEGRADED_MODE.TRIGGERS.ERROR_RATE_PERCENT}%`);
    }

    if (metrics.retryCount > LIMITS.DEGRADED_MODE.TRIGGERS.RETRY_COUNT) {
      triggers.push(`Retry count: ${metrics.retryCount} > ${LIMITS.DEGRADED_MODE.TRIGGERS.RETRY_COUNT}`);
    }

    // Atualizar status
    const shouldActivate = triggers.length > 0;

    if (shouldActivate && !this.status.active) {
      // Ativar modo degradado
      console.error('[DEGRADED_MODE] ACTIVATING - Triggers:', triggers);
      this.status = {
        active: true,
        triggers,
        disabledFeatures: [...LIMITS.DEGRADED_MODE.DISABLE_FEATURES],
        timestamp: Date.now(),
      };
      
      // TODO: Notificar admin (email, webhook, etc)
      this.notifyAdmin('activated', triggers);
      
    } else if (!shouldActivate && this.status.active) {
      // Desativar modo degradado
      console.log('[DEGRADED_MODE] DEACTIVATING - System recovered');
      this.status = {
        active: false,
        triggers: [],
        disabledFeatures: [],
        timestamp: Date.now(),
      };
      
      this.notifyAdmin('deactivated', []);
    }

    return this.status;
  }

  /**
   * Verifica se uma feature está ativa
   */
  isFeatureEnabled(feature: string): boolean {
    if (!this.status.active) {
      return true; // Modo normal, tudo ativo
    }

    // Verificar se está na lista de desabilitados
    if (this.status.disabledFeatures.includes(feature)) {
      console.warn(`[DEGRADED_MODE] Feature '${feature}' is disabled due to degraded mode`);
      return false;
    }

    // Verificar se está na lista de críticos (sempre ativo)
    if ((LIMITS.DEGRADED_MODE.CRITICAL_FEATURES as readonly string[]).includes(feature)) {
      return true;
    }

    // Por padrão, desabilitar features não listadas
    return false;
  }

  /**
   * Retorna status atual
   */
  getStatus(): DegradedModeStatus {
    return { ...this.status };
  }

  /**
   * Força ativação/desativação (para testes ou controle manual)
   */
  forceSet(active: boolean, reason: string = 'Manual override') {
    if (active) {
      this.status = {
        active: true,
        triggers: [reason],
        disabledFeatures: [...LIMITS.DEGRADED_MODE.DISABLE_FEATURES],
        timestamp: Date.now(),
      };
      console.warn('[DEGRADED_MODE] Manually activated:', reason);
    } else {
      this.status = {
        active: false,
        triggers: [],
        disabledFeatures: [],
        timestamp: Date.now(),
      };
      console.log('[DEGRADED_MODE] Manually deactivated');
    }
  }

  /**
   * Notifica admin sobre mudança de status
   */
  private async notifyAdmin(action: 'activated' | 'deactivated', triggers: string[]) {
    // TODO: Implementar notificação real
    console.log(`[DEGRADED_MODE] Admin notification: ${action}`, { triggers });
    
    // Exemplo:
    // - Enviar email para admin
    // - Webhook para Slack/Discord
    // - Atualizar flag no dashboard
    // - Enviar métrica para Sentry/DataDog
  }
}

// Singleton global
let degradedModeManager: DegradedModeManager | null = null;

export function getDegradedModeManager(): DegradedModeManager {
  if (!degradedModeManager) {
    degradedModeManager = new DegradedModeManager();
  }
  return degradedModeManager;
}

/**
 * Middleware para verificar se feature está ativa
 */
export function checkFeatureEnabled(feature: string): Response | null {
  const manager = getDegradedModeManager();
  
  if (!manager.isFeatureEnabled(feature)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable',
        message: 'This feature is temporarily disabled due to high system load. Please try again later.',
        degradedMode: true,
      }),
      {
        status: 503, // Service Unavailable
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '300', // 5 minutos
        },
      }
    );
  }

  return null; // Feature ativa
}

/**
 * Exemplo de uso:
 * 
 * ```typescript
 * // No router ou handler
 * if (path === '/api/admin/reports/heavy') {
 *   const check = checkFeatureEnabled('reports_heavy');
 *   if (check) return check;
 *   
 *   // Processar relatório...
 * }
 * 
 * // Atualizar métricas periodicamente (cron)
 * const manager = getDegradedModeManager();
 * const metrics = {
 *   queueSize: await getQueueSize(),
 *   averageResponseTimeMs: await getAvgResponseTime(),
 *   errorRatePercent: await getErrorRate(),
 *   retryCount: await getRetryCount(),
 * };
 * manager.checkAndUpdate(metrics);
 * ```
 */


import { LIMITS } from '../config/limits';

/**
 * PROTEÇÃO CONTRA LOOPS E RECURSÃO INFINITA
 * 
 * Implementa contador de profundidade e timeout
 */

const RECURSION_HEADER = 'X-Internal-Hop-Count';
const RECURSION_START_HEADER = 'X-Recursion-Start-Time';

export class RecursionGuard {
  private depth: number;
  private startTime: number;
  private maxDepth: number;
  private timeoutMs: number;

  constructor(request: Request) {
    // Ler profundidade do header
    const hopCount = request.headers.get(RECURSION_HEADER);
    this.depth = hopCount ? parseInt(hopCount, 10) : 0;
    
    // Ler tempo de início
    const startTime = request.headers.get(RECURSION_START_HEADER);
    this.startTime = startTime ? parseInt(startTime, 10) : Date.now();
    
    this.maxDepth = LIMITS.RECURSION.MAX_DEPTH;
    this.timeoutMs = LIMITS.RECURSION.TIMEOUT_MS;
  }

  /**
   * Verifica se pode prosseguir
   */
  canProceed(): { allowed: boolean; reason?: string } {
    // Verificar profundidade
    if (this.depth >= this.maxDepth) {
      console.warn(`[RECURSION_GUARD] Max depth reached: ${this.depth}`);
      return {
        allowed: false,
        reason: `Maximum recursion depth (${this.maxDepth}) exceeded`,
      };
    }

    // Verificar timeout
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.timeoutMs) {
      console.warn(`[RECURSION_GUARD] Timeout reached: ${elapsed}ms`);
      return {
        allowed: false,
        reason: `Recursion timeout (${this.timeoutMs}ms) exceeded`,
      };
    }

    return { allowed: true };
  }

  /**
   * Incrementa o contador e retorna novos headers para próxima chamada
   */
  getNextHeaders(): Record<string, string> {
    return {
      [RECURSION_HEADER]: (this.depth + 1).toString(),
      [RECURSION_START_HEADER]: this.startTime.toString(),
    };
  }

  /**
   * Reseta o contador (para novas requisições independentes)
   */
  static resetHeaders(): Record<string, string> {
    return {
      [RECURSION_HEADER]: '0',
      [RECURSION_START_HEADER]: Date.now().toString(),
    };
  }
}

/**
 * Loop guard para iterações
 */
export class LoopGuard {
  private iterations: number = 0;
  private maxIterations: number;
  private startTime: number;
  private timeoutMs: number;

  constructor(
    maxIterations: number = LIMITS.RECURSION.MAX_ITERATIONS,
    timeoutMs: number = LIMITS.RECURSION.TIMEOUT_MS
  ) {
    this.maxIterations = maxIterations;
    this.timeoutMs = timeoutMs;
    this.startTime = Date.now();
  }

  /**
   * Registra uma iteração e verifica limites
   */
  tick(): { allowed: boolean; reason?: string } {
    this.iterations++;

    // Verificar número de iterações
    if (this.iterations > this.maxIterations) {
      console.warn(`[LOOP_GUARD] Max iterations reached: ${this.iterations}`);
      return {
        allowed: false,
        reason: `Maximum iterations (${this.maxIterations}) exceeded`,
      };
    }

    // Verificar timeout
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.timeoutMs) {
      console.warn(`[LOOP_GUARD] Timeout reached: ${elapsed}ms after ${this.iterations} iterations`);
      return {
        allowed: false,
        reason: `Loop timeout (${this.timeoutMs}ms) exceeded`,
      };
    }

    return { allowed: true };
  }

  /**
   * Retorna estatísticas do loop
   */
  getStats() {
    return {
      iterations: this.iterations,
      elapsed: Date.now() - this.startTime,
      maxIterations: this.maxIterations,
      timeoutMs: this.timeoutMs,
    };
  }
}

/**
 * Middleware de proteção contra recursão
 */
export function recursionGuardMiddleware(request: Request): Response | null {
  const guard = new RecursionGuard(request);
  const check = guard.canProceed();

  if (!check.allowed) {
    console.error('[RECURSION_GUARD] Request blocked:', check.reason);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Recursion limit exceeded',
        message: check.reason,
      }),
      {
        status: 508, // Loop Detected
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Anexar guard ao request para uso posterior
  (request as any).__recursionGuard = guard;

  return null; // Permitir requisição
}

/**
 * Exemplo de uso em loops:
 * 
 * ```typescript
 * const loopGuard = new LoopGuard(100, 5000);
 * 
 * for (const item of items) {
 *   const check = loopGuard.tick();
 *   if (!check.allowed) {
 *     throw new Error(check.reason);
 *   }
 *   
 *   // Processar item...
 * }
 * 
 * console.log('Loop completed:', loopGuard.getStats());
 * ```
 */


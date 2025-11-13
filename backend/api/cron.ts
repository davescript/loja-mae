import type { Env } from '../types';
import { getDb } from '../utils/db';
import {
  getAbandonedCarts,
  markCartAsAbandoned,
  getCartItems,
} from '../modules/carts';
import { sendAbandonedCartEmail } from '../services/email';

/**
 * CRON Job handler
 * Executado a cada 30 minutos para:
 * 1. Detectar carrinhos abandonados (não atualizados há mais de 1 hora)
 * 2. Marcar como abandonados
 * 3. Enviar emails de recuperação
 */
export async function handleCron(env: Env): Promise<void> {
  try {
    console.log('[CRON] Starting cart abandonment check...');
    const db = getDb(env);

    // 1. Buscar carrinhos abandonados (não atualizados há mais de 1 hora)
    const abandonedCarts = await getAbandonedCarts(db, 1); // 1 hora
    console.log(`[CRON] Found ${abandonedCarts.length} abandoned carts`);

    let marked = 0;
    let emailsSent = 0;
    let emailsFailed = 0;

    for (const cart of abandonedCarts) {
      try {
        // 2. Marcar como abandonado
        await markCartAsAbandoned(db, cart.id);
        marked++;

        // 3. Enviar email de recuperação (se tiver email)
        if (cart.email) {
          const items = await getCartItems(db, cart.id);
          
          if (items.length > 0) {
            const success = await sendAbandonedCartEmail(env, cart, items);
            
            if (success) {
              emailsSent++;
              console.log(`[CRON] Email sent for cart ${cart.id}`);
            } else {
              emailsFailed++;
              console.error(`[CRON] Failed to send email for cart ${cart.id}`);
            }
          }
        } else {
          console.log(`[CRON] Cart ${cart.id} has no email, skipping email send`);
        }
      } catch (error) {
        console.error(`[CRON] Error processing cart ${cart.id}:`, error);
        emailsFailed++;
      }
    }

    console.log(`[CRON] Completed: ${marked} carts marked, ${emailsSent} emails sent, ${emailsFailed} failed`);
  } catch (error) {
    console.error('[CRON] Error in cart abandonment cron:', error);
  }
}


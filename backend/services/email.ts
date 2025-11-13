import type { Env } from '../types';
import { sendEmail } from '../utils/email';
import type { Cart, CartItem } from '../modules/carts';
import {
  createAbandonmentLog,
  markEmailAsSent,
} from '../modules/carts';
import { getDb } from '../utils/db';

/**
 * Gera link de recuperação do carrinho
 */
function generateRecoveryLink(cartId: string, baseUrl: string = 'https://www.leiasabores.pt'): string {
  return `${baseUrl}/checkout?cart_id=${cartId}`;
}

/**
 * Gera HTML do email de recuperação
 */
function generateAbandonedCartEmailHTML(
  cart: Cart,
  items: CartItem[],
  recoveryLink: string
): string {
  const total = (cart.total_cents / 100).toFixed(2);
  const customerName = cart.email?.split('@')[0] || 'Cliente';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Você deixou itens no seu carrinho</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Loja Mãe</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Você deixou itens no seu carrinho ✨</h2>
    <p>Olá ${customerName},</p>
    <p>Percebemos que você deixou alguns itens no seu carrinho. Não perca a oportunidade de finalizar sua compra!</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">Itens no seu carrinho:</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Produto</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qtd</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Preço</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
              ${item.image_url ? `<img src="${item.image_url}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;">` : ''}
              ${item.product_name}
            </td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">€${((item.price_cents * item.quantity) / 100).toFixed(2)}</td>
          </tr>
          `
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">€${total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${recoveryLink}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
        ➡️ Finalizar Compra Agora
      </a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Este link é válido por tempo limitado. Não perca esta oportunidade!
    </p>
    
    <p style="margin-top: 20px; font-size: 12px; color: #999;">
      Se você não solicitou este email, pode ignorá-lo com segurança.
    </p>
    
    <p style="margin-top: 30px; font-size: 12px; color: #666;">
      Obrigado por comprar na Loja Mãe! 🎉
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envia email de recuperação de carrinho abandonado
 */
export async function sendAbandonedCartEmail(
  env: Env,
  cart: Cart,
  items: CartItem[]
): Promise<boolean> {
  if (!cart.email) {
    console.error('Cart has no email address');
    return false;
  }

  if (items.length === 0) {
    console.error('Cart has no items');
    return false;
  }

  const db = getDb(env);
  const baseUrl = env.ENVIRONMENT === 'production' 
    ? 'https://www.leiasabores.pt'
    : 'http://localhost:5173';
  const recoveryLink = generateRecoveryLink(cart.id, baseUrl);

  // Criar log de abandono
  const logId = await createAbandonmentLog(db, cart.id, cart.email, recoveryLink);

  // Gerar HTML do email
  const html = generateAbandonedCartEmailHTML(cart, items, recoveryLink);

  // Enviar email
  const success = await sendEmail(env, {
    to: cart.email,
    subject: 'Você deixou itens no seu carrinho na Loja-Mãe ✨',
    html,
  });

  if (success) {
    // Marcar email como enviado
    await markEmailAsSent(db, logId);
    return true;
  }

  return false;
}


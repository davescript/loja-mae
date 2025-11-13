import type { Env } from '../types';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Send email using Cloudflare MailChannels (free, no API key needed)
 * Works with Cloudflare Workers and requires DKIM setup
 */
export async function sendEmail(env: Env, options: EmailOptions): Promise<boolean> {
  try {
    const fromEmail = options.from || env.FROM_EMAIL || 'noreply@leiasabores.pt';
    const fromName = env.FROM_NAME || 'Loja Mãe';

    // MailChannels API endpoint
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to, name: options.to.split('@')[0] }],
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: options.subject,
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
          ...(options.text
            ? [
                {
                  type: 'text/plain',
                  value: options.text,
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email send failed:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate order confirmation email HTML
 */
export function generateOrderConfirmationEmail(order: {
  order_number: string;
  total_cents: number;
  items: Array<{
    title: string;
    quantity: number;
    price_cents: number;
  }>;
  customer_name?: string;
  shipping_address?: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
}): string {
  const total = (order.total_cents / 100).toFixed(2);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Pedido</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Loja Mãe</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Pedido Confirmado!</h2>
    <p>Olá ${order.customer_name || 'Cliente'},</p>
    <p>Obrigado pela sua compra! Seu pedido foi confirmado e está sendo processado.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">Pedido #${order.order_number}</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Produto</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qtd</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Preço</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
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
    
    ${order.shipping_address
      ? `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">Endereço de Entrega</h3>
      <p style="margin: 5px 0;">${order.shipping_address.street}</p>
      <p style="margin: 5px 0;">${order.shipping_address.postal_code} ${order.shipping_address.city}</p>
      <p style="margin: 5px 0;">${order.shipping_address.country}</p>
    </div>
    `
      : ''}
    
    <p style="margin-top: 30px;">Você receberá uma atualização quando seu pedido for enviado.</p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://www.leiasabores.pt/orders" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Ver Meus Pedidos
      </a>
    </div>
    
    <p style="margin-top: 30px; font-size: 12px; color: #666;">
      Se você tiver alguma dúvida, entre em contato conosco através do nosso site.
    </p>
  </div>
</body>
</html>
  `.trim();
}


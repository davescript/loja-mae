import type { Env } from '../types';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Cloudflare MailChannels (free, no API key needed)
 * Works with Cloudflare Workers and requires DKIM setup
 * 
 * IMPORTANT: MailChannels only works when:
 * 1. The request comes from a Cloudflare Worker
 * 2. The "from" email is from a workers.dev domain OR a verified domain
 */
export async function sendEmail(env: Env, options: EmailOptions): Promise<boolean> {
  try {
    const workerName = env.WORKER_NAME || 'loja-mae-api';
    const workerSubdomain = env.WORKERS_SUBDOMAIN || 'davecdl';
    const fallbackFrom = `noreply@${workerName}.${workerSubdomain}.workers.dev`;

    // MailChannels requer que o email "from" seja de um domínio workers.dev
    // ou de um domínio verificado.
    let fromEmail = options.from || env.FROM_EMAIL || fallbackFrom;

    if (!fromEmail.endsWith('.workers.dev') && !env.FROM_EMAIL) {
      console.warn('[EMAIL] FROM_EMAIL não é de workers.dev e env.FROM_EMAIL não está configurado. Usando fallback workers.dev.');
      fromEmail = fallbackFrom;
    }

    const fromName = env.FROM_NAME || 'Leiasabores';

    console.log('[EMAIL] Attempting to send email:', {
      to: options.to,
      from: fromEmail,
      fromName,
      subject: options.subject,
      workerName,
    });

    // Preparar payload conforme especificação MailChannels
    const personalization: Record<string, any> = {
      to: [
        {
          email: options.to,
          name: options.to.split('@')[0] || 'Cliente',
        },
      ],
    };

    if (options.replyTo) {
      personalization.headers = {
        'Reply-To': options.replyTo,
      };
    }

    const payload = {
      personalizations: [personalization],
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
    };

    console.log('[EMAIL] Payload prepared:', {
      from: payload.from,
      to: payload.personalizations[0].to[0].email,
      subject: payload.subject,
      hasHtml: !!payload.content.find((c) => c.type === 'text/html'),
      hasText: !!payload.content.find((c) => c.type === 'text/plain'),
    });

    // MailChannels API endpoint
    // IMPORTANTE: Esta requisição DEVE vir de um Cloudflare Worker
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[EMAIL] Send failed:', {
        status: response.status,
        statusText: response.statusText,
        error: responseText,
        to: options.to,
        from: fromEmail,
        payload: JSON.stringify(payload, null, 2),
      });

      // Tentar parsear erro se for JSON
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = JSON.stringify(errorJson, null, 2);
      } catch {
        // Não é JSON, usar texto direto
      }

      console.error('[EMAIL] Error details:', errorDetails);
      return false;
    }

    console.log('[EMAIL] ✅ Email sent successfully to:', options.to);
    console.log('[EMAIL] Response:', responseText);
    return true;
  } catch (error) {
    console.error('[EMAIL] Exception sending email:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      to: options.to,
      errorType: error?.constructor?.name,
    });
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
    image_url?: string | null;
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
  const customerFirstName = order.customer_name?.split(' ')[0] || 'Cliente';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido Confirmado #${order.order_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #4a5568; margin: 0; padding: 0; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); }
    .header { background-color: #ffffff; padding: 40px 0 20px; text-align: center; border-bottom: 1px solid #f3f4f6; }
    .brand { color: #D2691E; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; }
    .hero { padding: 40px 30px; text-align: center; background: linear-gradient(180deg, #fffbf7 0%, #ffffff 100%); }
    .icon-circle { width: 64px; height: 64px; background-color: #D2691E; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(210, 105, 30, 0.3); }
    .check-icon { color: white; font-size: 32px; line-height: 1; }
    .hero h2 { margin: 0 0 10px; color: #1a202c; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .hero p { margin: 0; color: #718096; font-size: 16px; }
    .content { padding: 0 40px 40px; }
    .receipt-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px; }
    .receipt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #cbd5e0; }
    .receipt-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #718096; font-weight: 600; }
    .receipt-value { font-size: 14px; font-weight: 700; color: #2d3748; }
    .item { display: flex; margin-bottom: 15px; align-items: center; }
    .item-image { width: 48px; height: 48px; border-radius: 8px; background-color: #edf2f7; margin-right: 15px; object-fit: cover; }
    .item-details { flex: 1; }
    .item-title { font-size: 14px; font-weight: 600; color: #2d3748; margin-bottom: 2px; display: block; }
    .item-meta { font-size: 12px; color: #718096; }
    .item-price { font-size: 14px; font-weight: 600; color: #2d3748; }
    .total-section { border-top: 1px dashed #cbd5e0; margin-top: 20px; padding-top: 20px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #718096; }
    .row.total { font-size: 18px; font-weight: 800; color: #1a202c; margin-top: 10px; margin-bottom: 0; }
    .shipping-info { background-color: #fffbf7; border: 1px solid #fae6cc; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
    .shipping-title { font-size: 14px; font-weight: 700; color: #9c4221; margin-bottom: 8px; display: flex; align-items: center; }
    .shipping-address { font-size: 14px; color: #5c3a2e; line-height: 1.5; }
    .btn { display: block; width: 100%; background-color: #1a202c; color: #ffffff; text-align: center; padding: 18px 0; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .btn:hover { background-color: #000000; transform: translateY(-1px); box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15); }
    .footer { text-align: center; padding: 30px 40px; color: #a0aec0; font-size: 12px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }
    .footer p { margin: 5px 0; }
    .social-links { margin-top: 15px; }
    .social-link { color: #cbd5e0; text-decoration: none; margin: 0 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Loja Mãe</div>
    </div>
    
    <div class="hero">
      <div class="icon-circle">
        <span class="check-icon">✓</span>
      </div>
      <h2>Obrigado, ${customerFirstName}!</h2>
      <p>Seu pedido foi confirmado com sucesso.</p>
    </div>
    
    <div class="content">
      <div class="receipt-card">
        <div class="receipt-header">
          <div>
            <div class="receipt-label">Pedido</div>
            <div class="receipt-value">#${order.order_number}</div>
          </div>
          <div style="text-align: right;">
            <div class="receipt-label">Data</div>
            <div class="receipt-value">${new Date().toLocaleDateString('pt-PT')}</div>
          </div>
        </div>
        
        ${order.items.map(item => `
        <div class="item">
          ${item.image_url
      ? `<img src="${item.image_url}" class="item-image" alt="${item.title}">`
      : `<div class="item-image" style="display: flex; align-items: center; justify-content: center; color: #cbd5e0; font-size: 20px;">🧁</div>`
    }
          <div class="item-details">
            <span class="item-title">${item.title}</span>
            <span class="item-meta">Qtd: ${item.quantity}</span>
          </div>
          <span class="item-price">€${((item.price_cents * item.quantity) / 100).toFixed(2)}</span>
        </div>
        `).join('')}
        
        <div class="total-section">
          <div class="row">
            <span>Subtotal</span>
            <span>€${total}</span>
          </div>
          <div class="row">
            <span>Entrega</span>
            <span>Grátis</span>
          </div>
          <div class="row total">
            <span>Total</span>
            <span>€${total}</span>
          </div>
        </div>
      </div>
      
      ${order.shipping_address ? `
      <div class="shipping-info">
        <div class="shipping-title">📍 Endereço de Entrega</div>
        <div class="shipping-address">
          ${order.shipping_address.street}<br>
          ${order.shipping_address.postal_code} ${order.shipping_address.city}<br>
          ${order.shipping_address.country}
        </div>
      </div>
      ` : ''}
      
      <a href="https://www.leiasabores.pt/account/orders/${order.order_number}" class="btn">Acompanhar Meu Pedido</a>
    </div>
    
    <div class="footer">
      <p>Precisa de ajuda? Responda a este email.</p>
      <p>Loja Mãe &bull; Acessórios para Confeitaria</p>
      <div class="social-links">
        <a href="#" class="social-link">Instagram</a>
        <a href="#" class="social-link">Facebook</a>
        <a href="#" class="social-link">WhatsApp</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

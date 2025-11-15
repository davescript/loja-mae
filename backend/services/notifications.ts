import { sendEmail } from '../utils/email';

export interface NotificationTemplates {
  orderConfirmation: (data: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalCents: number;
    items: Array<{ title: string; quantity: number; price_cents: number }>;
  }) => { subject: string; html: string };
  
  orderShipped: (data: {
    orderNumber: string;
    customerName: string;
    trackingNumber: string;
    carrier: string;
    estimatedDelivery?: string;
  }) => { subject: string; html: string };
  
  orderDelivered: (data: {
    orderNumber: string;
    customerName: string;
  }) => { subject: string; html: string };
  
  lowStock: (data: {
    productTitle: string;
    currentStock: number;
    threshold: number;
  }) => { subject: string; html: string };
}

export const notificationTemplates: NotificationTemplates = {
  orderConfirmation: (data) => ({
    subject: `Pedido Confirmado #${data.orderNumber} - Loja Mãe`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B4513;">Pedido Confirmado!</h1>
        <p>Olá ${data.customerName},</p>
        <p>Seu pedido <strong>#${data.orderNumber}</strong> foi confirmado com sucesso!</p>
        
        <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Itens do Pedido:</h3>
          <ul style="list-style: none; padding: 0;">
            ${data.items.map(item => `
              <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <strong>${item.title}</strong><br/>
                Quantidade: ${item.quantity} × €${(item.price_cents / 100).toFixed(2)}
              </li>
            `).join('')}
          </ul>
          <p style="font-size: 18px; font-weight: bold; margin-top: 20px;">
            Total: €${(data.totalCents / 100).toFixed(2)}
          </p>
        </div>
        
        <p>Você receberá atualizações sobre o status do seu pedido.</p>
        <p>Obrigado por comprar na Loja Mãe!</p>
      </div>
    `,
  }),

  orderShipped: (data) => ({
    subject: `Pedido Enviado #${data.orderNumber} - Loja Mãe`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B4513;">Pedido Enviado! 📦</h1>
        <p>Olá ${data.customerName},</p>
        <p>Ótimas notícias! Seu pedido <strong>#${data.orderNumber}</strong> foi enviado.</p>
        
        <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4169E1;">
          <h3>Informações de Rastreamento:</h3>
          <p><strong>Transportadora:</strong> ${data.carrier}</p>
          <p><strong>Código de Rastreio:</strong> ${data.trackingNumber}</p>
          ${data.estimatedDelivery ? `<p><strong>Previsão de Entrega:</strong> ${new Date(data.estimatedDelivery).toLocaleDateString('pt-PT')}</p>` : ''}
        </div>
        
        <p>Acompanhe seu pedido usando o código de rastreamento acima.</p>
        <p>Equipe Loja Mãe</p>
      </div>
    `,
  }),

  orderDelivered: (data) => ({
    subject: `Pedido Entregue #${data.orderNumber} - Loja Mãe`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Pedido Entregue! ✅</h1>
        <p>Olá ${data.customerName},</p>
        <p>Seu pedido <strong>#${data.orderNumber}</strong> foi entregue com sucesso!</p>
        
        <p>Esperamos que você esteja satisfeito com sua compra.</p>
        <p>Se tiver alguma dúvida ou problema, entre em contato conosco.</p>
        
        <p>Obrigado por escolher a Loja Mãe!</p>
      </div>
    `,
  }),

  lowStock: (data) => ({
    subject: `⚠️ Alerta: Estoque Baixo - ${data.productTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ff6b6b;">Alerta de Estoque Baixo</h1>
        <p><strong>Produto:</strong> ${data.productTitle}</p>
        <p><strong>Estoque Atual:</strong> ${data.currentStock} unidades</p>
        <p><strong>Limite Mínimo:</strong> ${data.threshold} unidades</p>
        
        <p style="color: #ff6b6b; font-weight: bold;">
          ⚠️ O estoque está abaixo do limite. Considere reabastecer.
        </p>
      </div>
    `,
  }),
};

/**
 * Envia notificação de pedido confirmado
 */
export async function sendOrderConfirmationEmail(
  env: any,
  data: Parameters<NotificationTemplates['orderConfirmation']>[0] & { customerEmail: string }
): Promise<void> {
  const template = notificationTemplates.orderConfirmation(data);
  await sendEmail(env, { to: data.customerEmail, subject: template.subject, html: template.html });
}

/**
 * Envia notificação de pedido enviado
 */
export async function sendOrderShippedEmail(
  env: any,
  data: Parameters<NotificationTemplates['orderShipped']>[0] & { customerEmail: string }
): Promise<void> {
  const template = notificationTemplates.orderShipped(data);
  await sendEmail(env, { to: data.customerEmail, subject: template.subject, html: template.html });
}

/**
 * Envia notificação de pedido entregue
 */
export async function sendOrderDeliveredEmail(
  env: any,
  data: Parameters<NotificationTemplates['orderDelivered']>[0] & { customerEmail: string }
): Promise<void> {
  const template = notificationTemplates.orderDelivered(data);
  await sendEmail(env, { to: data.customerEmail, subject: template.subject, html: template.html });
}

/**
 * Envia alerta de estoque baixo
 */
export async function sendLowStockAlert(
  env: any,
  data: Parameters<NotificationTemplates['lowStock']>[0],
  adminEmail: string
): Promise<void> {
  const template = notificationTemplates.lowStock(data);
  await sendEmail(env, { to: adminEmail, subject: template.subject, html: template.html });
}


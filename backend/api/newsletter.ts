import type { Env } from '../types';
import { getDb, executeOne, executeRun } from '../utils/db';
import { successResponse, errorResponse } from '../utils/response';
import { handleError } from '../utils/errors';
import { sendEmail } from '../utils/email';

/**
 * Newsletter subscription handler
 */
export async function handleNewsletter(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Subscribe: POST /api/newsletter/subscribe
    if (method === 'POST' && path === '/api/newsletter/subscribe') {
        try {
            const body = await request.json() as { email: string };
            const { email } = body;

            if (!email || !email.includes('@')) {
                return errorResponse('Email inválido', 400);
            }

            const db = getDb(env);

            // Check if already subscribed
            const existing = await executeOne<{ id: number; status: string }>(
                db,
                'SELECT id, status FROM newsletter_subscribers WHERE email = ?',
                [email.toLowerCase()]
            );

            if (existing) {
                if (existing.status === 'active') {
                    return successResponse({
                        message: 'Você já está inscrito na nossa newsletter!',
                        already_subscribed: true
                    });
                } else {
                    // Reactivate subscription
                    await executeRun(
                        db,
                        'UPDATE newsletter_subscribers SET status = ?, subscribed_at = datetime("now"), updated_at = datetime("now") WHERE id = ?',
                        ['active', existing.id]
                    );
                }
            } else {
                // New subscription
                await executeRun(
                    db,
                    'INSERT INTO newsletter_subscribers (email, status, source, subscribed_at, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"), datetime("now"))',
                    [email.toLowerCase(), 'active', 'website']
                );
            }

            // Send welcome email
            try {
                const emailHtml = generateNewsletterWelcomeEmail(email);
                await sendEmail(env, {
                    to: email,
                    subject: '✨ Bem-vindo à Newsletter Leiasabores!',
                    html: emailHtml,
                });
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                // Don't fail the subscription if email fails
            }

            return successResponse({
                message: 'Inscrição realizada com sucesso! Verifique seu email.',
                subscribed: true
            });
        } catch (error) {
            const { message, status, details } = handleError(error);
            return errorResponse(message, status, details);
        }
    }

    return errorResponse('Method not allowed', 405);
}

/**
 * Generate welcome email HTML
 */
function generateNewsletterWelcomeEmail(email: string): string {
    const firstName = email.split('@')[0];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à Newsletter</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #4a5568; margin: 0; padding: 0; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #D2691E 0%, #8B4513 100%); padding: 50px 30px; text-align: center; }
    .brand { color: white; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; margin-bottom: 10px; }
    .tagline { color: rgba(255,255,255,0.9); font-size: 16px; }
    .content { padding: 40px 40px; }
    .greeting { font-size: 24px; font-weight: 700; color: #1a202c; margin-bottom: 20px; }
    .message { font-size: 16px; color: #4a5568; margin-bottom: 30px; line-height: 1.8; }
    .highlights { background-color: #fffbf7; border-left: 4px solid #D2691E; padding: 20px 25px; margin: 30px 0; border-radius: 8px; }
    .highlights h3 { margin: 0 0 15px; color: #D2691E; font-size: 18px; }
    .highlights ul { margin: 0; padding-left: 20px; }
    .highlights li { margin-bottom: 10px; color: #5c3a2e; }
    .cta { text-align: center; margin: 40px 0; }
    .btn { display: inline-block; background-color: #D2691E; color: #ffffff; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s; box-shadow: 0 4px 6px rgba(210, 105, 30, 0.3); }
    .btn:hover { background-color: #b95815; transform: translateY(-1px); }
    .products { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0; }
    .product-card { background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; }
    .product-icon { font-size: 40px; margin-bottom: 10px; }
    .product-name { font-size: 14px; font-weight: 600; color: #2d3748; }
    .footer { text-align: center; padding: 30px 40px; color: #a0aec0; font-size: 12px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Leiasabores</div>
      <div class="tagline">Acessórios para Confeitaria</div>
    </div>
    
    <div class="content">
      <div class="greeting">Olá, ${firstName}! 🎉</div>
      
      <p class="message">
        Bem-vindo à nossa newsletter! Estamos muito felizes em tê-lo(a) conosco. 
        A partir de agora, você receberá em primeira mão:
      </p>
      
      <div class="highlights">
        <h3>✨ O que você vai receber:</h3>
        <ul>
          <li><strong>Novidades da semana</strong> - Produtos exclusivos e lançamentos</li>
          <li><strong>Ofertas especiais</strong> - Descontos e promoções exclusivas</li>
          <li><strong>Dicas de confeitaria</strong> - Receitas e técnicas profissionais</li>
          <li><strong>Tendências</strong> - As últimas novidades do mundo da confeitaria</li>
        </ul>
      </div>
      
      <div class="products">
        <div class="product-card">
          <div class="product-icon">🧁</div>
          <div class="product-name">Formas & Moldes</div>
        </div>
        <div class="product-card">
          <div class="product-icon">🍰</div>
          <div class="product-name">Utensílios</div>
        </div>
        <div class="product-card">
          <div class="product-icon">🎂</div>
          <div class="product-name">Decoração</div>
        </div>
        <div class="product-card">
          <div class="product-icon">🥄</div>
          <div class="product-name">Acessórios</div>
        </div>
      </div>
      
      <div class="cta">
        <a href="https://www.leiasabores.pt/produtos" class="btn">Explorar Produtos</a>
      </div>
      
      <p class="message" style="margin-top: 40px; font-size: 14px; color: #718096;">
        Fique de olho na sua caixa de entrada! Nossa próxima newsletter está chegando em breve com ofertas imperdíveis.
      </p>
    </div>
    
    <div class="footer">
      <p>Você está recebendo este email porque se inscreveu na newsletter Leiasabores.</p>
      <p>Leiasabores &bull; Acessórios para Confeitaria</p>
      <p style="margin-top: 15px;">
        <a href="https://www.leiasabores.pt/newsletter/unsubscribe?email=${encodeURIComponent(email)}" style="color: #cbd5e0; text-decoration: none;">Cancelar inscrição</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

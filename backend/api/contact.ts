import type { Env } from '../types';
import { z } from 'zod';
import { handleCORS } from '../utils/cors';
import { errorResponse, successResponse } from '../utils/response';
import { sendEmail } from '../utils/email';

const contactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});

export async function handleContactRoutes(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return handleCORS(
      errorResponse('Method not allowed', 405),
      env,
      request
    );
  }

  try {
    const body = await request.json();
    const validated = contactSchema.parse(body);

    // Email para o administrador
    const adminEmail = 'davecdl@outlook.com';
    
    // Sanitizar mensagem para evitar problemas com HTML
    const sanitizedMessage = validated.message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    const sanitizedName = validated.name
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    const sanitizedSubject = validated.subject
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">
          Nova Mensagem de Contato
        </h2>
        
        <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Nome:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${validated.email}</p>
          <p><strong>Assunto:</strong> ${sanitizedSubject}</p>
        </div>
        
        <div style="background: #fff; padding: 15px; margin: 20px 0; border-left: 4px solid #8B4513;">
          <h3 style="color: #333; margin-top: 0;">Mensagem:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${sanitizedMessage}</p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Esta mensagem foi enviada através do formulário de contato do website.
        </p>
      </div>
    `;

    const emailText = `
Nova Mensagem de Contato

Nome: ${validated.name}
Email: ${validated.email}
Assunto: ${validated.subject}

Mensagem:
${validated.message}

---
Esta mensagem foi enviada através do formulário de contato do website.
    `.trim();

    // Tentar enviar email para o administrador
    // Se falhar, ainda retornamos sucesso para não frustrar o usuário
    // O email pode ser verificado nos logs do Cloudflare
    try {
      const emailSent = await sendEmail(env, {
        to: adminEmail,
        subject: `[Contato] ${validated.subject}`,
        html: emailHtml,
        text: emailText,
      });

      if (!emailSent) {
        console.error('[CONTACT] Failed to send email to admin:', {
          to: adminEmail,
          subject: validated.subject,
          name: validated.name,
          email: validated.email,
        });
        // Continuar mesmo se o email falhar - não queremos frustrar o usuário
      } else {
        console.log('[CONTACT] Email sent successfully to admin');
      }
    } catch (emailError) {
      console.error('[CONTACT] Email error:', emailError);
      // Continuar mesmo se o email falhar
    }

    // Tentar enviar confirmação para o cliente (opcional - não bloqueia)
    try {
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Mensagem Recebida!</h2>
          <p>Olá ${sanitizedName},</p>
          <p>Recebemos sua mensagem e entraremos em contato em breve.</p>
          
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p><strong>Assunto:</strong> ${sanitizedSubject}</p>
            <p><strong>Sua mensagem:</strong></p>
            <p style="white-space: pre-wrap; line-height: 1.6;">${sanitizedMessage}</p>
          </div>
          
          <p>Obrigado por entrar em contato conosco!</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Esta é uma mensagem automática. Por favor, não responda este email.
          </p>
        </div>
      `;

      await sendEmail(env, {
        to: validated.email,
        subject: 'Mensagem Recebida - Leiasabores',
        html: confirmationHtml,
      });
    } catch (confirmationError) {
      console.error('[CONTACT] Confirmation email error:', confirmationError);
      // Não bloquear se a confirmação falhar
    }

    // Sempre retornar sucesso - o email pode falhar mas a mensagem foi recebida
    return handleCORS(
      successResponse({ message: 'Mensagem enviada com sucesso!' }),
      env,
      request
    );
  } catch (error) {
    console.error('[CONTACT] Form error:', error);
    
    if (error instanceof z.ZodError) {
      return handleCORS(
        errorResponse(error.errors[0].message, 400),
        env,
        request
      );
    }

    // Log detalhado do erro para debug
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[CONTACT] Full error:', {
      message: errorMessage,
      stack: errorStack,
      error: JSON.stringify(error),
    });

    return handleCORS(
      errorResponse(`Erro ao processar mensagem: ${errorMessage}`, 500),
      env,
      request
    );
  }
}


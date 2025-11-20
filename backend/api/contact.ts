import type { Env } from '../types';
import { z } from 'zod';
import { handleCORS } from '../utils/cors';
import { errorResponse, successResponse } from '../utils/response';
import { sendEmail } from '../utils/email';
import { getDb, executeRun } from '../utils/db';

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
    const db = getDb(env);

    // Email para o administrador
    const adminEmail = 'davecdl@outlook.com';
    
    // Obter IP e User-Agent para logs
    const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
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

    // Salvar mensagem no banco de dados PRIMEIRO
    let messageId: number | null = null;
    let emailSent = false;
    let emailError: string | null = null;

    try {
      const result = await executeRun(
        db,
        `INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent, email_sent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          validated.name,
          validated.email,
          validated.subject,
          validated.message,
          ipAddress,
          userAgent,
          0, // email_sent = false inicialmente
        ]
      );

      if (result.success && result.meta.last_row_id) {
        messageId = result.meta.last_row_id;
        console.log('[CONTACT] Message saved to database with ID:', messageId);
      }
    } catch (dbError) {
      console.error('[CONTACT] Database error:', dbError);
      // Continuar mesmo se falhar ao salvar no banco
    }

    // Tentar enviar email para o administrador
    try {
      emailSent = await sendEmail(env, {
        to: adminEmail,
        subject: `[Contato] ${validated.subject}`,
        html: emailHtml,
        text: emailText,
        replyTo: validated.email,
      });

      if (emailSent) {
        console.log('[CONTACT] Email sent successfully to admin');
        // Atualizar status no banco
        if (messageId) {
          await executeRun(
            db,
            'UPDATE contact_messages SET email_sent = 1, updated_at = datetime("now") WHERE id = ?',
            [messageId]
          );
        }
      } else {
        emailError = 'Failed to send email via MailChannels';
        console.error('[CONTACT] Failed to send email to admin:', {
          to: adminEmail,
          subject: validated.subject,
          name: validated.name,
          email: validated.email,
        });
        // Atualizar erro no banco
        if (messageId) {
          await executeRun(
            db,
            'UPDATE contact_messages SET email_error = ?, updated_at = datetime("now") WHERE id = ?',
            [emailError, messageId]
          );
        }
      }
    } catch (emailError) {
      const errorMsg = emailError instanceof Error ? emailError.message : String(emailError);
      emailError = errorMsg;
      console.error('[CONTACT] Email error:', emailError);
      // Atualizar erro no banco
      if (messageId) {
        await executeRun(
          db,
          'UPDATE contact_messages SET email_error = ?, updated_at = datetime("now") WHERE id = ?',
          [errorMsg, messageId]
        );
      }
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


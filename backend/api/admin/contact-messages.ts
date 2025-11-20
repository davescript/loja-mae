import type { Env } from '../../types';
import { getDb, executeQuery, executeOne, executeRun } from '../../utils/db';
import { handleCORS } from '../../utils/cors';
import { errorResponse, successResponse } from '../../utils/response';
import { requireAuth } from '../../utils/auth';

export async function handleContactMessagesRoutes(request: Request, env: Env): Promise<Response> {
  // Verificar autenticação admin
  try {
    await requireAuth(request, env, 'admin');
  } catch {
    return handleCORS(
      errorResponse('Unauthorized', 401),
      env,
      request
    );
  }

  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;
  const db = getDb(env);

  // Listar mensagens
  if (method === 'GET' && path === '/api/admin/contact-messages') {
    try {
      const status = url.searchParams.get('status') || 'all';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM contact_messages';
      const params: any[] = [];

      if (status !== 'all') {
        query += ' WHERE status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const messages = await executeQuery<{
        id: number;
        name: string;
        email: string;
        subject: string;
        message: string;
        status: string;
        email_sent: number;
        email_error: string | null;
        ip_address: string | null;
        user_agent: string | null;
        created_at: string;
        updated_at: string;
      }>(db, query, params);

      // Contar total
      let countQuery = 'SELECT COUNT(*) as total FROM contact_messages';
      const countParams: any[] = [];
      if (status !== 'all') {
        countQuery += ' WHERE status = ?';
        countParams.push(status);
      }
      const countResult = await executeOne<{ total: number }>(db, countQuery, countParams);
      const total = countResult?.total || 0;

      return handleCORS(
        successResponse({
          messages,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }),
        env,
        request
      );
    } catch (error) {
      console.error('Error listing contact messages:', error);
      return handleCORS(
        errorResponse('Erro ao listar mensagens', 500),
        env,
        request
      );
    }
  }

  // Obter mensagem específica
  if (method === 'GET' && path.match(/^\/api\/admin\/contact-messages\/\d+$/)) {
    try {
      const messageId = path.split('/').pop();
      if (!messageId) {
        return handleCORS(
          errorResponse('ID inválido', 400),
          env,
          request
        );
      }

      const message = await executeOne<{
        id: number;
        name: string;
        email: string;
        subject: string;
        message: string;
        status: string;
        email_sent: number;
        email_error: string | null;
        ip_address: string | null;
        user_agent: string | null;
        created_at: string;
        updated_at: string;
      }>(
        db,
        'SELECT * FROM contact_messages WHERE id = ?',
        [messageId]
      );

      if (!message) {
        return handleCORS(
          errorResponse('Mensagem não encontrada', 404),
          env,
          request
        );
      }

      return handleCORS(
        successResponse({ message }),
        env,
        request
      );
    } catch (error) {
      console.error('Error getting contact message:', error);
      return handleCORS(
        errorResponse('Erro ao obter mensagem', 500),
        env,
        request
      );
    }
  }

  // Atualizar status da mensagem
  if (method === 'PUT' && path.match(/^\/api\/admin\/contact-messages\/\d+$/)) {
    try {
      const messageId = path.split('/').pop();
      if (!messageId) {
        return handleCORS(
          errorResponse('ID inválido', 400),
          env,
          request
        );
      }

      const body = await request.json() as { status?: string };
      if (!body.status || !['new', 'read', 'replied', 'archived'].includes(body.status)) {
        return handleCORS(
          errorResponse('Status inválido', 400),
          env,
          request
        );
      }

      await executeRun(
        db,
        'UPDATE contact_messages SET status = ?, updated_at = datetime("now") WHERE id = ?',
        [body.status, messageId]
      );

      return handleCORS(
        successResponse({ message: 'Status atualizado com sucesso' }),
        env,
        request
      );
    } catch (error) {
      console.error('Error updating contact message:', error);
      return handleCORS(
        errorResponse('Erro ao atualizar mensagem', 500),
        env,
        request
      );
    }
  }

  // Reenviar email
  if (method === 'POST' && path.match(/^\/api\/admin\/contact-messages\/\d+\/resend-email$/)) {
    try {
      const messageId = path.split('/')[4];
      if (!messageId) {
        return handleCORS(
          errorResponse('ID inválido', 400),
          env,
          request
        );
      }

      const message = await executeOne<{
        id: number;
        name: string;
        email: string;
        subject: string;
        message: string;
      }>(
        db,
        'SELECT * FROM contact_messages WHERE id = ?',
        [messageId]
      );

      if (!message) {
        return handleCORS(
          errorResponse('Mensagem não encontrada', 404),
          env,
          request
        );
      }

      // Importar sendEmail dinamicamente
      const { sendEmail } = await import('../../utils/email');
      const adminEmail = 'davecdl@outlook.com';

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">
            Nova Mensagem de Contato
          </h2>
          
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p><strong>Nome:</strong> ${message.name}</p>
            <p><strong>Email:</strong> ${message.email}</p>
            <p><strong>Assunto:</strong> ${message.subject}</p>
          </div>
          
          <div style="background: #fff; padding: 15px; margin: 20px 0; border-left: 4px solid #8B4513;">
            <h3 style="color: #333; margin-top: 0;">Mensagem:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message.message}</p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Esta mensagem foi enviada através do formulário de contato do website.
          </p>
        </div>
      `;

      const emailSent = await sendEmail(env, {
        to: adminEmail,
        subject: `[Contato] ${message.subject}`,
        html: emailHtml,
        replyTo: message.email,
      });

      if (emailSent) {
        await executeRun(
          db,
          'UPDATE contact_messages SET email_sent = 1, email_error = NULL, updated_at = datetime("now") WHERE id = ?',
          [messageId]
        );
        return handleCORS(
          successResponse({ message: 'Email reenviado com sucesso' }),
          env,
          request
        );
      } else {
        await executeRun(
          db,
          'UPDATE contact_messages SET email_error = ?, updated_at = datetime("now") WHERE id = ?',
          ['Failed to resend email', messageId]
        );
        return handleCORS(
          errorResponse('Erro ao reenviar email', 500),
          env,
          request
        );
      }
    } catch (error) {
      console.error('Error resending email:', error);
      return handleCORS(
        errorResponse('Erro ao reenviar email', 500),
        env,
        request
      );
    }
  }

  return handleCORS(
    errorResponse('Method not allowed', 405),
    env,
    request
  );
}


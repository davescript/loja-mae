import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAuth } from '../../utils/auth';
import { executeQuery, executeOne, executeRun } from '../../utils/db';
import { hashPassword, comparePassword } from '../../utils/auth';

// GET /api/customers/me - Get current customer profile
export async function handleGetMe(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    const customer = await executeOne<{
      id: number;
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    }>(
      db,
      'SELECT id, email, first_name, last_name, phone FROM customers WHERE id = ?',
      [user.id]
    );

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    return successResponse(customer);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// PUT /api/customers/me - Update current customer profile
export async function handleUpdateMe(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);
    const body = await request.json() as {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };

    await executeRun(
      db,
      `UPDATE customers 
       SET first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           updated_at = datetime('now')
       WHERE id = ?`,
      [body.first_name || null, body.last_name || null, body.email || null, body.phone || null, user.id]
    );

    return successResponse({ message: 'Profile updated' });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// PUT /api/customers/me/password - Update password
export async function handleUpdatePassword(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);
    const body = await request.json() as {
      current_password: string;
      new_password: string;
    };

    // Get current password hash
    const customer = await executeOne<{ password_hash: string }>(
      db,
      'SELECT password_hash FROM customers WHERE id = ?',
      [user.id]
    );

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    // Verify current password
    const isValid = await comparePassword(body.current_password, customer.password_hash);
    if (!isValid) {
      return errorResponse('Current password is incorrect', 400);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(body.new_password);

    // Update password
    await executeRun(
      db,
      'UPDATE customers SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
      [newPasswordHash, user.id]
    );

    return successResponse({ message: 'Password updated' });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// GET /api/customers/stats - Get customer statistics
export async function handleGetStats(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    // Total orders (by customer_id OR email for guest orders)
    const totalOrders = await executeOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = ? OR email = ?',
      [user.id, user.email]
    );

    // Total spent
    const totalSpent = await executeOne<{ total: number }>(
      db,
      'SELECT COALESCE(SUM(total_cents), 0) as total FROM orders WHERE (customer_id = ? OR email = ?) AND payment_status = "paid"',
      [user.id, user.email]
    );

    // Pending orders
    const pendingOrders = await executeOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM orders WHERE (customer_id = ? OR email = ?) AND status IN ("pending", "paid", "processing")',
      [user.id, user.email]
    );

    // Recent order
    const recentOrder = await executeOne<{
      id: number;
      order_number: string;
      total_cents: number;
      created_at: string;
    }>(
      db,
      'SELECT id, order_number, total_cents, created_at FROM orders WHERE customer_id = ? OR email = ? ORDER BY created_at DESC LIMIT 1',
      [user.id, user.email]
    );

    return successResponse({
      total_orders: totalOrders?.count || 0,
      total_spent: totalSpent?.total || 0,
      pending_orders: pendingOrders?.count || 0,
      recent_order: recentOrder || null,
    });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// GET /api/customers/orders - List customer orders
export async function handleGetOrders(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const limit = url.searchParams.get('limit'); // For dashboard quick access
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';

            // Allow customers to see orders by customer_id OR by email (for guest orders)
            let whereClause = 'WHERE (customer_id = ? OR email = ?)';
            const params: any[] = [user.id, user.email];

            if (search) {
              whereClause += ' AND order_number LIKE ?';
              params.push(`%${search}%`);
            }

            if (status && status !== 'all') {
              whereClause += ' AND status = ?';
              params.push(status);
            }

    // Handle limit parameter for dashboard (quick access)
    const finalLimit = limit ? parseInt(limit) : pageSize;
    const finalPage = limit ? 1 : page; // If limit is set, ignore pagination
    const offset = limit ? 0 : (finalPage - 1) * pageSize;

    // Get orders
    const orders = await executeQuery(
      db,
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, finalLimit, offset]
    );

    // Get total count
    const totalResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM orders ${whereClause}`,
      params
    );

    const total = totalResult?.count || 0;

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order: any) => {
        const items = await executeQuery(
          db,
          'SELECT * FROM order_items WHERE order_id = ?',
          [order.id]
        );
        return {
          ...order,
          items: items || [],
        };
      })
    );

    return successResponse({
      items: ordersWithItems,
      total,
      page: finalPage,
      pageSize: finalLimit,
      totalPages: limit ? 1 : Math.ceil(total / pageSize),
    });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// GET /api/customers/orders/:orderNumber - Get order details
export async function handleGetOrder(request: Request, env: Env, orderNumber: string): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    // Allow customers to see orders by customer_id OR by email (for guest orders)
    const order = await executeOne(
      db,
      'SELECT * FROM orders WHERE order_number = ? AND (customer_id = ? OR email = ?)',
      [orderNumber, user.id, user.email]
    );

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Get order items
    const items = await executeQuery(
      db,
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );

    // Get status history
    const statusHistory = await executeQuery(
      db,
      'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
      [order.id]
    );

    return successResponse({
      ...order,
      items: items || [],
      status_history: statusHistory || [],
    });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// GET /api/customers/addresses - List addresses
export async function handleGetAddresses(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    const addresses = await executeQuery(
      db,
      'SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC',
      [user.id]
    );

    return successResponse(addresses || []);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// POST /api/customers/addresses - Create address
export async function handleCreateAddress(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);
    const body = await request.json() as {
      type: 'shipping' | 'billing' | 'both';
      first_name: string;
      last_name: string;
      company?: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      phone?: string;
      is_default: boolean;
    };

    // If this is set as default, unset other defaults
    if (body.is_default) {
      await executeRun(
        db,
        'UPDATE addresses SET is_default = 0 WHERE customer_id = ?',
        [user.id]
      );
    }

    const result = await executeRun(
      db,
      `INSERT INTO addresses (
        customer_id, type, first_name, last_name, company, address_line1, address_line2,
        city, state, postal_code, country, phone, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        user.id,
        body.type,
        body.first_name,
        body.last_name,
        body.company || null,
        body.address_line1,
        body.address_line2 || null,
        body.city,
        body.state,
        body.postal_code,
        body.country,
        body.phone || null,
        body.is_default ? 1 : 0,
      ]
    );

    return successResponse({ id: result.meta.last_row_id, message: 'Address created' });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// PUT /api/customers/addresses/:id - Update address
export async function handleUpdateAddress(request: Request, env: Env, addressId: string): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);
    const body = await request.json() as {
      type?: 'shipping' | 'billing' | 'both';
      first_name?: string;
      last_name?: string;
      company?: string;
      address_line1?: string;
      address_line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      phone?: string;
      is_default?: boolean;
    };

    // Verify ownership
    const address = await executeOne<{ customer_id: number }>(
      db,
      'SELECT customer_id FROM addresses WHERE id = ?',
      [addressId]
    );

    if (!address || address.customer_id !== user.id) {
      return errorResponse('Address not found', 404);
    }

    // If setting as default, unset other defaults
    if (body.is_default) {
      await executeRun(
        db,
        'UPDATE addresses SET is_default = 0 WHERE customer_id = ? AND id != ?',
        [user.id, addressId]
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (body.type !== undefined) {
      updates.push('type = ?');
      values.push(body.type);
    }
    if (body.first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(body.first_name);
    }
    if (body.last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(body.last_name);
    }
    if (body.company !== undefined) {
      updates.push('company = ?');
      values.push(body.company || null);
    }
    if (body.address_line1 !== undefined) {
      updates.push('address_line1 = ?');
      values.push(body.address_line1);
    }
    if (body.address_line2 !== undefined) {
      updates.push('address_line2 = ?');
      values.push(body.address_line2 || null);
    }
    if (body.city !== undefined) {
      updates.push('city = ?');
      values.push(body.city);
    }
    if (body.state !== undefined) {
      updates.push('state = ?');
      values.push(body.state);
    }
    if (body.postal_code !== undefined) {
      updates.push('postal_code = ?');
      values.push(body.postal_code);
    }
    if (body.country !== undefined) {
      updates.push('country = ?');
      values.push(body.country);
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      values.push(body.phone || null);
    }
    if (body.is_default !== undefined) {
      updates.push('is_default = ?');
      values.push(body.is_default ? 1 : 0);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    updates.push('updated_at = datetime("now")');
    values.push(addressId);

    await executeRun(
      db,
      `UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return successResponse({ message: 'Address updated' });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// DELETE /api/customers/addresses/:id - Delete address
export async function handleDeleteAddress(request: Request, env: Env, addressId: string): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    // Verify ownership
    const address = await executeOne<{ customer_id: number }>(
      db,
      'SELECT customer_id FROM addresses WHERE id = ?',
      [addressId]
    );

    if (!address || address.customer_id !== user.id) {
      return errorResponse('Address not found', 404);
    }

    await executeRun(db, 'DELETE FROM addresses WHERE id = ?', [addressId]);

    return successResponse({ message: 'Address deleted' });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// GET /api/customers/payments - List payments
export async function handleGetPayments(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    // Get payments from orders (by customer_id OR email for guest orders)
    // Include orders with payment_status = 'paid' OR with stripe_payment_intent_id (payment initiated)
    const orders = await executeQuery(
      db,
      `SELECT 
        id as payment_id,
        id as order_id,
        order_number,
        total_cents as amount_cents,
        stripe_payment_intent_id as provider_id,
        stripe_charge_id,
        payment_status as status,
        'stripe' as provider,
        'eur' as currency,
        created_at
       FROM orders 
       WHERE (customer_id = ? OR email = ?) 
         AND (payment_status = 'paid' OR stripe_payment_intent_id IS NOT NULL)
       ORDER BY created_at DESC`,
      [user.id, user.email]
    );

    // Transform to match Payment type
    const payments = (orders || []).map((order: any) => ({
      id: order.payment_id,
      order_id: order.order_id,
      order_number: order.order_number,
      status: order.status === 'paid' ? 'succeeded' : 'pending',
      provider: order.provider || 'stripe',
      provider_id: order.provider_id || order.stripe_charge_id,
      amount_cents: order.amount_cents,
      currency: order.currency || 'eur',
      created_at: order.created_at,
      order: {
        order_number: order.order_number,
        total_cents: order.amount_cents,
      },
    }));

    return successResponse(payments);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// GET /api/customers/notifications - List notifications
export async function handleGetNotifications(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    const notifications = await executeQuery(
      db,
      'SELECT * FROM customer_notifications WHERE customer_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    return successResponse(notifications || []);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// GET /api/customers/notifications/unread-count - Get unread count
export async function handleGetUnreadCount(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    const result = await executeOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM customer_notifications WHERE customer_id = ? AND is_read = 0',
      [user.id]
    );

    return successResponse({ count: result?.count || 0 });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// PUT /api/customers/notifications/:id/read - Mark as read
export async function handleMarkNotificationRead(request: Request, env: Env, notificationId: string): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    await executeRun(
      db,
      'UPDATE customer_notifications SET is_read = 1 WHERE id = ? AND customer_id = ?',
      [notificationId, user.id]
    );

    return successResponse({ message: 'Notification marked as read' });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// PUT /api/customers/notifications/read-all - Mark all as read
export async function handleMarkAllNotificationsRead(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    await executeRun(
      db,
      'UPDATE customer_notifications SET is_read = 1 WHERE customer_id = ? AND is_read = 0',
      [user.id]
    );

    return successResponse({ message: 'All notifications marked as read' });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// GET /api/customers/support/tickets - List support tickets
export async function handleGetSupportTickets(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);

    const tickets = await executeQuery(
      db,
      `SELECT t.*, o.order_number 
       FROM support_tickets t
       LEFT JOIN orders o ON t.order_id = o.id
       WHERE t.customer_id = ?
       ORDER BY t.created_at DESC`,
      [user.id]
    );

    return successResponse(tickets || []);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

// POST /api/customers/support/tickets - Create support ticket
export async function handleCreateSupportTicket(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env, 'customer');
    const db = getDb(env);
    const body = await request.json() as {
      order_id?: number;
      subject: string;
      message: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
    };

    // Verify order ownership if order_id is provided
    if (body.order_id) {
      const order = await executeOne<{ customer_id: number }>(
        db,
        'SELECT customer_id FROM orders WHERE id = ?',
        [body.order_id]
      );

      if (!order || order.customer_id !== user.id) {
        return errorResponse('Order not found', 404);
      }
    }

    const result = await executeRun(
      db,
      `INSERT INTO support_tickets (
        customer_id, order_id, subject, message, status, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'open', ?, datetime('now'), datetime('now'))`,
      [
        user.id,
        body.order_id || null,
        body.subject,
        body.message,
        body.priority,
      ]
    );

    return successResponse({ id: result.meta.last_row_id, message: 'Ticket created' });
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}


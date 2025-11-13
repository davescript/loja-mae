import type { Env } from '../../types';
import { getDb, executeOne, executeQuery } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';

/**
 * GET /api/admin/dashboard/stats
 * Get real dashboard statistics
 */
export async function handleGetDashboardStats(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Get this month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    // Get last month's date range (for comparison)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999).toISOString();

    // Get yesterday's date range (for today comparison)
    const yesterdayStart = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const yesterdayEnd = todayStart;

    // Sales Today
    const salesTodayResult = await executeOne<{ total_cents: number }>(
      db,
      `SELECT COALESCE(SUM(total_cents), 0) as total_cents 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at < ?`,
      [todayStart, todayEnd]
    );
    const salesToday = salesTodayResult?.total_cents || 0;

    // Sales Yesterday (for comparison)
    const salesYesterdayResult = await executeOne<{ total_cents: number }>(
      db,
      `SELECT COALESCE(SUM(total_cents), 0) as total_cents 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at < ?`,
      [yesterdayStart, yesterdayEnd]
    );
    const salesYesterday = salesYesterdayResult?.total_cents || 0;

    // Sales This Month
    const salesMonthResult = await executeOne<{ total_cents: number }>(
      db,
      `SELECT COALESCE(SUM(total_cents), 0) as total_cents 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at <= ?`,
      [monthStart, monthEnd]
    );
    const salesMonth = salesMonthResult?.total_cents || 0;

    // Sales Last Month (for comparison)
    const salesLastMonthResult = await executeOne<{ total_cents: number }>(
      db,
      `SELECT COALESCE(SUM(total_cents), 0) as total_cents 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at <= ?`,
      [lastMonthStart, lastMonthEnd]
    );
    const salesLastMonth = salesLastMonthResult?.total_cents || 0;

    // Orders Today
    const ordersTodayResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE created_at >= ? AND created_at < ?`,
      [todayStart, todayEnd]
    );
    const ordersToday = ordersTodayResult?.count || 0;

    // Orders Yesterday
    const ordersYesterdayResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE created_at >= ? AND created_at < ?`,
      [yesterdayStart, yesterdayEnd]
    );
    const ordersYesterday = ordersYesterdayResult?.count || 0;

    // Orders This Month
    const ordersMonthResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE created_at >= ? AND created_at <= ?`,
      [monthStart, monthEnd]
    );
    const ordersMonth = ordersMonthResult?.count || 0;

    // Orders Last Month
    const ordersLastMonthResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE created_at >= ? AND created_at <= ?`,
      [lastMonthStart, lastMonthEnd]
    );
    const ordersLastMonth = ordersLastMonthResult?.count || 0;

    // New Customers This Month
    const customersNewResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM customers 
       WHERE created_at >= ? AND created_at <= ?`,
      [monthStart, monthEnd]
    );
    const customersNew = customersNewResult?.count || 0;

    // Total Customers
    const customersTotalResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM customers`
    );
    const customersTotal = customersTotalResult?.count || 0;

    // Average Ticket (from paid orders this month)
    const avgTicketResult = await executeOne<{ avg_cents: number }>(
      db,
      `SELECT COALESCE(AVG(total_cents), 0) as avg_cents 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at <= ?`,
      [monthStart, monthEnd]
    );
    const averageTicket = avgTicketResult?.avg_cents || 0;

    // Average Ticket Last Month (for comparison)
    const avgTicketLastMonthResult = await executeOne<{ avg_cents: number }>(
      db,
      `SELECT COALESCE(AVG(total_cents), 0) as avg_cents 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at <= ?`,
      [lastMonthStart, lastMonthEnd]
    );
    const averageTicketLastMonth = avgTicketLastMonthResult?.avg_cents || 0;

    // Abandoned Carts (orders with status pending and no payment)
    const abandonedCartsResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE payment_status = 'pending' 
         AND status = 'pending'
         AND created_at >= datetime('now', '-7 days')`
    );
    const abandonedCarts = abandonedCartsResult?.count || 0;

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      salesToday: salesToday / 100, // Convert cents to euros
      salesTodayChange: calculateChange(salesToday, salesYesterday),
      salesMonth: salesMonth / 100,
      salesMonthChange: calculateChange(salesMonth, salesLastMonth),
      ordersToday,
      ordersTodayChange: calculateChange(ordersToday, ordersYesterday),
      ordersMonth,
      ordersMonthChange: calculateChange(ordersMonth, ordersLastMonth),
      customersNew,
      customersTotal,
      averageTicket: averageTicket / 100,
      averageTicketChange: calculateChange(averageTicket, averageTicketLastMonth),
      abandonedCarts,
    };

    return successResponse(stats);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

/**
 * GET /api/admin/dashboard/sales-chart
 * Get sales data for chart (last 7 days)
 */
export async function handleGetSalesChart(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);

    // Get last 7 days
    const days: Array<{ date: string; label: string }> = [];
    const salesData: Array<{ date: string; sales: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayStart = date.toISOString();
      const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const dayLabel = dayLabels[date.getDay()];

      const result = await executeOne<{ total_cents: number }>(
        db,
        `SELECT COALESCE(SUM(total_cents), 0) as total_cents 
         FROM orders 
         WHERE payment_status = 'paid' 
           AND created_at >= ? AND created_at < ?`,
        [dayStart, dayEnd]
      );

      salesData.push({
        date: dayLabel,
        sales: (result?.total_cents || 0) / 100, // Convert to euros
      });
    }

    return successResponse(salesData);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

/**
 * GET /api/admin/dashboard/top-products
 * Get top 5 best selling products
 */
export async function handleGetTopProducts(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);

    const topProducts = await executeQuery<{
      product_id: number;
      title: string;
      total_quantity: number;
    }>(
      db,
      `SELECT 
        oi.product_id,
        p.title,
        SUM(oi.quantity) as total_quantity
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.payment_status = 'paid'
         AND o.created_at >= datetime('now', '-30 days')
       GROUP BY oi.product_id, p.title
       ORDER BY total_quantity DESC
       LIMIT 5`
    );

    const formatted = (topProducts || []).map((p) => ({
      name: p.title || `Produto #${p.product_id}`,
      sales: p.total_quantity || 0,
    }));

    return successResponse(formatted);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}


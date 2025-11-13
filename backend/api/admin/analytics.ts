import type { Env } from '../../types';
import { getDb, executeOne, executeQuery } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { requireAdmin } from '../../utils/auth';

/**
 * GET /api/admin/analytics/stats
 * Get analytics statistics
 */
export async function handleGetAnalyticsStats(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);

    // Get date ranges
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

    // Total Revenue (all time, paid orders)
    const totalRevenueResult = await executeOne<{ total_cents: number }>(
      db,
      `SELECT COALESCE(SUM(total_cents), 0) as total_cents 
       FROM orders 
       WHERE payment_status = 'paid'`
    );
    const totalRevenue = totalRevenueResult?.total_cents || 0;

    // Revenue This Month
    const revenueMonthResult = await executeOne<{ total_cents: number }>(
      db,
      `SELECT COALESCE(SUM(total_cents), 0) as total_cents 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at <= ?`,
      [monthStart, monthEnd]
    );
    const revenueMonth = revenueMonthResult?.total_cents || 0;

    // Revenue Last Month
    const revenueLastMonthResult = await executeOne<{ total_cents: number }>(
      db,
      `SELECT COALESCE(SUM(total_cents), 0) as total_cents 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at <= ?`,
      [lastMonthStart, lastMonthEnd]
    );
    const revenueLastMonth = revenueLastMonthResult?.total_cents || 0;

    // Total Orders (all time)
    const totalOrdersResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM orders WHERE payment_status = 'paid'`
    );
    const totalOrders = totalOrdersResult?.count || 0;

    // Orders This Month
    const ordersMonthResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at <= ?`,
      [monthStart, monthEnd]
    );
    const ordersMonth = ordersMonthResult?.count || 0;

    // Orders Last Month
    const ordersLastMonthResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE payment_status = 'paid' 
         AND created_at >= ? AND created_at <= ?`,
      [lastMonthStart, lastMonthEnd]
    );
    const ordersLastMonth = ordersLastMonthResult?.count || 0;

    // Total Customers
    const totalCustomersResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM customers`
    );
    const totalCustomers = totalCustomersResult?.count || 0;

    // New Customers This Month
    const customersMonthResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM customers 
       WHERE created_at >= ? AND created_at <= ?`,
      [monthStart, monthEnd]
    );
    const customersMonth = customersMonthResult?.count || 0;

    // New Customers Last Month
    const customersLastMonthResult = await executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count 
       FROM customers 
       WHERE created_at >= ? AND created_at <= ?`,
      [lastMonthStart, lastMonthEnd]
    );
    const customersLastMonth = customersLastMonthResult?.count || 0;

    // Conversion Rate (orders / unique visitors - simplified: orders / customers)
    // This is a simplified calculation. In a real scenario, you'd track unique visitors
    const conversionRate = totalCustomers > 0 
      ? (totalOrders / totalCustomers) * 100 
      : 0;

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const stats = {
      totalRevenue: totalRevenue / 100, // Convert cents to euros
      totalRevenueChange: calculateChange(revenueMonth, revenueLastMonth),
      totalOrders,
      totalOrdersChange: calculateChange(ordersMonth, ordersLastMonth),
      totalCustomers,
      totalCustomersChange: calculateChange(customersMonth, customersLastMonth),
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
      conversionRateChange: 0, // Would need visitor tracking to calculate properly
    };

    return successResponse(stats);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

/**
 * GET /api/admin/analytics/revenue-chart
 * Get revenue data for chart (last 6 months)
 */
export async function handleGetRevenueChart(request: Request, env: Env): Promise<Response> {
  try {
    await requireAdmin(request, env);
    const db = getDb(env);

    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const revenueData: Array<{ month: string; value: number }> = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const result = await executeOne<{ total_cents: number }>(
        db,
        `SELECT COALESCE(SUM(total_cents), 0) as total_cents 
         FROM orders 
         WHERE payment_status = 'paid' 
           AND created_at >= ? AND created_at <= ?`,
        [monthStart, monthEnd]
      );

      revenueData.push({
        month: monthLabels[date.getMonth()],
        value: (result?.total_cents || 0) / 100, // Convert to euros
      });
    }

    return successResponse(revenueData);
  } catch (error) {
    const { message, status } = handleError(error);
    return errorResponse(message, status);
  }
}

/**
 * GET /api/admin/analytics/top-products
 * Get top products for analytics (top 4)
 */
export async function handleGetAnalyticsTopProducts(request: Request, env: Env): Promise<Response> {
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
       GROUP BY oi.product_id, p.title
       ORDER BY total_quantity DESC
       LIMIT 4`
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


import type { D1Database } from '@cloudflare/workers-types';
import { executeQuery, executeOne, executeRun, generateOrderNumber } from '../utils/db';
import { NotFoundError, ValidationError } from '../utils/errors';
import { getProduct } from './products';
import type { Order, OrderItem } from '@shared/types';

export async function createOrder(
  db: D1Database,
  data: {
    customer_id?: number | null;
    email: string;
    items: Array<{
      product_id: number;
      variant_id?: number | null;
      quantity: number;
    }>;
    shipping_address: any;
    billing_address?: any;
    coupon_code?: string | null;
    coupon_id?: number | null;
    coupon_discount_cents?: number;
  }
): Promise<Order> {
  // Calculate totals
  let subtotalCents = 0;
  const orderItems: Array<{
    product_id: number;
    variant_id: number | null;
    title: string;
    sku: string | null;
    quantity: number;
    price_cents: number;
    total_cents: number;
    image_url: string | null;
  }> = [];

  for (const item of data.items) {
    const product = await getProduct(db, item.product_id, true);
    if (!product || product.status !== 'active') {
      throw new ValidationError(`Product ${item.product_id} not found or not active`);
    }

    let priceCents = product.price_cents;
    let title = product.title;
    let sku = product.sku;
    let imageUrl = product.images?.[0]?.image_url || null;

    // Check variant if provided
    if (item.variant_id) {
      const variant = product.variants?.find(v => v.id === item.variant_id);
      if (!variant) {
        throw new ValidationError(`Variant ${item.variant_id} not found`);
      }
      priceCents = variant.price_cents;
      title = `${product.title} - ${variant.title}`;
      sku = variant.sku || product.sku;
    }

    // Check stock
    const availableStock = item.variant_id
      ? product.variants?.find(v => v.id === item.variant_id)?.stock_quantity || 0
      : product.stock_quantity;

    if (product.track_inventory === 1 && availableStock < item.quantity) {
      throw new ValidationError(`Insufficient stock for product ${product.title}`);
    }

    const itemTotal = priceCents * item.quantity;
    subtotalCents += itemTotal;

    orderItems.push({
      product_id: product.id,
      variant_id: item.variant_id || null,
      title,
      sku,
      quantity: item.quantity,
      price_cents: priceCents,
      total_cents: itemTotal,
      image_url: imageUrl,
    });
  }

  const taxCents = 0; // Calculate tax if needed
  const shippingCents = 0; // Calculate shipping if needed
  const discountCents = data.coupon_discount_cents || 0;
  const totalCents = subtotalCents + taxCents + shippingCents - discountCents;

  // Create order
  const orderNumber = generateOrderNumber();
  const result = await executeRun(
    db,
    `INSERT INTO orders (
      order_number, customer_id, email, status, payment_status, fulfillment_status,
      subtotal_cents, tax_cents, shipping_cents, discount_cents, total_cents,
      coupon_id, coupon_code, coupon_discount_cents,
      shipping_address_json, billing_address_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderNumber,
      data.customer_id || null,
      data.email,
      'pending',
      'pending',
      'unfulfilled',
      subtotalCents,
      taxCents,
      shippingCents,
      discountCents,
      totalCents,
      data.coupon_id || null,
      data.coupon_code || null,
      discountCents,
      JSON.stringify(data.shipping_address),
      data.billing_address ? JSON.stringify(data.billing_address) : JSON.stringify(data.shipping_address),
    ]
  );

  if (!result.success) {
    throw new Error('Failed to create order');
  }

  const orderId = result.meta.last_row_id;

  // Create order items
  for (const item of orderItems) {
    await executeRun(
      db,
      `INSERT INTO order_items (
        order_id, product_id, variant_id, title, sku, quantity, price_cents, total_cents, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.product_id,
        item.variant_id,
        item.title,
        item.sku,
        item.quantity,
        item.price_cents,
        item.total_cents,
        item.image_url,
      ]
    );
  }

  // Update stock
  for (const item of data.items) {
    const product = await getProduct(db, item.product_id, true);
    if (product && product.track_inventory === 1) {
      if (item.variant_id) {
        await executeRun(
          db,
          'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
      } else {
        await executeRun(
          db,
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }
  }

  const order = await getOrder(db, orderId, true);
  if (!order) {
    throw new Error('Failed to retrieve created order');
  }

  return order;
}

export async function getOrder(
  db: D1Database,
  id: number,
  includeItems: boolean = false
): Promise<Order | null> {
  // Buscar pedido com dados do cliente via JOIN
  const order = await executeOne<Order & {
    customer_first_name: string | null;
    customer_last_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
  }>(
    db,
    `SELECT 
      o.*,
      c.first_name as customer_first_name,
      c.last_name as customer_last_name,
      c.email as customer_email,
      c.phone as customer_phone
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?`,
    [id]
  );

  if (!order) {
    return null;
  }

  // Buscar endereços do cliente se existir customer_id
  let customerAddresses: any[] = [];
  if (order.customer_id) {
    try {
      const { getAddresses } = await import('./customers');
      const addresses = await getAddresses(db, order.customer_id);
      customerAddresses = addresses || [];
      console.log(`[ORDERS] Found ${customerAddresses.length} addresses for customer ${order.customer_id}`);
    } catch (err) {
      console.error(`[ORDERS] Error fetching addresses for customer ${order.customer_id}:`, err);
    }
  }

  // Montar objeto customer se existir
  const customer = order.customer_id ? {
    id: order.customer_id,
    email: order.customer_email || order.email,
    first_name: order.customer_first_name,
    last_name: order.customer_last_name,
    phone: order.customer_phone,
    date_of_birth: null,
    gender: null,
    is_active: 1,
    email_verified: 0,
    created_at: '',
    updated_at: '',
    addresses: customerAddresses, // Incluir endereços do cliente
  } : undefined;

  // Se o pedido não tem endereço mas o cliente tem, usar o endereço padrão do cliente
  let shippingAddressJson = order.shipping_address_json;
  if (!shippingAddressJson && customerAddresses.length > 0) {
    // Buscar endereço padrão ou o primeiro endereço
    const defaultAddress = customerAddresses.find(addr => addr.is_default === 1) || customerAddresses[0];
    if (defaultAddress) {
      shippingAddressJson = JSON.stringify({
        first_name: defaultAddress.first_name || customer?.first_name || '',
        last_name: defaultAddress.last_name || customer?.last_name || '',
        company: defaultAddress.company || null,
        address_line1: defaultAddress.address_line1 || '',
        address_line2: defaultAddress.address_line2 || null,
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        postal_code: defaultAddress.postal_code || '',
        country: defaultAddress.country || 'PT',
        phone: defaultAddress.phone || customer?.phone || null,
      });
      console.log(`[ORDERS] Using customer default address for order ${id}`);
    }
  }

  const orderResult: Order = {
    ...order,
    customer: customer,
    shipping_address_json: shippingAddressJson, // Usar endereço do cliente se pedido não tiver
  };

  // Remover campos temporários
  delete (orderResult as any).customer_first_name;
  delete (orderResult as any).customer_last_name;
  delete (orderResult as any).customer_email;
  delete (orderResult as any).customer_phone;

  if (includeItems) {
    const items = await executeQuery<OrderItem>(
      db,
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );
    return { ...orderResult, items: items || [] };
  }

  return orderResult;
}

export async function getOrderByNumber(
  db: D1Database,
  orderNumber: string
): Promise<Order | null> {
  return executeOne<Order>(
    db,
    'SELECT * FROM orders WHERE order_number = ?',
    [orderNumber]
  );
}

export async function listOrders(
  db: D1Database,
  filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    payment_status?: string;
    customer_id?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{ items: Order[]; total: number }> {
  const {
    page = 1,
    pageSize = 20,
    status,
    payment_status,
    customer_id,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  let whereClause = '1=1';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (payment_status) {
    whereClause += ' AND payment_status = ?';
    params.push(payment_status);
  }

  if (customer_id) {
    whereClause += ' AND customer_id = ?';
    params.push(customer_id);
  }

  if (search) {
    whereClause += ' AND (order_number LIKE ? OR email LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  const offset = (page - 1) * pageSize;
  const orderBy = `${sortBy} ${sortOrder.toUpperCase()}`;

  const [items, totalResult] = await Promise.all([
    executeQuery<Order & {
      customer_first_name: string | null;
      customer_last_name: string | null;
      customer_email: string | null;
    }>(
      db,
      `SELECT 
        o.*,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ),
    executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM orders WHERE ${whereClause}`,
      params
    ),
  ]);

  // Mapear resultados para incluir objeto customer
  const mappedItems = (items || []).map(order => {
    const customer = order.customer_id ? {
      id: order.customer_id,
      email: order.customer_email || order.email,
      first_name: order.customer_first_name,
      last_name: order.customer_last_name,
      phone: null,
      date_of_birth: null,
      gender: null,
      is_active: 1,
      email_verified: 0,
      created_at: '',
      updated_at: '',
    } : undefined;

    const result: Order = {
      ...order,
      customer: customer,
    };

    // Remover campos temporários
    delete (result as any).customer_first_name;
    delete (result as any).customer_last_name;
    delete (result as any).customer_email;

    return result;
  });

  return {
    items: mappedItems,
    total: totalResult?.count || 0,
  };
}

export async function updateOrder(
  db: D1Database,
  id: number,
  data: Partial<{
    status: string;
    payment_status: string;
    fulfillment_status: string;
    notes: string | null;
  }>
): Promise<Order> {
  const order = await getOrder(db, id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const updateFields: string[] = [];
  const updateValues: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  });

  if (updateFields.length === 0) {
    return order;
  }

  updateFields.push('updated_at = ?');
  updateValues.push(new Date().toISOString());
  updateValues.push(id);

  await executeRun(
    db,
    `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const updated = await getOrder(db, id);
  if (!updated) {
    throw new Error('Failed to retrieve updated order');
  }

  return updated;
}

export async function updateOrderPayment(
  db: D1Database,
  id: number,
  paymentIntentId: string,
  chargeId?: string
): Promise<Order> {
  const order = await getOrder(db, id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  await executeRun(
    db,
    `UPDATE orders SET 
      payment_status = ?,
      status = ?,
      stripe_payment_intent_id = ?,
      stripe_charge_id = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      'paid',
      'paid',
      paymentIntentId,
      chargeId || null,
      new Date().toISOString(),
      id,
    ]
  );

  const updated = await getOrder(db, id);
  if (!updated) {
    throw new Error('Failed to retrieve updated order');
  }

  return updated;
}


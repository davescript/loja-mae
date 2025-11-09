import type { D1Database } from '@cloudflare/workers-types';
import { executeQuery, executeOne, executeRun } from '../utils/db';
import { NotFoundError, ValidationError } from '../utils/errors';
import { hashPassword, comparePassword } from '../utils/auth';
import type { Customer, Address } from '@shared/types';

export async function createCustomer(
  db: D1Database,
  data: {
    email: string;
    password: string;
    first_name?: string | null;
    last_name?: string | null;
  }
): Promise<Customer> {
  // Check if email exists
  const existing = await executeOne<{ id: number }>(
    db,
    'SELECT id FROM customers WHERE email = ?',
    [data.email.toLowerCase()]
  );

  if (existing) {
    throw new ValidationError('Email already registered');
  }

  const passwordHash = await hashPassword(data.password);

  const result = await executeRun(
    db,
    `INSERT INTO customers (email, password_hash, first_name, last_name)
     VALUES (?, ?, ?, ?)`,
    [
      data.email.toLowerCase(),
      passwordHash,
      data.first_name || null,
      data.last_name || null,
    ]
  );

  if (!result.success) {
    throw new Error('Failed to create customer');
  }

  const customer = await executeOne<Customer>(
    db,
    'SELECT id, email, first_name, last_name, phone, date_of_birth, gender, is_active, email_verified, created_at, updated_at FROM customers WHERE id = ?',
    [result.meta.last_row_id]
  );

  if (!customer) {
    throw new Error('Failed to retrieve created customer');
  }

  return customer;
}

export async function getCustomer(
  db: D1Database,
  id: number
): Promise<Customer | null> {
  return executeOne<Customer>(
    db,
    'SELECT id, email, first_name, last_name, phone, date_of_birth, gender, is_active, email_verified, created_at, updated_at FROM customers WHERE id = ?',
    [id]
  );
}

export async function getCustomerByEmail(
  db: D1Database,
  email: string
): Promise<Customer & { password_hash: string } | null> {
  return executeOne<Customer & { password_hash: string }>(
    db,
    'SELECT * FROM customers WHERE email = ?',
    [email.toLowerCase()]
  );
}

export async function verifyCustomerPassword(
  db: D1Database,
  email: string,
  password: string
): Promise<Customer | null> {
  const customer = await getCustomerByEmail(db, email);
  if (!customer) {
    return null;
  }

  const isValid = await comparePassword(password, customer.password_hash);
  if (!isValid) {
    return null;
  }

  if (customer.is_active === 0) {
    return null;
  }

  const { password_hash, ...customerData } = customer;
  return customerData;
}

export async function listCustomers(
  db: D1Database,
  filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    is_active?: number;
  } = {}
): Promise<{ items: Customer[]; total: number }> {
  const { page = 1, pageSize = 20, search, is_active } = filters;

  let whereClause = '1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (is_active !== undefined) {
    whereClause += ' AND is_active = ?';
    params.push(is_active);
  }

  const offset = (page - 1) * pageSize;

  const [items, totalResult] = await Promise.all([
    executeQuery<Customer>(
      db,
      `SELECT id, email, first_name, last_name, phone, date_of_birth, gender, is_active, email_verified, created_at, updated_at
       FROM customers WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ),
    executeOne<{ count: number }>(
      db,
      `SELECT COUNT(*) as count FROM customers WHERE ${whereClause}`,
      params
    ),
  ]);

  return {
    items: items || [],
    total: totalResult?.count || 0,
  };
}

export async function updateCustomer(
  db: D1Database,
  id: number,
  data: Partial<{
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
    is_active: number;
  }>
): Promise<Customer> {
  const customer = await getCustomer(db, id);
  if (!customer) {
    throw new NotFoundError('Customer not found');
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
    return customer;
  }

  updateFields.push('updated_at = ?');
  updateValues.push(new Date().toISOString());
  updateValues.push(id);

  await executeRun(
    db,
    `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const updated = await getCustomer(db, id);
  if (!updated) {
    throw new Error('Failed to retrieve updated customer');
  }

  return updated;
}

export async function createAddress(
  db: D1Database,
  customerId: number,
  data: {
    type: 'shipping' | 'billing' | 'both';
    first_name: string;
    last_name: string;
    company?: string | null;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string | null;
    is_default?: number;
  }
): Promise<Address> {
  const customer = await getCustomer(db, customerId);
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // If this is set as default, unset other defaults
  if (data.is_default === 1) {
    await executeRun(
      db,
      'UPDATE addresses SET is_default = 0 WHERE customer_id = ? AND type = ?',
      [customerId, data.type]
    );
  }

  const result = await executeRun(
    db,
    `INSERT INTO addresses (
      customer_id, type, first_name, last_name, company, address_line1, address_line2,
      city, state, postal_code, country, phone, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customerId,
      data.type,
      data.first_name,
      data.last_name,
      data.company || null,
      data.address_line1,
      data.address_line2 || null,
      data.city,
      data.state,
      data.postal_code,
      data.country,
      data.phone || null,
      data.is_default || 0,
    ]
  );

  if (!result.success) {
    throw new Error('Failed to create address');
  }

  const address = await executeOne<Address>(
    db,
    'SELECT * FROM addresses WHERE id = ?',
    [result.meta.last_row_id]
  );

  if (!address) {
    throw new Error('Failed to retrieve created address');
  }

  return address;
}

export async function getAddresses(
  db: D1Database,
  customerId: number
): Promise<Address[]> {
  return executeQuery<Address>(
    db,
    'SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC',
    [customerId]
  );
}

export async function updateAddress(
  db: D1Database,
  id: number,
  customerId: number,
  data: Partial<{
    type: 'shipping' | 'billing' | 'both';
    first_name: string;
    last_name: string;
    company: string | null;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string | null;
    is_default: number;
  }>
): Promise<Address> {
  const address = await executeOne<Address>(
    db,
    'SELECT * FROM addresses WHERE id = ? AND customer_id = ?',
    [id, customerId]
  );

  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // If this is set as default, unset other defaults
  if (data.is_default === 1) {
    await executeRun(
      db,
      'UPDATE addresses SET is_default = 0 WHERE customer_id = ? AND type = ? AND id != ?',
      [customerId, data.type || address.type, id]
    );
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
    return address;
  }

  updateFields.push('updated_at = ?');
  updateValues.push(new Date().toISOString());
  updateValues.push(id);

  await executeRun(
    db,
    `UPDATE addresses SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const updated = await executeOne<Address>(
    db,
    'SELECT * FROM addresses WHERE id = ?',
    [id]
  );

  if (!updated) {
    throw new Error('Failed to retrieve updated address');
  }

  return updated;
}

export async function deleteAddress(
  db: D1Database,
  id: number,
  customerId: number
): Promise<void> {
  const address = await executeOne<Address>(
    db,
    'SELECT * FROM addresses WHERE id = ? AND customer_id = ?',
    [id, customerId]
  );

  if (!address) {
    throw new NotFoundError('Address not found');
  }

  await executeRun(db, 'DELETE FROM addresses WHERE id = ?', [id]);
}


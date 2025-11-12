export type CartItem = {
  product_id: number;
  variant_id?: number | null;
  title: string;
  price_cents: number;
  quantity: number;
  image_url?: string | null;
};

const CART_KEY = 'loja_mae_cart';

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function getItems(): CartItem[] {
  return read();
}

export function addItem(item: CartItem) {
  const items = read();
  const idx = items.findIndex(
    (it) => it.product_id === item.product_id && (it.variant_id || null) === (item.variant_id || null)
  );
  if (idx >= 0) {
    items[idx].quantity += item.quantity;
  } else {
    items.push(item);
  }
  write(items);
}

export function updateQuantity(product_id: number, variant_id: number | null, quantity: number) {
  const items = read();
  const idx = items.findIndex(
    (it) => it.product_id === product_id && (it.variant_id || null) === (variant_id || null)
  );
  if (idx >= 0) {
    items[idx].quantity = Math.max(1, quantity);
    write(items);
  }
}

export function removeItem(product_id: number, variant_id: number | null) {
  const items = read().filter(
    (it) => !(it.product_id === product_id && (it.variant_id || null) === (variant_id || null))
  );
  write(items);
}

export function clearCart() {
  write([]);
}

export function getSubtotalCents(): number {
  return read().reduce((sum, it) => sum + it.price_cents * it.quantity, 0);
}

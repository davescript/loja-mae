/**
 * Generate PDF invoice for orders
 * Professional invoice design with modern styling
 */

/**
 * These templates interpolate customer-controlled data (name, address, notes)
 * directly into HTML served to admins/customers in a browser. Escape it —
 * otherwise a customer can plant a script in e.g. their address line 2 or
 * order notes that runs in an admin's session when they open the document.
 */
function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface InvoiceData {
  order_number: string;
  order_date: string;
  customer_name: string;
  customer_email: string;
  shipping_address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    first_name?: string;
    last_name?: string;
    address_line1?: string;
    address_line2?: string;
    phone?: string;
  };
  items: Array<{
    title: string;
    quantity: number;
    price_cents: number;
    total_cents: number;
  }>;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  payment_status?: string;
  payment_method?: string;
}

/**
 * Generate professional HTML invoice template
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCountryName = (code: string) => {
    const countries: Record<string, string> = {
      PT: 'Portugal',
      BR: 'Brasil',
      ES: 'Espanha',
      FR: 'França',
      GB: 'Reino Unido',
      US: 'Estados Unidos',
    };
    return countries[code.toUpperCase()] || code;
  };

  const addressLine1 = data.shipping_address.address_line1 || data.shipping_address.street || '';
  const addressLine2 = data.shipping_address.address_line2 || '';
  const fullName = data.shipping_address.first_name && data.shipping_address.last_name
    ? `${data.shipping_address.first_name} ${data.shipping_address.last_name}`
    : data.customer_name;
  const paymentStatusLabel = data.payment_status === 'paid' ? 'Pagamento Confirmado' : 'Pagamento Pendente';
  const paymentStatusClass = data.payment_status === 'paid' ? 'paid' : 'pending';
  const sanitizedBarcode = data.order_number.replace(/[^0-9A-Za-z]/g, '').toUpperCase() || '000000';

  return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura ${data.order_number} - Loja Mãe</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Libre+Barcode+39&display=swap');
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      --primary: #111827;
      --primary-dark: #0b1220;
      --secondary: #3b4258;
      --accent: #f3f4f6;
      --muted: #8792af;
      --surface: #ffffff;
      --background: radial-gradient(circle at top, #f4f6fb 0%, #eef0f8 45%, #e6e9f3 100%);
    }
    
    body {
      font-family: 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1c130a;
      background: var(--background);
      padding: 35px;
    }
    
    .invoice-shell {
      max-width: 900px;
      margin: 0 auto;
      background: var(--surface);
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 40px 90px rgba(36, 22, 11, 0.18);
      border: 1px solid rgba(255,255,255,0.8);
    }
    
    .hero {
      background: radial-gradient(circle at top left, rgba(255,255,255,0.35), rgba(255,255,255,0)),
                  linear-gradient(135deg, #1f2937 0%, #111827 60%, #0b1220 100%);
      color: white;
      padding: 42px 46px 38px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      overflow: hidden;
    }
    
    .hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url('data:image/svg+xml,%3Csvg width="350" height="350" viewBox="0 0 350 350" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Cpath d="M0 0h35v35H0z"/%3E%3C/g%3E%3C/svg%3E');
      opacity: 0.3;
      mix-blend-mode: soft-light;
      pointer-events: none;
    }
    
    .hero > * {
      position: relative;
    }
    
    .brand {
      max-width: 60%;
    }
    
    .brand h1 {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -1px;
      margin-bottom: 6px;
    }
    
    .brand p {
      font-size: 15px;
      opacity: 0.85;
    }
    
    .hero-info {
      text-align: right;
    }
    
    .invoice-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.35);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 16px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(6px);
    }
    
    .hero-number {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin-bottom: 6px;
    }
    
    .hero-meta {
      font-size: 13px;
      opacity: 0.8;
    }
    
    .barcode {
      font-family: 'Libre Barcode 39', 'Courier New', monospace;
      letter-spacing: 6px;
      margin-top: 18px;
      display: inline-block;
      padding: 8px 14px;
      border-radius: 16px;
      background: rgba(0,0,0,0.15);
      border: 1px solid rgba(255,255,255,0.15);
    }
    
    .content {
      padding: 40px 45px 50px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 35px;
    }
    
    .card {
      border: 1px solid rgba(17, 24, 39, 0.12);
      border-radius: 20px;
      padding: 20px 22px;
      background: linear-gradient(180deg, #ffffff 0%, #f5f6fb 100%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
    }
    
    .card h3 {
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1.3px;
      color: var(--muted);
      margin-bottom: 12px;
    }
    
    .card .value {
      font-size: 15px;
      margin-bottom: 5px;
      color: #1c130a;
    }
    
    .card .highlight {
      font-weight: 600;
      font-size: 18px;
      color: var(--primary);
    }
    
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status-pill.paid {
      background: rgba(16, 185, 129, 0.15);
      color: #047857;
    }
    
    .status-pill.pending {
      background: rgba(255, 200, 92, 0.2);
      color: #a16207;
    }
    
    .table-wrapper {
      border: 1px solid rgba(17, 24, 39, 0.08);
      border-radius: 22px;
      overflow: hidden;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    thead {
      background: linear-gradient(135deg, #1f2937 0%, #0f172a 100%);
      color: white;
    }
    
    th, td {
      padding: 16px 22px;
      text-align: left;
    }
    
    th {
      font-size: 12px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    tbody tr {
      background: #ffffff;
      border-bottom: 1px solid rgba(106, 93, 129, 0.08);
    }
    
    tbody tr:nth-child(even) {
      background: #f1f3f9;
    }
    
    td:last-child, th:last-child {
      text-align: right;
    }
    
    td:nth-child(2), th:nth-child(2),
    td:nth-child(3), th:nth-child(3) {
      text-align: center;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
      margin-bottom: 35px;
    }
    
    .totals-card {
      border-radius: 22px;
      padding: 24px;
      background: linear-gradient(160deg, #f3f5fb 0%, #e9edf7 100%);
      border: 1px solid rgba(17, 24, 39, 0.1);
      backdrop-filter: blur(6px);
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
      color: #56422f;
    }
    
    .totals-row.total {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed rgba(36,22,11,0.2);
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
    }
    
    .terms {
      border-radius: 18px;
      border: 1px dashed rgba(17,24,39,0.25);
      padding: 18px 22px;
      background: rgba(243, 244, 246, 0.9);
      margin-bottom: 35px;
      backdrop-filter: blur(4px);
    }
    
    .terms h4 {
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
      margin-bottom: 8px;
      color: var(--muted);
    }
    
    .signature {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 40px;
    }
    
    .signature .line {
      width: 240px;
      border-bottom: 1px solid rgba(0,0,0,0.2);
      margin-bottom: 6px;
    }
    
    .footer {
      text-align: center;
      padding: 26px;
      background: #120a04;
      color: rgba(255,255,255,0.85);
    }
    
    .footer p {
      margin: 4px 0;
      font-size: 13px;
    }
    
    /* Print Styles */
    @media print {
      body {
        padding: 0;
      }
      
      .invoice-shell {
        border-radius: 0;
        box-shadow: none;
      }
      
      .hero {
        page-break-after: avoid;
      }
      
      table {
        page-break-inside: avoid;
      }
      
      .totals-card {
        page-break-inside: avoid;
      }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .details-section {
        grid-template-columns: 1fr;
      }
      
      .footer-content {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-shell">
    <div class="hero">
      <div class="brand">
        <h1>Leia Sabores</h1>
        <p>Loja Mãe • Produtos premium e experiências gastronómicas</p>
      </div>
      <div class="hero-info">
        <div class="invoice-badge">Fatura</div>
        <div class="hero-number">${data.order_number}</div>
        <div class="hero-meta">Emitida em ${formatDate(data.order_date)}</div>
        <div class="barcode">${sanitizedBarcode.split('').join(' ')}</div>
      </div>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="card">
          <h3>Cliente</h3>
          <div class="highlight">${escapeHtml(fullName)}</div>
          <div class="value">${escapeHtml(data.customer_email)}</div>
          ${data.shipping_address.phone ? `<div class="value">Telefone: ${escapeHtml(data.shipping_address.phone)}</div>` : ''}
        </div>
        <div class="card">
          <h3>Entrega</h3>
          <div class="value">${escapeHtml(addressLine1) || '—'}</div>
          ${addressLine2 ? `<div class="value">${escapeHtml(addressLine2)}</div>` : ''}
          <div class="value">${escapeHtml(data.shipping_address.postal_code)} ${escapeHtml(data.shipping_address.city)}</div>
          <div class="value">${escapeHtml(getCountryName(data.shipping_address.country))}</div>
        </div>
        <div class="card">
          <h3>Pagamento</h3>
          ${data.payment_method ? `<div class="value">${escapeHtml(data.payment_method)}</div>` : '<div class="value">Não especificado</div>'}
          <div class="status-pill ${paymentStatusClass}">
            ${data.payment_status === 'paid' ? '✔' : '⏳'} ${paymentStatusLabel}
          </div>
        </div>
      </div>
      
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Qtd.</th>
              <th>Preço</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
            <tr>
              <td>${escapeHtml(item.title)}</td>
              <td>${item.quantity}</td>
              <td>${formatPrice(item.price_cents)}</td>
              <td>${formatPrice(item.total_cents)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="summary-grid">
        <div class="totals-card">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${formatPrice(data.subtotal_cents)}</span>
          </div>
          ${data.discount_cents > 0 ? `
          <div class="totals-row">
            <span>Desconto</span>
            <span>- ${formatPrice(data.discount_cents)}</span>
          </div>` : ''}
          ${data.shipping_cents > 0 ? `
          <div class="totals-row">
            <span>Portes</span>
            <span>${formatPrice(data.shipping_cents)}</span>
          </div>` : ''}
          ${data.tax_cents > 0 ? `
          <div class="totals-row">
            <span>IVA</span>
            <span>${formatPrice(data.tax_cents)}</span>
          </div>` : ''}
          <div class="totals-row total">
            <span>Total</span>
            <span>${formatPrice(data.total_cents)}</span>
          </div>
        </div>
        <div class="terms">
          <h4>Notas & Condições</h4>
          <p>Pagamentos confirmados através da nossa plataforma Stripe. Caso tenha alguma questão sobre este documento, contacte-nos em suporte@leiasabores.pt.</p>
          <p>Os produtos enviados fazem parte do portefólio premium da Loja Mãe, produzidos e embalados em Portugal.</p>
        </div>
      </div>
      
      <div class="signature">
        <div>
          <div class="line"></div>
          <div style="font-size:13px;color:#6b617f;">Representante Leia Sabores</div>
        </div>
        <div style="text-align:right;color:#6b617f;font-size:13px;">
          Obrigado por confiar na Loja Mãe.<br/>
          Partilhe a sua experiência em @leiasabores.
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Leia Sabores • Loja Mãe • www.leiasabores.pt</p>
      <p>Fatura gerada automaticamente em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface ShippingSlipData {
  order_number: string;
  order_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: {
    first_name?: string;
    last_name?: string;
    address_line1?: string;
    address_line2?: string;
    city: string;
    postal_code: string;
    state?: string;
    country: string;
    phone?: string;
  };
  items: Array<{
    title: string;
    quantity: number;
    price_cents: number;
  }>;
  total_cents: number;
  notes?: string | null;
}

export function generateShippingSlipHTML(data: ShippingSlipData): string {
  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });

  const countryNames: Record<string, string> = {
    PT: 'Portugal', BR: 'Brasil', ES: 'Espanha', FR: 'França', GB: 'Reino Unido', US: 'Estados Unidos',
  };

  const recipientName = data.shipping_address.first_name || data.shipping_address.last_name
    ? `${data.shipping_address.first_name || ''} ${data.shipping_address.last_name || ''}`.trim()
    : data.customer_name;
  const recipientPhone = data.shipping_address.phone || data.customer_phone || '';
  const addressLine1 = data.shipping_address.address_line1 || '';
  const addressLine2 = data.shipping_address.address_line2 || '';
  const city = `${data.shipping_address.postal_code} ${data.shipping_address.city}`.trim();
  const state = data.shipping_address.state || '';
  const country = countryNames[data.shipping_address.country?.toUpperCase()] || data.shipping_address.country || 'Portugal';

  const itemsHTML = data.items.map(item => `
    <tr>
      <td class="item-name">${escapeHtml(item.title)}</td>
      <td class="item-qty">${item.quantity}</td>
      <td class="item-price">${formatPrice(item.price_cents * item.quantity)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <title>Guia de Envio ${data.order_number}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 13px; color: #111; background: #fff; }

    .page { max-width: 780px; margin: 0 auto; }

    /* ── Top bar ── */
    .topbar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 16px; background: #111827; color: #fff; border-radius: 8px 8px 0 0;
    }
    .topbar .brand { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
    .topbar .order-ref { font-size: 13px; opacity: 0.8; }
    .topbar .order-num { font-size: 22px; font-weight: 700; letter-spacing: 2px; }

    /* ── Address block ── */
    .address-section {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0;
      border: 2px solid #111827; border-top: none;
    }
    .address-box { padding: 18px 20px; }
    .address-box + .address-box { border-left: 2px solid #111827; }
    .address-box .label {
      font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px;
      color: #6b7280; margin-bottom: 10px; font-weight: 700;
    }
    .address-box .main-name {
      font-size: 20px; font-weight: 800; line-height: 1.2; margin-bottom: 6px; color: #111;
    }
    .address-box .addr-line { font-size: 14px; line-height: 1.7; color: #222; }
    .address-box .phone { font-size: 13px; margin-top: 8px; color: #374151; }
    .address-box .phone span { font-weight: 700; }
    .highlight-box { background: #f0fdf4; border-left: 4px solid #16a34a !important; }

    /* ── Cut line ── */
    .cut-hint {
      text-align: center; font-size: 10px; color: #9ca3af;
      border-top: 1px dashed #d1d5db; padding: 4px 0; margin: 0;
      letter-spacing: 2px;
    }

    /* ── Items table ── */
    .items-section {
      margin-top: 16px;
      border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;
    }
    .items-header {
      background: #f9fafb; padding: 10px 16px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1px; color: #374151; border-bottom: 1px solid #e5e7eb;
      display: flex; justify-content: space-between;
    }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1f2937; color: #fff; padding: 10px 14px; font-size: 11px;
         text-transform: uppercase; letter-spacing: 0.8px; text-align: left; }
    th:nth-child(2), th:nth-child(3) { text-align: center; }
    td { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f9fafb; }
    .item-qty, .item-price { text-align: center; font-weight: 600; }

    /* ── Footer row ── */
    .footer-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 14px; padding: 12px 16px;
      background: #111827; color: #fff; border-radius: 0 0 8px 8px;
    }
    .footer-row .meta { font-size: 11px; opacity: 0.7; }
    .footer-row .total { font-size: 18px; font-weight: 800; }

    /* ── Notes ── */
    .notes-box {
      margin-top: 12px; padding: 12px 16px;
      border: 1px dashed #d1d5db; border-radius: 6px; background: #fffbeb;
      font-size: 12px; color: #555;
    }
    .notes-box strong { display: block; margin-bottom: 4px; color: #111; }

    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Top bar -->
  <div class="topbar">
    <div>
      <div class="brand">Leia Sabores</div>
      <div class="order-ref">Guia de Envio • ${formatDate(data.order_date)}</div>
    </div>
    <div style="text-align:right">
      <div class="order-ref">Nº do Pedido</div>
      <div class="order-num">#${data.order_number}</div>
    </div>
  </div>

  <!-- Address section -->
  <div class="address-section">
    <div class="address-box">
      <div class="label">Remetente (De)</div>
      <div class="main-name">Leia Sabores</div>
      <div class="addr-line">Loja Mãe — Produtos Premium</div>
      <div class="addr-line">Portugal</div>
      <div class="phone">Email: <span>suporte@leiasabores.pt</span></div>
    </div>
    <div class="address-box highlight-box">
      <div class="label">Destinatário (Para)</div>
      <div class="main-name">${escapeHtml(recipientName)}</div>
      <div class="addr-line">${escapeHtml(addressLine1)}</div>
      ${addressLine2 ? `<div class="addr-line">${escapeHtml(addressLine2)}</div>` : ''}
      <div class="addr-line">${escapeHtml(city)}</div>
      ${state ? `<div class="addr-line">${escapeHtml(state)}</div>` : ''}
      <div class="addr-line" style="font-weight:700">${escapeHtml(country)}</div>
      ${recipientPhone ? `<div class="phone">Tel: <span>${escapeHtml(recipientPhone)}</span></div>` : ''}
    </div>
  </div>

  <div class="cut-hint">✂ ─ ─ ─ ─ ─ ─ RECORTAR PARA ETIQUETA ─ ─ ─ ─ ─ ─ ✂</div>

  <!-- Items -->
  <div class="items-section">
    <div class="items-header">
      <span>Lista de Produtos — Pedido #${data.order_number}</span>
      <span>${data.items.reduce((sum, i) => sum + i.quantity, 0)} artigo(s)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Qtd.</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>${itemsHTML}</tbody>
    </table>
  </div>

  ${data.notes ? `<div class="notes-box"><strong>Notas do Pedido:</strong>${escapeHtml(data.notes)}</div>` : ''}

  <!-- Footer -->
  <div class="footer-row">
    <div class="meta">
      ${escapeHtml(data.customer_email)}<br>
      Gerado em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}
    </div>
    <div class="total">Total: ${formatPrice(data.total_cents)}</div>
  </div>

</div>
</body>
</html>`.trim();
}

/**
 * Generate PDF from HTML (placeholder - implement with actual PDF service)
 * 
 * For Cloudflare Workers, you can:
 * 1. Use an external service like PDFShift API
 * 2. Return HTML and let client generate PDF using jsPDF
 * 3. Use Cloudflare Workers with Puppeteer (if available)
 */
export async function generatePDF(html: string, env?: any): Promise<ArrayBuffer | null> {
  // Option 1: Use external PDF service (e.g., PDFShift)
  if (env?.PDFSHIFT_API_KEY) {
    try {
      const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${env.PDFSHIFT_API_KEY}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: html,
          format: 'A4',
          margin: '20mm',
        }),
      });

      if (response.ok) {
        return await response.arrayBuffer();
      }
    } catch (error) {
      console.error('PDFShift error:', error);
    }
  }

  // Option 2: Return null and let client handle PDF generation
  // The frontend can use jsPDF or print to PDF
  return null;
}

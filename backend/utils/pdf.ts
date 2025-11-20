/**
 * Generate PDF invoice for orders
 * Professional invoice design with modern styling
 */

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
      --primary: #7837EE;
      --primary-dark: #4C1FBF;
      --accent: #FF2D92;
      --muted: #706C80;
      --surface: #ffffff;
      --background: linear-gradient(145deg, #f8f5ff 0%, #fef2fb 100%);
    }
    
    body {
      font-family: 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1325;
      background: var(--background);
      padding: 35px;
    }
    
    .invoice-shell {
      max-width: 900px;
      margin: 0 auto;
      background: var(--surface);
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 30px 80px rgba(120, 55, 238, 0.15);
      border: 1px solid rgba(255,255,255,0.6);
    }
    
    .hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: white;
      padding: 40px 45px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
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
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.4);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }
    
    .hero-number {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    
    .hero-meta {
      font-size: 14px;
      opacity: 0.8;
    }
    
    .barcode {
      font-family: 'Libre Barcode 39', 'Courier New', monospace;
      letter-spacing: 6px;
      margin-top: 18px;
      display: inline-block;
      padding: 8px 12px;
      border-radius: 12px;
      background: rgba(255,255,255,0.15);
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
      border: 1px solid rgba(106, 93, 129, 0.15);
      border-radius: 18px;
      padding: 20px 22px;
      background: linear-gradient(180deg, #ffffff 0%, #fbf8ff 100%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
    }
    
    .card h3 {
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1.5px;
      color: var(--muted);
      margin-bottom: 12px;
    }
    
    .card .value {
      font-size: 15px;
      margin-bottom: 5px;
      color: #1a1325;
    }
    
    .card .highlight {
      font-weight: 600;
      font-size: 18px;
      color: var(--primary-dark);
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
      background: rgba(45, 212, 191, 0.18);
      color: #0f766e;
    }
    
    .status-pill.pending {
      background: rgba(255, 200, 92, 0.2);
      color: #a16207;
    }
    
    .table-wrapper {
      border: 1px solid rgba(106, 93, 129, 0.12);
      border-radius: 20px;
      overflow: hidden;
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    thead {
      background: linear-gradient(135deg, rgba(120,55,238,0.95) 0%, rgba(255,45,146,0.9) 100%);
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
      background: #fbf9ff;
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
      background: linear-gradient(150deg, #f8f5ff 0%, #fceefe 100%);
      border: 1px solid rgba(120, 55, 238, 0.15);
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
      color: #4b3b63;
    }
    
    .totals-row.total {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed rgba(120,55,238,0.4);
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-dark);
    }
    
    .terms {
      border-radius: 18px;
      border: 1px dashed rgba(106,93,129,0.3);
      padding: 18px 22px;
      background: #fffbfe;
      margin-bottom: 35px;
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
      background: #0c0224;
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
          <div class="highlight">${fullName}</div>
          <div class="value">${data.customer_email}</div>
          ${data.shipping_address.phone ? `<div class="value">Telefone: ${data.shipping_address.phone}</div>` : ''}
        </div>
        <div class="card">
          <h3>Entrega</h3>
          <div class="value">${addressLine1 || '—'}</div>
          ${addressLine2 ? `<div class="value">${addressLine2}</div>` : ''}
          <div class="value">${data.shipping_address.postal_code} ${data.shipping_address.city}</div>
          <div class="value">${getCountryName(data.shipping_address.country)}</div>
        </div>
        <div class="card">
          <h3>Pagamento</h3>
          ${data.payment_method ? `<div class="value">${data.payment_method}</div>` : '<div class="value">Não especificado</div>'}
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
              <td>${item.title}</td>
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

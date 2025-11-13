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

  return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura ${data.order_number} - Loja Mãe</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
      padding: 0;
    }
    
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 30mm 25mm;
      background: #ffffff;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 50px;
      padding-bottom: 30px;
      border-bottom: 3px solid #FF6B35;
    }
    
    .logo-section {
      flex: 1;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #FF6B35;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    .tagline {
      font-size: 12px;
      color: #666;
      font-weight: 400;
    }
    
    .invoice-info {
      text-align: right;
      background: #f8f9fa;
      padding: 20px 25px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    
    .invoice-info h1 {
      font-size: 36px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 15px;
      letter-spacing: -1px;
    }
    
    .invoice-info .invoice-number {
      font-size: 16px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .invoice-info .invoice-date {
      font-size: 14px;
      color: #666;
    }
    
    /* Details Section */
    .details-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 50px;
    }
    
    .detail-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #FF6B35;
    }
    
    .detail-box h2 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    .detail-box p {
      margin: 6px 0;
      color: #1a1a1a;
      font-size: 14px;
    }
    
    .detail-box .name {
      font-weight: 600;
      font-size: 16px;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    
    /* Products Table */
    .products-section {
      margin-bottom: 40px;
    }
    
    .products-section h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1a1a1a;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    thead {
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
      color: #ffffff;
    }
    
    th {
      padding: 16px 20px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    th.text-right {
      text-align: right;
    }
    
    tbody tr {
      border-bottom: 1px solid #e9ecef;
      transition: background-color 0.2s;
    }
    
    tbody tr:hover {
      background-color: #f8f9fa;
    }
    
    tbody tr:last-child {
      border-bottom: none;
    }
    
    td {
      padding: 18px 20px;
      color: #1a1a1a;
      font-size: 14px;
    }
    
    td.text-right {
      text-align: right;
      font-weight: 500;
    }
    
    .product-name {
      font-weight: 500;
      color: #1a1a1a;
    }
    
    .quantity {
      color: #666;
    }
    
    /* Totals Section */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 50px;
    }
    
    .totals-box {
      width: 350px;
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      border: 2px solid #e9ecef;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
      color: #1a1a1a;
    }
    
    .totals-row:not(.total-row) {
      border-bottom: 1px solid #e9ecef;
    }
    
    .totals-row .label {
      color: #666;
    }
    
    .totals-row .value {
      font-weight: 500;
      color: #1a1a1a;
    }
    
    .totals-row.total-row {
      margin-top: 15px;
      padding-top: 20px;
      border-top: 3px solid #FF6B35;
      border-bottom: 3px solid #FF6B35;
      font-size: 20px;
      font-weight: 700;
    }
    
    .totals-row.total-row .label {
      color: #1a1a1a;
      font-size: 18px;
    }
    
    .totals-row.total-row .value {
      color: #FF6B35;
      font-size: 24px;
    }
    
    .discount-row .value {
      color: #28a745;
    }
    
    /* Payment Status */
    .payment-status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 10px;
    }
    
    .payment-status.paid {
      background: #d4edda;
      color: #155724;
    }
    
    .payment-status.pending {
      background: #fff3cd;
      color: #856404;
    }
    
    /* Footer */
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      text-align: center;
    }
    
    .footer-content {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .footer-column h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    .footer-column p {
      font-size: 13px;
      color: #666;
      line-height: 1.8;
    }
    
    .footer-bottom {
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      font-size: 11px;
      color: #999;
    }
    
    .footer-bottom p {
      margin: 4px 0;
    }
    
    /* Print Styles */
    @media print {
      body {
        padding: 0;
      }
      
      .invoice-container {
        padding: 15mm 20mm;
      }
      
      .header {
        page-break-after: avoid;
      }
      
      table {
        page-break-inside: avoid;
      }
      
      .totals-box {
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
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="logo">Leia Sabores</div>
        <div class="tagline">Loja Mãe - Produtos Artesanais</div>
      </div>
      <div class="invoice-info">
        <h1>FATURA</h1>
        <div class="invoice-number">
          <strong>Nº:</strong> ${data.order_number}
        </div>
        <div class="invoice-date">
          <strong>Data:</strong> ${formatDate(data.order_date)}
        </div>
        ${data.payment_status ? `
        <div class="payment-status ${data.payment_status}">
          ${data.payment_status === 'paid' ? '✓ Pago' : 'Pendente'}
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Details -->
    <div class="details-section">
      <div class="detail-box">
        <h2>Cliente</h2>
        <p class="name">${fullName}</p>
        <p>${data.customer_email}</p>
        ${data.shipping_address.phone ? `<p>📞 ${data.shipping_address.phone}</p>` : ''}
      </div>
      <div class="detail-box">
        <h2>Endereço de Entrega</h2>
        <p class="name">${fullName}</p>
        ${addressLine1 ? `<p>${addressLine1}</p>` : ''}
        ${addressLine2 ? `<p>${addressLine2}</p>` : ''}
        <p>${data.shipping_address.postal_code} ${data.shipping_address.city}</p>
        <p>${getCountryName(data.shipping_address.country)}</p>
      </div>
    </div>

    <!-- Products -->
    <div class="products-section">
      <h2>Produtos</h2>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th class="text-right">Quantidade</th>
            <th class="text-right">Preço Unitário</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (item) => `
          <tr>
            <td class="product-name">${item.title}</td>
            <td class="text-right quantity">${item.quantity}</td>
            <td class="text-right">${formatPrice(item.price_cents)}</td>
            <td class="text-right">${formatPrice(item.total_cents)}</td>
          </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="label">Subtotal:</span>
          <span class="value">${formatPrice(data.subtotal_cents)}</span>
        </div>
        ${data.discount_cents > 0 ? `
        <div class="totals-row discount-row">
          <span class="label">Desconto:</span>
          <span class="value">-${formatPrice(data.discount_cents)}</span>
        </div>
        ` : ''}
        ${data.shipping_cents > 0 ? `
        <div class="totals-row">
          <span class="label">Portes de Envio:</span>
          <span class="value">${formatPrice(data.shipping_cents)}</span>
        </div>
        ` : ''}
        ${data.tax_cents > 0 ? `
        <div class="totals-row">
          <span class="label">IVA (23%):</span>
          <span class="value">${formatPrice(data.tax_cents)}</span>
        </div>
        ` : ''}
        <div class="totals-row total-row">
          <span class="label">Total:</span>
          <span class="value">${formatPrice(data.total_cents)}</span>
        </div>
        ${data.payment_method ? `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e9ecef; font-size: 12px; color: #666;">
          <strong>Método de Pagamento:</strong> ${data.payment_method}
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-column">
          <h3>Informações</h3>
          <p>
            Leia Sabores<br>
            Loja Mãe<br>
            Portugal
          </p>
        </div>
        <div class="footer-column">
          <h3>Contacto</h3>
          <p>
            Email: davecdl@outlook.com<br>
            Website: www.leiasabores.pt
          </p>
        </div>
        <div class="footer-column">
          <h3>Nota</h3>
          <p>
            Esta é uma fatura válida para efeitos fiscais. Guarde este documento.
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        <p><strong>Obrigado pela sua compra!</strong></p>
        <p>Esta fatura foi gerada automaticamente em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}</p>
      </div>
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

/**
 * Generate PDF invoice for orders
 * Uses a simple HTML to PDF approach via external service or Cloudflare Workers
 * 
 * For production, consider using:
 * - Cloudflare Workers with @cloudflare/puppeteer (if available)
 * - External service like PDFShift, HTMLPDF, or similar
 * - Or generate PDF client-side using jsPDF
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
}

/**
 * Generate HTML invoice template
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #667eea;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h1 {
      font-size: 28px;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-info p {
      margin: 5px 0;
      color: #666;
    }
    .details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .section {
      flex: 1;
      margin-right: 20px;
    }
    .section h2 {
      font-size: 14px;
      margin-bottom: 10px;
      color: #667eea;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    .section p {
      margin: 5px 0;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: #f5f5f5;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid #ddd;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totals-row.total {
      font-weight: bold;
      font-size: 16px;
      border-top: 2px solid #667eea;
      border-bottom: 2px solid #667eea;
      padding: 12px 0;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Loja Mãe</div>
    <div class="invoice-info">
      <h1>FATURA</h1>
      <p><strong>Número:</strong> ${data.order_number}</p>
      <p><strong>Data:</strong> ${new Date(data.order_date).toLocaleDateString('pt-PT')}</p>
    </div>
  </div>

  <div class="details">
    <div class="section">
      <h2>Cliente</h2>
      <p><strong>${data.customer_name}</strong></p>
      <p>${data.customer_email}</p>
    </div>
    <div class="section">
      <h2>Endereço de Entrega</h2>
      <p>${data.shipping_address.street}</p>
      <p>${data.shipping_address.postal_code} ${data.shipping_address.city}</p>
      <p>${data.shipping_address.country}</p>
    </div>
  </div>

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
        <td>${item.title}</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">${formatPrice(item.price_cents)}</td>
        <td class="text-right">${formatPrice(item.total_cents)}</td>
      </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${formatPrice(data.subtotal_cents)}</span>
    </div>
    ${data.discount_cents > 0 ? `
    <div class="totals-row">
      <span>Desconto:</span>
      <span>-${formatPrice(data.discount_cents)}</span>
    </div>
    ` : ''}
    ${data.shipping_cents > 0 ? `
    <div class="totals-row">
      <span>Portes:</span>
      <span>${formatPrice(data.shipping_cents)}</span>
    </div>
    ` : ''}
    ${data.tax_cents > 0 ? `
    <div class="totals-row">
      <span>IVA:</span>
      <span>${formatPrice(data.tax_cents)}</span>
    </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total:</span>
      <span>${formatPrice(data.total_cents)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Obrigado pela sua compra!</p>
    <p>Loja Mãe - www.leiasabores.pt</p>
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


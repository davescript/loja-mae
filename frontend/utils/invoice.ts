/**
 * Utility functions for invoice PDF generation
 */

/**
 * Download invoice as PDF by opening in new window and triggering print
 */
export function downloadInvoicePDF(orderId: number | string): void {
  const url = `${import.meta.env.VITE_API_BASE_URL || 'https://api.leiasabores.pt'}/api/orders/${orderId}/invoice`;
  
  // Open in new window
  const printWindow = window.open(url, '_blank');
  
  if (printWindow) {
    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  } else {
    // Fallback: direct download
    window.location.href = url;
  }
}

/**
 * Download invoice as HTML file
 */
export function downloadInvoiceHTML(orderId: number | string): void {
  const url = `${import.meta.env.VITE_API_BASE_URL || 'https://api.leiasabores.pt'}/api/orders/${orderId}/invoice`;
  
  fetch(url)
    .then(response => response.text())
    .then(html => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${orderId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Error downloading invoice:', error);
      // Fallback: open in new window
      window.open(url, '_blank');
    });
}

/**
 * View invoice in new tab
 */
export function viewInvoice(orderId: number | string): void {
  const url = `${import.meta.env.VITE_API_BASE_URL || 'https://api.leiasabores.pt'}/api/orders/${orderId}/invoice`;
  window.open(url, '_blank');
}


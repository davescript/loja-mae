/**
 * Utility functions for invoice PDF generation
 */

import { API_BASE_URL } from './api';

/**
 * Download invoice as PDF by fetching with credentials and opening in new window
 */
export async function downloadInvoicePDF(orderId: number | string): Promise<void> {
  const url = `${API_BASE_URL}/api/orders/${orderId}/invoice`;
  
  try {
    // Get auth token from localStorage if available
    const token = localStorage.getItem('auth_token') || localStorage.getItem('customer_token') || localStorage.getItem('admin_token');
    const headers: HeadersInit = {
      'Accept': 'text/html',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fetch with credentials to include cookies/auth headers
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoice: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Create blob and open in new window
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    
    const printWindow = window.open(blobUrl, '_blank');
    
    if (printWindow) {
      // Wait for content to load, then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Clean up blob URL after a delay
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }, 500);
      };
    } else {
      // Fallback: download as HTML file
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `fatura-${orderId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error('Error downloading invoice:', error);
    // Fallback: try direct open (might work if session cookie is set)
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => printWindow.print(), 500);
      };
    }
  }
}

/**
 * Download invoice as HTML file
 */
export async function downloadInvoiceHTML(orderId: number | string): Promise<void> {
  const url = `${API_BASE_URL}/api/orders/${orderId}/invoice`;
  
  try {
    // Get auth token from localStorage if available
    const token = localStorage.getItem('auth_token') || localStorage.getItem('customer_token');
    const headers: HeadersInit = {
      'Accept': 'text/html',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch invoice: ${response.statusText}`);
    }
    
    const html = await response.text();
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `fatura-${orderId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    // Fallback: open in new window
    window.open(url, '_blank');
  }
}

/**
 * View invoice in new tab (with authentication)
 */
export async function viewInvoice(orderId: number | string): Promise<void> {
  const url = `${API_BASE_URL}/api/orders/${orderId}/invoice`;
  
  try {
    // Get auth token from localStorage if available
    const token = localStorage.getItem('auth_token') || localStorage.getItem('customer_token');
    const headers: HeadersInit = {
      'Accept': 'text/html',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fetch with credentials
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoice: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Create blob and open in new window
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    
    const viewWindow = window.open(blobUrl, '_blank');
    
    if (!viewWindow) {
      // Fallback: download as HTML file
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `fatura-${orderId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    // Clean up blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('Error viewing invoice:', error);
    // Fallback: try direct open
    window.open(url, '_blank');
  }
}


/**
 * Utilitários de formatação para Portugal
 */

/**
 * Formata preço em centavos para Euro (€)
 * @param priceCents Preço em centavos
 * @returns String formatada: "€ 29,99"
 */
export function formatPrice(priceCents: number | null | undefined): string {
  if (priceCents === null || priceCents === undefined) {
    return '€ 0,00';
  }
  
  const euros = priceCents / 100;
  return `€ ${euros.toFixed(2).replace('.', ',')}`;
}

/**
 * Formata número para padrão português
 * @param value Número a formatar
 * @param decimals Número de casas decimais (padrão: 2)
 * @returns String formatada: "1.234,56"
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals).replace('.', ',');
}


export function formatCurrency(amount: number, currencyCode: string = 'BRL') {
  // Determine locale based on currency for standard formatting, or just use pt-BR for everything and change currency
  // Using a generic way:
  const locale = currencyCode === 'USD' ? 'en-US' : currencyCode === 'EUR' ? 'de-DE' : 'pt-BR';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount);
}

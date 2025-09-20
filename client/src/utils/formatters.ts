/**
 * Unified formatting utilities for numbers and currencies
 * Solves the "ليس رقمًا LYD" issue and standardizes number formatting across the system
 */

// Default locale for Libya
export const DEFAULT_LOCALE = 'ar-LY';
export const FALLBACK_LOCALE = 'ar-EG';
export const DEFAULT_CURRENCY = 'LYD';

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  LYD: 'د.ل',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'ر.س',
  AED: 'د.إ',
  EGP: 'ج.م'
};

/**
 * Safely parse a value to number
 */
export function safeParseNumber(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point and minus
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
  }
  
  const parsed = Number(value);
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
}

/**
 * Format number with proper Arabic locale and thousand separators
 */
export function formatNumber(
  value: any,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
    locale = DEFAULT_LOCALE
  } = options;
  
  const num = safeParseNumber(value);
  
  try {
    // Try with primary locale
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping
    }).format(num);
  } catch (error) {
    try {
      // Fallback to secondary locale
      return new Intl.NumberFormat(FALLBACK_LOCALE, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      }).format(num);
    } catch (fallbackError) {
      // Final fallback - manual formatting
      return num.toFixed(maximumFractionDigits);
    }
  }
}

/**
 * Format currency amount (number only, without currency symbol)
 */
export function formatCurrencyAmount(
  value: any,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showZeroDecimals?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showZeroDecimals = true,
    locale = DEFAULT_LOCALE
  } = options;
  
  const num = safeParseNumber(value);
  
  // If it's a whole number and showZeroDecimals is false, don't show decimals
  const isWholeNumber = num % 1 === 0;
  const finalMinDecimals = (!showZeroDecimals && isWholeNumber) ? 0 : minimumFractionDigits;
  const finalMaxDecimals = (!showZeroDecimals && isWholeNumber) ? 0 : maximumFractionDigits;
  
  return formatNumber(num, {
    minimumFractionDigits: finalMinDecimals,
    maximumFractionDigits: finalMaxDecimals,
    useGrouping: true,
    locale
  });
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string = DEFAULT_CURRENCY): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
}

/**
 * Format complete currency display (amount + symbol)
 */
export function formatCurrency(
  value: any,
  currency: string = DEFAULT_CURRENCY,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showZeroDecimals?: boolean;
    symbolPosition?: 'before' | 'after';
    locale?: string;
  } = {}
): string {
  const {
    symbolPosition = 'after',
    ...formatOptions
  } = options;
  
  const amount = formatCurrencyAmount(value, formatOptions);
  const symbol = getCurrencySymbol(currency);
  
  return symbolPosition === 'before' 
    ? `${symbol} ${amount}`
    : `${amount} ${symbol}`;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: any,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = 1,
    maximumFractionDigits = 2,
    locale = DEFAULT_LOCALE
  } = options;
  
  const num = safeParseNumber(value);
  const formatted = formatNumber(num, {
    minimumFractionDigits,
    maximumFractionDigits,
    locale
  });
  
  return `${formatted}%`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(
  value: any,
  options: {
    locale?: string;
    notation?: 'compact' | 'standard';
  } = {}
): string {
  const {
    locale = DEFAULT_LOCALE,
    notation = 'compact'
  } = options;
  
  const num = safeParseNumber(value);
  
  if (notation === 'standard' || num < 1000) {
    return formatNumber(num, { locale });
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(num);
  } catch (error) {
    // Manual compact formatting fallback
    if (num >= 1000000000) {
      return `${formatNumber(num / 1000000000, { maximumFractionDigits: 1, locale })}B`;
    } else if (num >= 1000000) {
      return `${formatNumber(num / 1000000, { maximumFractionDigits: 1, locale })}M`;
    } else if (num >= 1000) {
      return `${formatNumber(num / 1000, { maximumFractionDigits: 1, locale })}K`;
    }
    return formatNumber(num, { locale });
  }
}

/**
 * Parse formatted number string back to number
 */
export function parseFormattedNumber(formattedValue: string): number {
  if (!formattedValue || typeof formattedValue !== 'string') {
    return 0;
  }
  
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = formattedValue
    .replace(/[^\d.-]/g, '')
    .replace(/^-+/, '-') // Keep only first minus sign
    .replace(/-+$/, ''); // Remove trailing minus signs
  
  return safeParseNumber(cleaned);
}

/**
 * Validate if a value is a valid number
 */
export function isValidNumber(value: any): boolean {
  const num = safeParseNumber(value);
  return isFinite(num) && !isNaN(num);
}

/**
 * Format number for input fields (removes grouping separators)
 */
export function formatNumberForInput(value: any): string {
  const num = safeParseNumber(value);
  return num.toString();
}

/**
 * Format decimal places consistently
 */
export function formatDecimal(
  value: any,
  decimalPlaces: number = 2,
  locale: string = DEFAULT_LOCALE
): string {
  const num = safeParseNumber(value);
  return formatNumber(num, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    locale
  });
}

/**
 * Format number with custom thousand separator and decimal separator
 */
export function formatNumberCustom(
  value: any,
  thousandSeparator: string = ',',
  decimalSeparator: string = '.',
  decimalPlaces: number = 2
): string {
  const num = safeParseNumber(value);
  const fixed = num.toFixed(decimalPlaces);
  const parts = fixed.split('.');
  
  // Add thousand separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  return parts.join(decimalSeparator);
}

// Export commonly used formatters with default settings
export const formatDate = (date: Date | string | null | undefined, format: string = 'yyyy-mm-dd'): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'dd/mm/yyyy':
      return `${day}/${month}/${year}`;
    case 'mm/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'yyyy-mm-dd':
    default:
      return `${year}-${month}-${day}`;
  }
};

export const formatters = {
  currency: (value: any, currency?: string) => formatCurrency(value, currency),
  currencyAmount: (value: any) => formatCurrencyAmount(value),
  number: (value: any) => formatNumber(value),
  percentage: (value: any) => formatPercentage(value),
  compact: (value: any) => formatCompactNumber(value),
  decimal: (value: any, places?: number) => formatDecimal(value, places),
  date: (value: any) => {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleDateString('ar-LY');
  }
};

// Export individual functions for direct import


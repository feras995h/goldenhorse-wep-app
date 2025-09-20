/**
 * Unified formatting utilities for numbers and currencies (Server-side)
 * Solves the "ليس رقمًا LYD" issue and standardizes number formatting across the system
 */

// Default locale for Libya
const DEFAULT_LOCALE = 'ar-LY';
const FALLBACK_LOCALE = 'ar-EG';
const DEFAULT_CURRENCY = 'LYD';

// Currency symbols mapping
const CURRENCY_SYMBOLS = {
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
function safeParseNumber(value) {
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
function formatNumber(value, options = {}) {
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
function formatCurrencyAmount(value, options = {}) {
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
function getCurrencySymbol(currency = DEFAULT_CURRENCY) {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
}

/**
 * Format complete currency display (amount + symbol)
 */
function formatCurrency(value, currency = DEFAULT_CURRENCY, options = {}) {
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
function formatPercentage(value, options = {}) {
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
function formatCompactNumber(value, options = {}) {
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
function parseFormattedNumber(formattedValue) {
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
function isValidNumber(value) {
  const num = safeParseNumber(value);
  return isFinite(num) && !isNaN(num);
}

/**
 * Format number for input fields (removes grouping separators)
 */
function formatNumberForInput(value) {
  const num = safeParseNumber(value);
  return num.toString();
}

/**
 * Format decimal places consistently
 */
function formatDecimal(value, decimalPlaces = 2, locale = DEFAULT_LOCALE) {
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
function formatNumberCustom(value, thousandSeparator = ',', decimalSeparator = '.', decimalPlaces = 2) {
  const num = safeParseNumber(value);
  const fixed = num.toFixed(decimalPlaces);
  const parts = fixed.split('.');
  
  // Add thousand separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  return parts.join(decimalSeparator);
}

/**
 * Format financial amounts for API responses
 */
function formatFinancialResponse(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const formatted = { ...data };
  
  // Common financial fields to format
  const financialFields = [
    'amount', 'balance', 'total', 'subtotal', 'tax', 'discount',
    'credit', 'debit', 'openingBalance', 'closingBalance',
    'totalAmount', 'paidAmount', 'remainingAmount',
    'unitPrice', 'totalPrice', 'cost', 'value'
  ];
  
  financialFields.forEach(field => {
    if (formatted[field] !== undefined && formatted[field] !== null) {
      // Keep the original numeric value but add formatted version
      formatted[`${field}Formatted`] = formatCurrencyAmount(formatted[field]);
    }
  });
  
  return formatted;
}

/**
 * Format array of financial data
 */
function formatFinancialArray(dataArray) {
  if (!Array.isArray(dataArray)) {
    return dataArray;
  }
  
  return dataArray.map(item => formatFinancialResponse(item));
}

// Export commonly used formatters with default settings
const formatters = {
  currency: (value, currency) => formatCurrency(value, currency),
  currencyAmount: (value) => formatCurrencyAmount(value),
  number: (value) => formatNumber(value),
  percentage: (value) => formatPercentage(value),
  compact: (value) => formatCompactNumber(value),
  decimal: (value, places) => formatDecimal(value, places)
};

export {
  // Core functions
  safeParseNumber,
  formatNumber,
  formatCurrencyAmount,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  formatDecimal,
  formatNumberCustom,
  formatNumberForInput,

  // Utility functions
  getCurrencySymbol,
  parseFormattedNumber,
  isValidNumber,

  // API response formatters
  formatFinancialResponse,
  formatFinancialArray,

  // Constants
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  DEFAULT_CURRENCY,
  CURRENCY_SYMBOLS,

  // Convenience object
  formatters
};

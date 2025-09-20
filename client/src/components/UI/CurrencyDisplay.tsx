import React from 'react';
import { formatCurrency, formatCurrencyAmount, getCurrencySymbol, DEFAULT_CURRENCY } from '../../utils/formatters';

interface CurrencyDisplayProps {
  /** The amount to display */
  value: number | string | null | undefined;
  
  /** Currency code (default: LYD) */
  currency?: string;
  
  /** Whether to show currency symbol */
  showSymbol?: boolean;
  
  /** Position of currency symbol */
  symbolPosition?: 'before' | 'after';
  
  /** Minimum decimal places */
  minimumFractionDigits?: number;
  
  /** Maximum decimal places */
  maximumFractionDigits?: number;
  
  /** Whether to show zero decimals for whole numbers */
  showZeroDecimals?: boolean;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Color scheme */
  color?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether to show compact notation for large numbers */
  compact?: boolean;
  
  /** Custom prefix text */
  prefix?: string;
  
  /** Custom suffix text */
  suffix?: string;
  
  /** Whether the amount is clickable */
  onClick?: () => void;
  
  /** Tooltip text */
  title?: string;
}

const colorClasses = {
  default: 'text-gray-900',
  success: 'text-green-600',
  danger: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600'
};

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  currency = DEFAULT_CURRENCY,
  showSymbol = true,
  symbolPosition = 'after',
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  showZeroDecimals = true,
  className = '',
  color = 'default',
  size = 'md',
  compact = false,
  prefix = '',
  suffix = '',
  onClick,
  title
}) => {
  // Format the amount
  const formattedAmount = formatCurrencyAmount(value, {
    minimumFractionDigits,
    maximumFractionDigits,
    showZeroDecimals
  });
  
  // Get currency symbol
  const symbol = getCurrencySymbol(currency);
  
  // Build display text
  let displayText = '';
  
  if (prefix) {
    displayText += prefix + ' ';
  }
  
  if (showSymbol) {
    if (symbolPosition === 'before') {
      displayText += symbol + ' ' + formattedAmount;
    } else {
      displayText += formattedAmount + ' ' + symbol;
    }
  } else {
    displayText += formattedAmount;
  }
  
  if (suffix) {
    displayText += ' ' + suffix;
  }
  
  // Build CSS classes
  const cssClasses = [
    colorClasses[color],
    sizeClasses[size],
    'font-medium',
    'tabular-nums', // For better number alignment
    onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <span
      className={cssClasses}
      onClick={onClick}
      title={title}
      dir="ltr" // Left-to-right for numbers
    >
      {displayText}
    </span>
  );
};

export default CurrencyDisplay;

// Specialized components for common use cases
export const CurrencyAmount: React.FC<Omit<CurrencyDisplayProps, 'showSymbol'>> = (props) => (
  <CurrencyDisplay {...props} showSymbol={false} />
);

export const CurrencySymbol: React.FC<{ currency?: string; className?: string }> = ({ 
  currency = DEFAULT_CURRENCY, 
  className = '' 
}) => (
  <span className={`text-gray-500 ${className}`}>
    {getCurrencySymbol(currency)}
  </span>
);

export const PositiveCurrency: React.FC<CurrencyDisplayProps> = (props) => (
  <CurrencyDisplay {...props} color="success" />
);

export const NegativeCurrency: React.FC<CurrencyDisplayProps> = (props) => (
  <CurrencyDisplay {...props} color="danger" />
);

export const LargeCurrency: React.FC<CurrencyDisplayProps> = (props) => (
  <CurrencyDisplay {...props} size="lg" compact />
);

// Hook for currency formatting
export const useCurrencyFormatter = (currency: string = DEFAULT_CURRENCY) => {
  return React.useCallback((
    value: number | string | null | undefined,
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      showZeroDecimals?: boolean;
      showSymbol?: boolean;
    }
  ) => {
    const {
      showSymbol = true,
      ...formatOptions
    } = options || {};
    
    if (showSymbol) {
      return formatCurrency(value, currency, formatOptions);
    } else {
      return formatCurrencyAmount(value, formatOptions);
    }
  }, [currency]);
};

import React from 'react';
import { formatCurrency, safeParseNumber } from '../../utils/formatters';

interface SafeCurrencyDisplayProps {
  value: any;
  currency?: string;
  className?: string;
  color?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSymbol?: boolean;
  symbolPosition?: 'before' | 'after';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showZeroDecimals?: boolean;
  prefix?: string;
  suffix?: string;
  onClick?: () => void;
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

const SafeCurrencyDisplay: React.FC<SafeCurrencyDisplayProps> = ({
  value,
  currency = 'LYD',
  className = '',
  color = 'default',
  size = 'md',
  showSymbol = true,
  symbolPosition = 'after',
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  showZeroDecimals = true,
  prefix = '',
  suffix = '',
  onClick,
  title
}) => {
  // Safely parse the value to prevent "ليس رقماً" errors
  const safeValue = safeParseNumber(value);
  
  // Format the currency using our safe formatter
  const formatted = formatCurrency(safeValue, currency, {
    minimumFractionDigits,
    maximumFractionDigits,
    showZeroDecimals,
    symbolPosition: showSymbol ? symbolPosition : 'after'
  });
  
  // Build display text
  let displayText = '';
  
  if (prefix) {
    displayText += prefix + ' ';
  }
  
  if (!showSymbol) {
    // Remove currency symbol if not needed
    displayText += safeValue.toLocaleString('ar-LY', {
      minimumFractionDigits,
      maximumFractionDigits
    });
  } else {
    displayText += formatted;
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

export default SafeCurrencyDisplay;

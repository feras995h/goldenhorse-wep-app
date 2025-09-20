import React from 'react';
import { formatNumber, safeParseNumber } from '../../utils/formatters';

interface SafeNumberDisplayProps {
  value: any;
  className?: string;
  color?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type?: 'number' | 'percentage' | 'decimal';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
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

const SafeNumberDisplay: React.FC<SafeNumberDisplayProps> = ({
  value,
  className = '',
  color = 'default',
  size = 'md',
  type = 'number',
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
  useGrouping = true,
  prefix = '',
  suffix = '',
  onClick,
  title
}) => {
  // Safely parse the value to prevent "ليس رقماً" errors
  const safeValue = safeParseNumber(value);
  
  // Format the number based on type
  let formatted = '';
  
  switch (type) {
    case 'percentage':
      formatted = formatNumber(safeValue, {
        minimumFractionDigits: minimumFractionDigits || 1,
        maximumFractionDigits: maximumFractionDigits || 2,
        useGrouping
      }) + '%';
      break;
    case 'decimal':
      formatted = formatNumber(safeValue, {
        minimumFractionDigits: minimumFractionDigits || 2,
        maximumFractionDigits: maximumFractionDigits || 2,
        useGrouping
      });
      break;
    default:
      formatted = formatNumber(safeValue, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      });
  }
  
  // Build display text
  let displayText = '';
  
  if (prefix) {
    displayText += prefix + ' ';
  }
  
  displayText += formatted;
  
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

export default SafeNumberDisplay;

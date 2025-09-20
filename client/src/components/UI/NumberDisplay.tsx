import React from 'react';
import { formatNumber, formatPercentage, formatCompactNumber, formatDecimal } from '../../utils/formatters';

interface NumberDisplayProps {
  /** The number to display */
  value: number | string | null | undefined;
  
  /** Type of number formatting */
  type?: 'number' | 'percentage' | 'compact' | 'decimal' | 'absolute';
  
  /** Minimum decimal places */
  minimumFractionDigits?: number;
  
  /** Maximum decimal places */
  maximumFractionDigits?: number;
  
  /** Whether to use grouping separators (thousands) */
  useGrouping?: boolean;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Color scheme */
  color?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'muted';
  
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Custom prefix text */
  prefix?: string;
  
  /** Custom suffix text */
  suffix?: string;
  
  /** Whether the number is clickable */
  onClick?: () => void;
  
  /** Tooltip text */
  title?: string;
  
  /** Whether to highlight positive/negative values */
  highlightSign?: boolean;
  
  /** Custom locale */
  locale?: string;
}

const colorClasses = {
  default: 'text-gray-900',
  success: 'text-green-600',
  danger: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
  muted: 'text-gray-500'
};

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

const NumberDisplay: React.FC<NumberDisplayProps> = ({
  value,
  type = 'number',
  minimumFractionDigits,
  maximumFractionDigits,
  useGrouping = true,
  className = '',
  color = 'default',
  size = 'md',
  prefix = '',
  suffix = '',
  onClick,
  title,
  highlightSign = false,
  locale
}) => {
  // Format the number based on type
  const formatValue = () => {
    const options = {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
      locale
    };
    
    switch (type) {
      case 'percentage':
        return formatPercentage(value, options);
      case 'compact':
        return formatCompactNumber(value, { locale });
      case 'decimal':
        return formatDecimal(value, maximumFractionDigits, locale);
      default:
        return formatNumber(value, options);
    }
  };
  
  const formattedValue = formatValue();
  
  // Determine color based on sign if highlightSign is true
  let finalColor = color;
  if (highlightSign && typeof value === 'number') {
    if (value > 0) {
      finalColor = 'success';
    } else if (value < 0) {
      finalColor = 'danger';
    }
  }
  
  // Build display text
  let displayText = '';
  
  if (prefix) {
    displayText += prefix + ' ';
  }
  
  displayText += formattedValue;
  
  if (suffix) {
    displayText += ' ' + suffix;
  }
  
  // Build CSS classes
  const cssClasses = [
    colorClasses[finalColor],
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

export default NumberDisplay;

// Specialized components for common use cases
export const PercentageDisplay: React.FC<Omit<NumberDisplayProps, 'type'>> = (props) => (
  <NumberDisplay {...props} type="percentage" />
);

export const CompactNumberDisplay: React.FC<Omit<NumberDisplayProps, 'type'>> = (props) => (
  <NumberDisplay {...props} type="compact" />
);

export const DecimalDisplay: React.FC<Omit<NumberDisplayProps, 'type'>> = (props) => (
  <NumberDisplay {...props} type="decimal" />
);

export const PositiveNumber: React.FC<NumberDisplayProps> = (props) => (
  <NumberDisplay {...props} color="success" />
);

export const NegativeNumber: React.FC<NumberDisplayProps> = (props) => (
  <NumberDisplay {...props} color="danger" />
);

export const SignHighlightNumber: React.FC<NumberDisplayProps> = (props) => (
  <NumberDisplay {...props} highlightSign />
);

// Statistics display component
interface StatNumberProps {
  value: number | string | null | undefined;
  label: string;
  change?: number;
  changeType?: 'percentage' | 'absolute';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatNumber: React.FC<StatNumberProps> = ({
  value,
  label,
  change,
  changeType = 'percentage',
  size = 'md',
  className = ''
}) => {
  const sizeConfig = {
    sm: { valueSize: 'lg', labelSize: 'sm' },
    md: { valueSize: 'xl', labelSize: 'md' },
    lg: { valueSize: '2xl', labelSize: 'lg' }
  };
  
  const config = sizeConfig[size];
  
  return (
    <div className={`text-center ${className}`}>
      <NumberDisplay
        value={value}
        size={config.valueSize as any}
        className="font-bold block"
      />
      <div className={`text-gray-600 ${sizeClasses[config.labelSize as keyof typeof sizeClasses]} mt-1`}>
        {label}
      </div>
      {change !== undefined && (
        <div className="mt-1">
          <NumberDisplay
            value={change}
            type={changeType}
            highlightSign
            size="sm"
            prefix={change > 0 ? '+' : ''}
          />
        </div>
      )}
    </div>
  );
};

// Hook for number formatting
export const useNumberFormatter = () => {
  return React.useCallback((
    value: number | string | null | undefined,
    options?: {
      type?: 'number' | 'percentage' | 'compact' | 'decimal' | 'absolute';
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      useGrouping?: boolean;
      locale?: string;
    }
  ) => {
    const {
      type = 'number',
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping = true,
      locale
    } = options || {};
    
    const formatOptions = {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
      locale
    };
    
    switch (type) {
      case 'percentage':
        return formatPercentage(value, formatOptions);
      case 'compact':
        return formatCompactNumber(value, { locale });
      case 'decimal':
        return formatDecimal(value, maximumFractionDigits, locale);
      default:
        return formatNumber(value, formatOptions);
    }
  }, []);
};

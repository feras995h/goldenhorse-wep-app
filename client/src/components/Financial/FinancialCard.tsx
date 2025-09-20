import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatCurrencyAmount } from '../../utils/formatters';

interface FinancialCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  currency?: string;
}

const colorClasses = {
  green: {
    bg: 'bg-success-500',
    text: 'text-success-600',
    lightBg: 'bg-success-50',
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
  },
  red: {
    bg: 'bg-danger-500',
    text: 'text-danger-600',
    lightBg: 'bg-danger-50',
  },
  yellow: {
    bg: 'bg-warning-500',
    text: 'text-warning-600',
    lightBg: 'bg-warning-50',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    lightBg: 'bg-purple-50',
  },
  indigo: {
    bg: 'bg-indigo-500',
    text: 'text-indigo-600',
    lightBg: 'bg-indigo-50',
  },
};

const FinancialCard: React.FC<FinancialCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  currency = 'د.ل'
}) => {
  const colors = colorClasses[color] || colorClasses.blue;
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return formatCurrencyAmount(val, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        showZeroDecimals: true
      });
    }
    return val;
  };

  return (
    <div className="card-hover transition-professional">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">
              {formatValue(value)}
            </p>
            {typeof value === 'number' && (
              <span className="text-sm text-gray-500 mr-2">{currency}</span>
            )}
          </div>
          {trend && (
            <div className="flex items-center mt-3">
              <span
                className={`text-sm font-semibold ${
                  trend.isPositive ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 mr-2">من الشهر الماضي</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colors.lightBg} transition-professional`}>
          <Icon className={`h-8 w-8 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
};

export default FinancialCard;

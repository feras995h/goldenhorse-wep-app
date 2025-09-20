import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
  period: string;
}

interface TailAdminDashboardCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: TrendData;
  currency?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  loading?: boolean;
  onClick?: () => void;
  subtitle?: string;
  badge?: string;
}

const colorClasses = {
  primary: {
    bg: 'bg-golden-500',
    text: 'text-golden-600',
    lightBg: 'bg-golden-50',
    border: 'border-golden-200',
    hover: 'hover:bg-golden-100',
    gradient: 'from-golden-400 to-golden-600'
  },
  success: {
    bg: 'bg-success-500',
    text: 'text-success-600',
    lightBg: 'bg-success-50',
    border: 'border-success-200',
    hover: 'hover:bg-success-100',
    gradient: 'from-success-400 to-success-600'
  },
  warning: {
    bg: 'bg-warning-500',
    text: 'text-warning-600',
    lightBg: 'bg-warning-50',
    border: 'border-warning-200',
    hover: 'hover:bg-warning-100',
    gradient: 'from-warning-400 to-warning-600'
  },
  danger: {
    bg: 'bg-danger-500',
    text: 'text-danger-600',
    lightBg: 'bg-danger-50',
    border: 'border-danger-200',
    hover: 'hover:bg-danger-100',
    gradient: 'from-danger-400 to-danger-600'
  },
  info: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
    gradient: 'from-blue-400 to-blue-600'
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    lightBg: 'bg-purple-50',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100',
    gradient: 'from-purple-400 to-purple-600'
  },
  indigo: {
    bg: 'bg-indigo-500',
    text: 'text-indigo-600',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    hover: 'hover:bg-indigo-100',
    gradient: 'from-indigo-400 to-indigo-600'
  }
};

const sizeClasses = {
  sm: {
    padding: 'p-4',
    iconContainer: 'p-2',
    icon: 'h-5 w-5',
    title: 'text-sm',
    value: 'text-lg',
    subtitle: 'text-xs'
  },
  md: {
    padding: 'p-6',
    iconContainer: 'p-3',
    icon: 'h-6 w-6',
    title: 'text-sm',
    value: 'text-2xl',
    subtitle: 'text-sm'
  },
  lg: {
    padding: 'p-8',
    iconContainer: 'p-4',
    icon: 'h-8 w-8',
    title: 'text-base',
    value: 'text-3xl',
    subtitle: 'text-base'
  }
};

const TailAdminDashboardCard: React.FC<TailAdminDashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  currency = 'د.ل',
  color = 'primary',
  size = 'md',
  interactive = false,
  loading = false,
  onClick,
  subtitle,
  badge
}) => {
  // Fallback to primary color if an invalid color is provided
  const colors = colorClasses[color] || colorClasses.primary;
  const sizes = sizeClasses[size];

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('ar-LY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(val);
    }
    return val;
  };

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-success-600 bg-success-50';
      case 'down':
        return 'text-danger-600 bg-danger-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`
        card animate-pulse
        ${sizes.padding}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-3"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className={`${sizes.iconContainer} bg-gray-200 rounded-xl`}>
            <div className={`${sizes.icon} bg-gray-300 rounded`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        card-hover transition-professional
        ${sizes.padding}
        ${interactive ? 'cursor-pointer transform hover:-translate-y-1' : ''}
        group relative overflow-hidden border-r-4 ${colors.border}
      `}
      onClick={interactive ? onClick : undefined}
    >
      {/* Background Gradient Overlay for Hover */}
      {interactive && (
        <div className={`
          absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300
        `} />
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute top-3 left-3">
          <span className={`
            badge ${colors.text} ${colors.lightBg}
          `}>
            {badge}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between relative">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className={`
            ${sizes.title} font-medium text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-200
          `}>
            {title}
          </p>

          {/* Value */}
          <div className="flex items-baseline mb-1">
            <p className={`
              ${sizes.value} font-bold text-gray-900 group-hover:text-gray-900 transition-colors duration-200
            `}>
              {formatValue(value)}
            </p>
            {typeof value === 'number' && currency && (
              <span className="text-sm text-gray-500 mr-2 group-hover:text-gray-600 transition-colors duration-200">
                {currency}
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className={`${sizes.subtitle} text-gray-500 mb-2`}>
              {subtitle}
            </p>
          )}

          {/* Trend */}
          {trend && (
            <div className="flex items-center mt-3">
              <div className={`
                flex items-center px-2 py-1 rounded-full text-xs font-semibold
                ${getTrendColor()}
              `}>
                {getTrendIcon()}
                <span className="mr-1">
                  {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                  {Math.abs(trend.percentage)}%
                </span>
              </div>
              <span className="text-xs text-gray-500 mr-2">
                {trend.period}
              </span>
            </div>
          )}
        </div>

        {/* Icon Container */}
        <div className={`
          ${sizes.iconContainer} ${colors.lightBg} rounded-xl flex-shrink-0 
          group-hover:scale-110 transition-transform duration-300
          relative overflow-hidden
        `}>
          {/* Icon Background Gradient */}
          <div className={`
            absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300
          `} />
          <Icon className={`${sizes.icon} ${colors.text} relative z-10 group-hover:scale-110 transition-transform duration-200`} />
        </div>
      </div>

      {/* Interactive Indicator */}
      {interactive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-golden-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  );
};

export default TailAdminDashboardCard;
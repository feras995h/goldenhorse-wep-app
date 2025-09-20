import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down' | 'neutral';
  };
  color?: 'golden' | 'blue' | 'green' | 'red' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: IconComponent,
  trend,
  color = 'golden',
  size = 'md',
  loading = false,
  onClick,
  className = ''
}) => {
  const colorClasses = {
    golden: {
      bg: 'bg-gradient-to-br from-golden-50 to-golden-100',
      border: 'border-golden-200',
      icon: 'text-golden-600 bg-golden-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      icon: 'text-blue-600 bg-blue-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200',
      icon: 'text-green-600 bg-green-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      border: 'border-red-200',
      icon: 'text-red-600 bg-red-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: 'border-purple-200',
      icon: 'text-purple-600 bg-purple-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    gray: {
      bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
      border: 'border-gray-200',
      icon: 'text-gray-600 bg-gray-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    }
  };

  const sizeClasses = {
    sm: {
      padding: 'p-4',
      title: 'text-sm',
      value: 'text-xl',
      subtitle: 'text-xs',
      icon: 'w-8 h-8',
      iconContainer: 'w-10 h-10'
    },
    md: {
      padding: 'p-6',
      title: 'text-sm',
      value: 'text-2xl',
      subtitle: 'text-sm',
      icon: 'w-6 h-6',
      iconContainer: 'w-12 h-12'
    },
    lg: {
      padding: 'p-8',
      title: 'text-base',
      value: 'text-3xl',
      subtitle: 'text-base',
      icon: 'w-8 h-8',
      iconContainer: 'w-16 h-16'
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      case 'neutral':
        return <Minus className="w-4 h-4" />;
      default:
        return trend.value > 0 ? <TrendingUp className="w-4 h-4" /> : 
               trend.value < 0 ? <TrendingDown className="w-4 h-4" /> : 
               <Minus className="w-4 h-4" />;
    }
  };

  const getTrendDirection = () => {
    if (!trend) return 'neutral';
    if (trend.direction) return trend.direction;
    return trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral';
  };

  if (loading) {
    return (
      <div className={`
        bg-white rounded-xl shadow-sm border border-gray-200 
        ${sizeClasses[size].padding} 
        animate-pulse
        ${className}
      `}>
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className={`${sizeClasses[size].iconContainer} bg-gray-200 rounded-lg`}></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        ${colorClasses[color].bg}
        ${colorClasses[color].border}
        rounded-xl shadow-sm border
        ${sizeClasses[size].padding}
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Title */}
          <h3 className={`
            ${sizeClasses[size].title} 
            font-medium text-gray-600 mb-2
          `}>
            {title}
          </h3>
          
          {/* Value */}
          <p className={`
            ${sizeClasses[size].value} 
            font-bold text-gray-900 mb-1
          `}>
            {value}
          </p>
          
          {/* Subtitle */}
          {subtitle && (
            <p className={`
              ${sizeClasses[size].subtitle} 
              text-gray-500
            `}>
              {subtitle}
            </p>
          )}
          
          {/* Trend */}
          {trend && (
            <div className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2
              ${colorClasses[color].trend[getTrendDirection()]}
            `}>
              {getTrendIcon()}
              <span>
                {trend.value > 0 ? '+' : ''}{trend.value}%
                {trend.label && ` ${trend.label}`}
              </span>
            </div>
          )}
        </div>
        
        {/* Icon */}
        {IconComponent && (
          <div className={`
            ${sizeClasses[size].iconContainer}
            ${colorClasses[color].icon}
            rounded-lg flex items-center justify-center flex-shrink-0
          `}>
            <IconComponent className={sizeClasses[size].icon} />
          </div>
        )}
      </div>
    </div>
  );
};

// Stats Grid Component
interface StatsGridProps {
  stats: StatsCardProps[];
  columns?: 1 | 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  columns = 4,
  gap = 'md',
  className = ''
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={`
      grid ${columnClasses[columns]} ${gapClasses[gap]}
      ${className}
    `}>
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsCard;

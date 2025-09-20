import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: 'current' | 'golden' | 'blue' | 'green' | 'red' | 'gray' | 'white';
  variant?: 'solid' | 'outline' | 'ghost';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const Icon: React.FC<IconProps> = ({
  icon: IconComponent,
  size = 'md',
  color = 'current',
  variant = 'solid',
  className = '',
  onClick,
  disabled = false,
  loading = false
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  };

  const colorClasses = {
    current: 'text-current',
    golden: 'text-golden-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  const variantClasses = {
    solid: '',
    outline: 'stroke-2',
    ghost: 'opacity-60'
  };

  const baseClasses = `
    ${sizeClasses[size] || sizeClasses.md}
    ${colorClasses[color] || colorClasses.current}
    ${variantClasses[variant] || variantClasses.solid}
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity duration-200' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${loading ? 'animate-spin' : ''}
    ${className}
  `;

  if (loading) {
    return (
      <div className={baseClasses}>
        <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <IconComponent
      className={baseClasses}
      onClick={disabled ? undefined : onClick}
    />
  );
};

// Icon Button Component
interface IconButtonProps extends IconProps {
  tooltip?: string;
  badge?: string | number;
  badgeColor?: 'red' | 'blue' | 'green' | 'yellow' | 'gray';
}

export const IconButton: React.FC<IconButtonProps> = ({
  tooltip,
  badge,
  badgeColor = 'red',
  className = '',
  ...iconProps
}) => {
  const badgeColorClasses = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    gray: 'bg-gray-500 text-white'
  };

  return (
    <div className="relative inline-flex">
      <button
        className={`
          p-2 rounded-lg transition-all duration-200 
          hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-golden-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title={tooltip}
        disabled={iconProps.disabled}
        onClick={iconProps.onClick}
      >
        <Icon {...iconProps} onClick={undefined} />
      </button>
      
      {badge && (
        <span className={`
          absolute -top-1 -right-1 inline-flex items-center justify-center
          px-1.5 py-0.5 text-xs font-bold leading-none rounded-full
          ${badgeColorClasses[badgeColor]}
          min-w-[1.25rem] h-5
        `}>
          {badge}
        </span>
      )}
    </div>
  );
};

// Icon with Text Component
interface IconWithTextProps extends IconProps {
  text: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  gap?: 'sm' | 'md' | 'lg';
}

export const IconWithText: React.FC<IconWithTextProps> = ({
  text,
  position = 'right',
  gap = 'md',
  className = '',
  ...iconProps
}) => {
  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  };

  const flexClasses = {
    left: 'flex-row-reverse',
    right: 'flex-row',
    top: 'flex-col-reverse',
    bottom: 'flex-col'
  };

  return (
    <div className={`
      inline-flex items-center
      ${flexClasses[position]}
      ${gapClasses[gap]}
      ${className}
    `}>
      <Icon {...iconProps} />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

export default Icon;

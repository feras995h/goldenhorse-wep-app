import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'جاري التحميل...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const containerClasses = fullScreen 
    ? 'loading-overlay'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center fade-in">
        {/* Professional Spinner */}
        <div className="relative mb-4">
          <div className={`loading-spinner ${sizeClasses[size]} mx-auto`}></div>
        </div>

        {/* Loading Text */}
        <p className={`${textSizes[size]} font-medium text-dark-600`}>
          {text}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

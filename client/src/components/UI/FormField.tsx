import React from 'react';

interface FormFieldProps {
  label: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'tel';
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  className?: string;
  children?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  options = [],
  rows = 3,
  min,
  max,
  step,
  className = '',
  children
}) => {
  const baseInputClasses = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-golden-500 focus:border-golden-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";
  const errorClasses = error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "";

  const renderField = () => {
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          >
            <option value="">اختر...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          />
        );

      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            min={min as any}
            max={max as any}
            step={step as any}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          />
        );
    }
  };

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {children ? children : renderField()}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

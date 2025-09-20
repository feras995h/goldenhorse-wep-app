import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface FormFieldProps {
  label: string;
  name?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  options?: Option[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  description?: string;
  children?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  options = [],
  rows = 3,
  min,
  max,
  step,
  disabled = false,
  className = '',
  description,
  children,
}) => {
  const baseInputClasses = `
    form-input transition-professional
    ${error ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500' : ''}
    ${disabled ? 'opacity-75' : ''}
  `;

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            <option value="">{placeholder || `اختر ${label}`}</option>
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
            className={baseInputClasses}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            name={name}
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              onChange?.(v === '' ? '' : Number(v));
            }}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={baseInputClasses}
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
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-danger-500 mr-1">*</span>}
      </label>
      {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
      {children ? children : renderInput()}
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};

export default FormField;

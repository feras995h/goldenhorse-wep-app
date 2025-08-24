import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
  value: string | number;
  onChange: (value: string | number) => void;
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
  className = ''
}) => {
  const baseInputClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
    focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? 'border-red-300' : 'border-gray-300'}
  `;

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
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
            onChange={(e) => onChange(e.target.value)}
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
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
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
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormField;

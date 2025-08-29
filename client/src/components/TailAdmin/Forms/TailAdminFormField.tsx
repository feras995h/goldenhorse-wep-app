import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Info, Upload, X } from 'lucide-react';

export type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url' 
  | 'search'
  | 'textarea'
  | 'select'
  | 'file'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'checkbox'
  | 'radio';

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FormAddon {
  type: 'prefix' | 'suffix';
  content: string | React.ReactNode;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface TailAdminFormFieldProps {
  label: string;
  name: string;
  type: InputType;
  value: any;
  onChange: (value: any) => void;
  validation?: ValidationRule[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helpText?: string;
  errorText?: string;
  successText?: string;
  size?: 'sm' | 'md' | 'lg';
  addon?: FormAddon;
  options?: SelectOption[]; // for select, radio
  rows?: number; // for textarea
  accept?: string; // for file input
  multiple?: boolean; // for file input
  className?: string;
  loading?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  dir?: 'ltr' | 'rtl';
}

const TailAdminFormField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, TailAdminFormFieldProps>(
  ({
    label,
    name,
    type,
    value,
    onChange,
    validation = [],
    placeholder,
    disabled = false,
    required = false,
    helpText,
    errorText,
    successText,
    size = 'md',
    addon,
    options = [],
    rows = 4,
    accept,
    multiple,
    className = '',
    loading = false,
    readOnly = false,
    autoComplete,
    dir = 'rtl'
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Size configurations
    const sizeConfig = {
      sm: {
        input: 'px-3 py-2 text-sm',
        label: 'text-sm',
        help: 'text-xs',
        addon: 'px-3 text-sm'
      },
      md: {
        input: 'px-4 py-3 text-sm',
        label: 'text-sm',
        help: 'text-xs',
        addon: 'px-4 text-sm'
      },
      lg: {
        input: 'px-5 py-4 text-base',
        label: 'text-base',
        help: 'text-sm',
        addon: 'px-5 text-base'
      }
    };

    const currentSize = sizeConfig[size];

    // Validation
    const validateValue = (val: any): string[] => {
      const errors: string[] = [];

      validation.forEach(rule => {
        if (rule.required && (!val || val === '')) {
          errors.push('هذا الحقل مطلوب');
          return;
        }

        if (rule.min && val && val.length < rule.min) {
          errors.push(`الحد الأدنى ${rule.min} أحرف`);
        }

        if (rule.max && val && val.length > rule.max) {
          errors.push(`الحد الأقصى ${rule.max} أحرف`);
        }

        if (rule.pattern && val && !rule.pattern.test(val)) {
          errors.push('تنسيق غير صحيح');
        }

        if (rule.custom && val) {
          const customError = rule.custom(val);
          if (customError) {
            errors.push(customError);
          }
        }
      });

      return errors;
    };

    const handleChange = (newValue: any) => {
      const errors = validateValue(newValue);
      setValidationErrors(errors);
      onChange(newValue);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        handleChange(multiple ? Array.from(files) : files[0]);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleChange(multiple ? files : files[0]);
      }
    };

    // Determine field state
    const hasError = validationErrors.length > 0 || errorText;
    const hasSuccess = !hasError && successText;
    const fieldValue = value || '';

    // Base input classes
    const baseInputClasses = `
      w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2
      ${currentSize.input}
      ${dir === 'rtl' ? 'text-right' : 'text-left'}
      ${disabled ? 'bg-dark-50 text-dark-400 cursor-not-allowed' : 'bg-white text-dark-900'}
      ${readOnly ? 'bg-dark-50 cursor-default' : ''}
      ${hasError 
        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-200' 
        : hasSuccess 
          ? 'border-success-300 focus:border-success-500 focus:ring-success-200'
          : 'border-golden-200 focus:border-golden-500 focus:ring-golden-200'
      }
      ${loading ? 'animate-pulse' : ''}
    `;

    // Render different input types
    const renderInput = () => {
      switch (type) {
        case 'textarea':
          return (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              name={name}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || loading}
              readOnly={readOnly}
              required={required}
              rows={rows}
              autoComplete={autoComplete}
              dir={dir}
              className={`${baseInputClasses} resize-none ${className}`}
            />
          );

        case 'select':
          return (
            <select
              ref={ref as React.Ref<HTMLSelectElement>}
              name={name}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled || loading}
              required={required}
              dir={dir}
              className={`${baseInputClasses} ${className}`}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'file':
          return (
            <div
              className={`
                relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
                ${hasError ? 'border-danger-300' : 'border-golden-300'}
                ${isDragOver ? 'border-golden-500 bg-golden-50' : 'hover:border-golden-400'}
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type="file"
                name={name}
                onChange={handleFileChange}
                accept={accept}
                multiple={multiple}
                disabled={disabled || loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className={`${currentSize.input} text-center`}>
                <Upload className="h-8 w-8 mx-auto mb-2 text-golden-500" />
                <p className="text-sm text-dark-600">
                  {isDragOver 
                    ? 'اسحب الملفات هنا' 
                    : 'اضغط لاختيار الملفات أو اسحبها هنا'
                  }
                </p>
                {fieldValue && (
                  <div className="mt-2">
                    {Array.isArray(fieldValue) ? (
                      <div className="space-y-1">
                        {fieldValue.map((file: File, index: number) => (
                          <div key={index} className="flex items-center justify-center text-xs text-dark-500">
                            <span>{file.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                const newFiles = fieldValue.filter((_: any, i: number) => i !== index);
                                handleChange(newFiles.length > 0 ? newFiles : null);
                              }}
                              className="mr-2 text-danger-500 hover:text-danger-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-xs text-dark-500">
                        <span>{fieldValue.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleChange(null);
                          }}
                          className="mr-2 text-danger-500 hover:text-danger-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );

        case 'checkbox':
          return (
            <div className="flex items-center">
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type="checkbox"
                name={name}
                checked={!!fieldValue}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled || loading}
                className={`
                  w-4 h-4 text-golden-600 bg-golden-100 border-golden-300 rounded
                  focus:ring-golden-500 focus:ring-2 transition-colors duration-200
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              />
              <span className={`mr-2 ${currentSize.label} text-dark-700`}>
                {label}
              </span>
            </div>
          );

        case 'radio':
          return (
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={fieldValue === option.value}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={disabled || loading || option.disabled}
                    className={`
                      w-4 h-4 text-golden-600 bg-golden-100 border-golden-300
                      focus:ring-golden-500 focus:ring-2 transition-colors duration-200
                      ${disabled || option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  />
                  <span className={`mr-2 ${currentSize.label} text-dark-700`}>
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          );

        case 'password':
          return (
            <div className="relative">
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type={showPassword ? 'text' : 'password'}
                name={name}
                value={fieldValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled || loading}
                readOnly={readOnly}
                required={required}
                autoComplete={autoComplete}
                dir={dir}
                className={`${baseInputClasses} ${dir === 'rtl' ? 'pl-12' : 'pr-12'} ${className}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`
                  absolute top-1/2 transform -translate-y-1/2 p-2 text-dark-400 hover:text-dark-600
                  ${dir === 'rtl' ? 'left-2' : 'right-2'}
                `}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          );

        default:
          // Regular input types
          const inputElement = (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type={type}
              name={name}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || loading}
              readOnly={readOnly}
              required={required}
              autoComplete={autoComplete}
              dir={dir}
              className={`${baseInputClasses} ${className}`}
            />
          );

          if (addon) {
            return (
              <div className="flex">
                {addon.type === 'prefix' && (
                  <span className={`
                    ${currentSize.addon} bg-golden-50 border border-l-0 border-golden-200 rounded-r-lg
                    flex items-center text-dark-600
                  `}>
                    {addon.content}
                  </span>
                )}
                <div className="flex-1">
                  {React.cloneElement(inputElement, {
                    className: `${baseInputClasses} ${
                      addon.type === 'prefix' ? 'rounded-r-none border-r-0' : 'rounded-l-none border-l-0'
                    } ${className}`
                  })}
                </div>
                {addon.type === 'suffix' && (
                  <span className={`
                    ${currentSize.addon} bg-golden-50 border border-r-0 border-golden-200 rounded-l-lg
                    flex items-center text-dark-600
                  `}>
                    {addon.content}
                  </span>
                )}
              </div>
            );
          }

          return inputElement;
      }
    };

    if (type === 'checkbox' || type === 'radio') {
      return (
        <div className={`space-y-2 ${className}`}>
          {renderInput()}
          
          {/* Help Text */}
          {helpText && (
            <div className="flex items-center">
              <Info className="h-4 w-4 text-dark-400 ml-1" />
              <p className={`${currentSize.help} text-dark-600`}>{helpText}</p>
            </div>
          )}

          {/* Error Messages */}
          {(validationErrors.length > 0 || errorText) && (
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-danger-500 ml-1" />
              <p className={`${currentSize.help} text-danger-600`}>
                {errorText || validationErrors[0]}
              </p>
            </div>
          )}

          {/* Success Message */}
          {hasSuccess && (
            <div className="flex items-center">
              <Check className="h-4 w-4 text-success-500 ml-1" />
              <p className={`${currentSize.help} text-success-600`}>{successText}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`space-y-2 ${className}`}>
        {/* Label */}
        <label className={`block ${currentSize.label} font-medium text-dark-700`}>
          {label}
          {required && <span className="text-danger-500 mr-1">*</span>}
        </label>

        {/* Input */}
        {renderInput()}

        {/* Help Text */}
        {helpText && (
          <div className="flex items-center">
            <Info className="h-4 w-4 text-dark-400 ml-1" />
            <p className={`${currentSize.help} text-dark-600`}>{helpText}</p>
          </div>
        )}

        {/* Error Messages */}
        {(validationErrors.length > 0 || errorText) && (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-danger-500 ml-1" />
            <p className={`${currentSize.help} text-danger-600`}>
              {errorText || validationErrors[0]}
            </p>
          </div>
        )}

        {/* Success Message */}
        {hasSuccess && (
          <div className="flex items-center">
            <Check className="h-4 w-4 text-success-500 ml-1" />
            <p className={`${currentSize.help} text-success-600`}>{successText}</p>
          </div>
        )}
      </div>
    );
  }
);

TailAdminFormField.displayName = 'TailAdminFormField';

export default TailAdminFormField;
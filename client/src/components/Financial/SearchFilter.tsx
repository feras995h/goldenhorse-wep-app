import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterProps {
  // Preferred props
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  // Backward-compatible aliases
  value?: string;
  onChange?: (value: string) => void;
  filters?: {
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  onClearFilters?: () => void;
  placeholder?: string;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchValue,
  onSearchChange,
  value,
  onChange,
  filters = [],
  onClearFilters,
  placeholder = 'البحث...'
}) => {
  const hasActiveFilters = filters.some(filter => filter.value !== '');

  return (
    <div className="card p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4 lg:space-x-reverse">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={(value ?? searchValue) || ''}
            onChange={(e) => (onChange ?? onSearchChange)?.(e.target.value)}
            className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder={placeholder}
          />
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center space-x-3 space-x-reverse">
            <div className="flex items-center text-sm text-gray-600 ml-3">
              <Filter className="h-4 w-4 ml-1" />
              تصفية:
            </div>
            
            {filters.map((filter) => (
              <div key={filter.key} className="min-w-0">
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Clear Filters Button */}
            {hasActiveFilters && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 ml-1" />
                مسح الفلاتر
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;

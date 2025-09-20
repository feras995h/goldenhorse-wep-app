import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FilterOption {
  key: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

interface SearchFilterProps {
  // Preferred props
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  // Backward-compatible aliases used widely in pages
  value?: string;
  onChange?: (value: string) => void;
  filters?: FilterOption[];
  onClearFilters?: () => void;
  placeholder?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchValue,
  onSearchChange,
  value,
  onChange,
  filters = [],
  onClearFilters,
  placeholder = 'البحث...'
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={(value ?? searchValue) || ''}
          onChange={(e) => (onChange ?? onSearchChange)?.(e.target.value)}
          className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-golden-500 focus:border-golden-500 sm:text-sm"
          placeholder={placeholder}
        />
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-1" />
            تصفية:
          </div>
          
          {filters.map((filter) => (
            <div key={filter.key} className="flex items-center space-x-2 space-x-reverse">
              <label className="text-sm font-medium text-gray-700">{filter.label}:</label>
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-golden-500 focus:border-golden-500 sm:text-sm"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
            >
              <X className="h-4 w-4 mr-1" />
              مسح الفلاتر
            </button>
          )}
        </div>
      )}
    </div>
  );
};

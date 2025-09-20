import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, MoreHorizontal } from 'lucide-react';

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableAction<T> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T) => void;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  visible?: (record: T) => boolean;
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  actions?: TableAction<T>[];
  searchable?: boolean;
  filterable?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowSelection?: {
    selectedRowKeys: (string | number)[];
    onChange: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void;
  };
  emptyText?: string;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

const EnhancedTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  actions,
  searchable = true,
  filterable = false,
  pagination,
  rowSelection,
  emptyText = 'لا توجد بيانات',
  size = 'md',
  bordered = true,
  striped = true,
  hoverable = true,
  className = ''
}: EnhancedTableProps<T>) => {
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const paddingClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4'
  };

  // Sorting logic
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;
    
    if (sortField === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(column.key);
      setSortDirection('asc');
    }
  };

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery && searchable) {
      result = result.filter(record =>
        Object.values(record).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(record =>
          String(record[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortField, sortDirection, searchable]);

  const renderSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;
    
    return (
      <div className="flex flex-col mr-1">
        <ChevronUp 
          className={`h-3 w-3 ${
            sortField === column.key && sortDirection === 'asc' 
              ? 'text-golden-600' 
              : 'text-gray-400'
          }`} 
        />
        <ChevronDown 
          className={`h-3 w-3 ${
            sortField === column.key && sortDirection === 'desc' 
              ? 'text-golden-600' 
              : 'text-gray-400'
          }`} 
        />
      </div>
    );
  };

  const renderActions = (record: T) => {
    if (!actions || actions.length === 0) return null;

    const visibleActions = actions.filter(action => 
      !action.visible || action.visible(record)
    );

    if (visibleActions.length === 0) return null;

    return (
      <div className="flex items-center space-x-2 space-x-reverse">
        {visibleActions.map(action => (
          <button
            key={action.key}
            onClick={() => action.onClick(record)}
            className={`
              p-1 rounded hover:bg-gray-100 transition-colors duration-200
              ${action.color === 'danger' ? 'text-red-600 hover:bg-red-50' : ''}
              ${action.color === 'success' ? 'text-green-600 hover:bg-green-50' : ''}
              ${action.color === 'warning' ? 'text-yellow-600 hover:bg-yellow-50' : ''}
              ${action.color === 'primary' ? 'text-blue-600 hover:bg-blue-50' : ''}
            `}
            title={action.label}
          >
            {action.icon || <MoreHorizontal className="h-4 w-4" />}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-600"></div>
          <span className="mr-3 text-gray-600">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header with search and filters */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {searchable && (
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="البحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500 focus:border-golden-500"
                />
              </div>
            )}
            {filterable && (
              <button className="flex items-center space-x-2 space-x-reverse px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                <Filter className="h-4 w-4" />
                <span>فلترة</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {rowSelection && (
                <th className={`${paddingClasses[size]} text-right`}>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-golden-600 focus:ring-golden-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`
                    ${paddingClasses[size]} text-right ${sizeClasses[size]} font-semibold text-gray-900
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-200' : ''}
                    ${bordered ? 'border-l border-gray-200 last:border-l-0' : ''}
                    ${column.className || ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.title}</span>
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className={`${paddingClasses[size]} text-right ${sizeClasses[size]} font-semibold text-gray-900`}>
                  العمليات
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`bg-white divide-y divide-gray-200 ${striped ? 'divide-y divide-gray-200' : ''}`}>
            {processedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (rowSelection ? 1 : 0) + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              processedData.map((record, index) => (
                <tr 
                  key={record.id || index} 
                  className={`
                    ${striped && index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                    ${hoverable ? 'hover:bg-golden-50 transition-colors duration-200' : ''}
                  `}
                >
                  {rowSelection && (
                    <td className={paddingClasses[size]}>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-golden-600 focus:ring-golden-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td 
                      key={column.key as string} 
                      className={`
                        ${paddingClasses[size]} ${sizeClasses[size]} text-gray-900
                        ${bordered ? 'border-l border-gray-200 last:border-l-0' : ''}
                        ${column.align === 'center' ? 'text-center' : column.align === 'left' ? 'text-left' : 'text-right'}
                        ${column.className || ''}
                      `}
                    >
                      {column.render ? column.render(record[column.key], record, index) : record[column.key]}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className={paddingClasses[size]}>
                      {renderActions(record)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              عرض {((pagination.current - 1) * pagination.pageSize) + 1} إلى {Math.min(pagination.current * pagination.pageSize, pagination.total)} من {pagination.total} نتيجة
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              {/* Pagination controls would go here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTable;

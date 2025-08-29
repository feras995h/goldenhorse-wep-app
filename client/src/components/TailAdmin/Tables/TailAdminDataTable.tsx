import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X
} from 'lucide-react';

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  dataIndex: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  searchable?: boolean;
}

export interface TableAction<T> {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (record: T) => void;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  visible?: (record: T) => boolean;
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  pageSizeOptions?: number[];
}

interface TailAdminDataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  onPaginationChange?: (page: number, pageSize: number) => void;
  actions?: TableAction<T>[];
  selection?: {
    enabled: boolean;
    selectedRowKeys?: (string | number)[];
    onSelectionChange?: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void;
    getRowKey?: (record: T) => string | number;
  };
  emptyState?: React.ReactNode;
  title?: string;
  exportable?: boolean;
  onExport?: () => void;
  searchable?: boolean;
  filterable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  striped?: boolean;
}

const TailAdminDataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  onPaginationChange,
  actions,
  selection,
  emptyState,
  title,
  exportable = false,
  onExport,
  searchable = true,
  filterable = true,
  size = 'md',
  bordered = true,
  striped = true
}: TailAdminDataTableProps<T>) => {
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      cellPadding: 'px-3 py-2',
      fontSize: 'text-sm',
      headerPadding: 'px-3 py-3'
    },
    md: {
      cellPadding: 'px-4 py-3',
      fontSize: 'text-sm',
      headerPadding: 'px-4 py-4'
    },
    lg: {
      cellPadding: 'px-6 py-4',
      fontSize: 'text-base',
      headerPadding: 'px-6 py-5'
    }
  };

  const currentSizeConfig = sizeConfig[size];

  // Get row key
  const getRowKey = (record: T, index: number): string | number => {
    if (selection?.getRowKey) {
      return selection.getRowKey(record);
    }
    return record.id || index;
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'ar');
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [data, sortField, sortDirection]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = sortedData;

    // Apply search
    if (searchQuery) {
      result = result.filter(record =>
        Object.values(record).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(record =>
          String(record[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    return result;
  }, [sortedData, searchQuery, filters]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;

    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination]);

  // Handle sorting
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;

    if (sortField === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(column.key);
      setSortDirection('asc');
    }
  };

  // Handle selection
  const handleRowSelection = (rowKey: string | number, checked: boolean) => {
    const newSelected = checked
      ? [...selectedRows, rowKey]
      : selectedRows.filter(key => key !== rowKey);

    setSelectedRows(newSelected);
    if (selection?.onSelectionChange) {
      const selectedRecords = filteredData.filter(record =>
        newSelected.includes(getRowKey(record, 0))
      );
      selection.onSelectionChange(newSelected, selectedRecords);
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    const allRowKeys = paginatedData.map((record, index) => getRowKey(record, index));
    const newSelected = checked ? allRowKeys : [];

    setSelectedRows(newSelected);
    if (selection?.onSelectionChange) {
      const selectedRecords = checked ? paginatedData : [];
      selection.onSelectionChange(newSelected, selectedRecords);
    }
  };

  // Filter controls
  const renderFilterControl = (column: TableColumn<T>) => {
    if (!column.filterable) return null;

    return (
      <input
        type="text"
        placeholder={`تصفية ${column.title}`}
        value={filters[column.key as string] || ''}
        onChange={(e) => setFilters(prev => ({
          ...prev,
          [column.key]: e.target.value
        }))}
        className="w-full px-2 py-1 text-xs border border-golden-200 rounded focus:ring-1 focus:ring-golden-500 focus:border-transparent"
      />
    );
  };

  // Pagination controls
  const renderPagination = () => {
    if (!pagination || !onPaginationChange) return null;

    const { current, pageSize, total } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, total);

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        <div className="text-sm text-dark-600">
          عرض {startItem} إلى {endItem} من {total} عنصر
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          {/* First Page */}
          <button
            onClick={() => onPaginationChange(1, pageSize)}
            disabled={current === 1}
            className="p-2 text-dark-600 hover:text-golden-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPaginationChange(current - 1, pageSize)}
            disabled={current === 1}
            className="p-2 text-dark-600 hover:text-golden-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex space-x-1 space-x-reverse">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, current - 2) + i;
              if (pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPaginationChange(pageNum, pageSize)}
                  className={`
                    px-3 py-1 text-sm rounded transition-colors duration-200
                    ${current === pageNum
                      ? 'bg-golden-500 text-white'
                      : 'text-dark-600 hover:bg-golden-100 hover:text-golden-600'
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={() => onPaginationChange(current + 1, pageSize)}
            disabled={current === totalPages}
            className="p-2 text-dark-600 hover:text-golden-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPaginationChange(totalPages, pageSize)}
            disabled={current === totalPages}
            className="p-2 text-dark-600 hover:text-golden-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every((record, index) => selectedRows.includes(getRowKey(record, index)));
  const isIndeterminate = selectedRows.length > 0 && !isAllSelected;

  return (
    <div className="bg-white border border-golden-200 rounded-xl shadow-sm">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-golden-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-dark-800">{title}</h3>
            )}
            <p className="text-sm text-dark-600">
              {filteredData.length} عنصر
            </p>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Search */}
            {searchable && (
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-dark-400" />
                </div>
                <input
                  type="text"
                  placeholder="البحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10 py-2 border border-golden-200 rounded-lg focus:ring-2 focus:ring-golden-500 focus:border-transparent text-sm"
                />
              </div>
            )}

            {/* Filter Toggle */}
            {filterable && (
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`
                  p-2 border border-golden-200 rounded-lg transition-colors duration-200
                  ${isFilterOpen ? 'bg-golden-100 text-golden-600' : 'text-dark-600 hover:bg-golden-50'}
                `}
              >
                <Filter className="h-4 w-4" />
              </button>
            )}

            {/* Export */}
            {exportable && (
              <button
                onClick={onExport}
                className="p-2 text-dark-600 border border-golden-200 rounded-lg hover:bg-golden-50 hover:text-golden-600 transition-colors duration-200"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-golden-50 border-b border-golden-200">
            <tr>
              {/* Selection Column */}
              {selection?.enabled && (
                <th className={`${currentSizeConfig.headerPadding} text-right`}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-golden-600 bg-golden-100 border-golden-300 rounded focus:ring-golden-500 focus:ring-2"
                  />
                </th>
              )}

              {/* Column Headers */}
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`
                    ${currentSizeConfig.headerPadding} text-right ${currentSizeConfig.fontSize} font-semibold text-dark-700
                    ${column.sortable ? 'cursor-pointer hover:bg-golden-100 transition-colors duration-200' : ''}
                    ${bordered ? 'border-l border-golden-200 last:border-l-0' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col ml-1">
                        <ChevronUp 
                          className={`h-3 w-3 ${
                            sortField === column.key && sortDirection === 'asc' 
                              ? 'text-golden-600' 
                              : 'text-dark-400'
                          }`} 
                        />
                        <ChevronDown 
                          className={`h-3 w-3 ${
                            sortField === column.key && sortDirection === 'desc' 
                              ? 'text-golden-600' 
                              : 'text-dark-400'
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}

              {/* Actions Column */}
              {actions && actions.length > 0 && (
                <th className={`${currentSizeConfig.headerPadding} text-center`}>
                  الإجراءات
                </th>
              )}
            </tr>

            {/* Filter Row */}
            {isFilterOpen && (
              <tr className="bg-golden-25">
                {selection?.enabled && <th className={currentSizeConfig.headerPadding}></th>}
                {columns.map((column) => (
                  <th key={`filter-${column.key as string}`} className={currentSizeConfig.headerPadding}>
                    {renderFilterControl(column)}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className={currentSizeConfig.headerPadding}>
                    <button
                      onClick={() => setFilters({})}
                      className="text-xs text-danger-600 hover:text-danger-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </th>
                )}
              </tr>
            )}
          </thead>

          {/* Table Body */}
          <tbody>
            {loading ? (
              // Loading State
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className={striped && index % 2 === 0 ? 'bg-golden-25' : ''}>
                  {selection?.enabled && (
                    <td className={currentSizeConfig.cellPadding}>
                      <div className="w-4 h-4 bg-golden-200 rounded animate-pulse"></div>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key as string} className={currentSizeConfig.cellPadding}>
                      <div className="h-4 bg-golden-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className={currentSizeConfig.cellPadding}>
                      <div className="h-4 bg-golden-200 rounded animate-pulse w-16 mx-auto"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td 
                  colSpan={
                    columns.length + 
                    (selection?.enabled ? 1 : 0) + 
                    (actions?.length ? 1 : 0)
                  }
                  className="text-center py-12"
                >
                  {emptyState || (
                    <div className="text-dark-500">
                      <p>لا توجد بيانات للعرض</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Data Rows
              paginatedData.map((record, index) => {
                const rowKey = getRowKey(record, index);
                const isSelected = selectedRows.includes(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={`
                      transition-colors duration-200 hover:bg-golden-50
                      ${striped && index % 2 === 0 ? 'bg-golden-25' : ''}
                      ${isSelected ? 'bg-golden-100' : ''}
                      ${bordered ? 'border-b border-golden-200' : ''}
                    `}
                  >
                    {/* Selection Cell */}
                    {selection?.enabled && (
                      <td className={currentSizeConfig.cellPadding}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelection(rowKey, e.target.checked)}
                          className="w-4 h-4 text-golden-600 bg-golden-100 border-golden-300 rounded focus:ring-golden-500 focus:ring-2"
                        />
                      </td>
                    )}

                    {/* Data Cells */}
                    {columns.map((column) => (
                      <td
                        key={column.key as string}
                        className={`
                          ${currentSizeConfig.cellPadding} ${currentSizeConfig.fontSize} text-dark-800
                          ${column.align === 'center' ? 'text-center' : column.align === 'left' ? 'text-left' : 'text-right'}
                          ${bordered ? 'border-l border-golden-200 last:border-l-0' : ''}
                        `}
                      >
                        {column.render 
                          ? column.render(record[column.dataIndex], record, index)
                          : String(record[column.dataIndex] || '-')
                        }
                      </td>
                    ))}

                    {/* Actions Cell */}
                    {actions && actions.length > 0 && (
                      <td className={`${currentSizeConfig.cellPadding} text-center`}>
                        <div className="flex justify-center space-x-1 space-x-reverse">
                          {actions
                            .filter(action => !action.visible || action.visible(record))
                            .map((action) => {
                              const colorClasses = {
                                primary: 'text-golden-600 hover:bg-golden-100',
                                success: 'text-success-600 hover:bg-success-100',
                                warning: 'text-warning-600 hover:bg-warning-100',
                                danger: 'text-danger-600 hover:bg-danger-100'
                              };

                              return (
                                <button
                                  key={action.key}
                                  onClick={() => action.onClick(record)}
                                  className={`
                                    p-1 rounded transition-colors duration-200
                                    ${colorClasses[action.color || 'primary']}
                                  `}
                                  title={action.label}
                                >
                                  {action.icon}
                                </button>
                              );
                            })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-golden-200">
        {renderPagination()}
      </div>
    </div>
  );
};

export default TailAdminDataTable;
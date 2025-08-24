import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Column {
  key: string;
  title: string;
  render?: (value: any, record: any) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  onRowClick?: (record: any) => void;
  emptyText?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  pagination,
  onRowClick,
  emptyText = 'لا توجد بيانات'
}) => {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;

    const { current, onChange } = pagination;
    const pages = [];
    
    // Calculate page range to show
    const maxVisiblePages = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t">
        <div className="text-sm text-gray-700">
          عرض {((current - 1) * pagination.pageSize) + 1} إلى{' '}
          {Math.min(current * pagination.pageSize, pagination.total)} من{' '}
          {pagination.total} نتيجة
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onChange(1)}
            disabled={current === 1}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onChange(current - 1)}
            disabled={current === 1}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="flex space-x-1 space-x-reverse">
            {pages.map(page => (
              <button
                key={page}
                onClick={() => onChange(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  page === current
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => onChange(current + 1)}
            disabled={current === totalPages}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onChange(totalPages)}
            disabled={current === totalPages}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 border-t border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' :
                    column.align === 'right' ? 'text-right' : 'text-right'
                  }`}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={record.id || index}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        column.align === 'center' ? 'text-center' :
                        column.align === 'right' ? 'text-right' : 'text-right'
                      }`}
                    >
                      {column.render
                        ? column.render(record[column.key], record)
                        : record[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default DataTable;

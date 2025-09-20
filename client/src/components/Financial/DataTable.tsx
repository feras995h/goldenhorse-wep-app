import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Column {
  key: string;
  title: React.ReactNode;
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
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          عرض {((current - 1) * pagination.pageSize) + 1} إلى{' '}
          {Math.min(current * pagination.pageSize, pagination.total)} من{' '}
          {pagination.total} نتيجة
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onChange(1)}
            disabled={current === 1}
            className="btn btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onChange(current - 1)}
            disabled={current === 1}
            className="btn btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="flex space-x-1 space-x-reverse">
            {pages.map(page => (
              <button
                key={page}
                onClick={() => onChange(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-professional ${
                  page === current
                    ? 'bg-golden-600 text-white shadow-sm'
                    : 'btn btn-secondary'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => onChange(current + 1)}
            disabled={current === totalPages}
            className="btn btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onChange(totalPages)}
            disabled={current === totalPages}
            className="btn btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="card overflow-hidden fade-in">
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-header-cell ${
                    column.align === 'center' ? 'text-center' :
                    column.align === 'left' ? 'text-left' : 'text-right'
                  }`}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-body">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-gray-400">📄</span>
                    </div>
                    <span>{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={record.id || index}
                  className={`table-row transition-professional ${
                    onRowClick ? 'cursor-pointer hover:bg-golden-50' : ''
                  }`}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`table-cell ${
                        column.align === 'center' ? 'text-center' :
                        column.align === 'left' ? 'text-left' : 'text-right'
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

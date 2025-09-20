import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  Package,
  Eye,
  Edit,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'sales' | 'shipping';
  customerId: string;
  customer?: {
    id: string;
    name: string;
    code: string;
    phone?: string;
  };
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: string;
}

interface FilterOptions {
  type: 'all' | 'sales' | 'shipping';
  status: 'all' | 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  dateFrom: string;
  dateTo: string;
  amountFrom: string;
  amountTo: string;
  customerId: string;
  currency: 'all' | 'LYD' | 'USD' | 'EUR' | 'CNY';
}

interface SortOptions {
  field: 'date' | 'invoiceNumber' | 'total' | 'customer' | 'status';
  direction: 'asc' | 'desc';
}

interface InvoiceListViewProps {
  invoices: Invoice[];
  loading?: boolean;
  onInvoiceSelect?: (invoice: Invoice) => void;
  onInvoiceEdit?: (invoice: Invoice) => void;
  onInvoiceView?: (invoice: Invoice) => void;
  onInvoiceDownload?: (invoice: Invoice) => void;
  onRefresh?: () => void;
  showActions?: boolean;
}

const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  invoices,
  loading = false,
  onInvoiceSelect,
  onInvoiceEdit,
  onInvoiceView,
  onInvoiceDownload,
  onRefresh,
  showActions = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
    customerId: '',
    currency: 'all'
  });
  const [sort, setSort] = useState<SortOptions>({
    field: 'date',
    direction: 'desc'
  });
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // Filter and sort invoices
  const filteredAndSortedInvoices = React.useMemo(() => {
    let filtered = invoices.filter(invoice => {
      // Search filter
      const searchMatch = !searchTerm || 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.code.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const typeMatch = filters.type === 'all' || invoice.type === filters.type;

      // Status filter
      const statusMatch = filters.status === 'all' || invoice.status === filters.status;

      // Date filter
      const dateMatch = (!filters.dateFrom || invoice.date >= filters.dateFrom) &&
                       (!filters.dateTo || invoice.date <= filters.dateTo);

      // Amount filter
      const amountMatch = (!filters.amountFrom || invoice.total >= Number(filters.amountFrom)) &&
                         (!filters.amountTo || invoice.total <= Number(filters.amountTo));

      // Currency filter
      const currencyMatch = filters.currency === 'all' || invoice.currency === filters.currency;

      return searchMatch && typeMatch && statusMatch && dateMatch && amountMatch && currencyMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sort.field) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'invoiceNumber':
          aValue = a.invoiceNumber;
          bValue = b.invoiceNumber;
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'customer':
          aValue = a.customer?.name || '';
          bValue = b.customer?.name || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoices, searchTerm, filters, sort]);

  const handleSort = (field: SortOptions['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(filteredAndSortedInvoices.map(inv => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'sent': return 'مرسلة';
      case 'paid': return 'مدفوعة';
      case 'partially_paid': return 'مدفوعة جزئياً';
      case 'overdue': return 'متأخرة';
      case 'cancelled': return 'ملغية';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={14} />;
      case 'sent': return <CheckCircle size={14} />;
      case 'paid': return <CheckCircle size={14} />;
      case 'partially_paid': return <Clock size={14} />;
      case 'overdue': return <AlertTriangle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const SortButton: React.FC<{ field: SortOptions['field']; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
    >
      {children}
      {sort.field === field && (
        sort.direction === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">قائمة الفواتير</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              <Filter size={16} />
              تصفية متقدمة
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                تحديث
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث في الفواتير (رقم الفاتورة، اسم العميل، رمز العميل)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="sales">مبيعات</option>
                <option value="shipping">شحن</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="draft">مسودة</option>
                <option value="sent">مرسلة</option>
                <option value="partially_paid">مدفوعة جزئياً</option>
                <option value="paid">مدفوعة</option>
                <option value="overdue">متأخرة</option>
                <option value="cancelled">ملغية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من مبلغ</label>
              <input
                type="number"
                value={filters.amountFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, amountFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى مبلغ</label>
              <input
                type="number"
                value={filters.amountTo}
                onChange={(e) => setFilters(prev => ({ ...prev, amountTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              عرض {filteredAndSortedInvoices.length} من أصل {invoices.length} فاتورة
            </div>
            <button
              onClick={() => setFilters({
                type: 'all',
                status: 'all',
                dateFrom: '',
                dateTo: '',
                amountFrom: '',
                amountTo: '',
                customerId: '',
                currency: 'all'
              })}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              مسح جميع المرشحات
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-right">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === filteredAndSortedInvoices.length && filteredAndSortedInvoices.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                <SortButton field="invoiceNumber">رقم الفاتورة</SortButton>
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">النوع</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                <SortButton field="customer">العميل</SortButton>
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                <SortButton field="date">التاريخ</SortButton>
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                <SortButton field="total">المبلغ الإجمالي</SortButton>
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المبلغ المستحق</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                <SortButton field="status">الحالة</SortButton>
              </th>
              {showActions && (
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={showActions ? 9 : 8} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin h-6 w-6 text-blue-600 mr-2" />
                    جاري التحميل...
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedInvoices.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                  <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>لا توجد فواتير تطابق معايير البحث</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedInvoices.includes(invoice.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onInvoiceSelect?.(invoice)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectInvoice(invoice.id, e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-blue-600">{invoice.invoiceNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.type === 'sales' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {invoice.type === 'sales' ? 'مبيعات' : 'شحن'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{invoice.customer?.name}</div>
                      <div className="text-sm text-gray-500">{invoice.customer?.code}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {(isNaN(invoice.total) || !isFinite(invoice.total) ? 0 : invoice.total).toLocaleString('ar-LY')} {invoice.currency}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${
                      invoice.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {(isNaN(invoice.outstandingAmount) || !isFinite(invoice.outstandingAmount) ? 0 : invoice.outstandingAmount).toLocaleString('ar-LY')} {invoice.currency}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex space-x-2 space-x-reverse">
                        {onInvoiceView && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInvoiceView(invoice);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="عرض"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {onInvoiceEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInvoiceEdit(invoice);
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {onInvoiceDownload && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInvoiceDownload(invoice);
                            }}
                            className="text-orange-600 hover:text-orange-800"
                            title="تحميل"
                          >
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Actions */}
      {selectedInvoices.length > 0 && (
        <div className="p-4 border-t bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              تم تحديد {selectedInvoices.length} فاتورة
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                تحميل المحددة
              </button>
              <button className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                تصدير إلى Excel
              </button>
              <button
                onClick={() => setSelectedInvoices([])}
                className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceListView;

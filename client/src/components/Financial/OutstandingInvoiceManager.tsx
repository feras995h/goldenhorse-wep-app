import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, DollarSign, Clock, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react';
import { financialAPI } from '../../services/api';

interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  daysOverdue: number;
  customer: {
    id: string;
    name: string;
  };
  account: {
    id: string;
    code: string;
    name: string;
  };
}

interface Payment {
  id: string;
  paymentNumber: string;
  date: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

interface Receipt {
  id: string;
  receiptNumber: string;
  date: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

interface OutstandingInvoiceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  customerId?: string;
}

const OutstandingInvoiceManager: React.FC<OutstandingInvoiceManagerProps> = ({
  isOpen,
  onClose,
  accountId,
  customerId
}) => {
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<OutstandingInvoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_asc'); // FIFO by default

  useEffect(() => {
    if (isOpen) {
      loadOutstandingInvoices();
      loadAvailablePayments();
      loadAvailableReceipts();
    }
  }, [isOpen, accountId, customerId]);

  const loadOutstandingInvoices = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (accountId) params.accountId = accountId;
      if (customerId) params.customerId = customerId;

      const response = await financialAPI.get('/invoices/outstanding', { params });
      if (response.data.success) {
        let invoices = response.data.data || [];
        
        // Apply sorting (FIFO by default)
        invoices = sortInvoices(invoices, sortBy);
        
        setInvoices(invoices);
      }
    } catch (error) {
      console.error('Error loading outstanding invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePayments = async () => {
    try {
      const params: any = { limit: 50, status: 'completed' };
      if (accountId) params.accountId = accountId;

      const response = await financialAPI.get('/vouchers/payments', { params });
      if (response.data.success) {
        setPayments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const loadAvailableReceipts = async () => {
    try {
      const params: any = { limit: 50, status: 'completed' };
      if (accountId) params.accountId = accountId;

      const response = await financialAPI.get('/vouchers/receipts', { params });
      if (response.data.success) {
        setReceipts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading receipts:', error);
    }
  };

  const sortInvoices = (invoices: OutstandingInvoice[], sortBy: string) => {
    switch (sortBy) {
      case 'date_asc':
        return [...invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'date_desc':
        return [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'amount_asc':
        return [...invoices].sort((a, b) => a.outstandingAmount - b.outstandingAmount);
      case 'amount_desc':
        return [...invoices].sort((a, b) => b.outstandingAmount - a.outstandingAmount);
      case 'overdue':
        return [...invoices].sort((a, b) => b.daysOverdue - a.daysOverdue);
      default:
        return invoices;
    }
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setInvoices(prev => sortInvoices(prev, newSortBy));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'text-red-600 bg-red-50';
      case 'partially_paid': return 'text-yellow-600 bg-yellow-50';
      case 'paid': return 'text-green-600 bg-green-50';
      case 'overdue': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unpaid': return 'غير مدفوعة';
      case 'partially_paid': return 'مدفوعة جزئياً';
      case 'paid': return 'مدفوعة';
      case 'overdue': return 'متأخرة';
      default: return status;
    }
  };

  const getPriorityColor = (daysOverdue: number) => {
    if (daysOverdue > 30) return 'text-red-600';
    if (daysOverdue > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = filteredInvoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 ml-3" />
            <h2 className="text-xl font-bold text-gray-900">إدارة الفواتير المستحقة</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث برقم الفاتورة أو اسم العميل..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">كل الحالات</option>
                <option value="unpaid">غير مدفوعة</option>
                <option value="partially_paid">مدفوعة جزئياً</option>
                <option value="overdue">متأخرة</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date_asc">التاريخ (الأقدم أولاً - FIFO)</option>
                <option value="date_desc">التاريخ (الأحدث أولاً)</option>
                <option value="amount_asc">المبلغ (الأقل أولاً)</option>
                <option value="amount_desc">المبلغ (الأكبر أولاً)</option>
                <option value="overdue">الأكثر تأخيراً</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="flex items-center">
              <span className="text-gray-600">إجمالي الفواتير:</span>
              <span className="font-medium text-gray-900 mr-2">{filteredInvoices.length}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600">إجمالي المبلغ المستحق:</span>
              <span className="font-bold text-red-600 mr-2">{(isNaN(totalOutstanding) || !isFinite(totalOutstanding) ? 0 : totalOutstanding).toLocaleString('ar-LY')} د.ل</span>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل الفواتير...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فواتير مستحقة</h3>
              <p className="text-gray-600">لا توجد فواتير تطابق معايير البحث المحددة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedInvoice?.id === invoice.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{invoice.invoiceNumber}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                        {invoice.daysOverdue > 0 && (
                          <span className="flex items-center text-xs text-red-600">
                            <Clock className="h-3 w-3 ml-1" />
                            متأخر {invoice.daysOverdue} يوم
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{invoice.customer.name}</span>
                        <span className="mx-2">•</span>
                        <span>تاريخ الفاتورة: {new Date(invoice.date).toLocaleDateString('ar-LY')}</span>
                        <span className="mx-2">•</span>
                        <span>تاريخ الاستحقاق: {new Date(invoice.dueDate).toLocaleDateString('ar-LY')}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">إجمالي الفاتورة:</span>
                          <span className="font-medium text-gray-900 mr-1">{(isNaN(invoice.total) || !isFinite(invoice.total) ? 0 : invoice.total).toLocaleString('ar-LY')} د.ل</span>
                        </div>
                        <div>
                          <span className="text-gray-600">المدفوع:</span>
                          <span className="font-medium text-green-600 mr-1">{(isNaN(invoice.paidAmount) || !isFinite(invoice.paidAmount) ? 0 : invoice.paidAmount).toLocaleString('ar-LY')} د.ل</span>
                        </div>
                        <div>
                          <span className="text-gray-600">المستحق:</span>
                          <span className={`font-bold mr-1 ${getPriorityColor(invoice.daysOverdue)}`}>
                            {(isNaN(invoice.outstandingAmount) || !isFinite(invoice.outstandingAmount) ? 0 : invoice.outstandingAmount).toLocaleString('ar-LY')} د.ل
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {invoice.daysOverdue > 30 && <AlertCircle className="h-5 w-5 text-red-500" />}
                      {invoice.daysOverdue > 0 && invoice.daysOverdue <= 30 && <Clock className="h-5 w-5 text-yellow-500" />}
                      {invoice.daysOverdue <= 0 && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              عرض {filteredInvoices.length} من أصل {invoices.length} فاتورة
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutstandingInvoiceManager;

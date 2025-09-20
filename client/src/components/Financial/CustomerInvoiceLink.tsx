import React, { useState, useEffect } from 'react';
import { User, FileText, DollarSign, Calendar, Search, Filter, Eye, Edit, Download } from 'lucide-react';

interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
  currency: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'sales' | 'shipping';
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
}

interface CustomerInvoiceLinkProps {
  customerId?: string;
  onCustomerSelect?: (customer: Customer) => void;
  onInvoiceSelect?: (invoice: Invoice) => void;
  showActions?: boolean;
}

const CustomerInvoiceLink: React.FC<CustomerInvoiceLinkProps> = ({
  customerId,
  onCustomerSelect,
  onInvoiceSelect,
  showActions = true
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - replace with actual API calls
  const mockCustomers: Customer[] = [
    {
      id: 'cust-1',
      code: 'C000001',
      name: 'أحمد محمد علي',
      phone: '0912345678',
      email: 'ahmed@example.com',
      balance: 1500.00,
      currency: 'LYD'
    },
    {
      id: 'cust-2',
      code: 'C000002',
      name: 'فاطمة أحمد',
      phone: '0923456789',
      email: 'fatima@example.com',
      balance: 750.00,
      currency: 'USD'
    },
    {
      id: 'cust-3',
      code: 'C000003',
      name: 'محمد عبدالله',
      phone: '0934567890',
      email: 'mohammed@example.com',
      balance: -200.00,
      currency: 'LYD'
    }
  ];

  const mockInvoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2025-001',
      type: 'sales',
      date: '2025-09-15',
      dueDate: '2025-10-15',
      total: 1045.00,
      paidAmount: 500.00,
      outstandingAmount: 545.00,
      currency: 'LYD',
      status: 'partially_paid'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2025-002',
      type: 'sales',
      date: '2025-09-10',
      dueDate: '2025-10-10',
      total: 750.00,
      paidAmount: 0.00,
      outstandingAmount: 750.00,
      currency: 'LYD',
      status: 'sent'
    },
    {
      id: '3',
      invoiceNumber: 'SHIP-2025-001',
      type: 'shipping',
      date: '2025-09-12',
      dueDate: '2025-10-12',
      total: 200.00,
      paidAmount: 200.00,
      outstandingAmount: 0.00,
      currency: 'USD',
      status: 'paid'
    }
  ];

  useEffect(() => {
    setCustomers(mockCustomers);
    if (customerId) {
      const customer = mockCustomers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        loadCustomerInvoices(customerId);
      }
    }
  }, [customerId]);

  const loadCustomerInvoices = async (custId: string) => {
    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      const invoices = mockInvoices.filter(inv => {
        // In real implementation, filter by customer ID
        return true; // For demo, show all invoices
      });
      setCustomerInvoices(invoices);
    } catch (error) {
      console.error('Error loading customer invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    loadCustomerInvoices(customer.id);
    onCustomerSelect?.(customer);
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

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = customerInvoices.filter(invoice =>
    statusFilter === 'all' || invoice.status === statusFilter
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <User size={20} />
          ربط الفواتير بالعملاء
        </h3>
      </div>

      <div className="p-4">
        {/* Customer Selection */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">اختيار العميل</h4>
          
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في العملاء..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedCustomer?.id === customer.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.code}</div>
                    {customer.phone && (
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-medium ${
                      customer.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(isNaN(customer.balance) || !isFinite(customer.balance) ? 0 : customer.balance).toLocaleString('ar-LY')} {customer.currency}
                    </div>
                    <div className="text-xs text-gray-500">الرصيد</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Invoices */}
        {selectedCustomer && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <FileText size={16} />
                فواتير العميل: {selectedCustomer.name}
              </h4>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">جاري تحميل الفواتير...</p>
              </div>
            ) : filteredInvoices.length > 0 ? (
              <div className="space-y-3">
                {filteredInvoices.map(invoice => (
                  <div
                    key={invoice.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-blue-600">
                            {invoice.invoiceNumber}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {getStatusText(invoice.status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.type === 'sales' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {invoice.type === 'sales' ? 'مبيعات' : 'شحن'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <Calendar size={14} className="inline ml-1" />
                            {new Date(invoice.date).toLocaleDateString('ar-SA')}
                          </div>
                          <div>
                            <DollarSign size={14} className="inline ml-1" />
                            {(isNaN(invoice.total) || !isFinite(invoice.total) ? 0 : invoice.total).toLocaleString('ar-LY')} {invoice.currency}
                          </div>
                        </div>
                        
                        {invoice.outstandingAmount > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">المبلغ المستحق: </span>
                            <span className="font-medium text-red-600">
                              {(isNaN(invoice.outstandingAmount) || !isFinite(invoice.outstandingAmount) ? 0 : invoice.outstandingAmount).toLocaleString('ar-LY')} {invoice.currency}
                            </span>
                          </div>
                        )}
                      </div>

                      {showActions && (
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => onInvoiceSelect?.(invoice)}
                            className="text-blue-600 hover:text-blue-800"
                            title="عرض"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => console.log('Edit invoice:', invoice.id)}
                            className="text-green-600 hover:text-green-800"
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => console.log('Download invoice:', invoice.id)}
                            className="text-orange-600 hover:text-orange-800"
                            title="تحميل"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                <p>لا توجد فواتير لهذا العميل</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInvoiceLink;

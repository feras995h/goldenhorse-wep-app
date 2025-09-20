import React, { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Calendar,
  User,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Minus
} from 'lucide-react';

interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface SalesInvoiceItem {
  id?: string;
  itemCode?: string;
  description: string;
  descriptionEn?: string;
  category?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
  notes?: string;
  weight?: number;
  dimensions?: any;
  color?: string;
  size?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  warrantyPeriod?: number;
  stockLocation?: string;
  batchNumber?: string;
  expiryDate?: string;
}

interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxPercent: number;
  total: number;
  paidAmount: number;
  currency: string;
  exchangeRate: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  paymentMethod?: string;
  paymentReference?: string;
  paymentTerms: number;
  notes?: string;
  terms?: string;
  salesPerson?: string;
  salesChannel: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: SalesInvoiceItem[];
}

interface FormData {
  customerId: string;
  date: string;
  dueDate: string;
  discountPercent: number;
  taxPercent: number;
  currency: string;
  exchangeRate: number;
  paymentTerms: number;
  salesPerson: string;
  salesChannel: string;
  deliveryMethod: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryFee: number;
  notes: string;
  terms: string;
  items: SalesInvoiceItem[];
}

// FormField component
interface FormFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, description, children, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {description && (
      <p className="text-xs text-gray-500 mb-2">{description}</p>
    )}
    {children}
    {error && (
      <p className="text-red-500 text-xs mt-1">{error}</p>
    )}
  </div>
);

const SalesInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [salesPersonFilter, setSalesPersonFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Payment modal state
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<SalesInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'account_credit'>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [counterAccountId, setCounterAccountId] = useState<string>('');

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discountPercent: 0,
    taxPercent: 0,
    currency: 'LYD',
    exchangeRate: 1.0,
    paymentTerms: 30,
    salesPerson: '',
    salesChannel: 'direct',
    deliveryMethod: 'pickup',
    deliveryAddress: '',
    deliveryDate: '',
    deliveryFee: 0,
    notes: '',
    terms: '',
    items: []
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, [pagination.current, searchValue, statusFilter, paymentStatusFilter, customerFilter, salesPersonFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      const result = await salesAPI.getSalesInvoicesV2({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        customerId: customerFilter || undefined,
        salesPerson: salesPersonFilter || undefined,
      });

      setInvoices(result.data || result.items || []);
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || result.total || 0
      }));


    } catch (error) {
      console.error('Error loading sales invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const result = await salesAPI.getCustomers();
      setCustomers(result.data || result.items || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      'draft': 'مسودة',
      'sent': 'مرسلة',
      'paid': 'مدفوعة',
      'overdue': 'متأخرة',
      'cancelled': 'ملغية'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    const paymentStatusTexts = {
      'unpaid': 'غير مدفوعة',
      'partial': 'دفع جزئي',
      'paid': 'مدفوعة',
      'overpaid': 'دفع زائد'
    };
    return paymentStatusTexts[paymentStatus as keyof typeof paymentStatusTexts] || paymentStatus;
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    const paymentStatusColors = {
      'unpaid': 'bg-red-100 text-red-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'overpaid': 'bg-blue-100 text-blue-800'
    };
    return paymentStatusColors[paymentStatus as keyof typeof paymentStatusColors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-gradient border-r-4 border-green-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg ml-4">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">فواتير المبيعات</h1>
              <p className="text-lg text-gray-600">إدارة فواتير المبيعات والمنتجات</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">إجمالي الفواتير</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="البحث برقم الفاتورة، اسم العميل، أو وصف المنتج..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="form-input pr-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select min-w-[150px]"
            >
              <option value="">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="sent">مرسلة</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
              <option value="cancelled">ملغية</option>
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="form-select min-w-[150px]"
            >
              <option value="">جميع حالات الدفع</option>
              <option value="unpaid">غير مدفوعة</option>
              <option value="partial">دفع جزئي</option>
              <option value="paid">مدفوعة</option>
              <option value="overpaid">دفع زائد</option>
            </select>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="form-select min-w-[150px]"
            >
              <option value="">جميع العملاء</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <select
              value={salesPersonFilter}
              onChange={(e) => setSalesPersonFilter(e.target.value)}
              className="form-select min-w-[150px]"
            >
              <option value="">جميع المندوبين</option>
              <option value="محمد أحمد">محمد أحمد</option>
              <option value="فاطمة سالم">فاطمة سالم</option>
              <option value="علي حسن">علي حسن</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => loadInvoices()}
              className="btn btn-secondary flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <button
              onClick={() => openModal('create')}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 ml-2" />
              فاتورة مبيعات جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الفاتورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مندوب المبيعات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العناصر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ الإجمالي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  حالة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString('ar-EG')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.customer?.name}</div>
                    <div className="text-sm text-gray-500">{invoice.customer?.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.salesPerson || '-'}</div>
                    <div className="text-sm text-gray-500">{invoice.salesChannel === 'direct' ? 'مباشر' : invoice.salesChannel === 'online' ? 'أونلاين' : 'هاتف'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {invoice.items?.length || 0} عنصر
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.items?.slice(0, 2).map(item => item.description).join(', ')}
                      {(invoice.items?.length || 0) > 2 && '...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total)}</div>
                    {invoice.paidAmount > 0 && (
                      <div className="text-sm text-gray-500">مدفوع: {formatCurrency(invoice.paidAmount)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                      {getPaymentStatusText(invoice.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => openModal('view', invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="عرض"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {invoice.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => openModal('edit', invoice)}
                          className="text-green-600 hover:text-green-900"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {invoice.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-900"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {invoice.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => handlePayment(invoice)}
                          className="text-purple-600 hover:text-purple-900"
                          title="تسجيل دفع"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد فواتير مبيعات</p>
          </div>
        )}
      </div>
    </div>
  );

  // Action handlers
  const handleDelete = async (invoiceId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    try {
      await salesAPI.deleteSalesInvoiceV2(invoiceId);
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('خطأ في حذف الفاتورة');
    }
  };

  const handlePayment = (invoice: SalesInvoice) => {
    const remaining = parseFloat(String(invoice.total)) - parseFloat(String(invoice.paidAmount || 0));
    setPaymentInvoice(invoice);
    setPaymentAmount(Math.max(remaining, 0));
    setPaymentMethod('cash');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentReference('');
    setCounterAccountId('');
    setPaymentModalOpen(true);
  };

  const recordPayment = async (invoiceId: string, amount: number) => {
    try {
      await salesAPI.recordSalesInvoicePayment(invoiceId, {
        amount,
        paymentMethod,
        paymentReference,
        date: paymentDate,
        counterAccountId: counterAccountId || undefined
      });

      // Close modal and refresh list
      setPaymentModalOpen(false);
      setPaymentInvoice(null);
      loadInvoices();
      alert('تم تسجيل الدفع بنجاح');
    } catch (error) {
      console.error('Error recording الدفع:', error);
      alert('خطأ في تسجيل الدفع');
    }
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setPaymentInvoice(null);
  };

  const openModal = (mode: 'create' | 'edit' | 'view', invoice?: SalesInvoice) => {
    setModalMode(mode);
    setSelectedInvoice(invoice || null);

    if (mode === 'create') {
      setFormData({
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        discountPercent: 0,
        taxPercent: 0,
        currency: 'LYD',
        exchangeRate: 1.0,
        paymentTerms: 30,
        salesPerson: '',
        salesChannel: 'direct',
        deliveryMethod: 'pickup',
        deliveryAddress: '',
        deliveryDate: '',
        deliveryFee: 0,
        notes: '',
        terms: '',
        items: []
      });
    } else if (invoice) {
      setFormData({
        customerId: invoice.customerId,
        date: invoice.date,
        dueDate: invoice.dueDate,
        discountPercent: invoice.discountPercent,
        taxPercent: invoice.taxPercent,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        paymentTerms: invoice.paymentTerms,
        salesPerson: invoice.salesPerson || '',
        salesChannel: invoice.salesChannel,
        deliveryMethod: invoice.deliveryMethod,
        deliveryAddress: invoice.deliveryAddress || '',
        deliveryDate: invoice.deliveryDate || '',
        deliveryFee: invoice.deliveryFee,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        items: invoice.items || []
      });
    }

    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.customerId) {
      errors.customerId = 'يجب اختيار العميل';
    }

    if (!formData.date) {
      errors.date = 'يجب إدخال تاريخ الفاتورة';
    }

    if (!formData.dueDate) {
      errors.dueDate = 'يجب إدخال تاريخ الاستحقاق';
    }

    if (formData.items.length === 0) {
      errors.items = 'يجب إضافة عنصر واحد على الأقل';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // سياسة خصم/ضريبة على مستوى الفاتورة فقط
      const payload = {
        ...formData,
        items: formData.items.map(it => ({
          ...it,
          discountPercent: 0,
          taxPercent: 0
        }))
      };

      if (modalMode === 'edit' && selectedInvoice) {
        await salesAPI.updateSalesInvoiceV2(selectedInvoice.id, payload);
      } else {
        await salesAPI.createSalesInvoiceV2(payload);
      }

      closeModal();
      loadInvoices();
    } catch (error) {
      console.error('Error saving sales invoice:', error);
      alert('خطأ في حفظ فاتورة المبيعات');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    const newItem: SalesInvoiceItem = {
      description: '',
      quantity: 1,
      unit: 'قطعة',
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 0,
      taxAmount: 0,
      lineTotal: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof SalesInvoiceItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Recalculate line total (invoice-level discount/tax policy)
      const item = newItems[index];
      const subtotal = item.quantity * item.unitPrice;
      item.lineTotal = subtotal;
      item.discountAmount = 0;
      item.taxAmount = 0;

      return {
        ...prev,
        items: newItems
      };
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = formData.items.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalTax = formData.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal - totalDiscount + totalTax + formData.deliveryFee;

    return {
      subtotal,
      totalDiscount,
      totalTax,
      total
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-gradient border-r-4 border-green-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg ml-4">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">فواتير المبيعات</h1>
              <p className="text-lg text-gray-600">إدارة فواتير المبيعات والمنتجات</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">إجمالي الفواتير</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="البحث برقم الفاتورة، اسم العميل، أو وصف المنتج..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="form-input pr-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select min-w-[150px]"
            >
              <option value="">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="sent">مرسلة</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
              <option value="cancelled">ملغية</option>
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="form-select min-w-[150px]"
            >
              <option value="">جميع حالات الدفع</option>
              <option value="unpaid">غير مدفوعة</option>
              <option value="partial">دفع جزئي</option>
              <option value="paid">مدفوعة</option>
              <option value="overpaid">دفع زائد</option>
            </select>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="form-select min-w-[150px]"
            >
              <option value="">جميع العملاء</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <select
              value={salesPersonFilter}
              onChange={(e) => setSalesPersonFilter(e.target.value)}
              className="form-select min-w-[150px]"
            >
              <option value="">جميع المندوبين</option>
              <option value="محمد أحمد">محمد أحمد</option>
              <option value="فاطمة سالم">فاطمة سالم</option>
              <option value="علي حسن">علي حسن</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => loadInvoices()}
              className="btn btn-secondary flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <button
              onClick={() => openModal('create')}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 ml-2" />
              فاتورة مبيعات جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الفاتورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مندوب المبيعات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العناصر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ الإجمالي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  حالة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString('ar-EG')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.customer?.name}</div>
                    <div className="text-sm text-gray-500">{invoice.customer?.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.salesPerson || '-'}</div>
                    <div className="text-sm text-gray-500">{invoice.salesChannel === 'direct' ? 'مباشر' : invoice.salesChannel === 'online' ? 'أونلاين' : 'هاتف'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {invoice.items?.length || 0} عنصر
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.items?.slice(0, 2).map(item => item.description).join(', ')}
                      {(invoice.items?.length || 0) > 2 && '...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total)}</div>
                    {invoice.paidAmount > 0 && (
                      <div className="text-sm text-gray-500">مدفوع: {formatCurrency(invoice.paidAmount)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                      {getPaymentStatusText(invoice.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => openModal('view', invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="عرض"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {invoice.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => openModal('edit', invoice)}
                          className="text-green-600 hover:text-green-900"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {invoice.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-900"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {invoice.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => handlePayment(invoice)}
                          className="text-purple-600 hover:text-purple-900"
                          title="تسجيل دفع"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد فواتير مبيعات</p>
          </div>
        )}
      </div>

      {/* Modal for Create/Edit/View Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' ? 'إنشاء فاتورة مبيعات جديدة' :
                   modalMode === 'edit' ? 'تعديل فاتورة المبيعات' : 'عرض فاتورة المبيعات'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">معلومات العميل</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="العميل *"
                    error={formErrors.customerId}
                  >
                    <select
                      value={formData.customerId}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                      className="form-select"
                      disabled={modalMode === 'view'}
                    >
                      <option value="">اختر العميل</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.code})
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="مندوب المبيعات"
                  >
                    <input
                      type="text"
                      value={formData.salesPerson}
                      onChange={(e) => setFormData(prev => ({ ...prev, salesPerson: e.target.value }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="أدخل اسم مندوب المبيعات"
                    />
                  </FormField>
                </div>
              </div>

              {/* Invoice Dates */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">تواريخ الفاتورة</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="تاريخ الفاتورة *"
                    error={formErrors.date}
                  >
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                    />
                  </FormField>

                  <FormField
                    label="تاريخ الاستحقاق *"
                    error={formErrors.dueDate}
                  >
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                    />
                  </FormField>

                  <FormField
                    label="شروط الدفع (أيام)"
                  >
                    <input
                      type="number"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) || 30 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="30"
                      min="1"
                    />
                  </FormField>
                </div>
              </div>

              {/* Sales Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">معلومات البيع</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="قناة البيع"
                  >
                    <select
                      value={formData.salesChannel}
                      onChange={(e) => setFormData(prev => ({ ...prev, salesChannel: e.target.value }))}
                      className="form-select"
                      disabled={modalMode === 'view'}
                    >
                      <option value="direct">مباشر</option>
                      <option value="online">أونلاين</option>
                      <option value="phone">هاتف</option>
                    </select>
                  </FormField>

                  <FormField
                    label="طريقة التسليم"
                  >
                    <select
                      value={formData.deliveryMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                      className="form-select"
                      disabled={modalMode === 'view'}
                    >
                      <option value="pickup">استلام من المحل</option>
                      <option value="delivery">توصيل</option>
                      <option value="shipping">شحن</option>
                    </select>
                  </FormField>
                </div>

                {formData.deliveryMethod !== 'pickup' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label="عنوان التسليم"
                    >
                      <textarea
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                        className="form-textarea"
                        disabled={modalMode === 'view'}
                        rows={2}
                        placeholder="أدخل عنوان التسليم..."
                      />
                    </FormField>

                    <div className="space-y-4">
                      <FormField
                        label="تاريخ التسليم"
                      >
                        <input
                          type="date"
                          value={formData.deliveryDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                          className="form-input"
                          disabled={modalMode === 'view'}
                        />
                      </FormField>

                      <FormField
                        label="رسوم التسليم (د.ل)"
                      >
                        <input
                          type="number"
                          value={formData.deliveryFee}
                          onChange={(e) => setFormData(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                          className="form-input"
                          disabled={modalMode === 'view'}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                      </FormField>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-gray-900">عناصر الفاتورة</h4>
                  {modalMode !== 'view' && (
                    <button
                      onClick={addItem}
                      className="btn btn-secondary btn-sm flex items-center"
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة عنصر
                    </button>
                  )}
                </div>

                {formErrors.items && (
                  <p className="text-red-500 text-sm mb-4">{formErrors.items}</p>
                )}

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium text-gray-900">العنصر {index + 1}</h5>
                        {modalMode !== 'view' && formData.items.length > 1 && (
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="وصف المنتج *"
                        >
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="form-input"
                            disabled={modalMode === 'view'}
                            placeholder="أدخل وصف المنتج"
                          />
                        </FormField>

                        <FormField
                          label="رمز المنتج"
                        >
                          <input
                            type="text"
                            value={item.itemCode || ''}
                            onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
                            className="form-input"
                            disabled={modalMode === 'view'}
                            placeholder="أدخل رمز المنتج"
                          />
                        </FormField>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <FormField
                          label="الكمية *"
                        >
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                            className="form-input"
                            disabled={modalMode === 'view'}
                            placeholder="1"
                            min="1"
                            step="0.01"
                          />
                        </FormField>

                        <FormField
                          label="الوحدة"
                        >
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            className="form-select"
                            disabled={modalMode === 'view'}
                          >
                            <option value="قطعة">قطعة</option>
                            <option value="كيلو">كيلو</option>
                            <option value="متر">متر</option>
                            <option value="لتر">لتر</option>
                            <option value="صندوق">صندوق</option>
                            <option value="رزمة">رزمة</option>
                          </select>
                        </FormField>

                        <FormField
                          label="سعر الوحدة (د.ل) *"
                        >
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="form-input"
                            disabled={modalMode === 'view'}
                            placeholder="0"
                            min="0"
                            step="0.01"
                          />
                        </FormField>

                        <FormField
                          label="المجموع الفرعي"
                        >
                          <input
                            type="text"
                            value={formatCurrency(item.lineTotal)}
                            className="form-input bg-gray-50"
                            disabled
                          />
                        </FormField>
                      </div>

                      {false && (

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          label="نسبة الخصم (%)"
                        >
                          <input
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) => updateItem(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                            className="form-input"
                            disabled={modalMode === 'view'}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </FormField>

                        <FormField
                          label="نسبة الضريبة (%)"
                        >
                          <input
                            type="number"
                            value={item.taxPercent}
                            onChange={(e) => updateItem(index, 'taxPercent', parseFloat(e.target.value) || 0)}
                            className="form-input"
                            disabled={modalMode === 'view'}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </FormField>
                      </div>
                      )}

                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-700">المجموع الفرعي:</span>
                      <span className="font-medium text-green-800">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">إجمالي الخصم:</span>
                      <span className="font-medium text-green-800">-{formatCurrency(totals.totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">إجمالي الضريبة:</span>
                      <span className="font-medium text-green-800">{formatCurrency(totals.totalTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">رسوم التسليم:</span>
                      <span className="font-medium text-green-800">{formatCurrency(formData.deliveryFee)}</span>
                    </div>
                    <div className="border-t border-green-200 pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-green-800">المبلغ الإجمالي:</span>
                        <span className="text-green-900">{formatCurrency(totals.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">معلومات إضافية</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="ملاحظات"
                  >
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="form-textarea"
                      disabled={modalMode === 'view'}
                      rows={3}
                      placeholder="أدخل أي ملاحظات..."
                    />
                  </FormField>

                  <FormField
                    label="الشروط والأحكام"
                  >
                    <textarea
                      value={formData.terms}
                      onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                      className="form-textarea"
                      disabled={modalMode === 'view'}
                      rows={3}
                      placeholder="أدخل الشروط والأحكام..."
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  onClick={closeModal}
                  className="btn btn-outline"
                >
                  {modalMode === 'view' ? 'إغلاق' : 'إلغاء'}
                </button>
                {modalMode !== 'view' && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? 'جاري الحفظ...' : modalMode === 'edit' ? 'تحديث' : 'إنشاء'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && paymentInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">تسجيل دفع للفاتورة #{paymentInvoice!.invoiceNumber}</h3>
                <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">×</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <input type="number" value={paymentAmount} min={0} step={0.01} onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} className="form-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="form-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="form-select w-full">
                  <option value="cash">نقدي</option>
                  <option value="bank_transfer">حوالة مصرفية</option>
                  <option value="check">شيك</option>
                  <option value="credit_card">بطاقة</option>
                  <option value="account_credit">مقاصة/رصيد</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مرجع الدفع (اختياري)</label>
                <input type="text" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} className="form-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حساب مقابل (اختياري)</label>
                <input type="text" value={counterAccountId} onChange={e => setCounterAccountId(e.target.value)} className="form-input w-full" placeholder="ID الحساب" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3 space-x-reverse">
              <button onClick={closePaymentModal} className="btn btn-outline">إلغاء</button>
              <button onClick={() => paymentInvoice && recordPayment(paymentInvoice.id, paymentAmount)} className="btn btn-primary">تسجيل الدفع</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesInvoices;

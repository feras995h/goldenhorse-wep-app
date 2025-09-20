import React, { useState, useEffect } from 'react';
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
  Package,
  Calendar,
  User,
  Phone,
  MapPin,
  CreditCard
} from 'lucide-react';
import { salesAPI } from '../services/api';


interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  itemDescription: string;
  weight?: number;
  volume?: number;
}

interface ShippingInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  shipmentId?: string;
  trackingNumber?: string;
  date: string;
  dueDate: string;
  shippingCost: number;
  handlingFee: number;
  storageFee: number;
  customsClearanceFee: number;
  insuranceFee: number;
  additionalFees: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  currency: string;
  exchangeRate: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  paymentMethod?: string;
  paymentReference?: string;
  itemDescription?: string;
  itemDescriptionEn?: string;
  quantity: number;
  weight?: number;
  volume?: number;
  originLocation?: string;
  destinationLocation?: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  shipment?: Shipment;
}

interface FormData {
  customerId: string;
  shipmentId: string;
  trackingNumber: string;
  date: string;
  dueDate: string;
  shippingCost: number;
  handlingFee: number;
  storageFee: number;
  customsClearanceFee: number;
  insuranceFee: number;
  additionalFees: number;
  discountAmount: number;
  taxAmount: number;
  currency: string;
  exchangeRate: number;
  paymentMethod: string;
  paymentReference: string;
  itemDescription: string;
  itemDescriptionEn: string;
  quantity: number;
  weight: number;
  volume: number;
  originLocation: string;
  destinationLocation: string;
  notes: string;
  terms: string;
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

const ShippingInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<ShippingInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedInvoice, setSelectedInvoice] = useState<ShippingInvoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    shipmentId: '',
    trackingNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    shippingCost: 0,
    handlingFee: 0,
    storageFee: 0,
    customsClearanceFee: 0,
    insuranceFee: 0,
    additionalFees: 0,
    discountAmount: 0,
    taxAmount: 0,
    currency: 'LYD',
    exchangeRate: 1.0,
    paymentMethod: 'cash',
    paymentReference: '',
    itemDescription: '',
    itemDescriptionEn: '',
    quantity: 1,
    weight: 0,
    volume: 0,
    originLocation: '',
    destinationLocation: '',
    notes: '',
    terms: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, [pagination.current, searchValue, statusFilter, paymentStatusFilter, customerFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };
      if (searchValue) params.search = searchValue;
      if (statusFilter) params.status = statusFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (customerFilter) params.customerId = customerFilter;

      const result = await salesAPI.getShippingInvoices(params);
      setInvoices(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || 0
      }));

      // Fallback to mock data if no real data
      if (!result.data || result.data.length === 0) {
        const mockInvoices: ShippingInvoice[] = [
          {
            id: '1',
            invoiceNumber: 'SH000001',
            customerId: '1',
            trackingNumber: 'GH2024001',
            date: '2024-01-15',
            dueDate: '2024-02-14',
            shippingCost: 150.00,
            handlingFee: 25.00,
            storageFee: 30.00,
            customsClearanceFee: 50.00,
            insuranceFee: 15.00,
            additionalFees: 0.00,
            discountAmount: 0.00,
            subtotal: 270.00,
            taxAmount: 27.00,
            total: 297.00,
            paidAmount: 0.00,
            currency: 'LYD',
            exchangeRate: 1.0,
            status: 'sent',
            paymentStatus: 'unpaid',
            paymentMethod: 'cash',
            itemDescription: 'هاتف ذكي آيفون 15',
            itemDescriptionEn: 'iPhone 15 Smartphone',
            quantity: 1,
            weight: 0.5,
            volume: 240,
            originLocation: 'قوانغتشو، الصين',
            destinationLocation: 'طرابلس، ليبيا',
            notes: 'شحنة عادية',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            customer: {
              id: '1',
              code: 'C000001',
              name: 'أحمد محمد علي',
              phone: '+218912345678',
              email: 'ahmed@example.com'
            }
          },
          {
            id: '2',
            invoiceNumber: 'SH000002',
            customerId: '2',
            trackingNumber: 'GH2024002',
            date: '2024-01-16',
            dueDate: '2024-02-15',
            shippingCost: 200.00,
            handlingFee: 40.00,
            storageFee: 50.00,
            customsClearanceFee: 80.00,
            insuranceFee: 25.00,
            additionalFees: 10.00,
            discountAmount: 20.00,
            subtotal: 385.00,
            taxAmount: 38.50,
            total: 423.50,
            paidAmount: 423.50,
            currency: 'LYD',
            exchangeRate: 1.0,
            status: 'paid',
            paymentStatus: 'paid',
            paymentMethod: 'bank_transfer',
            paymentReference: 'TXN123456',
            itemDescription: 'ملابس نسائية متنوعة',
            itemDescriptionEn: 'Women\'s Clothing Assortment',
            quantity: 5,
            weight: 2.3,
            volume: 18000,
            originLocation: 'قوانغتشو، الصين',
            destinationLocation: 'بنغازي، ليبيا',
            notes: 'تم الدفع مسبقاً',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            customer: {
              id: '2',
              code: 'C000002',
              name: 'فاطمة أحمد',
              phone: '+218923456789',
              email: 'fatima@example.com'
            }
          }
        ];

        setInvoices(mockInvoices);
        setPagination(prev => ({
          ...prev,
          total: mockInvoices.length
        }));
      }
    } catch (error) {
      console.error('Error loading shipping invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const result = await salesAPI.getCustomers();
      setCustomers(result.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      // Fallback to mock customers
      const mockCustomers: Customer[] = [
        { id: '1', code: 'C000001', name: 'أحمد محمد علي', phone: '+218912345678' },
        { id: '2', code: 'C000002', name: 'فاطمة أحمد', phone: '+218923456789' },
        { id: '3', code: 'C000003', name: 'محمد سالم', phone: '+218934567890' }
      ];
      setCustomers(mockCustomers);
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

  const calculateTotal = () => {
    const subtotal = (
      formData.shippingCost +
      formData.handlingFee +
      formData.storageFee +
      formData.customsClearanceFee +
      formData.insuranceFee +
      formData.additionalFees
    ) - formData.discountAmount;

    return subtotal + formData.taxAmount;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-gradient border-r-4 border-blue-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ml-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">فواتير الشحن</h1>
              <p className="text-lg text-gray-600">إدارة فواتير الشحن والخدمات اللوجستية</p>
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
                placeholder="البحث برقم الفاتورة، رقم التتبع، أو وصف البضاعة..."
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
              onClick={() => {
                setModalMode('create');
                setSelectedInvoice(null);
                setIsModalOpen(true);
              }}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 ml-2" />
              فاتورة شحن جديدة
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
                  رقم التتبع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البضاعة
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
                    <div className="text-sm text-gray-900">{invoice.trackingNumber || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{invoice.itemDescription}</div>
                    <div className="text-sm text-gray-500">
                      {invoice.quantity} قطعة
                      {invoice.weight && ` • ${invoice.weight} كغ`}
                      {invoice.volume && ` • ${(invoice.volume / 1000).toFixed(2)} لتر`}
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
                        onClick={() => {
                          setModalMode('view');
                          setSelectedInvoice(invoice);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="عرض"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {invoice.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => {
                            setModalMode('edit');
                            setSelectedInvoice(invoice);
                            setIsModalOpen(true);
                          }}
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
            <p className="text-gray-500">لا توجد فواتير شحن</p>
          </div>
        )}
      </div>
    </div>
  );

  // Action handlers
  const handleDelete = async (invoiceId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    try {
      const result = await salesAPI.deleteShippingInvoice(invoiceId);
      // Optionally inspect result for message/status

      // If API didn't throw, proceed
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('خطأ في حذف الفاتورة');
    }
  };

  const handlePayment = (invoice: ShippingInvoice) => {
    const amount = prompt('أدخل مبلغ الدفع:', (invoice.total - invoice.paidAmount).toString());
    if (!amount) return;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('مبلغ الدفع غير صحيح');
      return;
    }

    recordPayment(invoice.id, paymentAmount);
  };

  const recordPayment = async (invoiceId: string, amount: number) => {
    try {
      await salesAPI.recordShippingInvoicePayment(invoiceId, {
        amount,
        method: 'cash',
        reference: undefined,
        date: new Date().toISOString().slice(0, 10),
      });

      loadInvoices();
      alert('تم تسجيل الدفع بنجاح');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('خطأ في تسجيل الدفع');
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', invoice?: ShippingInvoice) => {
    setModalMode(mode);
    setSelectedInvoice(invoice || null);

    if (mode === 'create') {
      setFormData({
        customerId: '',
        shipmentId: '',
        trackingNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        shippingCost: 0,
        handlingFee: 0,
        storageFee: 0,
        customsClearanceFee: 0,
        insuranceFee: 0,
        additionalFees: 0,
        discountAmount: 0,
        taxAmount: 0,
        currency: 'LYD',
        exchangeRate: 1.0,
        paymentMethod: 'cash',
        paymentReference: '',
        itemDescription: '',
        itemDescriptionEn: '',
        quantity: 1,
        weight: 0,
        volume: 0,
        originLocation: '',
        destinationLocation: '',
        notes: '',
        terms: ''
      });
    } else if (invoice) {
      setFormData({
        customerId: invoice.customerId,
        shipmentId: invoice.shipmentId || '',
        trackingNumber: invoice.trackingNumber || '',
        date: invoice.date,
        dueDate: invoice.dueDate,
        shippingCost: invoice.shippingCost,
        handlingFee: invoice.handlingFee,
        storageFee: invoice.storageFee,
        customsClearanceFee: invoice.customsClearanceFee,
        insuranceFee: invoice.insuranceFee,
        additionalFees: invoice.additionalFees,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.taxAmount,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        paymentMethod: invoice.paymentMethod || 'cash',
        paymentReference: invoice.paymentReference || '',
        itemDescription: invoice.itemDescription || '',
        itemDescriptionEn: invoice.itemDescriptionEn || '',
        quantity: invoice.quantity,
        weight: invoice.weight || 0,
        volume: invoice.volume || 0,
        originLocation: invoice.originLocation || '',
        destinationLocation: invoice.destinationLocation || '',
        notes: invoice.notes || '',
        terms: invoice.terms || ''
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

    if (formData.shippingCost < 0) {
      errors.shippingCost = 'تكلفة الشحن لا يمكن أن تكون سالبة';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (modalMode === 'edit' && selectedInvoice) {
        await salesAPI.updateShippingInvoice(selectedInvoice.id, formData);
      } else {
        await salesAPI.createShippingInvoice(formData);
      }

      console.log('Shipping invoice saved successfully');

      closeModal();
      loadInvoices();
    } catch (error) {
      console.error('Error saving shipping invoice:', error);
      alert('خطأ في حفظ فاتورة الشحن');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-gradient border-r-4 border-blue-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ml-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">فواتير الشحن</h1>
              <p className="text-lg text-gray-600">إدارة فواتير الشحن والخدمات اللوجستية</p>
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
                placeholder="البحث برقم الفاتورة، رقم التتبع، أو وصف البضاعة..."
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
              فاتورة شحن جديدة
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
                  رقم التتبع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البضاعة
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
                    <div className="text-sm text-gray-900">{invoice.trackingNumber || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{invoice.itemDescription}</div>
                    <div className="text-sm text-gray-500">
                      {invoice.quantity} قطعة
                      {invoice.weight && ` • ${invoice.weight} كغ`}
                      {invoice.volume && ` • ${(invoice.volume / 1000).toFixed(2)} لتر`}
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
            <p className="text-gray-500">لا توجد فواتير شحن</p>
          </div>
        )}
      </div>

      {/* Modal for Create/Edit/View Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' ? 'إنشاء فاتورة شحن جديدة' :
                   modalMode === 'edit' ? 'تعديل فاتورة الشحن' : 'عرض فاتورة الشحن'}
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
                    label="رقم التتبع"
                  >
                    <input
                      type="text"
                      value={formData.trackingNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="أدخل رقم التتبع"
                    />
                  </FormField>
                </div>
              </div>

              {/* Invoice Dates */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">تواريخ الفاتورة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Shipping Costs */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">تكاليف الشحن</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="تكلفة الشحن (د.ل)"
                    error={formErrors.shippingCost}
                  >
                    <input
                      type="number"
                      value={formData.shippingCost}
                      onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </FormField>

                  <FormField
                    label="رسوم المناولة (د.ل)"
                  >
                    <input
                      type="number"
                      value={formData.handlingFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, handlingFee: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </FormField>

                  <FormField
                    label="رسوم التخزين (د.ل)"
                  >
                    <input
                      type="number"
                      value={formData.storageFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, storageFee: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </FormField>

                  <FormField
                    label="رسوم التخليص الجمركي (د.ل)"
                  >
                    <input
                      type="number"
                      value={formData.customsClearanceFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, customsClearanceFee: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </FormField>

                  <FormField
                    label="رسوم التأمين (د.ل)"
                  >
                    <input
                      type="number"
                      value={formData.insuranceFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceFee: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </FormField>

                  <FormField
                    label="رسوم إضافية (د.ل)"
                  >
                    <input
                      type="number"
                      value={formData.additionalFees}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalFees: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    label="خصم (د.ل)"
                  >
                    <input
                      type="number"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </FormField>

                  <FormField
                    label="ضريبة (د.ل)"
                  >
                    <input
                      type="number"
                      value={formData.taxAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxAmount: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </FormField>
                </div>

                {/* Total Display */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-blue-800">المبلغ الإجمالي:</span>
                    <span className="text-blue-900">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">معلومات البضاعة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="وصف البضاعة"
                  >
                    <textarea
                      value={formData.itemDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, itemDescription: e.target.value }))}
                      className="form-textarea"
                      disabled={modalMode === 'view'}
                      rows={3}
                      placeholder="أدخل وصف البضاعة..."
                    />
                  </FormField>

                  <FormField
                    label="الوصف بالإنجليزية"
                  >
                    <textarea
                      value={formData.itemDescriptionEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, itemDescriptionEn: e.target.value }))}
                      className="form-textarea"
                      disabled={modalMode === 'view'}
                      rows={3}
                      placeholder="Enter item description in English..."
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <FormField
                    label="الكمية"
                  >
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="1"
                      min="1"
                    />
                  </FormField>

                  <FormField
                    label="الوزن (كغ)"
                  >
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </FormField>

                  <FormField
                    label="الحجم (سم³)"
                  >
                    <input
                      type="number"
                      value={formData.volume}
                      onChange={(e) => setFormData(prev => ({ ...prev, volume: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    label="موقع المنشأ"
                  >
                    <input
                      type="text"
                      value={formData.originLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, originLocation: e.target.value }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="أدخل موقع المنشأ"
                    />
                  </FormField>

                  <FormField
                    label="موقع الوجهة"
                  >
                    <input
                      type="text"
                      value={formData.destinationLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, destinationLocation: e.target.value }))}
                      className="form-input"
                      disabled={modalMode === 'view'}
                      placeholder="أدخل موقع الوجهة"
                    />
                  </FormField>
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
    </div>
  );
};

export default ShippingInvoices;

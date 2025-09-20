import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  RefreshCw,
  DollarSign,
  Package,
  CheckCircle,
  Download
} from 'lucide-react';

import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';

import InvoiceStatusModal from '../components/Financial/InvoiceStatusModal';
import InvoiceFormModal from '../components/Financial/InvoiceFormModal';
import { salesAPI } from '../services/api';

// Types
interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  currency: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'sales' | 'shipping';
  customerId: string;
  customer?: Customer;
  date: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  currency: string;
  exchangeRate: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceFilters {
  type: 'all' | 'sales' | 'shipping';
  status: 'all' | 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  paymentStatus: 'all' | 'unpaid' | 'partial' | 'paid' | 'overpaid';
  customerId: string;
  dateFrom: string;
  dateTo: string;
}

const InvoiceManagementUnified: React.FC = () => {
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'shipping'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [invoiceType, setInvoiceType] = useState<'sales' | 'shipping'>('sales');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [filters] = useState<InvoiceFilters>({
    type: 'all',
    status: 'all',
    paymentStatus: 'all',
    customerId: '',
    dateFrom: '',
    dateTo: ''
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Load data
  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, [pagination.current, searchValue, filters, activeTab]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        customerId: filters.customerId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
      };

      if (activeTab === 'sales') {
        const res = await salesAPI.getInvoices(params);
        const data = (res?.data || []).map((inv: any) => ({ ...inv, type: 'sales' as const }));
        setInvoices(data);
        setPagination(prev => ({ ...prev, total: res?.total || data.length }));
      } else if (activeTab === 'shipping') {
        const res = await salesAPI.getShippingInvoices({
          page: params.page,
          limit: params.limit,
          search: params.search,
          status: params.status as any,
          customerId: params.customerId
        });
        const data = (res?.data || []).map((inv: any) => ({
          ...inv,
          type: 'shipping' as const,
          outstandingAmount: inv.outstandingAmount ?? (parseFloat(inv.total || 0) - parseFloat(inv.paidAmount || 0))
        }));
        setInvoices(data);
        const total = res?.pagination?.total ?? res?.total ?? data.length;
        setPagination(prev => ({ ...prev, total }));
      } else {
        const [salesRes, shipRes] = await Promise.all([
          salesAPI.getInvoices(params),
          salesAPI.getShippingInvoices({
            page: params.page,
            limit: params.limit,
            search: params.search,
            status: params.status as any,
            customerId: params.customerId
          })
        ]);
        const salesData = (salesRes?.data || []).map((inv: any) => ({ ...inv, type: 'sales' as const }));
        const shipData = (shipRes?.data || []).map((inv: any) => ({
          ...inv,
          type: 'shipping' as const,
          outstandingAmount: inv.outstandingAmount ?? (parseFloat(inv.total || 0) - parseFloat(inv.paidAmount || 0))
        }));
        const combined = [...salesData, ...shipData].sort((a: any, b: any) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
        setInvoices(combined);
        const total = (salesRes?.total || salesData.length) + (shipRes?.pagination?.total ?? shipRes?.total ?? shipData.length);
        setPagination(prev => ({ ...prev, total }));
      }

    } catch (error) {
      console.error('Error loading invoices:', error);
      setMessage({ type: 'error', text: 'خطأ في تحميل الفواتير من الخادم' });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await salesAPI.getCustomers({ page: 1, limit: 100 });
      setCustomers(res?.data || res || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  // Helper functions
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

  const getTypeText = (type: string) => {
    switch (type) {
      case 'sales': return 'مبيعات';
      case 'shipping': return 'شحن';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return 'bg-purple-100 text-purple-800';
      case 'shipping': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'unpaid': return 'غير مدفوعة';
      case 'partial': return 'مدفوعة جزئياً';
      case 'paid': return 'مدفوعة بالكامل';
      case 'overpaid': return 'مدفوعة زائد';
      default: return paymentStatus;
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overpaid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'LYD') => {
    // Use safe formatter to prevent "ليس رقماً" errors
    const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
    return `${safeAmount.toLocaleString('ar-LY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Table columns
  const columns = [
    {
      key: 'invoiceNumber',
      title: 'رقم الفاتورة',
      render: (invoice: Invoice) => (
        <div className="font-medium text-blue-600">
          {invoice.invoiceNumber}
        </div>
      )
    },
    {
      key: 'type',
      title: 'النوع',
      render: (invoice: Invoice) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(invoice.type)}`}>
          {getTypeText(invoice.type)}
        </span>
      )
    },
    {
      key: 'customer',
      title: 'العميل',
      render: (invoice: Invoice) => (
        <div>
          <div className="font-medium">{invoice.customer?.name}</div>
          <div className="text-sm text-gray-500">{invoice.customer?.code}</div>
        </div>
      )
    },
    {
      key: 'date',
      title: 'التاريخ',
      render: (invoice: Invoice) => (
        <div className="text-sm text-right">
          <div className="font-medium">{formatDate(invoice.date)}</div>
          {invoice.dueDate && (
            <div className="text-xs text-gray-500 mt-1">
              الاستحقاق: {formatDate(invoice.dueDate)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'total',
      title: 'المبلغ الإجمالي',
      render: (invoice: Invoice) => (
        <div className="font-medium text-right">
          <div>{formatCurrency(invoice.total || 0, invoice.currency)}</div>
          {invoice.paidAmount > 0 && (
            <div className="text-xs text-green-600 mt-1">
              مدفوع: {formatCurrency(invoice.paidAmount, invoice.currency)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'outstandingAmount',
      title: 'المبلغ المستحق',
      render: (invoice: Invoice) => (
        <div className={`font-medium text-right ${(invoice.outstandingAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(invoice.outstandingAmount || 0, invoice.currency)}
        </div>
      )
    },
    {
      key: 'paymentStatus',
      title: 'حالة الدفع',
      render: (invoice: Invoice) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
          {getPaymentStatusText(invoice.paymentStatus)}
        </span>
      )
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (invoice: Invoice) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
          {getStatusText(invoice.status)}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (invoice: Invoice) => (
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={() => handleView(invoice)}
            className="text-blue-600 hover:text-blue-800"
            title="عرض"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEdit(invoice)}
            className="text-green-600 hover:text-green-800"
            title="تعديل"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleCreateReturn(invoice)}
            className="text-orange-600 hover:text-orange-800"
            title="إنشاء فاتورة مرتجع"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => handleStatusUpdate(invoice)}
            className="text-purple-600 hover:text-purple-800"
            title="تحديث الحالة"
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={() => handleDownload(invoice)}
            className="text-orange-600 hover:text-orange-800"
            title="تحميل PDF"
          >
            <Download size={16} />
          </button>
        </div>
      )
    }
  ];

  // Event handlers
  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceType(invoice.type);
    setModalMode('edit');
    setIsFormModalOpen(true);
  };

  const handleCreateReturn = (invoice: Invoice) => {
    // إنشاء فاتورة مرتجع
    const returnData = {
      customerId: invoice.customerId,
      originalInvoiceId: invoice.id,
      date: new Date().toISOString().split('T')[0],
      reason: 'مرتجع عادي',
      subtotal: invoice.subtotal || 0,
      taxAmount: invoice.taxAmount || 0,
      total: invoice.total || 0,
      notes: `مرتجع للفاتورة رقم ${invoice.invoiceNumber}`
    };

    if (window.confirm(`هل تريد إنشاء فاتورة مرتجع للفاتورة رقم ${invoice.invoiceNumber}؟`)) {
      createReturn(returnData);
    }
  };

  const createReturn = async (returnData: any) => {
    try {
      setSubmitting(true);
      const response = await salesAPI.createSalesReturn(returnData);

      setMessage({
        type: 'success',
        text: 'تم إنشاء فاتورة المرتجع بنجاح'
      });

      // إعادة تحميل الفواتير
      loadInvoices();

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error creating return:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'حدث خطأ في إنشاء فاتورة المرتجع'
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = (type: 'sales' | 'shipping') => {
    setSelectedInvoice(null);
    setInvoiceType(type);
    setModalMode('create');
    setIsFormModalOpen(true);
  };

  const handleStatusUpdate = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsStatusModalOpen(true);
  };

  const handleDownload = (invoice: Invoice) => {
    // TODO: Implement PDF download
    console.log('Download PDF for invoice:', invoice.id);
    setMessage({ type: 'success', text: 'سيتم تطوير تحميل PDF قريباً' });
  };



  const handleInvoiceSubmit = async (invoiceData: any) => {
    try {
      setSubmitting(true);

      if (invoiceData.type === 'sales') {
        const payload = {
          customerId: invoiceData.customerId,
          date: invoiceData.date,
          dueDate: invoiceData.dueDate,
          items: (invoiceData.items || []).map((it: any) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.lineTotal ?? (it.quantity * it.unitPrice)
          })),
          notes: invoiceData.notes || undefined
        };

        if (modalMode === 'edit' && selectedInvoice?.id) {
          await salesAPI.updateInvoice(selectedInvoice.id, payload);
        } else {
          await salesAPI.createInvoice(payload);
        }
      } else {
        const payload = {
          customerId: invoiceData.customerId,
          date: invoiceData.date,
          dueDate: invoiceData.dueDate,
          currency: invoiceData.currency,
          exchangeRate: invoiceData.exchangeRate,
          // Map notes from the modal to itemDescription for shipping invoice
          itemDescription: invoiceData.notes || ''
        };

        if (modalMode === 'edit' && selectedInvoice?.id) {
          await salesAPI.updateShippingInvoice(selectedInvoice.id, payload);
        } else {
          await salesAPI.createShippingInvoice(payload);
        }
      }

      setMessage({ type: 'success', text: modalMode === 'create' ? 'تم إنشاء الفاتورة بنجاح' : 'تم تحديث الفاتورة بنجاح' });
      setIsFormModalOpen(false);
      loadInvoices();
    } catch (error: any) {
      const text = error?.response?.data?.message || 'خطأ في حفظ الفاتورة';
      setMessage({ type: 'error', text });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdateSubmit = async (invoiceId: string, newStatus: string, paymentAmount?: number) => {
    try {
      setSubmitting(true);
      // TODO: Implement API call to update status
      console.log('Updating status:', { invoiceId, newStatus, paymentAmount });
      setMessage({ type: 'success', text: 'تم تحديث حالة الفاتورة بنجاح' });
      setIsStatusModalOpen(false);
      loadInvoices();
    } catch (error) {
      setMessage({ type: 'error', text: 'خطأ في تحديث حالة الفاتورة' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الفواتير</h1>
        <p className="text-gray-600">إدارة شاملة لجميع أنواع الفواتير - المبيعات والشحن</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => handleCreate('sales')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          disabled={submitting}
        >
          <Plus size={20} />
          فاتورة مبيعات جديدة
        </button>
        <button
          onClick={() => handleCreate('shipping')}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          disabled={submitting}
        >
          <Package size={20} />
          فاتورة شحن جديدة
        </button>
        <button
          onClick={loadInvoices}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          disabled={submitting}
        >
          <RefreshCw size={20} />
          تحديث
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 space-x-reverse">
            {[
              { key: 'all', label: 'جميع الفواتير', icon: FileText },
              { key: 'sales', label: 'فواتير المبيعات', icon: DollarSign },
              { key: 'shipping', label: 'فواتير الشحن', icon: Package }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          placeholder="البحث في الفواتير..."
        />
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={invoices}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page: number) => setPagination(prev => ({ ...prev, current: page }))
          }}
        />
      </div>

      {/* Modal for View */}
      {isModalOpen && selectedInvoice && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="عرض الفاتورة"
          size="xl"
        >
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">رقم الفاتورة:</span>
                <span className="font-medium mr-2">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">النوع:</span>
                <span className="font-medium mr-2">{getTypeText(selectedInvoice.type)}</span>
              </div>
              <div>
                <span className="text-gray-600">العميل:</span>
                <span className="font-medium mr-2">{selectedInvoice.customer?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">التاريخ:</span>
                <span className="font-medium mr-2">{new Date(selectedInvoice.date).toLocaleDateString('ar-SA')}</span>
              </div>
              <div>
                <span className="text-gray-600">المبلغ الإجمالي:</span>
                <span className="font-medium mr-2">{(selectedInvoice.total || 0).toLocaleString()} {selectedInvoice.currency || 'LYD'}</span>
              </div>
              <div>
                <span className="text-gray-600">المبلغ المستحق:</span>
                <span className="font-medium mr-2 text-red-600">{(selectedInvoice.outstandingAmount || 0).toLocaleString()} {selectedInvoice.currency || 'LYD'}</span>
              </div>
            </div>
            {selectedInvoice.notes && (
              <div className="mt-4">
                <span className="text-gray-600">ملاحظات:</span>
                <p className="mt-1 text-gray-900">{selectedInvoice.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Form Modal for Create/Edit */}
      {isFormModalOpen && (
        <InvoiceFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          invoice={selectedInvoice ? {
            ...selectedInvoice,
            discountPercent: 0,
            taxPercent: 0,
            items: []
          } : null}
          customers={customers}
          mode={modalMode as 'create' | 'edit'}
          invoiceType={invoiceType}
          onSubmit={handleInvoiceSubmit}
        />
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && selectedInvoice && (
        <InvoiceStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          invoice={selectedInvoice}
          onStatusUpdate={handleStatusUpdateSubmit}
        />
      )}
    </div>
  );
};

export default InvoiceManagementUnified;

import React, { useState, useEffect } from 'react';
import { Plus, FileText, Edit, Eye, Trash2, Send, DollarSign, Calendar, User, Package, Search, Filter, Download, Printer } from 'lucide-react';
import { salesAPI, settingsAPI } from '../services/api';
import { openPrintWindow } from '../utils/print';
import { invoiceTemplateAr } from '../utils/invoicePrintTemplate';
import { companyInfoAr } from '../config/companyInfo';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  notes?: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  totalAmount: number;
}

interface Customer {
  id: string;
  name: string;
  code: string;
}

const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    items: [
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0
      }
    ]
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, [pagination.current, searchValue, statusFilter, customerFilter, dateFromFilter, dateToFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        status: statusFilter || undefined,
        customerId: customerFilter || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined
      };
      
      const response = await salesAPI.getInvoices(params);
      const mapped = (response.data || []).map((inv: any) => {
        let items = inv.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch {}
        }
        const totalRaw = inv.total ?? inv.totalAmount ?? 0;
        const paidRaw = inv.paidAmount ?? 0;
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerId: inv.customerId,
          customerName: inv.customer?.name || inv.customerName || '',
          date: inv.date || (inv.createdAt ? String(inv.createdAt).split('T')[0] : ''),
          dueDate: inv.dueDate || inv.date || '',
          status: inv.status || 'draft',
          subtotal: Number(inv.subtotal ?? totalRaw ?? 0),
          taxAmount: Number(inv.taxAmount ?? 0),
          discountAmount: Number(inv.discountAmount ?? 0),
          totalAmount: Number(totalRaw || 0),
          paidAmount: Number(paidRaw || 0),
          remainingAmount: Number((totalRaw || 0) - (paidRaw || 0)),
          currency: inv.currency || 'LYD',
          notes: inv.notes,
          items: items || []
        } as any;
      });
      setInvoices(mapped);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await salesAPI.getCustomers({ limit: 1000 });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', invoice?: Invoice) => {
    setModalMode(mode);
    setSelectedInvoice(invoice || null);
    
    if (mode === 'create') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      setFormData({
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        notes: '',
        items: [
          {
            description: '',
            quantity: 1,
            unitPrice: 0,
            discountPercent: 0,
            taxPercent: 0
          }
        ]
      });
    } else if (invoice) {
      setFormData({
        customerId: invoice.customerId,
        date: invoice.date,
        dueDate: invoice.dueDate,
        notes: invoice.notes || '',
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          taxPercent: item.taxPercent
        }))
      });
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
    setFormData({
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: '',
      items: [
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          taxPercent: 0
        }
      ]
    });
    setFormErrors({});
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          taxPercent: 0
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateItemTotal = (item: any) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (item.taxPercent / 100);
    return taxableAmount + taxAmount;
  };

  const calculateInvoiceTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
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
    
    formData.items.forEach((item, index) => {
      if (!item.description) {
        errors[`item_${index}_description`] = 'يجب إدخال وصف العنصر';
      }
      if (item.quantity <= 0) {
        errors[`item_${index}_quantity`] = 'الكمية يجب أن تكون أكبر من صفر';
      }
      if (item.unitPrice <= 0) {
        errors[`item_${index}_unitPrice`] = 'السعر يجب أن يكون أكبر من صفر';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const invoiceData = {
        customerId: formData.customerId,
        date: formData.date,
        dueDate: formData.dueDate,
        notes: formData.notes,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: calculateItemTotal(item)
        }))
      };
      
      if (modalMode === 'create') {
        await salesAPI.createInvoice(invoiceData);
      } else if (modalMode === 'edit' && selectedInvoice) {
        await salesAPI.updateInvoice(selectedInvoice.id, invoiceData);
      }
      
      closeModal();
      loadInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      // TODO: Implement send invoice functionality
      console.log('Sending invoice:', invoice.id);
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    try {
      const logoUrl = settingsAPI.getLogoUrl();
      const invForPrint = {
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        customerName: invoice.customerName,
        notes: invoice.notes,
        currency: invoice.currency || 'LYD',
        items: (invoice.items || []).map(it => ({
          description: it.description,
          quantity: Number(it.quantity || 0),
          unitPrice: Number(it.unitPrice || 0),
          discountPercent: Number((it as any).discountPercent || 0),
          taxPercent: Number((it as any).taxPercent || 0),
          totalAmount: Number(it.totalAmount || 0)
        })),
        subtotal: Number(invoice.subtotal || 0),
        taxAmount: Number(invoice.taxAmount || 0),
        discountAmount: Number(invoice.discountAmount || 0),
        totalAmount: Number(invoice.totalAmount || 0),
        paidAmount: Number(invoice.paidAmount || 0)
      };
      const html = invoiceTemplateAr(invForPrint, companyInfoAr, logoUrl);
      openPrintWindow('فاتورة مبيعات', html);
    } catch (error) {
      console.error('Error printing invoice:', error);
    }
  };

  const columns = [
    {
      key: 'invoiceNumber',
      title: 'رقم الفاتورة',
      width: '120px'
    },
    {
      key: 'customerName',
      title: 'العميل',
      width: '200px'
    },
    {
      key: 'date',
      title: 'التاريخ',
      width: '100px',
      render: (value: string) => value ? new Date(value).toLocaleDateString('ar-EG') : '-'
    },
    {
      key: 'dueDate',
      title: 'تاريخ الاستحقاق',
      width: '120px',
      render: (value: string) => value ? new Date(value).toLocaleDateString('ar-EG') : '-'
    },
    {
      key: 'totalAmount',
      title: 'المبلغ الإجمالي',
      width: '120px',
      render: (value: number) => `${(value || 0).toLocaleString()} د.ل`
    },
    {
      key: 'remainingAmount',
      title: 'المبلغ المتبقي',
      width: '120px',
      render: (value: number) => `${(value || 0).toLocaleString()} د.ل`
    },
    {
      key: 'status',
      title: 'الحالة',
      width: '100px',
      render: (value: string) => {
        const statusMap = {
          draft: { text: 'مسودة', class: 'bg-gray-100 text-gray-800' },
          sent: { text: 'مرسلة', class: 'bg-blue-100 text-blue-800' },
          paid: { text: 'مدفوعة', class: 'bg-green-100 text-green-800' },
          overdue: { text: 'متأخرة', class: 'bg-red-100 text-red-800' },
          cancelled: { text: 'ملغية', class: 'bg-gray-100 text-gray-800' }
        };
        const status = statusMap[value as keyof typeof statusMap] || statusMap.draft;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
            {status.text}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      width: '150px',
      render: (_: any, record: Invoice) => (
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('view', record);
            }}
            className="text-blue-600 hover:text-blue-800"
            title="عرض"
          >
            <Eye className="h-4 w-4" />
          </button>
          {record.status === 'draft' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('edit', record);
              }}
              className="text-green-600 hover:text-green-800"
              title="تعديل"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintInvoice(record);
            }}
            className="text-purple-600 hover:text-purple-800"
            title="طباعة"
          >
            <Printer className="h-4 w-4" />
          </button>
          {record.status === 'draft' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSendInvoice(record);
              }}
              className="text-orange-600 hover:text-orange-800"
              title="إرسال"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'draft', label: 'مسودة' },
    { value: 'sent', label: 'مرسلة' },
    { value: 'paid', label: 'مدفوعة' },
    { value: 'overdue', label: 'متأخرة' },
    { value: 'cancelled', label: 'ملغية' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إدارة الفواتير</h1>
            <p className="text-sm sm:text-base text-gray-600">إنشاء وإدارة فواتير المبيعات</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="h-5 w-5 ml-2" />
          فاتورة جديدة
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SearchFilter
            value={searchValue}
            onChange={setSearchValue}
            placeholder="البحث في الفواتير..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="form-select"
          >
            <option value="">جميع العملاء</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFromFilter}
            onChange={(e) => setDateFromFilter(e.target.value)}
            className="form-input"
            placeholder="من تاريخ"
          />
          <input
            type="date"
            value={dateToFilter}
            onChange={(e) => setDateToFilter(e.target.value)}
            className="form-input"
            placeholder="إلى تاريخ"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        pagination={{
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
        }}
        emptyText="لا توجد فواتير"
      />

      {/* Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'إنشاء فاتورة جديدة' :
          modalMode === 'edit' ? 'تعديل الفاتورة' : 'عرض الفاتورة'
        }
        size="xl"
      >
        <div className="space-y-6">
          {/* Customer and Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              label="العميل"
              error={formErrors.customerId}
              required
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
                    {customer.name} - {customer.code}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="تاريخ الفاتورة"
              error={formErrors.date}
              required
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
              label="تاريخ الاستحقاق"
              error={formErrors.dueDate}
              required
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

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">عناصر الفاتورة</h3>
              {modalMode !== 'view' && (
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-secondary text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة عنصر
                </button>
              )}
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">العنصر {index + 1}</span>
                    {modalMode !== 'view' && formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2">
                      <FormField
                        label="الوصف"
                        error={formErrors[`item_${index}_description`]}
                        required
                      >
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="form-input"
                          disabled={modalMode === 'view'}
                          placeholder="وصف العنصر"
                        />
                      </FormField>
                    </div>

                    <FormField
                      label="الكمية"
                      error={formErrors[`item_${index}_quantity`]}
                      required
                    >
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="form-input"
                        disabled={modalMode === 'view'}
                        min="0"
                        step="0.01"
                      />
                    </FormField>

                    <FormField
                      label="السعر"
                      error={formErrors[`item_${index}_unitPrice`]}
                      required
                    >
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="form-input"
                        disabled={modalMode === 'view'}
                        min="0"
                        step="0.01"
                      />
                    </FormField>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الإجمالي
                      </label>
                      <div className="form-input bg-gray-50">
                        {calculateItemTotal(item).toLocaleString()} د.ل
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <FormField label="خصم (%)">
                      <input
                        type="number"
                        value={item.discountPercent}
                        onChange={(e) => updateItem(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                        className="form-input"
                        disabled={modalMode === 'view'}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </FormField>

                    <FormField label="ضريبة (%)">
                      <input
                        type="number"
                        value={item.taxPercent}
                        onChange={(e) => updateItem(index, 'taxPercent', parseFloat(e.target.value) || 0)}
                        className="form-input"
                        disabled={modalMode === 'view'}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoice Total */}
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">إجمالي الفاتورة:</span>
                <span className="text-xl font-bold text-green-600">
                  {calculateInvoiceTotal().toLocaleString()} د.ل
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <FormField label="ملاحظات">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="form-textarea"
              disabled={modalMode === 'view'}
              rows={3}
              placeholder="ملاحظات إضافية..."
            />
          </FormField>

          {/* Modal Actions */}
          {modalMode !== 'view' && (
            <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
              <button
                onClick={closeModal}
                className="btn-secondary"
                disabled={submitting}
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceManagement;

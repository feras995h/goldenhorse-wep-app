import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, User, Package, DollarSign } from 'lucide-react';
import FormField from './FormField';

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

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal: number;
}

interface Invoice {
  id?: string;
  invoiceNumber?: string;
  type: 'sales' | 'shipping';
  customerId: string;
  date: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxPercent: number;
  total: number;
  currency: string;
  exchangeRate: number;
  notes?: string;
  items: InvoiceItem[];
}

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  customers: Customer[];
  mode: 'create' | 'edit';
  invoiceType: 'sales' | 'shipping';
  onSubmit: (invoiceData: Invoice) => Promise<void>;
}

const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customers,
  mode,
  invoiceType,
  onSubmit
}) => {
  const [formData, setFormData] = useState<Invoice>({
    type: invoiceType,
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 0,
    taxPercent: 0,
    total: 0,
    currency: 'LYD',
    exchangeRate: 1.0,
    notes: '',
    items: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (invoice && mode === 'edit') {
      setFormData(invoice);
    } else {
      // Reset form for create mode
      setFormData({
        type: invoiceType,
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: 0,
        discountAmount: 0,
        discountPercent: 0,
        taxAmount: 0,
        taxPercent: 0,
        total: 0,
        currency: 'LYD',
        exchangeRate: 1.0,
        notes: '',
        items: invoiceType === 'sales' ? [createEmptyItem()] : []
      });
    }
  }, [invoice, mode, invoiceType, isOpen]);

  const createEmptyItem = (): InvoiceItem => ({
    description: '',
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    taxPercent: 0,
    lineTotal: 0
  });

  const calculateItemTotal = (item: InvoiceItem): number => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxPercent / 100);
    return afterDiscount + taxAmount;
  };

  const calculateInvoiceTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const totalDiscountAmount = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice * item.discountPercent / 100);
    }, 0);

    const afterDiscount = subtotal - totalDiscountAmount;
    const totalTaxAmount = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscountAmount = itemSubtotal * (item.discountPercent / 100);
      const itemAfterDiscount = itemSubtotal - itemDiscountAmount;
      return sum + (itemAfterDiscount * item.taxPercent / 100);
    }, 0);

    const total = afterDiscount + totalTaxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      discountAmount: totalDiscountAmount,
      taxAmount: totalTaxAmount,
      total
    }));
  };

  useEffect(() => {
    calculateInvoiceTotals();
  }, [formData.items]);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate line total
    newItems[index].lineTotal = calculateItemTotal(newItems[index]);

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, createEmptyItem()]
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'يجب اختيار العميل';
    }

    if (!formData.date) {
      newErrors.date = 'يجب تحديد تاريخ الفاتورة';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'يجب تحديد تاريخ الاستحقاق';
    }

    // Validate items only for sales invoices
    if (invoiceType === 'sales') {
      if (formData.items.length === 0) {
        newErrors.items = 'يجب إضافة عنصر واحد على الأقل';
      }

      formData.items.forEach((item, index) => {
        if (!item.description.trim()) {
          newErrors[`item_${index}_description`] = 'يجب إدخال وصف العنصر';
        }
        if (item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = 'يجب أن تكون الكمية أكبر من صفر';
        }
        if (item.unitPrice < 0) {
          newErrors[`item_${index}_unitPrice`] = 'يجب أن يكون السعر أكبر من أو يساوي صفر';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'إنشاء فاتورة جديدة' : 'تعديل الفاتورة'}
            {' - '}
            {invoiceType === 'sales' ? 'مبيعات' : 'شحن'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormField label="العميل" error={errors.customerId}>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">اختر العميل</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.code})
                  </option>
                ))}
              </select>
            </FormField>

            {selectedCustomer && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">معلومات العميل</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>الهاتف: {selectedCustomer.phone || 'غير محدد'}</div>
                  <div>البريد: {selectedCustomer.email || 'غير محدد'}</div>
                  <div>الرصيد: {(isNaN(selectedCustomer.balance) || !isFinite(selectedCustomer.balance) ? 0 : selectedCustomer.balance).toLocaleString('ar-LY')} {selectedCustomer.currency}</div>
                </div>
              </div>
            )}

            <FormField label="تاريخ الفاتورة" error={errors.date}>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </FormField>

            <FormField label="تاريخ الاستحقاق" error={errors.dueDate}>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </FormField>

            <FormField label="العملة">
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LYD">دينار ليبي (LYD)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EUR">يورو (EUR)</option>
                <option value="CNY">يوان صيني (CNY)</option>
              </select>
            </FormField>

            <FormField label="سعر الصرف">
              <input
                type="number"
                value={formData.exchangeRate}
                onChange={(e) => setFormData(prev => ({ ...prev, exchangeRate: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0.01"
                step="0.01"
              />
            </FormField>
          </div>

          {/* Items Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {invoiceType === 'sales' ? 'عناصر الفاتورة' : 'تفاصيل الشحن'}
              </h3>
              {invoiceType === 'sales' && (
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  إضافة عنصر
                </button>
              )}

            {invoiceType === 'shipping' && (
              <div className="space-y-4">
                <FormField label="وصف الشحنة">
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                    placeholder="أدخل وصف الشحنة أو أي تفاصيل إضافية"
                  />
                </FormField>
              </div>
            )}

            </div>

            {invoiceType === 'sales' && errors.items && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
                {errors.items}
              </div>
            )}

            {invoiceType === 'sales' && (
              <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      العنصر {index + 1}
                    </h4>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        label="الوصف"
                        error={errors[`item_${index}_description`]}
                      >
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="وصف العنصر"
                        />
                      </FormField>
                    </div>

                    <div>
                      <FormField
                        label="الكمية"
                        error={errors[`item_${index}_quantity`]}
                      >
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                        />
                      </FormField>
                    </div>

                    <div>
                      <FormField
                        label="السعر"
                        error={errors[`item_${index}_unitPrice`]}
                      >
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </FormField>
                    </div>

                    <div>
                      <FormField label="خصم %">
                        <input
                          type="number"
                          value={item.discountPercent}
                          onChange={(e) => handleItemChange(index, 'discountPercent', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </FormField>
                    </div>

                    <div>
                      <FormField label="المجموع">
                        <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-medium">
                          {(isNaN(item.lineTotal) || !isFinite(item.lineTotal) ? 0 : item.lineTotal).toLocaleString('ar-LY')}
                        </div>
                      </FormField>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ملخص الفاتورة</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">المجموع الفرعي:</span>
                <div className="font-medium">{(isNaN(formData.subtotal) || !isFinite(formData.subtotal) ? 0 : formData.subtotal).toLocaleString('ar-LY')} {formData.currency}</div>
              </div>
              <div>
                <span className="text-gray-600">إجمالي الخصم:</span>
                <div className="font-medium text-red-600">-{(isNaN(formData.discountAmount) || !isFinite(formData.discountAmount) ? 0 : formData.discountAmount).toLocaleString('ar-LY')} {formData.currency}</div>
              </div>
              <div>
                <span className="text-gray-600">إجمالي الضريبة:</span>
                <div className="font-medium">{(isNaN(formData.taxAmount) || !isFinite(formData.taxAmount) ? 0 : formData.taxAmount).toLocaleString('ar-LY')} {formData.currency}</div>
              </div>
              <div>
                <span className="text-gray-600">المجموع النهائي:</span>
                <div className="font-bold text-lg text-blue-600">{(isNaN(formData.total) || !isFinite(formData.total) ? 0 : formData.total).toLocaleString('ar-LY')} {formData.currency}</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <FormField label="ملاحظات (اختياري)">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="أضف أي ملاحظات إضافية..."
              />
            </FormField>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : mode === 'create' ? 'إنشاء الفاتورة' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceFormModal;

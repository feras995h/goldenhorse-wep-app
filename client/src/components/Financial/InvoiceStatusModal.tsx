import React, { useState } from 'react';
import { X, CheckCircle, Clock, XCircle, AlertTriangle, FileText, DollarSign } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'sales' | 'shipping';
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  currency: string;
}

interface InvoiceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onStatusUpdate: (invoiceId: string, newStatus: string, paymentAmount?: number) => Promise<void>;
}

const InvoiceStatusModal: React.FC<InvoiceStatusModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState(invoice.status);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const statusOptions = [
    {
      value: 'draft',
      label: 'مسودة',
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      description: 'الفاتورة في مرحلة الإعداد'
    },
    {
      value: 'sent',
      label: 'مرسلة',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'تم إرسال الفاتورة للعميل'
    },
    {
      value: 'partially_paid',
      label: 'مدفوعة جزئياً',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'تم دفع جزء من المبلغ'
    },
    {
      value: 'paid',
      label: 'مدفوعة بالكامل',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'تم دفع المبلغ كاملاً'
    },
    {
      value: 'overdue',
      label: 'متأخرة',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'تجاوزت الفاتورة تاريخ الاستحقاق'
    },
    {
      value: 'cancelled',
      label: 'ملغية',
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      description: 'تم إلغاء الفاتورة'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onStatusUpdate(invoice.id, selectedStatus, paymentAmount);
      onClose();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNewOutstanding = () => {
    if (selectedStatus === 'paid') {
      return 0;
    } else if (selectedStatus === 'partially_paid') {
      return Math.max(0, invoice.total - invoice.paidAmount - paymentAmount);
    }
    return invoice.outstandingAmount;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            تحديث حالة الفاتورة
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Invoice Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">معلومات الفاتورة</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">رقم الفاتورة:</span>
                <span className="font-medium mr-2">{invoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">النوع:</span>
                <span className="font-medium mr-2">
                  {invoice.type === 'sales' ? 'مبيعات' : 'شحن'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">المبلغ الإجمالي:</span>
                <span className="font-medium mr-2">
                  {(isNaN(invoice.total) || !isFinite(invoice.total) ? 0 : invoice.total).toLocaleString('ar-LY')} {invoice.currency}
                </span>
              </div>
              <div>
                <span className="text-gray-600">المبلغ المدفوع:</span>
                <span className="font-medium mr-2">
                  {(isNaN(invoice.paidAmount) || !isFinite(invoice.paidAmount) ? 0 : invoice.paidAmount).toLocaleString('ar-LY')} {invoice.currency}
                </span>
              </div>
              <div>
                <span className="text-gray-600">المبلغ المستحق:</span>
                <span className="font-medium mr-2 text-red-600">
                  {(isNaN(invoice.outstandingAmount) || !isFinite(invoice.outstandingAmount) ? 0 : invoice.outstandingAmount).toLocaleString('ar-LY')} {invoice.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              الحالة الجديدة
            </label>
            <div className="grid grid-cols-1 gap-3">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStatus === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={selectedStatus === option.value}
                      onChange={(e) => setSelectedStatus(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${option.bgColor} mr-3`}>
                      <Icon size={16} className={option.color} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Payment Amount (for partial payment) */}
          {selectedStatus === 'partially_paid' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مبلغ الدفعة الجديدة
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  max={invoice.outstandingAmount}
                  step="0.01"
                />
                <span className="absolute left-3 top-2 text-gray-500">
                  {invoice.currency}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                المبلغ المستحق بعد الدفعة: {calculateNewOutstanding().toLocaleString()} {invoice.currency}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="أضف أي ملاحظات حول تحديث الحالة..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'جاري التحديث...' : 'تحديث الحالة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceStatusModal;

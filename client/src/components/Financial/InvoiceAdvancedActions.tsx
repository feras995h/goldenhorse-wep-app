import React, { useState } from 'react';
import {
  Copy,
  Download,
  Mail,
  Printer,
  Share2,
  FileText,
  Send,
  Archive,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  CreditCard,
  Receipt
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'sales' | 'shipping';
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  total: number;
  outstandingAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  date: string;
}

interface InvoiceAdvancedActionsProps {
  invoice: Invoice;
  onAction: (action: string, data?: any) => void;
  showDropdown?: boolean;
  onDropdownToggle?: () => void;
}

const InvoiceAdvancedActions: React.FC<InvoiceAdvancedActionsProps> = ({
  invoice,
  onAction,
  showDropdown = false,
  onDropdownToggle
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [emailData, setEmailData] = useState({
    to: invoice.customer?.email || '',
    subject: `فاتورة رقم ${invoice.invoiceNumber}`,
    message: `السلام عليكم،\n\nنرسل لكم فاتورة رقم ${invoice.invoiceNumber} بمبلغ ${(isNaN(invoice.total) || !isFinite(invoice.total) ? 0 : invoice.total).toLocaleString('ar-LY')} ${invoice.currency}.\n\nشكراً لكم.`
  });
  const [paymentData, setPaymentData] = useState({
    amount: invoice.outstandingAmount,
    method: 'cash',
    notes: ''
  });

  const quickActions = [
    {
      key: 'view',
      label: 'عرض',
      icon: <FileText size={16} />,
      color: 'text-blue-600 hover:text-blue-800',
      show: true
    },
    {
      key: 'download',
      label: 'تحميل PDF',
      icon: <Download size={16} />,
      color: 'text-green-600 hover:text-green-800',
      show: true
    },
    {
      key: 'print',
      label: 'طباعة',
      icon: <Printer size={16} />,
      color: 'text-purple-600 hover:text-purple-800',
      show: true
    },
    {
      key: 'email',
      label: 'إرسال بالبريد',
      icon: <Mail size={16} />,
      color: 'text-orange-600 hover:text-orange-800',
      show: !!invoice.customer?.email
    }
  ];

  const dropdownActions = [
    {
      key: 'duplicate',
      label: 'نسخ الفاتورة',
      icon: <Copy size={16} />,
      show: true,
      description: 'إنشاء فاتورة جديدة بنفس البيانات'
    },
    {
      key: 'payment',
      label: 'تسجيل دفعة',
      icon: <CreditCard size={16} />,
      show: invoice.outstandingAmount > 0,
      description: 'تسجيل دفعة جديدة للفاتورة'
    },
    {
      key: 'receipt',
      label: 'إنشاء إيصال',
      icon: <Receipt size={16} />,
      show: invoice.status === 'paid',
      description: 'إنشاء إيصال استلام للفاتورة'
    },
    {
      key: 'send',
      label: 'إرسال للعميل',
      icon: <Send size={16} />,
      show: invoice.status === 'draft',
      description: 'تغيير حالة الفاتورة إلى مرسلة'
    },
    {
      key: 'archive',
      label: 'أرشفة',
      icon: <Archive size={16} />,
      show: invoice.status === 'paid',
      description: 'نقل الفاتورة إلى الأرشيف'
    },
    {
      key: 'cancel',
      label: 'إلغاء الفاتورة',
      icon: <Trash2 size={16} />,
      show: invoice.status !== 'paid' && invoice.status !== 'cancelled',
      description: 'إلغاء الفاتورة نهائياً',
      danger: true
    }
  ];

  const handleEmailSend = () => {
    onAction('email', emailData);
    setShowEmailModal(false);
  };

  const handlePaymentRecord = () => {
    onAction('payment', paymentData);
    setShowPaymentModal(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={14} className="text-gray-500" />;
      case 'sent': return <Send size={14} className="text-blue-500" />;
      case 'paid': return <CheckCircle size={14} className="text-green-500" />;
      case 'partially_paid': return <Clock size={14} className="text-yellow-500" />;
      case 'overdue': return <AlertTriangle size={14} className="text-red-500" />;
      case 'cancelled': return <Trash2 size={14} className="text-gray-500" />;
      default: return <FileText size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {quickActions.filter(action => action.show).map(action => (
          <button
            key={action.key}
            onClick={() => {
              if (action.key === 'email') {
                setShowEmailModal(true);
              } else {
                onAction(action.key);
              }
            }}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${action.color}`}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={onDropdownToggle}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800"
            title="المزيد من الإجراءات"
          >
            <MoreHorizontal size={16} />
          </button>

          {showDropdown && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border z-50">
              <div className="p-2">
                {dropdownActions.filter(action => action.show).map(action => (
                  <button
                    key={action.key}
                    onClick={() => {
                      if (action.key === 'payment') {
                        setShowPaymentModal(true);
                      } else {
                        onAction(action.key);
                      }
                      onDropdownToggle?.();
                    }}
                    className={`w-full text-right px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-3 ${
                      action.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                    }`}
                  >
                    {action.icon}
                    <div className="flex-1">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">إرسال الفاتورة بالبريد الإلكتروني</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">إلى</label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="البريد الإلكتروني للعميل"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرسالة</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse p-4 border-t">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleEmailSend}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Mail size={16} />
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">تسجيل دفعة جديدة</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              {/* Invoice Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">فاتورة رقم:</span>
                  <span className="font-medium">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">المبلغ المستحق:</span>
                  <span className="font-medium text-red-600">
                    {(isNaN(invoice.outstandingAmount) || !isFinite(invoice.outstandingAmount) ? 0 : invoice.outstandingAmount).toLocaleString('ar-LY')} {invoice.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الحالة:</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(invoice.status)}
                    <span className="text-sm">{invoice.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ الدفعة</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    max={invoice.outstandingAmount}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                  <select
                    value={paymentData.method}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cash">نقداً</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="check">شيك</option>
                    <option value="credit_card">بطاقة ائتمان</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse p-4 border-t">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                onClick={handlePaymentRecord}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <DollarSign size={16} />
                تسجيل الدفعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceAdvancedActions;

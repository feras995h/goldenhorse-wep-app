import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Receipt, Search } from 'lucide-react';
import { financialAPI } from '../../services/api';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  displayName: string;
}

interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  total: number;
  outstandingAmount: number;
  customer: {
    id: string;
    name: string;
  };
}

interface InvoiceAllocation {
  invoiceId: string;
  amount: number;
  notes?: string;
}

interface ReceiptVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId?: string;
  partyType?: string;
  partyId?: string;
}

const ReceiptVoucher: React.FC<ReceiptVoucherProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountId: initialAccountId,
  partyType: initialPartyType,
  partyId: initialPartyId
}) => {
  const [formData, setFormData] = useState({
    accountId: initialAccountId || '',
    partyType: initialPartyType || 'customer',
    partyId: initialPartyId || '',
    amount: '',
    receiptDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    referenceNo: '',
    bankAccount: '',
    checkNumber: '',
    remarks: '',
    currency: 'LYD',
    exchangeRate: 1.0
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountSearch, setAccountSearch] = useState('');
  const [outstandingInvoices, setOutstandingInvoices] = useState<OutstandingInvoice[]>([]);
  const [invoiceAllocations, setInvoiceAllocations] = useState<InvoiceAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load accounts for auto-complete
  useEffect(() => {
    if (accountSearch.length >= 2) {
      loadAccounts();
    }
  }, [accountSearch]);

  // Load outstanding invoices when account changes
  useEffect(() => {
    if (formData.accountId) {
      loadOutstandingInvoices();
    }
  }, [formData.accountId]);

  const loadAccounts = async () => {
    try {
      const data = await financialAPI.getAccountsAutocomplete({ search: accountSearch, limit: 10 });
      setAccounts((data && (data.data || data)) || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadOutstandingInvoices = async () => {
    try {
      const data = await financialAPI.getOutstandingInvoices({ accountId: formData.accountId, limit: 20 });
      setOutstandingInvoices((data && (data.data || data)) || []);
    } catch (error) {
      console.error('Error loading outstanding invoices:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAccountSelect = (account: Account) => {
    setFormData(prev => ({ ...prev, accountId: account.id }));
    setAccountSearch(account.displayName);
    setAccounts([]);
  };

  const addInvoiceAllocation = (invoice: OutstandingInvoice) => {
    const existingAllocation = invoiceAllocations.find(a => a.invoiceId === invoice.id);
    if (existingAllocation) return;

    setInvoiceAllocations(prev => [...prev, {
      invoiceId: invoice.id,
      amount: invoice.outstandingAmount,
      notes: `تسوية فاتورة ${invoice.invoiceNumber}`
    }]);
  };

  const updateAllocationAmount = (invoiceId: string, amount: number) => {
    setInvoiceAllocations(prev => 
      prev.map(allocation => 
        allocation.invoiceId === invoiceId 
          ? { ...allocation, amount }
          : allocation
      )
    );
  };

  const removeAllocation = (invoiceId: string) => {
    setInvoiceAllocations(prev => prev.filter(a => a.invoiceId !== invoiceId));
  };

  const getTotalAllocated = () => {
    return invoiceAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountId) newErrors.accountId = 'الحساب مطلوب';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    if (!formData.receiptDate) newErrors.receiptDate = 'التاريخ مطلوب';

    const totalAllocated = getTotalAllocated();
    const receiptAmount = parseFloat(formData.amount || '0');
    
    if (totalAllocated > receiptAmount) {
      newErrors.allocations = 'إجمالي المبالغ المخصصة أكبر من مبلغ الإيصال';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        exchangeRate: parseFloat(formData.exchangeRate.toString()),
        invoiceAllocations: invoiceAllocations.length > 0 ? invoiceAllocations : undefined
      };

      await financialAPI.createReceiptVoucher(submitData);
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating receipt voucher:', error);
      setErrors({ submit: error.response?.data?.message || 'حدث خطأ أثناء إنشاء الإيصال' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      partyType: 'customer',
      partyId: '',
      amount: '',
      receiptDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      referenceNo: '',
      bankAccount: '',
      checkNumber: '',
      remarks: '',
      currency: 'LYD',
      exchangeRate: 1.0
    });
    setAccountSearch('');
    setInvoiceAllocations([]);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-green-600 ml-3" />
            <h2 className="text-xl font-bold text-gray-900">إيصال قبض جديد</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Account Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحساب <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="ابحث عن الحساب..."
                  className={`w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                    errors.accountId ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              {accounts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => handleAccountSelect(account)}
                      className="w-full px-3 py-2 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{account.displayName}</div>
                      <div className="text-sm text-gray-500">الرصيد: {(isNaN(account.balance) || !isFinite(account.balance) ? 0 : account.balance).toLocaleString('ar-LY')} LYD</div>
                    </button>
                  ))}
                </div>
              )}
              
              {errors.accountId && <p className="text-red-500 text-sm mt-1">{errors.accountId}</p>}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المبلغ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.receiptDate}
                onChange={(e) => handleInputChange('receiptDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                  errors.receiptDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.receiptDate && <p className="text-red-500 text-sm mt-1">{errors.receiptDate}</p>}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة الدفع
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="cash">نقدي</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
                <option value="credit_card">بطاقة ائتمان</option>
                <option value="other">أخرى</option>
              </select>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم المرجع
              </label>
              <input
                type="text"
                value={formData.referenceNo}
                onChange={(e) => handleInputChange('referenceNo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="رقم المرجع أو الإشارة"
              />
            </div>

            {formData.paymentMethod === 'check' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الشيك
                </label>
                <input
                  type="text"
                  value={formData.checkNumber}
                  onChange={(e) => handleInputChange('checkNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="رقم الشيك"
                />
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {errors.allocations && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.allocations}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الإيصال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptVoucher;

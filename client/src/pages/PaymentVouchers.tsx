import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  RefreshCw,
  DollarSign,
  Search,
  Filter,
  Download,
  X
} from 'lucide-react';

import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import { financialAPI, salesAPI } from '../services/api';

// Types
interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
}

interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  supplierId?: string;
  supplier?: Supplier;
  beneficiaryName: string;
  purpose: 'invoice_payment' | 'operating_expense' | 'salary' | 'rent' | 'other';
  purposeDescription?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'other';
  currency: string;
  amount: number;
  debitAccountId: string;
  creditAccountId: string;
  debitAccount?: Account;
  creditAccount?: Account;
  exchangeRate: number;
  notes?: string;
  attachments: any[];
  status: 'draft' | 'posted' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const PaymentVouchers: React.FC = () => {
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<PaymentVoucher | null>(null);

  // Fetch data
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const resp = await financialAPI.getPaymentVouchers({
        page: 1,
        limit: 100,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      const list = resp?.data || resp?.items || resp || [];
      setVouchers(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Error fetching payment vouchers:', err);
      setError(err?.message || 'خطأ في جلب إيصالات الصرف');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await salesAPI.getCustomers({ limit: 100, type: 'company' as any });
      const data = (res as any)?.data || res || [];
      const mapped: Supplier[] = (Array.isArray(data) ? data : []).map((c: any) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email }));
      setSuppliers(mapped);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setSuppliers([]);
    }
  };

  const fetchAccounts = async () => {
    try {
      const resp = await financialAPI.getAccounts({ limit: 100 });
      const list = (resp as any)?.data || resp || [];
      setAccounts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setAccounts([]);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchSuppliers();
    fetchAccounts();
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const handleCreateVoucher = async (voucherData: Partial<PaymentVoucher>) => {
    try {
      await financialAPI.createPaymentVoucher(voucherData);
      await fetchVouchers();
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Error creating payment voucher:', err);
      setError(err?.message || 'خطأ في إنشاء إيصال الصرف');
    }
  };

  const handleEditVoucher = async (voucherData: Partial<PaymentVoucher>) => {
    if (!editingVoucher) return;
    try {
      await financialAPI.updatePaymentVoucher(editingVoucher.id, voucherData);
      await fetchVouchers();
      setEditingVoucher(null);
    } catch (err: any) {
      console.error('Error updating payment voucher:', err);
      setError(err?.message || 'خطأ في تحديث إيصال الصرف');
    }
  };

  const columns = [
    {
      key: 'voucherNumber',
      title: 'رقم الإيصال',
      render: (_: any, voucher: PaymentVoucher) => (
        <span className="font-medium text-blue-600">{voucher.voucherNumber}</span>
      )
    },
    {
      key: 'date',
      title: 'التاريخ',
      render: (_: any, voucher: PaymentVoucher) => (
        <span>{new Date(voucher.date).toLocaleDateString('ar-LY')}</span>
      )
    },
    {
      key: 'beneficiaryName',
      title: 'المستفيد',
      render: (_: any, voucher: PaymentVoucher) => (
        <div>
          <div className="font-medium">{voucher.beneficiaryName}</div>
          {voucher.supplier && (
            <div className="text-sm text-gray-500">{voucher.supplier.name}</div>
          )}
        </div>
      )
    },
    {
      key: 'amount',
      title: 'المبلغ',
      render: (_: any, voucher: PaymentVoucher) => (
        <div className="text-right">
          <div className="font-medium">
            {voucher.amount.toLocaleString('ar-LY')} {voucher.currency}
          </div>
          {voucher.exchangeRate !== 1 && (
            <div className="text-sm text-gray-500">
              سعر الصرف: {voucher.exchangeRate}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'paymentMethod',
      title: 'طريقة الدفع',
      render: (_: any, voucher: PaymentVoucher) => {
        const methods = {
          cash: 'كاش',
          bank_transfer: 'حوالة بنكية',
          check: 'شيك',
          other: 'أخرى'
        };
        return <span>{methods[voucher.paymentMethod]}</span>;
      }
    },
    {
      key: 'purpose',
      title: 'الغرض',
      render: (_: any, voucher: PaymentVoucher) => {
        const purposes = {
          invoice_payment: 'دفع فاتورة',
          operating_expense: 'مصاريف تشغيلية',
          salary: 'رواتب',
          rent: 'إيجار',
          other: 'أخرى'
        };
        return (
          <div>
            <div>{purposes[voucher.purpose]}</div>
            {voucher.purposeDescription && (
              <div className="text-sm text-gray-500">{voucher.purposeDescription}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (_: any, voucher: PaymentVoucher) => {
        const statusColors = {
          draft: 'bg-gray-100 text-gray-800',
          posted: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800'
        };
        const statusLabels = {
          draft: 'مسودة',
          posted: 'مرحل',
          cancelled: 'ملغي'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[voucher.status]}`}>
            {statusLabels[voucher.status]}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (_: any, voucher: PaymentVoucher) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setEditingVoucher(voucher)}
            className="text-blue-600 hover:text-blue-800"
            title="تعديل"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => {/* View details */}}
            className="text-green-600 hover:text-green-800"
            title="عرض التفاصيل"
          >
            <Eye size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="text-red-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">إيصالات الصرف</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>إيصال صرف جديد</span>
          </button>
        </div>

        <SearchFilter
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onClearFilters={() => { setStatusFilter(''); }}
          filters={[
            {
              key: 'status',
              label: 'الحالة',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: '', label: 'جميع الحالات' },
                { value: 'draft', label: 'مسودة' },
                { value: 'posted', label: 'مرحل' },
                { value: 'cancelled', label: 'ملغي' }
              ]
            }
          ]}
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <DataTable
        data={vouchers}
        columns={columns}
        loading={loading}
        emptyText="لا توجد إيصالات صرف"
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <PaymentVoucherForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateVoucher}
          suppliers={suppliers}
          accounts={accounts}
          mode="create"
        />
      )}

      {editingVoucher && (
        <PaymentVoucherForm
          isOpen={!!editingVoucher}
          onClose={() => setEditingVoucher(null)}
          onSubmit={handleEditVoucher}
          suppliers={suppliers}
          accounts={accounts}
          mode="edit"
          voucher={editingVoucher}
        />
      )}
    </div>
  );
};

// Payment Voucher Form Component
interface PaymentVoucherFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PaymentVoucher>) => void;
  suppliers: Supplier[];
  accounts: Account[];
  mode: 'create' | 'edit';
  voucher?: PaymentVoucher | null;
}

const PaymentVoucherForm: React.FC<PaymentVoucherFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  accounts,
  mode,
  voucher
}) => {
  const [formData, setFormData] = useState<{ 
    supplierId: string;
    beneficiaryName: string;
    purpose: PaymentVoucher['purpose'];
    purposeDescription: string;
    paymentMethod: PaymentVoucher['paymentMethod'];
    currency: string;
    amount: number;
    debitAccountId: string;
    creditAccountId: string;
    exchangeRate: number;
    notes: string;
  }>({
    supplierId: '',
    beneficiaryName: '',
    purpose: 'invoice_payment',
    purposeDescription: '',
    paymentMethod: 'cash',
    currency: 'LYD',
    amount: 0,
    debitAccountId: '',
    creditAccountId: '',
    exchangeRate: 1.0,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (voucher && mode === 'edit') {
      setFormData({
        supplierId: voucher.supplierId || '',
        beneficiaryName: voucher.beneficiaryName,
        purpose: voucher.purpose,
        purposeDescription: voucher.purposeDescription || '',
        paymentMethod: voucher.paymentMethod,
        currency: voucher.currency,
        amount: voucher.amount,
        debitAccountId: voucher.debitAccountId,
        creditAccountId: voucher.creditAccountId,
        exchangeRate: voucher.exchangeRate,
        notes: voucher.notes || ''
      });
    }
  }, [voucher, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'إيصال صرف جديد' : 'تعديل إيصال الصرف'}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'إيصال صرف جديد' : 'تعديل إيصال الصرف'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المورد
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => {
                  const supplierId = e.target.value;
                  const supplier = suppliers.find(s => s.id === supplierId);
                  setFormData(prev => ({
                    ...prev,
                    supplierId,
                    beneficiaryName: supplier?.name || ''
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">اختر المورد</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المستفيد
              </label>
              <input
                type="text"
                value={formData.beneficiaryName}
                onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل اسم المستفيد"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                طريقة الدفع
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">كاش</option>
                <option value="bank_transfer">حوالة بنكية</option>
                <option value="check">شيك</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العملة
              </label>
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المبلغ
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                سعر الصرف
              </label>
              <input
                type="number"
                value={formData.exchangeRate}
                onChange={(e) => setFormData(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 1.0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.0001"
                min="0.0001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الغرض
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="invoice_payment">دفع فاتورة</option>
                <option value="operating_expense">مصاريف تشغيلية</option>
                <option value="salary">رواتب</option>
                <option value="rent">إيجار</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                وصف الغرض
              </label>
              <input
                type="text"
                value={formData.purposeDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, purposeDescription: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="وصف إضافي للغرض"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحساب المدين
              </label>
              <select
                value={formData.debitAccountId}
                onChange={(e) => setFormData(prev => ({ ...prev, debitAccountId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">اختر الحساب المدين</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحساب الدائن
              </label>
              <select
                value={formData.creditAccountId}
                onChange={(e) => setFormData(prev => ({ ...prev, creditAccountId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">اختر الحساب الدائن</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="ملاحظات إضافية"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : (mode === 'create' ? 'إنشاء' : 'تحديث')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PaymentVouchers;

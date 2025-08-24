import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw, Eye, Edit } from 'lucide-react';
import { financialAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';
import { TreasuryTransaction, Account, Customer } from '../types/financial';

const TreasuryManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedTransaction, setSelectedTransaction] = useState<TreasuryTransaction | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'receipt',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: 'LYD',
    accountId: '',
    customerId: '',
    description: '',
    reference: '',
    paymentMethod: 'cash',
    checkNumber: '',
    checkDate: '',
    bankName: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadAccounts();
    loadCustomers();
  }, [pagination.current, searchValue, typeFilter, statusFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined
      };
      
      const response = await financialAPI.getTreasuryTransactions(params);
      setTransactions(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      console.error('Error loading treasury transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await financialAPI.getAccounts();
      setAccounts(response.data.filter((acc: Account) => 
        acc.type === 'asset' && (acc.name.includes('نقدية') || acc.name.includes('بنك'))
      ));
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await financialAPI.getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setSearchValue('');
    setTypeFilter('');
    setStatusFilter('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const openModal = (mode: 'create' | 'edit' | 'view', transaction?: TreasuryTransaction) => {
    setModalMode(mode);
    setSelectedTransaction(transaction || null);
    
    if (mode === 'create') {
      setFormData({
        type: 'receipt',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        currency: 'LYD',
        accountId: '',
        customerId: '',
        description: '',
        reference: '',
        paymentMethod: 'cash',
        checkNumber: '',
        checkDate: '',
        bankName: '',
        notes: ''
      });
    } else if (transaction) {
      setFormData({
        type: transaction.type,
        date: transaction.date,
        amount: transaction.amount,
        currency: transaction.currency,
        accountId: transaction.accountId,
        customerId: transaction.customerId || '',
        description: transaction.description,
        reference: transaction.reference || '',
        paymentMethod: transaction.paymentMethod,
        checkNumber: transaction.checkNumber || '',
        checkDate: transaction.checkDate || '',
        bankName: transaction.bankName || '',
        notes: transaction.notes || ''
      });
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.date) {
      errors.date = 'التاريخ مطلوب';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    }
    
    if (!formData.accountId) {
      errors.accountId = 'الحساب مطلوب';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'الوصف مطلوب';
    }
    
    if (formData.paymentMethod === 'check') {
      if (!formData.checkNumber.trim()) {
        errors.checkNumber = 'رقم الشيك مطلوب';
      }
      if (!formData.checkDate) {
        errors.checkDate = 'تاريخ الشيك مطلوب';
      }
      if (!formData.bankName.trim()) {
        errors.bankName = 'اسم البنك مطلوب';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      if (modalMode === 'create') {
        await financialAPI.createTreasuryTransaction(formData);
      } else if (modalMode === 'edit' && selectedTransaction) {
        await financialAPI.updateTreasuryTransaction(selectedTransaction.id, formData);
      }
      
      closeModal();
      loadTransactions();
    } catch (error) {
      console.error('Error saving treasury transaction:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'transactionNumber',
      title: 'رقم العملية',
      width: '120px'
    },
    {
      key: 'date',
      title: 'التاريخ',
      width: '120px',
      render: (value: string) => new Date(value).toLocaleDateString('ar-LY')
    },
    {
      key: 'type',
      title: 'النوع',
      width: '100px',
      render: (value: string) => (
        <div className="flex items-center">
          {value === 'receipt' ? (
            <>
              <ArrowDownRight className="h-4 w-4 text-green-600 ml-1" />
              <span className="text-green-600">مقبوضات</span>
            </>
          ) : value === 'payment' ? (
            <>
              <ArrowUpRight className="h-4 w-4 text-red-600 ml-1" />
              <span className="text-red-600">مدفوعات</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 text-blue-600 ml-1" />
              <span className="text-blue-600">تحويل</span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'description',
      title: 'الوصف',
      render: (value: string, record: TreasuryTransaction) => (
        <div>
          <div className="font-medium">{value}</div>
          {record.reference && (
            <div className="text-sm text-gray-500">مرجع: {record.reference}</div>
          )}
        </div>
      )
    },
    {
      key: 'amount',
      title: 'المبلغ',
      width: '120px',
      align: 'left' as const,
      render: (value: number, record: TreasuryTransaction) => (
        <div className="text-left">
          <span className={record.type === 'receipt' ? 'text-green-600' : 'text-red-600'}>
            {record.type === 'receipt' ? '+' : '-'}{new Intl.NumberFormat('ar-LY').format(value)}
          </span>
          <span className="text-gray-500 text-sm mr-1">{record.currency}</span>
        </div>
      )
    },
    {
      key: 'paymentMethod',
      title: 'طريقة الدفع',
      width: '100px',
      render: (value: string) => {
        const methods = {
          cash: 'نقدي',
          check: 'شيك',
          transfer: 'تحويل',
          card: 'بطاقة'
        };
        return methods[value as keyof typeof methods] || value;
      }
    },
    {
      key: 'status',
      title: 'الحالة',
      width: '100px',
      render: (value: string) => {
        const statusLabels = {
          pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-800' },
          completed: { label: 'مكتمل', color: 'bg-green-100 text-green-800' },
          cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800' }
        };
        const status = statusLabels[value as keyof typeof statusLabels];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      width: '120px',
      render: (_: any, record: TreasuryTransaction) => (
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
          {record.status === 'pending' && (
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
        </div>
      )
    }
  ];

  const transactionTypeOptions = [
    { value: 'receipt', label: 'مقبوضات' },
    { value: 'payment', label: 'مدفوعات' },
    { value: 'transfer', label: 'تحويل' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'معلق' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'نقدي' },
    { value: 'check', label: 'شيك' },
    { value: 'transfer', label: 'تحويل بنكي' },
    { value: 'card', label: 'بطاقة ائتمان' }
  ];

  const currencyOptions = [
    { value: 'LYD', label: 'دينار ليبي' },
    { value: 'USD', label: 'دولار أمريكي' },
    { value: 'EUR', label: 'يورو' }
  ];

  const accountOptions = accounts.map(acc => ({
    value: acc.id,
    label: `${acc.code} - ${acc.name}`
  }));

  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: `${customer.code} - ${customer.name}`
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CreditCard className="h-8 w-8 text-yellow-600 ml-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الخزينة</h1>
            <p className="text-gray-600">المقبوضات والمدفوعات والتحويلات</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 ml-2" />
          عملية جديدة
        </button>
      </div>

      {/* Search and Filters */}
      <SearchFilter
        searchValue={searchValue}
        onSearchChange={handleSearch}
        filters={[
          {
            key: 'type',
            label: 'نوع العملية',
            value: typeFilter,
            options: transactionTypeOptions,
            onChange: handleTypeFilter
          },
          {
            key: 'status',
            label: 'الحالة',
            value: statusFilter,
            options: statusOptions,
            onChange: handleStatusFilter
          }
        ]}
        onClearFilters={clearFilters}
        placeholder="البحث في العمليات..."
      />

      {/* Transactions Table */}
      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        pagination={{
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
        }}
        emptyText="لا توجد عمليات"
      />

      {/* Treasury Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'إضافة عملية جديدة' :
          modalMode === 'edit' ? 'تعديل العملية' : 'عرض العملية'
        }
        size="lg"
        footer={
          modalMode !== 'view' ? (
            <>
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
                {submitting ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </>
          ) : (
            <button onClick={closeModal} className="btn-secondary">
              إغلاق
            </button>
          )
        }
      >
        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="نوع العملية"
              name="type"
              type="select"
              value={formData.type}
              onChange={(value) => setFormData(prev => ({ ...prev, type: value as string }))}
              options={transactionTypeOptions}
              required
              disabled={modalMode === 'view'}
            />

            <FormField
              label="التاريخ"
              name="date"
              type="date"
              value={formData.date}
              onChange={(value) => setFormData(prev => ({ ...prev, date: value as string }))}
              required
              error={formErrors.date}
              disabled={modalMode === 'view'}
            />

            <FormField
              label="العملة"
              name="currency"
              type="select"
              value={formData.currency}
              onChange={(value) => setFormData(prev => ({ ...prev, currency: value as string }))}
              options={currencyOptions}
              disabled={modalMode === 'view'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="المبلغ"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={(value) => setFormData(prev => ({ ...prev, amount: value as number }))}
              min={0}
              step={0.01}
              required
              error={formErrors.amount}
              disabled={modalMode === 'view'}
            />

            <FormField
              label="طريقة الدفع"
              name="paymentMethod"
              type="select"
              value={formData.paymentMethod}
              onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as string }))}
              options={paymentMethodOptions}
              disabled={modalMode === 'view'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="الحساب"
              name="accountId"
              type="select"
              value={formData.accountId}
              onChange={(value) => setFormData(prev => ({ ...prev, accountId: value as string }))}
              options={accountOptions}
              placeholder="اختر الحساب"
              required
              error={formErrors.accountId}
              disabled={modalMode === 'view'}
            />

            <FormField
              label="العميل (اختياري)"
              name="customerId"
              type="select"
              value={formData.customerId}
              onChange={(value) => setFormData(prev => ({ ...prev, customerId: value as string }))}
              options={customerOptions}
              placeholder="اختر العميل"
              disabled={modalMode === 'view'}
            />
          </div>

          <FormField
            label="الوصف"
            name="description"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value as string }))}
            required
            error={formErrors.description}
            disabled={modalMode === 'view'}
          />

          <FormField
            label="المرجع"
            name="reference"
            value={formData.reference}
            onChange={(value) => setFormData(prev => ({ ...prev, reference: value as string }))}
            disabled={modalMode === 'view'}
          />

          {/* Check Details (only show if payment method is check) */}
          {formData.paymentMethod === 'check' && (
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">تفاصيل الشيك</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="رقم الشيك"
                  name="checkNumber"
                  value={formData.checkNumber}
                  onChange={(value) => setFormData(prev => ({ ...prev, checkNumber: value as string }))}
                  required
                  error={formErrors.checkNumber}
                  disabled={modalMode === 'view'}
                />

                <FormField
                  label="تاريخ الشيك"
                  name="checkDate"
                  type="date"
                  value={formData.checkDate}
                  onChange={(value) => setFormData(prev => ({ ...prev, checkDate: value as string }))}
                  required
                  error={formErrors.checkDate}
                  disabled={modalMode === 'view'}
                />

                <FormField
                  label="اسم البنك"
                  name="bankName"
                  value={formData.bankName}
                  onChange={(value) => setFormData(prev => ({ ...prev, bankName: value as string }))}
                  required
                  error={formErrors.bankName}
                  disabled={modalMode === 'view'}
                />
              </div>
            </div>
          )}

          <FormField
            label="ملاحظات"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={(value) => setFormData(prev => ({ ...prev, notes: value as string }))}
            rows={3}
            disabled={modalMode === 'view'}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TreasuryManagement;

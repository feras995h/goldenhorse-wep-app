import React, { useState, useEffect } from 'react';
import { Plus, Calculator, Edit, Trash2, Eye } from 'lucide-react';
import { financialAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';
import AccountTree from '../components/Financial/AccountTree';
import { Account } from '../types/financial';

const AccountsManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    type: '',
    parentId: '',
    currency: 'LYD'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [pagination.current, searchValue, typeFilter]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        type: typeFilter || undefined
      };
      
      const response = await financialAPI.getAccounts(params);
      setAccounts(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
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

  const clearFilters = () => {
    setSearchValue('');
    setTypeFilter('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const openModal = (mode: 'create' | 'edit' | 'view', account?: Account) => {
    setModalMode(mode);
    setSelectedAccount(account || null);
    
    if (mode === 'create') {
      setFormData({
        code: '',
        name: '',
        nameEn: '',
        type: '',
        parentId: '',
        currency: 'LYD'
      });
    } else if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        nameEn: account.nameEn || '',
        type: account.type,
        parentId: account.parentId || '',
        currency: account.currency
      });
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
    setFormData({
      code: '',
      name: '',
      nameEn: '',
      type: '',
      parentId: '',
      currency: 'LYD'
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      errors.code = 'رمز الحساب مطلوب';
    }
    
    if (!formData.name.trim()) {
      errors.name = 'اسم الحساب مطلوب';
    }
    
    if (!formData.type) {
      errors.type = 'نوع الحساب مطلوب';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      if (modalMode === 'create') {
        await financialAPI.createAccount(formData);
      } else if (modalMode === 'edit' && selectedAccount) {
        await financialAPI.updateAccount(selectedAccount.id, formData);
      }
      
      closeModal();
      loadAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (account: Account) => {
    if (!confirm(`هل أنت متأكد من حذف الحساب "${account.name}"؟`)) return;
    
    try {
      await financialAPI.deleteAccount(account.id);
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('حدث خطأ أثناء حذف الحساب');
    }
  };

  const columns = [
    {
      key: 'code',
      title: 'رمز الحساب',
      width: '120px'
    },
    {
      key: 'name',
      title: 'اسم الحساب',
      render: (value: string, record: Account) => (
        <div>
          <div className="font-medium">{value}</div>
          {record.nameEn && (
            <div className="text-sm text-gray-500">{record.nameEn}</div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      title: 'النوع',
      width: '120px',
      render: (value: string) => {
        const typeLabels = {
          asset: 'أصول',
          liability: 'خصوم',
          equity: 'حقوق ملكية',
          revenue: 'إيرادات',
          expense: 'مصروفات'
        };
        return typeLabels[value as keyof typeof typeLabels] || value;
      }
    },
    {
      key: 'balance',
      title: 'الرصيد',
      width: '120px',
      align: 'left' as const,
      render: (value: number, record: Account) => (
        <div className="text-left">
          <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
            {new Intl.NumberFormat('ar-LY').format(value)}
          </span>
          <span className="text-gray-500 text-sm mr-1">{record.currency}</span>
        </div>
      )
    },
    {
      key: 'isActive',
      title: 'الحالة',
      width: '80px',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'نشط' : 'غير نشط'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      width: '120px',
      render: (_: any, record: Account) => (
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}
            className="text-red-600 hover:text-red-800"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const accountTypeOptions = [
    { value: 'asset', label: 'أصول' },
    { value: 'liability', label: 'خصوم' },
    { value: 'equity', label: 'حقوق ملكية' },
    { value: 'revenue', label: 'إيرادات' },
    { value: 'expense', label: 'مصروفات' }
  ];

  const currencyOptions = [
    { value: 'LYD', label: 'دينار ليبي' },
    { value: 'USD', label: 'دولار أمريكي' },
    { value: 'EUR', label: 'يورو' },
    { value: 'CNY', label: 'يوان صيني' }
  ];

  // Get parent accounts for the dropdown (only accounts of the same type)
  const parentAccountOptions = accounts
    .filter(acc => acc.type === formData.type && acc.id !== selectedAccount?.id)
    .map(acc => ({ value: acc.id, label: `${acc.code} - ${acc.name}` }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Calculator className="h-8 w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الحسابات</h1>
            <p className="text-gray-600">دليل الحسابات والأرصدة</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 ml-2" />
          حساب جديد
        </button>
      </div>

      {/* Account Tree Visualization */}
      <AccountTree accounts={accounts} onAccountSelect={(account) => openModal('edit', account)} />

      {/* Search and Filters */}
      <SearchFilter
        searchValue={searchValue}
        onSearchChange={handleSearch}
        filters={[
          {
            key: 'type',
            label: 'نوع الحساب',
            value: typeFilter,
            options: accountTypeOptions,
            onChange: handleTypeFilter
          }
        ]}
        onClearFilters={clearFilters}
        placeholder="البحث في الحسابات..."
      />

      {/* Accounts Table */}
      <DataTable
        columns={columns}
        data={accounts}
        loading={loading}
        pagination={{
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
        }}
        emptyText="لا توجد حسابات"
      />

      {/* Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'إضافة حساب جديد' :
          modalMode === 'edit' ? 'تعديل الحساب' : 'عرض الحساب'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="رمز الحساب"
            name="code"
            value={formData.code}
            onChange={(value) => setFormData(prev => ({ ...prev, code: value as string }))}
            required
            error={formErrors.code}
            disabled={modalMode === 'view'}
          />
          
          <FormField
            label="نوع الحساب"
            name="type"
            type="select"
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value as string }))}
            options={accountTypeOptions}
            required
            error={formErrors.type}
            disabled={modalMode === 'view'}
          />
          
          <FormField
            label="اسم الحساب (عربي)"
            name="name"
            value={formData.name}
            onChange={(value) => setFormData(prev => ({ ...prev, name: value as string }))}
            required
            error={formErrors.name}
            disabled={modalMode === 'view'}
            className="md:col-span-2"
          />
          
          <FormField
            label="اسم الحساب (إنجليزي)"
            name="nameEn"
            value={formData.nameEn}
            onChange={(value) => setFormData(prev => ({ ...prev, nameEn: value as string }))}
            disabled={modalMode === 'view'}
            className="md:col-span-2"
          />
          
          <FormField
            label="الحساب الأب"
            name="parentId"
            type="select"
            value={formData.parentId}
            onChange={(value) => setFormData(prev => ({ ...prev, parentId: value as string }))}
            options={parentAccountOptions}
            placeholder="اختر الحساب الأب (اختياري)"
            disabled={modalMode === 'view'}
          />
          
          <FormField
            label="العملة"
            name="currency"
            type="select"
            value={formData.currency}
            onChange={(value) => setFormData(prev => ({ ...prev, currency: value as string }))}
            options={currencyOptions}
            required
            disabled={modalMode === 'view'}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AccountsManagement;

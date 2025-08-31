import React, { useState, useEffect } from 'react';
import { Tree, Search, Filter, Download, Eye, Edit, Plus } from 'lucide-react';
import { financialAPI } from '../services/api';
import AccountTree from '../components/Financial/AccountTree';
import { SearchFilter } from '../components/UI/SearchFilter';
import { Modal } from '../components/UI/Modal';
import { FormField } from '../components/UI/FormField';
import { Account } from '../types/financial';

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    type: '',
    parentId: '',
    currency: 'LYD'
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchValue, typeFilter]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getAccounts({ limit: 1000 });
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(account =>
        account.code.toLowerCase().includes(searchValue.toLowerCase()) ||
        account.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        (account.nameEn && account.nameEn.toLowerCase().includes(searchValue.toLowerCase()))
      );
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(account => account.type === typeFilter);
    }

    setFilteredAccounts(filtered);
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      nameEn: account.nameEn || '',
      type: account.type,
      parentId: account.parentId || '',
      currency: account.currency
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setFormData({
      code: '',
      name: '',
      nameEn: '',
      type: '',
      parentId: '',
      currency: 'LYD'
    });
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleSaveAccount = async () => {
    try {
      if (modalMode === 'create') {
        await financialAPI.createAccount(formData);
      } else if (modalMode === 'edit' && selectedAccount) {
        await financialAPI.updateAccount(selectedAccount.id, formData);
      }
      
      setIsModalOpen(false);
      loadAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const exportAccounts = () => {
    const csvContent = [
      ['رقم الحساب', 'اسم الحساب', 'الاسم بالإنجليزية', 'النوع', 'الرصيد', 'العملة'],
      ...filteredAccounts.map(account => [
        account.code,
        account.name,
        account.nameEn || '',
        account.type,
        account.balance?.toString() || '0',
        account.currency
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'chart_of_accounts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterOptions = [
    {
      key: 'type',
      label: 'نوع الحساب',
      value: typeFilter,
      options: [
        { value: '', label: 'جميع الأنواع' },
        { value: 'asset', label: 'أصول' },
        { value: 'liability', label: 'خصوم' },
        { value: 'equity', label: 'حقوق ملكية' },
        { value: 'revenue', label: 'إيرادات' },
        { value: 'expense', label: 'مصروفات' }
      ],
      onChange: setTypeFilter
    }
  ];

  const getAccountTypeLabel = (type: string) => {
    const types = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">دليل الحسابات</h1>
              <p className="text-gray-600 mt-1">عرض وإدارة شجرة الحسابات المحاسبية</p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={exportAccounts}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </button>
              <button
                onClick={handleCreateAccount}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة حساب جديد
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <SearchFilter
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={filterOptions}
            onClearFilters={() => {
              setSearchValue('');
              setTypeFilter('');
            }}
            placeholder="البحث في الحسابات..."
          />
        </div>

        {/* Account Tree */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل الحسابات...</p>
            </div>
          ) : (
            <AccountTree
              accounts={filteredAccounts}
              onAccountSelect={handleAccountSelect}
            />
          )}
        </div>

        {/* Account Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={
            modalMode === 'view' ? 'تفاصيل الحساب' :
            modalMode === 'edit' ? 'تعديل الحساب' :
            'إضافة حساب جديد'
          }
          size="lg"
        >
          {modalMode === 'view' && selectedAccount ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">رقم الحساب</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">اسم الحساب</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">الاسم بالإنجليزية</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.nameEn || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">نوع الحساب</label>
                  <p className="mt-1 text-sm text-gray-900">{getAccountTypeLabel(selectedAccount.type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">الرصيد</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAccount.balance?.toLocaleString()} {selectedAccount.currency}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">العملة</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.currency}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 space-x-reverse">
                <button
                  onClick={() => handleEditAccount(selectedAccount)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="رقم الحساب"
                  value={formData.code}
                  onChange={(value) => setFormData(prev => ({ ...prev, code: value }))}
                  required
                />
                <FormField
                  label="اسم الحساب"
                  value={formData.name}
                  onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                  required
                />
                <FormField
                  label="الاسم بالإنجليزية"
                  value={formData.nameEn}
                  onChange={(value) => setFormData(prev => ({ ...prev, nameEn: value }))}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">نوع الحساب</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-golden-500 focus:border-golden-500 sm:text-sm"
                    required
                  >
                    <option value="">اختر نوع الحساب</option>
                    <option value="asset">أصول</option>
                    <option value="liability">خصوم</option>
                    <option value="equity">حقوق ملكية</option>
                    <option value="revenue">إيرادات</option>
                    <option value="expense">مصروفات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">العملة</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as any }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-golden-500 focus:border-golden-500 sm:text-sm"
                  >
                    <option value="LYD">دينار ليبي</option>
                    <option value="USD">دولار أمريكي</option>
                    <option value="EUR">يورو</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 space-x-reverse">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveAccount}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700"
                >
                  حفظ
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ChartOfAccounts;

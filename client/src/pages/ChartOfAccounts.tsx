import React, { useState, useEffect } from 'react';
import { Trees, Search, Filter, Download, Eye, Edit, Plus, ChevronDown, Shield, Trash2, Settings } from 'lucide-react';
import { financialAPI } from '../services/api';
import AccountTree from '../components/Financial/AccountTree';
import { SearchFilter } from '../components/UI/SearchFilter';
import { Modal } from '../components/UI/Modal';
import { FormField } from '../components/UI/FormField';
import { Account, DEFAULT_ACCOUNTS, Currency } from '../types/financial';

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');

  // Parent account selection state
  const [selectedParentAccount, setSelectedParentAccount] = useState<Account | null>(null);

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    type: '',
    accountType: 'main' as 'main' | 'sub',
    level: 1,
    parentId: '',
    isActive: true,
    currency: 'LYD' as Currency,
    nature: 'debit' as 'debit' | 'credit',
    description: '',
    notes: '',
    isGroup: true
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
      const existingAccounts = response.data || [];
      
      // Check if default accounts exist, if not create them
      if (existingAccounts.length === 0) {
        await createDefaultAccounts();
        const newResponse = await financialAPI.getAccounts({ limit: 1000 });
        setAccounts(newResponse.data || []);
      } else {
        setAccounts(existingAccounts);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultAccounts = async () => {
    try {
      console.log('Creating default accounts...');
      let successCount = 0;

      for (const defaultAccount of DEFAULT_ACCOUNTS) {
        try {
          console.log(`Creating account: ${defaultAccount.code} - ${defaultAccount.name}`);

          // Prepare account data for API
          const accountData = {
            code: defaultAccount.code,
            name: defaultAccount.name,
            nameEn: defaultAccount.nameEn || '',
            type: defaultAccount.type,
            accountType: defaultAccount.accountType,
            level: defaultAccount.level,
            isActive: defaultAccount.isActive,
            currency: defaultAccount.currency,
            nature: defaultAccount.nature,
            description: defaultAccount.description || '',
            notes: defaultAccount.notes || '',
            isSystemAccount: defaultAccount.isSystemAccount || false,
            isGroup: defaultAccount.accountType === 'main',
            parentId: null
          };

          await financialAPI.createAccount(accountData);
          successCount++;
          console.log(`✅ Created: ${defaultAccount.code} - ${defaultAccount.name}`);
        } catch (error) {
          console.error(`❌ Failed to create account ${defaultAccount.code}:`, error);
          // Continue with other accounts even if one fails
        }
      }

      console.log(`📊 Created ${successCount}/${DEFAULT_ACCOUNTS.length} default accounts successfully`);
    } catch (error) {
      console.error('Error creating default accounts:', error);
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

  const handleParentAccountSelect = (account: Account) => {
    setSelectedParentAccount(account);
    setFormData(prev => ({ ...prev, parentId: account.id }));
    
    // Auto-generate account code based on parent
    generateAccountCode(account);
  };

  // Function to generate account code automatically
  const generateAccountCode = (parentAccount: Account) => {
    // Get all child accounts of the selected parent
    const childAccounts = accounts.filter(acc => acc.parentId === parentAccount.id);
    
    if (childAccounts.length === 0) {
      // If no children, create first child code
      const newCode = `${parentAccount.code}.1`;
      setFormData(prev => ({
        ...prev,
        code: newCode,
        accountType: 'sub',
        type: parentAccount.type, // Inherit type from parent
        level: parentAccount.level + 1,
        parentId: parentAccount.id,
        nature: getDefaultNature(parentAccount.type)
      }));
    } else {
      // Find the highest existing child code
      const existingCodes = childAccounts.map(acc => {
        const parts = acc.code.split('.');
        return parts.length > 1 ? parseInt(parts[parts.length - 1]) : 0;
      });
      
      const maxCode = Math.max(...existingCodes);
      const nextCode = maxCode + 1;
      const newCode = `${parentAccount.code}.${nextCode}`;
      setFormData(prev => ({
        ...prev,
        code: newCode,
        accountType: 'sub',
        type: parentAccount.type, // Inherit type from parent
        level: parentAccount.level + 1,
        parentId: parentAccount.id,
        nature: getDefaultNature(parentAccount.type)
      }));
    }
  };

  // Function to get default nature based on account type
  const getDefaultNature = (type: string): 'debit' | 'credit' => {
    switch (type) {
      case 'asset':
      case 'expense':
        return 'debit';
      case 'liability':
      case 'equity':
      case 'revenue':
        return 'credit';
      default:
        return 'debit';
    }
  };

  // Function to create main account without parent
  const handleCreateMainAccount = () => {
    const mainAccounts = accounts.filter(acc => !acc.parentId);
    let newCode = '1';

    if (mainAccounts.length > 0) {
      const existingCodes = mainAccounts.map(acc => {
        const codeNum = parseInt(acc.code) || 0;
        return codeNum;
      });
      const maxCode = Math.max(...existingCodes);
      newCode = (maxCode + 1).toString();
    }
    
    setFormData(prev => ({ 
      ...prev, 
      code: newCode,
      accountType: 'main',
      level: 1,
      parentId: '',
      nature: 'debit'
    }));
    setSelectedParentAccount(null);
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    // Prevent editing system accounts
    if (account.isSystemAccount) {
      alert('لا يمكن تعديل الحسابات الأساسية للنظام');
      return;
    }

    setSelectedAccount(account);
    
    // Set parent account if exists
    const parentAccount = account.parentId ? (accounts.find(acc => acc.id === account.parentId) || null) : null;
    setSelectedParentAccount(parentAccount);
    
    setFormData({
      code: account.code,
      name: account.name,
      nameEn: account.nameEn || '',
      type: account.type,
      accountType: account.accountType || 'main',
      level: account.level,
      parentId: account.parentId || '',
      isActive: account.isActive,
      currency: account.currency,
      nature: account.nature || 'debit',
      description: account.description || '',
      notes: account.notes || '',
      isGroup: (account as any).isGroup ?? (account.accountType === 'main')
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setSelectedParentAccount(null);
    
    // Generate initial code for main account
    const mainAccounts = accounts.filter(acc => !acc.parentId);
    let initialCode = '1';

    if (mainAccounts.length > 0) {
      const existingCodes = mainAccounts.map(acc => {
        const codeNum = parseInt(acc.code) || 0;
        return codeNum;
      });
      const maxCode = Math.max(...existingCodes);
      initialCode = (maxCode + 1).toString();
    }
    
    setFormData({
      code: initialCode,
      name: '',
      nameEn: '',
      type: '',
      accountType: 'main',
      level: 1,
      parentId: '',
      isActive: true,
      currency: 'LYD',
      nature: 'debit',
      description: '',
      notes: '',
      isGroup: true
    });
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleSaveAccount = async () => {
    // Validate required fields
    if (!formData.code || !formData.name || !formData.type) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Check if account code already exists
    const existingAccount = accounts.find(acc => acc.code === formData.code);
    if (existingAccount && (!selectedAccount || existingAccount.id !== selectedAccount.id)) {
      alert('رقم الحساب موجود مسبقاً، يرجى اختيار رقم آخر');
      return;
    }

    // Note: Parent account conversion to group is now handled automatically by the server
    // No need for user confirmation - the server will convert the parent account automatically

    // For main accounts (no parent), parentId should be empty
    // For sub accounts, parentId should be set
    if (formData.parentId && !selectedParentAccount) {
      alert('يرجى اختيار الحساب الأب أو إنشاء حساب رئيسي');
      return;
    }

    try {
      // Prepare data for API
      const accountData = {
        ...formData,
        // Ensure parentId is properly set for sub accounts
        parentId: selectedParentAccount ? selectedParentAccount.id : (formData.parentId || null),
        // Inherit type from parent for sub accounts if not set
        type: selectedParentAccount && !formData.type ? selectedParentAccount.type : formData.type,
        // Set proper level for sub accounts
        level: selectedParentAccount ? selectedParentAccount.level + 1 : (formData.level || 1),
        // For sub accounts, isGroup can be true or false based on user choice
        // For main accounts, default to true to allow sub accounts
        isGroup: formData.accountType === 'main' ? true : (formData.isGroup !== undefined ? formData.isGroup : false),
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        currency: formData.currency || 'LYD',
        nature: formData.nature || 'debit',
        // Add required accountType field
        accountType: formData.accountType || (selectedParentAccount ? 'sub' : 'main')
      };

      console.log('Saving account data:', accountData);
      console.log('Selected parent account:', selectedParentAccount);
      console.log('Form data parentId:', formData.parentId);

      if (modalMode === 'create') {
        const response = await financialAPI.createAccount(accountData);
        console.log('Account created:', response);
      } else if (modalMode === 'edit' && selectedAccount) {
        const response = await financialAPI.updateAccount(selectedAccount.id, accountData);
        console.log('Account updated:', response);
      }

      setIsModalOpen(false);

      // Clear form data and selected parent
      setSelectedParentAccount(null);
      setFormData({
        code: '',
        name: '',
        nameEn: '',
        type: '',
        accountType: 'main',
        level: 1,
        parentId: '',
        isActive: true,
        currency: 'LYD',
        nature: 'debit',
        description: '',
        notes: '',
        isGroup: true
      });

      // Wait for accounts to reload to ensure consistency
      await loadAccounts();
    } catch (error: any) {
      console.error('Error saving account:', error);

      // More detailed error handling
      if (error.response) {
        const errorMessage = error.response.data?.message || 'خطأ في الخادم';
        alert(`حدث خطأ أثناء حفظ الحساب: ${errorMessage}`);
      } else if (error.request) {
        alert('لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم.');
      } else {
        alert(`حدث خطأ أثناء حفظ الحساب: ${error.message}`);
      }
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    // Prevent deleting system accounts
    if (account.isSystemAccount) {
      alert('لا يمكن حذف الحسابات الأساسية للنظام');
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف الحساب "${account.name}"؟`)) {
      try {
        await financialAPI.deleteAccount(account.id);
        await loadAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('حدث خطأ أثناء حذف الحساب');
      }
    }
  };

  const exportAccounts = () => {
    const csvContent = [
      ['رقم الحساب', 'اسم الحساب', 'الاسم بالإنجليزية', 'التصنيف', 'نوع الحساب', 'المستوى', 'الحساب الأب', 'طبيعة الحساب', 'الحالة', 'الرصيد', 'العملة', 'الوصف', 'الملاحظات'],
      ...filteredAccounts.map(account => {
        const parentAccount = account.parentId ? accounts.find(acc => acc.id === account.parentId) : null;
        return [
          account.code,
          account.name,
          account.nameEn || '',
          getAccountTypeLabel(account.type),
          account.accountType === 'main' ? 'رئيسي' : 'فرعي',
          account.level.toString(),
          parentAccount ? `${parentAccount.code} - ${parentAccount.name}` : 'حساب رئيسي',
          account.nature === 'debit' ? 'مدين' : 'دائن',
          account.isActive ? 'نشط' : 'غير نشط',
          account.balance?.toString() || '0',
          account.currency,
          account.description || '',
          account.notes || ''
        ];
      })
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
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">دليل الحسابات</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">عرض وإدارة شجرة الحسابات المحاسبية</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse w-full sm:w-auto">
              <button
                onClick={exportAccounts}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </button>
              <button
                onClick={handleCreateAccount}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة حساب جديد
              </button>
              <a
                href="/financial/accounts-management"
                className="inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Settings className="h-4 w-4 ml-2" />
                إدارة متقدمة
              </a>
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
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">المعلومات الأساسية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">رقم الحساب</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedAccount.code}</p>
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
                    <label className="block text-sm font-medium text-gray-700">التصنيف</label>
                    <p className="mt-1 text-sm text-gray-900">{getAccountTypeLabel(selectedAccount.type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">نوع الحساب</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedAccount.accountType === 'main' ? 'حساب رئيسي' : 'حساب فرعي'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">المستوى</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAccount.level}</p>
                  </div>
                </div>
              </div>

              {/* Account Properties */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">خصائص الحساب</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">الحساب الأب</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedAccount.parentId ? 
                        (() => {
                          const parent = accounts.find(acc => acc.id === selectedAccount.parentId);
                          return parent ? `${parent.code} - ${parent.name}` : '-';
                        })() : 
                        'حساب رئيسي'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">طبيعة الحساب</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedAccount.nature === 'debit' ? 'مدين' : 'دائن'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">حالة الحساب</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedAccount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedAccount.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                      {selectedAccount.isSystemAccount && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          <Shield className="h-3 w-3 ml-1" />
                          حساب نظام أساسي
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">العملة</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAccount.currency}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">الرصيد الحالي</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">
                      {selectedAccount.balance?.toLocaleString()} {selectedAccount.currency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {(selectedAccount.description || selectedAccount.notes) && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">الوصف والملاحظات</h3>
                  <div className="space-y-3">
                    {selectedAccount.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">وصف الحساب</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedAccount.description}</p>
                      </div>
                    )}
                    {selectedAccount.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ملاحظات إضافية</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedAccount.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
                {!selectedAccount.isSystemAccount && (
                  <>
                    <button
                      onClick={() => handleEditAccount(selectedAccount)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(selectedAccount)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الحساب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                    placeholder="مثال: 1001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم الحساب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                    placeholder="مثال: النقد في البنك"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التصنيف <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        type: newType,
                        nature: getDefaultNature(newType)
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                    required
                  >
                    <option value="">اختر التصنيف</option>
                    <option value="asset">أصول</option>
                    <option value="liability">خصوم</option>
                    <option value="equity">حقوق ملكية</option>
                    <option value="revenue">إيرادات</option>
                    <option value="expense">مصروفات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عملة الحساب
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as Currency }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                  >
                    <option value="LYD">دينار ليبي (LYD)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                  </select>
                </div>
              </div>

              {/* Parent Account Selection */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحساب الأب (اختياري)
                </label>
                <div className="space-y-3">
                  <select
                    value={selectedParentAccount?.id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId) {
                        const parentAccount = accounts.find(acc => acc.id === selectedId);
                        if (parentAccount) {
                          handleParentAccountSelect(parentAccount);
                        }
                      } else {
                        setSelectedParentAccount(null);
                        setFormData(prev => ({ ...prev, parentId: '', code: '' }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                  >
                    <option value="">-- اختر الحساب الأب --</option>
                    {accounts
                      .filter(account => account.id !== selectedAccount?.id) // منع اختيار الحساب نفسه كأب
                      .map(account => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name} ({getAccountTypeLabel(account.type)})
                        </option>
                      ))
                    }
                  </select>
                  
                  {selectedParentAccount && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            الحساب الأب: {selectedParentAccount.code} - {selectedParentAccount.name}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            الرقم المقترح: {formData.code}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedParentAccount(null);
                            setFormData(prev => ({ ...prev, parentId: '', code: '' }));
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          إزالة
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!selectedParentAccount && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-800">
                        <strong>حساب رئيسي:</strong> سيتم إنشاء رقم الحساب تلقائياً
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        الرقم المقترح: {formData.code}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وصف الحساب (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                  placeholder="شرح مختصر عن استخدام الحساب..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveAccount}
                  disabled={!formData.code || !formData.name || !formData.type}
                  className="inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalMode === 'create' ? 'إنشاء الحساب' : 'حفظ التغييرات'}
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

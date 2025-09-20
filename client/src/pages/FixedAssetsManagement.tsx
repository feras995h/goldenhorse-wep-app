import React, { useState, useEffect } from 'react';
import { Plus, Building, Edit, Eye, Calculator } from 'lucide-react';
import { financialAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';
import { FixedAsset } from '../types/financial';
import { formatCurrencyAmount } from '../utils/formatters';
import CurrencyDisplay from '../components/UI/CurrencyDisplay';

const FixedAssetsManagement: React.FC = () => {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);

  // Form state
  // Default form data to prevent undefined values
  const getDefaultFormData = () => ({
    assetNumber: '',
    name: '',
    nameEn: '',
    categoryAccountId: '',
    branch: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0,
    currency: 'LYD',
    depreciationMethod: 'straight_line',
    usefulLife: 5,
    salvageValue: 0,
    location: '',
    serialNumber: '',
    supplier: '',
    warrantyExpiry: '',
    notes: '',
    description: ''
  });

  const [formData, setFormData] = useState(getDefaultFormData());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssets();
    loadCategories();
  }, [pagination.current, searchValue, categoryFilter, statusFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined
      };
      
      const response = await financialAPI.getFixedAssets(params);
      setAssets(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      console.error('Error loading fixed assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const resp = await financialAPI.getFixedAssetCategories();
      const cats = (resp && (resp.data || resp)) || [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Error loading fixed asset categories:', error);
      setCategories([]);
    }
  };


  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setSearchValue('');
    setCategoryFilter('');
    setStatusFilter('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const openModal = (mode: 'create' | 'edit' | 'view', asset?: FixedAsset) => {
    setModalMode(mode);
    setSelectedAsset(asset || null);
    
    if (mode === 'create') {
      const initialData = getDefaultFormData();
      setFormData(initialData);

      // If there's only one category, auto-select it and generate asset number
      if (categories.length === 1) {
        const categoryId = categories[0].id;
        setTimeout(async () => {
          const generatedNumber = await generateAssetNumber(categoryId);
          setFormData(prev => ({
            ...prev,
            categoryAccountId: categoryId,
            assetNumber: generatedNumber || ''
          }));
        }, 100);
      }
    } else if (asset) {
      const defaultData = getDefaultFormData();
      setFormData({
        ...defaultData,
        assetNumber: asset.assetNumber || defaultData.assetNumber,
        name: asset.name || defaultData.name,
        nameEn: asset.nameEn || defaultData.nameEn,
        categoryAccountId: (asset as any).categoryAccountId || defaultData.categoryAccountId,
        branch: asset.branch || defaultData.branch,
        purchaseDate: asset.purchaseDate || defaultData.purchaseDate,
        purchaseCost: (asset as any).purchaseCost ?? defaultData.purchaseCost,
        currency: asset.currency || defaultData.currency,
        depreciationMethod: asset.depreciationMethod || defaultData.depreciationMethod,
        usefulLife: asset.usefulLife ?? defaultData.usefulLife,
        salvageValue: asset.salvageValue ?? defaultData.salvageValue,
        location: asset.location || defaultData.location,
        serialNumber: asset.serialNumber || defaultData.serialNumber,
        supplier: asset.supplier || defaultData.supplier,
        warrantyExpiry: asset.warrantyExpiry || defaultData.warrantyExpiry,
        description: (asset as any).description || defaultData.description
      });
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
    setFormErrors({});
  };

  // Generate asset number automatically
  const generateAssetNumber = async (categoryAccountId: string) => {
    if (!categoryAccountId) return '';

    try {
      // Find the selected category
      const selectedCategory = categories.find(cat => cat.id === categoryAccountId);
      if (!selectedCategory) return '';

      // Get existing assets for this category to determine next number
      const existingAssets = assets.filter(asset =>
        (asset as any).categoryAccountId === categoryAccountId
      );

      // Generate hierarchical asset number: categoryCode.nextNumber
      const nextNumber = existingAssets.length + 1;
      return `${selectedCategory.code}.${nextNumber}`;
    } catch (error) {
      console.error('Error generating asset number:', error);
      return '';
    }
  };

  // Handle category change and auto-generate asset number
  const handleCategoryChange = async (categoryAccountId: string) => {
    setFormData(prev => ({ ...prev, categoryAccountId }));

    // Auto-generate asset number if in create mode and no manual number entered
    if (modalMode === 'create' && !formData.assetNumber.trim()) {
      const generatedNumber = await generateAssetNumber(categoryAccountId);
      if (generatedNumber) {
        setFormData(prev => ({ ...prev, assetNumber: generatedNumber }));
      }
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.assetNumber.trim()) {
      errors.assetNumber = 'رقم الأصل مطلوب';
    }
    
    if (!formData.name.trim()) {
      errors.name = 'اسم الأصل مطلوب';
    }
    
    if (!formData.categoryAccountId.trim()) {
      errors.categoryAccountId = 'فئة الأصل مطلوبة';
    }

    if (!formData.purchaseDate) {
      errors.purchaseDate = 'تاريخ الشراء مطلوب';
    }

    if (!formData.purchaseCost || formData.purchaseCost <= 0) {
      errors.purchaseCost = 'تكلفة الشراء مطلوبة ويجب أن تكون أكبر من صفر';
    }
    
    if (!formData.usefulLife || formData.usefulLife <= 0) {
      errors.usefulLife = 'العمر الإنتاجي مطلوب ويجب أن يكون أكبر من صفر';
    }
    
    if (formData.salvageValue < 0) {
      errors.salvageValue = 'القيمة المتبقية لا يمكن أن تكون سالبة';
    }
    
    if (formData.salvageValue >= formData.purchaseCost) {
      errors.salvageValue = 'القيمة المتبقية يجب أن تكون أقل من سعر الشراء';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      if (modalMode === 'create') {
        const response = await financialAPI.createFixedAsset(formData);

        // Show detailed success message with created accounts
        let successMessage = 'تم إنشاء الأصل الثابت بنجاح!\n\n';
        const assetData = response.data || response;
        successMessage += `رقم الأصل: ${assetData.assetNumber}\n`;
        successMessage += `اسم الأصل: ${assetData.name}\n\n`;

        if (response.createdAccounts) {
          successMessage += 'الحسابات المُنشأة تلقائياً:\n';
          if (response.createdAccounts.assetAccount) {
            successMessage += `• حساب الأصل: ${response.createdAccounts.assetAccount.code} - ${response.createdAccounts.assetAccount.name}\n`;
          }
          if (response.createdAccounts.depreciationExpenseAccount) {
            successMessage += `• حساب مصروف الإهلاك: ${response.createdAccounts.depreciationExpenseAccount.code} - ${response.createdAccounts.depreciationExpenseAccount.name}\n`;
          }
          if (response.createdAccounts.accumulatedDepreciationAccount) {
            successMessage += `• حساب مخصص الإهلاك: ${response.createdAccounts.accumulatedDepreciationAccount.code} - ${response.createdAccounts.accumulatedDepreciationAccount.name}\n`;
          }
        }

        alert(successMessage);
      } else if (modalMode === 'edit' && selectedAsset) {
        await financialAPI.updateFixedAsset(selectedAsset.id, formData);
        alert('تم تحديث الأصل الثابت بنجاح');
      }

      closeModal();
      loadAssets();
    } catch (error) {
      console.error('Error saving fixed asset:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepreciation = async (asset: FixedAsset) => {
    try {
      const result = await financialAPI.calculateDepreciation(asset.id);
      if (result.success) {
        const data = result.data;
        const message = `تم حساب الاستهلاك بنجاح:

الأصل: ${data.assetName}
رقم الأصل: ${data.assetNumber}
طريقة الاستهلاك: ${data.depreciationMethod === 'straight_line' ? 'القسط الثابت' : data.depreciationMethod}
تكلفة الشراء: ${formatCurrencyAmount(data.purchaseCost)} ${asset.currency || 'LYD'}
القيمة المتبقية: ${formatCurrencyAmount(data.salvageValue)} ${asset.currency || 'LYD'}
العمر الإنتاجي: ${data.usefulLife} سنوات
الاستهلاك السنوي: ${formatCurrencyAmount(data.annualDepreciation)} ${asset.currency || 'LYD'}
الاستهلاك الشهري: ${formatCurrencyAmount(data.monthlyDepreciation)} ${asset.currency || 'LYD'}`;

        alert(message);
      } else {
        alert('تم حساب الاستهلاك بنجاح');
      }
    } catch (error) {
      console.error('Error calculating depreciation:', error);
      alert('حدث خطأ أثناء حساب الاستهلاك');
    }
  };

  const columns = [
    {
      key: 'assetNumber',
      title: 'رقم الأصل',
      width: '120px'
    },
    {
      key: 'name',
      title: 'اسم الأصل',
      render: (value: string, record: FixedAsset) => (
        <div>
          <div className="font-medium">{value}</div>
          {record.nameEn && (
            <div className="text-sm text-gray-500">{record.nameEn}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      title: 'الفئة',
      width: '120px'
    },
    {
      key: 'branch',
      title: 'الفرع',
      width: '100px'
    },
    {
      key: 'purchasePrice',
      title: 'سعر الشراء',
      width: '120px',
      align: 'left' as const,
      render: (value: number, record: FixedAsset) => (
        <div className="text-left">
          <span className="text-blue-600">
            {new Intl.NumberFormat('ar-LY').format(isNaN(value) || !isFinite(value) ? 0 : value)}
          </span>
          <span className="text-gray-500 text-sm mr-1">{record.currency}</span>
        </div>
      )
    },
    {
      key: 'currentValue',
      title: 'القيمة الحالية',
      width: '120px',
      align: 'left' as const,
      render: (value: number | null | undefined, record: FixedAsset) => (
        <div className="text-left">
          <CurrencyDisplay
            value={value}
            currency={record.currency || 'LYD'}
            color="success"
            className="text-green-600"
          />
        </div>
      )
    },
    {
      key: 'accumulatedDepreciation',
      title: 'الاستهلاك المتراكم',
      width: '140px',
      align: 'left' as const,
      render: (value: number | null | undefined, record: FixedAsset) => (
        <div className="text-left">
          <CurrencyDisplay
            value={value}
            currency={record.currency || 'LYD'}
            color="danger"
            className="text-red-600"
          />
        </div>
      )
    },
    {
      key: 'salvageValue',
      title: 'قيمة الخردة',
      width: '120px',
      align: 'left' as const,
      render: (value: number | null | undefined, record: FixedAsset) => (
        <div className="text-left">
          <CurrencyDisplay
            value={value}
            currency={record.currency || 'LYD'}
            color="warning"
            className="text-orange-600"
          />
        </div>
      )
    },
    {
      key: 'bookValue',
      title: 'القيمة الدفترية',
      width: '140px',
      align: 'left' as const,
      render: (_: any, record: FixedAsset) => {
        const purchasePrice = record.purchasePrice || (record as any).purchaseCost || 0;
        const accumulatedDepreciation = record.accumulatedDepreciation || 0;
        const bookValue = purchasePrice - accumulatedDepreciation;
        return (
          <div className="text-left">
            <CurrencyDisplay
              value={bookValue}
              currency={record.currency || 'LYD'}
              color="info"
              className="text-purple-600"
            />
          </div>
        );
      }
    },
    {
      key: 'status',
      title: 'الحالة',
      width: '100px',
      render: (value: string) => {
        const statusLabels = {
          active: { label: 'نشط', color: 'bg-green-100 text-green-800' },
          disposed: { label: 'مباع', color: 'bg-yellow-100 text-yellow-800' },
          scrapped: { label: 'مستهلك', color: 'bg-red-100 text-red-800' }
        };
        const status = statusLabels[value as keyof typeof statusLabels] || { label: 'غير محدد', color: 'bg-gray-100 text-gray-800' };
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
      width: '150px',
      render: (_: any, record: FixedAsset) => (
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
          {record.status === 'active' && (
            <>
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
                  handleDepreciation(record);
                }}
                className="text-purple-600 hover:text-purple-800"
                title="حساب الاستهلاك"
              >
                <Calculator className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${cat.code} - ${cat.name}`
  }));

  const statusOptions = [
    { value: 'active', label: 'نشط' },
    { value: 'disposed', label: 'مباع' },
    { value: 'scrapped', label: 'مستهلك' }
  ];

  const depreciationMethodOptions = [
    { value: 'straight_line', label: 'القسط الثابت' },
    { value: 'declining_balance', label: 'الرصيد المتناقص' }
  ];

  const branchOptions = [
    { value: 'main', label: 'الفرع الرئيسي' },
    { value: 'tripoli', label: 'طرابلس' },
    { value: 'benghazi', label: 'بنغازي' },
    { value: 'misrata', label: 'مصراتة' }
  ];

  const currencyOptions = [
    { value: 'LYD', label: 'دينار ليبي' },
    { value: 'USD', label: 'دولار أمريكي' },
    { value: 'EUR', label: 'يورو' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Building className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 ml-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إدارة الأصول الثابتة</h1>
            <p className="text-sm sm:text-base text-gray-600">تسجيل الأصول وحساب الاستهلاك</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="h-5 w-5 ml-2" />
          أصل جديد
        </button>
      </div>

      {/* Search and Filters */}
      <SearchFilter
        searchValue={searchValue}
        onSearchChange={handleSearch}
        filters={[
          {
            key: 'category',
            label: 'الفئة',
            value: categoryFilter,
            options: categoryOptions,
            onChange: handleCategoryFilter
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
        placeholder="البحث في الأصول..."
      />

      {/* Assets Table */}
      <DataTable
        columns={columns}
        data={assets}
        loading={loading}
        pagination={{
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
        }}
        emptyText="لا توجد أصول"
      />

      {/* Asset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'إضافة أصل جديد' :
          modalMode === 'edit' ? 'تعديل الأصل' : 'عرض الأصل'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormField
                label="رقم الأصل"
                name="assetNumber"
                value={formData.assetNumber}
                onChange={(value) => setFormData(prev => ({ ...prev, assetNumber: value as string }))}
                required
                error={formErrors.assetNumber}
                disabled={modalMode === 'view'}
              />
              {modalMode === 'create' && formData.categoryAccountId && (
                <button
                  type="button"
                  onClick={async () => {
                    const generatedNumber = await generateAssetNumber(formData.categoryAccountId);
                    if (generatedNumber) {
                      setFormData(prev => ({ ...prev, assetNumber: generatedNumber }));
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  توليد رقم تلقائي
                </button>
              )}
            </div>

            <FormField
              label="الفئة"
              name="categoryAccountId"
              type="select"
              value={formData.categoryAccountId}
              onChange={(value) => handleCategoryChange(value as string)}
              options={categories.map(cat => ({ value: cat.id, label: `${cat.code} - ${cat.name}` }))}
              required
              error={formErrors.categoryAccountId}
              disabled={modalMode === 'view'}
            />
          </div>

          <FormField
            label="اسم الأصل (عربي)"
            name="name"
            value={formData.name}
            onChange={(value) => setFormData(prev => ({ ...prev, name: value as string }))}
            required
            error={formErrors.name}
            disabled={modalMode === 'view'}
          />

          <FormField
            label="اسم الأصل (إنجليزي)"
            name="nameEn"
            value={formData.nameEn}
            onChange={(value) => setFormData(prev => ({ ...prev, nameEn: value as string }))}
            disabled={modalMode === 'view'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="الفرع"
              name="branch"
              type="select"
              value={formData.branch}
              onChange={(value) => setFormData(prev => ({ ...prev, branch: value as string }))}
              options={branchOptions}
              required
              error={formErrors.branch}
              disabled={modalMode === 'view'}
            />

            <FormField
              label="الموقع"
              name="location"
              value={formData.location}
              onChange={(value) => setFormData(prev => ({ ...prev, location: value as string }))}
              disabled={modalMode === 'view'}
            />
          </div>

          {/* Purchase Information */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">معلومات الشراء</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                label="تاريخ الشراء"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(value) => setFormData(prev => ({ ...prev, purchaseDate: value as string }))}
                required
                error={formErrors.purchaseDate}
                disabled={modalMode === 'view'}
              />

              <FormField
                label="سعر الشراء"
                name="purchaseCost"
                type="number"
                value={formData.purchaseCost}
                onChange={(value) => setFormData(prev => ({ ...prev, purchaseCost: value as number }))}
                min={0}
                step={0.01}
                required
                error={formErrors.purchaseCost}
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

            <FormField
              label="المورد"
              name="supplier"
              value={formData.supplier}
              onChange={(value) => setFormData(prev => ({ ...prev, supplier: value as string }))}
              disabled={modalMode === 'view'}
            />
          </div>

          {/* Depreciation Information */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">معلومات الاستهلاك</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                label="طريقة الاستهلاك"
                name="depreciationMethod"
                type="select"
                value={formData.depreciationMethod}
                onChange={(value) => setFormData(prev => ({ ...prev, depreciationMethod: value as string }))}
                options={depreciationMethodOptions}
                disabled={modalMode === 'view'}
              />

              <FormField
                label="العمر الإنتاجي (سنوات)"
                name="usefulLife"
                type="number"
                value={formData.usefulLife}
                onChange={(value) => setFormData(prev => ({ ...prev, usefulLife: value as number }))}
                min={1}
                required
                error={formErrors.usefulLife}
                disabled={modalMode === 'view'}
              />

              <FormField
                label="القيمة المتبقية"
                name="salvageValue"
                type="number"
                value={formData.salvageValue}
                onChange={(value) => setFormData(prev => ({ ...prev, salvageValue: value as number }))}
                min={0}
                step={0.01}
                error={formErrors.salvageValue}
                disabled={modalMode === 'view'}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">معلومات إضافية</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="الرقم التسلسلي"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={(value) => setFormData(prev => ({ ...prev, serialNumber: value as string }))}
                disabled={modalMode === 'view'}
              />

              <FormField
                label="انتهاء الضمان"
                name="warrantyExpiry"
                type="date"
                value={formData.warrantyExpiry}
                onChange={(value) => setFormData(prev => ({ ...prev, warrantyExpiry: value as string }))}
                disabled={modalMode === 'view'}
              />
            </div>

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

          {/* Depreciation History (only show in view mode) */}
          {modalMode === 'view' && selectedAsset && selectedAsset.depreciationEntries.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">تاريخ الاستهلاك</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التاريخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        مبلغ الاستهلاك
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الاستهلاك المتراكم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        القيمة المتبقية
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedAsset.depreciationEntries.map((entry, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString('ar-LY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <CurrencyDisplay value={entry.amount} currency="LYD" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <CurrencyDisplay value={entry.accumulatedAmount} currency="LYD" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <CurrencyDisplay value={entry.remainingValue} currency="LYD" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FixedAssetsManagement;

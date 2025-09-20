import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit, Eye, Building, User, AlertCircle, CheckCircle } from 'lucide-react';
import { financialAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';
import { Customer } from '../types/financial';
import { useAuth } from '../contexts/AuthContext';

const CustomersManagement: React.FC = () => {
  const { user } = useAuth();
  const isFinancialManager = user?.role === 'financial';

  // مركزة صلاحيات الأدوار
  const canCreateCustomers = user?.role === 'sales' || user?.role === 'admin';
  const canEditCustomers = user?.role === 'sales' || user?.role === 'admin';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    type: 'individual',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    creditLimit: 0,
    paymentTerms: 30,
    currency: 'LYD'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [pagination.current, searchValue, typeFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        type: typeFilter || undefined
      };

      const response = await financialAPI.getCustomers(params);
      setCustomers(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('حدث خطأ في تحميل بيانات العملاء. يرجى المحاولة مرة أخرى.');
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

  const retryLoadCustomers = () => {
    setError(null);
    loadCustomers();
  };

  const openModal = (mode: 'create' | 'edit' | 'view', customer?: Customer) => {
    setModalMode(mode);
    setSelectedCustomer(customer || null);
    
    if (mode === 'create') {
      setFormData({
        code: '',
        name: '',
        nameEn: '',
        type: 'individual',
        email: '',
        phone: '',
        address: '',
        taxNumber: '',
        creditLimit: 0,
        paymentTerms: 30,
        currency: 'LYD'
      });
    } else if (customer) {
      setFormData({
        code: customer.code,
        name: customer.name,
        nameEn: customer.nameEn || '',
        type: customer.type,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        taxNumber: customer.taxNumber || '',
        creditLimit: customer.creditLimit,
        paymentTerms: customer.paymentTerms,
        currency: customer.currency
      });
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'اسم العميل مطلوب';
    }

    if (!formData.type) {
      errors.type = 'نوع العميل مطلوب';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (formData.creditLimit < 0) {
      errors.creditLimit = 'حد الائتمان لا يمكن أن يكون سالباً';
    }

    if (formData.paymentTerms < 0) {
      errors.paymentTerms = 'مدة السداد لا يمكن أن تكون سالبة';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      if (modalMode === 'create') {
        if (isFinancialManager) {
          setError('المدير المالي لا يمكنه إنشاء عملاء. يرجى التواصل مع قسم المبيعات.');
          return;
        }
        await financialAPI.createCustomer(formData);
      } else if (modalMode === 'edit' && selectedCustomer) {
        if (isFinancialManager) {
          setError('المدير المالي لا يمكنه تعديل العملاء. يرجى التواصل مع قسم المبيعات.');
          return;
        }
        await financialAPI.updateCustomer(selectedCustomer.id, formData);
      }

      closeModal();
      setSuccessMessage(
        modalMode === 'create'
          ? 'تم إنشاء العميل بنجاح'
          : 'تم تحديث بيانات العميل بنجاح'
      );
      loadCustomers();

      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setError(error?.response?.data?.message || 'حدث خطأ في حفظ بيانات العميل. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'code',
      title: 'رمز العميل',
      width: '120px'
    },
    {
      key: 'name',
      title: 'اسم العميل',
      render: (value: string, record: Customer) => (
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg ml-3">
            {record.type === 'company' ? (
              <Building className="h-4 w-4 text-blue-600" />
            ) : (
              <User className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div>
            <div className="font-medium">{value}</div>
            {record.nameEn && (
              <div className="text-sm text-gray-500">{record.nameEn}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'النوع',
      width: '100px',
      render: (value: string) => value === 'company' ? 'شركة' : 'فرد'
    },
    {
      key: 'phone',
      title: 'الهاتف',
      width: '140px',
      render: (value: string) => value || '-'
    },
    {
      key: 'creditLimit',
      title: 'حد الائتمان',
      width: '120px',
      align: 'left' as const,
      render: (value: number, record: Customer) => (
        <div className="text-left">
          <span className="text-blue-600">
            {new Intl.NumberFormat('ar-LY').format(isNaN(value) || !isFinite(value) ? 0 : value)}
          </span>
          <span className="text-gray-500 text-sm mr-1">{record.currency}</span>
        </div>
      )
    },
    {
      key: 'balance',
      title: 'الرصيد الحالي',
      width: '120px',
      align: 'left' as const,
      render: (value: number, record: Customer) => (
        <div className="text-left">
          <span className={`font-medium ${
            (value || 0) > 0 ? 'text-green-600' : (value || 0) < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {new Intl.NumberFormat('ar-LY').format(value || 0)}
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
      render: (_: any, record: Customer) => (
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
          {canEditCustomers && (
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

  const customerTypeOptions = [
    { value: 'individual', label: 'فرد' },
    { value: 'company', label: 'شركة' }
  ];

  const currencyOptions = [
    { value: 'LYD', label: 'دينار ليبي' },
    { value: 'USD', label: 'دولار أمريكي' },
    { value: 'EUR', label: 'يورو' },
    { value: 'CNY', label: 'يوان صيني' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isFinancialManager ? 'متابعة العملاء' : 'إدارة العملاء'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {isFinancialManager ? 'متابعة الحركة المالية والأرصدة' : 'بيانات العملاء والأرصدة'}
            </p>
          </div>
        </div>
        {canCreateCustomers && (
          <button
            onClick={() => openModal('create')}
            className="btn-primary flex items-center justify-center w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 ml-2" />
            عميل جديد
          </button>
        )}

      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 ml-3 flex-shrink-0" />
            <div className="text-red-700 flex-1">{error}</div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={retryLoadCustomers}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 ml-3 flex-shrink-0" />
            <div className="text-green-700 flex-1">{successMessage}</div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-700 text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <SearchFilter
        searchValue={searchValue}
        onSearchChange={handleSearch}
        filters={[
          {
            key: 'type',
            label: 'نوع العميل',
            value: typeFilter,
            options: customerTypeOptions,
            onChange: handleTypeFilter
          }
        ]}
        onClearFilters={clearFilters}
        placeholder="البحث في العملاء..."
      />

      {/* Customers Table */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        pagination={{
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
        }}
        emptyText="لا توجد عملاء"
      />

      {/* Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'إضافة عميل جديد' :
          modalMode === 'edit' ? 'تعديل العميل' : 'عرض العميل'
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
                className={`btn-primary ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الحفظ...
                  </div>
                ) : (
                  'حفظ'
                )}
              </button>
            </>
          ) : (
            <button onClick={closeModal} className="btn-secondary">
              إغلاق
            </button>
          )
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="رمز العميل (اختياري - سيتم إنشاؤه تلقائياً)"
            name="code"
            value={formData.code}
            onChange={(value) => setFormData(prev => ({ ...prev, code: value as string }))}
            placeholder="اتركه فارغاً لإنشاء رمز تلقائي من دليل الحسابات"
            error={formErrors.code}
            disabled={modalMode === 'view'}
          />
          
          <FormField
            label="نوع العميل"
            name="type"
            type="select"
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value as string }))}
            options={customerTypeOptions}
            required
            error={formErrors.type}
            disabled={modalMode === 'view'}
          />
          
          <FormField
            label="اسم العميل (عربي)"
            name="name"
            value={formData.name}
            onChange={(value) => setFormData(prev => ({ ...prev, name: value as string }))}
            required
            error={formErrors.name}
            disabled={modalMode === 'view'}
            className="sm:col-span-2"
          />
          
          <FormField
            label="اسم العميل (إنجليزي)"
            name="nameEn"
            value={formData.nameEn}
            onChange={(value) => setFormData(prev => ({ ...prev, nameEn: value as string }))}
            disabled={modalMode === 'view'}
            className="sm:col-span-2"
          />
          
          <FormField
            label="البريد الإلكتروني"
            name="email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData(prev => ({ ...prev, email: value as string }))}
            error={formErrors.email}
            disabled={modalMode === 'view'}
          />
          
          <FormField
            label="رقم الهاتف"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(value) => setFormData(prev => ({ ...prev, phone: value as string }))}
            disabled={modalMode === 'view'}
          />
          
          <FormField
            label="العنوان"
            name="address"
            type="textarea"
            value={formData.address}
            onChange={(value) => setFormData(prev => ({ ...prev, address: value as string }))}
            disabled={modalMode === 'view'}
            className="sm:col-span-2"
            rows={2}
          />
          
          <FormField
            label="الرقم الضريبي"
            name="taxNumber"
            value={formData.taxNumber}
            onChange={(value) => setFormData(prev => ({ ...prev, taxNumber: value as string }))}
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
          
          <FormField
            label="حد الائتمان"
            name="creditLimit"
            type="number"
            value={formData.creditLimit}
            onChange={(value) => setFormData(prev => ({ ...prev, creditLimit: value as number }))}
            min={0}
            step={0.01}
            error={formErrors.creditLimit}
            disabled={modalMode === 'view'}
          />
          
          <FormField
            label="مدة السداد (أيام)"
            name="paymentTerms"
            type="number"
            value={formData.paymentTerms}
            onChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value as number }))}
            min={0}
            error={formErrors.paymentTerms}
            disabled={modalMode === 'view'}
          />
        </div>
      </Modal>
    </div>
  );
};

export default CustomersManagement;

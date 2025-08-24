import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, Edit, Eye, DollarSign, Calendar } from 'lucide-react';
import { financialAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';
import { Employee } from '../types/financial';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'advances'>('employees');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    employeeNumber: '',
    name: '',
    nameEn: '',
    position: '',
    department: '',
    branch: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: 0,
    currency: 'LYD',
    bankAccount: '',
    phone: '',
    email: '',
    address: '',
    nationalId: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [pagination.current, searchValue, departmentFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        department: departmentFilter || undefined
      };
      
      const response = await financialAPI.getEmployees(params);
      setEmployees(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDepartmentFilter = (value: string) => {
    setDepartmentFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setSearchValue('');
    setDepartmentFilter('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const openModal = (mode: 'create' | 'edit' | 'view', employee?: Employee) => {
    setModalMode(mode);
    setSelectedEmployee(employee || null);
    
    if (mode === 'create') {
      setFormData({
        employeeNumber: '',
        name: '',
        nameEn: '',
        position: '',
        department: '',
        branch: '',
        hireDate: new Date().toISOString().split('T')[0],
        salary: 0,
        currency: 'LYD',
        bankAccount: '',
        phone: '',
        email: '',
        address: '',
        nationalId: ''
      });
    } else if (employee) {
      setFormData({
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        nameEn: employee.nameEn || '',
        position: employee.position,
        department: employee.department,
        branch: employee.branch,
        hireDate: employee.hireDate,
        salary: employee.salary,
        currency: employee.currency,
        bankAccount: employee.bankAccount || '',
        phone: employee.phone || '',
        email: employee.email || '',
        address: employee.address || '',
        nationalId: employee.nationalId || ''
      });
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.employeeNumber.trim()) {
      errors.employeeNumber = 'رقم الموظف مطلوب';
    }
    
    if (!formData.name.trim()) {
      errors.name = 'اسم الموظف مطلوب';
    }
    
    if (!formData.position.trim()) {
      errors.position = 'المنصب مطلوب';
    }
    
    if (!formData.department.trim()) {
      errors.department = 'القسم مطلوب';
    }
    
    if (!formData.branch.trim()) {
      errors.branch = 'الفرع مطلوب';
    }
    
    if (!formData.hireDate) {
      errors.hireDate = 'تاريخ التوظيف مطلوب';
    }
    
    if (!formData.salary || formData.salary <= 0) {
      errors.salary = 'الراتب مطلوب ويجب أن يكون أكبر من صفر';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      if (modalMode === 'create') {
        await financialAPI.createEmployee(formData);
      } else if (modalMode === 'edit' && selectedEmployee) {
        await financialAPI.updateEmployee(selectedEmployee.id, formData);
      }
      
      closeModal();
      loadEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'employeeNumber',
      title: 'رقم الموظف',
      width: '120px'
    },
    {
      key: 'name',
      title: 'اسم الموظف',
      render: (value: string, record: Employee) => (
        <div>
          <div className="font-medium">{value}</div>
          {record.nameEn && (
            <div className="text-sm text-gray-500">{record.nameEn}</div>
          )}
        </div>
      )
    },
    {
      key: 'position',
      title: 'المنصب',
      width: '150px'
    },
    {
      key: 'department',
      title: 'القسم',
      width: '120px'
    },
    {
      key: 'branch',
      title: 'الفرع',
      width: '120px'
    },
    {
      key: 'salary',
      title: 'الراتب',
      width: '120px',
      align: 'left' as const,
      render: (value: number, record: Employee) => (
        <div className="text-left">
          <span className="text-green-600">
            {new Intl.NumberFormat('ar-LY').format(value)}
          </span>
          <span className="text-gray-500 text-sm mr-1">{record.currency}</span>
        </div>
      )
    },
    {
      key: 'hireDate',
      title: 'تاريخ التوظيف',
      width: '120px',
      render: (value: string) => new Date(value).toLocaleDateString('ar-LY')
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
      width: '150px',
      render: (_: any, record: Employee) => (
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
              // Handle payroll generation
              alert('سيتم تطوير وحدة الرواتب قريباً');
            }}
            className="text-purple-600 hover:text-purple-800"
            title="الراتب"
          >
            <DollarSign className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const departmentOptions = [
    { value: 'shipping', label: 'الشحن' },
    { value: 'finance', label: 'المالية' },
    { value: 'operations', label: 'العمليات' },
    { value: 'customer_service', label: 'خدمة العملاء' },
    { value: 'admin', label: 'الإدارة' },
    { value: 'it', label: 'تقنية المعلومات' }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserCheck className="h-8 w-8 text-red-600 ml-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الموظفين والرواتب</h1>
            <p className="text-gray-600">بيانات الموظفين وحساب الرواتب</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 ml-2" />
          موظف جديد
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            الموظفين
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payroll'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            الرواتب
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'advances'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            السلف
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'employees' && (
        <>
          {/* Search and Filters */}
          <SearchFilter
            searchValue={searchValue}
            onSearchChange={handleSearch}
            filters={[
              {
                key: 'department',
                label: 'القسم',
                value: departmentFilter,
                options: departmentOptions,
                onChange: handleDepartmentFilter
              }
            ]}
            onClearFilters={clearFilters}
            placeholder="البحث في الموظفين..."
          />

          {/* Employees Table */}
          <DataTable
            columns={columns}
            data={employees}
            loading={loading}
            pagination={{
              current: pagination.current,
              total: pagination.total,
              pageSize: pagination.pageSize,
              onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
            }}
            emptyText="لا توجد موظفين"
          />
        </>
      )}

      {activeTab === 'payroll' && (
        <div className="card p-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">إدارة الرواتب</h3>
            <p className="text-gray-600 mb-4">سيتم تطوير وحدة إدارة الرواتب قريباً</p>
            <button className="btn-primary">
              <Plus className="h-4 w-4 ml-2" />
              إنشاء كشف راتب
            </button>
          </div>
        </div>
      )}

      {activeTab === 'advances' && (
        <div className="card p-6">
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">إدارة السلف</h3>
            <p className="text-gray-600 mb-4">سيتم تطوير وحدة إدارة السلف قريباً</p>
            <button className="btn-primary">
              <Plus className="h-4 w-4 ml-2" />
              إضافة سلفة
            </button>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'إضافة موظف جديد' :
          modalMode === 'edit' ? 'تعديل الموظف' : 'عرض الموظف'
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
            label="رقم الموظف"
            name="employeeNumber"
            value={formData.employeeNumber}
            onChange={(value) => setFormData(prev => ({ ...prev, employeeNumber: value as string }))}
            required
            error={formErrors.employeeNumber}
            disabled={modalMode === 'view'}
          />

          <FormField
            label="القسم"
            name="department"
            type="select"
            value={formData.department}
            onChange={(value) => setFormData(prev => ({ ...prev, department: value as string }))}
            options={departmentOptions}
            required
            error={formErrors.department}
            disabled={modalMode === 'view'}
          />

          <FormField
            label="اسم الموظف (عربي)"
            name="name"
            value={formData.name}
            onChange={(value) => setFormData(prev => ({ ...prev, name: value as string }))}
            required
            error={formErrors.name}
            disabled={modalMode === 'view'}
            className="md:col-span-2"
          />

          <FormField
            label="اسم الموظف (إنجليزي)"
            name="nameEn"
            value={formData.nameEn}
            onChange={(value) => setFormData(prev => ({ ...prev, nameEn: value as string }))}
            disabled={modalMode === 'view'}
            className="md:col-span-2"
          />

          <FormField
            label="المنصب"
            name="position"
            value={formData.position}
            onChange={(value) => setFormData(prev => ({ ...prev, position: value as string }))}
            required
            error={formErrors.position}
            disabled={modalMode === 'view'}
          />

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
            label="تاريخ التوظيف"
            name="hireDate"
            type="date"
            value={formData.hireDate}
            onChange={(value) => setFormData(prev => ({ ...prev, hireDate: value as string }))}
            required
            error={formErrors.hireDate}
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
            label="الراتب الأساسي"
            name="salary"
            type="number"
            value={formData.salary}
            onChange={(value) => setFormData(prev => ({ ...prev, salary: value as number }))}
            min={0}
            step={0.01}
            required
            error={formErrors.salary}
            disabled={modalMode === 'view'}
          />

          <FormField
            label="رقم الحساب البنكي"
            name="bankAccount"
            value={formData.bankAccount}
            onChange={(value) => setFormData(prev => ({ ...prev, bankAccount: value as string }))}
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
            label="البريد الإلكتروني"
            name="email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData(prev => ({ ...prev, email: value as string }))}
            error={formErrors.email}
            disabled={modalMode === 'view'}
          />

          <FormField
            label="العنوان"
            name="address"
            type="textarea"
            value={formData.address}
            onChange={(value) => setFormData(prev => ({ ...prev, address: value as string }))}
            disabled={modalMode === 'view'}
            className="md:col-span-2"
            rows={2}
          />

          <FormField
            label="رقم الهوية الوطنية"
            name="nationalId"
            value={formData.nationalId}
            onChange={(value) => setFormData(prev => ({ ...prev, nationalId: value as string }))}
            disabled={modalMode === 'view'}
            className="md:col-span-2"
          />
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;

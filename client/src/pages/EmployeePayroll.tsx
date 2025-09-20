import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit, Eye, DollarSign, CheckCircle, CreditCard } from 'lucide-react';
import { financialAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';
import { PayrollEntry, Employee } from '../types/financial';

const EmployeePayroll: React.FC = () => {
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    overtime: 0,
    bonuses: 0,
    paymentMethod: 'bank' as 'bank' | 'cash',
    remarks: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPayrollEntries();
    loadEmployees();
  }, [pagination.current, searchValue, statusFilter, departmentFilter, monthFilter, yearFilter]);

  const loadPayrollEntries = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
        month: monthFilter ? parseInt(monthFilter) : undefined,
        year: yearFilter ? parseInt(yearFilter) : undefined
      };
      
      const response = await financialAPI.getPayrollEntries(params);
      setPayrollEntries(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      console.error('Error loading payroll entries:', error);
      setPayrollEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await financialAPI.getEmployees({ limit: 1000 });
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', entry?: PayrollEntry) => {
    setModalMode(mode);
    setSelectedEntry(entry || null);
    
    if (mode === 'create') {
      setFormData({
        employeeId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basicSalary: 0,
        allowances: 0,
        deductions: 0,
        overtime: 0,
        bonuses: 0,
        paymentMethod: 'bank',
        remarks: ''
      });
    } else if (entry) {
      const entryMonth = entry.month ? new Date(entry.month + '-01') : new Date();
      setFormData({
        employeeId: entry.employeeId,
        month: entryMonth.getMonth() + 1,
        year: entryMonth.getFullYear(),
        basicSalary: entry.basicSalary,
        allowances: entry.allowances,
        deductions: entry.deductions,
        overtime: entry.overtime || 0,
        bonuses: entry.bonuses || 0,
        paymentMethod: entry.paymentMethod === 'cash' ? 'cash' : 'bank',
        remarks: entry.remarks || ''
      });
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
    setFormData({
      employeeId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      overtime: 0,
      bonuses: 0,
      paymentMethod: 'bank',
      remarks: ''
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.employeeId) {
      errors.employeeId = 'يجب اختيار الموظف';
    }
    
    if (!formData.month || formData.month < 1 || formData.month > 12) {
      errors.month = 'يجب اختيار شهر صحيح';
    }
    
    if (!formData.year || formData.year < 2020) {
      errors.year = 'يجب إدخال سنة صحيحة';
    }
    
    if (formData.basicSalary < 0) {
      errors.basicSalary = 'الراتب الأساسي لا يمكن أن يكون سالباً';
    }
    
    if (formData.allowances < 0) {
      errors.allowances = 'البدلات لا يمكن أن تكون سالبة';
    }
    
    if (formData.deductions < 0) {
      errors.deductions = 'الخصومات لا يمكن أن تكون سالبة';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      if (modalMode === 'create') {
        await financialAPI.createPayrollEntry(formData);
      } else if (modalMode === 'edit' && selectedEntry) {
        await financialAPI.updatePayrollEntry(selectedEntry.id, formData);
      }
      
      closeModal();
      loadPayrollEntries();
    } catch (error) {
      console.error('Error saving payroll entry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (entry: PayrollEntry) => {
    try {
      await financialAPI.approvePayrollEntry(entry.id);
      loadPayrollEntries();
    } catch (error) {
      console.error('Error approving payroll entry:', error);
    }
  };

  const handlePay = async (entry: PayrollEntry) => {
    try {
      await financialAPI.payPayrollEntry(entry.id);
      loadPayrollEntries();
    } catch (error) {
      console.error('Error paying payroll entry:', error);
    }
  };

  const columns = [
    {
      key: 'employeeName',
      title: 'اسم الموظف',
      width: '200px'
    },
    {
      key: 'month',
      title: 'الشهر/السنة',
      width: '120px',
      render: (value: string) => {
        const date = new Date(value + '-01');
        return `${date.getMonth() + 1}/${date.getFullYear()}`;
      }
    },
    {
      key: 'basicSalary',
      title: 'الراتب الأساسي',
      width: '120px',
      render: (value: number) => `${(isNaN(value) || !isFinite(value) ? 0 : value).toLocaleString('ar-LY')} د.ل`
    },
    {
      key: 'allowances',
      title: 'البدلات',
      width: '100px',
      render: (value: number) => `${(isNaN(value) || !isFinite(value) ? 0 : value).toLocaleString('ar-LY')} د.ل`
    },
    {
      key: 'deductions',
      title: 'الخصومات',
      width: '100px',
      render: (value: number) => `${(isNaN(value) || !isFinite(value) ? 0 : value).toLocaleString('ar-LY')} د.ل`
    },
    {
      key: 'netSalary',
      title: 'صافي الراتب',
      width: '120px',
      render: (value: number) => `${(isNaN(value) || !isFinite(value) ? 0 : value).toLocaleString('ar-LY')} د.ل`
    },
    {
      key: 'status',
      title: 'الحالة',
      width: '100px',
      render: (value: string) => {
        const statusMap = {
          draft: { text: 'مسودة', class: 'bg-gray-100 text-gray-800' },
          approved: { text: 'معتمد', class: 'bg-blue-100 text-blue-800' },
          paid: { text: 'مدفوع', class: 'bg-green-100 text-green-800' },
          cancelled: { text: 'ملغي', class: 'bg-red-100 text-red-800' }
        };
        const status = statusMap[value as keyof typeof statusMap] || statusMap.draft;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
            {status.text}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      width: '150px',
      render: (_: any, record: PayrollEntry) => (
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
          {record.status === 'draft' && (
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
          {record.status === 'draft' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(record);
              }}
              className="text-purple-600 hover:text-purple-800"
              title="اعتماد"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {record.status === 'approved' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePay(record);
              }}
              className="text-green-600 hover:text-green-800"
              title="دفع"
            >
              <CreditCard className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'draft', label: 'مسودة' },
    { value: 'approved', label: 'معتمد' },
    { value: 'paid', label: 'مدفوع' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  const monthOptions = [
    { value: '', label: 'جميع الأشهر' },
    { value: '1', label: 'يناير' },
    { value: '2', label: 'فبراير' },
    { value: '3', label: 'مارس' },
    { value: '4', label: 'أبريل' },
    { value: '5', label: 'مايو' },
    { value: '6', label: 'يونيو' },
    { value: '7', label: 'يوليو' },
    { value: '8', label: 'أغسطس' },
    { value: '9', label: 'سبتمبر' },
    { value: '10', label: 'أكتوبر' },
    { value: '11', label: 'نوفمبر' },
    { value: '12', label: 'ديسمبر' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 ml-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إدارة الموظفين والرواتب</h1>
            <p className="text-sm sm:text-base text-gray-600">إدارة رواتب الموظفين والسلف والمستحقات</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="h-5 w-5 ml-2" />
          راتب جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SearchFilter
            value={searchValue}
            onChange={setSearchValue}
            placeholder="البحث في الموظفين..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="form-select"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="السنة"
            className="form-input"
            min="2020"
            max="2030"
          />
          <input
            type="text"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            placeholder="القسم"
            className="form-input"
          />
        </div>
      </div>

      {/* Payroll Entries Table */}
      <DataTable
        columns={columns}
        data={payrollEntries}
        loading={loading}
        pagination={{
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
        }}
        emptyText="لا توجد رواتب"
      />

      {/* Payroll Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'إضافة راتب جديد' :
          modalMode === 'edit' ? 'تعديل الراتب' : 'عرض الراتب'
        }
        size="lg"
      >
        <div className="space-y-4">
          {/* Employee Selection */}
          <FormField
            label="الموظف"
            error={formErrors.employeeId}
            required
          >
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
              className="form-select"
              disabled={modalMode === 'view'}
            >
              <option value="">اختر الموظف</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.code}
                </option>
              ))}
            </select>
          </FormField>

          {/* Month and Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="الشهر"
              error={formErrors.month}
              required
            >
              <select
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="form-select"
                disabled={modalMode === 'view'}
              >
                {monthOptions.slice(1).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="السنة"
              error={formErrors.year}
              required
            >
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="form-input"
                disabled={modalMode === 'view'}
                min="2020"
                max="2030"
              />
            </FormField>
          </div>

          {/* Salary Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="الراتب الأساسي"
              error={formErrors.basicSalary}
              required
            >
              <input
                type="number"
                value={formData.basicSalary}
                onChange={(e) => setFormData(prev => ({ ...prev, basicSalary: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                disabled={modalMode === 'view'}
                min="0"
                step="0.01"
              />
            </FormField>

            <FormField
              label="البدلات"
              error={formErrors.allowances}
            >
              <input
                type="number"
                value={formData.allowances}
                onChange={(e) => setFormData(prev => ({ ...prev, allowances: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                disabled={modalMode === 'view'}
                min="0"
                step="0.01"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="الخصومات"
              error={formErrors.deductions}
            >
              <input
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData(prev => ({ ...prev, deductions: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                disabled={modalMode === 'view'}
                min="0"
                step="0.01"
              />
            </FormField>

            <FormField
              label="العمل الإضافي"
              error={formErrors.overtime}
            >
              <input
                type="number"
                value={formData.overtime}
                onChange={(e) => setFormData(prev => ({ ...prev, overtime: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                disabled={modalMode === 'view'}
                min="0"
                step="0.01"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="المكافآت"
              error={formErrors.bonuses}
            >
              <input
                type="number"
                value={formData.bonuses}
                onChange={(e) => setFormData(prev => ({ ...prev, bonuses: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                disabled={modalMode === 'view'}
                min="0"
                step="0.01"
              />
            </FormField>

            <FormField
              label="طريقة الدفع"
            >
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'bank' | 'cash' }))}
                className="form-select"
                disabled={modalMode === 'view'}
              >
                <option value="bank">تحويل بنكي</option>
                <option value="cash">نقداً</option>
              </select>
            </FormField>
          </div>

          {/* Net Salary Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">صافي الراتب:</span>
              <span className="text-xl font-bold text-green-600">
                {(formData.basicSalary + formData.allowances + formData.overtime + formData.bonuses - formData.deductions).toLocaleString()} د.ل
              </span>
            </div>
          </div>

          {/* Remarks */}
          <FormField
            label="ملاحظات"
          >
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="form-textarea"
              disabled={modalMode === 'view'}
              rows={3}
            />
          </FormField>

          {/* Modal Actions */}
          {modalMode !== 'view' && (
            <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
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
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EmployeePayroll;

import React, { useState, useEffect } from 'react';
import { Users, Plus, Eye, Edit, DollarSign, CreditCard, Shield, Search, Filter } from 'lucide-react';
import { Modal } from '../components/UI/Modal';
import { FormField } from '../components/UI/FormField';
import { SearchFilter } from '../components/UI/SearchFilter';
import api from '../services/api';

interface Employee {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
  salaryAccountId?: string;
  advanceAccountId?: string;
  custodyAccountId?: string;
  currentBalance?: number;
}

interface EmployeeAccount {
  id: string;
  code: string;
  name: string;
  balance: number;
}

interface EmployeeWithAccounts {
  employee: Employee;
  accounts: {
    salary: EmployeeAccount | null;
    advance: EmployeeAccount | null;
    custody: EmployeeAccount | null;
  };
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'salary' | 'advance'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAccounts | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    position: '',
    department: '',
    salary: '',
    hireDate: '',
    email: '',
    phone: '',
    address: '',
    bankAccount: '',
    bankName: '',
    notes: ''
  });

  const [salaryFormData, setSalaryFormData] = useState({
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    description: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [advanceFormData, setAdvanceFormData] = useState({
    amount: '',
    description: '',
    advanceDate: new Date().toISOString().split('T')[0]
  });

  // Load employees
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial/employees', {
        params: {
          search: searchTerm,
          department: departmentFilter,
          position: positionFilter
        }
      });
      setEmployees(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load employee with accounts
  const loadEmployeeWithAccounts = async (employeeId: string) => {
    try {
      const response = await api.get(`/financial/employees/${employeeId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error loading employee with accounts:', error);
      return null;
    }
  };

  // Open modal
  const openModal = async (type: typeof modalType, employee?: Employee) => {
    setModalType(type);
    
    if (employee) {
      const employeeWithAccounts = await loadEmployeeWithAccounts(employee.id);
      setSelectedEmployee(employeeWithAccounts);
      
      if (type === 'edit') {
        setFormData({
          code: employee.code,
          name: employee.name,
          nameEn: employee.nameEn || '',
          position: employee.position,
          department: employee.department,
          salary: employee.salary.toString(),
          hireDate: employee.hireDate,
          email: '',
          phone: '',
          address: '',
          bankAccount: '',
          bankName: '',
          notes: ''
        });
      }
    } else {
      setSelectedEmployee(null);
      setFormData({
        code: '',
        name: '',
        nameEn: '',
        position: '',
        department: '',
        salary: '',
        hireDate: '',
        email: '',
        phone: '',
        address: '',
        bankAccount: '',
        bankName: '',
        notes: ''
      });
    }
    
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setModalType('create');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalType === 'create') {
        await api.post('/financial/employees', {
          ...formData,
          salary: parseFloat(formData.salary)
        });
      } else if (modalType === 'edit' && selectedEmployee) {
        await api.put(`/financial/employees/${selectedEmployee.employee.id}`, {
          ...formData,
          salary: parseFloat(formData.salary)
        });
      } else if (modalType === 'salary' && selectedEmployee) {
        await api.post(`/financial/employees/${selectedEmployee.employee.id}/salary-payment`, {
          ...salaryFormData,
          amount: parseFloat(salaryFormData.amount)
        });
      } else if (modalType === 'advance' && selectedEmployee) {
        await api.post(`/financial/employees/${selectedEmployee.employee.id}/advance`, {
          ...advanceFormData,
          amount: parseFloat(advanceFormData.amount)
        });
      }
      
      closeModal();
      loadEmployees();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    return employees.reduce((totals, employee) => ({
      totalEmployees: totals.totalEmployees + 1,
      activeEmployees: totals.activeEmployees + (employee.isActive ? 1 : 0),
      totalSalaries: totals.totalSalaries + employee.salary
    }), {
      totalEmployees: 0,
      activeEmployees: 0,
      totalSalaries: 0
    });
  };

  // Table columns
  const columns = [
    {
      key: 'code',
      title: 'كود الموظف',
      render: (record: Employee) => (
        <span className="font-mono text-sm">{record.code}</span>
      )
    },
    {
      key: 'name',
      title: 'اسم الموظف',
      render: (record: Employee) => (
        <div>
          <div className="font-medium">{record.name}</div>
          {record.nameEn && (
            <div className="text-sm text-gray-500">{record.nameEn}</div>
          )}
        </div>
      )
    },
    {
      key: 'position',
      title: 'المنصب',
      render: (record: Employee) => record.position
    },
    {
      key: 'department',
      title: 'القسم',
      render: (record: Employee) => record.department
    },
    {
      key: 'salary',
      title: 'الراتب',
      render: (record: Employee) => (
        <span className="font-medium text-green-600">
          {record.salary.toLocaleString()} د.ل
        </span>
      )
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (record: Employee) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          record.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {record.isActive ? 'نشط' : 'غير نشط'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (record: Employee) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => openModal('view', record)}
            className="btn-icon btn-primary"
            title="عرض التفاصيل"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openModal('edit', record)}
            className="btn-icon btn-secondary"
            title="تعديل"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => openModal('salary', record)}
            className="btn-icon btn-success"
            title="صرف راتب"
          >
            <DollarSign className="h-4 w-4" />
          </button>
          <button
            onClick={() => openModal('advance', record)}
            className="btn-icon btn-warning"
            title="صرف سلفة"
          >
            <CreditCard className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Load data on component mount
  useEffect(() => {
    loadEmployees();
  }, [searchTerm, departmentFilter, positionFilter]);

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إدارة الموظفين</h1>
            <p className="text-sm sm:text-base text-gray-600">إدارة شاملة للموظفين والحسابات والرواتب</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="h-5 w-5 ml-2" />
          موظف جديد
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي الموظفين</p>
              <p className="text-2xl font-bold text-gray-900">{totals.totalEmployees}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-600" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">الموظفين النشطين</p>
              <p className="text-2xl font-bold text-gray-900">{totals.activeEmployees}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي الرواتب</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.totalSalaries.toLocaleString()} د.ل
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="البحث في الموظفين..."
        filters={[
          {
            key: 'department',
            label: 'القسم',
            value: departmentFilter,
            onChange: setDepartmentFilter,
            options: [
              { value: '', label: 'جميع الأقسام' },
              { value: 'المحاسبة', label: 'المحاسبة' },
              { value: 'المبيعات', label: 'المبيعات' },
              { value: 'الإدارة', label: 'الإدارة' },
              { value: 'التقنية', label: 'التقنية' }
            ]
          },
          {
            key: 'position',
            label: 'المنصب',
            value: positionFilter,
            onChange: setPositionFilter,
            options: [
              { value: '', label: 'جميع المناصب' },
              { value: 'مدير', label: 'مدير' },
              { value: 'محاسب', label: 'محاسب' },
              { value: 'موظف', label: 'موظف' },
              { value: 'مساعد', label: 'مساعد' }
            ]
          }
        ]}
      />

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                    لا توجد موظفين
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.render(employee)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalType === 'create' ? 'إضافة موظف جديد' :
          modalType === 'edit' ? 'تعديل بيانات الموظف' :
          modalType === 'view' ? 'تفاصيل الموظف' :
          modalType === 'salary' ? 'صرف راتب' :
          'صرف سلفة'
        }
        size={modalType === 'view' ? '6xl' : '4xl'}
      >
        {modalType === 'view' && selectedEmployee ? (
          <div className="space-y-6">
            {/* Employee Basic Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">البيانات الأساسية</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">كود الموظف</label>
                  <p className="text-gray-900 font-mono">{selectedEmployee.employee.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">الاسم</label>
                  <p className="text-gray-900">{selectedEmployee.employee.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">المنصب</label>
                  <p className="text-gray-900">{selectedEmployee.employee.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">القسم</label>
                  <p className="text-gray-900">{selectedEmployee.employee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">الراتب</label>
                  <p className="text-gray-900 font-medium text-green-600">
                    {selectedEmployee.employee.salary.toLocaleString()} د.ل
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">تاريخ التوظيف</label>
                  <p className="text-gray-900">{selectedEmployee.employee.hireDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">الحالة</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedEmployee.employee.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEmployee.employee.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
            </div>

            {/* Employee Accounts */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">الحسابات المرتبطة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Salary Account */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-5 w-5 text-green-600 ml-2" />
                    <h4 className="font-medium">حساب المرتب</h4>
                  </div>
                  {selectedEmployee.accounts.salary ? (
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedEmployee.accounts.salary.code}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedEmployee.accounts.salary.name}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {selectedEmployee.accounts.salary.balance.toLocaleString()} د.ل
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">غير متوفر</p>
                  )}
                </div>

                {/* Advance Account */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <CreditCard className="h-5 w-5 text-orange-600 ml-2" />
                    <h4 className="font-medium">حساب السلف</h4>
                  </div>
                  {selectedEmployee.accounts.advance ? (
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedEmployee.accounts.advance.code}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedEmployee.accounts.advance.name}
                      </p>
                      <p className="text-lg font-bold text-orange-600">
                        {selectedEmployee.accounts.advance.balance.toLocaleString()} د.ل
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">غير متوفر</p>
                  )}
                </div>

                {/* Custody Account */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <Shield className="h-5 w-5 text-blue-600 ml-2" />
                    <h4 className="font-medium">حساب العهد</h4>
                  </div>
                  {selectedEmployee.accounts.custody ? (
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedEmployee.accounts.custody.code}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedEmployee.accounts.custody.name}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedEmployee.accounts.custody.balance.toLocaleString()} د.ل
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">غير متوفر</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center space-x-4 space-x-reverse">
              <button
                onClick={() => {
                  closeModal();
                  setTimeout(() => openModal('salary', selectedEmployee.employee), 100);
                }}
                className="btn-success flex items-center"
              >
                <DollarSign className="h-4 w-4 ml-2" />
                صرف راتب
              </button>
              <button
                onClick={() => {
                  closeModal();
                  setTimeout(() => openModal('advance', selectedEmployee.employee), 100);
                }}
                className="btn-warning flex items-center"
              >
                <CreditCard className="h-4 w-4 ml-2" />
                صرف سلفة
              </button>
            </div>
          </div>
        ) : modalType === 'salary' && selectedEmployee ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">صرف راتب للموظف: {selectedEmployee.employee.name}</h3>
              <p className="text-sm text-gray-600">
                الراتب الأساسي: {selectedEmployee.employee.salary.toLocaleString()} د.ل
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="المبلغ"
                type="number"
                value={salaryFormData.amount}
                onChange={(e) => setSalaryFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder={selectedEmployee.employee.salary.toString()}
                required
              />

              <FormField
                label="تاريخ الصرف"
                type="date"
                value={salaryFormData.paymentDate}
                onChange={(e) => setSalaryFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                required
              />

              <FormField
                label="الشهر"
                type="number"
                value={salaryFormData.month.toString()}
                onChange={(e) => setSalaryFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                min="1"
                max="12"
                required
              />

              <FormField
                label="السنة"
                type="number"
                value={salaryFormData.year.toString()}
                onChange={(e) => setSalaryFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                min="2020"
                max="2030"
                required
              />
            </div>

            <FormField
              label="الوصف"
              type="textarea"
              value={salaryFormData.description}
              onChange={(e) => setSalaryFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف إضافي للراتب..."
            />

            <div className="flex justify-end space-x-3 space-x-reverse">
              <button type="button" onClick={closeModal} className="btn-secondary">
                إلغاء
              </button>
              <button type="submit" className="btn-success">
                صرف الراتب
              </button>
            </div>
          </form>
        ) : modalType === 'advance' && selectedEmployee ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">صرف سلفة للموظف: {selectedEmployee.employee.name}</h3>
              <p className="text-sm text-gray-600">
                رصيد السلف الحالي: {selectedEmployee.accounts.advance?.balance.toLocaleString() || 0} د.ل
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="مبلغ السلفة"
                type="number"
                value={advanceFormData.amount}
                onChange={(e) => setAdvanceFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="أدخل مبلغ السلفة"
                required
              />

              <FormField
                label="تاريخ السلفة"
                type="date"
                value={advanceFormData.advanceDate}
                onChange={(e) => setAdvanceFormData(prev => ({ ...prev, advanceDate: e.target.value }))}
                required
              />
            </div>

            <FormField
              label="الوصف"
              type="textarea"
              value={advanceFormData.description}
              onChange={(e) => setAdvanceFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="سبب السلفة أو وصف إضافي..."
              required
            />

            <div className="flex justify-end space-x-3 space-x-reverse">
              <button type="button" onClick={closeModal} className="btn-secondary">
                إلغاء
              </button>
              <button type="submit" className="btn-warning">
                صرف السلفة
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="كود الموظف"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="مثال: EMP001"
                required
                disabled={modalType === 'edit'}
              />

              <FormField
                label="اسم الموظف"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="الاسم الكامل"
                required
              />

              <FormField
                label="الاسم بالإنجليزية"
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="Full Name in English"
              />

              <FormField
                label="المنصب"
                type="text"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="مثال: محاسب"
                required
              />

              <FormField
                label="القسم"
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="مثال: المحاسبة"
                required
              />

              <FormField
                label="الراتب الأساسي"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="0.00"
                required
              />

              <FormField
                label="تاريخ التوظيف"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                required
              />

              <FormField
                label="البريد الإلكتروني"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@company.com"
              />

              <FormField
                label="رقم الهاتف"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="0912345678"
              />

              <FormField
                label="رقم الحساب البنكي"
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                placeholder="رقم الحساب"
              />

              <FormField
                label="اسم البنك"
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="اسم البنك"
              />
            </div>

            <FormField
              label="العنوان"
              type="textarea"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="العنوان الكامل"
            />

            <FormField
              label="ملاحظات"
              type="textarea"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="ملاحظات إضافية..."
            />

            <div className="flex justify-end space-x-3 space-x-reverse">
              <button type="button" onClick={closeModal} className="btn-secondary">
                إلغاء
              </button>
              <button type="submit" className="btn-primary">
                {modalType === 'create' ? 'إضافة الموظف' : 'حفظ التغييرات'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeManagement;

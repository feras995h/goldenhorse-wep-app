import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  DollarSign, 
  CreditCard, 
  Shield,
  FileText,
  Filter
} from 'lucide-react';
import { Modal } from '../components/UI/Modal';
import { SearchFilter } from '../components/UI/SearchFilter';
import { FormField } from '../components/UI/FormField';
import api from '../services/api';

interface Employee {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  position: string;
  department: string;
  salary: number;
  isActive: boolean;
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

interface AccountEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  reference: string;
}

interface AccountStatement {
  employee: Employee;
  accountType: string;
  entries: AccountEntry[];
  finalBalance: number;
}

const EmployeeAccountStatementNew: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'statement'>('view');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAccounts | null>(null);
  const [accountStatement, setAccountStatement] = useState<AccountStatement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Statement filters
  const [statementFilters, setStatementFilters] = useState({
    accountType: 'salary',
    startDate: '',
    endDate: ''
  });

  // Load employees
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial/employees', {
        params: {
          search: searchTerm,
          department: departmentFilter
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

  // Load account statement
  const loadAccountStatement = async (employeeId: string, accountType: string, startDate?: string, endDate?: string) => {
    try {
      const response = await api.get(`/financial/employees/${employeeId}/statement`, {
        params: {
          accountType,
          startDate,
          endDate
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error loading account statement:', error);
      return null;
    }
  };

  // Open modal
  const openModal = async (type: typeof modalType, employee: Employee) => {
    setModalType(type);
    
    const employeeWithAccounts = await loadEmployeeWithAccounts(employee.id);
    setSelectedEmployee(employeeWithAccounts);
    
    if (type === 'statement') {
      const statement = await loadAccountStatement(
        employee.id, 
        statementFilters.accountType,
        statementFilters.startDate,
        statementFilters.endDate
      );
      setAccountStatement(statement);
    }
    
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setAccountStatement(null);
    setModalType('view');
  };

  // Handle statement filter change
  const handleStatementFilterChange = async () => {
    if (selectedEmployee) {
      const statement = await loadAccountStatement(
        selectedEmployee.employee.id,
        statementFilters.accountType,
        statementFilters.startDate,
        statementFilters.endDate
      );
      setAccountStatement(statement);
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
          {(isNaN(record.salary) || !isFinite(record.salary) ? 0 : record.salary).toLocaleString('ar-LY')} د.ل
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
            title="عرض الحسابات"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openModal('statement', record)}
            className="btn-icon btn-secondary"
            title="كشف الحساب"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Load data on component mount
  useEffect(() => {
    loadEmployees();
  }, [searchTerm, departmentFilter]);

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">كشف حساب الموظفين</h1>
            <p className="text-gray-600">عرض وإدارة حسابات الموظفين والأرصدة</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {(isNaN(totals.totalSalaries) || !isFinite(totals.totalSalaries) ? 0 : totals.totalSalaries).toLocaleString('ar-LY')} د.ل
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

      {/* Employee Accounts Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalType === 'view'
            ? `حسابات الموظف - ${selectedEmployee?.employee.name || ''}`
            : `كشف حساب الموظف - ${selectedEmployee?.employee.name || ''}`
        }
        size="6xl"
      >
        {modalType === 'view' && selectedEmployee ? (
          <div className="space-y-6">
            {/* Employee Basic Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">البيانات الأساسية</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    {(isNaN(selectedEmployee.employee.salary) || !isFinite(selectedEmployee.employee.salary) ? 0 : selectedEmployee.employee.salary).toLocaleString('ar-LY')} د.ل
                  </p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Salary Account */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-5 w-5 text-green-600 ml-2" />
                    <h4 className="font-medium">حساب المرتب</h4>
                  </div>
                  {selectedEmployee.accounts.salary ? (
                    <div>
                      <p className="text-sm text-gray-600 font-mono">
                        {selectedEmployee.accounts.salary.code}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedEmployee.accounts.salary.name}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {(isNaN(selectedEmployee.accounts.salary.balance) || !isFinite(selectedEmployee.accounts.salary.balance) ? 0 : selectedEmployee.accounts.salary.balance).toLocaleString('ar-LY')} د.ل
                      </p>
                      <button
                        onClick={() => {
                          setStatementFilters(prev => ({ ...prev, accountType: 'salary' }));
                          setModalType('statement');
                          handleStatementFilterChange();
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        عرض كشف الحساب
                      </button>
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
                      <p className="text-sm text-gray-600 font-mono">
                        {selectedEmployee.accounts.advance.code}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedEmployee.accounts.advance.name}
                      </p>
                      <p className="text-lg font-bold text-orange-600">
                        {(isNaN(selectedEmployee.accounts.advance.balance) || !isFinite(selectedEmployee.accounts.advance.balance) ? 0 : selectedEmployee.accounts.advance.balance).toLocaleString('ar-LY')} د.ل
                      </p>
                      <button
                        onClick={() => {
                          setStatementFilters(prev => ({ ...prev, accountType: 'advance' }));
                          setModalType('statement');
                          handleStatementFilterChange();
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        عرض كشف الحساب
                      </button>
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
                      <p className="text-sm text-gray-600 font-mono">
                        {selectedEmployee.accounts.custody.code}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedEmployee.accounts.custody.name}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {(isNaN(selectedEmployee.accounts.custody.balance) || !isFinite(selectedEmployee.accounts.custody.balance) ? 0 : selectedEmployee.accounts.custody.balance).toLocaleString('ar-LY')} د.ل
                      </p>
                      <button
                        onClick={() => {
                          setStatementFilters(prev => ({ ...prev, accountType: 'custody' }));
                          setModalType('statement');
                          handleStatementFilterChange();
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        عرض كشف الحساب
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">غير متوفر</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : modalType === 'statement' && selectedEmployee ? (
          <div className="space-y-6">
            {/* Statement Filters */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">فلاتر كشف الحساب</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  label="نوع الحساب"
                  type="select"
                  value={statementFilters.accountType}
                  onChange={(value) => setStatementFilters(prev => ({ ...prev, accountType: String(value) }))}
                  options={[
                    { value: 'salary', label: 'حساب المرتب' },
                    { value: 'advance', label: 'حساب السلف' },
                    { value: 'custody', label: 'حساب العهد' }
                  ]}
                />

                <FormField
                  label="من تاريخ"
                  type="date"
                  value={statementFilters.startDate}
                  onChange={(value) => setStatementFilters(prev => ({ ...prev, startDate: String(value) }))}
                />

                <FormField
                  label="إلى تاريخ"
                  type="date"
                  value={statementFilters.endDate}
                  onChange={(value) => setStatementFilters(prev => ({ ...prev, endDate: String(value) }))}
                />

                <div className="flex items-end">
                  <button
                    onClick={handleStatementFilterChange}
                    className="btn-primary w-full"
                  >
                    <Search className="h-4 w-4 ml-2" />
                    بحث
                  </button>
                </div>
              </div>
            </div>

            {/* Account Statement */}
            {accountStatement && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      كشف حساب {
                        statementFilters.accountType === 'salary' ? 'المرتب' :
                        statementFilters.accountType === 'advance' ? 'السلف' :
                        'العهد'
                      }
                    </h3>
                    <div className="flex space-x-2 space-x-reverse">
                      <button className="btn-icon btn-secondary">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="btn-icon btn-secondary">
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    الرصيد النهائي: {(isNaN(accountStatement.finalBalance) || !isFinite(accountStatement.finalBalance) ? 0 : accountStatement.finalBalance).toLocaleString('ar-LY')} د.ل
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المرجع</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مدين</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">دائن</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرصيد</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accountStatement.entries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            لا توجد حركات في هذه الفترة
                          </td>
                        </tr>
                      ) : (
                        accountStatement.entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(entry.date).toLocaleDateString('ar-LY')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {entry.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {entry.reference}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              {entry.debit > 0 ? (isNaN(entry.debit) || !isFinite(entry.debit) ? 0 : entry.debit).toLocaleString('ar-LY') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                              {entry.credit > 0 ? (isNaN(entry.credit) || !isFinite(entry.credit) ? 0 : entry.credit).toLocaleString('ar-LY') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {(isNaN(entry.runningBalance) || !isFinite(entry.runningBalance) ? 0 : entry.runningBalance).toLocaleString('ar-LY')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default EmployeeAccountStatementNew;

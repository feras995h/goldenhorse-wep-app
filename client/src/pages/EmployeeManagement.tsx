import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  DollarSign,
  FileText,
  AlertTriangle,
  Download,
  Printer,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  Filter,
  Search,
  CreditCard,
  Bell
} from 'lucide-react';


interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  nameEn: string;
  position: string;
  department: string;
  branch: string;
  hireDate: string;
  contractEndDate: string;
  salary: number;
  currency: string;
  bankAccount: string;
  phone: string;
  email: string;
  address: string;
  nationalId: string;
  isActive: boolean;
  accounts: {
    employeeAccount: string;
    custodyAccount: string;
    advanceAccount: string;
  };
  balance: {
    totalDebit: number;
    totalCredit: number;
    netBalance: number;
  };
}

interface EmployeeTransaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'salary' | 'advance' | 'payment' | 'deduction' | 'custody';
  reference: string;
}

interface PayrollSummary {
  totalEmployees: number;
  totalSalaries: number;
  totalAdvances: number;
  totalDeductions: number;
  pendingPayments: number;
  expiredContracts: number;
}

const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'account-statement'>('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employeeNumber: '',
    name: '',
    nameEn: '',
    position: '',
    department: '',
    branch: '',
    hireDate: new Date().toISOString().split('T')[0],
    contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salary: 0,
    currency: 'LYD',
    bankAccount: '',
    phone: '',
    email: '',
    address: '',
    nationalId: ''
  });

  // Account statement states
  const [selectedEmployeeForStatement, setSelectedEmployeeForStatement] = useState<Employee | null>(null);
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [searchTerm, departmentFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees with mock data for demonstration
      const mockEmployees: Employee[] = [
        {
          id: '1',
          employeeNumber: 'EMP001',
          name: 'محمد أحمد الطاهر',
          nameEn: 'Mohamed Ahmed Al-Taher',
          position: 'مدير مالي',
          department: 'المالية',
          branch: 'الفرع الرئيسي',
          hireDate: '2023-01-15',
          contractEndDate: '2024-12-31',
          salary: 2500,
          currency: 'LYD',
          bankAccount: '1234567890',
          phone: '+218-91-1111111',
          email: 'mohamed.taher@goldenhorse.ly',
          address: 'طرابلس، ليبيا',
          nationalId: '123456789012',
          isActive: true,
          accounts: {
            employeeAccount: '2101',
            custodyAccount: '1201',
            advanceAccount: '1301'
          },
          balance: {
            totalDebit: 7500,
            totalCredit: 6000,
            netBalance: 1500
          }
        },
        {
          id: '2',
          employeeNumber: 'EMP002',
          name: 'فاطمة علي السنوسي',
          nameEn: 'Fatima Ali Al-Senussi',
          position: 'محاسبة',
          department: 'المالية',
          branch: 'الفرع الرئيسي',
          hireDate: '2023-03-01',
          contractEndDate: '2024-08-31',
          salary: 1800,
          currency: 'LYD',
          bankAccount: '2345678901',
          phone: '+218-92-2222222',
          email: 'fatima.senussi@goldenhorse.ly',
          address: 'طرابلس، ليبيا',
          nationalId: '234567890123',
          isActive: true,
          accounts: {
            employeeAccount: '2102',
            custodyAccount: '1202',
            advanceAccount: '1302'
          },
          balance: {
            totalDebit: 5400,
            totalCredit: 5400,
            netBalance: 0
          }
        }
      ];

      setEmployees(mockEmployees);
      calculateSummary(mockEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (employeesData: Employee[]) => {
    const summary: PayrollSummary = {
      totalEmployees: employeesData.length,
      totalSalaries: employeesData.reduce((sum, emp) => sum + emp.salary, 0),
      totalAdvances: employeesData.reduce((sum, emp) => sum + emp.balance.totalDebit, 0),
      totalDeductions: employeesData.reduce((sum, emp) => sum + emp.balance.totalCredit, 0),
      pendingPayments: employeesData.filter(emp => emp.balance.netBalance > 0).length,
      expiredContracts: employeesData.filter(emp => new Date(emp.contractEndDate) < new Date()).length
    };
    setSummary(summary);
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
        contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        nameEn: employee.nameEn,
        position: employee.position,
        department: employee.department,
        branch: employee.branch,
        hireDate: employee.hireDate,
        contractEndDate: employee.contractEndDate,
        salary: employee.salary,
        currency: employee.currency,
        bankAccount: employee.bankAccount,
        phone: employee.phone,
        email: employee.email,
        address: employee.address,
        nationalId: employee.nationalId
      });
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === 'create') {
        // Create employee accounts automatically
        await createEmployeeAccounts(formData);
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const createEmployeeAccounts = async (employeeData: any) => {
    try {
      // Get next employee number
      const nextEmployeeNumber = (employees.length + 1).toString().padStart(4, '0');
      
      // Create employee account (credit nature)
      const employeeAccount = {
        code: `210${nextEmployeeNumber}`,
        name: `حساب ${employeeData.name}`,
        nameEn: `Account ${employeeData.nameEn}`,
        type: 'liability',
        parentId: '2100', // Employees accounts parent
        level: 2,
        nature: 'credit'
      };

      // Create custody account (debit nature)
      const custodyAccount = {
        code: `120${nextEmployeeNumber}`,
        name: `عهدة ${employeeData.name}`,
        nameEn: `Custody ${employeeData.nameEn}`,
        type: 'asset',
        parentId: '1200', // Custody accounts parent
        level: 2,
        nature: 'debit'
      };

      // Create advance account (debit nature)
      const advanceAccount = {
        code: `130${nextEmployeeNumber}`,
        name: `سلفة ${employeeData.name}`,
        nameEn: `Advance ${employeeData.nameEn}`,
        type: 'asset',
        parentId: '1300', // Advance accounts parent
        level: 2,
        nature: 'debit'
      };

      // Add accounts to the chart of accounts
      // This would typically be done through an API call
      console.log('Creating accounts:', { employeeAccount, custodyAccount, advanceAccount });
      
    } catch (error) {
      console.error('Error creating employee accounts:', error);
    }
  };

  const openAccountStatement = async (employee: Employee) => {
    setSelectedEmployeeForStatement(employee);
    
    // Load employee transactions
    const mockTransactions: EmployeeTransaction[] = [
      {
        id: '1',
        date: '2024-12-01',
        description: 'استحقاق راتب شهر ديسمبر 2024',
        debit: 0,
        credit: 2500,
        balance: -2500,
        type: 'salary',
        reference: 'SAL-2024-12'
      },
      {
        id: '2',
        date: '2024-12-15',
        description: 'سلفة عاجلة',
        debit: 500,
        credit: 0,
        balance: -2000,
        type: 'advance',
        reference: 'ADV-2024-12-001'
      },
      {
        id: '3',
        date: '2024-12-25',
        description: 'دفع راتب شهر ديسمبر 2024',
        debit: 2000,
        credit: 0,
        balance: 0,
        type: 'payment',
        reference: 'PAY-2024-12'
      },
      {
        id: '4',
        date: '2024-12-26',
        description: 'خصم تأمين صحي',
        debit: 0,
        credit: 150,
        balance: -150,
        type: 'deduction',
        reference: 'DED-2024-12-001'
      }
    ];

    setEmployeeTransactions(mockTransactions);
    setIsStatementModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD'
    }).format(amount);
  };

  const departments = ['المالية', 'المبيعات', 'خدمة العملاء', 'العمليات', 'الموارد البشرية'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-golden-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="card-gradient border-r-4 border-golden-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-outline btn-sm ml-4"
            >
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الموظفين</h1>
              <p className="text-gray-600">إدارة الموظفين وحساباتهم المحاسبية</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => openModal('create')}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة موظف
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-golden-500 text-golden-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 ml-2 inline" />
            نظرة عامة
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'employees'
                ? 'border-golden-500 text-golden-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4 ml-2 inline" />
            كشف الموظفين
          </button>
          <button
            onClick={() => setActiveTab('account-statement')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'account-statement'
                ? 'border-golden-500 text-golden-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="h-4 w-4 ml-2 inline" />
            كشف حساب الموظف
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600">إجمالي الموظفين</div>
                    <div className="text-lg font-bold text-blue-900">
                      {summary.totalEmployees}
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600">إجمالي الرواتب</div>
                    <div className="text-lg font-bold text-green-900">
                      {formatCurrency(summary.totalSalaries)}
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-yellow-600">إجمالي السلف</div>
                    <div className="text-lg font-bold text-yellow-900">
                      {formatCurrency(summary.totalAdvances)}
                    </div>
                  </div>
                  <CreditCard className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-red-600">المدفوعات المعلقة</div>
                    <div className="text-lg font-bold text-red-900">
                      {summary.pendingPayments}
                    </div>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">إجراءات سريعة</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('employees')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
              >
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="font-medium">كشف الموظفين</div>
                <div className="text-sm text-gray-500">عرض جميع الموظفين</div>
              </button>
              <button
                onClick={() => navigate('/financial/payroll')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
              >
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="font-medium">إدارة الرواتب</div>
                <div className="text-sm text-gray-500">الرواتب والمستحقات</div>
              </button>
              <button
                onClick={() => setActiveTab('account-statement')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="font-medium">كشف الحساب</div>
                <div className="text-sm text-gray-500">حركة حساب الموظف</div>
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'employees' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">فلاتر البحث</h2>
              <Filter className="h-5 w-5 text-gray-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث في الموظفين..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                >
                  <option value="all">جميع الأقسام</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                >
                  <option value="all">جميع الموظفين</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="expired">عقد منتهي</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDepartmentFilter('all');
                    setStatusFilter('all');
                  }}
                  className="btn btn-outline w-full"
                >
                  مسح الفلاتر
                </button>
              </div>
            </div>
          </div>

          {/* Employees Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">كشف الموظفين</h2>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button className="btn btn-outline btn-sm">
                  <Download className="h-4 w-4 ml-2" />
                  تصدير
                </button>
                <button className="btn btn-outline btn-sm">
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الموظف</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الراتب</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">المدين</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الدائن</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الرصيد</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الحسابات</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-gray-500">{employee.employeeNumber} - {employee.position}</div>
                        <div className="text-xs text-gray-400">{employee.department}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(employee.salary)}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {formatCurrency(employee.balance.totalDebit)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        {formatCurrency(employee.balance.totalCredit)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={employee.balance.netBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(Math.abs(employee.balance.netBalance))}
                        </span>
                        <div className="text-xs text-gray-500">
                          {employee.balance.netBalance > 0 ? 'مدين' : 'دائن'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="text-xs">
                          <div>حساب: {employee.accounts.employeeAccount}</div>
                          <div>عهدة: {employee.accounts.custodyAccount}</div>
                          <div>سلفة: {employee.accounts.advanceAccount}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          new Date(employee.contractEndDate) < new Date() 
                            ? 'text-red-600 bg-red-100' 
                            : 'text-green-600 bg-green-100'
                        }`}>
                          {new Date(employee.contractEndDate) < new Date() ? 'عقد منتهي' : 'نشط'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => openModal('view', employee)}
                            className="text-blue-600 hover:text-blue-800"
                            title="عرض"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openModal('edit', employee)}
                            className="text-green-600 hover:text-green-800"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openAccountStatement(employee)}
                            className="text-purple-600 hover:text-purple-800"
                            title="كشف حساب"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {employees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد موظفين
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'account-statement' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">كشف حساب الموظف</h2>
          <p className="text-gray-600 mb-4">اختر موظف لعرض حركة حسابه</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <div
                key={employee.id}
                onClick={() => openAccountStatement(employee)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="font-medium text-gray-900">{employee.name}</div>
                <div className="text-sm text-gray-500">{employee.employeeNumber}</div>
                <div className="text-sm text-gray-400">{employee.position}</div>
                <div className="mt-2 text-sm">
                  <span className={employee.balance.netBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                    الرصيد: {formatCurrency(Math.abs(employee.balance.netBalance))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {modalMode === 'create' ? 'إضافة موظف جديد' : 
                 modalMode === 'edit' ? 'تعديل بيانات الموظف' : 'عرض بيانات الموظف'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {modalMode === 'view' && selectedEmployee ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الموظف</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.employeeNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم بالإنجليزية</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.nameEn}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المنصب</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.position}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.department}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الفرع</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.branch}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التعيين</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {new Date(selectedEmployee.hireDate).toLocaleDateString('ar-LY')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ انتهاء العقد</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {new Date(selectedEmployee.contractEndDate).toLocaleDateString('ar-LY')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الراتب</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {formatCurrency(selectedEmployee.salary)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الحساب البنكي</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.bankAccount}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.phone}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الرقم الوطني</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.nationalId}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedEmployee.address}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحسابات المحاسبية</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-blue-600">حساب الموظف</div>
                      <div className="text-sm font-medium">{selectedEmployee.accounts.employeeAccount}</div>
                    </div>
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-xs text-green-600">حساب العهدة</div>
                      <div className="text-sm font-medium">{selectedEmployee.accounts.custodyAccount}</div>
                    </div>
                    <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-xs text-purple-600">حساب السلفة</div>
                      <div className="text-sm font-medium">{selectedEmployee.accounts.advanceAccount}</div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">الرصيد الحالي</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-xs text-red-600">إجمالي المدين</div>
                      <div className="text-sm font-medium">{formatCurrency(selectedEmployee.balance.totalDebit)}</div>
                    </div>
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-xs text-green-600">إجمالي الدائن</div>
                      <div className="text-sm font-medium">{formatCurrency(selectedEmployee.balance.totalCredit)}</div>
                    </div>
                    <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-xs text-purple-600">الرصيد الصافي</div>
                      <div className="text-sm font-medium">{formatCurrency(Math.abs(selectedEmployee.balance.netBalance))}</div>
                      <div className="text-xs text-gray-500">
                        {selectedEmployee.balance.netBalance > 0 ? 'مدين' : 'دائن'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الموظف</label>
                  <input
                    type="text"
                    value={formData.employeeNumber}
                    onChange={(e) => setFormData({...formData, employeeNumber: e.target.value})}
                    disabled={modalMode === 'view'}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                  />
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المنصب</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                >
                  <option value="">اختر القسم</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفرع</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التعيين</label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ انتهاء العقد</label>
                <input
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => setFormData({...formData, contractEndDate: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الراتب الأساسي</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value) || 0})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الحساب البنكي</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهوية الوطنية</label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>
            </div>
            )}

            {modalMode === 'create' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-blue-500 ml-2" />
                  <div className="text-sm text-blue-700">
                    <strong>ملاحظة:</strong> عند إضافة الموظف سيتم إنشاء الحسابات المحاسبية التالية تلقائياً:
                    <ul className="mt-2 mr-4 list-disc">
                      <li>حساب الموظف (طبيعة دائنة)</li>
                      <li>حساب عهدة الموظف (طبيعة مدينة)</li>
                      <li>حساب سلفة الموظف (طبيعة مدينة)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {modalMode !== 'view' && (
              <div className="flex items-center justify-end space-x-2 space-x-reverse mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn btn-primary"
                >
                  {modalMode === 'create' ? 'إضافة' : 'حفظ التغييرات'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Statement Modal */}
      {isStatementModalOpen && selectedEmployeeForStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  كشف حساب الموظف: {selectedEmployeeForStatement.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedEmployeeForStatement.employeeNumber} - {selectedEmployeeForStatement.position}
                </p>
              </div>
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600">إجمالي المدين</div>
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(selectedEmployeeForStatement.balance.totalDebit)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-600">إجمالي الدائن</div>
                <div className="text-lg font-bold text-green-900">
                  {formatCurrency(selectedEmployeeForStatement.balance.totalCredit)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-600">الرصيد الحالي</div>
                <div className="text-lg font-bold text-purple-900">
                  {formatCurrency(Math.abs(selectedEmployeeForStatement.balance.netBalance))}
                </div>
                <div className="text-xs text-purple-600">
                  {selectedEmployeeForStatement.balance.netBalance > 0 ? 'مدين' : 'دائن'}
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-right font-medium text-gray-700">التاريخ</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">البيان</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">المرجع</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">مدين</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">دائن</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString('ar-LY')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {transaction.reference}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={transaction.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(Math.abs(transaction.balance))}
                        </span>
                        <div className="text-xs text-gray-500">
                          {transaction.balance > 0 ? 'مدين' : 'دائن'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse mt-6">
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="btn btn-outline"
              >
                إغلاق
              </button>
              <button className="btn btn-primary">
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

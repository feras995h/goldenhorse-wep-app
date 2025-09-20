import React, { useState, useEffect } from 'react';
import { 
  User, 
  DollarSign, 
  Calendar, 
  FileText, 
  Search, 
  Download,
  Eye,
  Plus,
  Edit,
  Trash2,
  Filter,
  RefreshCw
} from 'lucide-react';
import { DataTable } from '../components/UI/DataTable';
import { SearchFilter } from '../components/UI/SearchFilter';
import { Modal } from '../components/UI/Modal';
import { FormField } from '../components/UI/FormField';
import { financialAPI } from '../services/api';

interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  nameEn: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Salary {
  id: string;
  employeeId: string;
  month: string;
  year: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
}

interface Advance {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  type: 'salary_advance' | 'loan' | 'other';
  description: string;
  requestDate: string;
  approvalDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  createdAt: string;
}

interface Bond {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  type: 'performance' | 'financial' | 'equipment' | 'other';
  description: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'returned' | 'forfeited';
  returnedAt?: string;
  createdAt: string;
}

const EmployeeAccountStatement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Load employees
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getEmployees();
      setEmployees(response.data || []);
      setPagination(prev => ({ ...prev, total: response.data?.length || 0 }));
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load employee details
  const loadEmployeeDetails = async (employeeId: string) => {
    try {
      const [salariesRes, advancesRes, bondsRes] = await Promise.all([
        financialAPI.getEmployeeSalaries(employeeId),
        financialAPI.getEmployeeAdvances(employeeId),
        financialAPI.getEmployeeBonds(employeeId)
      ]);
      
      setSalaries(salariesRes.data || []);
      setAdvances(advancesRes.data || []);
      setBonds(bondsRes.data || []);
    } catch (error) {
      console.error('Error loading employee details:', error);
    }
  };

  // Open modal
  const openModal = (mode: 'view' | 'create' | 'edit', employee?: Employee) => {
    setModalMode(mode);
    if (employee) {
      setSelectedEmployee(employee);
      loadEmployeeDetails(employee.id);
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setSalaries([]);
    setAdvances([]);
    setBonds([]);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle department filter
  const handleDepartmentFilter = (value: string) => {
    setDepartmentFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setSearchValue('');
    setStatusFilter('');
    setDepartmentFilter('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         employee.employeeNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? employee.isActive : !employee.isActive);
    const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Get unique departments
  const departments = [...new Set(employees.map(emp => emp.department))];

  // Calculate totals
  const calculateTotals = () => {
    if (!selectedEmployee) return { salary: 0, advances: 0, bonds: 0, net: 0 };
    
    const totalSalary = salaries.reduce((sum, salary) => sum + salary.netSalary, 0);
    const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0);
    const totalBonds = bonds.reduce((sum, bond) => sum + bond.amount, 0);
    
    return {
      salary: totalSalary,
      advances: totalAdvances,
      bonds: totalBonds,
      net: totalSalary - totalAdvances - totalBonds
    };
  };

  // Table columns
  const columns = [
    {
      key: 'employeeNumber',
      title: 'رقم الموظف',
      render: (record: Employee) => record.employeeNumber
    },
    {
      key: 'name',
      title: 'اسم الموظف',
      render: (record: Employee) => (
        <div>
          <div className="font-medium text-gray-900">{record.name}</div>
          <div className="text-sm text-gray-500">{record.nameEn}</div>
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
      title: 'الراتب الأساسي',
      render: (record: Employee) => (
        <div className="text-right">
          <span className="font-medium">{(isNaN(record.salary) || !isFinite(record.salary) ? 0 : record.salary).toLocaleString('ar-LY')}</span>
          <span className="text-sm text-gray-500 mr-1">{record.currency}</span>
        </div>
      )
    },
    {
      key: 'hireDate',
      title: 'تاريخ التعيين',
      render: (record: Employee) => new Date(record.hireDate).toLocaleDateString('ar-SA')
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
            title="عرض كشف الحساب"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Load data on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <User className="h-8 w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">كشف حساب الموظفين</h1>
            <p className="text-gray-600">عرض بيانات الموظفين ورواتبهم وسلفهم وعهودهم</p>
          </div>
        </div>
        <button
          onClick={() => loadEmployees()}
          className="btn-secondary flex items-center"
        >
          <RefreshCw className="h-5 w-5 ml-2" />
          تحديث
        </button>
      </div>

      {/* Search and Filters */}
      <SearchFilter
        searchValue={searchValue}
        onSearchChange={handleSearch}
        filters={[
          {
            key: 'status',
            label: 'الحالة',
            value: statusFilter,
            options: [
              { value: '', label: 'الكل' },
              { value: 'active', label: 'نشط' },
              { value: 'inactive', label: 'غير نشط' }
            ],
            onChange: handleStatusFilter
          },
          {
            key: 'department',
            label: 'القسم',
            value: departmentFilter,
            options: [
              { value: '', label: 'الكل' },
              ...departments.map(dept => ({ value: dept, label: dept }))
            ],
            onChange: handleDepartmentFilter
          }
        ]}
        onClearFilters={clearFilters}
        placeholder="البحث في الموظفين..."
      />

      {/* Employees Table */}
      <DataTable
        columns={columns}
        data={filteredEmployees}
        loading={loading}
        pagination={{
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
        }}
        emptyText="لا يوجد موظفين"
      />

      {/* Employee Account Statement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`كشف حساب الموظف - ${selectedEmployee?.name || ''}`}
        size="6xl"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Employee Basic Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">البيانات الأساسية</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">رقم الموظف</label>
                  <p className="text-gray-900">{selectedEmployee.employeeNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">الاسم</label>
                  <p className="text-gray-900">{selectedEmployee.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">المنصب</label>
                  <p className="text-gray-900">{selectedEmployee.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">القسم</label>
                  <p className="text-gray-900">{selectedEmployee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">الراتب الأساسي</label>
                  <p className="text-gray-900">{(isNaN(selectedEmployee.salary) || !isFinite(selectedEmployee.salary) ? 0 : selectedEmployee.salary).toLocaleString('ar-LY')} {selectedEmployee.currency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">تاريخ التعيين</label>
                  <p className="text-gray-900">{new Date(selectedEmployee.hireDate).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                  <p className="text-gray-900">{selectedEmployee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">الهاتف</label>
                  <p className="text-gray-900">{selectedEmployee.phone}</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">الملخص المالي</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{(isNaN(totals.salary) || !isFinite(totals.salary) ? 0 : totals.salary).toLocaleString('ar-LY')}</div>
                  <div className="text-sm text-gray-600">إجمالي الرواتب</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{(isNaN(totals.advances) || !isFinite(totals.advances) ? 0 : totals.advances).toLocaleString('ar-LY')}</div>
                  <div className="text-sm text-gray-600">إجمالي السلف</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{(isNaN(totals.bonds) || !isFinite(totals.bonds) ? 0 : totals.bonds).toLocaleString('ar-LY')}</div>
                  <div className="text-sm text-gray-600">إجمالي العهود</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(isNaN(totals.net) || !isFinite(totals.net) ? 0 : totals.net).toLocaleString('ar-LY')}
                  </div>
                  <div className="text-sm text-gray-600">الصافي</div>
                </div>
              </div>
            </div>

            {/* Salaries */}
            <div>
              <h3 className="text-lg font-semibold mb-4">الرواتب</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الشهر/السنة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الراتب الأساسي</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البدلات</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الخصومات</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">صافي الراتب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salaries.map((salary) => (
                      <tr key={salary.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salary.month}/{salary.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(isNaN(salary.basicSalary) || !isFinite(salary.basicSalary) ? 0 : salary.basicSalary).toLocaleString('ar-LY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(isNaN(salary.allowances) || !isFinite(salary.allowances) ? 0 : salary.allowances).toLocaleString('ar-LY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(isNaN(salary.deductions) || !isFinite(salary.deductions) ? 0 : salary.deductions).toLocaleString('ar-LY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(isNaN(salary.netSalary) || !isFinite(salary.netSalary) ? 0 : salary.netSalary).toLocaleString('ar-LY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            salary.status === 'paid' ? 'bg-green-100 text-green-800' :
                            salary.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {salary.status === 'paid' ? 'مدفوع' :
                             salary.status === 'pending' ? 'معلق' : 'ملغي'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Advances */}
            <div>
              <h3 className="text-lg font-semibold mb-4">السلف</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البيان</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {advances.map((advance) => (
                      <tr key={advance.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(advance.requestDate).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {advance.type === 'salary_advance' ? 'سلفة راتب' :
                           advance.type === 'loan' ? 'قرض' : 'أخرى'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(isNaN(advance.amount) || !isFinite(advance.amount) ? 0 : advance.amount).toLocaleString('ar-LY')} {advance.currency}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {advance.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            advance.status === 'paid' ? 'bg-green-100 text-green-800' :
                            advance.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            advance.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {advance.status === 'paid' ? 'مدفوع' :
                             advance.status === 'approved' ? 'معتمد' :
                             advance.status === 'pending' ? 'معلق' : 'مرفوض'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bonds */}
            <div>
              <h3 className="text-lg font-semibold mb-4">العهود</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البيان</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bonds.map((bond) => (
                      <tr key={bond.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(bond.startDate).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bond.type === 'performance' ? 'عهدة أداء' :
                           bond.type === 'financial' ? 'عهدة مالية' :
                           bond.type === 'equipment' ? 'عهدة معدات' : 'أخرى'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(isNaN(bond.amount) || !isFinite(bond.amount) ? 0 : bond.amount).toLocaleString('ar-LY')} {bond.currency}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {bond.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bond.status === 'returned' ? 'bg-green-100 text-green-800' :
                            bond.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {bond.status === 'returned' ? 'مسترد' :
                             bond.status === 'active' ? 'نشط' : 'مصادرة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeAccountStatement;

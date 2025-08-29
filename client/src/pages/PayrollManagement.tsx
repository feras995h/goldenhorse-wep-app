import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Download,
  Printer,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  Filter,
  TrendingUp,
  TrendingDown,
  UserCheck,
  CreditCard,
  Receipt
} from 'lucide-react';
import { financialAPI } from '../services/api';
import EmployeeAdvances from './EmployeeAdvances';

interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  nameEn: string;
  position: string;
  department: string;
  branch: string;
  hireDate: string;
  salary: number;
  currency: string;
  bankAccount: string;
  phone: string;
  email: string;
  address: string;
  nationalId: string;
  isActive: boolean;
}

interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  month: string;
  year: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonuses: number;
  netSalary: number;
  status: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
  paymentMethod: 'bank' | 'cash';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface PayrollSummary {
  totalEmployees: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalOvertime: number;
  totalBonuses: number;
  totalNetSalary: number;
  pendingPayments: number;
  paidPayments: number;
}

const PayrollManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'payroll' | 'advances' | 'reports'>('payroll');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
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

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear, statusFilter, departmentFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees
      const employeesData = await financialAPI.getEmployees({});
      setEmployees(employeesData.data || employeesData);

      // Load payroll entries
      const payrollData = await financialAPI.getPayrollEntries({
        month: selectedMonth,
        year: selectedYear,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined
      });
      setPayrollEntries(payrollData.data || payrollData);

      // Calculate summary
      calculateSummary(payrollData.data || payrollData);
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (entries: PayrollEntry[]) => {
    const summary: PayrollSummary = {
      totalEmployees: entries.length,
      totalBasicSalary: entries.reduce((sum, entry) => sum + entry.basicSalary, 0),
      totalAllowances: entries.reduce((sum, entry) => sum + entry.allowances, 0),
      totalDeductions: entries.reduce((sum, entry) => sum + entry.deductions, 0),
      totalOvertime: entries.reduce((sum, entry) => sum + entry.overtime, 0),
      totalBonuses: entries.reduce((sum, entry) => sum + entry.bonuses, 0),
      totalNetSalary: entries.reduce((sum, entry) => sum + entry.netSalary, 0),
      pendingPayments: entries.filter(entry => entry.status === 'pending').length,
      paidPayments: entries.filter(entry => entry.status === 'paid').length
    };
    setSummary(summary);
  };

  const openModal = (mode: 'create' | 'edit' | 'view', entry?: PayrollEntry) => {
    setModalMode(mode);
    setSelectedEntry(entry || null);
    
    if (mode === 'create') {
      setFormData({
        employeeId: '',
        month: selectedMonth,
        year: selectedYear,
        basicSalary: 0,
        allowances: 0,
        deductions: 0,
        overtime: 0,
        bonuses: 0,
        paymentMethod: 'bank',
        remarks: ''
      });
    } else if (entry) {
      setFormData({
        employeeId: entry.employeeId,
        month: parseInt(entry.month),
        year: parseInt(entry.year),
        basicSalary: entry.basicSalary,
        allowances: entry.allowances,
        deductions: entry.deductions,
        overtime: entry.overtime,
        bonuses: entry.bonuses,
        paymentMethod: entry.paymentMethod,
        remarks: entry.remarks || ''
      });
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const netSalary = formData.basicSalary + formData.allowances + formData.overtime + formData.bonuses - formData.deductions;
      
      if (modalMode === 'create') {
        await financialAPI.createPayrollEntry({
          ...formData,
          netSalary
        });
      } else if (selectedEntry) {
        await financialAPI.updatePayrollEntry(selectedEntry.id, {
          ...formData,
          netSalary
        });
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving payroll entry:', error);
    }
  };

  const handleApprove = async (entryId: string) => {
    try {
      await financialAPI.approvePayrollEntry(entryId);
      loadData();
    } catch (error) {
      console.error('Error approving payroll entry:', error);
    }
  };

  const handlePay = async (entryId: string) => {
    try {
      await financialAPI.payPayrollEntry(entryId);
      loadData();
    } catch (error) {
      console.error('Error paying payroll entry:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-blue-600 bg-blue-100';
      case 'paid': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'approved': return 'معتمد';
      case 'paid': return 'مدفوع';
      default: return 'غير محدد';
    }
  };

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الرواتب</h1>
              <p className="text-gray-600">إدارة رواتب الموظفين والمدفوعات</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => openModal('create')}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة راتب
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'payroll'
                ? 'border-golden-500 text-golden-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="h-4 w-4 ml-2 inline" />
            الرواتب
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'advances'
                ? 'border-golden-500 text-golden-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard className="h-4 w-4 ml-2 inline" />
            السلف
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-golden-500 text-golden-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4 ml-2 inline" />
            التقارير
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'payroll' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">الفلاتر</h2>
              <Filter className="h-5 w-5 text-gray-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الشهر</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                >
                  {months.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السنة</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
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
                  <option value="all">جميع الحالات</option>
                  <option value="pending">في الانتظار</option>
                  <option value="approved">معتمد</option>
                  <option value="paid">مدفوع</option>
                </select>
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
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600">إجمالي الرواتب</div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatCurrency(summary.totalNetSalary)}
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600">عدد الموظفين</div>
                    <div className="text-lg font-bold text-green-900">
                      {summary.totalEmployees}
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-yellow-600">في الانتظار</div>
                    <div className="text-lg font-bold text-yellow-900">
                      {summary.pendingPayments}
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600">مدفوع</div>
                    <div className="text-lg font-bold text-purple-900">
                      {summary.paidPayments}
                    </div>
                  </div>
                  <TrendingDown className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          )}

          {/* Payroll Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">رواتب {months[selectedMonth - 1]} {selectedYear}</h2>
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
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الراتب الأساسي</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">البدلات</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الخصومات</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">العمل الإضافي</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">المكافآت</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">صافي الراتب</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{entry.employeeName}</div>
                        <div className="text-xs text-gray-500">{entry.employeeNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(entry.basicSalary)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        {formatCurrency(entry.allowances)}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {formatCurrency(entry.deductions)}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600">
                        {formatCurrency(entry.overtime)}
                      </td>
                      <td className="px-4 py-3 text-sm text-purple-600">
                        {formatCurrency(entry.bonuses)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {formatCurrency(entry.netSalary)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {getStatusText(entry.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => openModal('view', entry)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openModal('edit', entry)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {entry.status === 'pending' && (
                            <button
                              onClick={() => handleApprove(entry.id)}
                              className="text-yellow-600 hover:text-yellow-800"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          {entry.status === 'approved' && (
                            <button
                              onClick={() => handlePay(entry.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Receipt className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {payrollEntries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد رواتب لهذا الشهر
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'advances' && (
        <EmployeeAdvances />
      )}

      {activeTab === 'reports' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">تقارير الرواتب</h2>
          <p className="text-gray-600">سيتم إضافة التقارير قريباً</p>
        </div>
      )}



      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {modalMode === 'create' ? 'إضافة راتب جديد' : 
                 modalMode === 'edit' ? 'تعديل الراتب' : 'عرض تفاصيل الراتب'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الموظف</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                >
                  <option value="">اختر الموظف</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.employeeNumber}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الراتب الأساسي</label>
                <input
                  type="number"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({...formData, basicSalary: parseFloat(e.target.value) || 0})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البدلات</label>
                <input
                  type="number"
                  value={formData.allowances}
                  onChange={(e) => setFormData({...formData, allowances: parseFloat(e.target.value) || 0})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الخصومات</label>
                <input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) => setFormData({...formData, deductions: parseFloat(e.target.value) || 0})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العمل الإضافي</label>
                <input
                  type="number"
                  value={formData.overtime}
                  onChange={(e) => setFormData({...formData, overtime: parseFloat(e.target.value) || 0})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المكافآت</label>
                <input
                  type="number"
                  value={formData.bonuses}
                  onChange={(e) => setFormData({...formData, bonuses: parseFloat(e.target.value) || 0})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as 'bank' | 'cash'})}
                  disabled={modalMode === 'view'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                >
                  <option value="bank">تحويل بنكي</option>
                  <option value="cash">نقدي</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  disabled={modalMode === 'view'}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                />
              </div>
            </div>

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
    </div>
  );
};

export default PayrollManagement;

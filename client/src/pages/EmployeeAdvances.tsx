import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Download,
  Printer,
  RefreshCw,
  Plus,
  Eye,
  Filter,
  TrendingUp,
  TrendingDown,
  UserCheck,
  DollarSign,
  Receipt
} from 'lucide-react';
import { financialAPI } from '../services/api';

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

interface EmployeeAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  amount: number;
  requestDate: string;
  approvalDate?: string;
  paymentDate?: string;
  status: 'pending' | 'approved' | 'paid';
  reason: string;
  approvedBy?: string;
  paymentMethod: 'bank' | 'cash';
  installments: number;
  monthlyDeduction: number;
  remainingAmount: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdvancesSummary {
  totalAdvances: number;
  totalAmount: number;
  pendingAdvances: number;
  approvedAdvances: number;
  paidAdvances: number;
  totalRemaining: number;
}

const EmployeeAdvances: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);
  const [summary, setSummary] = useState<AdvancesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedAdvance, setSelectedAdvance] = useState<EmployeeAdvance | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: 0,
    reason: '',
    paymentMethod: 'cash' as 'bank' | 'cash',
    installments: 1,
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, employeeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees
      const employeesData = await financialAPI.getEmployees({});
      setEmployees(employeesData.data || employeesData);

      // Load advances
      const advancesData = await financialAPI.getEmployeeAdvances({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        employeeId: employeeFilter !== 'all' ? employeeFilter : undefined
      });
      setAdvances(advancesData.data || advancesData);

      // Calculate summary
      calculateSummary(advancesData.data || advancesData);
    } catch (error) {
      console.error('Error loading advances data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (advancesData: EmployeeAdvance[]) => {
    const summary: AdvancesSummary = {
      totalAdvances: advancesData.length,
      totalAmount: advancesData.reduce((sum, advance) => sum + advance.amount, 0),
      pendingAdvances: advancesData.filter(advance => advance.status === 'pending').length,
      approvedAdvances: advancesData.filter(advance => advance.status === 'approved').length,
      paidAdvances: advancesData.filter(advance => advance.status === 'paid').length,
      totalRemaining: advancesData.reduce((sum, advance) => sum + advance.remainingAmount, 0)
    };
    setSummary(summary);
  };

  const openModal = (mode: 'create' | 'edit' | 'view', advance?: EmployeeAdvance) => {
    setModalMode(mode);
    setSelectedAdvance(advance || null);
    
    if (mode === 'create') {
      setFormData({
        employeeId: '',
        amount: 0,
        reason: '',
        paymentMethod: 'cash',
        installments: 1,
        remarks: ''
      });
    } else if (advance) {
      setFormData({
        employeeId: advance.employeeId,
        amount: advance.amount,
        reason: advance.reason,
        paymentMethod: advance.paymentMethod,
        installments: advance.installments,
        remarks: advance.remarks || ''
      });
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === 'create') {
        await financialAPI.createAdvanceRequest(formData);
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving advance:', error);
    }
  };

  const handleApprove = async (advanceId: string) => {
    try {
      await financialAPI.approveAdvanceRequest(advanceId);
      loadData();
    } catch (error) {
      console.error('Error approving advance:', error);
    }
  };

  const handlePay = async (advanceId: string) => {
    try {
      await financialAPI.payAdvanceRequest(advanceId);
      loadData();
    } catch (error) {
      console.error('Error paying advance:', error);
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة السلف</h1>
              <p className="text-gray-600">إدارة سلف الموظفين والمدفوعات</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => openModal('create')}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 ml-2" />
              طلب سلفة
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">الفلاتر</h2>
          <Filter className="h-5 w-5 text-gray-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">الموظف</label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
            >
              <option value="all">جميع الموظفين</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} - {emp.employeeNumber}</option>
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
                <div className="text-sm text-blue-600">إجمالي السلف</div>
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(summary.totalAmount)}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-600">عدد الطلبات</div>
                <div className="text-lg font-bold text-green-900">
                  {summary.totalAdvances}
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
                  {summary.pendingAdvances}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-600">المتبقي</div>
                <div className="text-lg font-bold text-purple-900">
                  {formatCurrency(summary.totalRemaining)}
                </div>
              </div>
              <TrendingDown className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Advances Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">طلبات السلف</h2>
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
                <th className="px-4 py-3 text-right font-medium text-gray-700">المبلغ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">السبب</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">تاريخ الطلب</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الأقساط</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">المتبقي</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((advance) => (
                <tr key={advance.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{advance.employeeName}</div>
                    <div className="text-xs text-gray-500">{advance.employeeNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    {formatCurrency(advance.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {advance.reason}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(advance.requestDate).toLocaleDateString('ar-LY')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {advance.installments} × {formatCurrency(advance.monthlyDeduction)}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 font-medium">
                    {formatCurrency(advance.remainingAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(advance.status)}`}>
                      {getStatusText(advance.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => openModal('view', advance)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {advance.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(advance.id)}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      {advance.status === 'approved' && (
                        <button
                          onClick={() => handlePay(advance.id)}
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

        {advances.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد طلبات سلف
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {modalMode === 'create' ? 'طلب سلفة جديدة' : 
                 modalMode === 'edit' ? 'تعديل السلفة' : 'عرض تفاصيل السلفة'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {modalMode === 'view' && selectedAdvance ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الموظف</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedAdvance.employeeName} - {selectedAdvance.employeeNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {formatCurrency(selectedAdvance.amount)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السبب</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedAdvance.reason}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAdvance.status)}`}>
                      {getStatusText(selectedAdvance.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الطلب</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {new Date(selectedAdvance.requestDate).toLocaleDateString('ar-LY')}
                  </div>
                </div>

                {selectedAdvance.approvalDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الاعتماد</label>
                    <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {new Date(selectedAdvance.approvalDate).toLocaleDateString('ar-LY')}
                    </div>
                  </div>
                )}

                {selectedAdvance.paymentDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الدفع</label>
                    <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {new Date(selectedAdvance.paymentDate).toLocaleDateString('ar-LY')}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأقساط</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedAdvance.installments}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">القسط الشهري</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {formatCurrency(selectedAdvance.monthlyDeduction)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ المتبقي</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {formatCurrency(selectedAdvance.remainingAmount)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedAdvance.paymentMethod === 'cash' ? 'نقدي' : 'تحويل بنكي'}
                  </div>
                </div>

                {selectedAdvance.remarks && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                    <div className="p-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {selectedAdvance.remarks}
                    </div>
                  </div>
                )}
              </div>
                          ) : (
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    disabled={modalMode === 'view'}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السبب</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    disabled={modalMode === 'view'}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأقساط</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.installments}
                    onChange={(e) => setFormData({...formData, installments: parseInt(e.target.value) || 1})}
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
                    <option value="cash">نقدي</option>
                    <option value="bank">تحويل بنكي</option>
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
                  {modalMode === 'create' ? 'إرسال الطلب' : 'حفظ التغييرات'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAdvances;

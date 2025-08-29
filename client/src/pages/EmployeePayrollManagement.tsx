import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  DollarSign,
  CreditCard,
  FileText,
  AlertTriangle,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import TailAdminDashboardCard from '../components/TailAdmin/Cards/TailAdminDashboardCard';
import EmployeeManagement from './EmployeeManagement';
import PayrollManagement from './PayrollManagement';
import EmployeeAdvances from './EmployeeAdvances';

interface Summary {
  totalEmployees: number;
  totalSalaries: number;
  totalAdvances: number;
  pendingPayments: number;
}

const EmployeePayrollManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'payroll' | 'advances' | 'reports'>('overview');
  const [summary] = useState<Summary>({
    totalEmployees: 15,
    totalSalaries: 32500,
    totalAdvances: 4200,
    pendingPayments: 3
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-golden-500 to-golden-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/20 rounded-lg ml-4 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="p-3 bg-white/20 rounded-xl ml-4">
              <UserCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">إدارة الموظفين والرواتب</h1>
              <p className="text-white/90 text-lg">نظام شامل لإدارة الموظفين والرواتب والسلف والمستحقات</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-white/80 text-sm">تاريخ اليوم</p>
            <p className="text-white font-semibold text-lg">
              {new Date().toLocaleDateString('ar-LY')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-golden-500 text-golden-600 bg-golden-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="h-4 w-4 ml-2 inline" />
            نظرة عامة
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'employees'
                ? 'border-golden-500 text-golden-600 bg-golden-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4 ml-2 inline" />
            إدارة الموظفين
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'payroll'
                ? 'border-golden-500 text-golden-600 bg-golden-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="h-4 w-4 ml-2 inline" />
            إدارة الرواتب
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'advances'
                ? 'border-golden-500 text-golden-600 bg-golden-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="h-4 w-4 ml-2 inline" />
            السلف والمقدمات
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-golden-500 text-golden-600 bg-golden-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4 ml-2 inline" />
            التقارير
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TailAdminDashboardCard
              title="إجمالي الموظفين"
              value={summary.totalEmployees.toString()}
              icon={Users}
              color="primary"
              trend={{
                direction: 'up',
                percentage: 5.2,
                period: 'من الشهر الماضي'
              }}
              interactive
              onClick={() => setActiveTab('employees')}
            />
            <TailAdminDashboardCard
              title="إجمالي الرواتب"
              value={summary.totalSalaries}
              icon={DollarSign}
              color="success"
              currency="LYD"
              trend={{
                direction: 'up',
                percentage: 3.1,
                period: 'من الشهر الماضي'
              }}
              interactive
              onClick={() => setActiveTab('payroll')}
            />
            <TailAdminDashboardCard
              title="إجمالي السلف"
              value={summary.totalAdvances}
              icon={CreditCard}
              color="warning"
              currency="LYD"
              trend={{
                direction: 'down',
                percentage: 2.3,
                period: 'من الشهر الماضي'
              }}
              interactive
              onClick={() => setActiveTab('advances')}
            />
            <TailAdminDashboardCard
              title="المدفوعات المعلقة"
              value={summary.pendingPayments.toString()}
              icon={AlertTriangle}
              color="danger"
              trend={{
                direction: 'down',
                percentage: 1.5,
                period: 'من الأسبوع الماضي'
              }}
              interactive
              onClick={() => setActiveTab('payroll')}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">إجراءات سريعة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('employees')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
              >
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="font-medium">إدارة الموظفين</div>
                <div className="text-sm text-gray-500">إضافة وتعديل بيانات الموظفين</div>
              </button>
              <button
                onClick={() => setActiveTab('payroll')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
              >
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="font-medium">إدارة الرواتب</div>
                <div className="text-sm text-gray-500">حساب ودفع الرواتب</div>
              </button>
              <button
                onClick={() => setActiveTab('advances')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
              >
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="font-medium">السلف والمقدمات</div>
                <div className="text-sm text-gray-500">إدارة سلف الموظفين</div>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="font-medium">التقارير</div>
                <div className="text-sm text-gray-500">تقارير الموظفين والرواتب</div>
              </button>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">الأنشطة الأخيرة</h2>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg ml-3">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">تم إضافة موظف جديد</div>
                  <div className="text-sm text-gray-500">محمد أحمد الطاهر - قسم المالية</div>
                </div>
                <div className="text-sm text-gray-400">منذ ساعتين</div>
              </div>
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg ml-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">تم دفع راتب</div>
                  <div className="text-sm text-gray-500">فاطمة علي السنوسي - 1,800 د.ل</div>
                </div>
                <div className="text-sm text-gray-400">منذ 3 ساعات</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'employees' && <EmployeeManagement />}
      {activeTab === 'payroll' && <PayrollManagement />}
      {activeTab === 'advances' && <EmployeeAdvances />}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">تقارير الموظفين والرواتب</h2>
          <p className="text-gray-600">سيتم إضافة التقارير قريباً</p>
        </div>
      )}
    </div>
  );
};

export default EmployeePayrollManagement;

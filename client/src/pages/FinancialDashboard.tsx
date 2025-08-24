import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  Users,
  CreditCard,
  TrendingUp,
  Building,
  Calculator,
  Receipt,
  UserCheck,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { financialAPI } from '../services/api';
import FinancialCard from '../components/Financial/FinancialCard';
import { FinancialSummary } from '../types/financial';

const FinancialDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialSummary();
  }, []);

  const loadFinancialSummary = async () => {
    try {
      setLoading(true);
      const data = await financialAPI.getFinancialSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'إدارة الحسابات',
      description: 'دليل الحسابات والأرصدة',
      icon: Calculator,
      color: 'blue' as const,
      href: '/financial/accounts'
    },
    {
      title: 'قيود اليومية',
      description: 'إنشاء وإدارة القيود المحاسبية',
      icon: FileText,
      color: 'green' as const,
      href: '/financial/journal'
    },
    {
      title: 'الفواتير',
      description: 'إدارة فواتير العملاء والموردين',
      icon: Receipt,
      color: 'purple' as const,
      href: '/financial/invoices'
    },
    {
      title: 'العملاء',
      description: 'إدارة بيانات العملاء والأرصدة',
      icon: Users,
      color: 'indigo' as const,
      href: '/financial/customers'
    },
    {
      title: 'الخزينة',
      description: 'المقبوضات والمدفوعات والتحويلات',
      icon: CreditCard,
      color: 'yellow' as const,
      href: '/financial/treasury'
    },
    {
      title: 'الموظفين والرواتب',
      description: 'إدارة الموظفين وحساب الرواتب',
      icon: UserCheck,
      color: 'red' as const,
      href: '/financial/payroll'
    },
    {
      title: 'الأصول الثابتة',
      description: 'إدارة الأصول والاستهلاك',
      icon: Building,
      color: 'green' as const,
      href: '/financial/fixed-assets'
    },
    {
      title: 'التقارير المالية',
      description: 'الميزانية وقائمة الدخل والتقارير',
      icon: BarChart3,
      color: 'blue' as const,
      href: '/financial/reports'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card-professional bg-gradient-to-r from-golden-600 to-golden-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-10 w-10 ml-4" />
            <div>
              <h1 className="text-3xl font-bold">القسم المالي</h1>
              <p className="text-white/80 text-lg">نظام إدارة الشؤون المالية والمحاسبية</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-white/70 text-sm">تاريخ اليوم</p>
            <p className="text-white font-semibold text-lg">
              {new Date().toLocaleDateString('ar-LY')}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {loading ? (
        <div className="grid-auto grid-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="loading-skeleton h-4 mb-2"></div>
              <div className="loading-skeleton h-8 mb-2"></div>
              <div className="loading-skeleton h-4 w-1/2"></div>
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid-auto grid-4">
          <FinancialCard
            title="إجمالي الأصول"
            value={summary.totalAssets}
            icon={TrendingUp}
            color="blue"
            currency={summary.currency}
          />
          <FinancialCard
            title="صافي الدخل"
            value={summary.netIncome}
            icon={summary.netIncome >= 0 ? ArrowUpRight : ArrowDownRight}
            color={summary.netIncome >= 0 ? "green" : "red"}
            currency={summary.currency}
          />
          <FinancialCard
            title="رصيد النقدية"
            value={summary.cashBalance}
            icon={DollarSign}
            color="green"
            currency={summary.currency}
          />
          <FinancialCard
            title="ذمم العملاء"
            value={summary.accountsReceivable}
            icon={Users}
            color="purple"
            currency={summary.currency}
          />
        </div>
      ) : null}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-subheading mb-6">الوحدات المالية</h2>
        <div className="grid-auto grid-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="card-hover p-6 cursor-pointer group"
              onClick={() => {
                if (action.href === '/financial/accounts' || action.href === '/financial/journal' || action.href === '/financial/customers' || action.href === '/financial/treasury' || action.href === '/financial/payroll' || action.href === '/financial/fixed-assets' || action.href === '/financial/reports') {
                  navigate(action.href);
                } else {
                  alert(`سيتم تطوير وحدة ${action.title} قريباً`);
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${action.color}-100`}>
                  <action.icon className={`h-6 w-6 text-${action.color}-600`} />
                </div>
                <ArrowUpRight className="h-5 w-5 text-dark-400 group-hover:text-golden-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-dark-800 mb-2">
                {action.title}
              </h3>
              <p className="text-caption">
                {action.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid-auto grid-2">
        <div className="card-professional">
          <h3 className="text-subheading mb-6">آخر العمليات المالية</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-golden-50 rounded-lg border border-golden-200">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg ml-3">
                  <Receipt className="h-5 w-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-800">مقبوضات نقدية</p>
                  <p className="text-caption">منذ ساعتين</p>
                </div>
              </div>
              <span className="text-sm font-bold text-success-600">+15,000 د.ل</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-golden-50 rounded-lg border border-golden-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg ml-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-800">قيد يومية جديد</p>
                  <p className="text-caption">منذ 3 ساعات</p>
                </div>
              </div>
              <span className="text-caption">قيد #001</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-golden-50 rounded-lg border border-golden-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg ml-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-800">عميل جديد</p>
                  <p className="text-caption">اليوم</p>
                </div>
              </div>
              <span className="text-caption">شركة التجارة</span>
            </div>
          </div>
        </div>

        <div className="card-professional">
          <h3 className="text-subheading mb-6">إحصائيات سريعة</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border-b border-golden-200">
              <span className="text-body">عدد العملاء النشطين</span>
              <span className="text-xl font-bold text-dark-800">24</span>
            </div>
            <div className="flex items-center justify-between p-3 border-b border-golden-200">
              <span className="text-body">الفواتير المعلقة</span>
              <span className="text-xl font-bold text-danger-600">8</span>
            </div>
            <div className="flex items-center justify-between p-3 border-b border-golden-200">
              <span className="text-body">عدد الموظفين</span>
              <span className="text-xl font-bold text-dark-800">12</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-body">الأصول الثابتة</span>
              <span className="text-xl font-bold text-dark-800">15</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;

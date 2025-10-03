import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancialData } from '../contexts/FinancialDataContext';
import FinancialSummary from '../components/Financial/FinancialSummary';
import { financialAPI } from '../services/api';
import { ToastContainer } from '../components/UI/Toast';
import {
  FileText,
  Users,
  Calculator,
  Receipt,
  UserCheck,
  BarChart3,
  ArrowUpRight,
  Building,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const FinancialDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    financialData,
    financialLoading,
    financialError,
    refreshFinancialData
  } = useFinancialData();

  // Rename variables to match usage in the component
  const loading = financialLoading;
  const error = financialError;
  const handleRefresh = refreshFinancialData;

  // System Health state
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<any[]>([]);
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [
      ...prev,
      { id, type, title, message, duration: 4000, onClose: handleCloseToast, position: 'top-right' }
    ]);
  };
  const handleCloseToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadHealth = async () => {
    try {
      setHealthLoading(true);
      setHealthError(null);
      const res = await financialAPI.getSystemHealth();
      setHealth(res?.data || res);
    } catch (e: any) {
      setHealthError(e?.message || 'تعذر تحميل صحة النظام');
    } finally {
      setHealthLoading(false);
    }
  };

  const recalcBalances = async () => {
    try {
      setHealthLoading(true);
      await financialAPI.recalculateBalances();
      await loadHealth();
      showToast('success', 'تمت إعادة احتساب الأرصدة بنجاح');
    } catch (e: any) {
      const msg = e?.message || 'تعذر إعادة احتساب الأرصدة';
      setHealthError(msg);
      showToast('error', 'فشل العملية', msg);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    loadCurrentPeriod();
  }, []);

  // Accounting period state
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [periodLoading, setPeriodLoading] = useState<boolean>(false);
  const loadCurrentPeriod = async () => {
    try {
      setPeriodLoading(true);
      const res = await financialAPI.getCurrentAccountingPeriod();
      setCurrentPeriod(res?.data || null);
    } catch (e) {
      setCurrentPeriod(null);
    } finally {
      setPeriodLoading(false);
    }
  };

  const openCurrentMonthPeriod = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    try {
      setPeriodLoading(true);
      const res = await financialAPI.createAccountingPeriod(year, month);
      showToast('success', 'تم فتح فترة الشهر الحالي بنجاح');
      setCurrentPeriod(res?.data || res);
    } catch (e: any) {
      showToast('error', 'فشل فتح فترة الشهر الحالي', e?.message);
    } finally {
      setPeriodLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'دليل الحسابات',
      description: 'دليل الحسابات والأرصدة',
      icon: Calculator,
      color: 'blue' as const,
      href: '/financial/chart-of-accounts'
    },
    {
      title: 'قيود اليومية',
      description: 'إنشاء وإدارة القيود المحاسبية',
      icon: FileText,
      color: 'green' as const,
      href: '/financial/journal'
    },
    {
      title: 'كشف الحساب',
      description: 'عرض حركة الحساب خلال فترة محددة',
      icon: FileText,
      color: 'orange' as const,
      href: '/financial/account-statement'
    },
    {
      title: 'الأصول الثابتة',
      description: 'إدارة الأصول والاستهلاك',
      icon: Building,
      color: 'green' as const,
      href: '/financial/fixed-assets'
    },
    {
      title: 'القيد الافتتاحي',
      description: 'إدارة الأرصدة الافتتاحية',
      icon: BarChart3,
      color: 'purple' as const,
      href: '/financial/opening-balance'
    },
    {
      title: 'مراقبة الحسابات',
      description: 'مراقبة الحسابات الرئيسية',
      icon: UserCheck,
      color: 'red' as const,
      href: '/financial/account-monitoring'
    },
    {
      title: 'تقارير الفواتير',
      description: 'تقارير الفواتير المسددة وغير المسددة',
      icon: Receipt,
      color: 'indigo' as const,
      href: '/financial/invoice-reports'
    },
    {
      title: 'التقارير الفورية',
      description: 'تقارير فورية عن المقبوضات والمدفوعات والتدفق النقدي',
      icon: BarChart3,
      color: 'teal' as const,
      href: '/financial/instant-reports'
    },
    {
      title: 'العملاء',
      description: 'إدارة بيانات العملاء والأرصدة',
      icon: Users,
      color: 'indigo' as const,
      href: '/financial/customers'
    },
    {
      title: 'إدارة الموظفين',
      description: 'إدارة شاملة للموظفين والحسابات والرواتب',
      icon: Users,
      color: 'purple' as const,
      href: '/financial/employees'
    },
    {
      title: 'كشف حساب الموظفين',
      description: 'عرض بيانات الموظفين ورواتبهم وسلفهم وعهودهم',
      icon: UserCheck,
      color: 'red' as const,
      href: '/financial/employee-accounts'
    },
    {
      title: 'التقارير المالية',
      description: 'الميزانية وقائمة الدخل والتقارير',
      icon: BarChart3,
      color: 'blue' as const,
      href: '/financial/reports'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل البيانات المالية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة المدير المالي</h1>
          <p className="text-gray-600 mt-2">إدارة شاملة للشؤون المالية والمحاسبية</p>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          تحديث البيانات
        </button>
      </div>

      {/* Accounting Period Card */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">الفترة المحاسبية الحالية</h2>
              <p className="text-sm text-gray-500">التحكم في فتح فترة الشهر الحالي</p>
            </div>
            <div className="flex items-center gap-3">
              {!currentPeriod && (
                <button
                  onClick={openCurrentMonthPeriod}
                  disabled={periodLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg"
                >
                  فتح فترة الشهر الحالي
                </button>
              )}
              <button
                onClick={loadCurrentPeriod}
                disabled={periodLoading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg"
              >
                تحديث
              </button>
            </div>
          </div>

          {(!currentPeriod && !periodLoading) && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
              <p className="text-yellow-800 text-sm">لا توجد فترة محاسبية مفتوحة للشهر الحالي. إذا كانت سياسة الفترات مفعلة، لن يتم الترحيل حتى يتم فتح الفترة.</p>
            </div>
          )}

          {currentPeriod && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">السنة</p>
                <p className="text-lg font-semibold text-gray-900">{currentPeriod.year}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">الشهر</p>
                <p className="text-lg font-semibold text-gray-900">{currentPeriod.month}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">البداية</p>
                <p className="text-lg font-semibold text-gray-900">{currentPeriod.startDate}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">النهاية</p>
                <p className="text-lg font-semibold text-gray-900">{currentPeriod.endDate}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Health Card */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">صحة النظام المحاسبي</h2>
              <p className="text-sm text-gray-500">فحص سريع لتكامل الحسابات والقيود</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadHealth}
                disabled={healthLoading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} /> تحديث الحالة
              </button>
              <button
                onClick={recalcBalances}
                disabled={healthLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg"
              >
                إعادة احتساب الأرصدة
              </button>
              <button
                onClick={async () => {
                  try {
                    setHealthLoading(true);
                    const res = await financialAPI.repairMissingJournalEntries();
                    showToast('success', 'تم إصلاح القيود المفقودة', `المبيعات: ${res?.repaired?.sales || 0}, الشحن: ${res?.repaired?.shipping || 0}`);
                    await loadHealth();
                  } catch (e: any) {
                    showToast('error', 'فشل إصلاح القيود المفقودة', e?.message);
                  } finally {
                    setHealthLoading(false);
                  }
                }}
                disabled={healthLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
              >
                إصلاح القيود المفقودة
              </button>
              <button
                onClick={async () => {
                  try {
                    setHealthLoading(true);
                    const res = await financialAPI.installTriggers();
                    showToast('success', 'تم تثبيت Triggers', res?.message);
                  } catch (e: any) {
                    showToast('error', 'فشل تثبيت Triggers', e?.message);
                  } finally {
                    setHealthLoading(false);
                  }
                }}
                disabled={healthLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg"
              >
                تثبيت Triggers
              </button>
            </div>
          </div>

          {healthError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded mb-4">
              <p className="text-red-600">{healthError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">الحالة العامة</p>
              <p className={`text-lg font-semibold ${health?.healthy ? 'text-green-600' : 'text-amber-600'}`}>
                {healthLoading ? '...' : (health?.status === 'healthy' ? 'جيدة' : 'تحتاج انتباه')}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">عدد الحسابات</p>
              <p className="text-lg font-semibold text-gray-900">{healthLoading ? '...' : (health?.checks?.chartOfAccounts?.totalAccounts ?? '-')}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">حسابات بها عدم تطابق</p>
              <p className="text-lg font-semibold text-gray-900">{healthLoading ? '...' : (health?.checks?.balanceIntegrity?.accountsWithMismatch ?? '-')}</p>
            </div>
          </div>

          {/* Details: mismatched accounts */}
          {health?.details?.mismatchedAccounts && health.details.mismatchedAccounts.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">أعلى الحسابات ذات عدم التطابق</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="py-2 pr-4 text-right">الكود</th>
                      <th className="py-2 pr-4 text-right">الاسم</th>
                      <th className="py-2 pr-4 text-right">رصيد الحساب</th>
                      <th className="py-2 pr-4 text-right">رصيد GL</th>
                      <th className="py-2 pr-4 text-right">الفرق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.details.mismatchedAccounts.map((acc: any) => (
                      <tr key={acc.id} className="border-t">
                        <td className="py-2 pr-4">{acc.code}</td>
                        <td className="py-2 pr-4">{acc.name}</td>
                        <td className="py-2 pr-4">{Number(acc.account_balance).toFixed(2)}</td>
                        <td className="py-2 pr-4">{Number(acc.gl_balance).toFixed(2)}</td>
                        <td className="py-2 pr-4 font-semibold text-amber-700">{Number(acc.diff).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoices without journal entry */}
          {health?.details?.invoicesWithoutJournalEntry && health.details.invoicesWithoutJournalEntry.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">فواتير بدون قيد محاسبي</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="py-2 pr-4 text-right">رقم الفاتورة</th>
                      <th className="py-2 pr-4 text-right">التاريخ</th>
                      <th className="py-2 pr-4 text-right">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.details.invoicesWithoutJournalEntry.map((inv: any) => (
                      <tr key={inv.id} className="border-t">
                        <td className="py-2 pr-4">{inv.invoice_number}</td>
                        <td className="py-2 pr-4">{inv.date}</td>
                        <td className="py-2 pr-4">{Number(inv.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Issues list */}
          {health?.issues && health.issues.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">المشاكل:</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {health.issues.map((i: string, idx: number) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary Component */}
      <FinancialSummary
        data={financialData}
        loading={financialLoading}
        error={financialError}
        onRefresh={refreshFinancialData}
      />

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">الوظائف السريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(action.href)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                    <IconComponent className={`h-6 w-6 text-${action.color}-600`} />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
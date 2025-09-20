import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import TailAdminDashboardCard from '../TailAdmin/Cards/TailAdminDashboardCard';

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  totalAccounts: number;
  activeAccounts: number;
  pendingTransactions: number;
  monthlyRevenue: Array<{
    month: string;
    amount: number;
  }>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

interface AdminFinancialOverviewProps {
  data: FinancialData;
  loading?: boolean;
  onNavigateToFinancial?: () => void;
}

const AdminFinancialOverview: React.FC<AdminFinancialOverviewProps> = ({
  data,
  loading = false,
  onNavigateToFinancial
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 text-green-600 ml-3" />
          <h3 className="text-lg font-semibold text-gray-900">النظرة المالية</h3>
        </div>
        {onNavigateToFinancial && (
          <button
            onClick={onNavigateToFinancial}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            عرض التفاصيل ←
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <TailAdminDashboardCard
            title="إجمالي الإيرادات"
            value={data.totalRevenue}
            icon={DollarSign}
            color="success"
            currency="د.ل"
            trend={{
              direction: data.totalRevenue > 0 ? 'up' : 'neutral',
              percentage: 0,
              period: 'من الشهر الماضي'
            }}
          />
          
          <TailAdminDashboardCard
            title="صافي الربح"
            value={data.netProfit}
            icon={TrendingUp}
            color="primary"
            currency="د.ل"
            trend={{
              direction: data.netProfit > 0 ? 'up' : 'down',
              percentage: data.profitMargin,
              period: 'هامش الربح'
            }}
          />
          
          <TailAdminDashboardCard
            title="رصيد النقدية"
            value={data.cashBalance}
            icon={Wallet}
            color="info"
            currency="د.ل"
            trend={{
              direction: data.cashBalance > 0 ? 'up' : 'neutral',
              percentage: 0,
              period: 'من الأسبوع الماضي'
            }}
          />
        </div>

        {/* Additional Financial Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Accounts Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="h-5 w-5 text-gray-600 ml-2" />
              ملخص الحسابات
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">إجمالي الحسابات</span>
                <span className="font-medium">{data.totalAccounts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">الحسابات النشطة</span>
                <span className="font-medium text-green-600">{data.activeAccounts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ذمم العملاء</span>
                <span className="font-medium text-orange-600">{formatCurrency(data.accountsReceivable)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ذمم الموردين</span>
                <span className="font-medium text-red-600">{formatCurrency(data.accountsPayable)}</span>
              </div>
            </div>
          </div>

          {/* Pending Transactions */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 ml-2" />
              المعاملات المعلقة
            </h4>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {data.pendingTransactions}
              </div>
              <div className="text-sm text-gray-600">معاملة في انتظار المراجعة</div>
              {data.pendingTransactions > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    يتطلب انتباه
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Expense Categories */}
        {data.topExpenseCategories && data.topExpenseCategories.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">أهم فئات المصروفات</h4>
            <div className="space-y-2">
              {data.topExpenseCategories.slice(0, 5).map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 ml-2">{formatCurrency(category.amount)}</span>
                    <span className="text-xs text-gray-500">({category.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFinancialOverview;

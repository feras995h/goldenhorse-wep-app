import React from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  TrendingDown,
  Users,
  Receipt,
  AlertTriangle
} from 'lucide-react';

interface FinancialSummaryProps {
  data: {
    totalSales: number;
    totalPurchases: number;
    netProfit: number;
    cashFlow: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    accountsReceivable: number;
    accountsPayable: number;
    cashBalance: number;
    bankBalance: number;
    monthlyGrowth: number;
  } | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ data, loading, error, onRefresh }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-gray-600">لا توجد بيانات مالية متاحة</p>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'إجمالي المبيعات',
      value: data.totalSales,
      icon: DollarSign,
      color: 'green',
      trend: 'up',
      trendValue: data.monthlyGrowth
    },
    {
      title: 'صافي الربح',
      value: data.netProfit,
      icon: TrendingUp,
      color: 'blue',
      trend: data.netProfit >= 0 ? 'up' : 'down',
      trendValue: Math.abs(data.netProfit)
    },
    {
      title: 'التدفق النقدي',
      value: data.cashFlow,
      icon: CreditCard,
      color: 'purple',
      trend: 'neutral'
    },
    {
      title: 'الأصول الإجمالية',
      value: data.totalAssets,
      icon: Building,
      color: 'orange',
      trend: 'neutral'
    }
  ];

  const detailCards = [
    {
      title: 'إجمالي المشتريات',
      value: data.totalPurchases,
      icon: Receipt,
      color: 'red'
    },
    {
      title: 'الحسابات المدينة',
      value: data.accountsReceivable,
      icon: Users,
      color: 'indigo'
    },
    {
      title: 'الحسابات الدائنة',
      value: data.accountsPayable,
      icon: TrendingDown,
      color: 'yellow'
    },
    {
      title: 'رصيد البنك',
      value: data.bankBalance,
      icon: CreditCard,
      color: 'teal'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Financial Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لوحة المدير المالي</h3>
          <p className="text-gray-600 mb-6">
            مرحباً بك في لوحة التحكم المالية. يمكنك الوصول إلى جميع الأدوات المالية والمحاسبية من القائمة الجانبية.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-900">دليل الحسابات</p>
              <p className="text-gray-600">إدارة الحسابات المحاسبية</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-900">القيود المحاسبية</p>
              <p className="text-gray-600">إدخال وإدارة القيود</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-900">التقارير المالية</p>
              <p className="text-gray-600">عرض التقارير والتحليلات</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-900">الأرصدة الافتتاحية</p>
              <p className="text-gray-600">إدخال الأرصدة الأولية</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;

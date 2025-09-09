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
      {/* Main Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الملخص المالي الرئيسي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full bg-${card.color}-100`}>
                    <IconComponent className={`h-6 w-6 text-${card.color}-600`} />
                  </div>
                  {card.trend !== 'neutral' && (
                    <div className={`flex items-center gap-1 ${getTrendColor(card.trend)}`}>
                      {getTrendIcon(card.trend)}
                      <span className="text-sm font-medium">
                        {card.trend === 'up' ? '+' : '-'}{card.trendValue?.toFixed(1) || 0}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {card.value?.toLocaleString('ar-LY') || '0'} د.ل
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Financial Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">المؤشرات المالية التفصيلية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {detailCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full bg-${card.color}-100`}>
                    <IconComponent className={`h-6 w-6 text-${card.color}-600`} />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                <p className="text-xl font-bold text-gray-900">
                  {card.value?.toLocaleString('ar-LY') || '0'} د.ل
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Ratios */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">النسب المالية</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">نسبة السيولة</h4>
            <p className="text-2xl font-bold text-gray-900">
              {data.totalAssets > 0 ? ((data.cashFlow / data.totalAssets) * 100).toFixed(1) : '0'}%
            </p>
            <p className="text-xs text-gray-500 mt-1">النقدية / إجمالي الأصول</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">نسبة الربحية</h4>
            <p className="text-2xl font-bold text-gray-900">
              {data.totalSales > 0 ? ((data.netProfit / data.totalSales) * 100).toFixed(1) : '0'}%
            </p>
            <p className="text-xs text-gray-500 mt-1">صافي الربح / إجمالي المبيعات</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">نسبة المديونية</h4>
            <p className="text-2xl font-bold text-gray-900">
              {data.totalAssets > 0 ? ((data.totalLiabilities / data.totalAssets) * 100).toFixed(1) : '0'}%
            </p>
            <p className="text-xs text-gray-500 mt-1">إجمالي المطلوبات / إجمالي الأصول</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;

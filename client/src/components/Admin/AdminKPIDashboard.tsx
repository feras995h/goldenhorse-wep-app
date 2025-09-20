import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity
} from 'lucide-react';

interface KPIData {
  title: string;
  value: number | string;
  previousValue?: number;
  target?: number;
  unit?: string;
  format?: 'currency' | 'percentage' | 'number';
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  status?: 'good' | 'warning' | 'danger';
  icon: React.ComponentType<any>;
  color: string;
}

interface AdminKPIDashboardProps {
  kpis: KPIData[];
  loading?: boolean;
}

const AdminKPIDashboard: React.FC<AdminKPIDashboardProps> = ({
  kpis,
  loading = false
}) => {
  const formatValue = (value: number | string, format?: string, unit?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('ar-LY', {
          style: 'currency',
          currency: 'LYD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('ar-LY').format(isNaN(value) || !isFinite(value) ? 0 : value);
      default:
        return unit ? `${value} ${unit}` : value.toString();
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getIconColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      red: 'text-red-600 bg-red-100',
      purple: 'text-purple-600 bg-purple-100',
      indigo: 'text-indigo-600 bg-indigo-100',
      pink: 'text-pink-600 bg-pink-100',
      gray: 'text-gray-600 bg-gray-100'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="h-6 w-6 text-blue-600 ml-3" />
          مؤشرات الأداء الرئيسية
        </h3>
        <div className="text-sm text-gray-500">
          آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon;
          const progressPercentage = kpi.target ? (Number(kpi.value) / kpi.target) * 100 : 0;
          
          return (
            <div key={index} className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${getStatusColor(kpi.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getIconColor(kpi.color)}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                {kpi.trend && (
                  <div className="flex items-center space-x-1 space-x-reverse">
                    {getTrendIcon(kpi.trend)}
                    {kpi.trendPercentage && (
                      <span className={`text-sm font-medium ${
                        kpi.trend === 'up' ? 'text-green-600' : 
                        kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {kpi.trendPercentage > 0 ? '+' : ''}{kpi.trendPercentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {formatValue(kpi.value, kpi.format, kpi.unit)}
                </p>
              </div>

              {kpi.target && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>الهدف</span>
                    <span>{formatValue(kpi.target, kpi.format, kpi.unit)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progressPercentage >= 100 ? 'bg-green-500' :
                        progressPercentage >= 75 ? 'bg-blue-500' :
                        progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {progressPercentage.toFixed(1)}% من الهدف
                  </div>
                </div>
              )}

              {kpi.previousValue && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">القيمة السابقة</span>
                    <span className="text-gray-700 font-medium">
                      {formatValue(kpi.previousValue, kpi.format, kpi.unit)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminKPIDashboard;

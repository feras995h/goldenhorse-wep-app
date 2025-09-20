import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

// Simple Card components
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>{children}</div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pb-3 ${className}`}>{children}</div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

// Simple Button component
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
  };
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Interfaces
interface KPIMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple';
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface RealtimeData {
  revenue: ChartData[];
  expenses: ChartData[];
  profit: ChartData[];
  cashFlow: ChartData[];
}

const KPIDashboard: React.FC = () => {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch KPI data
  const fetchKPIData = async () => {
    try {
      setLoading(true);
      
      // In a real application, this would be API calls
      // For now, we'll simulate the data structure
      const mockKPIMetrics: KPIMetric[] = [
        {
          id: 'total-revenue',
          title: 'إجمالي الإيرادات',
          value: '2,450,000 ر.س',
          change: 12.5,
          trend: 'up',
          icon: DollarSign,
          color: 'green',
          description: 'الإيرادات الإجمالية لهذا الشهر'
        },
        {
          id: 'total-expenses',
          title: 'إجمالي المصروفات',
          value: '1,850,000 ر.س',
          change: -5.2,
          trend: 'down',
          icon: TrendingDown,
          color: 'red',
          description: 'المصروفات الإجمالية لهذا الشهر'
        },
        {
          id: 'net-profit',
          title: 'صافي الربح',
          value: '600,000 ر.س',
          change: 18.3,
          trend: 'up',
          icon: TrendingUp,
          color: 'blue',
          description: 'صافي الربح بعد خصم جميع المصروفات'
        },
        {
          id: 'active-customers',
          title: 'العملاء النشطون',
          value: 1247,
          change: 8.7,
          trend: 'up',
          icon: Users,
          color: 'purple',
          description: 'عدد العملاء الذين قاموا بعمليات شراء هذا الشهر'
        },
        {
          id: 'total-orders',
          title: 'إجمالي الطلبات',
          value: 3456,
          change: 15.2,
          trend: 'up',
          icon: ShoppingCart,
          color: 'orange',
          description: 'عدد الطلبات المكتملة هذا الشهر'
        },
        {
          id: 'inventory-value',
          title: 'قيمة المخزون',
          value: '4,200,000 ر.س',
          change: -2.1,
          trend: 'down',
          icon: Package,
          color: 'blue',
          description: 'القيمة الإجمالية للمخزون الحالي'
        }
      ];

      const mockRealtimeData: RealtimeData = {
        revenue: [
          { name: 'يناير', value: 2100000 },
          { name: 'فبراير', value: 2300000 },
          { name: 'مارس', value: 2450000 },
        ],
        expenses: [
          { name: 'يناير', value: 1800000 },
          { name: 'فبراير', value: 1900000 },
          { name: 'مارس', value: 1850000 },
        ],
        profit: [
          { name: 'يناير', value: 300000 },
          { name: 'فبراير', value: 400000 },
          { name: 'مارس', value: 600000 },
        ],
        cashFlow: [
          { name: 'النقد', value: 850000 },
          { name: 'البنك', value: 1200000 },
          { name: 'الاستثمارات', value: 400000 },
        ]
      };

      setKpiMetrics(mockKPIMetrics);
      setRealtimeData(mockRealtimeData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchKPIData();
    
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(fetchKPIData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedPeriod]);

  // Get trend color and icon
  const getTrendInfo = (trend: 'up' | 'down' | 'stable', change: number) => {
    if (trend === 'up') {
      return {
        color: 'text-green-600',
        icon: ArrowUpRight,
        prefix: '+'
      };
    } else if (trend === 'down') {
      return {
        color: 'text-red-600',
        icon: ArrowDownRight,
        prefix: ''
      };
    } else {
      return {
        color: 'text-gray-600',
        icon: Activity,
        prefix: ''
      };
    }
  };

  // Get card color classes
  const getCardColor = (color: string) => {
    const colors = {
      green: 'border-l-green-500 bg-green-50',
      red: 'border-l-red-500 bg-red-50',
      blue: 'border-l-blue-500 bg-blue-50',
      orange: 'border-l-orange-500 bg-orange-50',
      purple: 'border-l-purple-500 bg-purple-50'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting KPI dashboard data...');
  };

  if (loading) {
    return (
      <LoadingSpinner
        size="xl"
        text="جاري تحميل مؤشرات الأداء الرئيسية..."
        fullScreen
      />
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            لوحة مؤشرات الأداء الرئيسية
          </h1>
          <p className="text-gray-600 mt-2">
            مراقبة الأداء المالي والتشغيلي في الوقت الفعلي
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="quarter">هذا الربع</option>
            <option value="year">هذا العام</option>
          </select>

          {/* Auto Refresh Toggle */}
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'primary' : 'secondary'}
            size="sm"
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            {autoRefresh ? 'إيقاف التحديث التلقائي' : 'تفعيل التحديث التلقائي'}
          </Button>

          {/* Manual Refresh */}
          <Button
            onClick={fetchKPIData}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>

          {/* Export */}
          <Button
            onClick={handleExport}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="h-4 w-4" />
        آخر تحديث: {lastUpdated.toLocaleString('ar-SA')}
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiMetrics.map((metric) => {
          const IconComponent = metric.icon;
          const trendInfo = getTrendInfo(metric.trend, metric.change);
          const TrendIcon = trendInfo.icon;

          return (
            <Card 
              key={metric.id} 
              className={`border-l-4 ${getCardColor(metric.color)} hover:shadow-lg transition-shadow`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {metric.title}
                </CardTitle>
                <IconComponent className="h-5 w-5 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {metric.value}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {metric.description}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${trendInfo.color}`}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {trendInfo.prefix}{Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Real-time Charts Section */}
      {realtimeData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                اتجاه الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realtimeData.revenue.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(item.value / Math.max(...realtimeData.revenue.map(r => r.value))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {item.value.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                توزيع التدفق النقدي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realtimeData.cashFlow.map((item, index) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500'];
                  const total = realtimeData.cashFlow.reduce((sum, cf) => sum + cf.value, 0);
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          {item.value.toLocaleString('ar-SA')} ر.س
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts and Notifications */}
      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            تنبيهات مهمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  انخفاض في مستوى المخزون
                </p>
                <p className="text-xs text-gray-600">
                  15 صنف تحت الحد الأدنى للمخزون
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  فواتير متأخرة السداد
                </p>
                <p className="text-xs text-gray-600">
                  8 فواتير تجاوزت موعد الاستحقاق
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPIDashboard;
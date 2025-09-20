import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  Activity,
  BarChart3,
  PieChart,
  Building2,
  DollarSign,
  Target,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';

// Simple UI Components
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>{children}</div>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 pb-3">{children}</div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 pt-0">{children}</div>
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, onClick, variant = 'primary', size = 'md', className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  };
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm'
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

// Data Interfaces
interface ABCActivity {
  account_name: string;
  cost_driver: string;
  net_cost: number;
  cost_percentage: number;
  cost_impact_level: 'High' | 'Medium' | 'Low';
}

interface CostAllocation {
  account_name: string;
  cost_type: string;
  total_amount: number;
  department: string;
}

const CostAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'abc' | 'allocation' | 'centers' | 'variance'>('abc');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Mock data
  const mockData = {
    abc: {
      activities: [
        {
          account_name: 'رواتب الموظفين',
          cost_driver: 'ساعات العمل',
          net_cost: 450000,
          cost_percentage: 35.5,
          cost_impact_level: 'High' as const
        },
        {
          account_name: 'مصاريف النقل',
          cost_driver: 'وحدات النقل',
          net_cost: 320000,
          cost_percentage: 25.3,
          cost_impact_level: 'High' as const
        },
        {
          account_name: 'إيجار المباني',
          cost_driver: 'المساحة',
          net_cost: 180000,
          cost_percentage: 14.2,
          cost_impact_level: 'Medium' as const
        }
      ],
      summary: { totalCosts: 950000, totalActivities: 3, highImpactActivities: 2 }
    },
    allocation: {
      allocations: [
        {
          account_name: 'تكلفة البضاعة المباعة',
          cost_type: 'مباشرة',
          total_amount: 650000,
          department: 'المبيعات'
        },
        {
          account_name: 'مصاريف إدارية',
          cost_type: 'غير مباشرة',
          total_amount: 285000,
          department: 'الإدارة'
        }
      ],
      summary: { totalCosts: 935000, directCosts: 650000, indirectCosts: 285000 }
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleExport = () => {
    console.log(`Exporting ${activeTab} analysis...`);
  };

  if (loading) {
    return <LoadingSpinner size="xl" text="جاري تحميل تحليل التكاليف..." fullScreen />;
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تحليل التكاليف المتقدم</h1>
          <p className="text-gray-600 mt-2">تحليل شامل للتكاليف باستخدام منهجيات التكلفة الحديثة</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span>إلى</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <Button onClick={handleRefresh} variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          
          <Button onClick={handleExport} variant="secondary" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'abc', label: 'التكلفة حسب النشاط', icon: Activity },
            { id: 'allocation', label: 'توزيع التكاليف', icon: PieChart },
            { id: 'centers', label: 'مراكز التكلفة', icon: Building2 },
            { id: 'variance', label: 'تحليل الانحرافات', icon: BarChart3 }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {/* ABC Analysis */}
        {activeTab === 'abc' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي التكاليف</p>
                      <p className="text-2xl font-bold">{mockData.abc.summary.totalCosts.toLocaleString()} ر.س</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي الأنشطة</p>
                      <p className="text-2xl font-bold">{mockData.abc.summary.totalActivities}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">أنشطة عالية التأثير</p>
                      <p className="text-2xl font-bold">{mockData.abc.summary.highImpactActivities}</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activities Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  تحليل التكلفة حسب النشاط (ABC)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-3">الحساب</th>
                        <th className="text-right p-3">محرك التكلفة</th>
                        <th className="text-right p-3">التكلفة</th>
                        <th className="text-right p-3">النسبة</th>
                        <th className="text-right p-3">التأثير</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockData.abc.activities.map((activity, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{activity.account_name}</td>
                          <td className="p-3">{activity.cost_driver}</td>
                          <td className="p-3">{activity.net_cost.toLocaleString()} ر.س</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${activity.cost_percentage}%` }}
                                />
                              </div>
                              {activity.cost_percentage}%
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              activity.cost_impact_level === 'High' 
                                ? 'bg-red-100 text-red-800' 
                                : activity.cost_impact_level === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {activity.cost_impact_level === 'High' ? 'عالي' : 
                               activity.cost_impact_level === 'Medium' ? 'متوسط' : 'منخفض'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cost Allocation */}
        {activeTab === 'allocation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardContent>
                  <div>
                    <p className="text-sm text-gray-600">التكاليف المباشرة</p>
                    <p className="text-2xl font-bold">{mockData.allocation.summary.directCosts.toLocaleString()} ر.س</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent>
                  <div>
                    <p className="text-sm text-gray-600">التكاليف غير المباشرة</p>
                    <p className="text-2xl font-bold">{mockData.allocation.summary.indirectCosts.toLocaleString()} ر.س</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع التكاليف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-3">الحساب</th>
                        <th className="text-right p-3">النوع</th>
                        <th className="text-right p-3">القسم</th>
                        <th className="text-right p-3">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockData.allocation.allocations.map((allocation, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{allocation.account_name}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              allocation.cost_type === 'مباشرة'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {allocation.cost_type}
                            </span>
                          </td>
                          <td className="p-3">{allocation.department}</td>
                          <td className="p-3">{allocation.total_amount.toLocaleString()} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs would show similar data structure */}
        {(activeTab === 'centers' || activeTab === 'variance') && (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                  {activeTab === 'centers' ? <Building2 className="h-24 w-24" /> : <BarChart3 className="h-24 w-24" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'centers' ? 'تحليل مراكز التكلفة' : 'تحليل الانحرافات'}
                </h3>
                <p className="text-gray-500">سيتم تطوير هذا القسم قريباً</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CostAnalysis;
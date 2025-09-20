import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Droplets,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  CreditCard,
  PiggyBank,
  Target,
  Lightbulb
} from 'lucide-react';

// UI Components
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

// Interfaces
interface CashFlowSummary {
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  operatingCashFlow: number;
  liquidityRatio: number;
}

interface BankAccount {
  bankName: string;
  balance: number;
  availableBalance: number;
  currency: string;
  type: string;
}

interface Recommendation {
  title: string;
  description: string;
  potentialImpact: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

const CashFlowManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'liquidity' | 'projections' | 'optimization'>('overview');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Mock data
  const cashFlowSummary: CashFlowSummary = {
    totalInflows: 8750000,
    totalOutflows: 6850000,
    netCashFlow: 1900000,
    operatingCashFlow: 2150000,
    liquidityRatio: 2.3
  };

  const bankAccounts: BankAccount[] = [
    {
      bankName: 'البنك الأهلي السعودي',
      balance: 1850000,
      availableBalance: 1820000,
      currency: 'SAR',
      type: 'جاري'
    },
    {
      bankName: 'بنك الراجحي',
      balance: 950000,
      availableBalance: 945000,
      currency: 'SAR',
      type: 'توفير'
    },
    {
      bankName: 'بنك ساب',
      balance: 350000,
      availableBalance: 330000,
      currency: 'SAR',
      type: 'جاري'
    }
  ];

  const monthlyFlow = [
    { month: 'يناير', inflows: 1450000, outflows: 1180000, netFlow: 270000 },
    { month: 'فبراير', inflows: 1380000, outflows: 1220000, netFlow: 160000 },
    { month: 'مارس', inflows: 1520000, outflows: 1330000, netFlow: 190000 },
    { month: 'أبريل', inflows: 1480000, outflows: 1270000, netFlow: 210000 },
    { month: 'مايو', inflows: 1620000, outflows: 1400000, netFlow: 220000 },
    { month: 'يونيو', inflows: 1300000, outflows: 1450000, netFlow: -150000 }
  ];

  const projections = [
    { month: 'يوليو 2025', projectedFlow: 180000, confidence: 92 },
    { month: 'أغسطس 2025', projectedFlow: 220000, confidence: 89 },
    { month: 'سبتمبر 2025', projectedFlow: 195000, confidence: 86 },
    { month: 'أكتوبر 2025', projectedFlow: 240000, confidence: 83 },
    { month: 'نوفمبر 2025', projectedFlow: 210000, confidence: 80 },
    { month: 'ديسمبر 2025', projectedFlow: 185000, confidence: 77 }
  ];

  const recommendations: Recommendation[] = [
    {
      title: 'تحسين دورة تحصيل الذمم',
      description: 'تقليل فترة التحصيل من 42 يوم إلى 30 يوم',
      potentialImpact: 850000,
      priority: 'high',
      category: 'تحصيل الذمم'
    },
    {
      title: 'تحسين إدارة المخزون',
      description: 'تقليل مستوى المخزون وتحسين دوران المخزون',
      potentialImpact: 650000,
      priority: 'medium',
      category: 'إدارة المخزون'
    },
    {
      title: 'استثمار السيولة الزائدة',
      description: 'استثمار السيولة في أدوات مالية قصيرة الأجل',
      potentialImpact: 180000,
      priority: 'medium',
      category: 'استثمار السيولة'
    }
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleExport = () => {
    console.log(`Exporting ${activeTab} data...`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return 'غير محدد';
    }
  };

  if (loading) {
    return <LoadingSpinner size="xl" text="جاري تحميل إدارة التدفق النقدي..." fullScreen />;
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة التدفق النقدي المتقدمة</h1>
          <p className="text-gray-600 mt-2">مراقبة وتحليل التدفقات النقدية مع التنبؤات والتحسينات</p>
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
            { id: 'overview', label: 'نظرة عامة', icon: Droplets },
            { id: 'liquidity', label: 'إدارة السيولة', icon: PiggyBank },
            { id: 'projections', label: 'التنبؤات', icon: TrendingUp },
            { id: 'optimization', label: 'التحسينات', icon: Lightbulb }
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي التدفق الداخل</p>
                      <p className="text-xl font-bold text-green-600">
                        +{cashFlowSummary.totalInflows.toLocaleString()} ر.س
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي التدفق الخارج</p>
                      <p className="text-xl font-bold text-red-600">
                        -{cashFlowSummary.totalOutflows.toLocaleString()} ر.س
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">صافي التدفق النقدي</p>
                      <p className="text-xl font-bold text-blue-600">
                        +{cashFlowSummary.netCashFlow.toLocaleString()} ر.س
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">نسبة السيولة</p>
                      <p className="text-xl font-bold text-purple-600">
                        {cashFlowSummary.liquidityRatio.toFixed(1)}
                      </p>
                    </div>
                    <Droplets className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Flow Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  التدفق النقدي الشهري
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-3">الشهر</th>
                        <th className="text-right p-3">التدفق الداخل</th>
                        <th className="text-right p-3">التدفق الخارج</th>
                        <th className="text-right p-3">صافي التدفق</th>
                        <th className="text-right p-3">المؤشر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyFlow.map((flow, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{flow.month}</td>
                          <td className="p-3 text-green-600">
                            +{flow.inflows.toLocaleString()} ر.س
                          </td>
                          <td className="p-3 text-red-600">
                            -{flow.outflows.toLocaleString()} ر.س
                          </td>
                          <td className={`p-3 font-medium ${
                            flow.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {flow.netFlow >= 0 ? '+' : ''}{flow.netFlow.toLocaleString()} ر.س
                          </td>
                          <td className="p-3">
                            {flow.netFlow >= 0 ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            )}
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

        {/* Liquidity Tab */}
        {activeTab === 'liquidity' && (
          <div className="space-y-6">
            {/* Liquidity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent>
                  <div>
                    <p className="text-sm text-gray-600">إجمالي السيولة</p>
                    <p className="text-2xl font-bold">5,650,000 ر.س</p>
                    <p className="text-sm text-blue-600">نقد + ائتمان متاح</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent>
                  <div>
                    <p className="text-sm text-gray-600">السيولة الزائدة</p>
                    <p className="text-2xl font-bold">4,150,000 ر.س</p>
                    <p className="text-sm text-green-600">فوق الحد الأدنى المطلوب</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent>
                  <div>
                    <p className="text-sm text-gray-600">الحد الأدنى المطلوب</p>
                    <p className="text-2xl font-bold">1,500,000 ر.س</p>
                    <p className="text-sm text-orange-600">للعمليات الأساسية</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bank Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  الحسابات البنكية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bankAccounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{account.bankName}</div>
                        <div className="text-sm text-gray-600">{account.type} - {account.currency}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{account.balance.toLocaleString()} ر.س</div>
                        <div className="text-sm text-gray-600">
                          متاح: {account.availableBalance.toLocaleString()} ر.س
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projections Tab */}
        {activeTab === 'projections' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  توقعات التدفق النقدي - الأشهر الستة القادمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-3">الشهر</th>
                        <th className="text-right p-3">التدفق المتوقع</th>
                        <th className="text-right p-3">مستوى الثقة</th>
                        <th className="text-right p-3">التقييم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map((projection, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{projection.month}</td>
                          <td className={`p-3 font-medium ${
                            projection.projectedFlow >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {projection.projectedFlow >= 0 ? '+' : ''}{projection.projectedFlow.toLocaleString()} ر.س
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${projection.confidence}%` }}
                                />
                              </div>
                              {projection.confidence}%
                            </div>
                          </td>
                          <td className="p-3">
                            {projection.confidence >= 90 ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">مؤكد</span>
                            ) : projection.confidence >= 80 ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">محتمل</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">غير مؤكد</span>
                            )}
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

        {/* Optimization Tab */}
        {activeTab === 'optimization' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  توصيات تحسين التدفق النقدي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{rec.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{rec.category}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(rec.priority)}`}>
                          أولوية {getPriorityText(rec.priority)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{rec.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          التأثير المحتمل: 
                          <span className="font-semibold text-green-600 ml-1">
                            {rec.potentialImpact.toLocaleString()} ر.س
                          </span>
                        </div>
                        <Button size="sm">
                          عرض التفاصيل
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-l-4 border-l-green-500 bg-green-50">
              <CardContent>
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-800">إجمالي التحسين المحتمل</h4>
                    <p className="text-green-700">
                      {recommendations.reduce((sum, rec) => sum + rec.potentialImpact, 0).toLocaleString()} ر.س سنوياً
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowManagement;
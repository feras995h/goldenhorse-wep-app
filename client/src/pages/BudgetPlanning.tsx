import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Plus,
  Edit,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Target
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
interface BudgetTemplate {
  id: string;
  name: string;
  type: 'annual' | 'quarterly' | 'monthly';
  fiscalYear: number;
  totalBudget: number;
  status: 'active' | 'draft' | 'approved';
  categories: BudgetCategory[];
}

interface BudgetCategory {
  name: string;
  budgetAmount: number;
  type: 'revenue' | 'cogs' | 'operating' | 'administrative';
}

interface CashFlowForecast {
  period: string;
  cashInflow: number;
  cashOutflow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  confidence: number;
}

interface Scenario {
  name: string;
  type: 'base' | 'optimistic' | 'pessimistic' | 'realistic';
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  probability: number;
}

const BudgetPlanning: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'analysis' | 'forecast' | 'scenarios'>('templates');
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Data states
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [cashFlowForecast, setCashFlowForecast] = useState<CashFlowForecast[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  // Mock data
  const mockTemplates: BudgetTemplate[] = [
    {
      id: 'annual_2025',
      name: 'الميزانية السنوية 2025',
      type: 'annual',
      fiscalYear: 2025,
      totalBudget: 12000000,
      status: 'active',
      categories: [
        { name: 'الإيرادات', budgetAmount: 15000000, type: 'revenue' },
        { name: 'تكلفة البضاعة', budgetAmount: 8500000, type: 'cogs' },
        { name: 'المصاريف التشغيلية', budgetAmount: 3200000, type: 'operating' },
        { name: 'المصاريف الإدارية', budgetAmount: 1800000, type: 'administrative' }
      ]
    },
    {
      id: 'q1_2025',
      name: 'ميزانية الربع الأول 2025',
      type: 'quarterly',
      fiscalYear: 2025,
      totalBudget: 3000000,
      status: 'draft',
      categories: [
        { name: 'الإيرادات', budgetAmount: 3750000, type: 'revenue' },
        { name: 'تكلفة البضاعة', budgetAmount: 2125000, type: 'cogs' }
      ]
    }
  ];

  const mockCashFlow: CashFlowForecast[] = [
    { period: 'يناير 2025', cashInflow: 1250000, cashOutflow: 980000, netCashFlow: 270000, cumulativeCashFlow: 270000, confidence: 95 },
    { period: 'فبراير 2025', cashInflow: 1180000, cashOutflow: 1020000, netCashFlow: 160000, cumulativeCashFlow: 430000, confidence: 92 },
    { period: 'مارس 2025', cashInflow: 1340000, cashOutflow: 1150000, netCashFlow: 190000, cumulativeCashFlow: 620000, confidence: 89 },
    { period: 'أبريل 2025', cashInflow: 1290000, cashOutflow: 1080000, netCashFlow: 210000, cumulativeCashFlow: 830000, confidence: 86 },
    { period: 'مايو 2025', cashInflow: 1420000, cashOutflow: 1200000, netCashFlow: 220000, cumulativeCashFlow: 1050000, confidence: 83 },
    { period: 'يونيو 2025', cashInflow: 1380000, cashOutflow: 1160000, netCashFlow: 220000, cumulativeCashFlow: 1270000, confidence: 80 }
  ];

  const mockScenarios: Scenario[] = [
    {
      name: 'السيناريو الأساسي',
      type: 'base',
      totalRevenue: 15000000,
      totalExpenses: 12000000,
      netProfit: 3000000,
      profitMargin: 20.0,
      probability: 100
    },
    {
      name: 'السيناريو المتفائل',
      type: 'optimistic',
      totalRevenue: 17250000,
      totalExpenses: 11400000,
      netProfit: 5850000,
      profitMargin: 33.9,
      probability: 25
    },
    {
      name: 'السيناريو المتشائم',
      type: 'pessimistic',
      totalRevenue: 13500000,
      totalExpenses: 12960000,
      netProfit: 540000,
      profitMargin: 4.0,
      probability: 20
    },
    {
      name: 'السيناريو الواقعي',
      type: 'realistic',
      totalRevenue: 15750000,
      totalExpenses: 12360000,
      netProfit: 3390000,
      profitMargin: 21.5,
      probability: 55
    }
  ];

  useEffect(() => {
    setTemplates(mockTemplates);
    setCashFlowForecast(mockCashFlow);
    setScenarios(mockScenarios);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleExport = () => {
    console.log(`Exporting ${activeTab} data...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'draft': return 'مسودة';
      case 'approved': return 'معتمد';
      default: return 'غير محدد';
    }
  };

  if (loading) {
    return <LoadingSpinner size="xl" text="جاري تحميل التخطيط المالي..." fullScreen />;
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التخطيط المالي والميزانيات</h1>
          <p className="text-gray-600 mt-2">إدارة الميزانيات والتنبؤ بالتدفقات النقدية</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          
          <Button onClick={handleRefresh} variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          
          <Button onClick={handleExport} variant="secondary" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 ml-2" />
            ميزانية جديدة
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', label: 'قوالب الميزانية', icon: Calculator },
            { id: 'analysis', label: 'تحليل الميزانية', icon: BarChart3 },
            { id: 'forecast', label: 'التنبؤ بالتدفق النقدي', icon: TrendingUp },
            { id: 'scenarios', label: 'السيناريوهات', icon: Target }
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
        {/* Budget Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي الميزانيات</p>
                      <p className="text-2xl font-bold">{templates.length}</p>
                    </div>
                    <Calculator className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">الميزانيات النشطة</p>
                      <p className="text-2xl font-bold">
                        {templates.filter(t => t.status === 'active').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي المبلغ المخطط</p>
                      <p className="text-xl font-bold">
                        {templates.reduce((sum, t) => sum + t.totalBudget, 0).toLocaleString()} ر.س
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Templates Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  قوالب الميزانية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-3">اسم الميزانية</th>
                        <th className="text-right p-3">النوع</th>
                        <th className="text-right p-3">السنة المالية</th>
                        <th className="text-right p-3">المبلغ الإجمالي</th>
                        <th className="text-right p-3">الحالة</th>
                        <th className="text-right p-3">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map((template) => (
                        <tr key={template.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{template.name}</td>
                          <td className="p-3">
                            {template.type === 'annual' ? 'سنوية' : 
                             template.type === 'quarterly' ? 'ربع سنوية' : 'شهرية'}
                          </td>
                          <td className="p-3">{template.fiscalYear}</td>
                          <td className="p-3 font-medium">
                            {template.totalBudget.toLocaleString()} ر.س
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(template.status)}`}>
                              {getStatusText(template.status)}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
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

        {/* Cash Flow Forecast */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardContent>
                  <div>
                    <p className="text-sm text-gray-600">إجمالي التدفق الداخل</p>
                    <p className="text-xl font-bold">
                      {cashFlowForecast.reduce((sum, cf) => sum + cf.cashInflow, 0).toLocaleString()} ر.س
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent>
                  <div>
                    <p className="text-sm text-gray-600">إجمالي التدفق الخارج</p>
                    <p className="text-xl font-bold">
                      {cashFlowForecast.reduce((sum, cf) => sum + cf.cashOutflow, 0).toLocaleString()} ر.س
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent>
                  <div>
                    <p className="text-sm text-gray-600">صافي التدفق النقدي</p>
                    <p className="text-xl font-bold">
                      {cashFlowForecast.reduce((sum, cf) => sum + cf.netCashFlow, 0).toLocaleString()} ر.س
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Forecast Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  التنبؤ بالتدفق النقدي - الأشهر الستة القادمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-3">الفترة</th>
                        <th className="text-right p-3">التدفق الداخل</th>
                        <th className="text-right p-3">التدفق الخارج</th>
                        <th className="text-right p-3">صافي التدفق</th>
                        <th className="text-right p-3">التدفق التراكمي</th>
                        <th className="text-right p-3">مستوى الثقة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashFlowForecast.map((forecast, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{forecast.period}</td>
                          <td className="p-3 text-green-600">
                            +{forecast.cashInflow.toLocaleString()} ر.س
                          </td>
                          <td className="p-3 text-red-600">
                            -{forecast.cashOutflow.toLocaleString()} ر.س
                          </td>
                          <td className={`p-3 font-medium ${
                            forecast.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {forecast.netCashFlow >= 0 ? '+' : ''}{forecast.netCashFlow.toLocaleString()} ر.س
                          </td>
                          <td className="p-3 font-medium">
                            {forecast.cumulativeCashFlow.toLocaleString()} ر.س
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${forecast.confidence}%` }}
                                />
                              </div>
                              {forecast.confidence}%
                            </div>
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

        {/* Scenarios */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  سيناريوهات التخطيط المالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {scenarios.map((scenario, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 ${
                      scenario.type === 'optimistic' ? 'border-green-200 bg-green-50' :
                      scenario.type === 'pessimistic' ? 'border-red-200 bg-red-50' :
                      scenario.type === 'realistic' ? 'border-blue-200 bg-blue-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">{scenario.name}</h4>
                        <span className="text-sm font-medium">
                          احتمالية {scenario.probability}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي الإيرادات:</span>
                          <span className="font-medium">{scenario.totalRevenue.toLocaleString()} ر.س</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">إجمالي المصروفات:</span>
                          <span className="font-medium">{scenario.totalExpenses.toLocaleString()} ر.س</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">صافي الربح:</span>
                          <span className={`font-bold ${
                            scenario.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {scenario.netProfit.toLocaleString()} ر.س
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">هامش الربح:</span>
                          <span className="font-medium">{scenario.profitMargin.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Budget Analysis Tab */}
        {activeTab === 'analysis' && (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-24 w-24 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">تحليل الميزانية</h3>
                <p className="text-gray-500">سيتم تطوير هذا القسم قريباً مع تحليل الميزانية مقابل الفعلي</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BudgetPlanning;
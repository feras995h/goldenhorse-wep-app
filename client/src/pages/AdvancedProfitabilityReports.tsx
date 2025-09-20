import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { financialAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';

// Enhanced interfaces for advanced reporting
interface ProductProfit {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  unitsSold: number;
  averagePrice: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface CustomerProfit {
  customerId: string;
  customerName: string;
  customerCode: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  orderCount: number;
  averageOrderValue: number;
  lastOrderDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  ltv: number; // Lifetime Value
}

interface PeriodComparison {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  growth: number;
}

interface KPIMetric {
  label: string;
  value: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'percentage' | 'number';
  target?: number;
}

const AdvancedProfitabilityReports: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'customers' | 'trends'>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [comparisonPeriod, setComparisonPeriod] = useState('previous_month');
  
  // Data states
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [productProfits, setProductProfits] = useState<ProductProfit[]>([]);
  const [customerProfits, setCustomerProfits] = useState<CustomerProfit[]>([]);
  const [periodComparisons, setPeriodComparisons] = useState<PeriodComparison[]>([]);
  
  // Filtering and search
  const [searchValue, setSearchValue] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [profitThreshold, setProfitThreshold] = useState(0);
  
  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    loadProfitabilityData();
  }, [dateRange, comparisonPeriod, activeTab]);

  const loadProfitabilityData = async () => {
    try {
      setLoading(true);
      
      // Load KPI metrics
      const kpiResponse = await financialAPI.get('/reports/profitability/kpi', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          comparisonPeriod
        }
      });
      
      setKpiMetrics(kpiResponse.data || []);
      
      // Load data based on active tab
      switch (activeTab) {
        case 'products':
          await loadProductProfitability();
          break;
        case 'customers':
          await loadCustomerProfitability();
          break;
        case 'trends':
          await loadTrendAnalysis();
          break;
        default:
          await loadOverviewData();
      }
      
    } catch (error) {
      console.error('Error loading profitability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductProfitability = async () => {
    try {
      const response = await financialAPI.get('/reports/profitability/products', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          search: searchValue,
          minProfit: profitThreshold,
          page: pagination.current,
          limit: pagination.pageSize
        }
      });
      
      setProductProfits(response.data.products || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error('Error loading product profitability:', error);
    }
  };

  const loadCustomerProfitability = async () => {
    try {
      const response = await financialAPI.get('/reports/profitability/customers', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          search: searchValue,
          minProfit: profitThreshold,
          page: pagination.current,
          limit: pagination.pageSize
        }
      });
      
      setCustomerProfits(response.data.customers || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error('Error loading customer profitability:', error);
    }
  };

  const loadTrendAnalysis = async () => {
    try {
      const response = await financialAPI.get('/reports/profitability/trends', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          granularity: 'monthly'
        }
      });
      
      setPeriodComparisons(response.data.trends || []);
    } catch (error) {
      console.error('Error loading trend analysis:', error);
    }
  };

  const loadOverviewData = async () => {
    // Load overview data combining all metrics
    await Promise.all([
      loadProductProfitability(),
      loadCustomerProfitability(),
      loadTrendAnalysis()
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Product profitability columns
  const productColumns = [
    {
      key: 'productName',
      title: 'المنتج',
      render: (product: ProductProfit) => (
        <div className="font-medium">{product.productName}</div>
      )
    },
    {
      key: 'totalRevenue',
      title: 'إجمالي الإيرادات',
      render: (product: ProductProfit) => (
        <div className="text-right font-medium">
          {formatCurrency(product.totalRevenue)}
        </div>
      )
    },
    {
      key: 'grossProfit',
      title: 'إجمالي الربح',
      render: (product: ProductProfit) => (
        <div className="text-right font-medium">
          {formatCurrency(product.grossProfit)}
        </div>
      )
    },
    {
      key: 'profitMargin',
      title: 'هامش الربح',
      render: (product: ProductProfit) => (
        <div className="text-right">
          <span className={`font-medium ${product.profitMargin > 20 ? 'text-green-600' : 
            product.profitMargin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
            {formatPercentage(product.profitMargin)}
          </span>
        </div>
      )
    },
    {
      key: 'unitsSold',
      title: 'الكمية المباعة',
      render: (product: ProductProfit) => (
        <div className="text-right">{product.unitsSold.toLocaleString()}</div>
      )
    },
    {
      key: 'trend',
      title: 'الاتجاه',
      render: (product: ProductProfit) => (
        <div className="flex items-center justify-end">
          {getTrendIcon(product.trend)}
          <span className={`mr-1 text-sm ${getTrendColor(product.trend)}`}>
            {formatPercentage(product.trendPercentage)}
          </span>
        </div>
      )
    }
  ];

  // Customer profitability columns
  const customerColumns = [
    {
      key: 'customerName',
      title: 'العميل',
      render: (customer: CustomerProfit) => (
        <div>
          <div className="font-medium">{customer.customerName}</div>
          <div className="text-sm text-gray-500">{customer.customerCode}</div>
        </div>
      )
    },
    {
      key: 'totalRevenue',
      title: 'إجمالي الإيرادات',
      render: (customer: CustomerProfit) => (
        <div className="text-right font-medium">
          {formatCurrency(customer.totalRevenue)}
        </div>
      )
    },
    {
      key: 'grossProfit',
      title: 'إجمالي الربح',
      render: (customer: CustomerProfit) => (
        <div className="text-right font-medium">
          {formatCurrency(customer.grossProfit)}
        </div>
      )
    },
    {
      key: 'profitMargin',
      title: 'هامش الربح',
      render: (customer: CustomerProfit) => (
        <div className="text-right">
          <span className={`font-medium ${customer.profitMargin > 15 ? 'text-green-600' : 
            customer.profitMargin > 8 ? 'text-yellow-600' : 'text-red-600'}`}>
            {formatPercentage(customer.profitMargin)}
          </span>
        </div>
      )
    },
    {
      key: 'orderCount',
      title: 'عدد الطلبات',
      render: (customer: CustomerProfit) => (
        <div className="text-right">{customer.orderCount}</div>
      )
    },
    {
      key: 'ltv',
      title: 'القيمة الدائمة',
      render: (customer: CustomerProfit) => (
        <div className="text-right font-medium">
          {formatCurrency(customer.ltv)}
        </div>
      )
    },
    {
      key: 'riskLevel',
      title: 'مستوى المخاطر',
      render: (customer: CustomerProfit) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          customer.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
          customer.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {customer.riskLevel === 'low' ? 'منخفض' : 
           customer.riskLevel === 'medium' ? 'متوسط' : 'عالي'}
        </span>
      )
    }
  ];

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await financialAPI.get(`/reports/profitability/export/${format}`, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          type: activeTab
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `profitability-report-${activeTab}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">تقارير الربحية المتقدمة</h1>
            <p className="text-gray-600">تحليل شامل للربحية حسب المنتجات والعملاء والفترات الزمنية</p>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={() => exportReport('excel')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير Excel
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير PDF
            </button>
            <button
              onClick={loadProfitabilityData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>
        </div>

        {/* Date Range and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">فترة المقارنة</label>
              <select
                value={comparisonPeriod}
                onChange={(e) => setComparisonPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="previous_month">الشهر السابق</option>
                <option value="previous_quarter">الربع السابق</option>
                <option value="previous_year">السنة السابقة</option>
                <option value="same_period_last_year">نفس الفترة العام الماضي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حد الربح الأدنى</label>
              <input
                type="number"
                value={profitThreshold}
                onChange={(e) => setProfitThreshold(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {kpiMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.format === 'currency' ? formatCurrency(metric.value) :
                   metric.format === 'percentage' ? formatPercentage(metric.value) :
                   metric.value.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm mr-1 ${getTrendColor(metric.trend)}`}>
                    {metric.format === 'percentage' ? formatPercentage(metric.change) : 
                     `${metric.change > 0 ? '+' : ''}${metric.change.toFixed(1)}`}
                  </span>
                  <span className="text-xs text-gray-500 mr-1">مقارنة بالفترة السابقة</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 space-x-reverse">
            {[
              { key: 'overview', label: 'نظرة عامة', icon: BarChart3 },
              { key: 'products', label: 'ربحية المنتجات', icon: Package },
              { key: 'customers', label: 'ربحية العملاء', icon: Users },
              { key: 'trends', label: 'تحليل الاتجاهات', icon: TrendingUp }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 ml-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'products' && (
          <div className="p-6">
            <div className="mb-4">
              <SearchFilter
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                placeholder="البحث في المنتجات..."
              />
            </div>
            <DataTable
              data={productProfits}
              columns={productColumns}
              loading={loading}
              pagination={{
                ...pagination,
                onChange: (page: number) => setPagination(prev => ({ ...prev, current: page }))
              }}
            />
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="p-6">
            <div className="mb-4">
              <SearchFilter
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                placeholder="البحث في العملاء..."
              />
            </div>
            <DataTable
              data={customerProfits}
              columns={customerColumns}
              loading={loading}
              pagination={{
                ...pagination,
                onChange: (page: number) => setPagination(prev => ({ ...prev, current: page }))
              }}
            />
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تحليل الاتجاهات الزمنية</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart Placeholder */}
                <div className="bg-gray-50 rounded-lg p-6 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">مخطط الاتجاهات</p>
                  </div>
                </div>
                
                {/* Period Comparison Table */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">مقارنة الفترات</h4>
                  <div className="space-y-3">
                    {periodComparisons.slice(0, 6).map((period, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">{period.period}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(period.profit)}</div>
                          <div className={`text-xs ${period.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {period.growth > 0 ? '+' : ''}{formatPercentage(period.growth)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">أعلى المنتجات ربحية</h3>
                <div className="space-y-3">
                  {productProfits.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{product.productName}</div>
                        <div className="text-xs text-gray-600">{product.unitsSold} وحدة</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatCurrency(product.grossProfit)}</div>
                        <div className="text-xs text-gray-600">{formatPercentage(product.profitMargin)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Customers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">أعلى العملاء ربحية</h3>
                <div className="space-y-3">
                  {customerProfits.slice(0, 5).map((customer, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{customer.customerName}</div>
                        <div className="text-xs text-gray-600">{customer.orderCount} طلب</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatCurrency(customer.grossProfit)}</div>
                        <div className="text-xs text-gray-600">{formatPercentage(customer.profitMargin)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedProfitabilityReports;
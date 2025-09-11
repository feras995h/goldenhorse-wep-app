import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Package, Calendar, Download, Filter, Eye, RefreshCw } from 'lucide-react';
import { salesAPI } from '../services/api';
import { SearchFilter } from '../components/UI/SearchFilter';

interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalPurchases: number;
    orderCount: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  salesTrend: Array<{
    date: string;
    amount: number;
    orders: number;
  }>;
}

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  customerId: string;
  productCategory: string;
  reportType: 'summary' | 'detailed' | 'customer' | 'product';
}

const SalesReports: React.FC = () => {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [categories] = useState(['إلكترونيات', 'مكتبية', 'منزلية', 'طبية', 'صناعية', 'غذائية']);
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    customerId: '',
    productCategory: '',
    reportType: 'summary'
  });

  useEffect(() => {
    loadCustomers();
    generateReport();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await salesAPI.getCustomers({ limit: 1000 });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API call
      const mockReport: SalesReport = {
        period: `${filters.dateFrom} إلى ${filters.dateTo}`,
        totalSales: 125000,
        totalOrders: 85,
        averageOrderValue: 1470.59,
        topCustomers: [
          { id: '1', name: 'شركة الأمل التجارية', totalPurchases: 25000, orderCount: 12 },
          { id: '2', name: 'محمد أحمد علي', totalPurchases: 18500, orderCount: 8 },
          { id: '3', name: 'مؤسسة النور', totalPurchases: 15200, orderCount: 6 },
          { id: '4', name: 'فاطمة محمود', totalPurchases: 12800, orderCount: 9 },
          { id: '5', name: 'شركة التقدم', totalPurchases: 11000, orderCount: 5 }
        ],
        topProducts: [
          { id: '1', name: 'منتج إلكتروني أ', quantitySold: 45, revenue: 22500 },
          { id: '2', name: 'منتج مكتبي ب', quantitySold: 120, revenue: 18000 },
          { id: '3', name: 'منتج منزلي ج', quantitySold: 80, revenue: 16000 },
          { id: '4', name: 'منتج طبي د', quantitySold: 25, revenue: 12500 },
          { id: '5', name: 'منتج صناعي هـ', quantitySold: 60, revenue: 9000 }
        ],
        salesByCategory: [
          { category: 'إلكترونيات', amount: 45000, percentage: 36 },
          { category: 'مكتبية', amount: 30000, percentage: 24 },
          { category: 'منزلية', amount: 25000, percentage: 20 },
          { category: 'طبية', amount: 15000, percentage: 12 },
          { category: 'صناعية', amount: 10000, percentage: 8 }
        ],
        salesTrend: [
          { date: '2024-01-01', amount: 8500, orders: 6 },
          { date: '2024-01-02', amount: 12000, orders: 8 },
          { date: '2024-01-03', amount: 9500, orders: 7 },
          { date: '2024-01-04', amount: 15000, orders: 10 },
          { date: '2024-01-05', amount: 11000, orders: 8 },
          { date: '2024-01-06', amount: 13500, orders: 9 },
          { date: '2024-01-07', amount: 16000, orders: 12 }
        ]
      };
      
      setReport(mockReport);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // TODO: Implement export functionality
    console.log('Exporting report...');
  };

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} د.ل`;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 30) return 'text-green-600';
    if (percentage >= 20) return 'text-blue-600';
    if (percentage >= 10) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 ml-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تقارير المبيعات</h1>
                <p className="text-gray-600 mt-1">تحليل شامل لأداء المبيعات</p>
              </div>
            </div>
            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={generateReport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                onClick={exportReport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">فلاتر التقرير</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
              <select
                value={filters.customerId}
                onChange={(e) => updateFilter('customerId', e.target.value)}
                className="form-select"
              >
                <option value="">جميع العملاء</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
              <select
                value={filters.productCategory}
                onChange={(e) => updateFilter('productCategory', e.target.value)}
                className="form-select"
              >
                <option value="">جميع الفئات</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع التقرير</label>
              <select
                value={filters.reportType}
                onChange={(e) => updateFilter('reportType', e.target.value)}
                className="form-select"
              >
                <option value="summary">ملخص</option>
                <option value="detailed">مفصل</option>
                <option value="customer">حسب العميل</option>
                <option value="product">حسب المنتج</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={generateReport}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'جاري إنشاء التقرير...' : 'إنشاء التقرير'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">جاري إنشاء التقرير...</p>
          </div>
        )}

        {!loading && report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">إجمالي المبيعات</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(report.totalSales)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">عدد الطلبات</p>
                    <p className="text-2xl font-bold text-gray-900">{report.totalOrders}</p>
                  </div>
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">متوسط قيمة الطلب</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(report.averageOrderValue)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Customers */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">أفضل العملاء</h3>
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {report.topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm ml-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.orderCount} طلب</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(customer.totalPurchases)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">أفضل المنتجات</h3>
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {report.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-medium text-sm ml-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.quantitySold} وحدة</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sales by Category */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">المبيعات حسب الفئة</h3>
              <div className="space-y-4">
                {report.salesByCategory.map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="font-medium text-gray-900 w-24">{category.category}</span>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`font-medium ${getPercentageColor(category.percentage)}`}>
                        {category.percentage}%
                      </span>
                    </div>
                    <div className="text-right ml-4">
                      <span className="font-medium text-gray-900">{formatCurrency(category.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Trend */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">اتجاه المبيعات</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التاريخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        عدد الطلبات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        متوسط الطلب
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.salesTrend.map((day) => (
                      <tr key={day.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(day.date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(day.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {day.orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(day.amount / day.orders)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesReports;

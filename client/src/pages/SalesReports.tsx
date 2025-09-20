import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Package, Calendar, Download, Filter, Eye, RefreshCw } from 'lucide-react';
import { salesAPI } from '../services/api';
import SearchFilter from '../components/Financial/SearchFilter';

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

      const baseParams = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        customerId: filters.customerId || undefined,
        productCategory: filters.productCategory || undefined,
      } as const;

      const [summaryRes, customersRes, detailedRes, productRes] = await Promise.all([
        salesAPI.getSalesReports({ ...baseParams, reportType: 'summary' }),
        salesAPI.getSalesReports({ ...baseParams, reportType: 'customer' }),
        salesAPI.getSalesReports({ ...baseParams, reportType: 'detailed' }),
        salesAPI.getSalesReports({ ...baseParams, reportType: 'product' }),
      ]);

      const totalSales = Number(summaryRes?.summary?.totalAmount || 0);
      const totalOrders = Number(summaryRes?.summary?.invoiceCount || 0);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      const topCustomers = (customersRes?.data || [])
        .map((row: any) => ({
          id: String(row.customerId || row['customer.id'] || ''),
          name: row['customer.name'] || row.customer?.name || 'غير معروف',
          totalPurchases: Number(row.totalAmount || 0),
          orderCount: Number(row.invoiceCount || 0),
        }))
        .sort((a: any, b: any) => b.totalPurchases - a.totalPurchases)
        .slice(0, 5);

      const detailedRows: any[] = (detailedRes?.data || []).map((inv: any) => ({
        date: inv.date,
        total: Number(inv.total || 0),
      }));
      const trendMap = new Map<string, { amount: number; orders: number }>();
      detailedRows.forEach((row) => {
        const d = String(row.date).slice(0, 10);
        const prev = trendMap.get(d) || { amount: 0, orders: 0 };
        prev.amount += row.total;
        prev.orders += 1;
        trendMap.set(d, prev);
      });
      const salesTrend = Array.from(trendMap.entries())
        .map(([date, v]) => ({ date, amount: v.amount, orders: v.orders }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const catRows: any[] = productRes?.data || [];
      const totalByCat = catRows.reduce((s, r: any) => s + Number(r.totalAmount || 0), 0);
      const salesByCategory = catRows.map((r: any) => ({
        category: r.category || 'غير مصنف',
        amount: Number(r.totalAmount || 0),
        percentage: totalByCat > 0 ? Math.round((Number(r.totalAmount || 0) / totalByCat) * 100) : 0,
      }));

      const assembled: SalesReport = {
        period: `${filters.dateFrom} إلى ${filters.dateTo}`,
        totalSales,
        totalOrders,
        averageOrderValue,
        topCustomers,
        topProducts: [], // غير متوفر حالياً من الطرف الخلفي
        salesByCategory,
        salesTrend,
      };
      setReport(assembled);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };


  const exportReport = () => {
    if (!report) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    try {
      // إنشاء محتوى CSV
      let csvContent = 'تقرير المبيعات\n';
      csvContent += `الفترة: ${report.period}\n\n`;

      // الملخص العام
      csvContent += 'الملخص العام\n';
      csvContent += `إجمالي المبيعات,${report.totalSales}\n`;
      csvContent += `عدد الطلبات,${report.totalOrders}\n`;
      csvContent += `متوسط قيمة الطلب,${report.averageOrderValue.toFixed(2)}\n\n`;

      // أفضل العملاء
      if (report.topCustomers.length > 0) {
        csvContent += 'أفضل العملاء\n';
        csvContent += 'اسم العميل,إجمالي المشتريات,عدد الطلبات\n';
        report.topCustomers.forEach(customer => {
          csvContent += `${customer.name},${customer.totalPurchases},${customer.orderCount}\n`;
        });
        csvContent += '\n';
      }

      // المبيعات حسب الفئة
      if (report.salesByCategory.length > 0) {
        csvContent += 'المبيعات حسب الفئة\n';
        csvContent += 'الفئة,المبلغ,النسبة المئوية\n';
        report.salesByCategory.forEach(category => {
          csvContent += `${category.category},${category.amount},${category.percentage}%\n`;
        });
        csvContent += '\n';
      }

      // تنزيل الملف
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `تقرير_المبيعات_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error);
      alert('حدث خطأ في تصدير التقرير');
    }
  };

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount: number) => {
    return `${(isNaN(amount) || !isFinite(amount) ? 0 : amount).toLocaleString('ar-LY')} د.ل`;
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 ml-3" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">تقارير المبيعات</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">تحليل شامل لأداء المبيعات</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse w-full sm:w-auto">
              <button
                onClick={generateReport}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                onClick={exportReport}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
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

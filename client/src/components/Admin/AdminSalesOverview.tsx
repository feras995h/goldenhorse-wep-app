import React from 'react';
import { ShoppingCart, Users, Package, Receipt, AlertTriangle, TrendingUp } from 'lucide-react';
import TailAdminDashboardCard from '../TailAdmin/Cards/TailAdminDashboardCard';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  activeCustomers: number;
  newCustomers: number;
  averageOrderValue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  monthlySales: Array<{
    month: string;
    amount: number;
    orders: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    totalPurchases: number;
    orders: number;
  }>;
  salesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

interface AdminSalesOverviewProps {
  data: SalesData;
  loading?: boolean;
  onNavigateToSales?: () => void;
}

const AdminSalesOverview: React.FC<AdminSalesOverviewProps> = ({
  data,
  loading = false,
  onNavigateToSales
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <ShoppingCart className="h-6 w-6 text-blue-600 ml-3" />
          <h3 className="text-lg font-semibold text-gray-900">نظرة المبيعات</h3>
        </div>
        {onNavigateToSales && (
          <button
            onClick={onNavigateToSales}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            عرض التفاصيل ←
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Key Sales Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <TailAdminDashboardCard
            title="إجمالي المبيعات"
            value={data.totalSales}
            icon={ShoppingCart}
            color="primary"
            currency="د.ل"
            trend={{
              direction: data.totalSales > 0 ? 'up' : 'neutral',
              percentage: 0,
              period: 'من الشهر الماضي'
            }}
          />
          
          <TailAdminDashboardCard
            title="إجمالي الطلبات"
            value={data.totalOrders}
            icon={Receipt}
            color="success"
            trend={{
              direction: data.totalOrders > 0 ? 'up' : 'neutral',
              percentage: 0,
              period: 'من الشهر الماضي'
            }}
          />
          
          <TailAdminDashboardCard
            title="العملاء النشطين"
            value={data.activeCustomers}
            icon={Users}
            color="info"
            trend={{
              direction: data.activeCustomers > 0 ? 'up' : 'neutral',
              percentage: 0,
              period: `+${data.newCustomers || 0} عميل جديد`
            }}
          />
        </div>

        {/* Additional Sales Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Receipt className="h-5 w-5 text-gray-600 ml-2" />
              ملخص الفواتير
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">إجمالي الفواتير</span>
                <span className="font-medium">{data.totalInvoices}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">الفواتير المدفوعة</span>
                <span className="font-medium text-green-600">{data.paidInvoices}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">الفواتير المعلقة</span>
                <span className="font-medium text-yellow-600">{data.pendingInvoices}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">الفواتير المتأخرة</span>
                <span className="font-medium text-red-600">{data.overdueInvoices}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">متوسط قيمة الطلب</span>
                <span className="font-medium text-blue-600">{formatCurrency(data.averageOrderValue)}</span>
              </div>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Package className="h-5 w-5 text-orange-600 ml-2" />
              تنبيهات المخزون
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">إجمالي المنتجات</span>
                <span className="font-medium">{data.totalProducts}</span>
              </div>
              
              {data.lowStockItems > 0 && (
                <div className="flex items-center justify-between p-2 bg-yellow-100 rounded">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 ml-2" />
                    <span className="text-sm font-medium text-yellow-800">مخزون منخفض</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-800">{data.lowStockItems}</span>
                </div>
              )}
              
              {data.outOfStockItems > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-100 rounded">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 ml-2" />
                    <span className="text-sm font-medium text-red-800">نفد المخزون</span>
                  </div>
                  <span className="text-sm font-bold text-red-800">{data.outOfStockItems}</span>
                </div>
              )}
              
              {data.lowStockItems === 0 && data.outOfStockItems === 0 && (
                <div className="text-center text-sm text-green-600 font-medium">
                  ✓ جميع المنتجات متوفرة
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        {data.topCustomers && data.topCustomers.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-600 ml-2" />
              أفضل العملاء
            </h4>
            <div className="space-y-2">
              {data.topCustomers.slice(0, 5).map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-xs ml-3">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(customer.totalPurchases)}</div>
                    <div className="text-xs text-gray-500">{customer.orders} طلب</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sales by Category */}
        {data.salesByCategory && data.salesByCategory.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">المبيعات حسب الفئة</h4>
            <div className="space-y-2">
              {data.salesByCategory.slice(0, 5).map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 ml-2">{formatCurrency(category.amount)}</span>
                    <span className="text-xs text-gray-500">({category.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesOverview;

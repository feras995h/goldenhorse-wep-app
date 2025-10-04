import React, { useEffect, useState } from 'react';
import { ShoppingCart, Users, Package, BarChart3, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import { salesAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  activeCustomers: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  totalInvoices: number;
  totalPayments: number;
  lowStockItems: number;
}

interface CustomerLite {
  id: string;
  name: string;
  phone?: string;
  balance?: number;
}

const SalesDashboard: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [shipmentsSummary, setShipmentsSummary] = useState<{ statuses?: Record<string, number> } | null>(null);
  const [etaMetrics, setEtaMetrics] = useState<{ delayedCount: number; avgDelayDays: number } | null>(null);
  const [topDelays, setTopDelays] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [shipmentsLoading, setShipmentsLoading] = useState<boolean>(false);
  const [etaLoading, setEtaLoading] = useState<boolean>(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [summary, customersData] = await Promise.all([
        salesAPI.getSalesSummary().catch(() => ({
          totalSales: 0,
          totalOrders: 0,
          activeCustomers: 0,
          averageOrderValue: 0,
          monthlyGrowth: 0,
          totalInvoices: 0,
          totalPayments: 0,
          lowStockItems: 0
        })),
        salesAPI.getCustomers({ limit: 8 }).catch(() => ({ data: [] }))
      ]);

      setSalesData(summary as SalesSummary);
      const list = (customersData as any)?.data || customersData || [];
      setCustomers(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }

    // Load shipping metrics in parallel (non-blocking)
    void (async () => {
      try {
        setShipmentsLoading(true);
        const sum = await salesAPI.getShipmentsSummary();
        setShipmentsSummary(sum?.data || sum || { statuses: {} });
      } catch {
        setShipmentsSummary({ statuses: {} });
      } finally {
        setShipmentsLoading(false);
      }
    })();

    void (async () => {
      try {
        setEtaLoading(true);
        const eta = await salesAPI.getShipmentsEtaMetrics();
        setEtaMetrics(eta?.data || eta || { delayedCount: 0, avgDelayDays: 0 });
      } catch {
        setEtaMetrics({ delayedCount: 0, avgDelayDays: 0 });
      } finally {
        setEtaLoading(false);
      }
    })();

    void (async () => {
      try {
        const res = await salesAPI.getTopDelayedShipments(10);
        setTopDelays(res?.data || res || []);
      } catch {
        setTopDelays([]);
      }
    })();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="card-gradient border-r-4 border-blue-500 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ml-3 sm:ml-4">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">لوحة المبيعات والشحن الدولي</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">متابعة الأداء، الشحنات الدولية، والارتباط بالنظام المحاسبي</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button onClick={loadAll} className="btn btn-secondary text-xs sm:text-sm flex items-center px-3 py-2">
              <RefreshCw className="h-4 w-4 ml-2" /> تحديث البيانات
            </button>
            <button onClick={() => (window.location.href = '/sales/invoice-management')} className="btn btn-primary text-xs sm:text-sm px-3 py-2">
              إدارة الفواتير
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard title="إجمالي المبيعات" value={formatCurrency(salesData?.totalSales || 0)} color="blue" icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />} />
        <KPICard title="إجمالي الشحنات/الطلبيات" value={`${salesData?.totalOrders || 0}`} color="green" icon={<ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />} />
        <KPICard title="متوسط قيمة الطلب" value={formatCurrency(salesData?.averageOrderValue || 0)} color="purple" icon={<BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />} />
        <KPICard title="العملاء النشطون" value={`${salesData?.activeCustomers || 0}`} color="orange" icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />} />
      </div>

      {/* International Shipping KPIs */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900">مؤشرات الشحن الدولي</h4>
          <button onClick={() => { loadAll(); }} className="btn btn-secondary text-xs">تحديث</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { key: 'pending', label: 'قيد الإعداد' },
            { key: 'in_transit', label: 'في الطريق' },
            { key: 'arrived', label: 'وصلت' },
            { key: 'customs_clearance', label: 'في الجمارك' },
            { key: 'cleared', label: 'مخلي' },
            { key: 'delivered', label: 'تم التسليم' }
          ].map((s) => (
            <div key={s.key} className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">{s.label}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{shipmentsLoading ? '...' : (shipmentsSummary?.statuses?.[s.key] ?? 0)}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">الشحنات المتأخرة</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{etaLoading ? '...' : (etaMetrics?.delayedCount ?? 0)}</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">متوسط التأخير (أيام)</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{etaLoading ? '...' : (etaMetrics?.avgDelayDays ?? 0)}</p>
          </div>
        </div>
        <div className="mt-4">
          <h5 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">أعلى الشحنات تأخيرًا</h5>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2 pr-3 text-right">التتبع</th>
                  <th className="py-2 pr-3 text-right">العميل</th>
                  <th className="py-2 pr-3 text-right">ETA</th>
                  <th className="py-2 pr-3 text-right">تاريخ التسليم</th>
                  <th className="py-2 pr-3 text-right">التأخير (أيام)</th>
                </tr>
              </thead>
              <tbody>
                {(topDelays || []).map((s: any) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-3">{s.trackingnumber || s.trackingNumber}</td>
                    <td className="py-2 pr-3">{s.customername || s.customerName}</td>
                    <td className="py-2 pr-3">{s.estimateddelivery || s.estimatedDelivery || '-'}</td>
                    <td className="py-2 pr-3">{s.actualdeliverydate || s.actualDeliveryDate || '-'}</td>
                    <td className="py-2 pr-3 font-semibold text-amber-700">{s.delay_days}</td>
                  </tr>
                ))}
                {(topDelays || []).length === 0 && (
                  <tr>
                    <td className="py-3 pr-3 text-gray-500" colSpan={5}>لا توجد شحنات متأخرة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 ml-2" />
          الإجراءات السريعة
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <QuickAction title="إدارة الشحنات" description="تتبع الشحنات من الصين إلى ليبيا" onClick={() => (window.location.href = '/sales/inventory')} />
          <QuickAction title="إدارة الفواتير" description="نظام فواتير موحد ومتوافق محاسبياً" onClick={() => (window.location.href = '/sales/invoice-management')} />
          <QuickAction title="تقارير المبيعات" description="تقارير الأداء والمبيعات" onClick={() => (window.location.href = '/sales/reports')} />
          <QuickAction title="إدارة العملاء" description="إضافة وإدارة عملاء الشحن" onClick={() => (window.location.href = '/sales/customers')} />
        </div>
      </div>

      {/* Customers Snapshot and Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">أفضل العملاء</h3>
            <button onClick={() => (window.location.href = '/sales/customers')} className="text-blue-600 hover:text-blue-800 text-xs">إدارة العملاء</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr className="text-gray-600">
                  <th className="py-2 pr-3 text-right">العميل</th>
                  <th className="py-2 pr-3 text-right">الهاتف</th>
                  <th className="py-2 pr-3 text-right">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 8).map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2 pr-3">{c.name}</td>
                    <td className="py-2 pr-3">{c.phone || '-'}</td>
                    <td className="py-2 pr-3 font-semibold">{formatCurrency((c as any).balance || 0)}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td className="py-3 pr-3 text-gray-500" colSpan={3}>لا توجد بيانات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">آخر الفواتير</h3>
            <button onClick={() => (window.location.href = '/sales/invoice-management')} className="text-blue-600 hover:text-blue-800 text-xs">عرض الكل</button>
          </div>
          <RecentInvoicesWidget />
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{ title: string; value: string; color: 'blue' | 'green' | 'purple' | 'orange'; icon: React.ReactNode }> = ({ title, value, color, icon }) => (
  <div className={`card border-r-4 p-4 sm:p-6 border-${color}-500`}>
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{title}</p>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{value}</p>
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ml-3 bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
    </div>
  </div>
);

const QuickAction: React.FC<{ title: string; description: string; onClick: () => void }> = ({ title, description, onClick }) => (
  <button onClick={onClick} className="bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-right">
    <h5 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">{title}</h5>
    <p className="text-[11px] sm:text-xs text-gray-600">{description}</p>
  </button>
);

const RecentInvoicesWidget: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await salesAPI.getSalesInvoicesV2({ limit: 10, page: 1 });
        const data = (res as any)?.data || (res as any)?.items || (res as any) || [];
        setInvoices(Array.isArray(data) ? data.slice(0, 10) : []);
      } catch {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-gray-50">
          <tr className="text-gray-600">
            <th className="py-2 pr-3 text-right">رقم الفاتورة</th>
            <th className="py-2 pr-3 text-right">العميل</th>
            <th className="py-2 pr-3 text-right">التاريخ</th>
            <th className="py-2 pr-3 text-right">الإجمالي</th>
            <th className="py-2 pr-3 text-right">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td className="py-3 pr-3" colSpan={5}>جاري التحميل...</td></tr>
          )}
          {!loading && invoices.length === 0 && (
            <tr><td className="py-3 pr-3 text-gray-500" colSpan={5}>لا توجد بيانات</td></tr>
          )}
          {invoices.map((inv: any) => (
            <tr key={inv.id} className="border-t">
              <td className="py-2 pr-3">{inv.invoiceNumber || inv.number || inv.code}</td>
              <td className="py-2 pr-3">{inv.customerName || inv.customer || '-'}</td>
              <td className="py-2 pr-3">{inv.date ? new Date(inv.date).toLocaleDateString('ar-EG') : '-'}</td>
              <td className="py-2 pr-3 font-semibold">{formatCurrency(inv.totalAmount || inv.total || 0)}</td>
              <td className="py-2 pr-3">
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{inv.status || 'غير محدد'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesDashboard;

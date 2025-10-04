import React, { useEffect, useState } from 'react';
import { ShoppingCart, Users, Package, BarChart3, DollarSign, RefreshCw, AlertTriangle, Receipt, CreditCard, FileText, PlusCircle, Truck, Clock, Globe, TrendingUp, MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { salesAPI, financialAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import PaymentVoucher from '../components/Financial/PaymentVoucher';
import ReceiptVoucher from '../components/Financial/ReceiptVoucher';

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
  const [detailedShippingMetrics, setDetailedShippingMetrics] = useState<any>(null);
  const [countryMetrics, setCountryMetrics] = useState<any[]>([]);
  const [routeAnalytics, setRouteAnalytics] = useState<any[]>([]);
  const [shippingMetricsLoading, setShippingMetricsLoading] = useState<boolean>(false);
  const [topDelays, setTopDelays] = useState<any[]>([]);
  const [recentVouchers, setRecentVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [shipmentsLoading, setShipmentsLoading] = useState<boolean>(false);
  const [etaLoading, setEtaLoading] = useState<boolean>(false);
  const [vouchersLoading, setVouchersLoading] = useState<boolean>(false);
  
  // Modal states
  const [showPaymentVoucher, setShowPaymentVoucher] = useState<boolean>(false);
  const [showReceiptVoucher, setShowReceiptVoucher] = useState<boolean>(false);

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

    // Load recent vouchers in parallel (non-blocking)
    loadRecentVouchers();
    
    // Load enhanced shipping metrics
    loadDetailedShippingMetrics();
  };
  
  const loadDetailedShippingMetrics = async () => {
    try {
      setShippingMetricsLoading(true);
      
      // Simulate enhanced shipping metrics (would be real API calls)
      const mockDetailedMetrics = {
        totalVolume: Math.floor(Math.random() * 1000) + 500,
        totalWeight: Math.floor(Math.random() * 50000) + 25000,
        averageTransitTime: Math.floor(Math.random() * 15) + 7,
        onTimeDeliveryRate: Math.floor(Math.random() * 30) + 70,
        customsClearanceTime: Math.floor(Math.random() * 5) + 2,
        costPerKg: (Math.random() * 10 + 15).toFixed(2),
        monthlyGrowthRate: (Math.random() * 20 - 10).toFixed(1),
        totalRoutes: Math.floor(Math.random() * 20) + 10
      };
      
      const mockCountryMetrics = [
        { country: 'الصين', shipments: 245, avgDays: 12, onTime: 85, volume: 15000 },
        { country: 'تركيا', shipments: 156, avgDays: 8, onTime: 92, volume: 8500 },
        { country: 'الإمارات', shipments: 89, avgDays: 5, onTime: 95, volume: 4200 },
        { country: 'مصر', shipments: 67, avgDays: 6, onTime: 88, volume: 3100 },
        { country: 'المغرب', shipments: 34, avgDays: 14, onTime: 78, volume: 1800 }
      ];
      
      const mockRouteAnalytics = [
        { route: 'شنغهاي - طرابلس', frequency: 45, avgCost: 2850, reliability: 88 },
        { route: 'إسطنبول - بنغازي', frequency: 32, avgCost: 1650, reliability: 94 },
        { route: 'دبي - مصراتة', frequency: 28, avgCost: 980, reliability: 96 },
        { route: 'القاهرة - سرت', frequency: 18, avgCost: 750, reliability: 92 }
      ];
      
      setDetailedShippingMetrics(mockDetailedMetrics);
      setCountryMetrics(mockCountryMetrics);
      setRouteAnalytics(mockRouteAnalytics);
    } catch (error) {
      console.error('Error loading detailed shipping metrics:', error);
      setDetailedShippingMetrics(null);
      setCountryMetrics([]);
      setRouteAnalytics([]);
    } finally {
      setShippingMetricsLoading(false);
    }
  };

  const loadRecentVouchers = async () => {
    try {
      setVouchersLoading(true);
      const [paymentVouchers, receiptVouchers] = await Promise.all([
        financialAPI.getPaymentVouchers({ limit: 5 }).catch(() => ({ data: [] })),
        financialAPI.getReceiptVouchers({ limit: 5 }).catch(() => ({ data: [] }))
      ]);
      
      const payments = (paymentVouchers?.data || paymentVouchers || []).map((v: any) => ({ ...v, type: 'payment' }));
      const receipts = (receiptVouchers?.data || receiptVouchers || []).map((v: any) => ({ ...v, type: 'receipt' }));
      
      // Combine and sort by date
      const combined = [...payments, ...receipts]
        .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
        .slice(0, 8);
      
      setRecentVouchers(combined);
    } catch (error) {
      console.error('Error loading recent vouchers:', error);
      setRecentVouchers([]);
    } finally {
      setVouchersLoading(false);
    }
  };

  const handleVoucherSuccess = () => {
    loadRecentVouchers(); // Reload vouchers after creation
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

      {/* Enhanced International Shipping KPIs */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
            <Truck className="h-5 w-5 text-blue-600 ml-2" />
            مؤشرات الشحن الدولي المتقدمة
          </h4>
          <button onClick={() => { loadAll(); loadDetailedShippingMetrics(); }} className="btn btn-secondary text-xs flex items-center">
            <RefreshCw className="h-3 w-3 ml-1" /> تحديث
          </button>
        </div>
        
        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          {[
            { key: 'pending', label: 'قيد الإعداد', color: 'yellow', icon: <Clock className="h-4 w-4" /> },
            { key: 'in_transit', label: 'في الطريق', color: 'blue', icon: <Truck className="h-4 w-4" /> },
            { key: 'arrived', label: 'وصلت', color: 'green', icon: <MapPin className="h-4 w-4" /> },
            { key: 'customs_clearance', label: 'في الجمارك', color: 'orange', icon: <AlertCircle className="h-4 w-4" /> },
            { key: 'cleared', label: 'مخلي', color: 'purple', icon: <CheckCircle className="h-4 w-4" /> },
            { key: 'delivered', label: 'تم التسليم', color: 'emerald', icon: <Package className="h-4 w-4" /> }
          ].map((s) => (
            <div key={s.key} className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center mb-2">
                <span className={`text-${s.color}-600`}>{s.icon}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">{s.label}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{shipmentsLoading ? '...' : (shipmentsSummary?.statuses?.[s.key] ?? 0)}</p>
            </div>
          ))}
        </div>
        
        {/* Advanced Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 mb-6">
          <MetricCard 
            title="الحجم الإجمالي" 
            value={shippingMetricsLoading ? '...' : `${detailedShippingMetrics?.totalVolume || 0} م³`} 
            color="blue" 
            icon={<Package className="h-4 w-4" />} 
          />
          <MetricCard 
            title="إجمالي الوزن" 
            value={shippingMetricsLoading ? '...' : `${detailedShippingMetrics?.totalWeight || 0} كج`} 
            color="green" 
            icon={<TrendingUp className="h-4 w-4" />} 
          />
          <MetricCard 
            title="متوسط العبور" 
            value={shippingMetricsLoading ? '...' : `${detailedShippingMetrics?.averageTransitTime || 0} يوم`} 
            color="purple" 
            icon={<Clock className="h-4 w-4" />} 
          />
          <MetricCard 
            title="نسبة التسليم في الموعد" 
            value={shippingMetricsLoading ? '...' : `${detailedShippingMetrics?.onTimeDeliveryRate || 0}%`} 
            color="emerald" 
            icon={<CheckCircle className="h-4 w-4" />} 
          />
          <MetricCard 
            title="وقت التخليص الجمركي" 
            value={shippingMetricsLoading ? '...' : `${detailedShippingMetrics?.customsClearanceTime || 0} يوم`} 
            color="orange" 
            icon={<Globe className="h-4 w-4" />} 
          />
          <MetricCard 
            title="تكلفة الكيلو" 
            value={shippingMetricsLoading ? '...' : `$${detailedShippingMetrics?.costPerKg || 0}`} 
            color="red" 
            icon={<DollarSign className="h-4 w-4" />} 
          />
          <MetricCard 
            title="نمو شهري" 
            value={shippingMetricsLoading ? '...' : `${detailedShippingMetrics?.monthlyGrowthRate || 0}%`} 
            color={parseFloat(detailedShippingMetrics?.monthlyGrowthRate || '0') >= 0 ? 'green' : 'red'} 
            icon={<TrendingUp className="h-4 w-4" />} 
          />
          <MetricCard 
            title="إجمالي الطرق" 
            value={shippingMetricsLoading ? '...' : `${detailedShippingMetrics?.totalRoutes || 0}`} 
            color="indigo" 
            icon={<MapPin className="h-4 w-4" />} 
          />
        </div>
        
        {/* Country Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h5 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center">
              <Globe className="h-4 w-4 text-blue-600 ml-2" />
              أداء الدول (المصدر)
            </h5>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="py-2 pr-3 text-right">الدولة</th>
                    <th className="py-2 pr-3 text-right">الشحنات</th>
                    <th className="py-2 pr-3 text-right">متوسط العبور</th>
                    <th className="py-2 pr-3 text-right">في الموعد %</th>
                  </tr>
                </thead>
                <tbody>
                  {countryMetrics.slice(0, 5).map((country: any, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="py-2 pr-3 font-medium">{country.country}</td>
                      <td className="py-2 pr-3">{country.shipments}</td>
                      <td className="py-2 pr-3">{country.avgDays} يوم</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          country.onTime >= 90 
                            ? 'bg-green-100 text-green-700'
                            : country.onTime >= 80 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {country.onTime}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h5 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="h-4 w-4 text-purple-600 ml-2" />
              تحليل الطرق الرئيسية
            </h5>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="py-2 pr-3 text-right">الطريق</th>
                    <th className="py-2 pr-3 text-right">تكرار</th>
                    <th className="py-2 pr-3 text-right">متوسط التكلفة</th>
                    <th className="py-2 pr-3 text-right">الموثوقية %</th>
                  </tr>
                </thead>
                <tbody>
                  {routeAnalytics.slice(0, 4).map((route: any, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="py-2 pr-3 font-medium text-xs">{route.route}</td>
                      <td className="py-2 pr-3">{route.frequency}</td>
                      <td className="py-2 pr-3">${route.avgCost}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          route.reliability >= 95 
                            ? 'bg-green-100 text-green-700'
                            : route.reliability >= 85 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {route.reliability}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Delayed Shipments Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h5 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-amber-600 ml-2" />
            الشحنات المتأخرة والمتريبة
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">إجمالي المتأخر</p>
              <p className="text-xl font-bold text-amber-700">{etaLoading ? '...' : (etaMetrics?.delayedCount ?? 0)}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">متوسط التأخير</p>
              <p className="text-xl font-bold text-red-700">{etaLoading ? '...' : (etaMetrics?.avgDelayDays ?? 0)} يوم</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">في الطريق</p>
              <p className="text-xl font-bold text-blue-700">{shipmentsLoading ? '...' : (shipmentsSummary?.statuses?.in_transit ?? 0)}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">معدل النجاح</p>
              <p className="text-xl font-bold text-green-700">{shippingMetricsLoading ? '...' : `${detailedShippingMetrics?.onTimeDeliveryRate || 0}%`}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2 pr-3 text-right">رقم التتبع</th>
                  <th className="py-2 pr-3 text-right">العميل</th>
                  <th className="py-2 pr-3 text-right">الوجهة</th>
                  <th className="py-2 pr-3 text-right">الموعد المتوقع</th>
                  <th className="py-2 pr-3 text-right">أيام التأخير</th>
                  <th className="py-2 pr-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(topDelays || []).map((s: any) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 pr-3 font-medium">{s.trackingnumber || s.trackingNumber}</td>
                    <td className="py-2 pr-3">{s.customername || s.customerName}</td>
                    <td className="py-2 pr-3">{s.destination || 'غير محدد'}</td>
                    <td className="py-2 pr-3">{s.estimateddelivery || s.estimatedDelivery || '-'}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        (s.delay_days || 0) > 10 
                          ? 'bg-red-100 text-red-700'
                          : (s.delay_days || 0) > 5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {s.delay_days || 0} يوم
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                        {s.status || 'في الطريق'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(topDelays || []).length === 0 && (
                  <tr>
                    <td className="py-6 pr-3 text-gray-500 text-center" colSpan={6}>
                      <div className="flex flex-col items-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                        <span>لا توجد شحنات متأخرة حالياً</span>
                      </div>
                    </td>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <QuickAction 
            title="إيصال قبض" 
            description="إنشاء إيصال قبض سريع"
            icon={<Receipt className="h-4 w-4" />}
            onClick={() => setShowReceiptVoucher(true)}
            color="green"
          />
          <QuickAction 
            title="إيصال صرف" 
            description="إنشاء إيصال صرف سريع"
            icon={<CreditCard className="h-4 w-4" />}
            onClick={() => setShowPaymentVoucher(true)}
            color="red"
          />
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
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 ml-2" />
              آخر الإيصالات
            </h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button onClick={() => (window.location.href = '/financial/receipt-vouchers')} className="text-blue-600 hover:text-blue-800 text-xs">عرض الكل</button>
              <button onClick={loadRecentVouchers} className="text-gray-500 hover:text-gray-700 text-xs">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
          <RecentVouchersWidget vouchers={recentVouchers} loading={vouchersLoading} />
        </div>
      </div>

      {/* Voucher Modals */}
      <PaymentVoucher
        isOpen={showPaymentVoucher}
        onClose={() => setShowPaymentVoucher(false)}
        onSuccess={handleVoucherSuccess}
      />
      
      <ReceiptVoucher
        isOpen={showReceiptVoucher}
        onClose={() => setShowReceiptVoucher(false)}
        onSuccess={handleVoucherSuccess}
      />
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

const MetricCard: React.FC<{ title: string; value: string; color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'emerald' | 'indigo'; icon: React.ReactNode }> = ({ title, value, color, icon }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
    <div className="flex items-center justify-center mb-2">
      <span className={`text-${color}-600`}>{icon}</span>
    </div>
    <p className="text-xs text-gray-600 mb-1">{title}</p>
    <p className="text-sm sm:text-base font-bold text-gray-900">{value}</p>
  </div>
);

const QuickAction: React.FC<{ title: string; description: string; onClick: () => void; icon?: React.ReactNode; color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' }> = ({ title, description, onClick, icon, color = 'blue' }) => (
  <button onClick={onClick} className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 text-right hover:-translate-y-0.5`}>
    <div className="flex items-center justify-between mb-1">
      <h5 className="text-xs sm:text-sm font-semibold text-gray-900">{title}</h5>
      {icon && <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md bg-${color}-100 text-${color}-600`}>{icon}</span>}
    </div>
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

const RecentVouchersWidget: React.FC<{ vouchers: any[]; loading: boolean }> = ({ vouchers, loading }) => {
  const getVoucherTypeIcon = (type: string) => {
    return type === 'payment' 
      ? <CreditCard className="h-4 w-4 text-red-600" /> 
      : <Receipt className="h-4 w-4 text-green-600" />;
  };

  const getVoucherTypeName = (type: string) => {
    return type === 'payment' ? 'إيصال صرف' : 'إيصال قبض';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-gray-50">
          <tr className="text-gray-600">
            <th className="py-2 pr-3 text-right">النوع</th>
            <th className="py-2 pr-3 text-right">المرجع</th>
            <th className="py-2 pr-3 text-right">التاريخ</th>
            <th className="py-2 pr-3 text-right">المبلغ</th>
            <th className="py-2 pr-3 text-right">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td className="py-3 pr-3" colSpan={5}>جاري التحميل...</td></tr>
          )}
          {!loading && vouchers.length === 0 && (
            <tr><td className="py-3 pr-3 text-gray-500" colSpan={5}>لا توجد إيصالات حديثة</td></tr>
          )}
          {vouchers.map((voucher: any) => (
            <tr key={`${voucher.type}-${voucher.id}`} className="border-t hover:bg-gray-50">
              <td className="py-2 pr-3">
                <div className="flex items-center">
                  {getVoucherTypeIcon(voucher.type)}
                  <span className="ml-2">{getVoucherTypeName(voucher.type)}</span>
                </div>
              </td>
              <td className="py-2 pr-3">{voucher.reference || voucher.voucherNumber || voucher.number || '-'}</td>
              <td className="py-2 pr-3">{voucher.date ? new Date(voucher.date).toLocaleDateString('ar-EG') : '-'}</td>
              <td className="py-2 pr-3 font-semibold">{formatCurrency(voucher.amount || 0)}</td>
              <td className="py-2 pr-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  voucher.status === 'approved' 
                    ? 'bg-green-100 text-green-700'
                    : voucher.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {voucher.status === 'approved' ? 'معتمد' : voucher.status === 'pending' ? 'معلق' : voucher.status || 'غير محدد'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Quick Create Buttons */}
      {vouchers.length > 0 && (
        <div className="mt-4 flex justify-center space-x-3 space-x-reverse">
          <button 
            onClick={() => (window.location.href = '/financial/payment-vouchers')}
            className="text-xs px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center"
          >
            <CreditCard className="h-3 w-3 ml-1" />
            إيصالات الصرف
          </button>
          <button 
            onClick={() => (window.location.href = '/financial/receipt-vouchers')}
            className="text-xs px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors flex items-center"
          >
            <Receipt className="h-3 w-3 ml-1" />
            إيصالات القبض
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Users, BarChart3, DollarSign, RefreshCw, AlertTriangle, Receipt, CreditCard, FileText } from 'lucide-react';
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
  const [recentVouchers, setRecentVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

    // Load recent vouchers in parallel (non-blocking)
    loadRecentVouchers();
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
    <div className="space-y-6 fade-in">
      {/* Header - Compact and Modern */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">لوحة المبيعات</h1>
              <p className="text-blue-100 text-sm">نظرة شاملة على الأداء والعمليات</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadAll} 
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">تحديث</span>
            </button>
            <button 
              onClick={() => (window.location.href = '/sales/invoice-management')} 
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
            >
              إدارة الفواتير
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards - Enhanced Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="إجمالي المبيعات" 
          value={formatCurrency(salesData?.totalSales || 0)} 
          color="blue" 
          icon={<DollarSign className="h-6 w-6" />}
          trend={salesData?.monthlyGrowth}
        />
        <KPICard 
          title="عدد الطلبيات" 
          value={`${salesData?.totalOrders || 0}`} 
          color="green" 
          icon={<ShoppingCart className="h-6 w-6" />} 
        />
        <KPICard 
          title="متوسط قيمة الطلب" 
          value={formatCurrency(salesData?.averageOrderValue || 0)} 
          color="purple" 
          icon={<BarChart3 className="h-6 w-6" />} 
        />
        <KPICard 
          title="العملاء النشطون" 
          value={`${salesData?.activeCustomers || 0}`} 
          color="orange" 
          icon={<Users className="h-6 w-6" />} 
        />
      </div>


      {/* Quick Actions - Modern Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
            </div>
            الإجراءات السريعة
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickAction 
            title="إيصال قبض" 
            description="إنشاء سريع"
            icon={<Receipt className="h-5 w-5" />}
            onClick={() => setShowReceiptVoucher(true)}
            color="green"
          />
          <QuickAction 
            title="إيصال صرف" 
            description="إنشاء سريع"
            icon={<CreditCard className="h-5 w-5" />}
            onClick={() => setShowPaymentVoucher(true)}
            color="red"
          />
          <QuickAction 
            title="الفواتير" 
            description="إدارة وإنشاء"
            onClick={() => (window.location.href = '/sales/invoice-management')}
            icon={<FileText className="h-5 w-5" />}
            color="blue"
          />
          <QuickAction 
            title="التقارير" 
            description="تحليل الأداء"
            onClick={() => (window.location.href = '/sales/reports')}
            icon={<BarChart3 className="h-5 w-5" />}
            color="purple"
          />
          <QuickAction 
            title="العملاء" 
            description="إدارة العملاء"
            onClick={() => (window.location.href = '/sales/customers')}
            icon={<Users className="h-5 w-5" />}
            color="orange"
          />
          <QuickAction 
            title="الشحنات" 
            description="تتبع الشحنات"
            onClick={() => (window.location.href = '/sales/inventory')}
            icon={<ShoppingCart className="h-5 w-5" />}
            color="blue"
          />
        </div>
      </div>

      {/* Customers Snapshot and Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
              أفضل العملاء
            </h2>
            <button 
              onClick={() => (window.location.href = '/sales/customers')} 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              عرض الكل ←
            </button>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              آخر الإيصالات
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={loadRecentVouchers} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="تحديث"
              >
                <RefreshCw className="h-4 w-4 text-gray-600" />
              </button>
              <button 
                onClick={() => (window.location.href = '/financial/receipt-vouchers')} 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                عرض الكل ←
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

const KPICard: React.FC<{ 
  title: string; 
  value: string; 
  color: 'blue' | 'green' | 'purple' | 'orange'; 
  icon: React.ReactNode;
  trend?: number;
}> = ({ title, value, color, icon, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600'
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${colorClasses[color].split(' ')[1]} p-5 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color].split(' ')[0]} flex items-center justify-center`}>
          <span className={colorClasses[color].split(' ')[2]}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

const QuickAction: React.FC<{ 
  title: string; 
  description: string; 
  onClick: () => void; 
  icon?: React.ReactNode; 
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' 
}> = ({ title, description, onClick, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    red: 'bg-red-50 text-red-600 hover:bg-red-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
  };

  return (
    <button 
      onClick={onClick} 
      className="group bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 text-right"
    >
      <div className="flex flex-col items-center gap-3">
        {icon && (
          <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center transition-all duration-200 group-hover:scale-110`}>
            {icon}
          </div>
        )}
        <div className="text-center">
          <h5 className="text-sm font-bold text-gray-900 mb-1">{title}</h5>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
};

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

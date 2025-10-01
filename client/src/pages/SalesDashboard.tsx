import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Users,
  Package,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  DollarSign,
  RefreshCw,
  UserPlus,
  AlertTriangle,
  Receipt,
  CreditCard,
  Settings,
  Printer,
  XCircle
} from 'lucide-react';
import { salesAPI } from '../services/api';
import { useFinancialData } from '../contexts/FinancialDataContext';
import { formatCurrency } from '../utils/formatters';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  activeCustomers: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  totalInvoices: number;
  totalPayments: number;
  lowStockItems: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: 'wholesale' | 'retail' | 'vip';
  balance: number;
  status: 'active' | 'inactive';
  lastOrder: string;
}



const SalesDashboard: React.FC = () => {
  const { updateSalesData } = useFinancialData();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('overview');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  
  // Form data states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'wholesale'
  });
  
  // Success/Error messages
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      // Load data from API
      const [salesSummary, customersData] = await Promise.all([
        salesAPI.getSalesSummary(),
        salesAPI.getCustomers({ limit: 10 })
      ]);

      setSalesData(salesSummary);
      setCustomers(customersData.data || []);


    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };



  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'wholesale': return 'جملة';
      case 'retail': return 'تجزئة';
      case 'vip': return 'VIP';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wholesale': return 'bg-blue-100 text-blue-800';
      case 'retail': return 'bg-green-100 text-green-800';
      case 'vip': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  // Using safe formatting utilities from formatters.ts instead of local function

  // وظائف أزرار الإجراءات
  const handleAddCustomer = () => {
    console.log('Opening customer modal...');
    setShowAddCustomerModal(true);
    console.log('showAddCustomerModal set to:', true);
  };



  const handleViewCustomer = (customerId: string) => {
    // Navigate to customer details page
    window.location.href = `/sales/customers/${customerId}`;
  };

  const handleEditCustomer = (customerId: string) => {
    // Navigate to customer edit page
    window.location.href = `/sales/customers/${customerId}/edit`;
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await salesAPI.deleteCustomer(customerId);
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setMessage({ type: 'success', text: 'تم حذف العميل بنجاح' });
        setTimeout(() => setMessage(null), 1500);
      } catch (error) {
        console.error('Error deleting customer:', error);
        setMessage({ type: 'error', text: 'حدث خطأ أثناء حذف العميل' });
        setTimeout(() => setMessage(null), 1500);
      }
    }
  };



  const handleRefreshData = async () => {
    setLoading(true);
    try {
      await loadSalesData();
      setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' });
      setTimeout(() => setMessage(null), 1500);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث البيانات' });
      setTimeout(() => setMessage(null), 1500);
    } finally {
      setLoading(false);
    }
  };

  // Form handling functions
  const handleCustomerFormChange = (field: string, value: string) => {
    setCustomerForm(prev => ({ ...prev, [field]: value }));
  };

  // Save functions
  const handleSaveCustomer = async () => {
    if (!customerForm.name || !customerForm.phone) {
      setMessage({ type: 'error', text: 'يرجى ملء جميع الحقول المطلوبة' });
      return;
    }

    try {
      // Generate customer code automatically
      const customerCode = `CUST-${Date.now()}`;

      const customerData = {
        code: customerCode,
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        type: 'individual' as const,
        creditLimit: 0,
        paymentTerms: 30,
        currency: 'LYD' as const,
        isActive: true
      };

      console.log('إرسال بيانات العميل:', customerData);
      const newCustomer = await salesAPI.createCustomer(customerData);
      
      setCustomers(prev => [...prev, newCustomer]);
      
      // Update shared financial data
      updateSalesData('customers', { isActive: true });
      
      setMessage({ type: 'success', text: 'تم إضافة العميل بنجاح' });
      
      // Reset form and close modal
      setTimeout(() => {
        setCustomerForm({ name: '', phone: '', email: '', category: 'wholesale' });
        setShowAddCustomerModal(false);
        setMessage(null);
      }, 1500);
    } catch (error) {
      console.error('Error creating customer:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ العميل' });
    }
  };





  // Reset form functions
  const resetCustomerForm = () => {
    setCustomerForm({ name: '', phone: '', email: '', category: 'wholesale' });
    setShowAddCustomerModal(false);
  };

  const quickActions = [
    {
      title: 'إدارة الشحنات',
      description: 'تتبع الشحنات من الصين إلى ليبيا',
      icon: Package,
      color: 'blue',
      action: () => window.location.href = '/sales/inventory',
      link: '/sales/inventory'
    },
    {
      title: 'إيصالات مالية',
      description: 'إدارة إيصالات القبض والصرف المرتبطة بدليل الحسابات',
      icon: Settings,
      color: 'purple',
      action: () => window.location.href = '/sales/warehouse-release-orders',
      link: '/sales/warehouse-release-orders'
    },
    {
      title: 'إدارة الفواتير المحسن',
      description: 'نظام إدارة الفواتير الموحد والمتطور',
      icon: Receipt,
      color: 'green',
      action: () => window.location.href = '/sales/invoice-management',
      link: '/sales/invoice-management'
    },
    {
      title: 'تقارير المبيعات',
      description: 'تقارير شاملة للشحنات والأداء',
      icon: BarChart3,
      color: 'indigo',
      action: () => window.location.href = '/sales/reports',
      link: '/sales/reports'
    },
    {
      title: 'إدارة العملاء',
      description: 'إضافة وإدارة عملاء الشحن',
      icon: Users,
      color: 'orange',
      action: () => setActiveTab('customers'),
      link: '/customers'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Success/Error Messages */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-800' 
            : 'bg-red-100 border border-red-400 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-2 ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Header - Mobile Responsive */}
      <div className="card-gradient border-r-4 border-blue-500 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ml-3 sm:ml-4">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">نظام المبيعات</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">إدارة شاملة للمبيعات والعملاء والمخزون</p>
            </div>
          </div>
          <div className="text-right sm:text-left lg:text-right">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">آخر تحديث</p>
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{new Date().toLocaleDateString('ar-EG')}</p>
            <div className="mt-2 inline-flex items-center bg-success-100 text-success-800 rounded-full px-2 sm:px-3 py-1">
              <div className="w-2 h-2 bg-success-400 rounded-full ml-2 animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium">متصل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Summary Cards - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card border-r-4 border-blue-500 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">إجمالي المبيعات</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {salesData ? formatCurrency(salesData.totalSales) : '0 LYD'}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card border-r-4 border-green-500 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">إجمالي الطلبات</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {salesData ? salesData.totalOrders : 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card border-r-4 border-purple-500 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">العملاء النشطون</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {salesData ? salesData.activeCustomers : 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card border-r-4 border-orange-500 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">تنبيهات المخزون</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {salesData ? salesData.lowStockItems : 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile Responsive */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">الوحدات الرئيسية</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={handleRefreshData}
              className="btn btn-secondary text-xs sm:text-sm flex items-center px-3 py-2"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث البيانات</span>
              <span className="sm:hidden">تحديث</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action, index) => {
            const colorClasses = {
              blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
              green: { bg: 'bg-green-100', icon: 'text-green-600' },
              purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
              orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
              indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
              gray: { bg: 'bg-gray-100', icon: 'text-gray-600' }
            };

            const colors = colorClasses[action.color as keyof typeof colorClasses] || colorClasses.blue;

            return (
              <div
                key={index}
                onClick={() => action.action()}
                className="card-hover cursor-pointer group transition-professional border-r-4 border-blue-500 hover:border-blue-600 p-4 sm:p-6"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${colors.bg} mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.icon}`} />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors leading-tight">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{action.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation - Mobile Responsive */}
      <div className="card p-0">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
              { id: 'customers', label: 'العملاء', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Mobile Responsive */}
        <div className="p-3 sm:p-4 lg:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">نظرة عامة على نظام الشحن</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-3">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 ml-2 sm:ml-3" />
                    <h4 className="font-semibold text-blue-900 text-sm sm:text-base">إحصائيات الشحنات</h4>
                  </div>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-blue-800">
                    <li>• إجمالي الشحنات: {salesData?.totalOrders || 0}</li>
                    <li>• الشحنات النشطة: {salesData?.activeCustomers || 0}</li>
                    <li>• معدل النمو الشهري: {salesData?.monthlyGrowth || 0}%</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                  <div className="flex items-center mb-3">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 ml-2 sm:ml-3" />
                    <h4 className="font-semibold text-green-900 text-sm sm:text-base">العملاء</h4>
                  </div>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-green-800">
                    <li>• إجمالي العملاء: {customers.length}</li>
                    <li>• العملاء النشطون: {customers.filter(c => c.status === 'active').length}</li>
                    <li>• عملاء لهم أرصدة: {customers.filter(c => c.balance > 0).length}</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 sm:p-6 rounded-lg border border-purple-200 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center mb-3">
                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 ml-2 sm:ml-3" />
                    <h4 className="font-semibold text-purple-900 text-sm sm:text-base">الإيرادات</h4>
                  </div>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-purple-800">
                    <li>• إجمالي المبيعات: {salesData ? formatCurrency(salesData.totalSales) : '0 LYD'}</li>
                    <li>• متوسط قيمة الشحنة: {salesData ? formatCurrency(salesData.averageOrderValue) : '0 LYD'}</li>
                    <li>• إجمالي المدفوعات: {salesData?.totalPayments || 0}</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 ml-2" />
                  الإجراءات السريعة
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <button
                    onClick={() => window.location.href = '/sales/inventory'}
                    className="bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-center"
                  >
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 block">إدارة الشحنات</span>
                  </button>
                  <button
                    onClick={() => window.location.href = '/sales/invoice-management'}
                    className="bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-center"
                  >
                    <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mx-auto mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 block">إدارة الفواتير المحسن</span>
                  </button>
                  <button
                    onClick={() => window.location.href = '/sales/reports'}
                    className="bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-center"
                  >
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mx-auto mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 block">التقارير</span>
                  </button>
                  <button
                    onClick={handleAddCustomer}
                    className="bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-center"
                  >
                    <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 mx-auto mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 block">عميل جديد</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">إدارة العملاء</h3>
                <button
                  onClick={handleAddCustomer}
                  className="btn btn-primary text-xs sm:text-sm flex items-center justify-center px-3 py-2"
                >
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                  <span className="hidden sm:inline">إضافة عميل جديد</span>
                  <span className="sm:hidden">عميل جديد</span>
                </button>
              </div>

              {/* Mobile Cards View */}
              <div className="block sm:hidden space-y-3">
                {customers.map((customer) => (
                  <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{customer.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{customer.phone}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(customer.category)} ml-2`}>
                        {getCategoryLabel(customer.category)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                      <span>الرصيد: <span className="font-semibold text-gray-900">{formatCurrency(customer.balance)}</span></span>
                      <span>آخر طلب: {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString('ar-EG') : 'لا يوجد'}</span>
                    </div>
                    <div className="flex items-center justify-end space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleViewCustomer(customer.id)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="عرض"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer.id)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {customers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>لا توجد عملاء مسجلين</p>
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block table-responsive">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 sm:px-4 py-3 text-right font-medium text-gray-700 text-xs sm:text-sm">اسم العميل</th>
                      <th className="px-3 sm:px-4 py-3 text-right font-medium text-gray-700 text-xs sm:text-sm">التصنيف</th>
                      <th className="px-3 sm:px-4 py-3 text-right font-medium text-gray-700 text-xs sm:text-sm">الهاتف</th>
                      <th className="px-3 sm:px-4 py-3 text-right font-medium text-gray-700 text-xs sm:text-sm">الرصيد</th>
                      <th className="px-3 sm:px-4 py-3 text-right font-medium text-gray-700 text-xs sm:text-sm">آخر طلب</th>
                      <th className="px-3 sm:px-4 py-3 text-right font-medium text-gray-700 text-xs sm:text-sm">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">{customer.name}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(customer.category)}`}>
                            {getCategoryLabel(customer.category)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">{customer.phone}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-900">
                          {formatCurrency(customer.balance)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                          {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString('ar-EG') : 'لا يوجد'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                          <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleViewCustomer(customer.id)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="عرض"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => handleEditCustomer(customer.id)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="تعديل"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="حذف"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>لا توجد عملاء مسجلين</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}






        </div>
      </div>

      {/* Modal for Adding Customer - Mobile Responsive */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">إضافة عميل جديد</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => handleCustomerFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل اسم العميل"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => handleCustomerFormChange('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => handleCustomerFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                <select
                  value={customerForm.category}
                  onChange={(e) => handleCustomerFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="wholesale">جملة</option>
                  <option value="retail">تجزئة</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse mt-4 sm:mt-6">
              <button
                onClick={resetCustomerForm}
                className="btn btn-outline text-xs sm:text-sm w-full sm:w-auto order-2 sm:order-1"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCustomer}
                className="btn btn-primary text-xs sm:text-sm w-full sm:w-auto order-1 sm:order-2"
              >
                إضافة العميل
              </button>
            </div>
          </div>
        </div>
      )}






    </div>
  );
};

export default SalesDashboard;

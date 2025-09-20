import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import {
  Users,
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  User,
  Settings,
  BarChart3,
  DollarSign,
  ShoppingCart
} from 'lucide-react';

// Import new components
import AdminFinancialOverview from '../components/Admin/AdminFinancialOverview';
import AdminSalesOverview from '../components/Admin/AdminSalesOverview';
import AdminSystemMetrics from '../components/Admin/AdminSystemMetrics';
import AdminQuickActions from '../components/Admin/AdminQuickActions';
import AdminKPIDashboard from '../components/Admin/AdminKPIDashboard';
import AdminNotificationCenter from '../components/Admin/AdminNotificationCenter';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, any>;
  createdAt: string;
}

interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  roles: {
    total: number;
  };
  system: {
    uptime: number;
    memory: any;
    version: string;
  };
}

interface OverviewData {
  system: {
    users: {
      total: number;
      active: number;
      inactive: number;
    };
    roles: {
      total: number;
    };
    health: {
      uptime: number;
      memory: any;
      version: string;
      status: string;
    };
  };
  financial: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    accountsReceivable: number;
    accountsPayable: number;
    cashBalance: number;
    totalAccounts: number;
    activeAccounts: number;
    pendingTransactions: number;
    monthlyRevenue: Array<{
      month: string;
      amount: number;
    }>;
    topExpenseCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  sales: {
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
  };
  activities: Array<{
    id: string;
    type: string;
    description: string;
    user: string;
    timestamp: string;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'error';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // View mode state
  const [viewMode, setViewMode] = useState<'overview' | 'users' | 'roles'>('overview');
  
  // User management
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'operations',
    email: ''
  });
  
  // Role management
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: {}
  });
  
  // Search and filters
  const [userSearch, setUserSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Load data
  useEffect(() => {
    loadData();
    loadOverviewData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, statsData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getRoles(),
        adminAPI.getSystemStats()
      ]);
      
      setUsers(usersData.data || []);
      setRoles(rolesData.data || []);
      setSystemStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setMessage({ type: 'error', text: 'خطأ في تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async () => {
    setOverviewLoading(true);
    try {
      const overviewData = await adminAPI.getOverview();
      setOverviewData(overviewData);
    } catch (error) {
      console.error('Error loading overview data:', error);
      setMessage({ type: 'error', text: 'خطأ في تحميل بيانات النظرة العامة' });
    } finally {
      setOverviewLoading(false);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([loadData(), loadOverviewData()]);
    setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' });
  };

  // Navigation functions
  const navigateToFinancial = () => navigate('/financial');
  const navigateToSales = () => navigate('/sales');
  const navigateToSettings = () => navigate('/admin/settings');

  // Form reset functions
  const resetUserForm = () => {
    setUserForm({
      username: '',
      password: '',
      name: '',
      role: 'operations',
      email: ''
    });
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: {}
    });
  };

  // User management functions
  const openUserForm = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username,
        password: '',
        name: user.name,
        role: user.role,
        email: user.email || ''
      });
    } else {
      setEditingUser(null);
      resetUserForm();
    }
    setShowUserForm(true);
  };

  const openRoleForm = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions
      });
    } else {
      setEditingRole(null);
      resetRoleForm();
    }
    setShowRoleForm(true);
  };

  // User management functions
  const handleCreateUser = async () => {
    try {
      setLoading(true);
      await adminAPI.createUser(userForm);
      setMessage({ type: 'success', text: 'تم إنشاء المستخدم بنجاح' });
      setShowUserForm(false);
      resetUserForm();
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطأ في إنشاء المستخدم' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      await adminAPI.updateUser(editingUser.id, userForm);
      setMessage({ type: 'success', text: 'تم تحديث المستخدم بنجاح' });
      setShowUserForm(false);
      setEditingUser(null);
      resetUserForm();
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطأ في تحديث المستخدم' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      setLoading(true);
      await adminAPI.deleteUser(userId);
      setMessage({ type: 'success', text: 'تم حذف المستخدم بنجاح' });
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطأ في حذف المستخدم' });
    } finally {
      setLoading(false);
    }
  };

  // Role management functions
  const handleCreateRole = async () => {
    try {
      setLoading(true);
      await adminAPI.createRole(roleForm);
      setMessage({ type: 'success', text: 'تم إنشاء الدور بنجاح' });
      setShowRoleForm(false);
      resetRoleForm();
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطأ في إنشاء الدور' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      setLoading(true);
      await adminAPI.updateRole(editingRole.id, roleForm);
      setMessage({ type: 'success', text: 'تم تحديث الدور بنجاح' });
      setShowRoleForm(false);
      setEditingRole(null);
      resetRoleForm();
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطأ في تحديث الدور' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;

    try {
      setLoading(true);
      await adminAPI.deleteRole(roleId);
      setMessage({ type: 'success', text: 'تم حذف الدور بنجاح' });
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطأ في حذف الدور' });
    } finally {
      setLoading(false);
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">لوحة مدير النظام</h1>
              <p className="text-sm sm:text-base text-gray-600">إدارة شاملة للنظام والمستخدمين والبيانات</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse w-full sm:w-auto">
              <button
                onClick={refreshAllData}
                className="btn btn-outline flex items-center justify-center w-full sm:w-auto"
                disabled={loading || overviewLoading}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${(loading || overviewLoading) ? 'animate-spin' : ''}`} />
                تحديث البيانات
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex overflow-x-auto space-x-8 space-x-reverse scrollbar-hide">
              <button
                onClick={() => setViewMode('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-5 w-5 inline ml-2" />
                النظرة العامة
              </button>
              <button
                onClick={() => setViewMode('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-5 w-5 inline ml-2" />
                إدارة المستخدمين
              </button>
              <button
                onClick={() => setViewMode('roles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'roles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="h-5 w-5 inline ml-2" />
                إدارة الأدوار
              </button>
            </nav>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'overview' && (
          <div className="space-y-8">
            {/* Quick Actions */}
            <AdminQuickActions
              onNavigateToUsers={() => setViewMode('users')}
              onNavigateToRoles={() => setViewMode('roles')}
              onNavigateToFinancial={navigateToFinancial}
              onNavigateToSales={navigateToSales}
              onNavigateToSettings={navigateToSettings}
              onRefreshData={refreshAllData}
              onCreateUser={() => {
                setEditingUser(null);
                resetUserForm();
                setShowUserForm(true);
              }}
              onCreateRole={() => {
                setEditingRole(null);
                resetRoleForm();
                setShowRoleForm(true);
              }}
            />

            {/* KPI Dashboard */}
            {overviewData && (
              <AdminKPIDashboard
                kpis={[
                  {
                    title: 'إجمالي الإيرادات',
                    value: overviewData.financial.totalRevenue,
                    previousValue: 0,
                    target: 0,
                    format: 'currency',
                    trend: overviewData.financial.totalRevenue > 0 ? 'up' : 'stable',
                    trendPercentage: 0,
                    status: 'good',
                    icon: DollarSign,
                    color: 'green'
                  },
                  {
                    title: 'المستخدمين النشطين',
                    value: overviewData.system.users.active,
                    previousValue: Math.max(0, overviewData.system.users.active - 1),
                    target: overviewData.system.users.total,
                    format: 'number',
                    trend: overviewData.system.users.active > 0 ? 'up' : 'stable',
                    trendPercentage: overviewData.system.users.active > 0 ? 100 : 0,
                    status: 'good',
                    icon: Users,
                    color: 'blue'
                  },
                  {
                    title: 'إجمالي المبيعات',
                    value: overviewData.sales.totalSales,
                    previousValue: 0,
                    target: 0,
                    format: 'currency',
                    trend: overviewData.sales.totalSales > 0 ? 'up' : 'stable',
                    trendPercentage: 0,
                    status: 'good',
                    icon: ShoppingCart,
                    color: 'purple'
                  },
                  {
                    title: 'معدل الاستجابة',
                    value: overviewData.system.health.status === 'healthy' ? 100 : 0,
                    previousValue: overviewData.system.health.status === 'healthy' ? 99 : 0,
                    target: 100,
                    format: 'percentage',
                    trend: overviewData.system.health.status === 'healthy' ? 'up' : 'down',
                    trendPercentage: overviewData.system.health.status === 'healthy' ? 1.0 : 0,
                    status: overviewData.system.health.status === 'healthy' ? 'good' : 'danger',
                    icon: BarChart3,
                    color: 'indigo'
                  }
                ]}
                loading={overviewLoading}
              />
            )}

            {/* System Metrics and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {overviewData && (
                <>
                  <div className="xl:col-span-2">
                    <AdminSystemMetrics
                      systemData={overviewData.system}
                      activities={overviewData.activities}
                      alerts={overviewData.alerts}
                      loading={overviewLoading}
                    />
                  </div>
                  <div>
                    <AdminNotificationCenter
                      notifications={overviewData.sales.lowStockItems > 0 || overviewData.sales.pendingInvoices > 0 ? [
                        ...(overviewData.sales.lowStockItems > 0 ? [{
                          id: '1',
                          type: 'warning' as const,
                          title: 'مخزون منخفض',
                          message: `يوجد ${overviewData.sales.lowStockItems} منتج بمخزون منخفض يحتاج إعادة تموين`,
                          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                          read: false,
                          priority: 'medium' as const,
                          category: 'sales' as const,
                          actionText: 'عرض المنتجات',
                          actionUrl: '/sales/inventory'
                        }] : []),
                        ...(overviewData.sales.pendingInvoices > 0 ? [{
                          id: '2',
                          type: 'info' as const,
                          title: 'فواتير معلقة',
                          message: `يوجد ${overviewData.sales.pendingInvoices} فاتورة في انتظار الدفع`,
                          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
                          read: false,
                          priority: 'low' as const,
                          category: 'financial' as const,
                          actionText: 'عرض الفواتير',
                          actionUrl: '/sales/invoices'
                        }] : []),
                        ...(overviewData.sales.overdueInvoices > 0 ? [{
                          id: '4',
                          type: 'error' as const,
                          title: 'فواتير متأخرة',
                          message: `يوجد ${overviewData.sales.overdueInvoices} فاتورة متأخرة الدفع`,
                          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
                          read: false,
                          priority: 'high' as const,
                          category: 'financial' as const,
                          actionText: 'متابعة الفواتير',
                          actionUrl: '/financial/customers'
                        }] : [])
                      ] : []}
                      loading={overviewLoading}
                      onAction={(notification) => {
                        if (notification.actionUrl) {
                          navigate(notification.actionUrl);
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Financial and Sales Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {overviewData && (
                <>
                  <AdminFinancialOverview
                    data={overviewData.financial}
                    loading={overviewLoading}
                    onNavigateToFinancial={navigateToFinancial}
                  />
                  <AdminSalesOverview
                    data={overviewData.sales}
                    loading={overviewLoading}
                    onNavigateToSales={navigateToSales}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {viewMode === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-6 w-6 text-blue-600 ml-3" />
                    إدارة المستخدمين
                  </h2>
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      resetUserForm();
                      setShowUserForm(true);
                    }}
                    className="btn btn-primary flex items-center"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    مستخدم جديد
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="البحث بالاسم أو اسم المستخدم"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="form-input pr-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="form-select"
                    >
                      <option value="">جميع الأدوار</option>
                      <option value="admin">مدير النظام</option>
                      <option value="financial">مدير مالي</option>
                      <option value="sales">مدير مبيعات</option>
                      <option value="customer_service">خدمة العملاء</option>
                      <option value="operations">عمليات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="form-select"
                    >
                      <option value="">جميع الحالات</option>
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={loadData}
                      className="btn btn-outline flex items-center w-full"
                    >
                      <RefreshCw className="h-4 w-4 ml-2" />
                      تحديث
                    </button>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المستخدم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الدور
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الإنشاء
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users
                      .filter(user => {
                        const matchesSearch = !userSearch ||
                          user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          user.username.toLowerCase().includes(userSearch.toLowerCase());
                        const matchesRole = !userRoleFilter || user.role === userRoleFilter;
                        const matchesStatus = !userStatusFilter ||
                          (userStatusFilter === 'active' && user.isActive) ||
                          (userStatusFilter === 'inactive' && !user.isActive);
                        return matchesSearch && matchesRole && matchesStatus;
                      })
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="mr-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'financial' ? 'bg-green-100 text-green-800' :
                              user.role === 'sales' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'customer_service' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role === 'admin' ? 'مدير النظام' :
                               user.role === 'financial' ? 'مدير مالي' :
                               user.role === 'sales' ? 'مدير مبيعات' :
                               user.role === 'customer_service' ? 'خدمة العملاء' :
                               'عمليات'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button
                                onClick={() => openUserForm(user)}
                                className="text-blue-600 hover:text-blue-900"
                                title="تعديل"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Roles Management Tab */}
        {viewMode === 'roles' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Shield className="h-6 w-6 text-purple-600 ml-3" />
                    إدارة الأدوار والصلاحيات
                  </h2>
                  <button
                    onClick={() => {
                      setEditingRole(null);
                      resetRoleForm();
                      setShowRoleForm(true);
                    }}
                    className="btn btn-secondary flex items-center"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    دور جديد
                  </button>
                </div>
              </div>

              {/* Roles Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {roles.map((role) => (
                    <div key={role.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => openRoleForm(role)}
                            className="text-blue-600 hover:text-blue-900"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600 hover:text-red-900"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {role.description && (
                        <p className="text-gray-600 mb-4">{role.description}</p>
                      )}

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">الصلاحيات:</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(role.permissions || {}).map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          تم الإنشاء: {new Date(role.createdAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Form Modal */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </h3>

              <form onSubmit={(e) => {
                e.preventDefault();
                editingUser ? handleUpdateUser() : handleCreateUser();
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المستخدم
                    </label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الدور
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="operations">عمليات</option>
                      <option value="customer_service">خدمة العملاء</option>
                      <option value="sales">مدير مبيعات</option>
                      <option value="financial">مدير مالي</option>
                      <option value="admin">مدير النظام</option>
                    </select>
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        كلمة المرور
                      </label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserForm(false);
                      setEditingUser(null);
                      resetUserForm();
                    }}
                    className="btn btn-outline w-full sm:w-auto"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full sm:w-auto"
                  >
                    {loading ? 'جاري الحفظ...' : (editingUser ? 'تحديث' : 'إنشاء')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Role Form Modal */}
        {showRoleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
              </h3>

              <form onSubmit={(e) => {
                e.preventDefault();
                editingRole ? handleUpdateRole() : handleCreateRole();
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم الدور
                    </label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوصف
                    </label>
                    <textarea
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                      className="form-input"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleForm(false);
                      setEditingRole(null);
                      resetRoleForm();
                    }}
                    className="btn btn-outline"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'جاري الحفظ...' : (editingRole ? 'تحديث' : 'إنشاء')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

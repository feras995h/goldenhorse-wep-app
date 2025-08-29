import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Truck,
  Users,
  Package,
  TrendingUp
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'مدير النظام',
      financial: 'القسم المالي',
      sales: 'المبيعات',
      customer_service: 'خدمات العملاء',
      operations: 'العمليات'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getWelcomeMessage = (role: string) => {
    const messages = {
      admin: 'مرحباً بك في لوحة تحكم مدير النظام',
      financial: 'مرحباً بك في لوحة تحكم القسم المالي',
      sales: 'مرحباً بك في لوحة تحكم المبيعات',
      customer_service: 'مرحباً بك في لوحة تحكم خدمات العملاء',
      operations: 'مرحباً بك في لوحة تحكم العمليات'
    };
    return messages[role as keyof typeof messages] || 'مرحباً بك في النظام';
  };

  return (
    <div className="dashboard-section fade-in">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-responsive-2xl font-bold text-gray-900 mb-3">
              مرحباً، {user?.name}
            </h1>
            <p className="text-responsive-lg text-gray-600 mb-4">
              {getWelcomeMessage(user?.role || '')}
            </p>
            <div className="inline-flex items-center bg-success-100 text-success-800 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-success-400 rounded-full ml-2 animate-pulse"></div>
              <span className="font-semibold">
                {getRoleDisplayName(user?.role || '')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <h2 className="dashboard-section-title">الإحصائيات السريعة</h2>
        <div className="dashboard-stats-grid">
          <div className="card-stat border-golden-500">
            <div className="flex items-center">
              <div className="icon-container-lg bg-gradient-to-br from-golden-400 to-golden-600 ml-4">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الشحنات</p>
                <p className="text-3xl font-bold text-gray-900">1,234</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-golden-500 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-stat border-success-500">
            <div className="flex items-center">
              <div className="icon-container-lg bg-gradient-to-br from-success-400 to-success-600 ml-4">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">الإيرادات الشهرية</p>
                <p className="text-3xl font-bold text-gray-900">$45,678</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-success-500 h-2 rounded-full transition-all duration-300" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-stat border-blue-500">
            <div className="flex items-center">
              <div className="icon-container-lg bg-gradient-to-br from-blue-400 to-blue-600 ml-4">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">العملاء النشطون</p>
                <p className="text-3xl font-bold text-gray-900">567</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-stat border-purple-500">
            <div className="flex items-center">
              <div className="icon-container-lg bg-gradient-to-br from-purple-400 to-purple-600 ml-4">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">الشحنات قيد التنفيذ</p>
                <p className="text-3xl font-bold text-gray-900">89</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="dashboard-section-title">الإجراءات السريعة</h2>
        <div className="card">
          <div className="grid-responsive-3">
            <button className="card-feature group border-golden-500 p-6 text-right hover:border-golden-600">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-golden-100 rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-golden-600" />
                </div>
                <div className="mr-4 flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-golden-700 transition-colors">شحنة جديدة</h3>
                  <p className="text-sm text-gray-600">إنشاء شحنة جديدة للعملاء</p>
                </div>
              </div>
            </button>

            <button className="card-feature group border-blue-500 p-6 text-right hover:border-blue-600">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mr-4 flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">عميل جديد</h3>
                  <p className="text-sm text-gray-600">إضافة عميل جديد للنظام</p>
                </div>
              </div>
            </button>

            <button className="card-feature group border-success-500 p-6 text-right hover:border-success-600">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-success-600" />
                </div>
                <div className="mr-4 flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-success-700 transition-colors">التقارير</h3>
                  <p className="text-sm text-gray-600">عرض التقارير والإحصائيات</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


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
    <div className="space-y-8 fade-in">
      {/* Welcome Section */}
      <div className="card-professional bg-gradient-to-r from-white via-golden-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading mb-2">
              مرحباً، {user?.name}
            </h1>
            <p className="text-body text-lg mb-4">
              {getWelcomeMessage(user?.role || '')}
            </p>
            <div className="inline-flex items-center badge-primary">
              <div className="w-2 h-2 bg-success-500 rounded-full ml-2"></div>
              <span className="font-semibold">
                {getRoleDisplayName(user?.role || '')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-auto grid-4">
        <div className="card-metric">
          <div className="flex items-center">
            <div className="p-3 bg-golden-100 rounded-lg ml-4">
              <Package className="h-7 w-7 text-golden-600" />
            </div>
            <div>
              <p className="text-caption mb-1 font-medium">إجمالي الشحنات</p>
              <p className="text-3xl font-bold text-dark-800">1,234</p>
              <div className="w-full bg-golden-200 rounded-full h-2 mt-2">
                <div className="bg-golden-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-center">
            <div className="p-3 bg-success-100 rounded-lg ml-4">
              <TrendingUp className="h-7 w-7 text-success-600" />
            </div>
            <div>
              <p className="text-caption mb-1 font-medium">الإيرادات الشهرية</p>
              <p className="text-3xl font-bold text-dark-800">$45,678</p>
              <div className="w-full bg-golden-200 rounded-full h-2 mt-2">
                <div className="bg-success-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg ml-4">
              <Users className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <p className="text-caption mb-1 font-medium">العملاء النشطون</p>
              <p className="text-3xl font-bold text-dark-800">567</p>
              <div className="w-full bg-golden-200 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg ml-4">
              <Truck className="h-7 w-7 text-purple-600" />
            </div>
            <div>
              <p className="text-caption mb-1 font-medium">الشحنات قيد التنفيذ</p>
              <p className="text-3xl font-bold text-dark-800">89</p>
              <div className="w-full bg-golden-200 rounded-full h-2 mt-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-professional">
        <h2 className="text-subheading mb-6">الإجراءات السريعة</h2>
        <div className="grid-auto grid-3">
          <button className="card-hover p-6 text-right group">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-golden-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-golden-600" />
              </div>
              <div className="mr-4 flex-1">
                <h3 className="font-semibold text-dark-800 text-lg mb-2">شحنة جديدة</h3>
                <p className="text-caption">إنشاء شحنة جديدة للعملاء</p>
              </div>
            </div>
          </button>

          <button className="card-hover p-6 text-right group">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mr-4 flex-1">
                <h3 className="font-semibold text-dark-800 text-lg mb-2">عميل جديد</h3>
                <p className="text-caption">إضافة عميل جديد للنظام</p>
              </div>
            </div>
          </button>

          <button className="card-hover p-6 text-right group">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-success-600" />
              </div>
              <div className="mr-4 flex-1">
                <h3 className="font-semibold text-dark-800 text-lg mb-2">التقارير</h3>
                <p className="text-caption">عرض التقارير والإحصائيات</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


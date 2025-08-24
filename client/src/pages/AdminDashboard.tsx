import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Shield, Database, BarChart3 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 flex items-center slide-in-right">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-lg golden-glow ml-4">
            <Settings className="h-8 w-8 text-white transform hover:rotate-180 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">مدير النظام</h1>
            <p className="text-gray-300 text-lg">لوحة تحكم مدير النظام</p>
            <div className="mt-2 inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full ml-2 animate-pulse"></div>
              <span className="text-sm font-medium">متصل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-gradient group slide-in-right" style={{ animationDelay: '0.1s' }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">إدارة المستخدمين</h3>
            <p className="text-gray-600 text-sm">إضافة وإدارة مستخدمي النظام</p>
          </div>
        </div>

        <div className="card-gradient group slide-in-right" style={{ animationDelay: '0.2s' }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">الصلاحيات والأمان</h3>
            <p className="text-gray-600 text-sm">إدارة صلاحيات المستخدمين</p>
          </div>
        </div>

        <div
          className="card-gradient group slide-in-right cursor-pointer"
          style={{ animationDelay: '0.3s' }}
          onClick={() => navigate('/admin/settings')}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
              <Database className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">إعدادات النظام</h3>
            <p className="text-gray-600 text-sm">تكوين إعدادات التطبيق والشعار</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="card-gradient text-center py-16 slide-in-left" style={{ animationDelay: '0.4s' }}>
        <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Settings className="h-12 w-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          لوحة تحكم مدير النظام
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-6 text-lg">
          هذه اللوحة فارغة حالياً. سيتم تطوير الميزات والوظائف لاحقاً.
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-center mb-3">
            <BarChart3 className="h-6 w-6 text-blue-600 ml-2" />
            <span className="font-bold text-blue-800">الميزات القادمة</span>
          </div>
          <p className="text-sm text-blue-800">
            سيتم إضافة إدارة المستخدمين، إعدادات النظام، والتقارير الإدارية هنا.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

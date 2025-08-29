import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Shield, Database, BarChart3 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="card-gradient border-r-4 border-golden-500 p-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-golden-100 rounded-full blur-xl opacity-20"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-golden-200 rounded-full blur-xl opacity-30"></div>

        <div className="relative z-10 flex items-center slide-in-right">
          <div className="w-16 h-16 bg-gradient-to-br from-golden-500 to-golden-600 rounded-xl flex items-center justify-center shadow-lg golden-glow ml-4">
            <Settings className="h-8 w-8 text-white transform hover:rotate-180 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">مدير النظام</h1>
            <p className="text-gray-600 text-lg">لوحة تحكم مدير النظام</p>
            <div className="mt-3 inline-flex items-center bg-success-100 text-success-800 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-success-400 rounded-full ml-2 animate-pulse"></div>
              <span className="text-sm font-medium">متصل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">وحدات النظام</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card-hover group slide-in-right border-r-4 border-blue-500" style={{ animationDelay: '0.1s' }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">إدارة المستخدمين</h3>
              <p className="text-gray-600 text-sm leading-relaxed">إضافة وإدارة مستخدمي النظام</p>
            </div>
          </div>

          <div className="card-hover group slide-in-right border-r-4 border-success-500" style={{ animationDelay: '0.2s' }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-success-400 to-success-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-success-600 transition-colors">الصلاحيات والأمان</h3>
              <p className="text-gray-600 text-sm leading-relaxed">إدارة صلاحيات المستخدمين</p>
            </div>
          </div>

          <div
            className="card-hover group slide-in-right cursor-pointer border-r-4 border-purple-500"
            style={{ animationDelay: '0.3s' }}
            onClick={() => navigate('/admin/settings')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">إعدادات النظام</h3>
              <p className="text-gray-600 text-sm leading-relaxed">تكوين إعدادات التطبيق والشعار</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="card text-center py-12 slide-in-left border-r-4 border-golden-500" style={{ animationDelay: '0.4s' }}>
        <div className="w-24 h-24 bg-gradient-to-br from-golden-400 to-golden-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl golden-glow">
          <Settings className="h-12 w-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          لوحة تحكم مدير النظام
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-6 text-lg leading-relaxed">
          هذه اللوحة فارغة حالياً. سيتم تطوير الميزات والوظائف لاحقاً.
        </p>
        <div className="bg-gradient-to-r from-golden-50 to-golden-100 border border-golden-200 rounded-xl p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-center mb-3">
            <BarChart3 className="h-6 w-6 text-golden-600 ml-2" />
            <span className="font-bold text-golden-800">الميزات القادمة</span>
          </div>
          <p className="text-sm text-golden-800 leading-relaxed">
            سيتم إضافة إدارة المستخدمين، إعدادات النظام، والتقارير الإدارية هنا.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

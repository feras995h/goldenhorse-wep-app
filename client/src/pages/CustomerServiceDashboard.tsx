import React from 'react';
import { Headphones } from 'lucide-react';

const CustomerServiceDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <Headphones className="h-8 w-8 ml-3" />
          <div>
            <h1 className="text-2xl font-bold">خدمات العملاء</h1>
            <p className="text-purple-100">لوحة تحكم خدمات العملاء</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="card text-center py-12">
        <Headphones className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          لوحة تحكم خدمات العملاء
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          هذه اللوحة فارغة حالياً. سيتم تطوير الميزات والوظائف لاحقاً.
        </p>
        <div className="mt-6 p-4 bg-purple-50 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-purple-800">
            <strong>ملاحظة:</strong> سيتم إضافة إدارة التذاكر، متابعة الشكاوى، ونظام الدعم هنا.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerServiceDashboard;

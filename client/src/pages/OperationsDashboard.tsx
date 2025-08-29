import React from 'react';
import { Truck } from 'lucide-react';

const OperationsDashboard: React.FC = () => {
  return (
    <div className="dashboard-section fade-in">
      {/* Header */}
      <div className="dashboard-header border-orange-500">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg golden-glow ml-4">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">العمليات</h1>
            <p className="text-gray-600 text-lg">لوحة تحكم العمليات</p>
            <div className="mt-3 inline-flex items-center bg-success-100 text-success-800 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-success-400 rounded-full ml-2 animate-pulse"></div>
              <span className="text-sm font-medium">متصل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="card text-center py-16 border-r-4 border-orange-500">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Truck className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          لوحة تحكم العمليات
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-6 text-lg leading-relaxed">
          هذه اللوحة فارغة حالياً. سيتم تطوير الميزات والوظائف لاحقاً.
        </p>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 max-w-lg mx-auto">
          <p className="text-sm text-orange-800 leading-relaxed">
            <strong className="font-bold">ملاحظة:</strong> سيتم إضافة تتبع الشحنات، إدارة المخازن، وجدولة النقل هنا.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboard;

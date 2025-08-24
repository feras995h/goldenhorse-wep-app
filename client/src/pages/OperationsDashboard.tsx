import React from 'react';
import { Truck } from 'lucide-react';

const OperationsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <Truck className="h-8 w-8 ml-3" />
          <div>
            <h1 className="text-2xl font-bold">العمليات</h1>
            <p className="text-orange-100">لوحة تحكم العمليات</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="card text-center py-12">
        <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          لوحة تحكم العمليات
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          هذه اللوحة فارغة حالياً. سيتم تطوير الميزات والوظائف لاحقاً.
        </p>
        <div className="mt-6 p-4 bg-orange-50 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-orange-800">
            <strong>ملاحظة:</strong> سيتم إضافة تتبع الشحنات، إدارة المخازن، وجدولة النقل هنا.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboard;

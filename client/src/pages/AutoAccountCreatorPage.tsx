import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle,
  Info,
  FileText,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AutoAccountCreator from '../components/Financial/AutoAccountCreator';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
}

const AutoAccountCreatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCreator, setShowCreator] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<Account[]>([]);

  const handleAccountsCreated = (accounts: Account[]) => {
    setCreatedAccounts(accounts);
    // يمكن إضافة المزيد من المنطق هنا مثل تحديث الحالة العامة
  };

  const benefits = [
    {
      icon: CheckCircle,
      title: 'إنشاء تلقائي',
      description: 'إنشاء جميع الحسابات المطلوبة للفواتير تلقائياً',
      color: 'text-green-600'
    },
    {
      icon: Settings,
      title: 'ربط ذكي',
      description: 'ربط الفواتير بالحسابات المناسبة تلقائياً',
      color: 'text-blue-600'
    },
    {
      icon: BookOpen,
      title: 'دليل حسابات منظم',
      description: 'تنظيم الحسابات حسب المعايير المحاسبية',
      color: 'text-purple-600'
    },
    {
      icon: FileText,
      title: 'قيود محاسبية دقيقة',
      description: 'إنشاء قيود محاسبية صحيحة ومتوازنة',
      color: 'text-orange-600'
    }
  ];

  const accountTypes = [
    {
      type: 'إيرادات المبيعات',
      accounts: ['إيرادات المبيعات', 'إيرادات الشحن', 'رسوم المناولة'],
      color: 'bg-green-100 text-green-800'
    },
    {
      type: 'الأصول',
      accounts: ['ذمم العملاء'],
      color: 'bg-blue-100 text-blue-800'
    },
    {
      type: 'الخصوم',
      accounts: ['ضريبة المبيعات المستحقة'],
      color: 'bg-red-100 text-red-800'
    },
    {
      type: 'خصومات وتكاليف',
      accounts: ['خصومات المبيعات', 'رسوم التأمين', 'رسوم التخزين'],
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/financial/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                العودة للوحة المالية
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">إنشاء حسابات الفواتير تلقائياً</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showCreator ? (
          <>
            {/* مقدمة */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Info className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    نظام إنشاء الحسابات التلقائي
                  </h2>
                  <p className="text-gray-600 mb-4">
                    يقوم هذا النظام بإنشاء جميع الحسابات المطلوبة لنظام إدارة الفواتير تلقائياً في دليل الحسابات، 
                    مما يضمن الربط الصحيح بين الفواتير والحسابات المحاسبية وإنشاء القيود المحاسبية بدقة.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-800 font-medium mb-1">تنبيه مهم:</p>
                        <p className="text-yellow-700 text-sm">
                          سيتم إنشاء الحسابات المفقودة فقط. الحسابات الموجودة بالفعل لن تتأثر.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* المزايا */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className={`h-6 w-6 ${benefit.color}`} />
                      <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                );
              })}
            </div>

            {/* أنواع الحسابات */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الحسابات التي سيتم إنشاؤها:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accountTypes.map((category, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${category.color}`}>
                      {category.type}
                    </div>
                    <ul className="space-y-2">
                      {category.accounts.map((account, accountIndex) => (
                        <li key={accountIndex} className="flex items-center gap-2 text-gray-700">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {account}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* زر البدء */}
            <div className="text-center">
              <button
                onClick={() => setShowCreator(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                بدء إنشاء الحسابات
              </button>
            </div>
          </>
        ) : (
          <AutoAccountCreator
            onAccountsCreated={handleAccountsCreated}
            onClose={() => setShowCreator(false)}
          />
        )}

        {/* عرض النتائج */}
        {createdAccounts.length > 0 && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">
                تم إنشاء الحسابات بنجاح!
              </h3>
            </div>
            <p className="text-green-800 mb-4">
              تم إنشاء {createdAccounts.length} حساب جديد في دليل الحسابات:
            </p>
            <div className="space-y-2">
              {createdAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">{account.code}</span>
                  <span>-</span>
                  <span>{account.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-green-200">
              <button
                onClick={() => navigate('/financial/chart-of-accounts')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                عرض دليل الحسابات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoAccountCreatorPage;

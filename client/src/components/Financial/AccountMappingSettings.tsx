import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Receipt,
  Calculator,
  Building2
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface AccountMapping {
  salesRevenueAccount: string;
  salesTaxAccount: string;
  accountsReceivableAccount: string;
  discountAccount: string;
  shippingRevenueAccount: string;
  handlingFeeAccount: string;
}

const AccountMappingSettings: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mapping, setMapping] = useState<AccountMapping>({
    salesRevenueAccount: '',
    salesTaxAccount: '',
    accountsReceivableAccount: '',
    discountAccount: '',
    shippingRevenueAccount: '',
    handlingFeeAccount: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAccounts();
    loadCurrentMapping();
  }, []);

  const loadAccounts = async () => {
    try {
      // TODO: Replace with actual API call
      const mockAccounts: Account[] = [
        { id: '1', code: '4100', name: 'إيرادات المبيعات', type: 'revenue' },
        { id: '2', code: '2300', name: 'ضريبة القيمة المضافة', type: 'liability' },
        { id: '3', code: '1200', name: 'ذمم العملاء', type: 'asset' },
        { id: '4', code: '4200', name: 'خصومات المبيعات', type: 'expense' },
        { id: '5', code: '4150', name: 'إيرادات الشحن', type: 'revenue' },
        { id: '6', code: '4160', name: 'رسوم المناولة', type: 'revenue' }
      ];
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setMessage({ type: 'error', text: 'خطأ في تحميل الحسابات' });
    }
  };

  const loadCurrentMapping = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockMapping: AccountMapping = {
        salesRevenueAccount: '1',
        salesTaxAccount: '2',
        accountsReceivableAccount: '3',
        discountAccount: '4',
        shippingRevenueAccount: '5',
        handlingFeeAccount: '6'
      };
      setMapping(mockMapping);
    } catch (error) {
      console.error('Error loading mapping:', error);
      setMessage({ type: 'error', text: 'خطأ في تحميل إعدادات الحسابات' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Replace with actual API call
      console.log('Saving account mapping:', mapping);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'تم حفظ إعدادات الحسابات بنجاح' });
    } catch (error) {
      console.error('Error saving mapping:', error);
      setMessage({ type: 'error', text: 'خطأ في حفظ إعدادات الحسابات' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadCurrentMapping();
    setMessage(null);
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.code} - ${account.name}` : 'غير محدد';
  };

  const mappingFields = [
    {
      key: 'salesRevenueAccount' as keyof AccountMapping,
      label: 'حساب إيرادات المبيعات',
      description: 'الحساب الذي سيتم قيد إيرادات المبيعات فيه',
      icon: <DollarSign size={20} className="text-green-600" />,
      accountType: 'revenue'
    },
    {
      key: 'salesTaxAccount' as keyof AccountMapping,
      label: 'حساب ضريبة المبيعات',
      description: 'الحساب الذي سيتم قيد ضريبة القيمة المضافة فيه',
      icon: <Calculator size={20} className="text-blue-600" />,
      accountType: 'liability'
    },
    {
      key: 'accountsReceivableAccount' as keyof AccountMapping,
      label: 'حساب ذمم العملاء',
      description: 'الحساب الذي سيتم قيد مبالغ العملاء المستحقة فيه',
      icon: <Receipt size={20} className="text-orange-600" />,
      accountType: 'asset'
    },
    {
      key: 'discountAccount' as keyof AccountMapping,
      label: 'حساب خصومات المبيعات',
      description: 'الحساب الذي سيتم قيد خصومات المبيعات فيه',
      icon: <AlertCircle size={20} className="text-red-600" />,
      accountType: 'expense'
    },
    {
      key: 'shippingRevenueAccount' as keyof AccountMapping,
      label: 'حساب إيرادات الشحن',
      description: 'الحساب الذي سيتم قيد إيرادات الشحن فيه',
      icon: <Building2 size={20} className="text-purple-600" />,
      accountType: 'revenue'
    },
    {
      key: 'handlingFeeAccount' as keyof AccountMapping,
      label: 'حساب رسوم المناولة',
      description: 'الحساب الذي سيتم قيد رسوم المناولة فيه',
      icon: <Settings size={20} className="text-gray-600" />,
      accountType: 'revenue'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Settings className="text-blue-600" size={28} />
          إعدادات ربط الحسابات
        </h1>
        <p className="text-gray-600">
          تحديد الحسابات المحاسبية التي سيتم ربط الفواتير بها تلقائياً
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? 
            <CheckCircle size={20} /> : 
            <AlertCircle size={20} />
          }
          {message.text}
        </div>
      )}

      {/* Account Mapping Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="space-y-6">
            {mappingFields.map(field => (
              <div key={field.key} className="border-b border-gray-100 pb-6 last:border-b-0">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {field.icon}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {field.label}
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      {field.description}
                    </p>
                    <select
                      value={mapping[field.key]}
                      onChange={(e) => setMapping(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">اختر الحساب...</option>
                      {accounts
                        .filter(account => account.type === field.accountType)
                        .map(account => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))
                      }
                    </select>
                    {mapping[field.key] && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ مرتبط بـ: {getAccountName(mapping[field.key])}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            إعادة تعيين
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 نصائح مهمة</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• تأكد من اختيار الحسابات الصحيحة لكل نوع من أنواع المعاملات</li>
          <li>• سيتم استخدام هذه الإعدادات تلقائياً عند إنشاء القيود المحاسبية للفواتير</li>
          <li>• يمكنك تغيير هذه الإعدادات في أي وقت، لكن لن تؤثر على الفواتير المنشأة مسبقاً</li>
          <li>• تأكد من مراجعة القيود المحاسبية بعد تغيير الإعدادات</li>
        </ul>
      </div>
    </div>
  );
};

export default AccountMappingSettings;

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  FileText,
  DollarSign,
  Package,
  Truck,
  Shield,
  Building,
  RefreshCw,
  Eye
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string;
  balance: number;
  isActive: boolean;
}

interface AutoAccountCreatorProps {
  onAccountsCreated?: (accounts: Account[]) => void;
  onClose?: () => void;
}

const AutoAccountCreator: React.FC<AutoAccountCreatorProps> = ({
  onAccountsCreated,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<Account[]>([]);
  const [existingAccounts, setExistingAccounts] = useState<Account[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // الحسابات المطلوبة للفواتير
  const requiredAccounts = [
    // الإيرادات
    {
      code: '5.1.1',
      name: 'إيرادات المبيعات',
      type: 'revenue',
      icon: DollarSign,
      color: 'text-green-600',
      description: 'ضمن 5.1 إيرادات المبيعات'
    },
    {
      code: '5.2.1',
      name: 'إيرادات الشحن',
      type: 'revenue',
      icon: Truck,
      color: 'text-blue-600',
      description: 'ضمن 5.2 إيرادات الخدمات - الشحن'
    },
    {
      code: '5.2.2',
      name: 'رسوم المناولة',
      type: 'revenue',
      icon: Package,
      color: 'text-indigo-600',
      description: 'ضمن 5.2 إيرادات الخدمات - المناولة'
    },
    {
      code: '5.2.3',
      name: 'رسوم التخليص الجمركي',
      type: 'revenue',
      icon: Building,
      color: 'text-teal-600',
      description: 'ضمن 5.2 إيرادات الخدمات - التخليص'
    },
    {
      code: '5.2.4',
      name: 'رسوم التأمين',
      type: 'revenue',
      icon: Shield,
      color: 'text-cyan-600',
      description: 'ضمن 5.2 إيرادات الخدمات - التأمين'
    },
    {
      code: '5.2.5',
      name: 'رسوم التخزين',
      type: 'revenue',
      icon: Building,
      color: 'text-gray-600',
      description: 'ضمن 5.2 إيرادات الخدمات - التخزين'
    },
    {
      code: '5.1.9',
      name: 'خصومات المبيعات',
      type: 'revenue',
      icon: DollarSign,
      color: 'text-purple-600',
      description: 'حساب مقابل (contra) ضمن إيرادات المبيعات'
    },

    // الأصول - الذمم
    {
      code: '1.1.2.1',
      name: 'عملاء',
      type: 'asset',
      icon: FileText,
      color: 'text-orange-600',
      description: 'ضمن 1.1.2 المدينون - حساب العملاء'
    },

    // الالتزامات - ضريبة المبيعات المستحقة
    {
      code: '3.1.3',
      name: 'ضريبة المبيعات المستحقة',
      type: 'liability',
      icon: Shield,
      color: 'text-red-600',
      description: 'ضمن 3.1 الالتزامات المتداولة - ضرائب'
    }
  ];

  useEffect(() => {
    loadExistingAccounts();
  }, []);

  const loadExistingAccounts = async () => {
    try {
      const data = await (await import('../../services/api')).financialAPI.checkInvoiceAccounts();
      setExistingAccounts(data.existingAccounts || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setExistingAccounts([]);
    }
  };

  const createRequiredAccounts = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const data = await (await import('../../services/api')).financialAPI.autoCreateInvoiceAccounts();

      if (data.createdAccounts === 0) {
        setMessage({
          type: 'info',
          text: data.message || 'جميع الحسابات المطلوبة موجودة بالفعل في دليل الحسابات'
        });
      } else {
        setCreatedAccounts(data.accounts || []);
        setMessage({
          type: 'success',
          text: data.message || `تم إنشاء ${data.createdAccounts} حساب جديد بنجاح في دليل الحسابات`
        });

        // إشعار المكون الأب
        onAccountsCreated?.(data.accounts || []);

        // إعادة تحميل الحسابات الموجودة
        await loadExistingAccounts();
      }
    } catch (error: any) {
      console.error('Error creating accounts:', error);
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'حدث خطأ في الاتصال بالخادم'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountStatus = (code: string) => {
    const exists = existingAccounts.some(acc => acc.code === code);
    const created = createdAccounts.some(acc => acc.code === code);
    
    if (created) return 'created';
    if (exists) return 'exists';
    return 'missing';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'exists':
        return <Eye className="h-5 w-5 text-blue-500" />;
      case 'missing':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return 'تم الإنشاء';
      case 'exists':
        return 'موجود';
      case 'missing':
        return 'مفقود';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">إنشاء حسابات الفواتير تلقائياً</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          سيتم إنشاء الحسابات المطلوبة لنظام إدارة الفواتير تلقائياً في دليل الحسابات.
        </p>
        
        {message && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* قائمة الحسابات المطلوبة */}
      <div className="space-y-3 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">الحسابات المطلوبة:</h3>
        
        {requiredAccounts.map((account) => {
          const status = getAccountStatus(account.code);
          const Icon = account.icon;
          
          return (
            <div
              key={account.code}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                status === 'created' ? 'bg-green-50 border-green-200' :
                status === 'exists' ? 'bg-blue-50 border-blue-200' :
                'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${account.color}`} />
                <div>
                  <div className="font-medium text-gray-900">
                    {account.code} - {account.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {account.description}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <span className={`text-sm font-medium ${
                  status === 'created' ? 'text-green-600' :
                  status === 'exists' ? 'text-blue-600' :
                  'text-orange-600'
                }`}>
                  {getStatusText(status)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-between">
        <button
          onClick={loadExistingAccounts}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <RefreshCw className="h-4 w-4" />
          تحديث القائمة
        </button>
        
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              إلغاء
            </button>
          )}
          <button
            onClick={createRequiredAccounts}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحسابات المفقودة'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoAccountCreator;

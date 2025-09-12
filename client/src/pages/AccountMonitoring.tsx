import React, { useState, useEffect } from 'react';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { financialAPI } from '../services/api';
import { Modal } from '../components/UI/Modal';
import { Account } from '../types/financial';

interface MonitoredAccount {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  threshold: number;
  alertOnIncrease: boolean;
  alertOnDecrease: boolean;
  lastBalance: number;
  currentBalance: number;
  changeAmount: number;
  changePercent: number;
  lastUpdated: string;
}

const AccountMonitoring: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monitoredAccounts, setMonitoredAccounts] = useState<MonitoredAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    accountId: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    threshold: 0,
    alertOnIncrease: true,
    alertOnDecrease: true
  });

  useEffect(() => {
    loadAccounts();
    loadMonitoredAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await financialAPI.getAccounts({ limit: 1000 });
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    }
  };

  const loadMonitoredAccounts = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getMonitoredAccounts();
      setMonitoredAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading monitored accounts:', error);
      setMonitoredAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const addMonitoredAccount = () => {
    setSelectedAccount(null);
    setFormData({
      accountId: '',
      frequency: 'daily',
      threshold: 0,
      alertOnIncrease: true,
      alertOnDecrease: true
    });
    setIsModalOpen(true);
  };

  const saveMonitoredAccount = async () => {
    try {
      const account = accounts.find(acc => acc.id === formData.accountId);
      if (!account) return;

      const monitoredAccountData = {
        ...formData,
        accountCode: account.code,
        accountName: account.name
      };

      await financialAPI.createMonitoredAccount(monitoredAccountData);
      setIsModalOpen(false);
      loadMonitoredAccounts();
    } catch (error) {
      console.error('Error saving monitored account:', error);
    }
  };

  const removeMonitoredAccount = async (id: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا الحساب من المراقبة؟')) return;

    try {
      await financialAPI.deleteMonitoredAccount(id);
      loadMonitoredAccounts();
    } catch (error) {
      console.error('Error removing monitored account:', error);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري'
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <DollarSign className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">مراقبة الحسابات</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">مراقبة حركة الحسابات المهمة</p>
            </div>
            <button
              onClick={addMonitoredAccount}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة حساب للمراقبة
            </button>
          </div>
        </div>

        {/* Monitoring Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">الحسابات المراقبة</p>
                <p className="text-2xl font-bold text-gray-900">{monitoredAccounts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">زيادة في الأرصدة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monitoredAccounts.filter(acc => acc.changeAmount > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">انخفاض في الأرصدة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monitoredAccounts.filter(acc => acc.changeAmount < 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monitored Accounts Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">الحسابات المراقبة</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحساب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الرصيد الحالي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التغيير
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التكرار
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحد الأدنى
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      آخر تحديث
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monitoredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        لا توجد حسابات مراقبة
                      </td>
                    </tr>
                  ) : (
                    monitoredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {account.accountName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {account.accountCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                          {account.currentBalance.toLocaleString()} LYD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getChangeIcon(account.changeAmount)}
                            <span className={`mr-2 text-sm font-medium ${getChangeColor(account.changeAmount)}`}>
                              {account.changeAmount > 0 ? '+' : ''}{account.changeAmount.toLocaleString()} LYD
                            </span>
                            <span className={`text-xs ${getChangeColor(account.changePercent)}`}>
                              ({account.changePercent > 0 ? '+' : ''}{account.changePercent.toFixed(2)}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getFrequencyLabel(account.frequency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                          {account.threshold.toLocaleString()} LYD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(account.lastUpdated).toLocaleDateString('ar-LY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeMonitoredAccount(account.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Monitored Account Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="إضافة حساب للمراقبة"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختيار الحساب <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
              >
                <option value="">اختر الحساب</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تكرار المراقبة <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
              >
                <option value="daily">يومي</option>
                <option value="weekly">أسبوعي</option>
                <option value="monthly">شهري</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحد الأدنى للتغيير (LYD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.alertOnIncrease}
                  onChange={(e) => setFormData({ ...formData, alertOnIncrease: e.target.checked })}
                  className="ml-2 h-4 w-4 text-golden-600 focus:ring-golden-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">تنبيه عند الزيادة</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.alertOnDecrease}
                  onChange={(e) => setFormData({ ...formData, alertOnDecrease: e.target.checked })}
                  className="ml-2 h-4 w-4 text-golden-600 focus:ring-golden-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">تنبيه عند الانخفاض</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={saveMonitoredAccount}
                disabled={!formData.accountId}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-golden-600 hover:bg-golden-700 disabled:opacity-50"
              >
                حفظ
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AccountMonitoring;

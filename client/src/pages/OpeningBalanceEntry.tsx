import React, { useState, useEffect } from 'react';
import { Plus, Save, Download, Upload, AlertCircle, Calculator } from 'lucide-react';
import { financialAPI } from '../services/api';
import JournalEntryForm from '../components/Financial/JournalEntryForm';
import { Modal } from '../components/UI/Modal';
import { Account, JournalEntryLine } from '../types/financial';

interface OpeningBalanceEntry {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
  type: 'debit' | 'credit';
  currency: string;
  exchangeRate: number;
  description: string;
}

const OpeningBalanceEntry: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [openingBalances, setOpeningBalances] = useState<OpeningBalanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: 'قيد الأرصدة الافتتاحية',
    reference: 'OB-' + new Date().getFullYear(),
    currency: 'LYD',
    exchangeRate: 1,
    lines: [] as JournalEntryLine[]
  });

  useEffect(() => {
    loadAccounts();
    loadOpeningBalances();
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

  const loadOpeningBalances = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getOpeningBalances();
      setOpeningBalances(response.data || []);
    } catch (error) {
      console.error('Error loading opening balances:', error);
      setOpeningBalances([]);
    } finally {
      setLoading(false);
    }
  };

  const addOpeningBalance = (account: Account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const saveOpeningBalance = async () => {
    try {
      const balanceData = {
        accountId: selectedAccount!.id,
        balance: formData.lines[0]?.debit || formData.lines[0]?.credit || 0,
        type: formData.lines[0]?.debit > 0 ? 'debit' : 'credit',
        currency: formData.currency,
        exchangeRate: formData.exchangeRate,
        description: formData.description
      };

      await financialAPI.createOpeningBalance(balanceData);
      setIsModalOpen(false);
      loadOpeningBalances();
    } catch (error) {
      console.error('Error saving opening balance:', error);
    }
  };

  const createOpeningBalanceEntry = async () => {
    try {
      setLoading(true);
      
      // Create journal entry for opening balances
      const entryData = {
        ...formData,
        type: 'opening_balance',
        lines: openingBalances.map(balance => ({
          accountId: balance.accountId,
          accountCode: balance.accountCode,
          accountName: balance.accountName,
          description: balance.description,
          debit: balance.type === 'debit' ? balance.balance : 0,
          credit: balance.type === 'credit' ? balance.balance : 0,
          currency: balance.currency,
          exchangeRate: balance.exchangeRate
        }))
      };

      await financialAPI.createJournalEntry(entryData);
      alert('تم إنشاء القيد الافتتاحي بنجاح');
    } catch (error) {
      console.error('Error creating opening balance entry:', error);
      alert('حدث خطأ أثناء إنشاء القيد الافتتاحي');
    } finally {
      setLoading(false);
    }
  };

  const exportOpeningBalances = () => {
    const csvContent = [
      ['رقم الحساب', 'اسم الحساب', 'الرصيد', 'النوع', 'العملة', 'سعر الصرف', 'الوصف'],
      ...openingBalances.map(balance => [
        balance.accountCode,
        balance.accountName,
        balance.balance.toLocaleString(),
        balance.type === 'debit' ? 'مدين' : 'دائن',
        balance.currency,
        balance.exchangeRate.toString(),
        balance.description
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'opening_balances.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importOpeningBalances = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      const importedBalances: OpeningBalanceEntry[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 4) {
          const accountCode = values[0];
          const account = accounts.find(acc => acc.code === accountCode);
          
          if (account) {
            importedBalances.push({
              id: '',
              accountId: account.id,
              accountCode: account.code,
              accountName: account.name,
              balance: parseFloat(values[2]) || 0,
              type: values[3] === 'مدين' ? 'debit' : 'credit',
              currency: values[4] || 'LYD',
              exchangeRate: parseFloat(values[5]) || 1,
              description: values[6] || ''
            });
          }
        }
      }
      
      setOpeningBalances(importedBalances);
    };
    reader.readAsText(file);
  };

  const totalDebit = openingBalances
    .filter(b => b.type === 'debit')
    .reduce((sum, b) => sum + b.balance, 0);
  
  const totalCredit = openingBalances
    .filter(b => b.type === 'credit')
    .reduce((sum, b) => sum + b.balance, 0);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">القيد الافتتاحي</h1>
              <p className="text-gray-600 mt-1">إدارة الأرصدة الافتتاحية للحسابات</p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <Upload className="h-4 w-4 ml-2" />
                استيراد
                <input
                  type="file"
                  accept=".csv"
                  onChange={importOpeningBalances}
                  className="hidden"
                />
              </label>
              <button
                onClick={exportOpeningBalances}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </button>
              <button
                onClick={createOpeningBalanceEntry}
                disabled={loading || !isBalanced || openingBalances.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 ml-2" />
                إنشاء القيد الافتتاحي
              </button>
            </div>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ملخص الأرصدة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600">إجمالي المدين</div>
              <div className="text-lg font-bold text-red-900">
                {totalDebit.toLocaleString()} LYD
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">إجمالي الدائن</div>
              <div className="text-lg font-bold text-green-900">
                {totalCredit.toLocaleString()} LYD
              </div>
            </div>
            <div className={`p-4 rounded-lg ${isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-sm ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                الحالة
              </div>
              <div className={`text-lg font-bold ${isBalanced ? 'text-green-900' : 'text-red-900'}`}>
                {isBalanced ? 'متوازن' : 'غير متوازن'}
              </div>
            </div>
          </div>
          
          {!isBalanced && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 ml-2" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">الأرصدة غير متوازنة</p>
                  <p>الفرق: {(totalDebit - totalCredit).toLocaleString()} LYD</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Opening Balances Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">الأرصدة الافتتاحية</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة رصيد افتتاحي
              </button>
            </div>
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
                      رقم الحساب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم الحساب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الرصيد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العملة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      سعر الصرف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الوصف
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {openingBalances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        لا توجد أرصدة افتتاحية
                      </td>
                    </tr>
                  ) : (
                    openingBalances.map((balance) => (
                      <tr key={balance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {balance.accountCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {balance.accountName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                          {balance.balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            balance.type === 'debit' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {balance.type === 'debit' ? 'مدين' : 'دائن'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {balance.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {balance.exchangeRate}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {balance.description}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Opening Balance Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="إضافة رصيد افتتاحي"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختيار الحساب
              </label>
              <select
                value={selectedAccount?.id || ''}
                onChange={(e) => {
                  const account = accounts.find(acc => acc.id === e.target.value);
                  setSelectedAccount(account || null);
                }}
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

            {selectedAccount && (
              <JournalEntryForm
                formData={formData}
                onFormDataChange={setFormData}
                errors={{}}
                accounts={[selectedAccount]}
              />
            )}

            <div className="flex justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={saveOpeningBalance}
                disabled={!selectedAccount}
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

export default OpeningBalanceEntry;

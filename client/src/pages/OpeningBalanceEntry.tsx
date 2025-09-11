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
  const [modalMode, setModalMode] = useState<'single' | 'comprehensive'>('comprehensive');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: 'قيد الأرصدة الافتتاحية',
    reference: `OB-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    currency: 'LYD',
    exchangeRate: 1,
    lines: [
      {
        id: crypto.randomUUID(),
        accountId: '',
        accountCode: '',
        accountName: '',
        description: 'رصيد افتتاحي',
        debit: 0,
        credit: 0,
        exchangeRate: 1,
        balance: 0,
        totalDebit: 0,
        totalCredit: 0,
        notes: ''
      }
    ] as (JournalEntryLine & { notes?: string })[]
  });

  // حساب إجماليات التوازن
  const totalDebit = formData.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = formData.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const balanceDifference = totalDebit - totalCredit;
  const isBalanced = Math.abs(balanceDifference) < 0.01;

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
    setModalMode('single');
    setIsModalOpen(true);
  };

  const clearForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: 'قيد الأرصدة الافتتاحية',
      reference: `OB-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      currency: 'LYD',
      exchangeRate: 1,
      lines: [
        {
          id: crypto.randomUUID(),
          accountId: '',
          accountCode: '',
          accountName: '',
          description: 'رصيد افتتاحي',
          debit: 0,
          credit: 0,
          exchangeRate: 1,
          balance: 0,
          totalDebit: 0,
          totalCredit: 0,
          notes: ''
        }
      ]
    });
    setSearchTerm('');
    setFilteredAccounts([]);
  };

  // البحث في الحسابات
  const handleAccountSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      const filtered = accounts.filter(account =>
        account.code.toLowerCase().includes(term.toLowerCase()) ||
        account.name.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredAccounts(filtered);
    } else {
      setFilteredAccounts([]);
    }
  };

  // إضافة سطر جديد
  const addNewLine = () => {
    const newLine = {
      id: crypto.randomUUID(),
      accountId: '',
      accountCode: '',
      accountName: '',
      description: 'رصيد افتتاحي',
      debit: 0,
      credit: 0,
      exchangeRate: 1,
      balance: 0,
      totalDebit: 0,
      totalCredit: 0,
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));
  };

  // حذف سطر
  const removeLine = (lineId: string) => {
    if (formData.lines.length > 1) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter(line => line.id !== lineId)
      }));
    }
  };

  // تحديث سطر
  const updateLine = (lineId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.id === lineId ? { ...line, [field]: value } : line
      )
    }));
  };

  // اختيار حساب لسطر معين
  const selectAccountForLine = (lineId: string, account: Account) => {
    updateLine(lineId, 'accountId', account.id);
    updateLine(lineId, 'accountCode', account.code);
    updateLine(lineId, 'accountName', account.name);
    setSearchTerm('');
    setFilteredAccounts([]);
  };

  const saveOpeningBalance = async () => {
    try {
      if (modalMode === 'single' && selectedAccount) {
        // Save single account opening balance
        const balanceData = {
          accountId: selectedAccount.id,
          balance: formData.lines[0]?.debit || formData.lines[0]?.credit || 0,
          type: formData.lines[0]?.debit > 0 ? 'debit' : 'credit',
          currency: formData.currency,
          exchangeRate: formData.exchangeRate,
          description: formData.description
        };

        await financialAPI.createOpeningBalance(balanceData);
      } else if (modalMode === 'multiple') {
        // Save comprehensive opening entry as journal entry
        const filteredLines = formData.lines.filter(line =>
          line.accountId && (line.debit > 0 || line.credit > 0)
        );

        if (filteredLines.length === 0) {
          alert('يرجى إدخال بيانات الحسابات والمبالغ');
          return;
        }

        const entryData = {
          ...formData,
          type: 'opening_balance',
          lines: filteredLines
        };

        await financialAPI.createJournalEntry(entryData);
      }

      setIsModalOpen(false);
      loadOpeningBalances();
    } catch (error) {
      console.error('Error saving opening balance:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
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

  const existingTotalDebit = openingBalances
    .filter(b => b.type === 'debit')
    .reduce((sum, b) => sum + b.balance, 0);

  const existingTotalCredit = openingBalances
    .filter(b => b.type === 'credit')
    .reduce((sum, b) => sum + b.balance, 0);

  const existingIsBalanced = Math.abs(existingTotalDebit - existingTotalCredit) < 0.01;

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
                disabled={loading || !existingIsBalanced || openingBalances.length === 0}
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
                {existingTotalDebit.toLocaleString()} LYD
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">إجمالي الدائن</div>
              <div className="text-lg font-bold text-green-900">
                {existingTotalCredit.toLocaleString()} LYD
              </div>
            </div>
            <div className={`p-4 rounded-lg ${existingIsBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-sm ${existingIsBalanced ? 'text-green-600' : 'text-red-600'}`}>
                الحالة
              </div>
              <div className={`text-lg font-bold ${existingIsBalanced ? 'text-green-900' : 'text-red-900'}`}>
                {existingIsBalanced ? 'متوازن' : 'غير متوازن'}
              </div>
            </div>
          </div>

          {!existingIsBalanced && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 ml-2" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">الأرصدة غير متوازنة</p>
                  <p>الفرق: {(existingTotalDebit - existingTotalCredit).toLocaleString()} LYD</p>
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
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={() => {
                    setModalMode('single');
                    setSelectedAccount(null);
                    clearForm();
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  رصيد حساب واحد
                </button>
                <button
                  onClick={() => {
                    setModalMode('comprehensive');
                    setSelectedAccount(null);
                    clearForm();
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  قيد افتتاحي شامل
                </button>
              </div>
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
          title={modalMode === 'single' ? 'إضافة رصيد افتتاحي لحساب واحد' : 'إنشاء قيد افتتاحي شامل'}
          size={modalMode === 'single' ? 'lg' : '4xl'}
        >
          <div className="space-y-6">
            {modalMode === 'single' ? (
              <>
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
              </>
            ) : (
              <div className="space-y-6">
                {/* معلومات أساسية للقيد */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات أساسية للقيد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم القيد الافتتاحي
                      </label>
                      <input
                        type="text"
                        value={formData.reference}
                        onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                        placeholder="OB-2024-0001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        التاريخ
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العملة
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                      >
                        <option value="LYD">دينار ليبي (LYD)</option>
                        <option value="USD">دولار أمريكي (USD)</option>
                        <option value="EUR">يورو (EUR)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الوصف / البيان
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                      placeholder="قيد الأرصدة الافتتاحية للسنة المالية الجديدة"
                    />
                  </div>
                </div>

                {/* جدول الحسابات والأرصدة */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">جدول الحسابات والأرصدة</h3>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleAccountSearch(e.target.value)}
                            placeholder="البحث في الحسابات..."
                            className="w-64 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                          />
                          {filteredAccounts.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredAccounts.map((account) => (
                                <div
                                  key={account.id}
                                  onClick={() => {
                                    const newLine = {
                                      id: crypto.randomUUID(),
                                      accountId: account.id,
                                      accountCode: account.code,
                                      accountName: account.name,
                                      description: 'رصيد افتتاحي',
                                      debit: 0,
                                      credit: 0,
                                      exchangeRate: 1,
                                      balance: 0,
                                      totalDebit: 0,
                                      totalCredit: 0,
                                      notes: ''
                                    };
                                    setFormData(prev => ({
                                      ...prev,
                                      lines: [...prev.lines, newLine]
                                    }));
                                    setSearchTerm('');
                                    setFilteredAccounts([]);
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                >
                                  <div className="font-medium">{account.code} - {account.name}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={addNewLine}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4 ml-1" />
                          إضافة سطر
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            رقم الحساب
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            اسم الحساب
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            مدين
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            دائن
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ملاحظات
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            إجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.lines.map((line, index) => (
                          <tr key={line.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="text"
                                value={line.accountCode}
                                onChange={(e) => {
                                  updateLine(line.id, 'accountCode', e.target.value);
                                  // البحث التلقائي عن الحساب
                                  const account = accounts.find(acc => acc.code === e.target.value);
                                  if (account) {
                                    updateLine(line.id, 'accountId', account.id);
                                    updateLine(line.id, 'accountName', account.name);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-golden-500 focus:border-golden-500"
                                placeholder="رقم الحساب"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={line.accountId}
                                onChange={(e) => {
                                  const account = accounts.find(acc => acc.id === e.target.value);
                                  if (account) {
                                    selectAccountForLine(line.id, account);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-golden-500 focus:border-golden-500"
                              >
                                <option value="">اختر الحساب</option>
                                {accounts.map(account => (
                                  <option key={account.id} value={account.id}>
                                    {account.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="number"
                                step="0.01"
                                value={line.debit || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  updateLine(line.id, 'debit', value);
                                  if (value > 0) {
                                    updateLine(line.id, 'credit', 0);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-golden-500 focus:border-golden-500 text-right"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="number"
                                step="0.01"
                                value={line.credit || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  updateLine(line.id, 'credit', value);
                                  if (value > 0) {
                                    updateLine(line.id, 'debit', 0);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-golden-500 focus:border-golden-500 text-right"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={line.notes || ''}
                                onChange={(e) => updateLine(line.id, 'notes', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-golden-500 focus:border-golden-500"
                                placeholder="ملاحظات..."
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => removeLine(line.id)}
                                disabled={formData.lines.length === 1}
                                className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* مؤشرات التوازن */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">مؤشرات التوازن</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-sm font-medium text-gray-500">إجمالي المدين</div>
                      <div className="text-2xl font-bold text-green-600">
                        {totalDebit.toLocaleString('ar-LY', { minimumFractionDigits: 2 })} {formData.currency}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-sm font-medium text-gray-500">إجمالي الدائن</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {totalCredit.toLocaleString('ar-LY', { minimumFractionDigits: 2 })} {formData.currency}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-sm font-medium text-gray-500">الفرق</div>
                      <div className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(balanceDifference).toLocaleString('ar-LY', { minimumFractionDigits: 2 })} {formData.currency}
                      </div>
                      {!isBalanced && (
                        <div className="text-xs text-red-500 mt-1">
                          يجب أن يكون الفرق = صفر
                        </div>
                      )}
                    </div>
                  </div>

                  {!isBalanced && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-400 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-red-800">
                          <strong>تحذير:</strong> القيد غير متوازن. يجب أن يكون إجمالي المدين مساوياً لإجمالي الدائن.
                        </div>
                      </div>
                    </div>
                  )}

                  {isBalanced && totalDebit > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-400 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-green-800">
                          <strong>ممتاز!</strong> القيد متوازن ويمكن حفظه.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* أزرار التحكم */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={clearForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  مسح البيانات
                </button>
              </div>

              <div className="flex space-x-2 space-x-reverse">
                {modalMode === 'comprehensive' && (
                  <>
                    <button
                      onClick={() => {
                        // حفظ كمسودة
                        const draftData = { ...formData, status: 'draft' };
                        console.log('Saving as draft:', draftData);
                        // يمكن إضافة منطق حفظ المسودة هنا
                      }}
                      className="px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      حفظ كمسودة
                    </button>
                    <button
                      onClick={() => {
                        // تصدير إلى Excel
                        const exportData = formData.lines.filter(line => line.accountId);
                        console.log('Exporting to Excel:', exportData);
                        // يمكن إضافة منطق التصدير هنا
                      }}
                      disabled={formData.lines.filter(line => line.accountId).length === 0}
                      className="px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      تصدير Excel
                    </button>
                  </>
                )}
                <button
                  onClick={saveOpeningBalance}
                  disabled={
                    modalMode === 'single'
                      ? !selectedAccount
                      : (!isBalanced || formData.lines.filter(line => line.accountId).length === 0)
                  }
                  className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-golden-600 hover:bg-golden-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalMode === 'single' ? 'حفظ الرصيد' : 'حفظ القيد الافتتاحي'}
                </button>
                {modalMode === 'comprehensive' && isBalanced && totalDebit > 0 && (
                  <button
                    onClick={() => {
                      // ترحيل الأرصدة
                      console.log('Posting balances to ledger');
                      // يمكن إضافة منطق الترحيل هنا
                    }}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                  >
                    ترحيل الأرصدة
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default OpeningBalanceEntry;

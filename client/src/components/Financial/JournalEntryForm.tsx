import React, { useState, useEffect } from 'react';
import { Plus, Minus, Calculator, AlertCircle } from 'lucide-react';
import { Account, JournalEntryLine } from '../../types/financial';
import { financialAPI } from '../../services/api';

interface JournalEntryFormProps {
  formData: {
    date: string;
    description: string;
    reference?: string;
    currency: string;
    exchangeRate: number;
    lines: JournalEntryLine[];
  };
  onFormDataChange: (data: any) => void;
  errors: Record<string, string>;
  accounts: Account[];
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  formData,
  onFormDataChange,
  errors,
  accounts
}) => {
  const [accountSearchResults, setAccountSearchResults] = useState<Account[]>([]);
  const [searchingAccount, setSearchingAccount] = useState<string>('');

  // Calculate totals
  const totalDebit = formData.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = formData.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const totalDebitConverted = totalDebit * formData.exchangeRate;
  const totalCreditConverted = totalCredit * formData.exchangeRate;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Function to check if a line is empty
  const isLineEmpty = (line: JournalEntryLine) => {
    return !line.accountId && 
           !line.description && 
           (!line.debit || line.debit === 0) && 
           (!line.credit || line.credit === 0);
  };

  // Function to check if a line has data
  const isLineFilled = (line: JournalEntryLine) => {
    return line.accountId && 
           (line.description || (line.debit && line.debit > 0) || (line.credit && line.credit > 0));
  };

  // Auto-add new line when second line (index 1) is filled
  useEffect(() => {
    const lines = formData.lines;
    if (lines.length >= 2) {
      const secondLine = lines[1];
      const lastLine = lines[lines.length - 1];
      
      // If second line is filled and last line is empty, add a new line
      if (isLineFilled(secondLine) && isLineEmpty(lastLine)) {
        addLine();
      }
    }
  }, [formData.lines]);

  const addLine = () => {
    onFormDataChange({
      ...formData,
      lines: [...formData.lines, {
        id: '',
        accountId: '',
        accountCode: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
        currency: formData.currency,
        exchangeRate: formData.exchangeRate
      }]
    });
  };

  const removeLine = (index: number) => {
    if (formData.lines.length > 2) {
      const newLines = formData.lines.filter((_, i) => i !== index);
      onFormDataChange({ ...formData, lines: newLines });
    }
  };

  const updateLine = (
    index: number,
    field: 'accountId' | 'accountCode' | 'accountName' | 'debit' | 'credit' | 'description',
    value: any
  ) => {
    const newLines = [...formData.lines];
    const line = { ...newLines[index] };

    if (field === 'accountId' || field === 'accountCode' || field === 'accountName') {
      // Handle account search and selection
      if (field === 'accountCode' || field === 'accountName') {
        searchAccounts(value, field);
        line[field] = value;
        line.accountId = ''; // Clear account ID when searching
      } else {
        // Account selected from dropdown
        const selectedAccount = accounts.find(acc => acc.id === value);
        if (selectedAccount) {
          line.accountId = selectedAccount.id;
          line.accountCode = selectedAccount.code;
          line.accountName = selectedAccount.name;
        }
      }
    } else if (field === 'debit') {
      line.debit = parseFloat(value) || 0;
      line.credit = 0; // Clear credit when debit is entered
    } else if (field === 'credit') {
      line.credit = parseFloat(value) || 0;
      line.debit = 0; // Clear debit when credit is entered
    } else if (field === 'description') {
      line.description = value;
    }

    newLines[index] = line;
    onFormDataChange({ ...formData, lines: newLines });
  };

  // Function to clean empty lines before saving
  const cleanEmptyLines = () => {
    const cleanedLines = formData.lines.filter(line => !isLineEmpty(line));
    onFormDataChange({ ...formData, lines: cleanedLines });
  };

  const searchAccounts = async (searchTerm: string, searchField: 'accountCode' | 'accountName') => {
    if (searchTerm.length < 2) {
      setAccountSearchResults([]);
      return;
    }

    try {
      setSearchingAccount(searchField);
      const response = await financialAPI.getAccounts({
        search: searchTerm,
        limit: 10
      });
      setAccountSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching accounts:', error);
      setAccountSearchResults([]);
    }
  };

  const selectAccount = (account: Account, lineIndex: number) => {
    updateLine(lineIndex, 'accountId', account.id);
    setAccountSearchResults([]);
    setSearchingAccount('');
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.balance || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            التاريخ <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => onFormDataChange({ ...formData, date: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            العملة
          </label>
          <select
            value={formData.currency}
            onChange={(e) => onFormDataChange({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
          >
            <option value="LYD">دينار ليبي</option>
            <option value="USD">دولار أمريكي</option>
            <option value="EUR">يورو</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            سعر الصرف
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.exchangeRate}
            onChange={(e) => onFormDataChange({ 
              ...formData, 
              exchangeRate: parseFloat(e.target.value) || 1 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          البيان <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="أدخل وصف القيد..."
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Journal Entry Lines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">تفاصيل القيد</h3>
          <div className="flex space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={cleanEmptyLines}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Minus className="h-4 w-4 ml-1" />
              تنظيف الأسطر الفارغة
            </button>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-golden-600 hover:bg-golden-700"
            >
              <Plus className="h-4 w-4 ml-1" />
              إضافة سطر
            </button>
          </div>
        </div>

        {/* Lines Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحساب
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البيان
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مدين
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  دائن
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الرصيد
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.lines.map((line, index) => (
                <tr key={index} className={`hover:bg-gray-50 ${isLineEmpty(line) ? 'bg-yellow-50' : ''}`}>
                  {/* Account Selection */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="relative">
                      <input
                        type="text"
                        value={line.accountCode || ''}
                        onChange={(e) => updateLine(index, 'accountCode', e.target.value)}
                        placeholder="رقم الحساب"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                      />
                      {searchingAccount === 'accountCode' && accountSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {accountSearchResults.map((account) => (
                            <div
                              key={account.id}
                              onClick={() => selectAccount(account, index)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              <div className="font-medium">{account.code}</div>
                              <div className="text-gray-600">{account.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={line.accountName || ''}
                        onChange={(e) => updateLine(index, 'accountName', e.target.value)}
                        placeholder="اسم الحساب"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                      />
                      {searchingAccount === 'accountName' && accountSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {accountSearchResults.map((account) => (
                            <div
                              key={account.id}
                              onClick={() => selectAccount(account, index)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              <div className="font-medium">{account.name}</div>
                              <div className="text-gray-600">{account.code}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={line.description || ''}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      placeholder="البيان"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                    />
                  </td>

                  {/* Debit */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debit || ''}
                      onChange={(e) => updateLine(index, 'debit', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm text-left"
                    />
                  </td>

                  {/* Credit */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.credit || ''}
                      onChange={(e) => updateLine(index, 'credit', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm text-left"
                    />
                  </td>

                  {/* Balance */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {line.accountId ? (
                      <span className={`font-medium ${
                        getAccountBalance(line.accountId) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {getAccountBalance(line.accountId).toLocaleString()} {formData.currency}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {formData.lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 px-4 py-3 rounded-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">إجمالي المدين:</span>
              <div className="text-lg font-bold text-red-600">
                {(isNaN(totalDebit) || !isFinite(totalDebit) ? 0 : totalDebit).toLocaleString('ar-LY')} {formData.currency}
              </div>
              <div className="text-sm text-gray-500">
                {(isNaN(totalDebitConverted) || !isFinite(totalDebitConverted) ? 0 : totalDebitConverted).toLocaleString('ar-LY')} (محول)
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">إجمالي الدائن:</span>
              <div className="text-lg font-bold text-green-600">
                {(isNaN(totalCredit) || !isFinite(totalCredit) ? 0 : totalCredit).toLocaleString('ar-LY')} {formData.currency}
              </div>
              <div className="text-sm text-gray-500">
                {(isNaN(totalCreditConverted) || !isFinite(totalCreditConverted) ? 0 : totalCreditConverted).toLocaleString('ar-LY')} (محول)
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">الفرق:</span>
              <div className={`text-lg font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {(totalDebit - totalCredit).toLocaleString()} {formData.currency}
              </div>
            </div>
            <div className="flex items-center">
              {isBalanced ? (
                <div className="flex items-center text-green-600">
                  <Calculator className="h-5 w-5 ml-1" />
                  <span className="font-medium">متوازن</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 ml-1" />
                  <span className="font-medium">غير متوازن</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Balance Error */}
        {!isBalanced && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 ml-2" />
              <div className="text-sm text-red-700">
                <p className="font-medium">القيد غير متوازن</p>
                <p>يجب أن يساوي إجمالي المدين إجمالي الدائن</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntryForm;




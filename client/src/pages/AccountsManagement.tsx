import React, { useState, useEffect } from 'react';
import { Trash2, Edit, AlertTriangle, Shield, Database, RefreshCw, Lock } from 'lucide-react';
import { financialAPI } from '../services/api';
import { Account } from '../types/financial';
import { useAuth } from '../contexts/AuthContext';

interface AccountsManagementProps {}

const AccountsManagement: React.FC<AccountsManagementProps> = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'normal' | 'force'>('normal');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getAccounts({ limit: 1000 });
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-md text-center shadow-sm">
          <Lock className="h-10 w-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-700 mb-2">غير مصرح لك بالوصول</h2>
          <p className="text-gray-600">هذه الصفحة متاحة لمدراء النظام فقط.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // سيقوم ProtectedRoute بإعادة التوجيه لتسجيل الدخول
  }

  const handleDeleteAccount = async (account: Account, force = false) => {
    try {
      if (force) {
        // Force delete - remove system protection and clear dependencies
        await forceDeleteAccount(account);
      } else {
        // Normal delete
        await financialAPI.deleteAccount(account.id);
      }
      
      await loadAccounts();
      setShowDeleteModal(false);
      setSelectedAccount(null);
      alert('تم حذف الحساب بنجاح');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ أثناء حذف الحساب';
      alert(errorMessage);
    }
  };

  const forceDeleteAccount = async (account: Account) => {
    try {
      // Step 1: Remove system account protection and clear balance
      await financialAPI.updateAccount(account.id, {
        isSystemAccount: false,
        balance: 0
      });

      // Step 2: Handle child accounts - move them to parent or make them root
      const childAccounts = accounts.filter(acc => acc.parentId === account.id);
      for (const child of childAccounts) {
        await financialAPI.updateAccount(child.id, {
          parentId: account.parentId || null,
          level: account.parentId ? (account.level || 1) : 1
        });
      }

      // Step 3: Try to delete the account using the regular API first
      try {
        await financialAPI.deleteAccount(account.id);
      } catch (deleteError) {
        // If regular delete fails, try to use a force delete endpoint
        console.warn('Regular delete failed, attempting force delete:', deleteError);

        // Use API wrapper for force delete
        await financialAPI.forceDeleteAccount(account.id);
      }
    } catch (error) {
      throw error;
    }
  };

  const resetAccountToEditable = async (account: Account) => {
    try {
      const updates: any = {};

      if (account.isSystemAccount) {
        updates.isSystemAccount = false;
      }

      if (parseFloat(account.balance?.toString() || '0') !== 0) {
        updates.balance = 0;
      }

      if (Object.keys(updates).length > 0) {
        await financialAPI.updateAccount(account.id, updates);
        await loadAccounts();
        alert('تم إعداد الحساب للتعديل/الحذف');
      } else {
        alert('الحساب جاهز للتعديل/الحذف');
      }
    } catch (error: any) {
      console.error('Error resetting account:', error);
      alert('حدث خطأ أثناء إعداد الحساب');
    }
  };

  const resetAllAccounts = async () => {
    if (!window.confirm('هل أنت متأكد من إعادة تعيين جميع الحسابات؟ سيتم حذف جميع الحسابات الموجودة وإنشاء حسابات جديدة بالترقيم البسيط (1,2,3,4,5)')) {
      return;
    }

    try {
      setLoading(true);

      // Step 1: Get all accounts and remove system protection
      const allAccounts = accounts;
      for (const account of allAccounts) {
        if (account.isSystemAccount || parseFloat(account.balance?.toString() || '0') !== 0) {
          await financialAPI.updateAccount(account.id, {
            isSystemAccount: false,
            balance: 0
          });
        }
      }

      // Step 2: Delete all accounts (starting with children first)
      const sortedAccounts = [...allAccounts].sort((a, b) => (b.level || 1) - (a.level || 1));
      for (const account of sortedAccounts) {
        try {
          await financialAPI.deleteAccount(account.id);
        } catch (error) {
          console.warn(`Could not delete account ${account.code}:`, error);
        }
      }

      // Step 3: Create new simple accounts
      const newAccounts = [
        {
          code: '1',
          name: 'الأصول',
          nameEn: 'Assets',
          type: 'asset',
          rootType: 'Asset',
          reportType: 'Balance Sheet',
          nature: 'debit'
        },
        {
          code: '2',
          name: 'المصروفات',
          nameEn: 'Expenses',
          type: 'expense',
          rootType: 'Expense',
          reportType: 'Profit and Loss',
          nature: 'debit'
        },
        {
          code: '3',
          name: 'الالتزامات',
          nameEn: 'Liabilities',
          type: 'liability',
          rootType: 'Liability',
          reportType: 'Balance Sheet',
          nature: 'credit'
        },
        {
          code: '4',
          name: 'حقوق الملكية',
          nameEn: 'Equity',
          type: 'equity',
          rootType: 'Equity',
          reportType: 'Balance Sheet',
          nature: 'credit'
        },
        {
          code: '5',
          name: 'الإيرادات',
          nameEn: 'Revenue',
          type: 'revenue',
          rootType: 'Income',
          reportType: 'Profit and Loss',
          nature: 'credit'
        }
      ];

      for (const account of newAccounts) {
        await financialAPI.createAccount({
          code: account.code,
          name: account.name,
          nameEn: account.nameEn,
          type: account.type,
          rootType: account.rootType,
          reportType: account.reportType,
          accountType: 'main',
          nature: account.nature,
          level: 1,
          isActive: true,
          currency: 'LYD',
          description: `حساب ${account.name} الأساسي`,
          notes: 'حساب أساسي',
          isSystemAccount: false,
          isGroup: true,
          parentId: null
        });
      }

      await loadAccounts();
      alert('تم إعادة تعيين جميع الحسابات بنجاح! الآن لديك 5 حسابات أساسية بالترقيم البسيط (1,2,3,4,5)');
    } catch (error: any) {
      console.error('Error resetting all accounts:', error);
      alert('حدث خطأ أثناء إعادة تعيين الحسابات');
    } finally {
      setLoading(false);
    }
  };

  const getAccountStatus = (account: Account) => {
    const issues = [];
    
    if (account.isSystemAccount) {
      issues.push('حساب نظام');
    }
    
    if (parseFloat(account.balance?.toString() || '0') !== 0) {
      issues.push('له رصيد');
    }
    
    const childCount = accounts.filter(acc => acc.parentId === account.id).length;
    if (childCount > 0) {
      issues.push(`له ${childCount} حساب فرعي`);
    }
    
    return issues;
  };

  const canDelete = (account: Account) => {
    const issues = getAccountStatus(account);
    return issues.length === 0;
  };

  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500 ml-2" />
          <h3 className="text-lg font-semibold">تأكيد حذف الحساب</h3>
        </div>
        
        {selectedAccount && (
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              هل تريد حذف الحساب: <strong>{selectedAccount.name}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-2">
              الكود: {selectedAccount.code}
            </p>
            
            {getAccountStatus(selectedAccount).length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm font-medium text-yellow-800 mb-1">مشاكل الحساب:</p>
                <ul className="text-sm text-yellow-700">
                  {getAccountStatus(selectedAccount).map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          {canDelete(selectedAccount!) && (
            <button
              onClick={() => handleDeleteAccount(selectedAccount!, false)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              حذف عادي
            </button>
          )}
          
          <button
            onClick={() => handleDeleteAccount(selectedAccount!, true)}
            className="w-full px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
          >
            حذف قسري (يحل جميع المشاكل)
          </button>
          
          <button
            onClick={() => setShowDeleteModal(false)}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الحسابات المتقدمة</h1>
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={loadAccounts}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            onClick={resetAllAccounts}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            <Database className="h-4 w-4 ml-2" />
            إعادة تعيين الكل
          </button>
        </div>
      </div>

      {/* تحذير مهم */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 ml-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">تحذير مهم</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>• استخدم هذه الأدوات بحذر - يمكن أن تؤثر على بيانات النظام</p>
              <p>• زر "إعادة تعيين الكل" سيحذف جميع الحسابات الموجودة وينشئ حسابات جديدة بالترقيم البسيط</p>
              <p>• تأكد من عمل نسخة احتياطية قبل استخدام "إعادة تعيين الكل"</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الكود
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  اسم الحساب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الرصيد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {account.isSystemAccount && (
                        <Shield className="h-4 w-4 text-blue-500 ml-2" />
                      )}
                      {account.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {parseFloat(account.balance?.toString() || '0').toLocaleString()} {account.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAccountStatus(account).length === 0 ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        قابل للحذف
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {getAccountStatus(account).map((issue, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 block">
                            {issue}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                    <button
                      onClick={() => resetAccountToEditable(account)}
                      className="text-blue-600 hover:text-blue-900"
                      title="إعداد للتعديل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default AccountsManagement;

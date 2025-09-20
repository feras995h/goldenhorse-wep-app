
// واجهة مستخدم شاملة لإدارة دليل الحسابات
import React, { useState, useEffect } from 'react';
import { financialAPI } from '../services/api';

const ChartOfAccountsManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    isActive: true
  });

  // جلب الحسابات
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getAccounts(filters);
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // إنشاء حساب جديد
  const createAccount = async (accountData) => {
    try {
      const response = await financialAPI.createAccount(accountData);
      await loadAccounts();
      setShowCreateForm(false);
      return response;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  // تحديث حساب
  const updateAccount = async (accountId, updateData) => {
    try {
      const response = await financialAPI.updateAccount(accountId, updateData);
      await loadAccounts();
      setEditingAccount(null);
      return response;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  };

  // حذف حساب
  const deleteAccount = async (accountId) => {
    try {
      const response = await financialAPI.deleteAccount(accountId);
      await loadAccounts();
      return response;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  // إنشاء فئة أصل ثابت
  const createFixedAssetCategory = async (categoryData) => {
    try {
      const response = await financialAPI.createFixedAssetCategory(categoryData);
      await loadAccounts();
      return response;
    } catch (error) {
      console.error('Error creating fixed asset category:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [filters]);

  return (
    <div className="chart-of-accounts-manager">
      <div className="header">
        <h2>إدارة دليل الحسابات</h2>
        <div className="actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            إضافة حساب جديد
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowCreateForm(true)}
          >
            إضافة فئة أصل ثابت
          </button>
        </div>
      </div>

      <div className="filters">
        <select 
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="">جميع الأنواع</option>
          <option value="asset">أصول</option>
          <option value="liability">التزامات</option>
          <option value="equity">حقوق الملكية</option>
          <option value="revenue">إيرادات</option>
          <option value="expense">مصروفات</option>
        </select>
        
        <select 
          value={filters.isActive}
          onChange={(e) => setFilters({...filters, isActive: e.target.value === 'true'})}
        >
          <option value="true">نشط</option>
          <option value="false">غير نشط</option>
        </select>
      </div>

      <div className="accounts-list">
        {loading ? (
          <div className="loading">جاري التحميل...</div>
        ) : (
          <table className="accounts-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>المستوى</th>
                <th>الحالة</th>
                <th>الرصيد</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.id}>
                  <td>{account.code}</td>
                  <td>{account.name}</td>
                  <td>{account.type}</td>
                  <td>{account.level}</td>
                  <td>{account.isActive ? 'نشط' : 'غير نشط'}</td>
                  <td>{account.balance}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => setEditingAccount(account)}
                    >
                      تعديل
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteAccount(account.id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateForm && (
        <CreateAccountForm
          onSubmit={createAccount}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {editingAccount && (
        <EditAccountForm
          account={editingAccount}
          onSubmit={(data) => updateAccount(editingAccount.id, data)}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </div>
  );
};

export default ChartOfAccountsManager;

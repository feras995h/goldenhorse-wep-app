import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Lock, Unlock, Archive, Edit, Trash2, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import api, { financialAPI } from '../services/api';

interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  status: 'open' | 'closed' | 'archived';
  startDate: string;
  endDate: string;
  closedAt?: string;
  closedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
  notes?: string;
  totalTransactions?: number;
  totalDebit?: number;
  totalCredit?: number;
  closedByUser?: {
    id: string;
    name: string;
    username: string;
  };
  archivedByUser?: {
    id: string;
    name: string;
    username: string;
  };
}

interface CreatePeriodData {
  year: number;
  month: number;
  notes?: string;
}

const AccountingPeriods: React.FC = () => {
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);
  const [createData, setCreateData] = useState<CreatePeriodData>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    notes: ''
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.get('/api/accounting-periods');
      if (response.data.success) {
        setPeriods(response.data.data);
      } else {
        setError(response.data.message || 'خطأ في جلب الفترات المحاسبية');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const createPeriod = async () => {
    try {
      setActionLoading('create');
      const response = await api.post('/api/accounting-periods', createData);
      if (response.data.success) {
        await fetchPeriods();
        setShowCreateModal(false);
        setCreateData({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          notes: ''
        });
      } else {
        setError(response.data.message || 'خطأ في إنشاء الفترة المحاسبية');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في إنشاء الفترة المحاسبية');
    } finally {
      setActionLoading(null);
    }
  };

  const closePeriod = async (periodId: string) => {
    if (!confirm('هل أنت متأكد من إقفال هذه الفترة المحاسبية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      setActionLoading(`close-${periodId}`);
      const response = await api.post(`/api/accounting-periods/${periodId}/close`, {
        createClosingEntries: true
      });
      if (response.data.success) {
        await fetchPeriods();
      } else {
        setError(response.data.message || 'خطأ في إقفال الفترة المحاسبية');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في إقفال الفترة المحاسبية');
    } finally {
      setActionLoading(null);
    }
  };

  const reopenPeriod = async (periodId: string) => {
    if (!confirm('هل أنت متأكد من إعادة فتح هذه الفترة المحاسبية؟')) {
      return;
    }

    try {
      setActionLoading(`reopen-${periodId}`);
      const response = await api.post(`/api/accounting-periods/${periodId}/reopen`);
      if (response.data.success) {
        await fetchPeriods();
      } else {
        setError(response.data.message || 'خطأ في إعادة فتح الفترة المحاسبية');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في إعادة فتح الفترة المحاسبية');
    } finally {
      setActionLoading(null);
    }
  };

  const archivePeriod = async (periodId: string) => {
    if (!confirm('هل أنت متأكد من أرشفة هذه الفترة المحاسبية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      setActionLoading(`archive-${periodId}`);
      const response = await api.post(`/api/accounting-periods/${periodId}/archive`);
      if (response.data.success) {
        await fetchPeriods();
      } else {
        setError(response.data.message || 'خطأ في أرشفة الفترة المحاسبية');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في أرشفة الفترة المحاسبية');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <Lock className="h-4 w-4 text-yellow-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'مفتوحة';
      case 'closed':
        return 'مقفلة';
      case 'archived':
        return 'مؤرشفة';
      default:
        return 'غير محدد';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-golden-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-golden-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة الفترات المحاسبية</h1>
                <p className="text-gray-600">إدارة وإقفال الفترات المحاسبية</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
            >
              <Plus className="h-4 w-4 ml-2" />
              إنشاء فترة جديدة
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 ml-2" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mr-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Periods Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">الفترات المحاسبية</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفترة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التواريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المعاملات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجماليات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getMonthName(period.month)} {period.year}
                      </div>
                      {period.notes && (
                        <div className="text-sm text-gray-500">{period.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDate(period.startDate)}</div>
                      <div className="text-gray-500">إلى {formatDate(period.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                        {getStatusIcon(period.status)}
                        <span className="mr-1">{getStatusText(period.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {period.totalTransactions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {period.totalDebit && period.totalCredit ? (
                        <div>
                          <div>مدين: {formatCurrency(period.totalDebit)}</div>
                          <div>دائن: {formatCurrency(period.totalCredit)}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">غير محسوب</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPeriod(period);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {period.status === 'open' && (
                          <button
                            onClick={() => closePeriod(period.id)}
                            disabled={actionLoading === `close-${period.id}`}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                            title="إقفال الفترة"
                          >
                            {actionLoading === `close-${period.id}` ? (
                              <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        {period.status === 'closed' && (
                          <>
                            <button
                              onClick={() => reopenPeriod(period.id)}
                              disabled={actionLoading === `reopen-${period.id}`}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="إعادة فتح الفترة"
                            >
                              {actionLoading === `reopen-${period.id}` ? (
                                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => archivePeriod(period.id)}
                              disabled={actionLoading === `archive-${period.id}`}
                              className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                              title="أرشفة الفترة"
                            >
                              {actionLoading === `archive-${period.id}` ? (
                                <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {periods.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد فترات محاسبية</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإنشاء فترة محاسبية جديدة</p>
            </div>
          )}
        </div>

        {/* Create Period Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">إنشاء فترة محاسبية جديدة</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السنة
                    </label>
                    <input
                      type="number"
                      value={createData.year}
                      onChange={(e) => setCreateData({ ...createData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-golden-500 focus:border-golden-500"
                      min="2020"
                      max="2030"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الشهر
                    </label>
                    <select
                      value={createData.month}
                      onChange={(e) => setCreateData({ ...createData, month: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-golden-500 focus:border-golden-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {getMonthName(month)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ملاحظات (اختياري)
                    </label>
                    <textarea
                      value={createData.notes}
                      onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-golden-500 focus:border-golden-500"
                      rows={3}
                      placeholder="أدخل أي ملاحظات حول هذه الفترة..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={createPeriod}
                    disabled={actionLoading === 'create'}
                    className="px-4 py-2 text-sm font-medium text-white bg-golden-600 border border-transparent rounded-md hover:bg-golden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500 disabled:opacity-50"
                  >
                    {actionLoading === 'create' ? (
                      <div className="flex items-center">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                        جاري الإنشاء...
                      </div>
                    ) : (
                      'إنشاء الفترة'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Period Details Modal */}
        {showDetailsModal && selectedPeriod && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-2xl max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    تفاصيل الفترة المحاسبية - {getMonthName(selectedPeriod.month)} {selectedPeriod.year}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الحالة</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPeriod.status)} mt-1`}>
                        {getStatusIcon(selectedPeriod.status)}
                        <span className="mr-1">{getStatusText(selectedPeriod.status)}</span>
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">عدد المعاملات</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPeriod.totalTransactions || 0}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">تاريخ البداية</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedPeriod.startDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">تاريخ النهاية</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedPeriod.endDate)}</p>
                    </div>
                  </div>
                  
                  {/* Financial Summary */}
                  {selectedPeriod.totalDebit && selectedPeriod.totalCredit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الملخص المالي</label>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">إجمالي المدين</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedPeriod.totalDebit)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">إجمالي الدائن</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedPeriod.totalCredit)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Closure Info */}
                  {selectedPeriod.status === 'closed' && selectedPeriod.closedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">معلومات الإقفال</label>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">تاريخ الإقفال</p>
                            <p className="text-sm text-gray-900">{formatDate(selectedPeriod.closedAt)}</p>
                          </div>
                          {selectedPeriod.closedByUser && (
                            <div>
                              <p className="text-sm text-gray-600">أقفلت بواسطة</p>
                              <p className="text-sm text-gray-900">{selectedPeriod.closedByUser.name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Archive Info */}
                  {selectedPeriod.status === 'archived' && selectedPeriod.archivedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">معلومات الأرشفة</label>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">تاريخ الأرشفة</p>
                            <p className="text-sm text-gray-900">{formatDate(selectedPeriod.archivedAt)}</p>
                          </div>
                          {selectedPeriod.archivedByUser && (
                            <div>
                              <p className="text-sm text-gray-600">أرشفت بواسطة</p>
                              <p className="text-sm text-gray-900">{selectedPeriod.archivedByUser.name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {selectedPeriod.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الملاحظات</label>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-900">{selectedPeriod.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingPeriods;
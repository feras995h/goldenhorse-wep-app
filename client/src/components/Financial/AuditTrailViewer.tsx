import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Activity, AlertCircle, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { financialAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface AuditTrailViewerProps {
  resourceType?: string;
  resourceId?: string;
  onClose?: () => void;
}

const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ 
  resourceType = 'opening_balances', 
  resourceId,
  onClose 
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, searchTerm, selectedAction, selectedUser, dateFrom, dateTo, resourceType, resourceId]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
        resource: resourceType
      };

      if (resourceId) params.resourceId = resourceId;
      if (searchTerm) params.search = searchTerm;
      if (selectedAction) params.action = selectedAction;
      if (selectedUser) params.userId = selectedUser;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const response = await financialAPI.get('/financial/audit-trail/financial', { params });
      setAuditLogs(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action.includes('UPDATE')) return <Activity className="h-4 w-4 text-blue-600" />;
    if (action.includes('DELETE')) return <XCircle className="h-4 w-4 text-red-600" />;
    if (action.includes('VIEW')) return <Eye className="h-4 w-4 text-gray-600" />;
    if (action.includes('DENIED')) return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-green-600 bg-green-50';
    if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50';
    if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
    if (action.includes('VIEW')) return 'text-gray-600 bg-gray-50';
    if (action.includes('DENIED')) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-50';
  };

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      'OPENING_BALANCE_CREATE_ATTEMPT': 'محاولة إنشاء رصيد افتتاحي',
      'OPENING_BALANCE_CREATE_SUCCESS': 'إنشاء رصيد افتتاحي بنجاح',
      'OPENING_BALANCE_UPDATE_ATTEMPT': 'محاولة تحديث رصيد افتتاحي',
      'OPENING_BALANCE_UPDATE_SUCCESS': 'تحديث رصيد افتتاحي بنجاح',
      'OPENING_BALANCE_DELETE_ATTEMPT': 'محاولة حذف رصيد افتتاحي',
      'OPENING_BALANCE_DELETE_SUCCESS': 'حذف رصيد افتتاحي بنجاح',
      'OPENING_BALANCE_VIEW_DENIED': 'رفض عرض الأرصدة الافتتاحية',
      'OPENING_BALANCE_CREATE_DENIED': 'رفض إنشاء رصيد افتتاحي',
      'OPENING_BALANCE_UPDATE_DENIED': 'رفض تحديث رصيد افتتاحي',
      'OPENING_BALANCE_DELETE_DENIED': 'رفض حذف رصيد افتتاحي',
      'OPENING_BALANCE_IMPORT_ATTEMPT': 'محاولة استيراد أرصدة افتتاحية',
      'OPENING_BALANCE_IMPORT_SUCCESS': 'استيراد أرصدة افتتاحية بنجاح',
      'OPENING_BALANCE_IMPORT_DENIED': 'رفض استيراد أرصدة افتتاحية'
    };
    return actionMap[action] || action;
  };

  const formatDetails = (details: any) => {
    if (!details) return null;

    return (
      <div className="text-xs text-gray-600 mt-1">
        {details.reason && (
          <div><strong>السبب:</strong> {details.reason}</div>
        )}
        {details.userRole && (
          <div><strong>الدور:</strong> {details.userRole}</div>
        )}
        {details.requestData && (
          <div><strong>البيانات:</strong> {JSON.stringify(details.requestData, null, 2)}</div>
        )}
        {details.fileInfo && (
          <div><strong>الملف:</strong> {details.fileInfo.originalName} ({details.fileInfo.size} bytes)</div>
        )}
      </div>
    );
  };

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
  const uniqueUsers = [...new Set(auditLogs.map(log => log.userName))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Activity className="h-6 w-6 text-blue-600 ml-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">سجل التغيرات</h2>
            <p className="text-gray-600">تتبع جميع العمليات والتغيرات</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-secondary">
            إغلاق
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث في السجلات..."
                className="input pr-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">العملية</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="input"
            >
              <option value="">جميع العمليات</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المستخدم</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="input"
            >
              <option value="">جميع المستخدمين</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mr-3 text-gray-600">جاري تحميل السجلات...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد سجلات متاحة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {log.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({log.userRole})
                        </span>
                      </div>
                      {formatDetails(log.details)}
                      <div className="flex items-center space-x-4 space-x-reverse mt-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 ml-1" />
                          {new Date(log.createdAt).toLocaleString('ar-EG')}
                        </div>
                        <div className="flex items-center">
                          <User className="h-3 w-3 ml-1" />
                          {log.ipAddress}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <div className="text-sm text-gray-700">
              صفحة {currentPage} من {totalPages}
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailViewer;

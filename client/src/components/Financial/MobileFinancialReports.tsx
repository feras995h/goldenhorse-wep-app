import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  BookOpen,
  ChevronDown,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import OpeningTrialBalanceReport from './OpeningTrialBalanceReport';

interface MobileFinancialReportsProps {
  className?: string;
}

const MobileFinancialReports: React.FC<MobileFinancialReportsProps> = ({ className = '' }) => {
  const [activeReport, setActiveReport] = useState<'opening-trial-balance' | 'trial-balance' | 'income-statement' | 'balance-sheet' | 'cash-flow'>('opening-trial-balance');
  const [showFilters, setShowFilters] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);

  const reportTypes = [
    {
      id: 'opening-trial-balance',
      title: 'ميزان المراجعة الافتتاحي',
      description: 'الأرصدة الافتتاحية',
      icon: BookOpen,
      color: 'indigo'
    },
    {
      id: 'trial-balance',
      title: 'ميزان المراجعة',
      description: 'أرصدة الحسابات',
      icon: BarChart3,
      color: 'blue'
    },
    {
      id: 'income-statement',
      title: 'قائمة الدخل',
      description: 'الإيرادات والمصروفات',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'balance-sheet',
      title: 'الميزانية العمومية',
      description: 'الأصول والخصوم',
      icon: DollarSign,
      color: 'purple'
    },
    {
      id: 'cash-flow',
      title: 'التدفقات النقدية',
      description: 'التدفقات الداخلة والخارجة',
      icon: PieChart,
      color: 'orange'
    }
  ];

  const currentReport = reportTypes.find(r => r.id === activeReport);
  const IconComponent = currentReport?.icon || BarChart3;

  const getColorClasses = (color: string) => {
    const colorMap = {
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <IconComponent className={`h-6 w-6 ml-3 ${currentReport ? `text-${currentReport.color}-600` : 'text-blue-600'}`} />
              <div>
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {currentReport?.title}
                </h1>
                <p className="text-xs text-gray-600 truncate">
                  {currentReport?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                <Filter className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setShowReportMenu(!showReportMenu)}
                className={`p-2 rounded-lg ${showReportMenu ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">من تاريخ</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">العملة</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="LYD">دينار ليبي (LYD)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو (EUR)</option>
                </select>
              </div>

              <div className="flex space-x-2 space-x-reverse">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  تطبيق
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Menu */}
        {showReportMenu && (
          <div className="border-t border-gray-200 bg-white">
            <div className="max-h-80 overflow-y-auto">
              {reportTypes.map((report) => {
                const ReportIcon = report.icon;
                const isActive = activeReport === report.id;
                
                return (
                  <button
                    key={report.id}
                    onClick={() => {
                      setActiveReport(report.id as any);
                      setShowReportMenu(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center border-b border-gray-100 last:border-b-0 ${
                      isActive ? getColorClasses(report.color) : 'hover:bg-gray-50'
                    }`}
                  >
                    <ReportIcon className={`h-5 w-5 ml-3 ${
                      isActive ? `text-${report.color}-600` : 'text-gray-400'
                    }`} />
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        isActive ? `text-${report.color}-900` : 'text-gray-900'
                      }`}>
                        {report.title}
                      </div>
                      <div className={`text-xs ${
                        isActive ? `text-${report.color}-700` : 'text-gray-600'
                      }`}>
                        {report.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Action Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <button className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm">
              <RefreshCw className="h-4 w-4 ml-1" />
              تحديث
            </button>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <button className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">
              <Download className="h-4 w-4 ml-1" />
              تصدير
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="flex-1 p-4">
        {activeReport === 'opening-trial-balance' && (
          <div className="mobile-report-container">
            <OpeningTrialBalanceReport />
          </div>
        )}
        
        {activeReport === 'trial-balance' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ميزان المراجعة</h3>
            <p className="text-gray-600">سيتم تطبيق هذا التقرير قريباً...</p>
          </div>
        )}
        
        {activeReport === 'income-statement' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">قائمة الدخل</h3>
            <p className="text-gray-600">سيتم تطبيق هذا التقرير قريباً...</p>
          </div>
        )}
        
        {activeReport === 'balance-sheet' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">الميزانية العمومية</h3>
            <p className="text-gray-600">سيتم تطبيق هذا التقرير قريباً...</p>
          </div>
        )}
        
        {activeReport === 'cash-flow' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">قائمة التدفقات النقدية</h3>
            <p className="text-gray-600">سيتم تطبيق هذا التقرير قريباً...</p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (if needed) */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="flex items-center justify-center">
          <div className="text-xs text-gray-500">
            اسحب لأعلى لعرض المزيد من الخيارات
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFinancialReports;

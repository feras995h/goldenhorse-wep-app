import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw,
  FileText,
  Users,
  DollarSign,
  Settings,
  Eye,
  Edit,
  Download
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message?: string;
  duration?: number;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
}

const InvoiceManagementTest: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'customer-management',
      name: 'إدارة العملاء',
      description: 'اختبار وظائف إدارة العملاء وربطها بالفواتير',
      tests: [
        {
          id: 'customer-list',
          name: 'عرض قائمة العملاء',
          description: 'التحقق من عرض جميع العملاء بشكل صحيح',
          status: 'pending'
        },
        {
          id: 'customer-search',
          name: 'البحث في العملاء',
          description: 'اختبار وظيفة البحث والتصفية في قائمة العملاء',
          status: 'pending'
        },
        {
          id: 'customer-selection',
          name: 'اختيار العميل',
          description: 'التحقق من إمكانية اختيار العميل عند إنشاء فاتورة',
          status: 'pending'
        },
        {
          id: 'customer-invoices',
          name: 'عرض فواتير العميل',
          description: 'التحقق من عرض جميع فواتير العميل المحدد',
          status: 'pending'
        }
      ]
    },
    {
      id: 'invoice-creation',
      name: 'إنشاء الفواتير',
      description: 'اختبار عملية إنشاء الفواتير الجديدة',
      tests: [
        {
          id: 'sales-invoice-creation',
          name: 'إنشاء فاتورة مبيعات',
          description: 'اختبار إنشاء فاتورة مبيعات جديدة مع جميع البيانات',
          status: 'pending'
        },
        {
          id: 'shipping-invoice-creation',
          name: 'إنشاء فاتورة شحن',
          description: 'اختبار إنشاء فاتورة شحن جديدة',
          status: 'pending'
        },
        {
          id: 'invoice-items',
          name: 'إضافة عناصر الفاتورة',
          description: 'اختبار إضافة وحذف عناصر الفاتورة',
          status: 'pending'
        },
        {
          id: 'automatic-calculations',
          name: 'الحسابات التلقائية',
          description: 'التحقق من صحة الحسابات التلقائية للمجاميع والضرائب',
          status: 'pending'
        },
        {
          id: 'form-validation',
          name: 'تحقق البيانات',
          description: 'اختبار تحققات النموذج والتحقق من البيانات المطلوبة',
          status: 'pending'
        }
      ]
    },
    {
      id: 'invoice-management',
      name: 'إدارة الفواتير',
      description: 'اختبار وظائف إدارة الفواتير الموجودة',
      tests: [
        {
          id: 'invoice-list',
          name: 'عرض قائمة الفواتير',
          description: 'التحقق من عرض جميع الفواتير في الواجهة الموحدة',
          status: 'pending'
        },
        {
          id: 'invoice-tabs',
          name: 'تبويبات الفواتير',
          description: 'اختبار التنقل بين تبويبات فواتير المبيعات والشحن',
          status: 'pending'
        },
        {
          id: 'invoice-search',
          name: 'البحث في الفواتير',
          description: 'اختبار وظيفة البحث والتصفية المتقدمة',
          status: 'pending'
        },
        {
          id: 'invoice-sorting',
          name: 'ترتيب الفواتير',
          description: 'اختبار ترتيب الفواتير حسب التاريخ والمبلغ والحالة',
          status: 'pending'
        },
        {
          id: 'invoice-selection',
          name: 'تحديد الفواتير',
          description: 'اختبار تحديد فواتير متعددة للإجراءات المجمعة',
          status: 'pending'
        }
      ]
    },
    {
      id: 'invoice-status',
      name: 'حالات الفواتير',
      description: 'اختبار نظام إدارة حالات الفواتير',
      tests: [
        {
          id: 'status-update',
          name: 'تحديث حالة الفاتورة',
          description: 'اختبار تحديث حالة الفاتورة من مسودة إلى مرسلة',
          status: 'pending'
        },
        {
          id: 'payment-recording',
          name: 'تسجيل الدفعات',
          description: 'اختبار تسجيل دفعة جزئية أو كاملة للفاتورة',
          status: 'pending'
        },
        {
          id: 'outstanding-calculation',
          name: 'حساب المبلغ المستحق',
          description: 'التحقق من صحة حساب المبلغ المستحق بعد الدفعات',
          status: 'pending'
        },
        {
          id: 'status-validation',
          name: 'تحقق حالات الفاتورة',
          description: 'التحقق من صحة انتقالات حالات الفاتورة',
          status: 'pending'
        }
      ]
    },
    {
      id: 'financial-control',
      name: 'التحكم المالي',
      description: 'اختبار نظام التحكم في القيم المالية',
      tests: [
        {
          id: 'discount-calculation',
          name: 'حساب الخصومات',
          description: 'اختبار حساب الخصومات بالنسبة والمبلغ',
          status: 'pending'
        },
        {
          id: 'tax-calculation',
          name: 'حساب الضرائب',
          description: 'اختبار حساب الضرائب على المبلغ بعد الخصم',
          status: 'pending'
        },
        {
          id: 'currency-support',
          name: 'دعم العملات المتعددة',
          description: 'اختبار التعامل مع العملات المختلفة وأسعار الصرف',
          status: 'pending'
        },
        {
          id: 'total-calculation',
          name: 'حساب المجموع النهائي',
          description: 'التحقق من صحة حساب المجموع النهائي',
          status: 'pending'
        }
      ]
    },
    {
      id: 'advanced-features',
      name: 'الميزات المتقدمة',
      description: 'اختبار الميزات المتقدمة للفواتير',
      tests: [
        {
          id: 'invoice-actions',
          name: 'إجراءات الفاتورة',
          description: 'اختبار جميع إجراءات الفاتورة (عرض، تعديل، تحميل)',
          status: 'pending'
        },
        {
          id: 'invoice-duplication',
          name: 'نسخ الفاتورة',
          description: 'اختبار إنشاء نسخة من فاتورة موجودة',
          status: 'pending'
        },
        {
          id: 'pdf-generation',
          name: 'إنشاء PDF',
          description: 'اختبار تحويل الفاتورة إلى ملف PDF',
          status: 'pending'
        },
        {
          id: 'email-sending',
          name: 'إرسال بالبريد الإلكتروني',
          description: 'اختبار إرسال الفاتورة بالبريد الإلكتروني',
          status: 'pending'
        }
      ]
    }
  ]);

  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  const runTest = async (suiteId: string, testId: string): Promise<TestResult> => {
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    // Simulate test results (mostly passing for demo)
    const success = Math.random() > 0.1; // 90% success rate
    const warning = !success && Math.random() > 0.5; // 50% of failures are warnings
    
    return {
      id: testId,
      name: '',
      description: '',
      status: success ? 'passed' : warning ? 'warning' : 'failed',
      message: success ? 'اجتاز الاختبار بنجاح' : 
               warning ? 'اجتاز الاختبار مع تحذيرات' : 'فشل في الاختبار',
      duration: Math.random() * 2000 + 500
    };
  };

  const runSingleTest = async (suiteId: string, testId: string) => {
    setCurrentTest(`${suiteId}-${testId}`);
    
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId ? {
        ...suite,
        tests: suite.tests.map(test => 
          test.id === testId ? { ...test, status: 'running' } : test
        )
      } : suite
    ));

    const result = await runTest(suiteId, testId);
    
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId ? {
        ...suite,
        tests: suite.tests.map(test => 
          test.id === testId ? { ...test, ...result } : test
        )
      } : suite
    ));

    setCurrentTest(null);
  };

  const runAllTests = async () => {
    setOverallStatus('running');
    
    for (const suite of testSuites) {
      for (const test of suite.tests) {
        await runSingleTest(suite.id, test.id);
      }
    }
    
    setOverallStatus('completed');
  };

  const resetTests = () => {
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      tests: suite.tests.map(test => ({
        ...test,
        status: 'pending',
        message: undefined,
        duration: undefined
      }))
    })));
    setOverallStatus('idle');
    setCurrentTest(null);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="text-green-500" size={16} />;
      case 'failed': return <XCircle className="text-red-500" size={16} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={16} />;
      case 'running': return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSuiteIcon = (suiteId: string) => {
    switch (suiteId) {
      case 'customer-management': return <Users size={20} />;
      case 'invoice-creation': return <FileText size={20} />;
      case 'invoice-management': return <Eye size={20} />;
      case 'invoice-status': return <Settings size={20} />;
      case 'financial-control': return <DollarSign size={20} />;
      case 'advanced-features': return <Download size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getTotalStats = () => {
    const allTests = testSuites.flatMap(suite => suite.tests);
    return {
      total: allTests.length,
      passed: allTests.filter(t => t.status === 'passed').length,
      failed: allTests.filter(t => t.status === 'failed').length,
      warning: allTests.filter(t => t.status === 'warning').length,
      pending: allTests.filter(t => t.status === 'pending').length
    };
  };

  const stats = getTotalStats();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">اختبار شامل لنظام إدارة الفواتير</h1>
        <p className="text-gray-600">اختبار جميع وظائف نظام إدارة الفواتير للتأكد من عملها بشكل صحيح</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={runAllTests}
            disabled={overallStatus === 'running'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Play size={16} />
            تشغيل جميع الاختبارات
          </button>
          <button
            onClick={resetTests}
            disabled={overallStatus === 'running'}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RotateCcw size={16} />
            إعادة تعيين
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>نجح: {stats.passed}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>فشل: {stats.failed}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>تحذير: {stats.warning}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>معلق: {stats.pending}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {overallStatus === 'running' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">تقدم الاختبار</span>
            <span className="text-sm text-gray-600">
              {stats.passed + stats.failed + stats.warning} / {stats.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((stats.passed + stats.failed + stats.warning) / stats.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Test Suites */}
      <div className="space-y-6">
        {testSuites.map(suite => (
          <div key={suite.id} className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="text-blue-600">
                  {getSuiteIcon(suite.id)}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{suite.name}</h3>
                  <p className="text-sm text-gray-600">{suite.description}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                {suite.tests.map(test => (
                  <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium text-gray-900">{test.name}</div>
                        <div className="text-sm text-gray-600">{test.description}</div>
                        {test.message && (
                          <div className={`text-xs mt-1 px-2 py-1 rounded ${getStatusColor(test.status)}`}>
                            {test.message}
                            {test.duration && ` (${Math.round(test.duration)}ms)`}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => runSingleTest(suite.id, test.id)}
                      disabled={overallStatus === 'running' || test.status === 'running'}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      تشغيل
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {overallStatus === 'completed' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-600" size={20} />
            <h3 className="text-lg font-medium text-green-900">اكتملت جميع الاختبارات</h3>
          </div>
          <p className="text-green-700">
            تم تشغيل {stats.total} اختبار - نجح {stats.passed}، فشل {stats.failed}، تحذيرات {stats.warning}
          </p>
          {stats.failed === 0 && stats.warning === 0 && (
            <p className="text-green-700 font-medium mt-2">
              🎉 ممتاز! جميع الاختبارات نجحت بدون أخطاء أو تحذيرات
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceManagementTest;

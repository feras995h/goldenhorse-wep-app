import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Progress,
  Alert,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
} from '@/components/ui';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  RefreshCw,
  Settings,
  TrendingUp,
  XCircle,
  BarChart3,
  Download,
  Calendar,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ValidationResults {
  sessionId: string;
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'error';
  scorePercentage: string;
  duration: number;
  criticalIssuesCount: number;
  warningsCount: number;
  startTime: string;
}

interface DashboardData {
  quickCheck: {
    timestamp: string;
    healthy: boolean;
    issues: string[];
    score: number;
    maxScore: number;
  };
  lastValidation: ValidationResults | null;
  recentHistory: ValidationResults[];
  statistics: {
    accounts: {
      total: number;
      active: number;
      byType: Record<string, number>;
    };
    journalEntries: {
      total: number;
      thisMonth: number;
    };
    customers: {
      total: number;
      active: number;
      withAccounts: number;
    };
    salesInvoices: {
      total: number;
      posted: number;
      withJournalEntries: number;
    };
  };
}

const ValidationDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedValidationType, setSelectedValidationType] = useState('full');
  const [validationHistory, setValidationHistory] = useState<ValidationResults[]>([]);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { toast } = useToast();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/validation/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل في جلب بيانات لوحة المراقبة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch validation history
  const fetchValidationHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/validation/history?limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setValidationHistory(result.data.history);
      }
    } catch (error) {
      console.error('Error fetching validation history:', error);
    }
  }, []);

  // Run validation
  const runValidation = async () => {
    setIsValidating(true);
    try {
      let endpoint = '/api/validation/';
      let body = {};

      switch (selectedValidationType) {
        case 'full':
          endpoint += 'full-accounting-flow';
          body = {
            includePerformanceTests: true,
            generateDetailedReport: true,
            validateHistoricalData: false
          };
          break;
        case 'quick':
          endpoint += 'quick-check';
          break;
        case 'health':
          endpoint += 'system-health';
          break;
        case 'trial-balance':
          endpoint += 'trial-balance';
          break;
      }

      const method = selectedValidationType === 'quick' || selectedValidationType === 'health' ? 'GET' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        ...(method === 'POST' && { body: JSON.stringify(body) })
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const result = await response.json();
      
      toast({
        title: "تمت المراجعة بنجاح",
        description: `تم إكمال فحص ${getValidationTypeLabel(selectedValidationType)} بنجاح`,
        variant: "default"
      });

      // Refresh dashboard data
      await fetchDashboardData();
      await fetchValidationHistory();

    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "خطأ في المراجعة",
        description: "فشل في تشغيل عملية المراجعة",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Get validation type label
  const getValidationTypeLabel = (type: string) => {
    const labels = {
      'full': 'المراجعة الشاملة',
      'quick': 'الفحص السريع',
      'health': 'فحص الصحة',
      'trial-balance': 'ميزان المراجعة'
    };
    return labels[type] || type;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'excellent': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'ممتاز' },
      'good': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'جيد' },
      'fair': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'مقبول' },
      'poor': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'ضعيف' },
      'critical': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'حرج' },
      'error': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'خطأ' }
    };

    const config = statusConfig[status] || statusConfig['error'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Get progress color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // View detailed session report
  const viewDetailedReport = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/validation/history/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedSession(result.data);
        setShowDetailedReport(true);
      }
    } catch (error) {
      console.error('Error fetching detailed report:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب تفاصيل التقرير",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchValidationHistory();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData, fetchValidationHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          فشل في تحميل بيانات لوحة المراقبة
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">لوحة مراقبة المحرك المحاسبي</h1>
          <p className="text-gray-600">مراقبة وفحص صحة النظام المحاسبي</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedValidationType} onValueChange={setSelectedValidationType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">المراجعة الشاملة</SelectItem>
              <SelectItem value="quick">الفحص السريع</SelectItem>
              <SelectItem value="health">فحص الصحة</SelectItem>
              <SelectItem value="trial-balance">ميزان المراجعة</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={runValidation} 
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                جاري الفحص...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                تشغيل الفحص
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => {
              fetchDashboardData();
              fetchValidationHistory();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              الصحة العامة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {dashboardData.quickCheck.healthy ? 'صحي' : 'يحتاج مراجعة'}
              </div>
              {dashboardData.quickCheck.healthy ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              )}
            </div>
            <div className="mt-2">
              <Progress 
                value={(dashboardData.quickCheck.score / dashboardData.quickCheck.maxScore) * 100}
                className="h-2"
              />
              <p className="text-xs text-gray-600 mt-1">
                {dashboardData.quickCheck.score}/{dashboardData.quickCheck.maxScore}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Last Validation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              آخر مراجعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.lastValidation ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  {getStatusBadge(dashboardData.lastValidation.overallStatus)}
                  <span className="text-2xl font-bold">
                    {dashboardData.lastValidation.scorePercentage}%
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {new Date(dashboardData.lastValidation.startTime).toLocaleString('ar-EG')}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">لم يتم إجراء مراجعة من قبل</p>
            )}
          </CardContent>
        </Card>

        {/* Issues Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              المشاكل الحرجة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.quickCheck.issues.length}
            </div>
            <p className="text-xs text-gray-600">
              مشاكل تحتاج انتباه فوري
            </p>
          </CardContent>
        </Card>

        {/* System Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              إحصائيات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>الحسابات:</span>
                <span className="font-medium">{dashboardData.statistics.accounts.active}</span>
              </div>
              <div className="flex justify-between">
                <span>القيود:</span>
                <span className="font-medium">{dashboardData.statistics.journalEntries.total}</span>
              </div>
              <div className="flex justify-between">
                <span>العملاء:</span>
                <span className="font-medium">{dashboardData.statistics.customers.active}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Alert */}
      {dashboardData.quickCheck.issues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="mb-2 font-semibold">مشاكل تحتاج انتباه فوري:</div>
            <ul className="list-disc list-inside space-y-1">
              {dashboardData.quickCheck.issues.map((issue, index) => (
                <li key={index} className="text-sm">{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="history">سجل المراجعات</TabsTrigger>
          <TabsTrigger value="statistics">الإحصائيات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Validation History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                المراجعات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recentHistory.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentHistory.map((session) => (
                    <div key={session.sessionId} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(session.overallStatus)}
                        <div>
                          <p className="font-medium">{session.sessionId}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(session.startTime).toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-lg">{session.scorePercentage}%</p>
                          <p className="text-sm text-gray-600">{session.duration}ms</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewDetailedReport(session.sessionId)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  لا توجد مراجعات سابقة
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  سجل المراجعات الكامل
                </span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  تصدير
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الجلسة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المدة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>النتيجة</TableHead>
                    <TableHead>المشاكل</TableHead>
                    <TableHead>التحذيرات</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationHistory.map((session) => (
                    <TableRow key={session.sessionId}>
                      <TableCell className="font-medium">{session.sessionId}</TableCell>
                      <TableCell>
                        {new Date(session.startTime).toLocaleString('ar-EG')}
                      </TableCell>
                      <TableCell>{session.duration}ms</TableCell>
                      <TableCell>{getStatusBadge(session.overallStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={parseFloat(session.scorePercentage)}
                            className="h-2 w-16"
                          />
                          <span className="text-sm font-medium">{session.scorePercentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.criticalIssuesCount > 0 && (
                          <Badge variant="destructive">{session.criticalIssuesCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.warningsCount > 0 && (
                          <Badge variant="secondary">{session.warningsCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewDetailedReport(session.sessionId)}
                        >
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {/* System Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الحسابات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>الإجمالي:</span>
                    <span className="font-bold">{dashboardData.statistics.accounts.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>النشطة:</span>
                    <span className="font-bold text-green-600">{dashboardData.statistics.accounts.active}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">حسب النوع:</p>
                    {Object.entries(dashboardData.statistics.accounts.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span>{type}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">القيود</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>الإجمالي:</span>
                    <span className="font-bold">{dashboardData.statistics.journalEntries.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>هذا الشهر:</span>
                    <span className="font-bold text-blue-600">{dashboardData.statistics.journalEntries.thisMonth}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>الإجمالي:</span>
                    <span className="font-bold">{dashboardData.statistics.customers.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>النشطين:</span>
                    <span className="font-bold text-green-600">{dashboardData.statistics.customers.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>لهم حسابات:</span>
                    <span className="font-bold text-blue-600">{dashboardData.statistics.customers.withAccounts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الفواتير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>الإجمالي:</span>
                    <span className="font-bold">{dashboardData.statistics.salesInvoices.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المرسلة:</span>
                    <span className="font-bold text-green-600">{dashboardData.statistics.salesInvoices.posted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>لها قيود:</span>
                    <span className="font-bold text-blue-600">{dashboardData.statistics.salesInvoices.withJournalEntries}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات المراقبة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                ستكون إعدادات المراقبة والجدولة متاحة قريباً
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Report Dialog */}
      <Dialog open={showDetailedReport} onOpenChange={setShowDetailedReport}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>تقرير مفصل - {selectedSession?.sessionId}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {selectedSession && (
              <div className="space-y-4">
                {/* Session Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ملخص الجلسة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>رقم الجلسة:</strong> {selectedSession.sessionId}</p>
                        <p><strong>تاريخ البداية:</strong> {new Date(selectedSession.startTime).toLocaleString('ar-EG')}</p>
                        <p><strong>المدة:</strong> {selectedSession.duration}ms</p>
                      </div>
                      <div>
                        <p><strong>الحالة العامة:</strong> {getStatusBadge(selectedSession.results.overallStatus)}</p>
                        <p><strong>النتيجة:</strong> {selectedSession.results.score}/{selectedSession.results.maxScore}</p>
                        <p><strong>النسبة المئوية:</strong> {((selectedSession.results.score / selectedSession.results.maxScore) * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Validation Modules */}
                {selectedSession.results.validationModules && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">نتائج الوحدات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(selectedSession.results.validationModules).map(([moduleName, moduleResults]: [string, any]) => (
                          <div key={moduleName} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">{moduleName}</h4>
                              {getStatusBadge(moduleResults.status)}
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>النتيجة: {moduleResults.score}/{moduleResults.maxScore}</span>
                              <span>النسبة: {((moduleResults.score / moduleResults.maxScore) * 100).toFixed(1)}%</span>
                            </div>
                            {moduleResults.issues && moduleResults.issues.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-red-600">المشاكل:</p>
                                <ul className="text-sm text-red-600 list-disc list-inside">
                                  {moduleResults.issues.map((issue: string, idx: number) => (
                                    <li key={idx}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Issues and Recommendations */}
                {selectedSession.results.criticalIssues && selectedSession.results.criticalIssues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">المشاكل الحرجة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {selectedSession.results.criticalIssues.map((issue: any, idx: number) => (
                          <li key={idx} className="text-sm">
                            <strong>{issue.module}:</strong> {issue.issue}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {selectedSession.results.recommendations && selectedSession.results.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-600">التوصيات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {selectedSession.results.recommendations.map((rec: any, idx: number) => (
                          <li key={idx} className="text-sm">
                            <strong>{rec.module}:</strong> {rec.recommendation}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ValidationDashboard;
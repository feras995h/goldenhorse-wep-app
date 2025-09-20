import React, { useState } from 'react';
import {
  Book,
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  Edit,
  Eye,
  DollarSign,
  Users,
  Search,
  Filter,
  Download,
  Mail,
  CheckCircle,
  AlertTriangle,
  Info,
  Play,
  Pause
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  subsections?: GuideSection[];
}

const InvoiceManagementGuide: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const guideSections: GuideSection[] = [
    {
      id: 'overview',
      title: 'نظرة عامة على نظام إدارة الفواتير',
      icon: <Book size={20} />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            نظام إدارة الفواتير المحسن يوفر حلاً شاملاً لإدارة جميع أنواع الفواتير في مكان واحد.
            يدعم النظام فواتير المبيعات وفواتير الشحن مع ميزات متقدمة للتحكم المالي وإدارة حالات الفواتير.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">الميزات الرئيسية</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• واجهة موحدة لجميع أنواع الفواتير</li>
                <li>• ربط تلقائي بين الفواتير والعملاء</li>
                <li>• نظام متقدم لإدارة حالات الفواتير</li>
                <li>• تحكم كامل في القيم المالية</li>
                <li>• دعم العملات المتعددة</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">فوائد النظام</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• توفير الوقت والجهد</li>
                <li>• تقليل الأخطاء المحاسبية</li>
                <li>• تحسين تجربة المستخدم</li>
                <li>• تتبع دقيق للمدفوعات</li>
                <li>• تقارير مالية شاملة</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'getting-started',
      title: 'البدء مع النظام',
      icon: <Play size={20} />,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="text-yellow-600" size={16} />
              <span className="font-medium text-yellow-900">قبل البدء</span>
            </div>
            <p className="text-yellow-800 text-sm">
              تأكد من إعداد العملاء في النظام قبل إنشاء الفواتير. يمكنك الوصول إلى إدارة العملاء من القائمة الجانبية.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">خطوات البدء السريع:</h4>
            <div className="space-y-2">
              {[
                'الوصول إلى صفحة إدارة الفواتير من القائمة الرئيسية',
                'اختيار نوع الفاتورة (مبيعات أو شحن)',
                'النقر على زر "إنشاء فاتورة جديدة"',
                'ملء البيانات المطلوبة وحفظ الفاتورة'
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'invoice-creation',
      title: 'إنشاء الفواتير',
      icon: <Plus size={20} />,
      content: (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">إنشاء فاتورة جديدة</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="font-medium text-gray-800">فواتير المبيعات</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• اختيار العميل من القائمة المنسدلة</li>
                <li>• تحديد تاريخ الفاتورة وتاريخ الاستحقاق</li>
                <li>• إضافة عناصر الفاتورة مع الكميات والأسعار</li>
                <li>• تطبيق الخصومات والضرائب حسب الحاجة</li>
                <li>• مراجعة المجاميع والحفظ</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-medium text-gray-800">فواتير الشحن</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ربط الفاتورة بالشحنة المناسبة</li>
                <li>• تحديد تفاصيل الشحن والوجهة</li>
                <li>• حساب تكلفة الشحن تلقائياً</li>
                <li>• إضافة رسوم إضافية إن وجدت</li>
                <li>• تأكيد البيانات والحفظ</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">نصائح مهمة</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• تأكد من صحة بيانات العميل قبل الحفظ</li>
              <li>• راجع الحسابات التلقائية للتأكد من دقتها</li>
              <li>• استخدم الملاحظات لإضافة تفاصيل مهمة</li>
              <li>• احفظ الفاتورة كمسودة إذا لم تكن جاهزة للإرسال</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'invoice-management',
      title: 'إدارة الفواتير',
      icon: <FileText size={20} />,
      content: (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">الواجهة الموحدة لإدارة الفواتير</h4>
          
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">التبويبات</h5>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-gray-50 rounded text-center">جميع الفواتير</div>
                <div className="p-2 bg-purple-50 text-purple-800 rounded text-center">فواتير المبيعات</div>
                <div className="p-2 bg-orange-50 text-orange-800 rounded text-center">فواتير الشحن</div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-800 mb-2">البحث والتصفية</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• البحث السريع بالرقم أو اسم العميل</li>
                <li>• تصفية حسب النوع والحالة</li>
                <li>• تصفية حسب التاريخ والمبلغ</li>
                <li>• ترتيب النتائج حسب معايير مختلفة</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-800 mb-2">الإجراءات المتاحة</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="text-blue-600" size={14} />
                    <span>عرض تفاصيل الفاتورة</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Edit className="text-green-600" size={14} />
                    <span>تعديل الفاتورة</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="text-purple-600" size={14} />
                    <span>تحديث حالة الفاتورة</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Download className="text-orange-600" size={14} />
                    <span>تحميل PDF</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="text-red-600" size={14} />
                    <span>إرسال بالبريد الإلكتروني</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="text-green-600" size={14} />
                    <span>تسجيل دفعة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'status-management',
      title: 'إدارة حالات الفواتير',
      icon: <CheckCircle size={20} />,
      content: (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">حالات الفواتير المختلفة</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { status: 'draft', label: 'مسودة', color: 'gray', desc: 'فاتورة في مرحلة الإعداد' },
              { status: 'sent', label: 'مرسلة', color: 'blue', desc: 'تم إرسال الفاتورة للعميل' },
              { status: 'partially_paid', label: 'مدفوعة جزئياً', color: 'yellow', desc: 'تم دفع جزء من المبلغ' },
              { status: 'paid', label: 'مدفوعة', color: 'green', desc: 'تم دفع المبلغ كاملاً' },
              { status: 'overdue', label: 'متأخرة', color: 'red', desc: 'تجاوزت تاريخ الاستحقاق' },
              { status: 'cancelled', label: 'ملغية', color: 'gray', desc: 'تم إلغاء الفاتورة' }
            ].map(item => (
              <div key={item.status} className={`p-3 bg-${item.color}-50 border border-${item.color}-200 rounded-lg`}>
                <div className={`font-medium text-${item.color}-900 mb-1`}>{item.label}</div>
                <div className={`text-sm text-${item.color}-700`}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">تحديث حالة الفاتورة</h5>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. انقر على زر "تحديث الحالة" بجانب الفاتورة</li>
              <li>2. اختر الحالة الجديدة من القائمة</li>
              <li>3. أدخل مبلغ الدفعة إذا كانت دفعة جزئية</li>
              <li>4. أضف ملاحظات إضافية إن أردت</li>
              <li>5. انقر على "تحديث الحالة" لحفظ التغييرات</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'financial-control',
      title: 'التحكم في القيم المالية',
      icon: <DollarSign size={20} />,
      content: (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">لوحة التحكم المالي</h4>
          
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">المكونات المالية</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">المجموع الفرعي</span>
                    <span className="font-medium">قابل للتعديل</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">نسبة الخصم</span>
                    <span className="font-medium">0-100%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">مبلغ الخصم</span>
                    <span className="font-medium">محسوب تلقائياً</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">نسبة الضريبة</span>
                    <span className="font-medium">0-100%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">مبلغ الضريبة</span>
                    <span className="font-medium">محسوب تلقائياً</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm text-blue-600 font-medium">المجموع النهائي</span>
                    <span className="font-bold text-blue-600">محسوب تلقائياً</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-800 mb-2">إدارة المدفوعات</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• تسجيل المبلغ المدفوع</li>
                <li>• حساب تلقائي للمبلغ المستحق</li>
                <li>• تتبع حالة الدفع (غير مدفوع، جزئي، مكتمل)</li>
                <li>• إشعارات للمبالغ المستحقة</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">العملات المتعددة</h5>
            <p className="text-sm text-green-800 mb-2">
              يدعم النظام 4 عملات رئيسية مع أسعار صرف قابلة للتحديث:
            </p>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center p-2 bg-white rounded">LYD - دينار ليبي</div>
              <div className="text-center p-2 bg-white rounded">USD - دولار أمريكي</div>
              <div className="text-center p-2 bg-white rounded">EUR - يورو</div>
              <div className="text-center p-2 bg-white rounded">CNY - يوان صيني</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'advanced-features',
      title: 'الميزات المتقدمة',
      icon: <Download size={20} />,
      content: (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">الميزات المتقدمة للفواتير</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Download className="text-orange-600" size={16} />
                تحميل PDF
              </h5>
              <p className="text-sm text-gray-600 mb-2">
                تحويل الفاتورة إلى ملف PDF قابل للطباعة والمشاركة
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• تصميم احترافي</li>
                <li>• شعار الشركة</li>
                <li>• جميع التفاصيل المالية</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Mail className="text-red-600" size={16} />
                إرسال بالبريد الإلكتروني
              </h5>
              <p className="text-sm text-gray-600 mb-2">
                إرسال الفاتورة مباشرة إلى العميل عبر البريد الإلكتروني
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• رسالة قابلة للتخصيص</li>
                <li>• مرفق PDF تلقائي</li>
                <li>• تتبع حالة الإرسال</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <FileText className="text-blue-600" size={16} />
                نسخ الفاتورة
              </h5>
              <p className="text-sm text-gray-600 mb-2">
                إنشاء فاتورة جديدة بنفس بيانات فاتورة موجودة
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• نسخ جميع العناصر</li>
                <li>• تحديث التواريخ تلقائياً</li>
                <li>• رقم فاتورة جديد</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Users className="text-green-600" size={16} />
                ربط العملاء
              </h5>
              <p className="text-sm text-gray-600 mb-2">
                عرض جميع فواتير العميل في مكان واحد
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• تاريخ الفواتير</li>
                <li>• إجمالي المبالغ</li>
                <li>• حالات الدفع</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'حل المشاكل الشائعة',
      icon: <AlertTriangle size={20} />,
      content: (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">المشاكل الشائعة وحلولها</h4>
          
          <div className="space-y-4">
            {[
              {
                problem: 'لا يمكنني رؤية العملاء في القائمة المنسدلة',
                solution: 'تأكد من إضافة العملاء أولاً من صفحة إدارة العملاء. يجب أن يكون لديك عميل واحد على الأقل لإنشاء فاتورة.'
              },
              {
                problem: 'الحسابات التلقائية غير صحيحة',
                solution: 'تحقق من إدخال الكميات والأسعار بشكل صحيح. تأكد من أن نسب الخصم والضريبة في النطاق الصحيح (0-100%).'
              },
              {
                problem: 'لا يمكنني تحديث حالة الفاتورة',
                solution: 'تأكد من أن لديك الصلاحيات المناسبة. بعض الحالات لا يمكن تغييرها (مثل الفواتير الملغية).'
              },
              {
                problem: 'البحث لا يعطي نتائج',
                solution: 'تأكد من كتابة النص بشكل صحيح. جرب البحث برقم الفاتورة أو اسم العميل. امسح المرشحات إذا كانت مفعلة.'
              },
              {
                problem: 'لا يمكنني تحميل PDF',
                solution: 'تأكد من أن المتصفح يسمح بتحميل الملفات. جرب تحديث الصفحة أو استخدام متصفح آخر.'
              }
            ].map((item, index) => (
              <div key={index} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <h5 className="font-medium text-orange-900 mb-2">❓ {item.problem}</h5>
                <p className="text-sm text-orange-800">💡 {item.solution}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">نصائح للاستخدام الأمثل</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• احفظ عملك بانتظام لتجنب فقدان البيانات</li>
              <li>• استخدم الملاحظات لتسجيل معلومات مهمة</li>
              <li>• راجع الفواتير قبل إرسالها للعملاء</li>
              <li>• حدث حالات الفواتير فور استلام المدفوعات</li>
              <li>• استخدم التصفية والبحث لإيجاد الفواتير بسرعة</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Book className="text-blue-600" size={32} />
          دليل استخدام نظام إدارة الفواتير
        </h1>
        <p className="text-gray-600">
          دليل شامل لاستخدام جميع ميزات نظام إدارة الفواتير المحسن
        </p>
      </div>

      {/* Table of Contents */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="font-medium text-gray-900 mb-3">المحتويات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {guideSections.map(section => (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className="text-right p-2 hover:bg-white rounded flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              {section.icon}
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Sections */}
      <div className="space-y-6">
        {guideSections.map(section => (
          <div key={section.id} className="bg-white border rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 text-right flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="text-blue-600">{section.icon}</div>
                <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
              </div>
              {expandedSections.includes(section.id) ? 
                <ChevronDown size={20} className="text-gray-400" /> : 
                <ChevronRight size={20} className="text-gray-400" />
              }
            </button>
            
            {expandedSections.includes(section.id) && (
              <div className="p-4 border-t">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg text-center">
        <p className="text-blue-800 text-sm">
          هل تحتاج مساعدة إضافية؟ تواصل مع فريق الدعم الفني للحصول على المساعدة.
        </p>
      </div>
    </div>
  );
};

export default InvoiceManagementGuide;

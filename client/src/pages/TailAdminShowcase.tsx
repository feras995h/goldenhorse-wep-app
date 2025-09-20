import React, { useState } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download
} from 'lucide-react';
import TailAdminDashboardCard from '../components/TailAdmin/Cards/TailAdminDashboardCard';
import TailAdminDataTable, { TableColumn, TableAction } from '../components/TailAdmin/Tables/TailAdminDataTable';
import TailAdminFormField from '../components/TailAdmin/Forms/TailAdminFormField';
import TailAdminChart from '../components/TailAdmin/Charts/TailAdminChart';

interface SampleData {
  id: string;
  name: string;
  amount: number;
  status: 'active' | 'pending' | 'inactive';
  date: string;
  category: string;
}

const TailAdminShowcase: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    amount: '',
    category: '',
    description: '',
    enabled: false
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 25
  });

  // Sample data for table
  const sampleData: SampleData[] = [
    {
      id: '1',
      name: 'شركة التجارة الدولية',
      amount: 15000,
      status: 'active',
      date: '2024-01-15',
      category: 'عملاء كبار'
    },
    {
      id: '2',
      name: 'مؤسسة النجاح التجارية',
      amount: 8500,
      status: 'pending',
      date: '2024-01-14',
      category: 'عملاء جدد'
    },
    {
      id: '3',
      name: 'شركة الازدهار للاستيراد',
      amount: 22000,
      status: 'active',
      date: '2024-01-13',
      category: 'عملاء كبار'
    },
    {
      id: '4',
      name: 'مؤسسة الثقة التجارية',
      amount: 5200,
      status: 'inactive',
      date: '2024-01-12',
      category: 'عملاء سابقون'
    },
    {
      id: '5',
      name: 'شركة المستقبل للتجارة',
      amount: 12300,
      status: 'active',
      date: '2024-01-11',
      category: 'عملاء متوسطون'
    }
  ];

  // Chart data
  const chartData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [{
      label: 'المبيعات الشهرية',
      data: [65, 59, 80, 81, 56, 55],
      backgroundColor: '#FFD700',
      borderColor: '#B8860B'
    }]
  };

  const pieChartData = {
    labels: ['عملاء كبار', 'عملاء متوسطون', 'عملاء جدد', 'عملاء سابقون'],
    datasets: [{
      label: 'توزيع العملاء',
      data: [40, 30, 20, 10],
      backgroundColor: ['#FFD700', '#B8860B', '#FFECB3', '#F4C430']
    }]
  };

  // Table columns
  const columns: TableColumn<SampleData>[] = [
    {
      key: 'name',
      title: 'اسم الشركة',
      dataIndex: 'name',
      sortable: true,
      searchable: true
    },
    {
      key: 'category',
      title: 'الفئة',
      dataIndex: 'category',
      filterable: true
    },
    {
      key: 'amount',
      title: 'المبلغ',
      dataIndex: 'amount',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className=\"font-semibold text-golden-600\">
          {value.toLocaleString('ar-LY')} د.ل
        </span>
      )
    },
    {
      key: 'status',
      title: 'الحالة',
      dataIndex: 'status',
      align: 'center',
      render: (value) => {
        const statusConfig = {
          active: { label: 'نشط', color: 'bg-success-100 text-success-800' },
          pending: { label: 'معلق', color: 'bg-warning-100 text-warning-800' },
          inactive: { label: 'غير نشط', color: 'bg-danger-100 text-danger-800' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'date',
      title: 'تاريخ التسجيل',
      dataIndex: 'date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('ar-LY')
    }
  ];

  // Table actions
  const actions: TableAction<SampleData>[] = [
    {
      key: 'view',
      label: 'عرض',
      icon: <Eye className=\"h-4 w-4\" />,
      onClick: (record) => alert(`عرض ${record.name}`),
      color: 'primary'
    },
    {
      key: 'edit',
      label: 'تعديل',
      icon: <Edit className=\"h-4 w-4\" />,
      onClick: (record) => alert(`تعديل ${record.name}`),
      color: 'warning'
    },
    {
      key: 'delete',
      label: 'حذف',
      icon: <Trash2 className=\"h-4 w-4\" />,
      onClick: (record) => {
        if (confirm(`هل تريد حذف ${record.name}؟`)) {
          alert(`تم حذف ${record.name}`);
        }
      },
      color: 'danger',
      visible: (record) => record.status !== 'active'
    }
  ];

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('تم إرسال النموذج بنجاح!');
    console.log('Form data:', formData);
  };

  return (
    <div className=\"space-y-8\">
      {/* Page Header */}
      <div className=\"bg-gradient-to-r from-golden-500 to-golden-600 rounded-xl p-6 text-white shadow-lg\">
        <div className=\"flex items-center\">
          <div className=\"p-3 bg-white/20 rounded-xl ml-4\">
            <BarChart3 className=\"h-8 w-8\" />
          </div>
          <div>
            <h1 className=\"text-3xl font-bold\">معرض مكونات TailAdmin</h1>
            <p className=\"text-white/90 text-lg\">استعراض شامل لجميع المكونات المحدثة مع التصميم الذهبي ودعم RTL</p>
          </div>
        </div>
      </div>

      {/* Dashboard Cards Section */}
      <div>
        <h2 className=\"text-2xl font-bold text-dark-800 mb-6\">بطاقات لوحة التحكم</h2>
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
          <TailAdminDashboardCard
            title=\"إجمالي الإيرادات\"
            value={125000}
            icon={DollarSign}
            color=\"primary\"
            currency=\"د.ل\"
            trend={{
              direction: 'up',
              percentage: 12.5,
              period: 'من الشهر الماضي'
            }}
            interactive
            onClick={() => alert('تم النقر على إجمالي الإيرادات')}
          />
          
          <TailAdminDashboardCard
            title=\"عدد العملاء\"
            value={245}
            icon={Users}
            color=\"success\"
            trend={{
              direction: 'up',
              percentage: 8.2,
              period: 'من الأسبوع الماضي'
            }}
            interactive
            onClick={() => alert('تم النقر على عدد العملاء')}
          />
          
          <TailAdminDashboardCard
            title=\"معدل النمو\"
            value=\"15.3%\"
            icon={TrendingUp}
            color=\"info\"
            trend={{
              direction: 'up',
              percentage: 2.1,
              period: 'من الشهر الماضي'
            }}
          />
          
          <TailAdminDashboardCard
            title=\"المبيعات اليومية\"
            value={8750}
            icon={BarChart3}
            color=\"warning\"
            currency=\"د.ل\"
            trend={{
              direction: 'down',
              percentage: 3.5,
              period: 'من أمس'
            }}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div>
        <h2 className=\"text-2xl font-bold text-dark-800 mb-6\">الرسوم البيانية</h2>
        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
          <TailAdminChart
            type=\"bar\"
            data={chartData}
            title=\"المبيعات الشهرية\"
            description=\"إحصائيات المبيعات للأشهر الستة الأخيرة\"
            height={300}
            rtl={true}
            theme=\"golden\"
          />
          
          <TailAdminChart
            type=\"doughnut\"
            data={pieChartData}
            title=\"توزيع العملاء\"
            description=\"تصنيف العملاء حسب الفئة\"
            height={300}
            rtl={true}
            theme=\"golden\"
          />
        </div>
      </div>

      {/* Form Section */}
      <div>
        <h2 className=\"text-2xl font-bold text-dark-800 mb-6\">النماذج المحسنة</h2>
        <div className=\"bg-white border border-golden-200 rounded-xl shadow-sm p-6\">
          <form onSubmit={handleFormSubmit} className=\"space-y-6\">
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
              <TailAdminFormField
                label=\"اسم الشركة\"
                name=\"name\"
                type=\"text\"
                value={formData.name}
                onChange={(value) => handleFormChange('name', value)}
                placeholder=\"أدخل اسم الشركة\"
                required
                validation={[
                  { required: true },
                  { min: 3, max: 50 }
                ]}
                helpText=\"يجب أن يكون الاسم بين 3 و 50 حرف\"
              />
              
              <TailAdminFormField
                label=\"البريد الإلكتروني\"
                name=\"email\"
                type=\"email\"
                value={formData.email}
                onChange={(value) => handleFormChange('email', value)}
                placeholder=\"company@example.com\"
                required
                dir=\"ltr\"
              />
            </div>
            
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
              <TailAdminFormField
                label=\"المبلغ\"
                name=\"amount\"
                type=\"number\"
                value={formData.amount}
                onChange={(value) => handleFormChange('amount', value)}
                placeholder=\"0.00\"
                addon={{
                  type: 'suffix',
                  content: 'د.ل'
                }}
              />
              
              <TailAdminFormField
                label=\"الفئة\"
                name=\"category\"
                type=\"select\"
                value={formData.category}
                onChange={(value) => handleFormChange('category', value)}
                placeholder=\"اختر الفئة\"
                options={[
                  { value: 'large', label: 'عملاء كبار' },
                  { value: 'medium', label: 'عملاء متوسطون' },
                  { value: 'small', label: 'عملاء صغار' },
                  { value: 'new', label: 'عملاء جدد' }
                ]}
              />
            </div>
            
            <TailAdminFormField
              label=\"الوصف\"
              name=\"description\"
              type=\"textarea\"
              value={formData.description}
              onChange={(value) => handleFormChange('description', value)}
              placeholder=\"أدخل وصف مفصل...\"
              rows={4}
            />
            
            <TailAdminFormField
              label=\"تفعيل الحساب\"
              name=\"enabled\"
              type=\"checkbox\"
              value={formData.enabled}
              onChange={(value) => handleFormChange('enabled', value)}
            />
            
            <div className=\"flex justify-end space-x-4 space-x-reverse\">
              <button
                type=\"button\"
                className=\"px-6 py-3 border border-golden-300 text-golden-600 rounded-lg hover:bg-golden-50 transition-colors duration-200\"
              >
                إلغاء
              </button>
              <button
                type=\"submit\"
                className=\"px-6 py-3 bg-golden-500 text-white rounded-lg hover:bg-golden-600 transition-colors duration-200 flex items-center\"
              >
                <Plus className=\"h-4 w-4 ml-2\" />
                حفظ البيانات
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Data Table Section */}
      <div>
        <h2 className=\"text-2xl font-bold text-dark-800 mb-6\">جدول البيانات المتقدم</h2>
        <TailAdminDataTable
          data={sampleData}
          columns={columns}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          actions={actions}
          title=\"قائمة العملاء\"
          exportable
          onExport={() => alert('تصدير البيانات')}
          searchable
          filterable
          selection={{
            enabled: true,
            onSelectionChange: (keys, rows) => {
              console.log('Selected rows:', keys, rows);
            }
          }}
          striped
          bordered
        />
      </div>

      {/* Component Features Summary */}
      <div className=\"bg-white border border-golden-200 rounded-xl shadow-sm p-6\">
        <h3 className=\"text-xl font-bold text-dark-800 mb-4\">ميزات المكونات المحدثة</h3>
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
          <div className=\"space-y-2\">
            <h4 className=\"font-semibold text-golden-600\">بطاقات لوحة التحكم</h4>
            <ul className=\"text-sm text-dark-600 space-y-1\">
              <li>• تأثيرات حركية متقدمة</li>
              <li>• مؤشرات اتجاه البيانات</li>
              <li>• تفاعل بالنقر</li>
              <li>• دعم العملات المتعددة</li>
            </ul>
          </div>
          
          <div className=\"space-y-2\">
            <h4 className=\"font-semibold text-golden-600\">جداول البيانات</h4>
            <ul className=\"text-sm text-dark-600 space-y-1\">
              <li>• ترتيب وتصفية متقدمة</li>
              <li>• تحديد متعدد الصفوف</li>
              <li>• إجراءات مخصصة</li>
              <li>• تصدير البيانات</li>
            </ul>
          </div>
          
          <div className=\"space-y-2\">
            <h4 className=\"font-semibold text-golden-600\">النماذج</h4>
            <ul className=\"text-sm text-dark-600 space-y-1\">
              <li>• تحقق متقدم من البيانات</li>
              <li>• دعم أنواع مدخلات متعددة</li>
              <li>• رسائل خطأ تفاعلية</li>
              <li>• دعم RTL كامل</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailAdminShowcase;
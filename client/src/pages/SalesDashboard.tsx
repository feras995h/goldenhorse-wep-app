import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Users,
  Package,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  DollarSign,
  RefreshCw,
  UserPlus,
  AlertTriangle,
  Receipt,
  CreditCard,
  Settings,
  Printer,
  XCircle
} from 'lucide-react';
import { salesAPI } from '../services/api';
import { useFinancialData } from '../contexts/FinancialDataContext';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  activeCustomers: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  totalInvoices: number;
  totalPayments: number;
  lowStockItems: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: 'wholesale' | 'retail' | 'vip';
  balance: number;
  status: 'active' | 'inactive';
  lastOrder: string;
}

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

interface Invoice {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: 'draft' | 'approved' | 'posted' | 'cancelled';
  type: 'sale' | 'return' | 'delivery';
  items: number;
}

interface Payment {
  id: string;
  customerName: string;
  date: string;
  amount: number;
  method: 'cash' | 'bank' | 'check';
  invoiceId?: string;
  status: 'pending' | 'completed';
}

const SalesDashboard: React.FC = () => {
  const { updateSalesData } = useFinancialData();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('overview');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  
  // Form data states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'wholesale'
  });
  
  const [invoiceForm, setInvoiceForm] = useState({
    type: 'sale',
    customerId: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    amount: '',
    method: 'cash'
  });
  
  const [inventoryForm, setInventoryForm] = useState({
    name: '',
    code: '',
    category: '',
    currentStock: '',
    minStock: '',
    unit: 'قطعة',
    price: ''
  });
  
  // Success/Error messages
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      // Load data from API
      const [salesSummary, customersData, invoicesData, paymentsData] = await Promise.all([
        salesAPI.getSalesSummary(),
        salesAPI.getCustomers({ limit: 10 }),
        salesAPI.getInvoices({ limit: 10 }),
        salesAPI.getPayments({ limit: 10 })
      ]);

      setSalesData(salesSummary);
      setCustomers(customersData.data || []);
      setInvoices(invoicesData.data || []);
      setPayments(paymentsData.data || []);

      const mockInventory: InventoryItem[] = [
        {
          id: 'INV-001',
          name: 'مواد بناء أساسية',
          code: 'MB001',
          category: 'مواد بناء',
          currentStock: 150,
          minStock: 50,
          unit: 'طن',
          price: 250,
          status: 'in-stock'
        },
        {
          id: 'INV-002',
          name: 'أدوات كهربائية',
          code: 'EL002',
          category: 'أدوات',
          currentStock: 25,
          minStock: 30,
          unit: 'قطعة',
          price: 120,
          status: 'low-stock'
        },
        {
          id: 'INV-003',
          name: 'مواد دهان',
          code: 'PN003',
          category: 'دهانات',
          currentStock: 0,
          minStock: 20,
          unit: 'لتر',
          price: 45,
          status: 'out-of-stock'
        }
      ];

      const mockInvoices: Invoice[] = [
        {
          id: 'INV-001',
          customerName: 'شركة التجارة الدولية',
          date: '2024-01-15',
          total: 8500,
          status: 'posted',
          type: 'sale',
          items: 12
        },
        {
          id: 'INV-002',
          customerName: 'مؤسسة الخدمات العامة',
          date: '2024-01-14',
          total: 12300,
          status: 'approved',
          type: 'sale',
          items: 8
        },
        {
          id: 'INV-003',
          customerName: 'شركة التطوير العقاري',
          date: '2024-01-14',
          total: 5600,
          status: 'draft',
          type: 'sale',
          items: 5
        }
      ];

      const mockPayments: Payment[] = [
        {
          id: 'PAY-001',
          customerName: 'شركة التجارة الدولية',
          date: '2024-01-15',
          amount: 5000,
          method: 'bank',
          invoiceId: 'INV-001',
          status: 'completed'
        },
        {
          id: 'PAY-002',
          customerName: 'مؤسسة الخدمات العامة',
          date: '2024-01-14',
          amount: 8000,
          method: 'cash',
          status: 'completed'
        }
      ];

      // Inventory data is still mock for now
      setInventory(mockInventory);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-warning-100 text-warning-800';
      case 'cancelled': return 'bg-danger-100 text-danger-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'posted': return 'bg-success-100 text-success-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'processing': return 'قيد المعالجة';
      case 'pending': return 'معلق';
      case 'cancelled': return 'ملغي';
      case 'draft': return 'مسودة';
      case 'approved': return 'معتمد';
      case 'posted': return 'مرحل';
      default: return 'غير محدد';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'wholesale': return 'جملة';
      case 'retail': return 'تجزئة';
      case 'vip': return 'VIP';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wholesale': return 'bg-blue-100 text-blue-800';
      case 'retail': return 'bg-green-100 text-green-800';
      case 'vip': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-success-100 text-success-800';
      case 'low-stock': return 'bg-warning-100 text-warning-800';
      case 'out-of-stock': return 'bg-danger-100 text-danger-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'in-stock': return 'متوفر';
      case 'low-stock': return 'منخفض';
      case 'out-of-stock': return 'نفذ';
      default: return 'غير محدد';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD'
    }).format(amount);
  };

  // وظائف أزرار الإجراءات
  const handleAddCustomer = () => {
    console.log('Opening customer modal...');
    setShowAddCustomerModal(true);
    console.log('showAddCustomerModal set to:', true);
  };

  const handleAddInvoice = () => {
    setShowAddInvoiceModal(true);
  };

  const handleAddPayment = () => {
    setShowAddPaymentModal(true);
  };

  const handleAddInventory = () => {
    setShowAddInventoryModal(true);
  };

  const handleViewCustomer = (customerId: string) => {
    alert(`عرض تفاصيل العميل: ${customerId}`);
    // يمكن إضافة التنقل إلى صفحة تفاصيل العميل هنا
  };

  const handleEditCustomer = (customerId: string) => {
    alert(`تعديل العميل: ${customerId}`);
    // يمكن إضافة فتح نافذة تعديل العميل هنا
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await salesAPI.deleteCustomer(customerId);
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setMessage({ type: 'success', text: 'تم حذف العميل بنجاح' });
        setTimeout(() => setMessage(null), 1500);
      } catch (error) {
        console.error('Error deleting customer:', error);
        setMessage({ type: 'error', text: 'حدث خطأ أثناء حذف العميل' });
        setTimeout(() => setMessage(null), 1500);
      }
    }
  };

  const handleViewInventory = (itemId: string) => {
    alert(`عرض تفاصيل الصنف: ${itemId}`);
    // يمكن إضافة التنقل إلى صفحة تفاصيل الصنف هنا
  };

  const handleEditInventory = (itemId: string) => {
    alert(`تعديل الصنف: ${itemId}`);
    // يمكن إضافة فتح نافذة تعديل الصنف هنا
  };

  const handleDeleteInventory = (itemId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      setInventory(prev => prev.filter(i => i.id !== itemId));
      setMessage({ type: 'success', text: 'تم حذف الصنف بنجاح' });
      setTimeout(() => setMessage(null), 1500);
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    alert(`عرض تفاصيل الفاتورة: ${invoiceId}`);
    // يمكن إضافة التنقل إلى صفحة تفاصيل الفاتورة هنا
  };

  const handleEditInvoice = (invoiceId: string) => {
    alert(`تعديل الفاتورة: ${invoiceId}`);
    // يمكن إضافة فتح نافذة تعديل الفاتورة هنا
  };

  const handlePrintInvoice = (invoiceId: string) => {
    alert(`جاري طباعة الفاتورة: ${invoiceId}`);
    // يمكن إضافة وظيفة الطباعة هنا
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await salesAPI.deleteInvoice(invoiceId);
        setInvoices(prev => prev.filter(i => i.id !== invoiceId));
        setMessage({ type: 'success', text: 'تم حذف الفاتورة بنجاح' });
        setTimeout(() => setMessage(null), 1500);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        setMessage({ type: 'error', text: 'حدث خطأ أثناء حذف الفاتورة' });
        setTimeout(() => setMessage(null), 1500);
      }
    }
  };

  const handleViewPayment = (paymentId: string) => {
    alert(`عرض تفاصيل الدفعة: ${paymentId}`);
    // يمكن إضافة التنقل إلى صفحة تفاصيل الدفعة هنا
  };

  const handleEditPayment = (paymentId: string) => {
    alert(`تعديل الدفعة: ${paymentId}`);
    // يمكن إضافة فتح نافذة تعديل الدفعة هنا
  };

  const handlePrintPayment = (paymentId: string) => {
    alert(`جاري طباعة إيصال الدفعة: ${paymentId}`);
    // يمكن إضافة وظيفة الطباعة هنا
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      try {
        await salesAPI.deletePayment(paymentId);
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        setMessage({ type: 'success', text: 'تم حذف الدفعة بنجاح' });
        setTimeout(() => setMessage(null), 1500);
      } catch (error) {
        console.error('Error deleting payment:', error);
        setMessage({ type: 'error', text: 'حدث خطأ أثناء حذف الدفعة' });
        setTimeout(() => setMessage(null), 1500);
      }
    }
  };

  const handleGenerateReport = (reportType: string) => {
    alert(`جاري إنشاء تقرير: ${reportType}`);
    // يمكن إضافة وظيفة إنشاء التقارير هنا
  };

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      await loadSalesData();
      setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' });
      setTimeout(() => setMessage(null), 1500);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث البيانات' });
      setTimeout(() => setMessage(null), 1500);
    } finally {
      setLoading(false);
    }
  };

  // Form handling functions
  const handleCustomerFormChange = (field: string, value: string) => {
    setCustomerForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInvoiceFormChange = (field: string, value: string) => {
    setInvoiceForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentFormChange = (field: string, value: string) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInventoryFormChange = (field: string, value: string) => {
    setInventoryForm(prev => ({ ...prev, [field]: value }));
  };

  // Save functions
  const handleSaveCustomer = async () => {
    if (!customerForm.name || !customerForm.phone) {
      setMessage({ type: 'error', text: 'يرجى ملء جميع الحقول المطلوبة' });
      return;
    }

    try {
      const customerData = {
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        category: customerForm.category,
        type: 'individual',
        isActive: true
      };

      const newCustomer = await salesAPI.createCustomer(customerData);
      
      setCustomers(prev => [...prev, newCustomer]);
      
      // Update shared financial data
      updateSalesData('customers', { isActive: true });
      
      setMessage({ type: 'success', text: 'تم إضافة العميل بنجاح' });
      
      // Reset form and close modal
      setTimeout(() => {
        setCustomerForm({ name: '', phone: '', email: '', category: 'wholesale' });
        setShowAddCustomerModal(false);
        setMessage(null);
      }, 1500);
    } catch (error) {
      console.error('Error creating customer:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ العميل' });
    }
  };

  const handleSaveInvoice = async () => {
    if (!invoiceForm.customerId) {
      setMessage({ type: 'error', text: 'يرجى اختيار العميل' });
      return;
    }

    const customer = customers.find(c => c.id === invoiceForm.customerId);
    if (!customer) {
      setMessage({ type: 'error', text: 'العميل غير موجود' });
      return;
    }

    try {
      const invoiceData = {
        customerId: invoiceForm.customerId,
        date: invoiceForm.date,
        type: invoiceForm.type,
        status: 'draft',
        items: [],
        total: 0
      };

      const newInvoice = await salesAPI.createInvoice(invoiceData);
      
      setInvoices(prev => [...prev, newInvoice]);
      
      // Update shared financial data
      updateSalesData('invoices', { total: invoiceData.total || 0 });
      
      setMessage({ type: 'success', text: 'تم إنشاء الفاتورة بنجاح' });
      
      // Reset form and close modal
      setTimeout(() => {
        setInvoiceForm({ type: 'sale', customerId: '', date: new Date().toISOString().split('T')[0] });
        setShowAddInvoiceModal(false);
        setMessage(null);
      }, 1500);
    } catch (error) {
      console.error('Error creating invoice:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء إنشاء الفاتورة' });
    }
  };

  const handleSavePayment = async () => {
    if (!paymentForm.customerId || !paymentForm.amount) {
      setMessage({ type: 'error', text: 'يرجى ملء جميع الحقول المطلوبة' });
      return;
    }

    const customer = customers.find(c => c.id === paymentForm.customerId);
    if (!customer) {
      setMessage({ type: 'error', text: 'العميل غير موجود' });
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'يرجى إدخال مبلغ صحيح' });
      return;
    }

    try {
      const paymentData = {
        customerId: paymentForm.customerId,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        method: paymentForm.method,
        status: 'completed',
        description: `دفعة من العميل ${customer.name}`
      };

      const newPayment = await salesAPI.createPayment(paymentData);
      
      setPayments(prev => [...prev, newPayment]);
      
      // Update customer balance
      setCustomers(prev => prev.map(c => 
        c.id === paymentForm.customerId 
          ? { ...c, balance: Math.max(0, c.balance - amount) }
          : c
      ));

      // Update shared financial data
      updateSalesData('payments', { amount });

      setMessage({ type: 'success', text: 'تم تسجيل الدفعة بنجاح' });
      
      // Reset form and close modal
      setTimeout(() => {
        setPaymentForm({ customerId: '', amount: '', method: 'cash' });
        setShowAddPaymentModal(false);
        setMessage(null);
      }, 1500);
    } catch (error) {
      console.error('Error creating payment:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تسجيل الدفعة' });
    }
  };

  const handleSaveInventory = () => {
    if (!inventoryForm.name || !inventoryForm.code || !inventoryForm.currentStock || !inventoryForm.price) {
      setMessage({ type: 'error', text: 'يرجى ملء جميع الحقول المطلوبة' });
      return;
    }

    const currentStock = parseInt(inventoryForm.currentStock);
    const minStock = parseInt(inventoryForm.minStock) || 0;
    const price = parseFloat(inventoryForm.price);

    if (isNaN(currentStock) || currentStock < 0 || isNaN(price) || price < 0) {
      setMessage({ type: 'error', text: 'يرجى إدخال قيم صحيحة' });
      return;
    }

    const status: 'in-stock' | 'low-stock' | 'out-of-stock' = 
      currentStock === 0 ? 'out-of-stock' : 
      currentStock <= minStock ? 'low-stock' : 'in-stock';

    const newInventoryItem: InventoryItem = {
      id: `INV-${Date.now()}`,
      name: inventoryForm.name,
      code: inventoryForm.code,
      category: inventoryForm.category,
      currentStock: currentStock,
      minStock: minStock,
      unit: inventoryForm.unit,
      price: price,
      status: status
    };

    setInventory(prev => [...prev, newInventoryItem]);
    setMessage({ type: 'success', text: 'تم إضافة الصنف بنجاح' });
    
    // Reset form and close modal
    setTimeout(() => {
      setInventoryForm({ name: '', code: '', category: '', currentStock: '', minStock: '', unit: 'قطعة', price: '' });
      setShowAddInventoryModal(false);
      setMessage(null);
    }, 1500);
  };

  // Reset form functions
  const resetCustomerForm = () => {
    setCustomerForm({ name: '', phone: '', email: '', category: 'wholesale' });
    setShowAddCustomerModal(false);
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({ type: 'sale', customerId: '', date: new Date().toISOString().split('T')[0] });
    setShowAddInvoiceModal(false);
  };

  const resetPaymentForm = () => {
    setPaymentForm({ customerId: '', amount: '', method: 'cash' });
    setShowAddPaymentModal(false);
  };

  const resetInventoryForm = () => {
    setInventoryForm({ name: '', code: '', category: '', currentStock: '', minStock: '', unit: 'قطعة', price: '' });
    setShowAddInventoryModal(false);
  };

  const quickActions = [
    {
      title: 'إدارة العملاء',
      description: 'إضافة/تعديل/حذف العملاء وتصنيفهم',
      icon: Users,
      color: 'blue',
      action: () => setActiveTab('customers')
    },
    {
      title: 'إدارة المخزون',
      description: 'إدارة الأصناف ومتابعة الرصيد',
      icon: Package,
      color: 'green',
      action: () => setActiveTab('inventory')
    },
    {
      title: 'الفواتير',
      description: 'إنشاء وإدارة فواتير المبيعات',
      icon: Receipt,
      color: 'purple',
      action: () => setActiveTab('invoices')
    },
    {
      title: 'المدفوعات',
      description: 'تسجيل المدفوعات ومتابعة الأرصدة',
      icon: CreditCard,
      color: 'orange',
      action: () => setActiveTab('payments')
    },
    {
      title: 'التقارير',
      description: 'تقارير المبيعات والمخزون والعملاء',
      icon: BarChart3,
      color: 'indigo',
      action: () => setActiveTab('reports')
    },
    {
      title: 'الإعدادات',
      description: 'إعدادات النظام والصلاحيات',
      icon: Settings,
      color: 'gray',
      action: () => setActiveTab('settings')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Success/Error Messages */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-800' 
            : 'bg-red-100 border border-red-400 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-2 ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card-gradient border-r-4 border-blue-500 p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ml-4">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">نظام المبيعات</h1>
              <p className="text-gray-600 text-lg">إدارة شاملة للمبيعات والعملاء والمخزون</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">آخر تحديث</p>
            <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleDateString('ar-EG')}</p>
            <div className="mt-2 inline-flex items-center bg-success-100 text-success-800 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-success-400 rounded-full ml-2 animate-pulse"></div>
              <span className="text-sm font-medium">متصل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesData ? formatCurrency(salesData.totalSales) : '0 LYD'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي الطلبات</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesData ? salesData.totalOrders : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">العملاء النشطون</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesData ? salesData.activeCustomers : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card border-r-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">تنبيهات المخزون</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesData ? salesData.lowStockItems : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">الوحدات الرئيسية</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button 
              onClick={handleRefreshData}
              className="btn btn-secondary text-sm flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </button>
            <button 
              onClick={handleAddCustomer}
              className="btn btn-primary text-sm flex items-center"
            >
              <UserPlus className="h-4 w-4 ml-2" />
              إضافة عميل جديد
            </button>
            <button 
              onClick={handleAddInvoice}
              className="btn btn-success text-sm flex items-center"
            >
              <Plus className="h-4 w-4 ml-2" />
              فاتورة جديدة
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {quickActions.map((action, index) => {
            const colorClasses = {
              blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
              green: { bg: 'bg-green-100', icon: 'text-green-600' },
              purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
              orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
              indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
              gray: { bg: 'bg-gray-100', icon: 'text-gray-600' }
            };
            
            const colors = colorClasses[action.color as keyof typeof colorClasses] || colorClasses.blue;
            
            return (
              <div
                key={index}
                onClick={() => action.action()}
                className="card-hover cursor-pointer group transition-professional border-r-4 border-blue-500 hover:border-blue-600"
              >
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colors.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`h-6 w-6 ${colors.icon}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{action.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 space-x-reverse">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
              { id: 'customers', label: 'العملاء', icon: Users },
              { id: 'inventory', label: 'المخزون', icon: Package },
              { id: 'invoices', label: 'الفواتير', icon: Receipt },
              { id: 'payments', label: 'المدفوعات', icon: CreditCard },
              { id: 'reports', label: 'التقارير', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 ml-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">نظرة عامة على النظام</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">إحصائيات سريعة</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• إجمالي الفواتير: {salesData?.totalInvoices}</li>
                    <li>• إجمالي المدفوعات: {salesData?.totalPayments}</li>
                    <li>• معدل النمو: {salesData?.monthlyGrowth}%</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">تنبيهات مهمة</h4>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>• {salesData?.lowStockItems} صنف يحتاج إعادة طلب</li>
                    <li>• {customers.filter(c => c.balance > 0).length} عميل له رصيد مستحق</li>
                    <li>• {invoices.filter(i => i.status === 'draft').length} فاتورة في المسودة</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">إدارة العملاء</h3>
                <button className="btn btn-primary text-sm flex items-center">
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة عميل جديد
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-right font-medium text-gray-700">اسم العميل</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">التصنيف</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الهاتف</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الرصيد</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">آخر طلب</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(customer.category)}`}>
                            {getCategoryLabel(customer.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.phone}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {formatCurrency(customer.balance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(customer.lastOrder).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button 
                              onClick={() => handleViewCustomer(customer.id)}
                              className="p-1 text-blue-600 hover:text-blue-800" 
                              title="عرض"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditCustomer(customer.id)}
                              className="p-1 text-green-600 hover:text-green-800" 
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="p-1 text-red-600 hover:text-red-800" 
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">إدارة المخزون</h3>
                <button 
                  onClick={handleAddInventory}
                  className="btn btn-primary text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة صنف جديد
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-right font-medium text-gray-700">اسم الصنف</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الرمز</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الفئة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الرصيد</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">السعر</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(item.status)}`}>
                            {getStockStatusLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button 
                              onClick={() => handleViewInventory(item.id)}
                              className="p-1 text-blue-600 hover:text-blue-800" 
                              title="عرض"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditInventory(item.id)}
                              className="p-1 text-green-600 hover:text-green-800" 
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteInventory(item.id)}
                              className="p-1 text-red-600 hover:text-red-800" 
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">إدارة الفواتير</h3>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button 
                    onClick={handleAddInvoice}
                    className="btn btn-success text-sm flex items-center"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    فاتورة مبيعات
                  </button>
                  <button 
                    onClick={handleAddInvoice}
                    className="btn btn-warning text-sm flex items-center"
                  >
                    <Receipt className="h-4 w-4 ml-2" />
                    فاتورة مرتجع
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-right font-medium text-gray-700">رقم الفاتورة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">العميل</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">التاريخ</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">المبلغ</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">النوع</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{invoice.customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(invoice.date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {invoice.type === 'sale' ? 'مبيعات' : invoice.type === 'return' ? 'مرتجع' : 'تسليم'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {getStatusLabel(invoice.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button 
                              onClick={() => handleViewInvoice(invoice.id)}
                              className="p-1 text-blue-600 hover:text-blue-800" 
                              title="عرض"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditInvoice(invoice.id)}
                              className="p-1 text-green-600 hover:text-green-800" 
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handlePrintInvoice(invoice.id)}
                              className="p-1 text-purple-600 hover:text-purple-800" 
                              title="طباعة"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">إدارة المدفوعات</h3>
                <button 
                  onClick={handleAddPayment}
                  className="btn btn-primary text-sm flex items-center"
                >
                  <CreditCard className="h-4 w-4 ml-2" />
                  تسجيل دفعة جديدة
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-right font-medium text-gray-700">رقم الدفعة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">العميل</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">التاريخ</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">المبلغ</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الطريقة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{payment.customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(payment.date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.method === 'cash' ? 'نقدي' : payment.method === 'bank' ? 'بنكي' : 'شيك'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button 
                              onClick={() => handleViewPayment(payment.id)}
                              className="p-1 text-blue-600 hover:text-blue-800" 
                              title="عرض"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditPayment(payment.id)}
                              className="p-1 text-green-600 hover:text-green-800" 
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handlePrintPayment(payment.id)}
                              className="p-1 text-purple-600 hover:text-purple-800" 
                              title="طباعة"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">التقارير</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <Users className="h-8 w-8 text-blue-600 ml-3" />
                    <h4 className="text-lg font-semibold text-gray-900">تقرير العملاء</h4>
                  </div>
                  <p className="text-gray-600 mb-4">كشف حساب العميل وحركة العميل خلال فترة محددة</p>
                  <button 
                    onClick={() => handleGenerateReport('customers')}
                    className="btn btn-outline w-full"
                  >
                    إنشاء التقرير
                  </button>
                </div>

                <div className="card border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <Package className="h-8 w-8 text-green-600 ml-3" />
                    <h4 className="text-lg font-semibold text-gray-900">تقرير المخزون</h4>
                  </div>
                  <p className="text-gray-600 mb-4">رصيد المخزون الحالي وحركة الأصناف</p>
                  <button 
                    onClick={() => handleGenerateReport('inventory')}
                    className="btn btn-outline w-full"
                  >
                    إنشاء التقرير
                  </button>
                </div>

                <div className="card border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <Receipt className="h-8 w-8 text-purple-600 ml-3" />
                    <h4 className="text-lg font-semibold text-gray-900">تقرير المبيعات</h4>
                  </div>
                  <p className="text-gray-600 mb-4">تقرير المبيعات والإيرادات خلال فترة محددة</p>
                  <button 
                    onClick={() => handleGenerateReport('sales')}
                    className="btn btn-outline w-full"
                  >
                    إنشاء التقرير
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Adding Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">إضافة عميل جديد</h3>
              <button 
                onClick={() => setShowAddCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
                <input 
                  type="text" 
                  value={customerForm.name}
                  onChange={(e) => handleCustomerFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل اسم العميل"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                <input 
                  type="tel" 
                  value={customerForm.phone}
                  onChange={(e) => handleCustomerFormChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  value={customerForm.email}
                  onChange={(e) => handleCustomerFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                <select 
                  value={customerForm.category}
                  onChange={(e) => handleCustomerFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="wholesale">جملة</option>
                  <option value="retail">تجزئة</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 space-x-reverse mt-6">
              <button 
                onClick={resetCustomerForm}
                className="btn btn-outline text-sm"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveCustomer}
                className="btn btn-primary text-sm"
              >
                إضافة العميل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding Invoice */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">إنشاء فاتورة جديدة</h3>
              <button 
                onClick={() => setShowAddInvoiceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الفاتورة</label>
                <select 
                  value={invoiceForm.type}
                  onChange={(e) => handleInvoiceFormChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sale">فاتورة مبيعات</option>
                  <option value="return">فاتورة مرتجع</option>
                  <option value="delivery">إذن تسليم</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العميل *</label>
                <select 
                  value={invoiceForm.customerId}
                  onChange={(e) => handleInvoiceFormChange('customerId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر العميل</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input 
                  type="date" 
                  value={invoiceForm.date}
                  onChange={(e) => handleInvoiceFormChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 space-x-reverse mt-6">
              <button 
                onClick={resetInvoiceForm}
                className="btn btn-outline text-sm"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveInvoice}
                className="btn btn-success text-sm"
              >
                إنشاء الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding Payment */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">تسجيل دفعة جديدة</h3>
              <button 
                onClick={() => setShowAddPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العميل *</label>
                <select 
                  value={paymentForm.customerId}
                  onChange={(e) => handlePaymentFormChange('customerId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر العميل</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - رصيد: {formatCurrency(customer.balance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label>
                <input 
                  type="number" 
                  value={paymentForm.amount}
                  onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل المبلغ"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                <select 
                  value={paymentForm.method}
                  onChange={(e) => handlePaymentFormChange('method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">نقدي</option>
                  <option value="bank">بنكي</option>
                  <option value="check">شيك</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 space-x-reverse mt-6">
              <button 
                onClick={resetPaymentForm}
                className="btn btn-outline text-sm"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSavePayment}
                className="btn btn-primary text-sm"
              >
                تسجيل الدفعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding Inventory Item */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">إضافة صنف جديد</h3>
              <button 
                onClick={() => setShowAddInventoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الصنف *</label>
                <input 
                  type="text" 
                  value={inventoryForm.name}
                  onChange={(e) => handleInventoryFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل اسم الصنف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رمز الصنف *</label>
                <input 
                  type="text" 
                  value={inventoryForm.code}
                  onChange={(e) => handleInventoryFormChange('code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل رمز الصنف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                <input 
                  type="text" 
                  value={inventoryForm.category}
                  onChange={(e) => handleInventoryFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل فئة الصنف"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد الأولي *</label>
                  <input 
                    type="number" 
                    value={inventoryForm.currentStock}
                    onChange={(e) => handleInventoryFormChange('currentStock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى</label>
                  <input 
                    type="number" 
                    value={inventoryForm.minStock}
                    onChange={(e) => handleInventoryFormChange('minStock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
                  <select 
                    value={inventoryForm.unit}
                    onChange={(e) => handleInventoryFormChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="كيلو">كيلو</option>
                    <option value="لتر">لتر</option>
                    <option value="متر">متر</option>
                    <option value="طن">طن</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر *</label>
                  <input 
                    type="number" 
                    value={inventoryForm.price}
                    onChange={(e) => handleInventoryFormChange('price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 space-x-reverse mt-6">
              <button 
                onClick={resetInventoryForm}
                className="btn btn-outline text-sm"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveInventory}
                className="btn btn-primary text-sm"
              >
                إضافة الصنف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;

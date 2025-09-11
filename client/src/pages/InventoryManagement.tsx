import React, { useState, useEffect } from 'react';
import { Plus, Package, Edit, Eye, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Search, Filter } from 'lucide-react';
import { salesAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';

interface InventoryItem {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  itemDescriptionEn?: string;
  category: 'electronics' | 'clothing' | 'accessories' | 'books' | 'toys' | 'medical' | 'industrial' | 'other';
  quantity: number;
  weight: number; // بالكيلوغرام
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue: number; // القيمة المصرح بها بالدولار
  shippingCost: number; // تكلفة الشحن
  originLocation: string; // مكان الاستلام في الصين
  destinationLocation: string; // مكان التسليم في ليبيا
  status: 'received_china' | 'in_transit' | 'customs_clearance' | 'out_for_delivery' | 'delivered' | 'returned';
  receivedDate: string;
  estimatedDelivery?: string;
  actualDeliveryDate?: string;
  notes?: string;
  isFragile: boolean;
  requiresSpecialHandling: boolean;
  customsDeclaration?: string;
  lastUpdated: string;
}

interface ShipmentMovement {
  id: string;
  trackingNumber: string;
  type: 'status_update' | 'location_change' | 'delivery_attempt';
  previousStatus?: string;
  newStatus: string;
  location: string;
  date: string;
  notes?: string;
  handledBy?: string;
}

const InventoryManagement: React.FC = () => {
  const [shipments, setShipments] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<ShipmentMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedShipment, setSelectedShipment] = useState<InventoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('shipments');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [formData, setFormData] = useState({
    trackingNumber: '',
    customerName: '',
    customerPhone: '',
    itemDescription: '',
    itemDescriptionEn: '',
    category: 'other' as 'electronics' | 'clothing' | 'accessories' | 'books' | 'toys' | 'medical' | 'industrial' | 'other',
    quantity: 1,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    declaredValue: 0,
    shippingCost: 0,
    originLocation: '',
    destinationLocation: '',
    estimatedDelivery: '',
    notes: '',
    isFragile: false,
    requiresSpecialHandling: false,
    customsDeclaration: ''
  });

  const [movementData, setMovementData] = useState({
    trackingNumber: '',
    type: 'status_update' as 'status_update' | 'location_change' | 'delivery_attempt',
    newStatus: 'received_china' as 'received_china' | 'in_transit' | 'customs_clearance' | 'out_for_delivery' | 'delivered' | 'returned',
    location: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadShipments();
    if (activeTab === 'movements') {
      loadMovements();
    }
  }, [pagination.current, searchValue, categoryFilter, statusFilter, activeTab]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      // Mock data for shipping company
      const mockShipments: InventoryItem[] = [
        {
          id: '1',
          trackingNumber: 'GH2024001',
          customerName: 'أحمد محمد علي',
          customerPhone: '+218912345678',
          itemDescription: 'هاتف ذكي آيفون 15',
          itemDescriptionEn: 'iPhone 15 Smartphone',
          category: 'electronics',
          quantity: 1,
          weight: 0.5,
          dimensions: { length: 15, width: 8, height: 2 },
          declaredValue: 800,
          shippingCost: 120,
          originLocation: 'شنغهاي، الصين',
          destinationLocation: 'طرابلس، ليبيا',
          status: 'in_transit',
          receivedDate: '2024-01-10',
          estimatedDelivery: '2024-01-25',
          notes: 'عبوة أصلية مع الضمان',
          isFragile: true,
          requiresSpecialHandling: false,
          customsDeclaration: 'هاتف محمول للاستخدام الشخصي',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          trackingNumber: 'GH2024002',
          customerName: 'فاطمة أحمد',
          customerPhone: '+218923456789',
          itemDescription: 'ملابس نسائية متنوعة',
          itemDescriptionEn: 'Women\'s Clothing Assortment',
          category: 'clothing',
          quantity: 5,
          weight: 2.3,
          dimensions: { length: 40, width: 30, height: 15 },
          declaredValue: 150,
          shippingCost: 80,
          originLocation: 'قوانغتشو، الصين',
          destinationLocation: 'بنغازي، ليبيا',
          status: 'customs_clearance',
          receivedDate: '2024-01-08',
          estimatedDelivery: '2024-01-22',
          notes: 'ملابس صيفية مقاسات مختلفة',
          isFragile: false,
          requiresSpecialHandling: false,
          customsDeclaration: 'ملابس نسائية للاستخدام الشخصي',
          lastUpdated: new Date().toISOString()
        }
      ];

      setShipments(mockShipments);
      setPagination(prev => ({
        ...prev,
        total: mockShipments.length
      }));
    } catch (error) {
      console.error('Error loading shipments:', error);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      // Mock shipment movements data
      const mockMovements: ShipmentMovement[] = [
        {
          id: '1',
          trackingNumber: 'GH2024001',
          type: 'status_update',
          previousStatus: 'received_china',
          newStatus: 'in_transit',
          location: 'مطار شنغهاي الدولي',
          date: new Date().toISOString(),
          notes: 'تم شحن الطرد عبر الطيران',
          handledBy: 'فريق الشحن - الصين'
        },
        {
          id: '2',
          trackingNumber: 'GH2024002',
          type: 'status_update',
          previousStatus: 'in_transit',
          newStatus: 'customs_clearance',
          location: 'مطار طرابلس الدولي',
          date: new Date().toISOString(),
          notes: 'وصل الطرد وفي انتظار التخليص الجمركي',
          handledBy: 'فريق الجمارك - ليبيا'
        }
      ];

      setMovements(mockMovements);
    } catch (error) {
      console.error('Error loading shipment movements:', error);
      setMovements([]);
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', shipment?: InventoryItem) => {
    setModalMode(mode);
    setSelectedShipment(shipment || null);

    if (mode === 'create') {
      setFormData({
        trackingNumber: '',
        customerName: '',
        customerPhone: '',
        itemDescription: '',
        itemDescriptionEn: '',
        category: 'other',
        quantity: 1,
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        declaredValue: 0,
        shippingCost: 0,
        originLocation: '',
        destinationLocation: '',
        estimatedDelivery: '',
        notes: '',
        isFragile: false,
        requiresSpecialHandling: false,
        customsDeclaration: ''
      });
    } else if (shipment) {
      setFormData({
        trackingNumber: shipment.trackingNumber,
        customerName: shipment.customerName,
        customerPhone: shipment.customerPhone,
        itemDescription: shipment.itemDescription,
        itemDescriptionEn: shipment.itemDescriptionEn || '',
        category: shipment.category,
        quantity: shipment.quantity,
        weight: shipment.weight,
        dimensions: shipment.dimensions,
        declaredValue: shipment.declaredValue,
        shippingCost: shipment.shippingCost,
        originLocation: shipment.originLocation,
        destinationLocation: shipment.destinationLocation,
        estimatedDelivery: shipment.estimatedDelivery || '',
        notes: shipment.notes || '',
        isFragile: shipment.isFragile,
        requiresSpecialHandling: shipment.requiresSpecialHandling,
        customsDeclaration: shipment.customsDeclaration || ''
      });
    }

    setFormErrors({});
    setIsModalOpen(true);
  };

  const openMovementModal = (shipment?: InventoryItem) => {
    setSelectedShipment(shipment || null);
    setMovementData({
      trackingNumber: shipment?.trackingNumber || '',
      type: 'status_update',
      newStatus: 'received_china',
      location: '',
      notes: ''
    });
    setIsMovementModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsMovementModalOpen(false);
    setSelectedShipment(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.trackingNumber) {
      errors.trackingNumber = 'يجب إدخال رقم التتبع';
    }

    if (!formData.customerName) {
      errors.customerName = 'يجب إدخال اسم العميل';
    }

    if (!formData.customerPhone) {
      errors.customerPhone = 'يجب إدخال رقم هاتف العميل';
    }

    if (!formData.itemDescription) {
      errors.itemDescription = 'يجب إدخال وصف الشحنة';
    }

    if (formData.weight <= 0) {
      errors.weight = 'الوزن يجب أن يكون أكبر من صفر';
    }

    if (formData.declaredValue <= 0) {
      errors.declaredValue = 'القيمة المصرح بها يجب أن تكون أكبر من صفر';
    }

    if (!formData.originLocation) {
      errors.originLocation = 'يجب إدخال مكان الاستلام';
    }

    if (!formData.destinationLocation) {
      errors.destinationLocation = 'يجب إدخال مكان التسليم';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // TODO: Implement API calls when shipping endpoints are ready
      console.log('Saving shipment:', formData);

      closeModal();
      loadShipments();
    } catch (error) {
      console.error('Error saving shipment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMovementSubmit = async () => {
    try {
      setSubmitting(true);

      // TODO: Implement shipment tracking API
      console.log('Recording movement:', movementData);

      closeModal();
      loadShipments();
      loadMovements();
    } catch (error) {
      console.error('Error recording movement:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getShipmentStatusColor = (status: string) => {
    switch (status) {
      case 'received_china':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'customs_clearance':
        return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShipmentStatusText = (status: string) => {
    switch (status) {
      case 'received_china':
        return 'تم الاستلام - الصين';
      case 'in_transit':
        return 'في الطريق';
      case 'customs_clearance':
        return 'التخليص الجمركي';
      case 'out_for_delivery':
        return 'خرج للتسليم';
      case 'delivered':
        return 'تم التسليم';
      case 'returned':
        return 'مرتجع';
      default:
        return 'غير محدد';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'electronics':
        return 'إلكترونيات';
      case 'clothing':
        return 'ملابس';
      case 'accessories':
        return 'إكسسوارات';
      case 'books':
        return 'كتب';
      case 'toys':
        return 'ألعاب';
      case 'medical':
        return 'طبية';
      case 'industrial':
        return 'صناعية';
      case 'other':
        return 'أخرى';
      default:
        return category;
    }
  };

  const columns = [
    {
      key: 'trackingNumber',
      title: 'رقم التتبع',
      width: '120px'
    },
    {
      key: 'customerName',
      title: 'اسم العميل',
      width: '150px'
    },
    {
      key: 'itemDescription',
      title: 'وصف الشحنة',
      width: '200px'
    },
    {
      key: 'category',
      title: 'الفئة',
      width: '100px',
      render: (value: string) => getCategoryText(value)
    },
    {
      key: 'weight',
      title: 'الوزن',
      width: '80px',
      render: (value: number) => `${value} كغ`
    },
    {
      key: 'declaredValue',
      title: 'القيمة المصرحة',
      width: '120px',
      render: (value: number) => `$${value.toLocaleString()}`
    },
    {
      key: 'shippingCost',
      title: 'تكلفة الشحن',
      width: '120px',
      render: (value: number) => `${value.toLocaleString()} د.ل`
    },
    {
      key: 'status',
      title: 'حالة الشحنة',
      width: '140px',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShipmentStatusColor(value)}`}>
          {getShipmentStatusText(value)}
        </span>
      )
    },
    {
      key: 'estimatedDelivery',
      title: 'التسليم المتوقع',
      width: '120px',
      render: (value: string) => value ? new Date(value).toLocaleDateString('ar-EG') : '-'
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      width: '150px',
      render: (_: any, record: InventoryItem) => (
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('view', record);
            }}
            className="text-blue-600 hover:text-blue-800"
            title="عرض التفاصيل"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('edit', record);
            }}
            className="text-green-600 hover:text-green-800"
            title="تعديل"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openMovementModal(record);
            }}
            className="text-purple-600 hover:text-purple-800"
            title="تحديث الحالة"
          >
            <TrendingUp className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const movementColumns = [
    {
      key: 'date',
      title: 'التاريخ والوقت',
      width: '140px',
      render: (value: string) => new Date(value).toLocaleString('ar-EG')
    },
    {
      key: 'trackingNumber',
      title: 'رقم التتبع',
      width: '120px'
    },
    {
      key: 'type',
      title: 'نوع الحركة',
      width: '120px',
      render: (value: string) => {
        const typeMap = {
          status_update: { text: 'تحديث الحالة', class: 'bg-blue-100 text-blue-800', icon: TrendingUp },
          location_change: { text: 'تغيير الموقع', class: 'bg-green-100 text-green-800', icon: Package },
          delivery_attempt: { text: 'محاولة تسليم', class: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
        };
        const type = typeMap[value as keyof typeof typeMap];
        const Icon = type.icon;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.class} flex items-center`}>
            <Icon className="h-3 w-3 ml-1" />
            {type.text}
          </span>
        );
      }
    },
    {
      key: 'newStatus',
      title: 'الحالة الجديدة',
      width: '140px',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShipmentStatusColor(value)}`}>
          {getShipmentStatusText(value)}
        </span>
      )
    },
    {
      key: 'location',
      title: 'الموقع',
      width: '150px'
    },
    {
      key: 'handledBy',
      title: 'تم بواسطة',
      width: '120px'
    },
    {
      key: 'notes',
      title: 'ملاحظات',
      width: '200px'
    }
  ];

  const categories = [
    { value: 'electronics', label: 'إلكترونيات' },
    { value: 'clothing', label: 'ملابس' },
    { value: 'accessories', label: 'إكسسوارات' },
    { value: 'books', label: 'كتب' },
    { value: 'toys', label: 'ألعاب' },
    { value: 'medical', label: 'طبية' },
    { value: 'industrial', label: 'صناعية' },
    { value: 'other', label: 'أخرى' }
  ];

  const statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'received_china', label: 'تم الاستلام - الصين' },
    { value: 'in_transit', label: 'في الطريق' },
    { value: 'customs_clearance', label: 'التخليص الجمركي' },
    { value: 'out_for_delivery', label: 'خرج للتسليم' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'returned', label: 'مرتجع' }
  ];

  const shipmentStatuses = [
    { value: 'received_china', label: 'تم الاستلام - الصين' },
    { value: 'in_transit', label: 'في الطريق' },
    { value: 'customs_clearance', label: 'التخليص الجمركي' },
    { value: 'out_for_delivery', label: 'خرج للتسليم' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'returned', label: 'مرتجع' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="h-8 w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الشحنات</h1>
            <p className="text-gray-600">تتبع الشحنات من الصين إلى ليبيا</p>
          </div>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={() => openMovementModal()}
            className="btn-secondary flex items-center"
          >
            <TrendingUp className="h-5 w-5 ml-2" />
            تحديث الحالة
          </button>
          <button
            onClick={() => openModal('create')}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 ml-2" />
            شحنة جديدة
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي الشحنات</p>
              <p className="text-2xl font-bold text-gray-900">{shipments.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">تم التسليم</p>
              <p className="text-2xl font-bold text-gray-900">
                {shipments.filter(shipment => shipment.status === 'delivered').length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-r-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">في الطريق</p>
              <p className="text-2xl font-bold text-gray-900">
                {shipments.filter(shipment => shipment.status === 'in_transit').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي القيمة</p>
              <p className="text-2xl font-bold text-gray-900">
                ${shipments.reduce((sum, shipment) => sum + shipment.declaredValue, 0).toLocaleString()}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 space-x-reverse px-6">
            <button
              onClick={() => setActiveTab('shipments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'shipments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              الشحنات
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'movements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              تتبع الحركات
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'shipments' && (
            <>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <SearchFilter
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="البحث برقم التتبع أو اسم العميل..."
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="">جميع الفئات</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div></div>
              </div>

              {/* Shipments Table */}
              <DataTable
                columns={columns}
                data={shipments}
                loading={loading}
                pagination={{
                  current: pagination.current,
                  total: pagination.total,
                  pageSize: pagination.pageSize,
                  onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
                }}
                emptyText="لا توجد شحنات"
              />
            </>
          )}

          {activeTab === 'movements' && (
            <DataTable
              columns={movementColumns}
              data={movements}
              loading={loading}
              emptyText="لا توجد حركات مخزون"
            />
          )}
        </div>
      </div>

      {/* Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'إضافة صنف جديد' :
          modalMode === 'edit' ? 'تعديل الصنف' : 'عرض الصنف'
        }
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="رقم التتبع"
              error={formErrors.trackingNumber}
              required
            >
              <input
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                className="form-input"
                disabled={modalMode === 'view'}
                placeholder="GH2024001"
              />
            </FormField>

            <FormField
              label="اسم العميل"
              error={formErrors.customerName}
              required
            >
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="form-input"
                disabled={modalMode === 'view'}
                placeholder="اسم العميل"
              />
            </FormField>

            <FormField
              label="رقم هاتف العميل"
              error={formErrors.customerPhone}
              required
            >
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="form-input"
                disabled={modalMode === 'view'}
                placeholder="+218912345678"
              />
            </FormField>

            <FormField
              label="الفئة"
              error={formErrors.category}
              required
            >
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="form-select"
                disabled={modalMode === 'view'}
              >
                <option value="">اختر الفئة</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="الكمية" required>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="form-input"
                disabled={modalMode === 'view'}
                min="1"
                placeholder="1"
              />
            </FormField>

            <FormField
              label="وصف الشحنة"
              error={formErrors.itemDescription}
              required
            >
              <input
                type="text"
                value={formData.itemDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, itemDescription: e.target.value }))}
                className="form-input"
                disabled={modalMode === 'view'}
                placeholder="وصف الشحنة"
              />
            </FormField>

            <FormField label="الوصف بالإنجليزية">
              <input
                type="text"
                value={formData.itemDescriptionEn}
                onChange={(e) => setFormData(prev => ({ ...prev, itemDescriptionEn: e.target.value }))}
                className="form-input"
                disabled={modalMode === 'view'}
                placeholder="Item Description"
              />
            </FormField>
          </div>

          {/* Shipment Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">تفاصيل الشحنة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="الوزن (كغ)"
                error={formErrors.weight}
                required
              >
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  min="0"
                  step="0.1"
                  placeholder="0.5"
                />
              </FormField>

              <FormField
                label="الطول (سم)"
              >
                <input
                  type="number"
                  value={formData.dimensions.length}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, length: parseFloat(e.target.value) || 0 }
                  }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  min="0"
                  step="0.1"
                />
              </FormField>

              <FormField
                label="العرض (سم)"
              >
                <input
                  type="number"
                  value={formData.dimensions.width}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, width: parseFloat(e.target.value) || 0 }
                  }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  min="0"
                  step="0.1"
                />
              </FormField>

              <FormField
                label="الارتفاع (سم)"
              >
                <input
                  type="number"
                  value={formData.dimensions.height}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, height: parseFloat(e.target.value) || 0 }
                  }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  min="0"
                  step="0.1"
                />
              </FormField>
            </div>
          </div>

          {/* Cost Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات التكلفة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="القيمة المصرحة ($)"
                error={formErrors.declaredValue}
                required
              >
                <input
                  type="number"
                  value={formData.declaredValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, declaredValue: parseFloat(e.target.value) || 0 }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  min="0"
                  step="0.01"
                  placeholder="100.00"
                />
              </FormField>

              <FormField
                label="تكلفة الشحن (د.ل)"
              >
                <input
                  type="number"
                  value={formData.shippingCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  min="0"
                  step="0.01"
                  placeholder="50.00"
                />
              </FormField>
            </div>
          </div>

          {/* Location Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات المواقع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="مكان الاستلام"
                error={formErrors.originLocation}
                required
              >
                <input
                  type="text"
                  value={formData.originLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, originLocation: e.target.value }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  placeholder="شنغهاي، الصين"
                />
              </FormField>

              <FormField
                label="مكان التسليم"
                error={formErrors.destinationLocation}
                required
              >
                <input
                  type="text"
                  value={formData.destinationLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationLocation: e.target.value }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  placeholder="طرابلس، ليبيا"
                />
              </FormField>

              <FormField label="التسليم المتوقع">
                <input
                  type="date"
                  value={formData.estimatedDelivery}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                />
              </FormField>

              <FormField label="البيان الجمركي">
                <input
                  type="text"
                  value={formData.customsDeclaration}
                  onChange={(e) => setFormData(prev => ({ ...prev, customsDeclaration: e.target.value }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  placeholder="للاستخدام الشخصي"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFragile"
                  checked={formData.isFragile}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFragile: e.target.checked }))}
                  className="form-checkbox"
                  disabled={modalMode === 'view'}
                />
                <label htmlFor="isFragile" className="mr-2 text-sm text-gray-700">
                  شحنة هشة
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresSpecialHandling"
                  checked={formData.requiresSpecialHandling}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresSpecialHandling: e.target.checked }))}
                  className="form-checkbox"
                  disabled={modalMode === 'view'}
                />
                <label htmlFor="requiresSpecialHandling" className="mr-2 text-sm text-gray-700">
                  يتطلب معاملة خاصة
                </label>
              </div>
            </div>

            <FormField label="ملاحظات">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="form-textarea"
                disabled={modalMode === 'view'}
                rows={3}
                placeholder="ملاحظات إضافية..."
              />
            </FormField>
          </div>

          {/* Modal Actions */}
          {modalMode !== 'view' && (
            <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
              <button
                onClick={closeModal}
                className="btn-secondary"
                disabled={submitting}
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'جاري الحفظ...' : 'حفظ الشحنة'}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Shipment Status Update Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={closeModal}
        title="تحديث حالة الشحنة"
        size="md"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <FormField label="رقم التتبع" required>
              <input
                type="text"
                value={movementData.trackingNumber}
                onChange={(e) => setMovementData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                className="form-input"
                placeholder="GH2024001"
              />
            </FormField>

            <FormField label="نوع التحديث" required>
              <select
                value={movementData.type}
                onChange={(e) => setMovementData(prev => ({ ...prev, type: e.target.value as any }))}
                className="form-select"
              >
                <option value="status_update">تحديث الحالة</option>
                <option value="location_change">تغيير الموقع</option>
                <option value="delivery_attempt">محاولة تسليم</option>
              </select>
            </FormField>

            <FormField label="الحالة الجديدة" required>
              <select
                value={movementData.newStatus}
                onChange={(e) => setMovementData(prev => ({ ...prev, newStatus: e.target.value as any }))}
                className="form-select"
              >
                {shipmentStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="الموقع الحالي" required>
              <input
                type="text"
                value={movementData.location}
                onChange={(e) => setMovementData(prev => ({ ...prev, location: e.target.value }))}
                className="form-input"
                placeholder="مطار طرابلس الدولي"
              />
            </FormField>
          </div>

          <FormField label="ملاحظات">
            <textarea
              value={movementData.notes}
              onChange={(e) => setMovementData(prev => ({ ...prev, notes: e.target.value }))}
              className="form-textarea"
              rows={3}
              placeholder="ملاحظات إضافية حول التحديث..."
            />
          </FormField>

          <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
            <button
              onClick={closeModal}
              className="btn-secondary"
              disabled={submitting}
            >
              إلغاء
            </button>
            <button
              onClick={handleMovementSubmit}
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'جاري التحديث...' : 'تحديث الحالة'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryManagement;

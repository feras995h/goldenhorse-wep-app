import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Plus, Package, Edit, Eye, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Search, Filter } from 'lucide-react';
import { salesAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';

interface InventoryItem {
  id: string;
  trackingNumber: string;
  customerId?: string;
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
  volume?: number; // الحجم المحسوب (سم³)
  volumeOverride?: number; // الحجم اليدوي (سم³)
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
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<ShipmentMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isReleaseOrderModalOpen, setIsReleaseOrderModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  // Customers list for selection when creating/editing a shipment
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone?: string }>>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const result = await salesAPI.getCustomers({ page: 1, limit: 100 });
      const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      setCustomers(list.map((c: any) => ({ id: c.id, name: c.name || c.customerName || c.fullName || '', phone: c.phone || c.mobile || c.customerPhone })));
    } catch (e) {
      console.error('Failed to load customers', e);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const searchCustomers = async (term: string) => {
    try {
      setLoadingCustomers(true);
      const result = await salesAPI.getCustomers({ search: term, limit: 20 });
      const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      setCustomers(list.map((c: any) => ({ id: c.id, name: c.name || c.customerName || c.fullName || '', phone: c.phone || c.mobile || c.customerPhone })));
    } catch (e) {
      console.error('Failed to search customers', e);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (customerSearchTerm && customerSearchTerm.length >= 2) {
      searchCustomers(customerSearchTerm);
      setIsCustomerDropdownOpen(true);
    } else {
      setIsCustomerDropdownOpen(false);
    }
  }, [customerSearchTerm]);
  const [selectedShipment, setSelectedShipment] = useState<InventoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [releaseSubmitting, setReleaseSubmitting] = useState(false);
  const [releaseErrors, setReleaseErrors] = useState<Record<string, string>>({});
  const [releaseForm, setReleaseForm] = useState({
    shipmentId: '',
    trackingNumber: '',
    requestedBy: '',
    requestedByPhone: '',
    warehouseLocation: 'المخزن الرئيسي - طرابلس',
    storageFeesAmount: 0,
    handlingFeesAmount: 0,
    paymentMethod: 'cash',
    paymentReference: '',
    notes: ''
  });
  const [stockBalance, setStockBalance] = useState<{ available: number; receivedQty: number; releasedQty: number } | null>(null);

  const [isStockMovementsOpen, setIsStockMovementsOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [loadingStockMovements, setLoadingStockMovements] = useState(false);

  const [activeTab, setActiveTab] = useState('shipments');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [formData, setFormData] = useState({
    trackingNumber: '',
    customerId: '',
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
    volume: 0,
    volumeOverride: 0,
    declaredValue: 0,
    shippingCost: 0,
    originLocation: '',
    destinationLocation: '',
    receivedDate: '',
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

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.pageSize.toString()
      });

      if (searchValue) {
        params.append('search', searchValue);
      }

      if (categoryFilter) {
        params.append('category', categoryFilter);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/sales/shipments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }

      const result = await response.json();
      setShipments(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || 0
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
      // لا يوجد API لحركات تتبع الشحنة بعد؛ سنعرض القائمة فارغة مؤقتاً
      setMovements([]);
    } catch (error) {
      console.error('Error loading shipment movements:', error);
      setMovements([]);
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', shipment?: InventoryItem) => {
    setModalMode(mode);
    setSelectedShipment(shipment || null);

    // Reset and fetch stock balance for this shipment (view-only info)
    setStockBalance(null);
    if (shipment) {
      salesAPI.getShipmentStockBalance(shipment.id)
        .then((data) => setStockBalance({
          available: data.available ?? 0,
          receivedQty: data.receivedQty ?? 0,
          releasedQty: data.releasedQty ?? 0,
        }))
        .catch(() => setStockBalance(null));
    }

    if (mode === 'create') {
      // Load customers when opening create modal
      loadCustomers();
      setFormData({
        trackingNumber: '',
        customerId: '',
        customerName: '',
        customerPhone: '',

        itemDescription: '',
        itemDescriptionEn: '',
        category: 'other',
        quantity: 1,
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        volume: 0,
        volumeOverride: 0,
        declaredValue: 0,
        shippingCost: 0,
        originLocation: '',
        destinationLocation: '',
        receivedDate: new Date().toISOString().slice(0,10),
        estimatedDelivery: '',
        notes: '',
        isFragile: false,
        requiresSpecialHandling: false,
        customsDeclaration: ''
      });
      setCustomerSearchTerm('');
    } else if (shipment) {
      // Load customers to allow switching customer on edit as well
      loadCustomers();
      setFormData({
        trackingNumber: shipment.trackingNumber,
        customerId: (shipment as any).customerId || '',
        customerName: shipment.customerName,

        customerPhone: shipment.customerPhone,
        itemDescription: shipment.itemDescription,
        itemDescriptionEn: shipment.itemDescriptionEn || '',
        category: shipment.category,
        quantity: shipment.quantity,
        weight: shipment.weight,
        dimensions: shipment.dimensions || { length: 0, width: 0, height: 0 },
        volume: shipment.volume || 0,
        volumeOverride: shipment.volumeOverride || 0,
        declaredValue: shipment.declaredValue,
        shippingCost: shipment.shippingCost,
        originLocation: shipment.originLocation,
        destinationLocation: shipment.destinationLocation,
        receivedDate: (shipment as any).receivedDate || '',
        estimatedDelivery: shipment.estimatedDelivery || '',
        notes: shipment.notes || '',
        isFragile: shipment.isFragile,
        requiresSpecialHandling: shipment.requiresSpecialHandling,
        customsDeclaration: shipment.customsDeclaration || ''
      });
      setCustomerSearchTerm(shipment.customerName || '');
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

  const openReleaseOrderModal = (shipment: InventoryItem) => {
    setSelectedShipment(shipment);
    setReleaseForm({
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      requestedBy: shipment.customerName || '',
      requestedByPhone: shipment.customerPhone || '',
      warehouseLocation: 'المخزن الرئيسي - طرابلس',
      storageFeesAmount: 0,
      handlingFeesAmount: 0,
      paymentMethod: 'cash',
      paymentReference: '',
      notes: ''
    });
    setReleaseErrors({});
    setIsReleaseOrderModalOpen(true);
  };

  const submitReleaseOrder = async () => {
    const errors: Record<string, string> = {};
    if (!releaseForm.shipmentId && !releaseForm.trackingNumber) {
      errors.trackingNumber = 'أدخل رقم تتبع الشحنة أو اختر الشحنة';
    }
    if (!releaseForm.requestedBy) {
      errors.requestedBy = 'يجب إدخال اسم طالب الصرف';
    }
    setReleaseErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setReleaseSubmitting(true);
      const payload = {
        shipmentId: releaseForm.shipmentId,
        trackingNumber: releaseForm.trackingNumber,
        requestedBy: releaseForm.requestedBy,
        requestedByPhone: releaseForm.requestedByPhone,
        warehouseLocation: releaseForm.warehouseLocation,
        storageFeesAmount: releaseForm.storageFeesAmount,
        handlingFeesAmount: releaseForm.handlingFeesAmount,
        paymentMethod: releaseForm.paymentMethod as 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'other' | undefined,
        paymentReference: releaseForm.paymentReference,
        notes: releaseForm.notes
      };
      await salesAPI.createWarehouseReleaseOrder(payload);
      setIsReleaseOrderModalOpen(false);
    } catch (e: any) {
      console.error('Create release order failed:', e?.response?.data || e.message);
      setReleaseErrors(prev => ({ ...prev, _general: e?.response?.data?.message || 'فشل إنشاء أمر الصرف' }));
    } finally {
      setReleaseSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsMovementModalOpen(false);
    setSelectedShipment(null);
    setFormErrors({});
  };

  const openStockMovementsModal = async (shipment?: InventoryItem) => {
    setSelectedShipment(shipment || null);
    setIsStockMovementsOpen(true);
    setLoadingStockMovements(true);
    try {
      if (shipment) {
        const res = await salesAPI.getShipmentStockMovements(shipment.id);
        setStockMovements(res.data || []);
      } else {
        setStockMovements([]);
      }
    } catch (err) {
      console.error('Error loading stock movements:', err);
      setStockMovements([]);
    } finally {
      setLoadingStockMovements(false);
    }
  };



  // Calculate volume from dimensions
  const calculateVolume = (length: number, width: number, height: number): number => {
    if (length > 0 && width > 0 && height > 0) {
      return length * width * height;
    }
    return 0;
  };

  // Handle dimension changes and auto-calculate volume
  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: number) => {
    const newDimensions = { ...formData.dimensions, [dimension]: value };
    const calculatedVolume = calculateVolume(newDimensions.length, newDimensions.width, newDimensions.height);

    setFormData(prev => ({
      ...prev,
      dimensions: newDimensions,
      volume: calculatedVolume,
      // Clear volume override if dimensions changed
      volumeOverride: 0
    }));
  };

  // Handle volume override
  const handleVolumeOverride = (value: number) => {
    setFormData(prev => ({
      ...prev,
      volumeOverride: value,
      volume: value > 0 ? value : calculateVolume(prev.dimensions.length, prev.dimensions.width, prev.dimensions.height)
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};


    if (!formData.customerId) {
      errors.customerId = 'يجب اختيار العميل من القائمة';
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

    if (!formData.receivedDate) {
      errors.receivedDate = 'يجب إدخال تاريخ الاستلام';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const shipmentData = {
        ...formData,
        length: formData.dimensions.length,
        width: formData.dimensions.width,
        height: formData.dimensions.height,
        volumeOverride: formData.volumeOverride > 0 ? formData.volumeOverride : null
      };

      const url = modalMode === 'edit' && selectedShipment
        ? `/api/sales/shipments/${selectedShipment.id}`
        : '/api/sales/shipments';

      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(shipmentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save shipment');
      }

      const result = await response.json();
      console.log('Shipment saved successfully:', result);

      closeModal();
      loadShipments();
    } catch (error) {
      console.error('Error saving shipment:', error);
      // You might want to show an error message to the user here
    } finally {
      setSubmitting(false);
    }
  };

  const handleMovementSubmit = async () => {
    try {
      setSubmitting(true);

      if (!selectedShipment) {
        console.error('لا توجد شحنة محددة');
        return;
      }

      // إرسال طلب تحديث حالة الشحنة
      await salesAPI.createShipmentMovement(selectedShipment.id, {
        type: movementData.type,
        newStatus: movementData.newStatus,
        location: movementData.location,
        notes: movementData.notes,
        handledBy: 'المستخدم' // يمكن تحسينه لاحقاً لإظهار اسم المستخدم الفعلي
      });

      console.log('✅ تم تحديث حالة الشحنة بنجاح');

      closeModal();
      loadShipments();
      loadMovements();
    } catch (error: any) {
      console.error('خطأ في تحديث حالة الشحنة:', error);
      // يمكن إضافة رسالة خطأ للمستخدم هنا
      alert(error?.response?.data?.message || 'حدث خطأ في تحديث حالة الشحنة');
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
      key: 'volume',
      title: 'الحجم',
      width: '100px',
      render: (value: number, item: InventoryItem) => {
        const finalVolume = item.volumeOverride || item.volume || 0;
        if (finalVolume === 0) return '-';
        return `${(finalVolume / 1000).toFixed(2)} لتر`;
      }
    },
    {
      key: 'declaredValue',
      title: 'القيمة المصرحة',
      width: '120px',
      render: (value: number) => `$${(isNaN(value) || !isFinite(value) ? 0 : value).toLocaleString('ar-LY')}`
    },
    {
      key: 'shippingCost',
      title: 'تكلفة الشحن',
      width: '120px',
      render: (value: number) => `${(isNaN(value) || !isFinite(value) ? 0 : value).toLocaleString('ar-LY')} د.ل`
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
              openReleaseOrderModal(record);
            }}
            className="text-indigo-600 hover:text-indigo-800"
            title="إنشاء أمر صرف لهذه الشحنة"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openStockMovementsModal(record);
            }}
            className="text-amber-600 hover:text-amber-800"
            title="حركات المخزون"
          >
            <BarChart3 className="h-4 w-4" />
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

  // Stock movements columns (ledger)
  const stockMovementColumns = [
    {
      key: 'createdAt',
      title: 'التاريخ والوقت',
      width: '160px',
      render: (value: string, item: any) => new Date((item && (item as any).date) || value).toLocaleString('ar-EG')
    },
    {
      key: 'direction',
      title: 'الاتجاه',
      width: '100px',
      render: (value: string) => value === 'in' ? 'وارد' : (value === 'out' ? 'صادر' : 'تسوية')
    },
    { key: 'quantity', title: 'الكمية', width: '100px', render: (v: number) => Number(v || 0).toLocaleString() },
    { key: 'warehouseLocation', title: 'الموقع/المخزن', width: '140px' },
    { key: 'referenceType', title: 'نوع المرجع', width: '140px' },
    { key: 'referenceId', title: 'المرجع', width: '120px' }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إدارة الشحنات</h1>
            <p className="text-sm sm:text-base text-gray-600">تتبع الشحنات من الصين إلى ليبيا</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse w-full sm:w-auto">
          <button
            onClick={() => openMovementModal()}
            className="btn-secondary flex items-center justify-center"
          >
            <TrendingUp className="h-5 w-5 ml-2" />
            تحديث الحالة
          </button>
          <button
            onClick={() => openModal('create')}
            className="btn-primary flex items-center justify-center"
          >
            <Plus className="h-5 w-5 ml-2" />
            شحنة جديدة
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="رقم التتبع"
            >
              <input
                type="text"
                value={formData.trackingNumber}
                className="form-input"
                disabled={true}
                placeholder="سيتم توليده تلقائياً عند الحفظ"
              />
            </FormField>

            <FormField
              label="اسم العميل"
              error={formErrors.customerId}
              required
            >
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomerSearchTerm(val);
                    setFormData(prev => ({ ...prev, customerId: '', customerName: '' }));
                  }}
                  onFocus={() => {
                    if (customerSearchTerm.length >= 2) setIsCustomerDropdownOpen(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsCustomerDropdownOpen(false), 150);
                  }}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  placeholder="ابحث باسم العميل..."
                />
                {isCustomerDropdownOpen && customers.length > 0 && modalMode !== 'view' && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow max-h-60 overflow-y-auto">
                    {customers.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        className="w-full text-right px-3 py-2 hover:bg-gray-50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            customerId: c.id,
                            customerName: c.name,
                            customerPhone: prev.customerPhone || c.phone || ''
                          }));
                          setCustomerSearchTerm(c.name);
                          setIsCustomerDropdownOpen(false);
                        }}
                      >
                        <div className="flex justify-between">
                          <span>{c.name}</span>
                          {c.phone && <span className="text-sm text-gray-500">{c.phone}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {modalMode === 'view' && stockBalance && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm">
                <div className="flex items-center gap-6">
                  <div className="text-green-800 font-medium">رصيد المخزون المتاح: <span className="font-bold">{stockBalance.available}</span></div>
                  <div className="text-green-700">وارد: {stockBalance.receivedQty}</div>
                  <div className="text-green-700">مصروف: {stockBalance.releasedQty}</div>
                </div>
              </div>
            )}

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
                  onChange={(e) => handleDimensionChange('length', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0)}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  min="0"
                  step="0.1"
                />
              </FormField>
            </div>

            {/* Volume Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                label="الحجم المحسوب (سم³)"
                description="يتم حسابه تلقائياً من الأبعاد"
              >
                <input
                  type="number"
                  value={formData.volume}
                  className="form-input bg-gray-50"
                  disabled
                  placeholder="0"
                />
              </FormField>

              <FormField
                label="الحجم اليدوي (سم³)"
                description="إدخال يدوي للحجم (اختياري)"
              >
                <input
                  type="number"
                  value={formData.volumeOverride}
                  onChange={(e) => handleVolumeOverride(parseFloat(e.target.value) || 0)}
                  className="form-input"
                  disabled={modalMode === 'view'}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </FormField>
            </div>

            {/* Volume Display */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-800 font-medium">الحجم النهائي:</span>
                <span className="text-blue-900 font-bold">
                  {(formData.volumeOverride > 0 ? formData.volumeOverride : formData.volume).toLocaleString()} سم³
                  {' '}
                  ({((formData.volumeOverride > 0 ? formData.volumeOverride : formData.volume) / 1000).toFixed(2)} لتر)
                </span>
              </div>
              {formData.volumeOverride > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  * تم استخدام الحجم اليدوي بدلاً من المحسوب
                </div>
              )}
            </div>
          </div>

          {/* Cost Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات التكلفة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <FormField label="تاريخ الاستلام" error={formErrors.receivedDate} required>
                <input
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, receivedDate: e.target.value }))}
                  className="form-input"
                  disabled={modalMode === 'view'}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-4 border-t">
              <button
                onClick={closeModal}
                className="btn-secondary w-full sm:w-auto"
                disabled={submitting}
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary w-full sm:w-auto"
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

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-4 border-t">
            <button
              onClick={closeModal}
              className="btn-secondary w-full sm:w-auto"
              disabled={submitting}
            >
              إلغاء
            </button>
            <button
              onClick={handleMovementSubmit}
              className="btn-primary w-full sm:w-auto"
              disabled={submitting}
            >
              {submitting ? 'جاري التحديث...' : 'تحديث الحالة'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stock Movements Modal */}
      <Modal
        isOpen={isStockMovementsOpen}
        onClose={() => setIsStockMovementsOpen(false)}
        title={`حركات مخزون الشحنة ${selectedShipment ? `(${selectedShipment.trackingNumber})` : ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {selectedShipment && (
            <div className="text-sm text-gray-700">
              <span className="font-medium">العميل:</span> {selectedShipment.customerName} —
              <span className="font-medium ml-2">الوصف:</span> {selectedShipment.itemDescription}
            </div>
          )}
          <DataTable
            columns={stockMovementColumns}
            data={stockMovements}
            loading={loadingStockMovements}
          />
        </div>
      </Modal>
      {/* Create Warehouse Release Order Modal */}
      <Modal
        isOpen={isReleaseOrderModalOpen}
        onClose={() => setIsReleaseOrderModalOpen(false)}
        title={`إنشاء أمر صرف من المخزن ${selectedShipment ? `(${selectedShipment.trackingNumber})` : ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {releaseErrors._general && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm">
              {releaseErrors._general}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="رقم التتبع">
              <input
                type="text"
                value={releaseForm.trackingNumber}
                onChange={(e) => setReleaseForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                className="form-input"
                disabled={!!releaseForm.shipmentId}
                placeholder="GH..."
              />
              {releaseErrors.trackingNumber && (
                <p className="text-red-500 text-xs mt-1">{releaseErrors.trackingNumber}</p>
              )}
            </FormField>

            <FormField label="طالب الصرف *">
              <input
                type="text"
                value={releaseForm.requestedBy}
                onChange={(e) => setReleaseForm(prev => ({ ...prev, requestedBy: e.target.value }))}
                className="form-input"
                placeholder="اسم طالب الصرف"
              />
              {releaseErrors.requestedBy && (
                <p className="text-red-500 text-xs mt-1">{releaseErrors.requestedBy}</p>
              )}
            </FormField>

            <FormField label="هاتف طالب الصرف">
              <input
                type="text"
                value={releaseForm.requestedByPhone}
                onChange={(e) => setReleaseForm(prev => ({ ...prev, requestedByPhone: e.target.value }))}
                className="form-input"
                placeholder="+2189..."
              />
            </FormField>

            <FormField label="موقع المخزن *">
              <select
                value={releaseForm.warehouseLocation}
                onChange={(e) => setReleaseForm(prev => ({ ...prev, warehouseLocation: e.target.value }))}
                className="form-select"
              >
                <option value="المخزن الرئيسي - طرابلس">المخزن الرئيسي - طرابلس</option>
              </select>
            </FormField>

            <FormField label="رسوم التخزين">
              <input
                type="number"
                value={releaseForm.storageFeesAmount}
                onChange={(e) => setReleaseForm(prev => ({ ...prev, storageFeesAmount: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </FormField>

            <FormField label="رسوم المناولة">
              <input
                type="number"
                value={releaseForm.handlingFeesAmount}
                onChange={(e) => setReleaseForm(prev => ({ ...prev, handlingFeesAmount: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </FormField>

            <FormField label="طريقة الدفع">
              <select
                value={releaseForm.paymentMethod}
                onChange={(e) => setReleaseForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="form-select"
              >
                <option value="cash">نقداً</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
                <option value="credit_card">بطاقة</option>
                <option value="other">أخرى</option>
              </select>
            </FormField>

            <FormField label="مرجع/إيصال الدفع">
              <input
                type="text"
                value={releaseForm.paymentReference}
                onChange={(e) => setReleaseForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                className="form-input"
                placeholder="رقم الإيصال"
              />
            </FormField>
          </div>

          <FormField label="ملاحظات">
            <textarea
              value={releaseForm.notes}
              onChange={(e) => setReleaseForm(prev => ({ ...prev, notes: e.target.value }))}
              className="form-textarea"
              rows={3}
              placeholder="ملاحظات إضافية..."
            />
          </FormField>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-4 border-t">
            <button
              onClick={() => setIsReleaseOrderModalOpen(false)}
              className="btn-secondary w-full sm:w-auto"
              disabled={releaseSubmitting}
            >
              إلغاء
            </button>
            <button
              onClick={submitReleaseOrder}
              className="btn-primary w-full sm:w-auto"
              disabled={releaseSubmitting}
            >
              {releaseSubmitting ? 'جاري الإنشاء...' : 'إنشاء أمر الصرف'}
            </button>
          </div>
        </div>
      </Modal>


    </div>
  );
};

export default InventoryManagement;

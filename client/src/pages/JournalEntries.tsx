import React, { useState, useEffect } from 'react';
import { Plus, FileText, Edit, Eye, CheckCircle } from 'lucide-react';
import { financialAPI } from '../services/api';
import DataTable from '../components/Financial/DataTable';
import SearchFilter from '../components/Financial/SearchFilter';
import Modal from '../components/Financial/Modal';
import FormField from '../components/Financial/FormField';
import { JournalEntry, Account } from '../types/financial';

const JournalEntries: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    type: 'manual',
    currency: 'LYD',
    lines: [
      { accountId: '', description: '', debit: 0, credit: 0 },
      { accountId: '', description: '', debit: 0, credit: 0 }
    ]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJournalEntries();
    loadAccounts();
  }, [pagination.current, searchValue, statusFilter, typeFilter]);

  const loadJournalEntries = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchValue || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined
      };
      
      const response = await financialAPI.getJournalEntries(params);
      setJournalEntries(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await financialAPI.getAccounts();
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setSearchValue('');
    setStatusFilter('');
    setTypeFilter('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const openModal = (mode: 'create' | 'edit' | 'view', entry?: JournalEntry) => {
    setModalMode(mode);
    setSelectedEntry(entry || null);
    
    if (mode === 'create') {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        type: 'manual',
        currency: 'LYD',
        lines: [
          { accountId: '', description: '', debit: 0, credit: 0 },
          { accountId: '', description: '', debit: 0, credit: 0 }
        ]
      });
    } else if (entry) {
      setFormData({
        date: entry.date,
        description: entry.description,
        reference: entry.reference || '',
        type: entry.type,
        currency: entry.currency,
        lines: entry.lines.map(line => ({
          accountId: line.accountId,
          description: line.description || '',
          debit: line.debit,
          credit: line.credit
        }))
      });
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
    setFormErrors({});
  };

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', description: '', debit: 0, credit: 0 }]
    }));
  };

  const removeLine = (index: number) => {
    if (formData.lines.length > 2) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLine = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.date) {
      errors.date = 'التاريخ مطلوب';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'الوصف مطلوب';
    }
    
    // Validate lines
    const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit.toString()) || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit.toString()) || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      errors.balance = 'إجمالي المدين يجب أن يساوي إجمالي الدائن';
    }
    
    if (totalDebit === 0 && totalCredit === 0) {
      errors.amount = 'يجب إدخال مبالغ في القيود';
    }
    
    // Validate each line
    formData.lines.forEach((line, index) => {
      if (!line.accountId) {
        errors[`line_${index}_account`] = 'الحساب مطلوب';
      }
      if (!line.debit && !line.credit) {
        errors[`line_${index}_amount`] = 'المبلغ مطلوب';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
        lines: formData.lines.map(line => ({
          ...line,
          debit: parseFloat(line.debit.toString()) || 0,
          credit: parseFloat(line.credit.toString()) || 0
        }))
      };
      
      if (modalMode === 'create') {
        await financialAPI.createJournalEntry(submitData);
      } else if (modalMode === 'edit' && selectedEntry) {
        await financialAPI.updateJournalEntry(selectedEntry.id, submitData);
      }
      
      closeModal();
      loadJournalEntries();
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (entry: JournalEntry) => {
    if (!confirm(`هل أنت متأكد من اعتماد القيد "${entry.entryNumber}"؟`)) return;
    
    try {
      await financialAPI.approveJournalEntry(entry.id);
      loadJournalEntries();
    } catch (error) {
      console.error('Error approving journal entry:', error);
      alert('حدث خطأ أثناء اعتماد القيد');
    }
  };

  const columns = [
    {
      key: 'entryNumber',
      title: 'رقم القيد',
      width: '120px'
    },
    {
      key: 'date',
      title: 'التاريخ',
      width: '120px',
      render: (value: string) => new Date(value).toLocaleDateString('ar-LY')
    },
    {
      key: 'description',
      title: 'الوصف',
      render: (value: string, record: JournalEntry) => (
        <div>
          <div className="font-medium">{value}</div>
          {record.reference && (
            <div className="text-sm text-gray-500">مرجع: {record.reference}</div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      title: 'النوع',
      width: '100px',
      render: (value: string) => value === 'manual' ? 'يدوي' : 'تلقائي'
    },
    {
      key: 'totalDebit',
      title: 'إجمالي المدين',
      width: '120px',
      align: 'left' as const,
      render: (value: number, record: JournalEntry) => (
        <div className="text-left">
          <span className="text-green-600">
            {new Intl.NumberFormat('ar-LY').format(value)}
          </span>
          <span className="text-gray-500 text-sm mr-1">{record.currency}</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'الحالة',
      width: '100px',
      render: (value: string) => {
        const statusLabels = {
          draft: { label: 'مسودة', color: 'bg-yellow-100 text-yellow-800' },
          approved: { label: 'معتمد', color: 'bg-green-100 text-green-800' },
          cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800' }
        };
        const status = statusLabels[value as keyof typeof statusLabels];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      width: '150px',
      render: (_: any, record: JournalEntry) => (
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('view', record);
            }}
            className="text-blue-600 hover:text-blue-800"
            title="عرض"
          >
            <Eye className="h-4 w-4" />
          </button>
          {record.status === 'draft' && (
            <>
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
                  handleApprove(record);
                }}
                className="text-purple-600 hover:text-purple-800"
                title="اعتماد"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const statusOptions = [
    { value: 'draft', label: 'مسودة' },
    { value: 'approved', label: 'معتمد' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  const typeOptions = [
    { value: 'manual', label: 'يدوي' },
    { value: 'automatic', label: 'تلقائي' }
  ];

  const accountOptions = accounts.map(acc => ({
    value: acc.id,
    label: `${acc.code} - ${acc.name}`
  }));

  const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit.toString()) || 0), 0);
  const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit.toString()) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-8 w-8 text-green-600 ml-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">قيود اليومية</h1>
            <p className="text-gray-600">إدارة القيود المحاسبية</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 ml-2" />
          قيد جديد
        </button>
      </div>

      {/* Search and Filters */}
      <SearchFilter
        searchValue={searchValue}
        onSearchChange={handleSearch}
        filters={[
          {
            key: 'status',
            label: 'الحالة',
            value: statusFilter,
            options: statusOptions,
            onChange: handleStatusFilter
          },
          {
            key: 'type',
            label: 'النوع',
            value: typeFilter,
            options: typeOptions,
            onChange: handleTypeFilter
          }
        ]}
        onClearFilters={clearFilters}
        placeholder="البحث في القيود..."
      />

      {/* Journal Entries Table */}
      <DataTable
        columns={columns}
        data={journalEntries}
        loading={loading}
        pagination={{
          current: pagination.current,
          total: pagination.total,
          pageSize: pagination.pageSize,
          onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
        }}
        emptyText="لا توجد قيود"
      />

      {/* Journal Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'إضافة قيد جديد' :
          modalMode === 'edit' ? 'تعديل القيد' : 'عرض القيد'
        }
        size="xl"
        footer={
          modalMode !== 'view' ? (
            <>
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
                disabled={submitting || !isBalanced}
              >
                {submitting ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </>
          ) : (
            <button onClick={closeModal} className="btn-secondary">
              إغلاق
            </button>
          )
        }
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="التاريخ"
              name="date"
              type="date"
              value={formData.date}
              onChange={(value) => setFormData(prev => ({ ...prev, date: value as string }))}
              required
              error={formErrors.date}
              disabled={modalMode === 'view'}
            />
            
            <FormField
              label="النوع"
              name="type"
              type="select"
              value={formData.type}
              onChange={(value) => setFormData(prev => ({ ...prev, type: value as string }))}
              options={typeOptions}
              disabled={modalMode === 'view'}
            />
            
            <FormField
              label="العملة"
              name="currency"
              type="select"
              value={formData.currency}
              onChange={(value) => setFormData(prev => ({ ...prev, currency: value as string }))}
              options={[
                { value: 'LYD', label: 'دينار ليبي' },
                { value: 'USD', label: 'دولار أمريكي' }
              ]}
              disabled={modalMode === 'view'}
            />
          </div>

          <FormField
            label="الوصف"
            name="description"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value as string }))}
            required
            error={formErrors.description}
            disabled={modalMode === 'view'}
          />

          <FormField
            label="المرجع"
            name="reference"
            value={formData.reference}
            onChange={(value) => setFormData(prev => ({ ...prev, reference: value as string }))}
            disabled={modalMode === 'view'}
          />

          {/* Journal Entry Lines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">تفاصيل القيد</h3>
              {modalMode !== 'view' && (
                <button
                  onClick={addLine}
                  className="btn-secondary text-sm"
                >
                  إضافة سطر
                </button>
              )}
            </div>

            <div className="space-y-3">
              {formData.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-4">
                    <FormField
                      label="الحساب"
                      name={`line_${index}_account`}
                      type="select"
                      value={line.accountId}
                      onChange={(value) => updateLine(index, 'accountId', value)}
                      options={accountOptions}
                      placeholder="اختر الحساب"
                      error={formErrors[`line_${index}_account`]}
                      disabled={modalMode === 'view'}
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <FormField
                      label="الوصف"
                      name={`line_${index}_description`}
                      value={line.description}
                      onChange={(value) => updateLine(index, 'description', value)}
                      disabled={modalMode === 'view'}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <FormField
                      label="مدين"
                      name={`line_${index}_debit`}
                      type="number"
                      value={line.debit}
                      onChange={(value) => updateLine(index, 'debit', value)}
                      min={0}
                      step={0.01}
                      disabled={modalMode === 'view'}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <FormField
                      label="دائن"
                      name={`line_${index}_credit`}
                      type="number"
                      value={line.credit}
                      onChange={(value) => updateLine(index, 'credit', value)}
                      min={0}
                      step={0.01}
                      disabled={modalMode === 'view'}
                    />
                  </div>
                  
                  {modalMode !== 'view' && formData.lines.length > 2 && (
                    <div className="col-span-1">
                      <button
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="حذف السطر"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">إجمالي المدين: </span>
                  <span className="font-semibold text-green-600">
                    {new Intl.NumberFormat('ar-LY').format(totalDebit)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">إجمالي الدائن: </span>
                  <span className="font-semibold text-blue-600">
                    {new Intl.NumberFormat('ar-LY').format(totalCredit)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الفرق: </span>
                  <span className={`font-semibold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('ar-LY').format(Math.abs(totalDebit - totalCredit))}
                  </span>
                </div>
              </div>
              
              {formErrors.balance && (
                <p className="text-red-600 text-sm mt-2">{formErrors.balance}</p>
              )}
              
              {formErrors.amount && (
                <p className="text-red-600 text-sm mt-2">{formErrors.amount}</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JournalEntries;

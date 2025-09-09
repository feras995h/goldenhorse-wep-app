import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, CheckCircle, Trash2, X, Save, Minus } from 'lucide-react';
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
      {
        id: '',
        accountId: '',
        accountCode: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
        exchangeRate: 1,
        balance: 0,
        totalDebit: 0,
        totalCredit: 0
      },
      {
        id: '',
        accountId: '',
        accountCode: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
        exchangeRate: 1,
        balance: 0,
        totalDebit: 0,
        totalCredit: 0
      }
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
      // Ensure each entry has details array
      const entriesWithDetails = response.data.map((entry: any) => ({
        ...entry,
        details: entry.details || []
      }));
      setJournalEntries(entriesWithDetails);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      console.error('Error loading journal entries:', error);
      // Set empty array to prevent undefined errors
      setJournalEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await financialAPI.getAccounts();
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
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
      clearForm();
    } else if (entry) {
      setFormData({
        date: entry.date,
        description: entry.description,
        reference: entry.reference || '',
        type: 'manual',
        currency: 'LYD',
                 lines: (entry as any).details ? (entry as any).details.map((detail: any) => ({
          id: detail.id || '',
          accountId: detail.accountId,
          accountCode: detail.accountCode || '',
          accountName: detail.accountName || '',
          description: detail.description || '',
          debit: detail.debit || 0,
          credit: detail.credit || 0,
          exchangeRate: detail.exchangeRate || 1,
          balance: detail.balance || 0,
          totalDebit: detail.totalDebit || 0,
          totalCredit: detail.totalCredit || 0
        })) : [
          {
            id: '',
            accountId: '',
            accountCode: '',
            accountName: '',
            description: '',
            debit: 0,
            credit: 0,
            exchangeRate: 1,
            balance: 0,
            totalDebit: 0,
            totalCredit: 0
          },
          {
            id: '',
            accountId: '',
            accountCode: '',
            accountName: '',
            description: '',
            debit: 0,
            credit: 0,
            exchangeRate: 1,
            balance: 0,
            totalDebit: 0,
            totalCredit: 0
          }
        ]
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
      lines: [...(prev.lines || []), {
        id: '',
        accountId: '',
        accountCode: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
        exchangeRate: 1,
        balance: 0,
        totalDebit: 0,
        totalCredit: 0
      }]
    }));
  };

  // Function to remove line (currently not used but kept for future use)
  // const removeLine = (index: number) => {
  //   if ((formData.lines || []).length > 2) {
  //     setFormData(prev => ({
  //       ...prev,
  //       lines: (prev.lines || []).filter((_, i) => i !== index)
  //     }));
  //   }
  // };

  const updateLine = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedLines = [...(prev.lines || [])];
      updatedLines[index] = { ...updatedLines[index], [field]: value };
      
      // Calculate totals based on debit/credit and exchange rate
      if (field === 'debit' || field === 'credit' || field === 'exchangeRate') {
        const line = updatedLines[index];
        const debit = parseFloat(line.debit?.toString() || '0') || 0;
        const credit = parseFloat(line.credit?.toString() || '0') || 0;
        const exchangeRate = parseFloat(line.exchangeRate?.toString() || '1') || 1;
        
        updatedLines[index] = {
          ...line,
          totalDebit: debit * exchangeRate,
          totalCredit: credit * exchangeRate
        };
      }
      
      // Check if second line (index 1) is filled and last line is empty, then add new line
      if (updatedLines.length >= 2) {
        const secondLine = updatedLines[1];
        const lastLine = updatedLines[updatedLines.length - 1];
        
        // Function to check if a line is filled
        const isLineFilled = (line: any) => {
          return line.accountId && 
                 (line.description || (line.debit && line.debit > 0) || (line.credit && line.credit > 0));
        };
        
        // Function to check if a line is empty
        const isLineEmpty = (line: any) => {
          return !line.accountId && 
                 !line.description && 
                 (!line.debit || line.debit === 0) && 
                 (!line.credit || line.credit === 0);
        };
        
        // If second line is filled and last line is empty, add a new line
        if (isLineFilled(secondLine) && isLineEmpty(lastLine)) {
          updatedLines.push({
            id: '',
            accountId: '',
            accountCode: '',
            accountName: '',
            description: '',
            debit: 0,
            credit: 0,
            exchangeRate: 1,
            balance: 0,
            totalDebit: 0,
            totalCredit: 0
          });
        }
      }
      
      return { ...prev, lines: updatedLines };
    });
  };

  // Function to check if a line is empty
  const isLineEmpty = (line: any) => {
    return !line.accountId && 
           !line.description && 
           (!line.debit || line.debit === 0) && 
           (!line.credit || line.credit === 0);
  };

  // Function to remove empty lines before saving
  const removeEmptyLines = (lines: any[]) => {
    return lines.filter(line => !isLineEmpty(line));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.date || (formData.date || '').toString().trim() === '') {
      errors.date = 'التاريخ مطلوب';
    }
    
    if (!(formData.description || '').trim()) {
      errors.description = 'البيان مطلوب';
    }
    
    // Remove empty lines before validation
    const filteredLines = removeEmptyLines(formData.lines || []);
    
    // Validate lines
      const totalDebit = filteredLines.reduce((sum, line) => sum + (parseFloat(line.debit?.toString() || '0') || 0), 0);
  const totalCredit = filteredLines.reduce((sum, line) => sum + (parseFloat(line.credit?.toString() || '0') || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      errors.balance = 'إجمالي المدين يجب أن يساوي إجمالي الدائن';
    }
    
    if (totalDebit === 0 && totalCredit === 0) {
      errors.amount = 'يجب إدخال مبالغ في القيود';
    }
    
    // Validate each line
    filteredLines.forEach((line, index) => {
      if (!line.accountId) {
        errors[`line_${index}_account`] = 'الحساب مطلوب';
      }
      if ((!line.debit || line.debit === 0) && (!line.credit || line.credit === 0)) {
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
      
      // Remove empty lines before submitting
      const filteredLines = removeEmptyLines(formData.lines || []);
      
      const submitData = {
        ...formData,
        lines: filteredLines.map(line => ({
          ...line,
          debit: parseFloat(line.debit?.toString() || '0') || 0,
          credit: parseFloat(line.credit?.toString() || '0') || 0
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
      title: 'البيان',
      render: (value: string, record: JournalEntry) => (
        <div>
          <div className="font-medium">{value}</div>
          {record.reference && (
            <div className="text-sm text-gray-500">ملاحظات: {record.reference}</div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      title: 'النوع',
      width: '100px',
      render: () => 'يدوي'
    },
    {
      key: 'totalDebit',
      title: 'إجمالي المدين',
      width: '120px',
      align: 'left' as const,
      render: (value: number) => (
        <div className="text-left">
          <span className="text-green-600">
            {new Intl.NumberFormat('ar-LY').format(value)}
          </span>
          <span className="text-gray-500 text-sm mr-1">د.ل</span>
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
          posted: { label: 'معتمد', color: 'bg-green-100 text-green-800' },
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

  // Status options (currently not used but kept for future use)
  // const statusOptions = [
  //   { value: 'draft', label: 'مسودة' },
  //   { value: 'posted', label: 'معتمد' },
  //   { value: 'cancelled', label: 'ملغي' }
  // ];

  const clearForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      type: 'manual',
      currency: 'LYD',
      lines: [
        {
          id: '',
          accountId: '',
          accountCode: '',
          accountName: '',
          description: '',
          debit: 0,
          credit: 0,
          exchangeRate: 1,
          balance: 0,
          totalDebit: 0,
          totalCredit: 0
        },
        {
          id: '',
          accountId: '',
          accountCode: '',
          accountName: '',
          description: '',
          debit: 0,
          credit: 0,
          exchangeRate: 1,
          balance: 0,
          totalDebit: 0,
          totalCredit: 0
        }
      ]
    });
    setFormErrors({});
  };

  const getTotalDebit = () => {
    return formData.lines.reduce((sum, line) => sum + line.totalDebit, 0);
  };

  const getTotalCredit = () => {
    return formData.lines.reduce((sum, line) => sum + line.totalCredit, 0);
  };

  const isBalanced = Math.abs(getTotalDebit() - getTotalCredit()) < 0.01;

  const typeOptions = [
    { value: 'manual', label: 'يدوي' },
    { value: 'system', label: 'نظام' }
  ];

  // Filtered account options (currently not used but kept for future use)
  // const filteredAccountOptions = accounts.map(account => ({
  //   value: account.id,
  //   label: `${account.code} - ${account.name}`
  // }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">قيود اليومية</h1>
          <p className="text-gray-600">إدارة القيود المحاسبية واليومية</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة قيد جديد
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
            options: [
              { value: '', label: 'جميع الحالات' },
              { value: 'draft', label: 'مسودة' },
              { value: 'posted', label: 'معتمد' },
              { value: 'cancelled', label: 'ملغي' }
            ],
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
            <div className="flex justify-between items-center">
                          <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={clearForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
                disabled={submitting}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                مسح الحقول
              </button>
              <button
                onClick={() => {
                  const cleanedLines = removeEmptyLines(formData.lines || []);
                  setFormData(prev => ({ ...prev, lines: cleanedLines }));
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
                disabled={submitting}
              >
                <Minus className="h-4 w-4 ml-2" />
                تنظيف الأسطر الفارغة
              </button>
              <button
                onClick={addLine}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
                disabled={submitting}
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة سطر جديد
              </button>
            </div>
            <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={closeModal}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
                  disabled={submitting}
                >
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500 disabled:opacity-50"
                  disabled={submitting || !isBalanced}
                >
                  <Save className="h-4 w-4 ml-2" />
                  {submitting ? 'جاري الحفظ...' : 'حفظ القيد'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={closeModal} className="btn-secondary">
              إغلاق
            </button>
          )
        }
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="التاريخ"
              name="date"
              type="date"
              value={formData.date || new Date().toISOString().split('T')[0]}
              onChange={(value) => setFormData(prev => ({ ...prev, date: value as string }))}
              required
              error={formErrors.date}
              disabled={modalMode === 'view'}
            />
            
            <FormField
              label="المرجع"
              name="reference"
              type="text"
              value={formData.reference || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, reference: value as string }))}
              placeholder="رقم المرجع أو الوثيقة"
              disabled={modalMode === 'view'}
            />
          </div>

          <FormField
            label="البيان"
            name="description"
            type="textarea"
            value={formData.description || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value as string }))}
            required
            error={formErrors.description}
            placeholder="وصف تفصيلي للقيد"
            disabled={modalMode === 'view'}
          />

          {/* Journal Lines Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">تفاصيل القيد</h3>
                <p className="text-sm text-gray-600 mt-1">
                  سيتم إضافة سطر جديد تلقائياً عند تعبئة السطر الثاني، والأسطر الفارغة ستظهر باللون الأصفر
                </p>
              </div>
              {formErrors.lines && (
                <span className="text-sm text-red-600">{formErrors.lines}</span>
              )}
            </div>
            
            {/* Table Header */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-700">
                <div className="col-span-2">رقم الحساب</div>
                <div className="col-span-2">الحساب</div>
                <div className="col-span-2">البيان</div>
                <div className="col-span-1">مدين</div>
                <div className="col-span-1">دائن</div>
                <div className="col-span-1">المعدل</div>
                <div className="col-span-1">الرصيد</div>
                <div className="col-span-1">إجمالي مدين</div>
                <div className="col-span-1">إجمالي دائن</div>
              </div>
            </div>

            {/* Table Rows */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(formData.lines || []).map((line, index) => (
                <div key={line.id || index} className={`border border-gray-200 rounded-lg p-4 ${isLineEmpty(line) ? 'bg-yellow-50' : 'bg-white'}`}>
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* Account Code */}
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={line.accountCode || ''}
                        onChange={(e) => {
                          const account = accounts.find(acc => acc.code === e.target.value);
                          if (account) {
                            updateLine(index, 'accountId', account.id);
                            updateLine(index, 'accountCode', account.code);
                            updateLine(index, 'accountName', account.name);
                          }
                          updateLine(index, 'accountCode', e.target.value);
                        }}
                        placeholder="رقم الحساب"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                        disabled={modalMode === 'view'}
                      />
                    </div>

                    {/* Account Name */}
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={line.accountName || ''}
                        onChange={(e) => {
                          const account = accounts.find(acc => acc.name.includes(e.target.value));
                          if (account) {
                            updateLine(index, 'accountId', account.id);
                            updateLine(index, 'accountCode', account.code);
                            updateLine(index, 'accountName', account.name);
                          }
                          updateLine(index, 'accountName', e.target.value);
                        }}
                        placeholder="اسم الحساب"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                        disabled={modalMode === 'view'}
                      />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={line.description || ''}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="بيان السطر"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm"
                        disabled={modalMode === 'view'}
                      />
                    </div>

                    {/* Debit */}
                    <div className="col-span-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debit || ''}
                        onChange={(e) => {
                          const debitValue = parseFloat(e.target.value) || 0;
                          updateLine(index, 'debit', debitValue);
                          // Clear credit if debit is entered
                          if (debitValue > 0) {
                            updateLine(index, 'credit', 0);
                          }
                        }}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm text-left"
                        disabled={modalMode === 'view'}
                      />
                    </div>

                    {/* Credit */}
                    <div className="col-span-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.credit || ''}
                        onChange={(e) => {
                          const creditValue = parseFloat(e.target.value) || 0;
                          updateLine(index, 'credit', creditValue);
                          // Clear debit if credit is entered
                          if (creditValue > 0) {
                            updateLine(index, 'debit', 0);
                          }
                        }}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm text-left"
                        disabled={modalMode === 'view'}
                      />
                    </div>

                    {/* Exchange Rate */}
                    <div className="col-span-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.exchangeRate || 1}
                        onChange={(e) => updateLine(index, 'exchangeRate', e.target.value)}
                        placeholder="1.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 text-sm text-left"
                        disabled={modalMode === 'view'}
                      />
                    </div>

                    {/* Balance */}
                    <div className="col-span-1">
                      <span className="text-sm text-gray-600">
                        {line.balance?.toLocaleString() || '0'}
                      </span>
                    </div>

                    {/* Total Debit */}
                    <div className="col-span-1">
                      <span className="text-sm text-green-600 font-medium">
                        {line.totalDebit?.toLocaleString() || '0'}
                      </span>
                    </div>

                    {/* Total Credit */}
                    <div className="col-span-1">
                      <span className="text-sm text-blue-600 font-medium">
                        {line.totalCredit?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-gray-600">إجمالي المدين: </span>
                  <span className="font-semibold text-green-600">
                    {new Intl.NumberFormat('ar-LY').format(getTotalDebit())}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">إجمالي الدائن: </span>
                  <span className="font-semibold text-blue-600">
                    {new Intl.NumberFormat('ar-LY').format(getTotalCredit())}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الفرق: </span>
                  <span className={`font-semibold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('ar-LY').format(Math.abs(getTotalDebit() - getTotalCredit()))}
                  </span>
                </div>
              </div>
              {formErrors.balance && (
                <div className="mt-2 text-center">
                  <span className="text-sm text-red-600">{formErrors.balance}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JournalEntries;

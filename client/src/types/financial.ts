// Financial System Types and Interfaces

// Base types
export type Currency = 'LYD' | 'USD' | 'EUR' | 'CNY';
export type PaymentMethod = 'cash' | 'bank' | 'bank_transfer' | 'check' | 'card' | 'credit_card';
export type DocumentStatus = 'draft' | 'approved' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue';

// Chart of Accounts
export interface Account {
  id: string;
  code: string; // رقم الحساب - فريد ويمكن أن يكون هرمي أو تسلسلي
  name: string; // اسم الحساب
  nameEn?: string; // الاسم بالإنجليزية
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'; // التصنيف
  accountType: 'main' | 'sub'; // نوع الحساب: رئيسي أو فرعي
  level: number; // المستوى - يحدد عمق الحساب في الشجرة
  parentId?: string; // الحساب الأب
  parentCode?: string; // رقم الحساب الأب
  parentName?: string; // اسم الحساب الأب
  isActive: boolean; // الحالة: نشط / غير نشط
  balance: number; // الرصيد الحالي
  currency: Currency; // العملة
  nature: 'debit' | 'credit'; // طبيعة الحساب المالية: مدين أو دائن
  description?: string; // الوصف / الملاحظات
  notes?: string; // ملاحظات إضافية
  isSystemAccount?: boolean; // حساب نظام أساسي
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// الحسابات الأساسية الافتراضية
export const DEFAULT_ACCOUNTS = [
  {
    code: '1',
    name: 'الأصول',
    nameEn: 'Assets',
    type: 'asset' as const,
    accountType: 'main' as const,
    level: 1,
    isActive: true,
    balance: 0,
    currency: 'LYD' as Currency,
    nature: 'debit' as const,
    description: 'حساب الأصول الأساسي - يشمل جميع الأصول المملوكة للشركة',
    notes: 'حساب نظام أساسي - لا يمكن حذفه أو تعديله',
    isSystemAccount: true
  },
  {
    code: '2',
    name: 'المصروفات',
    nameEn: 'Expenses',
    type: 'expense' as const,
    accountType: 'main' as const,
    level: 1,
    isActive: true,
    balance: 0,
    currency: 'LYD' as Currency,
    nature: 'debit' as const,
    description: 'حساب المصروفات الأساسي - يشمل جميع المصروفات التشغيلية',
    notes: 'حساب نظام أساسي - لا يمكن حذفه أو تعديله',
    isSystemAccount: true
  },
  {
    code: '3',
    name: 'الالتزامات',
    nameEn: 'Liabilities',
    type: 'liability' as const,
    accountType: 'main' as const,
    level: 1,
    isActive: true,
    balance: 0,
    currency: 'LYD' as Currency,
    nature: 'credit' as const,
    description: 'حساب الالتزامات الأساسي - يشمل جميع الديون والالتزامات',
    notes: 'حساب نظام أساسي - لا يمكن حذفه أو تعديله',
    isSystemAccount: true
  },
  {
    code: '4',
    name: 'حقوق الملكية',
    nameEn: 'Equity',
    type: 'equity' as const,
    accountType: 'main' as const,
    level: 1,
    isActive: true,
    balance: 0,
    currency: 'LYD' as Currency,
    nature: 'credit' as const,
    description: 'حساب حقوق الملكية الأساسي - يشمل رأس المال والأرباح المحتجزة',
    notes: 'حساب نظام أساسي - لا يمكن حذفه أو تعديله',
    isSystemAccount: true
  },
  {
    code: '5',
    name: 'الإيرادات',
    nameEn: 'Revenue',
    type: 'revenue' as const,
    accountType: 'main' as const,
    level: 1,
    isActive: true,
    balance: 0,
    currency: 'LYD' as Currency,
    nature: 'credit' as const,
    description: 'حساب الإيرادات الأساسي - يشمل جميع الإيرادات التشغيلية',
    notes: 'حساب نظام أساسي - لا يمكن حذفه أو تعديله',
    isSystemAccount: true
  }
];

// Journal Entries
export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  status: DocumentStatus;
  type: 'manual' | 'automatic';
  sourceDocument?: string;
  sourceId?: string;
  totalDebit: number;
  totalCredit: number;
  currency: Currency;
  exchangeRate?: number;
  attachments: string[];
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
  currency?: Currency;
  exchangeRate?: number;
  // Optional UI/derived fields
  balance?: number;
  totalDebit?: number;
  totalCredit?: number;
  notes?: string;
}

// Customers
export interface Customer {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: 'individual' | 'company';
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  creditLimit: number;
  paymentTerms: number; // days
  currency: Currency;
  isActive: boolean;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

// Invoices
export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'shipping' | 'purchase' | 'service';
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: PaymentStatus;
  currency: Currency;
  exchangeRate?: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentTerms: number;
  notes?: string;
  shipmentId?: string;
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
  payments: InvoicePayment[];
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  totalAmount: number;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  receiptId?: string;
  createdBy: string;
  createdAt: string;
}

// Treasury Operations
export interface Receipt {
  id: string;
  receiptNumber: string;
  date: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  currency: Currency;
  exchangeRate?: number;
  method: PaymentMethod;
  bankAccount?: string;
  checkNumber?: string;
  checkDate?: string;
  reference?: string;
  description: string;
  status: DocumentStatus;
  invoiceId?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  date: string;
  payeeId?: string;
  payeeName: string;
  amount: number;
  currency: Currency;
  exchangeRate?: number;
  method: PaymentMethod;
  bankAccount?: string;
  checkNumber?: string;
  checkDate?: string;
  reference?: string;
  description: string;
  status: DocumentStatus;
  category: 'supplier' | 'employee' | 'expense' | 'other';
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransfer {
  id: string;
  transferNumber: string;
  date: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: Currency;
  exchangeRate?: number;
  description: string;
  reference?: string;
  status: DocumentStatus;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Treasury Transactions (Unified)
export interface TreasuryTransaction {
  id: string;
  transactionNumber: string;
  type: 'receipt' | 'payment' | 'transfer';
  date: string;
  amount: number;
  currency: Currency;
  exchangeRate?: number;
  accountId: string;
  accountName: string;
  customerId?: string;
  customerName?: string;
  description: string;
  reference?: string;
  paymentMethod: 'cash' | 'check' | 'transfer' | 'card';
  checkNumber?: string;
  checkDate?: string;
  bankName?: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Employees and Payroll
export interface Employee {
  id: string;
  employeeNumber: string;
  code?: string;

  name: string;
  nameEn?: string;
  position: string;
  department: string;
  branch: string;
  hireDate: string;
  salary: number;
  currency: Currency;
  bankAccount?: string;
  phone?: string;
  email?: string;
  address?: string;
  nationalId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // New fields for automatic account creation
  salaryAccountId?: string;
  advanceAccountId?: string;
  custodyAccountId?: string;
  currentBalance?: number; // For requirement #9
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM format
  basicSalary: number;
  allowances: number;
  overtime: number;
  deductions: number;
  advances: number;
  bonuses?: number;
  netSalary: number;
  currency: Currency;
  status: DocumentStatus;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  remarks?: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  amount: number;
  currency: Currency;
  reason: string;
  status: DocumentStatus;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  approvedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deductions: AdvanceDeduction[];
}

export interface AdvanceDeduction {
  id: string;
  month: string; // YYYY-MM format
  amount: number;
  payrollEntryId?: string;
  createdAt: string;
}

// Fixed Assets
export interface FixedAsset {
  id: string;
  assetNumber: string;
  name: string;
  nameEn?: string;
  category: string;
  branch: string;
  purchaseDate: string;
  purchasePrice: number;
  currency: Currency;
  depreciationMethod: 'straight_line' | 'declining_balance';
  usefulLife: number; // years
  salvageValue: number;
  currentValue: number;
  accumulatedDepreciation: number;
  status: 'active' | 'disposed' | 'scrapped';
  location?: string;
  serialNumber?: string;
  supplier?: string;
  warrantyExpiry?: string;
  notes?: string;
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  depreciationEntries: DepreciationEntry[];
}

export interface DepreciationEntry {
  id: string;
  date: string;
  amount: number;
  accumulatedAmount: number;
  remainingValue: number;
  journalEntryId?: string;
  createdAt: string;
}

// Financial Reports
export interface TrialBalanceEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface IncomeStatementEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  type: 'revenue' | 'expense';
}

export interface BalanceSheetEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  type: 'asset' | 'liability' | 'equity';
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  currency: Currency;
  asOfDate: string;

  // New fields for enhanced dashboard
  dailyRevenue?: number;
  monthlyRevenue?: number;
  dailyExpenses?: number;
  monthlyExpenses?: number;
  bankBalance?: number;
  dailyTransfersIn?: number;
  dailyTransfersOut?: number;
}

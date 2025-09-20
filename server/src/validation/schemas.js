import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  uuid: z.string().uuid('معرف غير صحيح'),
  
  pagination: z.object({
    page: z.coerce.number().int().min(1, 'رقم الصفحة يجب أن يكون أكبر من 0').optional(),
    limit: z.coerce.number().int().min(1, 'الحد الأدنى يجب أن يكون 1').max(100, 'الحد الأقصى 100').optional(),
  }),
  
  dateRange: z.object({
    dateFrom: z.string().datetime('تاريخ البداية غير صحيح').optional(),
    dateTo: z.string().datetime('تاريخ النهاية غير صحيح').optional(),
  }),
  
  currency: z.enum(['LYD', 'USD', 'EUR', 'CNY'], {
    errorMap: () => ({ message: 'العملة غير مدعومة' })
  }),
  
  amount: z.coerce.number().positive('المبلغ يجب أن يكون موجب').max(999999999999.99, 'المبلغ كبير جداً'),
  
  email: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  
  phone: z.string().regex(/^[\+]?[\d\s\-\(\)]+$/, 'رقم الهاتف غير صحيح').optional(),
  
  search: z.string().min(1, 'نص البحث مطلوب').max(100, 'نص البحث طويل جداً').optional(),
};

// Account validation schema
export const accountSchema = z.object({
  code: z.string()
    .min(1, 'رمز الحساب مطلوب')
    .max(20, 'رمز الحساب طويل جداً')
    .regex(/^[A-Za-z0-9-_]+$/, 'رمز الحساب يمكن أن يحتوي على أحرف وأرقام وشرطات فقط'),
  
  name: z.string()
    .min(1, 'اسم الحساب مطلوب')
    .max(200, 'اسم الحساب طويل جداً'),
  
  nameEn: z.string()
    .max(200, 'الاسم الإنجليزي طويل جداً')
    .optional(),
  
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'], {
    errorMap: () => ({ message: 'نوع الحساب غير صحيح' })
  }),
  
  accountType: z.enum(['main', 'sub'], {
    errorMap: () => ({ message: 'نوع الحساب يجب أن يكون رئيسي أو فرعي' })
  }),
  
  nature: z.enum(['debit', 'credit'], {
    errorMap: () => ({ message: 'طبيعة الحساب يجب أن تكون مدين أو دائن' })
  }),
  
  parentId: commonSchemas.uuid.optional(),
  
  level: z.coerce.number()
    .int('المستوى يجب أن يكون رقم صحيح')
    .min(1, 'المستوى يجب أن يكون 1 على الأقل')
    .max(10, 'المستوى يجب أن يكون 10 كحد أقصى'),
  
  isGroup: z.boolean('قيمة مجموعة غير صحيحة'),
  
  isActive: z.boolean('حالة النشاط غير صحيحة').optional(),
  
  currency: commonSchemas.currency,
  
  description: z.string()
    .max(1000, 'الوصف طويل جداً')
    .optional(),
  
  notes: z.string()
    .max(1000, 'الملاحظات طويلة جداً')
    .optional(),
});

// Customer validation schema
export const customerSchema = z.object({
  code: z.string()
    .min(1, 'رمز العميل مطلوب')
    .max(20, 'رمز العميل طويل جداً')
    .regex(/^[A-Za-z0-9-_]+$/, 'رمز العميل يمكن أن يحتوي على أحرف وأرقام وشرطات فقط'),
  
  name: z.string()
    .min(1, 'اسم العميل مطلوب')
    .max(200, 'اسم العميل طويل جداً'),
  
  nameEn: z.string()
    .max(200, 'الاسم الإنجليزي طويل جداً')
    .optional(),
  
  type: z.enum(['individual', 'company'], {
    errorMap: () => ({ message: 'نوع العميل يجب أن يكون فرد أو شركة' })
  }),
  
  email: commonSchemas.email,
  
  phone: commonSchemas.phone,
  
  address: z.string()
    .max(500, 'العنوان طويل جداً')
    .optional(),
  
  taxNumber: z.string()
    .max(50, 'الرقم الضريبي طويل جداً')
    .optional(),
  
  creditLimit: commonSchemas.amount.optional(),
  
  paymentTerms: z.coerce.number()
    .int('شروط الدفع يجب أن تكون رقم صحيح')
    .min(0, 'شروط الدفع يجب أن تكون 0 أو أكثر')
    .max(365, 'شروط الدفع يجب أن تكون 365 يوم كحد أقصى')
    .optional(),
  
  currency: commonSchemas.currency,
  
  contactPerson: z.string()
    .max(100, 'اسم الشخص المسؤول طويل جداً')
    .optional(),
});

// Employee validation schema
export const employeeSchema = z.object({
  code: z.string()
    .min(1, 'رمز الموظف مطلوب')
    .max(20, 'رمز الموظف طويل جداً')
    .regex(/^[A-Za-z0-9-_]+$/, 'رمز الموظف يمكن أن يحتوي على أحرف وأرقام وشرطات فقط'),
  
  name: z.string()
    .min(1, 'اسم الموظف مطلوب')
    .max(200, 'اسم الموظف طويل جداً'),
  
  nameEn: z.string()
    .max(200, 'الاسم الإنجليزي طويل جداً')
    .optional(),
  
  email: commonSchemas.email,
  
  phone: commonSchemas.phone,
  
  position: z.string()
    .max(100, 'المنصب طويل جداً')
    .optional(),
  
  department: z.string()
    .max(100, 'القسم طويل جداً')
    .optional(),
  
  salary: commonSchemas.amount.optional(),
  
  hireDate: z.string().datetime('تاريخ التعيين غير صحيح').optional(),
  
  terminationDate: z.string().datetime('تاريخ إنهاء الخدمة غير صحيح').optional(),
  
  accountId: commonSchemas.uuid.optional(),
  
  bankAccount: z.string()
    .max(50, 'رقم الحساب البنكي طويل جداً')
    .optional(),
  
  bankName: z.string()
    .max(100, 'اسم البنك طويل جداً')
    .optional(),
  
  currency: commonSchemas.currency,
});

// Journal Entry validation schema
export const journalEntrySchema = z.object({
  date: z.string().datetime('التاريخ غير صحيح'),
  
  description: z.string()
    .min(1, 'الوصف مطلوب')
    .max(500, 'الوصف طويل جداً'),
  
  type: z.enum(['general', 'opening', 'closing', 'adjustment'], {
    errorMap: () => ({ message: 'نوع القيد غير صحيح' })
  }).optional(),
  
  details: z.array(z.object({
    accountId: commonSchemas.uuid,
    debit: z.coerce.number().min(0, 'المبلغ المدين يجب أن يكون 0 أو أكثر'),
    credit: z.coerce.number().min(0, 'المبلغ الدائن يجب أن يكون 0 أو أكثر'),
    description: z.string()
      .max(200, 'وصف التفصيل طويل جداً')
      .optional(),
  })).min(2, 'يجب أن يكون هناك تفصيلين على الأقل'),
}).refine((data) => {
  // Custom validation: ensure debits equal credits
  let totalDebits = 0;
  let totalCredits = 0;
  
  for (const detail of data.details) {
    if (detail.debit > 0 && detail.credit > 0) {
      throw new Error('كل تفصيل يجب أن يكون له إما مدين أو دائن، وليس كلاهما');
    }
    
    if (detail.debit === 0 && detail.credit === 0) {
      throw new Error('كل تفصيل يجب أن يكون له مبلغ مدين أو دائن');
    }
    
    totalDebits += detail.debit;
    totalCredits += detail.credit;
  }
  
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error('إجمالي المدين يجب أن يساوي إجمالي الدائن');
  }
  
  return true;
}, {
  message: 'إجمالي المدين يجب أن يساوي إجمالي الدائن',
  path: ['details']
});

// Payment validation schema
export const paymentSchema = z.object({
  customerId: commonSchemas.uuid,
  amount: commonSchemas.amount,
  date: z.string().datetime('التاريخ غير صحيح'),
  paymentMethod: z.enum(['cash', 'bank', 'card', 'check'], {
    errorMap: () => ({ message: 'طريقة الدفع غير صحيحة' })
  }).optional(),
  description: z.string()
    .max(200, 'الوصف طويل جداً')
    .optional(),
  reference: z.string()
    .max(100, 'المرجع طويل جداً')
    .optional(),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  customerId: commonSchemas.uuid,
  date: z.string().datetime('تاريخ الفاتورة غير صحيح'),
  dueDate: z.string().datetime('تاريخ الاستحقاق غير صحيح'),
  items: z.array(z.object({
    description: z.string()
      .min(1, 'وصف الصنف مطلوب')
      .max(200, 'وصف الصنف طويل جداً'),
    quantity: z.coerce.number().min(0.01, 'الكمية يجب أن تكون أكبر من 0'),
    unitPrice: z.coerce.number().min(0, 'سعر الوحدة يجب أن يكون موجب'),
    totalPrice: z.coerce.number().min(0, 'السعر الإجمالي يجب أن يكون موجب'),
  })).min(1, 'يجب أن يكون هناك صنف واحد على الأقل'),
  notes: z.string()
    .max(500, 'الملاحظات طويلة جداً')
    .optional(),
  terms: z.string()
    .max(500, 'الشروط طويلة جداً')
    .optional(),
});

// User validation schema
export const userSchema = z.object({
  username: z.string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(50, 'اسم المستخدم طويل جداً')
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يمكن أن يحتوي على أحرف وأرقام وشرطة سفلية فقط'),
  
  password: z.string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً'),
  
  name: z.string()
    .min(1, 'الاسم مطلوب')
    .max(100, 'الاسم طويل جداً'),
  
  email: commonSchemas.email,
  
  role: z.enum(['admin', 'financial', 'sales', 'operations', 'customer_service'], {
    errorMap: () => ({ message: 'الدور غير صحيح' })
  }),
  
  isActive: z.boolean('حالة النشاط غير صحيحة').optional(),
});

// Role validation schema
export const roleSchema = z.object({
  name: z.string()
    .min(1, 'اسم الدور مطلوب')
    .max(50, 'اسم الدور طويل جداً'),
  
  description: z.string()
    .max(200, 'وصف الدور طويل جداً')
    .optional(),
  
  permissions: z.record(z.boolean('قيمة الصلاحية غير صحيحة')),
});

// Search and filter schema
export const searchSchema = z.object({
  search: commonSchemas.search,
  status: z.string()
    .max(20, 'فلتر الحالة طويل جداً')
    .optional(),
  type: z.string()
    .max(50, 'فلتر النوع طويل جداً')
    .optional(),
  ...commonSchemas.pagination.shape,
  ...commonSchemas.dateRange.shape,
});

export default {
  commonSchemas,
  accountSchema,
  customerSchema,
  employeeSchema,
  journalEntrySchema,
  paymentSchema,
  invoiceSchema,
  userSchema,
  roleSchema,
  searchSchema,
};

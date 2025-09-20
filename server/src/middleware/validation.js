import { body, param, query, validationResult } from 'express-validator';

// Helper function to handle validation results
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Common validation rules
export const commonValidations = {
  uuid: param('id').isUUID().withMessage('Invalid ID format'),
  
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  
  dateRange: [
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format for dateFrom'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format for dateTo'),
  ],
  
  currency: body('currency').optional().isIn(['LYD', 'USD', 'EUR', 'CNY']).withMessage('Invalid currency'),
  
  amount: (field) => body(field)
    .isFloat({ min: 0 })
    .withMessage(`${field} must be a positive number`)
    .custom((value) => {
      if (value > 999999999999.99) {
        throw new Error(`${field} is too large`);
      }
      return true;
    }),
};

// Account validation
export const validateAccount = [
  body('code')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Account code must be between 1 and 20 characters')
    .matches(/^[A-Za-z0-9-_]+$/)
    .withMessage('Account code can only contain letters, numbers, hyphens, and underscores'),
  
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Account name must be between 1 and 200 characters'),
  
  body('nameEn')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('English name cannot exceed 200 characters'),
  
  body('type')
    .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
    .withMessage('Invalid account type'),
  
  body('accountType')
    .isIn(['main', 'sub'])
    .withMessage('Account type must be either main or sub'),
  
  body('nature')
    .isIn(['debit', 'credit'])
    .withMessage('Account nature must be either debit or credit'),
  
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Parent ID must be a valid UUID'),
  
  body('level')
    .isInt({ min: 1, max: 10 })
    .withMessage('Level must be between 1 and 10'),
  
  body('isGroup')
    .isBoolean()
    .withMessage('isGroup must be a boolean'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  commonValidations.currency,
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

// Customer validation
export const validateCustomer = [
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Customer code must be between 1 and 20 characters')
    .matches(/^[A-Za-z0-9-_]+$/)
    .withMessage('Customer code can only contain letters, numbers, hyphens, and underscores'),
  
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Customer name must be between 1 and 200 characters'),
  
  body('nameEn')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('English name cannot exceed 200 characters'),
  
  body('type')
    .isIn(['individual', 'company'])
    .withMessage('Customer type must be either individual or company'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[\d\s\-\(\)]+$/)
    .withMessage('Invalid phone number format'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('taxNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tax number cannot exceed 50 characters'),
  
  commonValidations.amount('creditLimit'),
  
  body('paymentTerms')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Payment terms must be between 0 and 365 days'),
  
  commonValidations.currency,
  
  body('contactPerson')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Contact person name cannot exceed 100 characters'),
];

// Employee validation
export const validateEmployee = [
  body('code')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Employee code must be between 1 and 20 characters')
    .matches(/^[A-Za-z0-9-_]+$/)
    .withMessage('Employee code can only contain letters, numbers, hyphens, and underscores'),
  
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Employee name must be between 1 and 200 characters'),
  
  body('nameEn')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('English name cannot exceed 200 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[\d\s\-\(\)]+$/)
    .withMessage('Invalid phone number format'),
  
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),
  
  commonValidations.amount('salary'),
  
  body('hireDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid hire date format'),
  
  body('terminationDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid termination date format'),
  
  body('accountId')
    .optional()
    .isUUID()
    .withMessage('Account ID must be a valid UUID'),
  
  body('bankAccount')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Bank account cannot exceed 50 characters'),
  
  body('bankName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bank name cannot exceed 100 characters'),
  
  commonValidations.currency,
];

// Journal Entry validation
export const validateJournalEntry = [
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  
  body('type')
    .optional()
    .isIn(['general', 'opening', 'closing', 'adjustment'])
    .withMessage('Invalid journal entry type'),
  
  body('details')
    .isArray({ min: 2 })
    .withMessage('At least 2 journal entry details are required'),
  
  body('details.*.accountId')
    .isUUID()
    .withMessage('Account ID must be a valid UUID'),
  
  body('details.*.debit')
    .isFloat({ min: 0 })
    .withMessage('Debit amount must be a positive number'),
  
  body('details.*.credit')
    .isFloat({ min: 0 })
    .withMessage('Credit amount must be a positive number'),
  
  body('details.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Detail description cannot exceed 200 characters'),
  
  // Custom validation to ensure debits equal credits
  body('details').custom((details) => {
    let totalDebits = 0;
    let totalCredits = 0;
    
    for (const detail of details) {
      const debit = parseFloat(detail.debit || 0);
      const credit = parseFloat(detail.credit || 0);
      
      // Ensure either debit or credit is provided, but not both
      if (debit > 0 && credit > 0) {
        throw new Error('Each detail must have either debit or credit, not both');
      }
      
      if (debit === 0 && credit === 0) {
        throw new Error('Each detail must have either debit or credit amount');
      }
      
      totalDebits += debit;
      totalCredits += credit;
    }
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Total debits must equal total credits');
    }
    
    return true;
  }),
];

// Payment validation
export const validatePayment = [
  body('customerId')
    .isUUID()
    .withMessage('Customer ID must be a valid UUID'),

  commonValidations.amount('amount'),

  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank_transfer', 'check', 'credit_card', 'other'])
    .withMessage('Invalid payment method'),

  body('counterAccountId')
    .optional()
    .isUUID()
    .withMessage('counterAccountId must be a valid UUID when provided'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),

  body('reference')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference cannot exceed 100 characters'),
];

// Invoice validation
export const validateInvoice = [
  body('customerId')
    .isUUID()
    .withMessage('Customer ID must be a valid UUID'),
  
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Invalid due date format'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item description must be between 1 and 200 characters'),
  
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Item quantity must be greater than 0'),
  
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  
  body('items.*.totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a positive number'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  body('terms')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Terms cannot exceed 500 characters'),
];

// Fixed Asset validation
export const validateFixedAsset = [
  body('assetNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Asset number must be at most 50 characters'),

  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Asset name must be between 1 and 200 characters'),

  body('categoryAccountId')
    .isUUID()
    .withMessage('categoryAccountId must be a valid UUID'),

  body('purchaseDate')
    .isISO8601()
    .withMessage('Invalid purchase date format'),

  body('purchaseCost')
    .isFloat({ gt: 0 })
    .withMessage('Purchase cost must be greater than 0'),

  body('usefulLife')
    .isInt({ min: 1, max: 100 })
    .withMessage('Useful life must be between 1 and 100 years'),

  body('depreciationMethod')
    .isIn(['straight_line', 'declining_balance', 'sum_of_years', 'units_of_production'])
    .withMessage('Invalid depreciation method'),

  body('salvageValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salvage value must be a positive number'),

  body('currency')
    .optional()
    .isIn(['LYD', 'USD', 'EUR'])
    .withMessage('Invalid currency'),
];

// Payroll validation
export const validatePayroll = [
  body('employeeId')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  
  body('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be between 2020 and 2100'),
  
  commonValidations.amount('basicSalary'),
  
  body('allowances')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Allowances must be a positive number'),
  
  body('deductions')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deductions must be a positive number'),
  
  body('overtime')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime must be a positive number'),
  
  body('bonuses')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bonuses must be a positive number'),
  
  body('paymentMethod')
    .optional()
    .isIn(['bank', 'cash'])
    .withMessage('Payment method must be either bank or cash'),
  
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

// Search and filter validation
export const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('status')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Status filter must be between 1 and 20 characters'),
  
  query('type')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Type filter must be between 1 and 50 characters'),
];

export default {
  handleValidationErrors,
  commonValidations,
  validateAccount,
  validateCustomer,
  validateEmployee,
  validateJournalEntry,
  validatePayment,
  validateInvoice,
  validateFixedAsset,
  validatePayroll,
  validateSearch
};


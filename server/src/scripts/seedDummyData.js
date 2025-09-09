import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import models, { sequelize } from '../models/index.js';

const { 
  User, 
  Role, 
  Account, 
  Customer, 
  Employee, 
  JournalEntry, 
  JournalEntryDetail,
  Invoice,
  Payment,
  Receipt,
  FixedAsset,
  PayrollEntry,
  EmployeeAdvance,
  Supplier,
  Setting
} = models;



console.log('🌱 Starting to seed dummy data...');

// Helper function to create or find user
const createOrFindUser = async (userData) => {
  const existingUser = await User.findOne({ where: { username: userData.username } });
  if (existingUser) {
    console.log(`✅ User already exists: ${userData.username}`);
    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const user = await User.create({
    id: uuidv4(),
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(`✅ User created: ${userData.username}`);
  return user;
};

// Helper function to create or find account
const createOrFindAccount = async (accountData) => {
  const existingAccount = await Account.findOne({ where: { code: accountData.code } });
  if (existingAccount) {
    console.log(`✅ Account already exists: ${accountData.code} - ${accountData.name}`);
    return existingAccount;
  }

  const account = await Account.create({
    id: uuidv4(),
    ...accountData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(`✅ Account created: ${accountData.code} - ${accountData.name}`);
  return account;
};

// Helper function to create or find customer
const createOrFindCustomer = async (customerData) => {
  const existingCustomer = await Customer.findOne({ where: { code: customerData.code } });
  if (existingCustomer) {
    console.log(`✅ Customer already exists: ${customerData.code} - ${customerData.name}`);
    return existingCustomer;
  }

  const customer = await Customer.create({
    id: uuidv4(),
    ...customerData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(`✅ Customer created: ${customerData.code} - ${customerData.name}`);
  return customer;
};

// Helper function to create or find employee
const createOrFindEmployee = async (employeeData) => {
  const existingEmployee = await Employee.findOne({ where: { employeeNumber: employeeData.employeeNumber } });
  if (existingEmployee) {
    console.log(`✅ Employee already exists: ${employeeData.employeeNumber} - ${employeeData.name}`);
    return existingEmployee;
  }

  const employee = await Employee.create({
    id: uuidv4(),
    ...employeeData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(`✅ Employee created: ${employeeData.employeeNumber} - ${employeeData.name}`);
  return employee;
};

const seedDummyData = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create additional users
    console.log('🔄 Creating additional users...');
    const financialUser = await createOrFindUser({
      username: 'financial',
      password: 'financial123',
      name: 'محمد المحاسب',
      role: 'financial',
      email: 'financial@goldenhorse.com',
      isActive: true
    });

    const salesUser = await createOrFindUser({
      username: 'sales',
      password: 'sales123',
      name: 'أحمد المبيعات',
      role: 'sales',
      email: 'sales@goldenhorse.com',
      isActive: true
    });

    // Create additional accounts
    console.log('🔄 Creating additional accounts...');
    
    // Asset accounts
    const cashAccount = await createOrFindAccount({
      code: '1001',
      name: 'الصندوق',
      nameEn: 'Cash',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      accountType: 'sub',
      level: 2,
      parentId: (await Account.findOne({ where: { code: '1' } })).id,
      isActive: true,
      balance: 50000,
      currency: 'LYD',
      nature: 'debit',
      description: 'النقد في الصندوق'
    });

    const bankAccount = await createOrFindAccount({
      code: '1002',
      name: 'البنك',
      nameEn: 'Bank',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      accountType: 'sub',
      level: 2,
      parentId: (await Account.findOne({ where: { code: '1' } })).id,
      isActive: true,
      balance: 150000,
      currency: 'LYD',
      nature: 'debit',
      description: 'الحساب البنكي'
    });

    const receivablesAccount = await createOrFindAccount({
      code: '1003',
      name: 'المدينون',
      nameEn: 'Accounts Receivable',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      accountType: 'sub',
      level: 2,
      parentId: (await Account.findOne({ where: { code: '1' } })).id,
      isActive: true,
      balance: 75000,
      currency: 'LYD',
      nature: 'debit',
      description: 'المبالغ المستحقة على العملاء'
    });

    // Liability accounts
    const payablesAccount = await createOrFindAccount({
      code: '2001',
      name: 'الدائنون',
      nameEn: 'Accounts Payable',
      type: 'liability',
      rootType: 'Liability',
      reportType: 'Balance Sheet',
      accountType: 'sub',
      level: 2,
      parentId: (await Account.findOne({ where: { code: '2' } })).id,
      isActive: true,
      balance: 45000,
      currency: 'LYD',
      nature: 'credit',
      description: 'المبالغ المستحقة للموردين'
    });

    // Revenue accounts
    const salesRevenueAccount = await createOrFindAccount({
      code: '4001',
      name: 'إيرادات المبيعات',
      nameEn: 'Sales Revenue',
      type: 'income',
      rootType: 'Income',
      reportType: 'Profit and Loss',
      accountType: 'sub',
      level: 2,
      parentId: (await Account.findOne({ where: { code: '4' } })).id,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'credit',
      description: 'إيرادات المبيعات'
    });

    // Expense accounts
    const salaryExpenseAccount = await createOrFindAccount({
      code: '5001',
      name: 'مصروفات الرواتب',
      nameEn: 'Salary Expenses',
      type: 'expense',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      accountType: 'sub',
      level: 2,
      parentId: (await Account.findOne({ where: { code: '5' } })).id,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'debit',
      description: 'مصروفات الرواتب والمرتبات'
    });

    const rentExpenseAccount = await createOrFindAccount({
      code: '5002',
      name: 'مصروفات الإيجار',
      nameEn: 'Rent Expenses',
      type: 'expense',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      accountType: 'sub',
      level: 2,
      parentId: (await Account.findOne({ where: { code: '5' } })).id,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      nature: 'debit',
      description: 'مصروفات إيجار المكاتب والمستودعات'
    });

    // Create customers
    console.log('🔄 Creating customers...');
    const customers = [
      {
        code: 'CUST001',
        name: 'شركة النقل السريع',
        nameEn: 'Fast Transport Co.',
        contactPerson: 'أحمد محمد',
        phone: '0912345678',
        email: 'ahmed@fasttransport.com',
        address: 'طرابلس، ليبيا',
        taxNumber: '123456789',
        creditLimit: 100000,
        balance: 25000,
        isActive: true
      },
      {
        code: 'CUST002',
        name: 'مؤسسة الشحن البحري',
        nameEn: 'Marine Shipping Foundation',
        contactPerson: 'فاطمة علي',
        phone: '0923456789',
        email: 'fatima@marineshipping.com',
        address: 'بنغازي، ليبيا',
        taxNumber: '987654321',
        creditLimit: 150000,
        balance: 45000,
        isActive: true
      },
      {
        code: 'CUST003',
        name: 'شركة الخدمات اللوجستية',
        nameEn: 'Logistics Services Co.',
        contactPerson: 'محمد حسن',
        phone: '0934567890',
        email: 'mohamed@logistics.com',
        address: 'مصراتة، ليبيا',
        taxNumber: '456789123',
        creditLimit: 80000,
        balance: 15000,
        isActive: true
      }
    ];

    const createdCustomers = [];
    for (const customerData of customers) {
      const customer = await createOrFindCustomer(customerData);
      createdCustomers.push(customer);
    }

    // Create employees
    console.log('🔄 Creating employees...');
    const employees = [
      {
        employeeNumber: 'EMP001',
        name: 'علي أحمد',
        nameEn: 'Ali Ahmed',
        position: 'مدير مالي',
        department: 'المالية',
        hireDate: new Date('2023-01-15'),
        salary: 2500,
        phone: '0945678901',
        email: 'ali.ahmed@goldenhorse.com',
        address: 'طرابلس، ليبيا',
        isActive: true
      },
      {
        employeeNumber: 'EMP002',
        name: 'سارة محمد',
        nameEn: 'Sara Mohamed',
        position: 'محاسب',
        department: 'المالية',
        hireDate: new Date('2023-03-20'),
        salary: 1800,
        phone: '0956789012',
        email: 'sara.mohamed@goldenhorse.com',
        address: 'طرابلس، ليبيا',
        isActive: true
      },
      {
        employeeNumber: 'EMP003',
        name: 'خالد حسن',
        nameEn: 'Khalid Hassan',
        position: 'مندوب مبيعات',
        department: 'المبيعات',
        hireDate: new Date('2023-02-10'),
        salary: 1600,
        phone: '0967890123',
        email: 'khalid.hassan@goldenhorse.com',
        address: 'بنغازي، ليبيا',
        isActive: true
      }
    ];

    const createdEmployees = [];
    for (const employeeData of employees) {
      const employee = await createOrFindEmployee(employeeData);
      createdEmployees.push(employee);
    }

    // Create journal entries
    console.log('🔄 Creating journal entries...');
    const journalEntries = [
      {
        entryNumber: 'JE000001',
        date: new Date('2024-01-15'),
        description: 'قيد افتتاحي - رأس المال',
        reference: 'REF001',
        type: 'manual',
        totalDebit: 200000,
        totalCredit: 200000,
        currency: 'LYD',
        status: 'posted',
        createdBy: financialUser.id,
        lines: [
          {
            accountId: cashAccount.id,
            accountCode: cashAccount.code,
            accountName: cashAccount.name,
            description: 'إيداع رأس المال في الصندوق',
            debit: 200000,
            credit: 0,
            currency: 'LYD'
          },
          {
            accountId: (await Account.findOne({ where: { code: '3' } })).id,
            accountCode: '3',
            accountName: 'حقوق الملكية',
            description: 'رأس المال المدفوع',
            debit: 0,
            credit: 200000,
            currency: 'LYD'
          }
        ]
      },
      {
        entryNumber: 'JE000002',
        date: new Date('2024-01-20'),
        description: 'شراء أثاث مكتبي',
        reference: 'REF002',
        type: 'manual',
        totalDebit: 15000,
        totalCredit: 15000,
        currency: 'LYD',
        status: 'posted',
        createdBy: financialUser.id,
        lines: [
          {
            accountId: (await Account.findOne({ where: { code: '12' } })).id,
            accountCode: '12',
            accountName: 'الأصول الثابتة',
            description: 'أثاث مكتبي',
            debit: 15000,
            credit: 0,
            currency: 'LYD'
          },
          {
            accountId: bankAccount.id,
            accountCode: bankAccount.code,
            accountName: bankAccount.name,
            description: 'دفع من الحساب البنكي',
            debit: 0,
            credit: 15000,
            currency: 'LYD'
          }
        ]
      },
      {
        entryNumber: 'JE000003',
        date: new Date('2024-02-01'),
        description: 'مبيعات نقدية',
        reference: 'REF003',
        type: 'manual',
        totalDebit: 25000,
        totalCredit: 25000,
        currency: 'LYD',
        status: 'posted',
        createdBy: financialUser.id,
        lines: [
          {
            accountId: cashAccount.id,
            accountCode: cashAccount.code,
            accountName: cashAccount.name,
            description: 'إيرادات مبيعات نقدية',
            debit: 25000,
            credit: 0,
            currency: 'LYD'
          },
          {
            accountId: salesRevenueAccount.id,
            accountCode: salesRevenueAccount.code,
            accountName: salesRevenueAccount.name,
            description: 'إيرادات المبيعات',
            debit: 0,
            credit: 25000,
            currency: 'LYD'
          }
        ]
      }
    ];

    for (const entryData of journalEntries) {
      const existingEntry = await JournalEntry.findOne({ where: { entryNumber: entryData.entryNumber } });
      if (existingEntry) {
        console.log(`✅ Journal entry already exists: ${entryData.entryNumber}`);
        continue;
      }

      const entry = await JournalEntry.create({
        id: uuidv4(),
        ...entryData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create journal entry details
      for (const lineData of entryData.lines) {
        await JournalEntryDetail.create({
          id: uuidv4(),
          journalEntryId: entry.id,
          ...lineData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log(`✅ Journal entry created: ${entryData.entryNumber}`);
    }

    // Create invoices
    console.log('🔄 Creating invoices...');
    const invoices = [
      {
        invoiceNumber: 'INV001',
        date: new Date('2024-02-15'),
        dueDate: new Date('2024-03-15'),
        customerId: createdCustomers[0].id,
        subtotal: 50000,
        taxAmount: 2500,
        total: 52500,
        paidAmount: 25000,
        balance: 27500,
        status: 'partially_paid',
        notes: 'خدمات شحن بحري'
      },
      {
        invoiceNumber: 'INV002',
        date: new Date('2024-02-20'),
        dueDate: new Date('2024-03-20'),
        customerId: createdCustomers[1].id,
        subtotal: 75000,
        taxAmount: 3750,
        total: 78750,
        paidAmount: 0,
        balance: 78750,
        status: 'unpaid',
        notes: 'خدمات نقل بري'
      }
    ];

    for (const invoiceData of invoices) {
      const existingInvoice = await Invoice.findOne({ where: { invoiceNumber: invoiceData.invoiceNumber } });
      if (existingInvoice) {
        console.log(`✅ Invoice already exists: ${invoiceData.invoiceNumber}`);
        continue;
      }

      const invoice = await Invoice.create({
        id: uuidv4(),
        ...invoiceData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Invoice created: ${invoiceData.invoiceNumber}`);
    }

    // Create payments
    console.log('🔄 Creating payments...');
    const payments = [
      {
        paymentNumber: 'PAY001',
        date: new Date('2024-02-20'),
        customerId: createdCustomers[0].id,
        amount: 25000,
        paymentMethod: 'bank_transfer',
        reference: 'BANK001',
        notes: 'دفع جزئي للفاتورة INV001',
        status: 'completed'
      }
    ];

    for (const paymentData of payments) {
      const existingPayment = await Payment.findOne({ where: { paymentNumber: paymentData.paymentNumber } });
      if (existingPayment) {
        console.log(`✅ Payment already exists: ${paymentData.paymentNumber}`);
        continue;
      }

      const payment = await Payment.create({
        id: uuidv4(),
        ...paymentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Payment created: ${paymentData.paymentNumber}`);
    }

    // Create fixed assets
    console.log('🔄 Creating fixed assets...');
    const fixedAssets = [
      {
        assetNumber: 'FA001',
        name: 'سيارة نقل',
        description: 'سيارة نقل للخدمات اللوجستية',
        category: 'مركبات',
        purchaseDate: new Date('2023-06-15'),
        purchaseCost: 45000,
        currentValue: 38000,
        depreciationMethod: 'straight_line',
        usefulLife: 5,
        salvageValue: 5000,
        location: 'طرابلس',
        status: 'active'
      },
      {
        assetNumber: 'FA002',
        name: 'أثاث مكتبي',
        description: 'طاولات وكراسي مكتبية',
        category: 'أثاث',
        purchaseDate: new Date('2023-08-20'),
        purchaseCost: 15000,
        currentValue: 12000,
        depreciationMethod: 'straight_line',
        usefulLife: 10,
        salvageValue: 1000,
        location: 'طرابلس',
        status: 'active'
      }
    ];

    for (const assetData of fixedAssets) {
      const existingAsset = await FixedAsset.findOne({ where: { assetNumber: assetData.assetNumber } });
      if (existingAsset) {
        console.log(`✅ Fixed asset already exists: ${assetData.assetNumber}`);
        continue;
      }

      const asset = await FixedAsset.create({
        id: uuidv4(),
        ...assetData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Fixed asset created: ${assetData.assetNumber}`);
    }

    // Create payroll entries
    console.log('🔄 Creating payroll entries...');
    const payrollEntries = [
      {
        entryNumber: 'PAY001',
        date: new Date('2024-02-01'),
        employeeId: createdEmployees[0].id,
        basicSalary: 2500,
        allowances: 300,
        deductions: 200,
        netSalary: 2600,
        status: 'completed',
        notes: 'راتب شهر فبراير 2024'
      },
      {
        entryNumber: 'PAY002',
        date: new Date('2024-02-01'),
        employeeId: createdEmployees[1].id,
        basicSalary: 1800,
        allowances: 200,
        deductions: 150,
        netSalary: 1850,
        status: 'completed',
        notes: 'راتب شهر فبراير 2024'
      }
    ];

    for (const payrollData of payrollEntries) {
      const existingPayroll = await PayrollEntry.findOne({ where: { entryNumber: payrollData.entryNumber } });
      if (existingPayroll) {
        console.log(`✅ Payroll entry already exists: ${payrollData.entryNumber}`);
        continue;
      }

      const payroll = await PayrollEntry.create({
        id: uuidv4(),
        ...payrollData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Payroll entry created: ${payrollData.entryNumber}`);
    }

    // Create employee advances
    console.log('🔄 Creating employee advances...');
    const employeeAdvances = [
      {
        advanceNumber: 'ADV001',
        date: new Date('2024-01-15'),
        employeeId: createdEmployees[0].id,
        amount: 1000,
        purpose: 'سلفة طارئة',
        status: 'approved',
        approvedBy: financialUser.id
      }
    ];

    for (const advanceData of employeeAdvances) {
      const existingAdvance = await EmployeeAdvance.findOne({ where: { advanceNumber: advanceData.advanceNumber } });
      if (existingAdvance) {
        console.log(`✅ Employee advance already exists: ${advanceData.advanceNumber}`);
        continue;
      }

      const advance = await EmployeeAdvance.create({
        id: uuidv4(),
        ...advanceData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Employee advance created: ${advanceData.advanceNumber}`);
    }

    // Create suppliers
    console.log('🔄 Creating suppliers...');
    const suppliers = [
      {
        code: 'SUP001',
        name: 'شركة الوقود الوطنية',
        nameEn: 'National Fuel Co.',
        contactPerson: 'محمد عبدالله',
        phone: '0911111111',
        email: 'info@nationalfuel.com',
        address: 'طرابلس، ليبيا',
        taxNumber: '111111111',
        creditLimit: 50000,
        balance: 15000,
        isActive: true
      },
      {
        code: 'SUP002',
        name: 'مؤسسة الصيانة العامة',
        nameEn: 'General Maintenance Foundation',
        contactPerson: 'علي محمود',
        phone: '0922222222',
        email: 'info@maintenance.com',
        address: 'بنغازي، ليبيا',
        taxNumber: '222222222',
        creditLimit: 30000,
        balance: 8000,
        isActive: true
      }
    ];

    for (const supplierData of suppliers) {
      const existingSupplier = await Supplier.findOne({ where: { code: supplierData.code } });
      if (existingSupplier) {
        console.log(`✅ Supplier already exists: ${supplierData.code}`);
        continue;
      }

      const supplier = await Supplier.create({
        id: uuidv4(),
        ...supplierData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Supplier created: ${supplierData.code}`);
    }

    // Create settings
    console.log('🔄 Creating settings...');
    const settings = [
      {
        key: 'company_name',
        value: 'شركة الحصان الذهبي للنقل والشحن',
        type: 'string',
        description: 'اسم الشركة'
      },
      {
        key: 'company_address',
        value: 'طرابلس، ليبيا',
        type: 'string',
        description: 'عنوان الشركة'
      },
      {
        key: 'company_phone',
        value: '021-1234567',
        type: 'string',
        description: 'هاتف الشركة'
      },
      {
        key: 'company_email',
        value: 'info@goldenhorse.com',
        type: 'string',
        description: 'البريد الإلكتروني للشركة'
      },
      {
        key: 'default_currency',
        value: 'LYD',
        type: 'string',
        description: 'العملة الافتراضية'
      },
      {
        key: 'fiscal_year_start',
        value: '2024-01-01',
        type: 'date',
        description: 'بداية السنة المالية'
      },
      {
        key: 'fiscal_year_end',
        value: '2024-12-31',
        type: 'date',
        description: 'نهاية السنة المالية'
      }
    ];

    for (const settingData of settings) {
      const existingSetting = await Setting.findOne({ where: { key: settingData.key } });
      if (existingSetting) {
        console.log(`✅ Setting already exists: ${settingData.key}`);
        continue;
      }

      const setting = await Setting.create({
        id: uuidv4(),
        ...settingData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Setting created: ${settingData.key}`);
    }

    console.log('🎉 Dummy data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('- 3 additional users created');
    console.log('- 7 additional accounts created');
    console.log('- 3 customers created');
    console.log('- 3 employees created');
    console.log('- 3 journal entries created');
    console.log('- 2 invoices created');
    console.log('- 1 payment created');
    console.log('- 2 fixed assets created');
    console.log('- 2 payroll entries created');
    console.log('- 1 employee advance created');
    console.log('- 2 suppliers created');
    console.log('- 7 settings created');

  } catch (error) {
    console.error('❌ Error seeding dummy data:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Run the seeding function
seedDummyData()
  .then(() => {
    console.log('✅ Dummy data seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Dummy data seeding failed:', error);
    process.exit(1);
  });

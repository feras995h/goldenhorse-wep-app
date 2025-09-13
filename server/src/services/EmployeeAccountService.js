import models, { sequelize } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import NotificationService from './NotificationService.js';

const { Employee, Account, PayrollEntry, EmployeeAdvance, GLEntry } = models;

class EmployeeAccountService {
  /**
   * Create employee with automatic account creation
   */
  static async createEmployeeWithAccounts(employeeData, createdBy) {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate required fields
      const { code, name, department, position, salary } = employeeData;
      
      if (!code || !name) {
        throw new Error('كود الموظف والاسم مطلوبان');
      }

      // Check if employee code already exists
      const existingEmployee = await Employee.findOne({ where: { code } });
      if (existingEmployee) {
        throw new Error('كود الموظف موجود مسبقاً');
      }

      // Find or create parent accounts for employees
      let employeesParentAccount = await Account.findOne({
        where: { code: '2100', type: 'liability' }
      });

      if (!employeesParentAccount) {
        // Create employees parent account if it doesn't exist
        employeesParentAccount = await Account.create({
          id: uuidv4(),
          code: '2100',
          name: 'حسابات الموظفين',
          nameEn: 'Employee Accounts',
          type: 'liability',
          rootType: 'Liability',
          reportType: 'Balance Sheet',
          accountCategory: 'employees',
          isGroup: true,
          level: 1,
          balance: 0.00,
          isActive: true
        }, { transaction });
      }

      // Create the three accounts for the employee
      const accountsToCreate = [
        {
          code: `${employeesParentAccount.code}01${code}`,
          name: `${name} - حساب المرتب`,
          nameEn: `${employeeData.nameEn || name} - Salary Account`,
          type: 'salary'
        },
        {
          code: `${employeesParentAccount.code}02${code}`,
          name: `${name} - حساب السلف`,
          nameEn: `${employeeData.nameEn || name} - Advance Account`,
          type: 'advance'
        },
        {
          code: `${employeesParentAccount.code}03${code}`,
          name: `${name} - حساب العهد`,
          nameEn: `${employeeData.nameEn || name} - Custody Account`,
          type: 'custody'
        }
      ];

      const createdAccounts = {};
      
      for (const accountData of accountsToCreate) {
        const account = await Account.create({
          id: uuidv4(),
          code: accountData.code,
          name: accountData.name,
          nameEn: accountData.nameEn,
          type: 'liability',
          rootType: 'Liability',
          reportType: 'Balance Sheet',
          accountCategory: 'employee_account',
          parentId: employeesParentAccount.id,
          isGroup: false,
          level: 2,
          balance: 0.00,
          isActive: true,
          metadata: JSON.stringify({
            employeeCode: code,
            accountType: accountData.type
          })
        }, { transaction });

        createdAccounts[accountData.type] = account;
      }

      // Create the employee record
      const employee = await Employee.create({
        id: uuidv4(),
        ...employeeData,
        salaryAccountId: createdAccounts.salary.id,
        advanceAccountId: createdAccounts.advance.id,
        custodyAccountId: createdAccounts.custody.id,
        currentBalance: 0.00,
        isActive: true
      }, { transaction });

      await transaction.commit();

      // Create notification
      try {
        await NotificationService.createUserNotification(null, {
          title: 'موظف جديد',
          message: `تم إنشاء موظف جديد: ${name} مع 3 حسابات مرتبطة`,
          type: 'success',
          priority: 'medium',
          category: 'user',
          actionUrl: `/financial/employees/${employee.id}`,
          actionLabel: 'عرض الموظف',
          metadata: {
            employeeId: employee.id,
            employeeCode: code,
            createdBy: createdBy.id,
            accountsCreated: Object.keys(createdAccounts).length
          }
        });
      } catch (notificationError) {
        console.error('Error creating employee notification:', notificationError);
      }

      // Return employee with accounts
      return {
        employee,
        accounts: createdAccounts
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get employee with all related accounts and balances
   */
  static async getEmployeeWithAccounts(employeeId) {
    try {
      const employee = await Employee.findByPk(employeeId, {
        include: [
          {
            model: Account,
            as: 'salaryAccount',
            foreignKey: 'salaryAccountId'
          },
          {
            model: Account,
            as: 'advanceAccount', 
            foreignKey: 'advanceAccountId'
          },
          {
            model: Account,
            as: 'custodyAccount',
            foreignKey: 'custodyAccountId'
          }
        ]
      });

      if (!employee) {
        throw new Error('الموظف غير موجود');
      }

      // Get account balances
      const accounts = {
        salary: null,
        advance: null,
        custody: null
      };

      if (employee.salaryAccountId) {
        accounts.salary = await Account.findByPk(employee.salaryAccountId);
      }
      if (employee.advanceAccountId) {
        accounts.advance = await Account.findByPk(employee.advanceAccountId);
      }
      if (employee.custodyAccountId) {
        accounts.custody = await Account.findByPk(employee.custodyAccountId);
      }

      return {
        employee,
        accounts
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get employee account statement
   */
  static async getEmployeeAccountStatement(employeeId, accountType, startDate, endDate) {
    try {
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        throw new Error('الموظف غير موجود');
      }

      let accountId;
      switch (accountType) {
        case 'salary':
          accountId = employee.salaryAccountId;
          break;
        case 'advance':
          accountId = employee.advanceAccountId;
          break;
        case 'custody':
          accountId = employee.custodyAccountId;
          break;
        default:
          throw new Error('نوع الحساب غير صحيح');
      }

      if (!accountId) {
        throw new Error('حساب الموظف غير موجود');
      }

      // Get GL entries for the account
      const whereClause = {
        accountId: accountId,
        isActive: true
      };

      if (startDate && endDate) {
        whereClause.postingDate = {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        };
      }

      const entries = await GLEntry.findAll({
        where: whereClause,
        order: [['postingDate', 'ASC'], ['createdAt', 'ASC']],
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'code', 'name']
          }
        ]
      });

      // Calculate running balance
      let runningBalance = 0;
      const entriesWithBalance = entries.map(entry => {
        runningBalance += (entry.debit - entry.credit);
        return {
          ...entry.toJSON(),
          runningBalance
        };
      });

      return {
        employee,
        accountType,
        entries: entriesWithBalance,
        finalBalance: runningBalance
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Process salary payment
   */
  static async processSalaryPayment(employeeId, salaryData, createdBy) {
    const transaction = await sequelize.transaction();
    
    try {
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        throw new Error('الموظف غير موجود');
      }

      const { amount, month, year, description, paymentDate } = salaryData;

      // Create payroll entry
      const payrollEntry = await PayrollEntry.create({
        id: uuidv4(),
        employeeId: employee.id,
        employeeName: employee.name,
        month: `${year}-${month.toString().padStart(2, '0')}`,
        basicSalary: amount,
        totalEarnings: amount,
        totalDeductions: 0,
        netSalary: amount,
        status: 'paid',
        paymentDate: paymentDate || new Date(),
        description: description || `راتب شهر ${month}/${year}`,
        createdBy: createdBy.id
      }, { transaction });

      // Create GL entries
      const salaryAccount = await Account.findByPk(employee.salaryAccountId);
      const cashAccount = await Account.findOne({ where: { code: '1110' } }); // Cash account

      if (!salaryAccount || !cashAccount) {
        throw new Error('حسابات الراتب أو النقدية غير موجودة');
      }

      // Debit salary account (increase liability)
      await GLEntry.create({
        id: uuidv4(),
        accountId: salaryAccount.id,
        date: paymentDate || new Date(),
        description: `راتب ${employee.name} - ${month}/${year}`,
        debit: amount,
        credit: 0,
        reference: `PAY-${payrollEntry.id}`,
        isActive: true
      }, { transaction });

      // Credit cash account (decrease asset)
      await GLEntry.create({
        id: uuidv4(),
        accountId: cashAccount.id,
        date: paymentDate || new Date(),
        description: `راتب ${employee.name} - ${month}/${year}`,
        debit: 0,
        credit: amount,
        reference: `PAY-${payrollEntry.id}`,
        isActive: true
      }, { transaction });

      // Update account balances
      await salaryAccount.increment('balance', { by: amount, transaction });
      await cashAccount.decrement('balance', { by: amount, transaction });

      await transaction.commit();

      return payrollEntry;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Process employee advance
   */
  static async processEmployeeAdvance(employeeId, advanceData, createdBy) {
    const transaction = await sequelize.transaction();
    
    try {
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        throw new Error('الموظف غير موجود');
      }

      const { amount, description, advanceDate } = advanceData;

      // Create advance entry
      const advance = await EmployeeAdvance.create({
        id: uuidv4(),
        employeeId: employee.id,
        employeeName: employee.name,
        amount: amount,
        description: description || 'سلفة موظف',
        advanceDate: advanceDate || new Date(),
        status: 'active',
        createdBy: createdBy.id
      }, { transaction });

      // Create GL entries
      const advanceAccount = await Account.findByPk(employee.advanceAccountId);
      const cashAccount = await Account.findOne({ where: { code: '1110' } });

      if (!advanceAccount || !cashAccount) {
        throw new Error('حسابات السلف أو النقدية غير موجودة');
      }

      // Debit advance account (increase asset)
      await GLEntry.create({
        id: uuidv4(),
        accountId: advanceAccount.id,
        date: advanceDate || new Date(),
        description: `سلفة ${employee.name}`,
        debit: amount,
        credit: 0,
        reference: `ADV-${advance.id}`,
        isActive: true
      }, { transaction });

      // Credit cash account (decrease asset)
      await GLEntry.create({
        id: uuidv4(),
        accountId: cashAccount.id,
        date: advanceDate || new Date(),
        description: `سلفة ${employee.name}`,
        debit: 0,
        credit: amount,
        reference: `ADV-${advance.id}`,
        isActive: true
      }, { transaction });

      // Update account balances
      await advanceAccount.increment('balance', { by: amount, transaction });
      await cashAccount.decrement('balance', { by: amount, transaction });

      await transaction.commit();

      return advance;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get employee summary with all balances
   */
  static async getEmployeeSummary(employeeId) {
    try {
      const { employee, accounts } = await this.getEmployeeWithAccounts(employeeId);

      // Get recent transactions
      const recentTransactions = await GLEntry.findAll({
        where: {
          accountId: {
            [sequelize.Sequelize.Op.in]: [
              employee.salaryAccountId,
              employee.advanceAccountId,
              employee.custodyAccountId
            ].filter(Boolean)
          },
          isActive: true
        },
        order: [['postingDate', 'DESC']],
        limit: 10,
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'code', 'name']
          }
        ]
      });

      return {
        employee,
        accounts,
        recentTransactions,
        summary: {
          salaryBalance: accounts.salary?.balance || 0,
          advanceBalance: accounts.advance?.balance || 0,
          custodyBalance: accounts.custody?.balance || 0,
          totalBalance: (accounts.salary?.balance || 0) + 
                       (accounts.advance?.balance || 0) + 
                       (accounts.custody?.balance || 0)
        }
      };

    } catch (error) {
      throw error;
    }
  }
}

export default EmployeeAccountService;

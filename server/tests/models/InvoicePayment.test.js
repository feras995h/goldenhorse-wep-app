import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { sequelize } from '../../src/models/index.js';
import { InvoicePayment, Invoice, Payment, Account, Customer, User } from '../../src/models/index.js';

describe('InvoicePayment Model', () => {
  let testInvoice, testPayment, testAccount, testCustomer, testUser;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Create test data
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    testAccount = await Account.create({
      code: 'TEST001',
      name: 'Test Account',
      type: 'asset',
      level: 1,
      isGroup: false,
      balance: 1000.00
    });

    testCustomer = await Customer.create({
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '1234567890'
    });

    testInvoice = await Invoice.create({
      invoiceNumber: 'INV-001',
      customerId: testCustomer.id,
      accountId: testAccount.id,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      total: 1000.00,
      paidAmount: 0.00,
      outstandingAmount: 1000.00,
      status: 'unpaid',
      createdBy: testUser.id
    });

    testPayment = await Payment.create({
      paymentNumber: 'PAY-001',
      accountId: testAccount.id,
      customerId: testCustomer.id,
      date: new Date(),
      amount: 500.00,
      paymentMethod: 'cash',
      status: 'completed',
      createdBy: testUser.id
    });
  });

  afterEach(async () => {
    // Clean up test data
    await InvoicePayment.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Invoice.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('Model Creation', () => {
    test('should create InvoicePayment with valid data', async () => {
      const invoicePayment = await InvoicePayment.create({
        invoiceId: testInvoice.id,
        paymentId: testPayment.id,
        allocatedAmount: 500.00,
        allocationDate: new Date(),
        notes: 'Test allocation',
        createdBy: testUser.id
      });

      expect(invoicePayment).toBeDefined();
      expect(invoicePayment.invoiceId).toBe(testInvoice.id);
      expect(invoicePayment.paymentId).toBe(testPayment.id);
      expect(parseFloat(invoicePayment.allocatedAmount)).toBe(500.00);
      expect(invoicePayment.notes).toBe('Test allocation');
    });

    test('should fail to create InvoicePayment without required fields', async () => {
      await expect(InvoicePayment.create({
        allocatedAmount: 500.00
      })).rejects.toThrow();
    });

    test('should fail to create InvoicePayment with negative amount', async () => {
      await expect(InvoicePayment.create({
        invoiceId: testInvoice.id,
        paymentId: testPayment.id,
        allocatedAmount: -100.00,
        allocationDate: new Date(),
        createdBy: testUser.id
      })).rejects.toThrow();
    });
  });

  describe('Model Associations', () => {
    test('should have correct associations with Invoice', async () => {
      const invoicePayment = await InvoicePayment.create({
        invoiceId: testInvoice.id,
        paymentId: testPayment.id,
        allocatedAmount: 500.00,
        allocationDate: new Date(),
        createdBy: testUser.id
      });

      const invoice = await invoicePayment.getInvoice();
      expect(invoice).toBeDefined();
      expect(invoice.id).toBe(testInvoice.id);
    });

    test('should have correct associations with Payment', async () => {
      const invoicePayment = await InvoicePayment.create({
        invoiceId: testInvoice.id,
        paymentId: testPayment.id,
        allocatedAmount: 500.00,
        allocationDate: new Date(),
        createdBy: testUser.id
      });

      const payment = await invoicePayment.getPayment();
      expect(payment).toBeDefined();
      expect(payment.id).toBe(testPayment.id);
    });

    test('should have correct associations with User (creator)', async () => {
      const invoicePayment = await InvoicePayment.create({
        invoiceId: testInvoice.id,
        paymentId: testPayment.id,
        allocatedAmount: 500.00,
        allocationDate: new Date(),
        createdBy: testUser.id
      });

      const creator = await invoicePayment.getCreator();
      expect(creator).toBeDefined();
      expect(creator.id).toBe(testUser.id);
    });
  });

  describe('Static Methods', () => {
    test('allocatePaymentToInvoices should create multiple allocations', async () => {
      // Create additional invoice
      const invoice2 = await Invoice.create({
        invoiceNumber: 'INV-002',
        customerId: testCustomer.id,
        accountId: testAccount.id,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        total: 800.00,
        paidAmount: 0.00,
        outstandingAmount: 800.00,
        status: 'unpaid',
        createdBy: testUser.id
      });

      // Create payment with larger amount
      const largePayment = await Payment.create({
        paymentNumber: 'PAY-002',
        accountId: testAccount.id,
        customerId: testCustomer.id,
        date: new Date(),
        amount: 1200.00,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        createdBy: testUser.id
      });

      const allocations = [
        { invoiceId: testInvoice.id, amount: 500.00 },
        { invoiceId: invoice2.id, amount: 700.00 }
      ];

      const result = await InvoicePayment.allocatePaymentToInvoices(
        largePayment.id,
        allocations,
        testUser.id
      );

      expect(result).toBeDefined();
      expect(result.allocations).toHaveLength(2);
      expect(result.totalAllocated).toBe(1200.00);

      // Verify allocations were created
      const createdAllocations = await InvoicePayment.findAll({
        where: { paymentId: largePayment.id }
      });
      expect(createdAllocations).toHaveLength(2);
    });

    test('should handle FIFO allocation correctly', async () => {
      // Create multiple invoices with different dates (FIFO order)
      const oldInvoice = await Invoice.create({
        invoiceNumber: 'INV-OLD',
        customerId: testCustomer.id,
        accountId: testAccount.id,
        date: new Date('2024-01-01'),
        dueDate: new Date('2024-01-31'),
        total: 300.00,
        paidAmount: 0.00,
        outstandingAmount: 300.00,
        status: 'unpaid',
        createdBy: testUser.id
      });

      const newInvoice = await Invoice.create({
        invoiceNumber: 'INV-NEW',
        customerId: testCustomer.id,
        accountId: testAccount.id,
        date: new Date('2024-02-01'),
        dueDate: new Date('2024-02-28'),
        total: 400.00,
        paidAmount: 0.00,
        outstandingAmount: 400.00,
        status: 'unpaid',
        createdBy: testUser.id
      });

      // Test FIFO allocation with payment of 500
      const fifoPayment = await Payment.create({
        paymentNumber: 'PAY-FIFO',
        accountId: testAccount.id,
        customerId: testCustomer.id,
        date: new Date(),
        amount: 500.00,
        paymentMethod: 'cash',
        status: 'completed',
        createdBy: testUser.id
      });

      const result = await InvoicePayment.allocatePaymentFIFO(
        fifoPayment.id,
        testCustomer.id,
        testUser.id
      );

      expect(result).toBeDefined();
      expect(result.allocations).toHaveLength(2);
      
      // First allocation should be to older invoice (full amount)
      const firstAllocation = result.allocations.find(a => a.invoiceId === oldInvoice.id);
      expect(firstAllocation.allocatedAmount).toBe(300.00);
      
      // Second allocation should be to newer invoice (remaining amount)
      const secondAllocation = result.allocations.find(a => a.invoiceId === newInvoice.id);
      expect(secondAllocation.allocatedAmount).toBe(200.00);
    });
  });

  describe('Instance Methods', () => {
    test('should reverse allocation correctly', async () => {
      const invoicePayment = await InvoicePayment.create({
        invoiceId: testInvoice.id,
        paymentId: testPayment.id,
        allocatedAmount: 500.00,
        allocationDate: new Date(),
        createdBy: testUser.id
      });

      const result = await invoicePayment.reverse(testUser.id, 'Test reversal');

      expect(result.success).toBe(true);
      
      // Check that allocation is marked as reversed
      await invoicePayment.reload();
      expect(invoicePayment.isReversed).toBe(true);
      expect(invoicePayment.reversalReason).toBe('Test reversal');
      expect(invoicePayment.reversedBy).toBe(testUser.id);
    });

    test('should not allow reversing already reversed allocation', async () => {
      const invoicePayment = await InvoicePayment.create({
        invoiceId: testInvoice.id,
        paymentId: testPayment.id,
        allocatedAmount: 500.00,
        allocationDate: new Date(),
        isReversed: true,
        createdBy: testUser.id
      });

      await expect(
        invoicePayment.reverse(testUser.id, 'Second reversal')
      ).rejects.toThrow('Allocation is already reversed');
    });
  });

  describe('Validation', () => {
    test('should validate allocation amount does not exceed payment amount', async () => {
      await expect(InvoicePayment.create({
        invoiceId: testInvoice.id,
        paymentId: testPayment.id,
        allocatedAmount: 600.00, // Payment is only 500.00
        allocationDate: new Date(),
        createdBy: testUser.id
      })).rejects.toThrow();
    });

    test('should validate allocation amount does not exceed invoice outstanding amount', async () => {
      await expect(InvoicePayment.create({
        invoiceId: testInvoice.id,
        paymentId: testPayment.id,
        allocatedAmount: 1100.00, // Invoice outstanding is only 1000.00
        allocationDate: new Date(),
        createdBy: testUser.id
      })).rejects.toThrow();
    });
  });
});

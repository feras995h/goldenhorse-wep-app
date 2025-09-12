import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to read JSON data
const readJsonFile = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Helper function to write JSON data
const writeJsonFile = async (filename, data) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

/**
 * Migration utility to upgrade accounting system to ERPNext-inspired structure
 */
class AccountingMigration {
  
  /**
   * Main migration method
   */
  async migrate() {
    console.log('Starting accounting system migration to ERPNext-inspired structure...');
    
    try {
      // Step 1: Upgrade account structure
      await this.upgradeAccountStructure();
      
      // Step 2: Create party accounts for customers/suppliers
      await this.createPartyAccounts();
      
      // Step 3: Validate data integrity
      await this.validateDataIntegrity();
      
      console.log('Migration completed successfully!');
      return { success: true, message: 'Migration completed successfully' };
      
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, message: 'Migration failed', error: error.message };
    }
  }
  
  /**
   * Upgrade account structure to include ERPNext-like fields
   */
  async upgradeAccountStructure() {
    console.log('Upgrading account structure...');
    
    const accounts = await readJsonFile('accounts.json');
    const upgradedAccounts = [];
    
    for (let account of accounts) {
      // Skip if already upgraded (has isGroup field)
      if (account.isGroup !== undefined) {
        upgradedAccounts.push(account);
        continue;
      }
      
      // Determine if account is a group or ledger
      const isGroup = accounts.some(acc => acc.parentId === account.id);
      
      // Determine account category and report type
      const accountCategory = this.determineAccountCategory(account.type, account.code);
      const rootType = account.type.charAt(0).toUpperCase() + account.type.slice(1);
      const reportType = ['asset', 'liability', 'equity'].includes(account.type) ? 'Balance Sheet' : 'Profit and Loss';
      
      const upgradedAccount = {
        ...account,
        rootType,
        reportType,
        accountCategory,
        accountType: this.determineAccountType(account.code, account.name),
        isGroup,
        freezeAccount: false,
        updatedAt: new Date().toISOString()
      };
      
      upgradedAccounts.push(upgradedAccount);
    }
    
    await writeJsonFile('accounts.json', upgradedAccounts);
    console.log(`Upgraded ${upgradedAccounts.length} accounts`);
  }
  
  /**
   * Create party accounts for customers and suppliers
   */
  async createPartyAccounts() {
    console.log('Creating party accounts...');
    
    const accounts = await readJsonFile('accounts.json');
    const customers = await readJsonFile('customers.json');
    
    // Find or create main receivable account
    let receivableAccount = accounts.find(acc => acc.code === '1120');
    if (!receivableAccount) {
      console.log('Creating main Accounts Receivable account...');
      receivableAccount = {
        id: uuidv4(),
        code: '1120',
        name: '\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0630\u0645\u0645 \u0627\u0644\u0645\u062f\u064a\u0646\u0629',
        nameEn: 'Accounts Receivable',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        accountCategory: 'current_asset',
        accountType: 'Receivable',
        parentId: accounts.find(acc => acc.code === '1100')?.id,
        level: 3,
        isGroup: true,
        isActive: true,
        freezeAccount: false,
        balance: 0,
        currency: 'LYD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      accounts.push(receivableAccount);
    }
    
    // Create individual customer accounts
    let createdCustomerAccounts = 0;
    for (let customer of customers) {
      const customerAccountCode = `1121${String(createdCustomerAccounts + 1).padStart(3, '0')}`;
      
      // Check if customer account already exists
      const existingAccount = accounts.find(acc => acc.name.includes(customer.name) && acc.accountType === 'Receivable');
      
      if (!existingAccount) {
        const customerAccount = {
          id: uuidv4(),
          code: customerAccountCode,
          name: `\u0639\u0645\u064a\u0644 - ${customer.name}`,
          nameEn: `Customer - ${customer.nameEn || customer.name}`,
          type: 'asset',
          rootType: 'Asset',
          reportType: 'Balance Sheet',
          accountCategory: 'receivable',
          accountType: 'Receivable',
          parentId: receivableAccount.id,
          level: 4,
          isGroup: false,
          isActive: true,
          freezeAccount: false,
          balance: customer.balance || 0,
          currency: customer.currency || 'LYD',
          partyType: 'Customer',
          partyId: customer.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        accounts.push(customerAccount);
        createdCustomerAccounts++;
        
        // Update customer with account reference
        customer.accountId = customerAccount.id;
      }
    }
    
    // Create main payable account if it doesn't exist
    let payableAccount = accounts.find(acc => acc.code === '2110');
    if (!payableAccount) {
      console.log('Creating main Accounts Payable account...');
      payableAccount = {
        id: uuidv4(),
        code: '2110',
        name: '\u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646 \u0648\u0627\u0644\u0630\u0645\u0645 \u0627\u0644\u062f\u0627\u0626\u0646\u0629',
        nameEn: 'Accounts Payable',
        type: 'liability',
        rootType: 'Liability',
        reportType: 'Balance Sheet',
        accountCategory: 'current_liability',
        accountType: 'Payable',
        parentId: accounts.find(acc => acc.code === '2100')?.id,
        level: 3,
        isGroup: true,
        isActive: true,
        freezeAccount: false,
        balance: 0,
        currency: 'LYD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      accounts.push(payableAccount);
    }
    
    // Save updated accounts and customers
    await writeJsonFile('accounts.json', accounts);
    await writeJsonFile('customers.json', customers);
    
    console.log(`Created ${createdCustomerAccounts} customer accounts`);
  }
  
  /**
   * Validate data integrity after migration
   */
  async validateDataIntegrity() {
    console.log('Validating data integrity...');
    
    const accounts = await readJsonFile('accounts.json');
    const customers = await readJsonFile('customers.json');
    
    // Check for duplicate account codes
    const accountCodes = accounts.map(acc => acc.code);
    const duplicateCodes = accountCodes.filter((code, index) => accountCodes.indexOf(code) !== index);
    
    if (duplicateCodes.length > 0) {
      throw new Error(`Duplicate account codes found: ${duplicateCodes.join(', ')}`);
    }
    
    // Check parent-child relationships
    for (let account of accounts) {
      if (account.parentId) {
        const parent = accounts.find(acc => acc.id === account.parentId);
        if (!parent) {
          throw new Error(`Parent account not found for ${account.code} - ${account.name}`);
        }
        // Auto-convert parent to group if it's not already
        if (!parent.isGroup) {
          parent.isGroup = true;
          console.log(`✅ Parent account '${parent.code}' converted to group automatically during migration`);
        }
      }
    }
    
    // Check that all customers have account references
    const customersWithoutAccounts = customers.filter(customer => !customer.accountId);
    if (customersWithoutAccounts.length > 0) {
      console.warn(`${customersWithoutAccounts.length} customers don't have linked accounts`);
    }
    
    console.log('Data integrity validation passed');
  }
  
  /**
   * Determine account category based on type and code
   */
  determineAccountCategory(type, code) {
    if (type === 'asset') {
      if (code.startsWith('11')) return 'current_asset';
      if (code.startsWith('12')) return 'fixed_asset';
      if (code.includes('111')) return 'cash';
      if (code.includes('112')) return 'bank';
      if (code.includes('112')) return 'receivable';
    } else if (type === 'liability') {
      if (code.startsWith('21')) return 'current_liability';
      if (code.startsWith('22')) return 'long_term_liability';
      if (code.includes('211')) return 'payable';
    } else if (type === 'equity') {
      return 'equity';
    } else if (type === 'revenue' || type === 'income') {
      return 'income';
    } else if (type === 'expense') {
      if (code.startsWith('51')) return 'direct_expense';
      if (code.startsWith('52')) return 'indirect_expense';
      return 'expense';
    }
    
    return type;
  }
  
  /**
   * Determine ERPNext-style account type
   */
  determineAccountType(code, name) {
    const nameLower = name.toLowerCase();
    
    if (code.includes('111') || nameLower.includes('\u0635\u0646\u062f\u0648\u0642') || nameLower.includes('cash')) {
      return 'Cash';
    }
    if (code.includes('112') || nameLower.includes('\u0628\u0646\u0643') || nameLower.includes('bank')) {
      return 'Bank';
    }
    if (code.includes('112') || nameLower.includes('\u0639\u0645\u0644\u0627\u0621') || nameLower.includes('receivable')) {
      return 'Receivable';
    }
    if (code.includes('211') || nameLower.includes('\u0645\u0648\u0631\u062f') || nameLower.includes('payable')) {
      return 'Payable';
    }
    if (code.startsWith('12') || nameLower.includes('\u062b\u0627\u0628\u062a') || nameLower.includes('fixed')) {
      return 'Fixed Asset';
    }
    if (code.startsWith('11') && !code.includes('111') && !code.includes('112')) {
      return 'Current Asset';
    }
    if (code.startsWith('21')) {
      return 'Current Liability';
    }
    if (code.startsWith('3')) {
      return 'Equity';
    }
    if (code.startsWith('4')) {
      return 'Income Account';
    }
    if (code.startsWith('5')) {
      return 'Expense Account';
    }
    
    return null;
  }
  
  /**
   * Create a backup of current data before migration
   */
  async createBackup() {
    console.log('Creating backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../data/backup', timestamp);
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      const dataFiles = ['accounts.json', 'customers.json', 'journal-entries.json'];
      
      for (let file of dataFiles) {
        try {
          const data = await readJsonFile(file);
          const backupPath = path.join(backupDir, file);
          await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
        } catch (error) {
          console.warn(`Could not backup ${file}:`, error.message);
        }
      }
      
      console.log(`Backup created at: ${backupDir}`);
      return backupDir;
      
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }
}

// CLI interface for running migration
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new AccountingMigration();
  
  migration.createBackup()
    .then(() => migration.migrate())
    .then(result => {
      console.log('Migration result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export default AccountingMigration;

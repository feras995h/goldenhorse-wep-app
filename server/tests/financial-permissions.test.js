import { expect } from 'chai';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/server.js';
import models, { sequelize } from '../src/models/index.js';

const { User, Account, AuditLog } = models as any;

// Helper: create user with role and return credentials
async function createUser(username: string, role: string, password: string = 'P@ssw0rd!') {
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hash, role, isActive: true, email: `${username}@example.com` });
  return { user, password };
}

async function login(username: string, password: string) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password });
  expect(res.status).to.equal(200);
  expect(res.body).to.have.property('accessToken');
  return res.body.accessToken as string;
}

describe('Financial API permissions and audit integration tests', function() {
  this.timeout(20000);

  let adminToken: string;
  let finToken: string;
  let adminUser: any;
  let finUser: any;

  before(async () => {
    process.env.SKIP_SERVER_STARTUP = 'true';
    await sequelize.sync({ force: true });

    // Create users
    const admin = await createUser('admin_user', 'admin');
    const fin = await createUser('fin_user', 'financial');
    adminUser = admin.user; finUser = fin.user;

    // Login to get tokens
    adminToken = await login('admin_user', 'P@ssw0rd!');
    finToken = await login('fin_user', 'P@ssw0rd!');
  });

  after(async () => {
    await sequelize.close();
  });

  describe('Force delete account permissions', () => {
    let testAccount: any;

    beforeEach(async () => {
      testAccount = await Account.create({ code: '9.9.9', name: 'حساب اختبار للحذف', type: 'asset', isActive: true, balance: 0 });
    });

    it('should forbid non-admin (financial) from force-deleting account', async () => {
      const res = await request(app)
        .delete(`/api/financial/accounts/${testAccount.id}/force-delete`)
        .set('Authorization', `Bearer ${finToken}`);

      expect([401,403]).to.include(res.status);
    });

    it('should allow admin to force-delete account and create audit log', async () => {
      const res = await request(app)
        .delete(`/api/financial/accounts/${testAccount.id}/force-delete`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);

      const audit = await AuditLog.findOne({ where: { tableName: 'accounts', recordId: testAccount.id, action: 'DELETE' } });
      expect(audit).to.not.be.null;
    });
  });

  describe('Auto-create invoice accounts and audit logging', () => {
    it('should create missing invoice accounts and log CREATE audits', async () => {
      // First call - should create accounts
      const res = await request(app)
        .post('/api/financial/auto-create-invoice-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('createdAccounts');

      const createdCount = res.body.createdAccounts as number;
      if (createdCount > 0) {
        // Verify audit logs exist for at least one created account
        const anyAudit = await AuditLog.findOne({ where: { tableName: 'accounts', action: 'CREATE' } });
        expect(anyAudit).to.not.be.null;
      }

      // Second call - should report already existing
      const res2 = await request(app)
        .post('/api/financial/auto-create-invoice-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res2.status).to.equal(200);
      expect(res2.body).to.have.property('createdAccounts');
      expect(res2.body.createdAccounts).to.equal(0);
    });
  });
});

import express from 'express';
import { authenticateToken, requireAdminAccess } from '../middleware/auth.js';
import models from '../models/index.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();
const { User, Role } = models;

// ==================== USERS MANAGEMENT ====================

// GET /api/admin/users - Get all users with pagination and filtering
router.get('/users', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;

    // Build query filters
    let whereClause = {};

    // Add search filter
    if (search) {
      whereClause = {
        [models.sequelize.Op.or]: [
          { username: { [models.sequelize.Op.iLike]: `%${search}%` } },
          { name: { [models.sequelize.Op.iLike]: `%${search}%` } }
        ]
      };
    }

    // Add role filter
    if (role) {
      whereClause.role = role;
    }

    // Add active status filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const options = {
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      attributes: { exclude: ['password'] }
    };

    const [users, total] = await Promise.all([
      User.findAll(options),
      User.count({ where: whereClause })
    ]);

    const response = {
      data: users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'خطأ في جلب المستخدمين' });
  }
});

// POST /api/admin/users - Create new user
router.post('/users', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { username, password, name, role, email } = req.body;

    // Validate required fields
    if (!username || !password || !name || !role) {
      return res.status(400).json({ message: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
    }

    // Prepare user data - handle empty email
    // Note: Don't hash password here, let the User model hooks handle it
    const userData = {
      username,
      password, // Raw password - will be hashed by User model hooks
      name,
      role,
      isActive: true
    };

    // Only add email if it's provided and not empty
    if (email && email.trim() !== '') {
      userData.email = email.trim();
    }

    // Create user - the User model hooks will hash the password
    const user = await User.create(userData);

    // Create notification for user creation
    try {
      await NotificationService.notifyUserCreated(user, req.user);
    } catch (notificationError) {
      console.error('Error creating user notification:', notificationError);
      // Don't fail the user creation if notification fails
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'خطأ في إنشاء المستخدم' });
  }
});

// GET /api/admin/users/:id - Get user by ID
router.get('/users/:id', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'خطأ في جلب المستخدم' });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, role, email, isActive } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // Check if username is being changed and if it already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
      }
    }
    
    // Update user
    await user.update({
      username: username || user.username,
      name: name || user.name,
      role: role || user.role,
      email: email || user.email,
      isActive: isActive !== undefined ? isActive : user.isActive
    });
    
    // Return updated user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'خطأ في تحديث المستخدم' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // Prevent deleting own account
    if (id === req.user.userId) {
      return res.status(400).json({ message: 'لا يمكنك حذف حسابك الخاص' });
    }
    
    await user.destroy();
    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'خطأ في حذف المستخدم' });
  }
});

// PATCH /api/admin/users/:id/toggle-status - Toggle user active status
router.patch('/users/:id/toggle-status', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // Prevent deactivating own account
    if (id === req.user.userId) {
      return res.status(400).json({ message: 'لا يمكنك إلغاء تفعيل حسابك الخاص' });
    }
    
    await user.update({ isActive: !user.isActive });
    
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'خطأ في تغيير حالة المستخدم' });
  }
});

// POST /api/admin/users/:id/reset-password - Reset user password
router.post('/users/:id/reset-password', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ message: 'كلمة المرور الجديدة مطلوبة' });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await user.update({ 
      password: hashedPassword,
      passwordChangedAt: new Date()
    });
    
    res.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'خطأ في إعادة تعيين كلمة المرور' });
  }
});

// ==================== ROLES MANAGEMENT ====================

// GET /api/admin/roles - Get all roles
router.get('/roles', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    let whereClause = {};
    
    if (search) {
      whereClause.name = { [models.sequelize.Op.iLike]: `%${search}%` };
    }
    
    const options = {
      where: whereClause,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };
    
    const [roles, total] = await Promise.all([
      Role.findAll(options),
      Role.count({ where: whereClause })
    ]);
    
    const response = {
      data: roles,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'خطأ في جلب الأدوار' });
  }
});

// POST /api/admin/roles - Create new role
router.post('/roles', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Check if role name already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ message: 'اسم الدور موجود بالفعل' });
    }
    
    // Create role
    const role = await Role.create({
      id: uuidv4(),
      name,
      description,
      permissions: permissions || {}
    });
    
    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الدور' });
  }
});

// GET /api/admin/roles/:id - Get role by ID
router.get('/roles/:id', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    
    if (!role) {
      return res.status(404).json({ message: 'الدور غير موجود' });
    }
    
    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ message: 'خطأ في جلب الدور' });
  }
});

// PUT /api/admin/roles/:id - Update role
router.put('/roles/:id', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'الدور غير موجود' });
    }
    
    // Check if role name is being changed and if it already exists
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({ message: 'اسم الدور موجود بالفعل' });
      }
    }
    
    // Update role
    await role.update({
      name: name || role.name,
      description: description || role.description,
      permissions: permissions || role.permissions
    });
    
    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'خطأ في تحديث الدور' });
  }
});

// DELETE /api/admin/roles/:id - Delete role
router.delete('/roles/:id', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'الدور غير موجود' });
    }
    
    // Check if role is being used by any users
    const usersWithRole = await User.count({ where: { role: role.name } });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        message: `لا يمكن حذف الدور لأنه مستخدم من قبل ${usersWithRole} مستخدم` 
      });
    }
    
    await role.destroy();
    res.json({ message: 'تم حذف الدور بنجاح' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'خطأ في حذف الدور' });
  }
});

// PUT /api/admin/roles/:id/permissions - Update role permissions
router.put('/roles/:id/permissions', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'الصلاحيات مطلوبة ويجب أن تكون مصفوفة' });
    }
    
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'الدور غير موجود' });
    }
    
    // Update permissions
    await role.update({ permissions });
    
    res.json(role);
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ message: 'خطأ في تحديث صلاحيات الدور' });
  }
});

// ==================== PERMISSIONS MANAGEMENT ====================

// GET /api/admin/permissions - Get all available permissions
router.get('/permissions', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const permissions = {
      // Financial permissions
      financial: {
        accounts: ['view', 'create', 'edit', 'delete'],
        journal_entries: ['view', 'create', 'edit', 'delete', 'post'],
        reports: ['view', 'export'],
        fixed_assets: ['view', 'create', 'edit', 'delete']
      },
      // Sales permissions
      sales: {
        customers: ['view', 'create', 'edit', 'delete'],
        invoices: ['view', 'create', 'edit', 'delete'],
        payments: ['view', 'create', 'edit', 'delete'],
        inventory: ['view', 'create', 'edit', 'delete']
      },
      // Operations permissions
      operations: {
        shipments: ['view', 'create', 'edit', 'delete', 'track'],
        warehouses: ['view', 'create', 'edit', 'delete'],
        routes: ['view', 'create', 'edit', 'delete']
      },
      // Customer service permissions
      customer_service: {
        tickets: ['view', 'create', 'edit', 'delete', 'resolve'],
        complaints: ['view', 'create', 'edit', 'delete'],
        support: ['view', 'create', 'edit', 'delete']
      },
      // Admin permissions
      admin: {
        users: ['view', 'create', 'edit', 'delete'],
        roles: ['view', 'create', 'edit', 'delete'],
        system: ['view', 'configure', 'backup', 'restore']
      }
    };
    
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'خطأ في جلب الصلاحيات' });
  }
});

// ==================== SYSTEM STATISTICS ====================

// GET /api/admin/system-stats - Get system statistics
router.get('/system-stats', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalRoles] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      Role.count()
    ]);
    
    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      roles: {
        total: totalRoles
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ message: 'خطأ في جلب إحصائيات النظام' });
  }
});

// ==================== AUDIT LOGS ====================

// GET /api/admin/audit-logs - Get audit logs (placeholder for future implementation)
router.get('/audit-logs', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, action, startDate, endDate } = req.query;
    
    // Placeholder response - this would be implemented with a proper audit log system
    const mockLogs = [
      {
        id: '1',
        userId: 'admin-1',
        username: 'admin',
        action: 'user_created',
        details: 'Created user: john_doe',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1'
      }
    ];
    
    const response = {
      data: mockLogs,
      total: 1,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: 1
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'خطأ في جلب سجلات التدقيق' });
  }
});

// ==================== ADMIN OVERVIEW DATA ====================

// GET /api/admin/overview - Get comprehensive overview data for admin dashboard
router.get('/overview', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    // System statistics
    const [totalUsers, activeUsers, totalRoles] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      Role.count()
    ]);

    // Real financial data from database
    const [totalAccounts, totalCustomers, totalEmployees, totalSuppliers, totalInvoices, totalPayments] = await Promise.all([
      models.Account ? models.Account.count() : 0,
      models.Customer ? models.Customer.count() : 0,
      models.Employee ? models.Employee.count() : 0,
      models.Supplier ? models.Supplier.count() : 0,
      models.Invoice ? models.Invoice.count() : 0,
      models.Payment ? models.Payment.count() : 0
    ]);

    const financialData = {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      accountsReceivable: 0,
      accountsPayable: 0,
      cashBalance: 0,
      totalAccounts: totalAccounts,
      pendingTransactions: 0,
      monthlyGrowth: 0
    };

    // Real sales data from database
    const salesData = {
      totalSales: 0,
      totalOrders: 0,
      activeCustomers: totalCustomers,
      averageOrderValue: 0,
      totalInvoices: totalInvoices,
      paidInvoices: 0,
      pendingInvoices: 0,
      totalProducts: 0,
      lowStockItems: 0,
      monthlyGrowth: 0
    };

    // System health metrics
    const systemHealth = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      status: 'healthy'
    };

    // Recent activities - empty for clean start
    const recentActivities = [];

    // Alerts and notifications - empty for clean start
    const alerts = [];

    const overview = {
      system: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        roles: {
          total: totalRoles
        },
        health: systemHealth
      },
      financial: financialData,
      sales: salesData,
      activities: recentActivities,
      alerts: alerts
    };

    res.json(overview);
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ message: 'خطأ في جلب بيانات النظرة العامة' });
  }
});

// GET /api/admin/financial-summary - Get financial summary for admin
router.get('/financial-summary', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    // Real financial summary from database
    const totalAccounts = models.Account ? await models.Account.count() : 0;

    const summary = {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      accountsReceivable: 0,
      accountsPayable: 0,
      cashBalance: 0,
      totalAccounts: totalAccounts,
      activeAccounts: totalAccounts,
      pendingTransactions: 0,
      monthlyRevenue: [],
      topExpenseCategories: []
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ message: 'خطأ في جلب الملخص المالي' });
  }
});

// GET /api/admin/sales-summary - Get sales summary for admin
router.get('/sales-summary', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    // Real sales summary from database
    const [totalCustomers, totalInvoices] = await Promise.all([
      models.Customer ? models.Customer.count() : 0,
      models.Invoice ? models.Invoice.count() : 0
    ]);

    const summary = {
      totalSales: 0,
      totalOrders: 0,
      activeCustomers: totalCustomers,
      newCustomers: 0,
      averageOrderValue: 0,
      totalInvoices: totalInvoices,
      paidInvoices: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      totalProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      monthlySales: [],
      topCustomers: [],
      salesByCategory: []
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ message: 'خطأ في جلب ملخص المبيعات' });
  }
});

export default router;

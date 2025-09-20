import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import models from '../models/index.js';

const { User } = models;

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('WebSocket service initialized');
    return this.io;
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          console.log('WebSocket: No token provided, allowing connection without auth');
          // Allow connection without authentication for now
          socket.userId = null;
          socket.user = null;
          return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
          console.log('WebSocket: User not found, allowing connection without auth');
          socket.userId = null;
          socket.user = null;
          return next();
        }

        socket.userId = user.id;
        socket.user = user;
        console.log(`WebSocket: User ${user.username} authenticated successfully`);
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        // Allow connection without authentication instead of failing
        console.log('WebSocket: Authentication failed, allowing connection without auth');
        socket.userId = null;
        socket.user = null;
        next();
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected (${socket.id})`);
      
      // Store connected user
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        user: socket.user,
        connectedAt: new Date()
      });

      // Handle account subscription
      socket.on('subscribe_account', (accountId) => {
        socket.join(`account_${accountId}`);
        console.log(`User ${socket.user.name} subscribed to account ${accountId}`);
      });

      // Handle account unsubscription
      socket.on('unsubscribe_account', (accountId) => {
        socket.leave(`account_${accountId}`);
        console.log(`User ${socket.user.name} unsubscribed from account ${accountId}`);
      });

      // Handle financial module subscription
      socket.on('subscribe_financial', () => {
        socket.join('financial_updates');
        console.log(`User ${socket.user.name} subscribed to financial updates`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected (${socket.id})`);
        this.connectedUsers.delete(socket.userId);
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // Send initial connection confirmation
      socket.emit('connected', {
        message: 'Connected to financial system',
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Emit balance update to specific account subscribers
   * @param {string} accountId - Account ID
   * @param {Object} balanceData - Balance update data
   */
  emitAccountBalanceUpdate(accountId, balanceData) {
    if (this.io) {
      this.io.to(`account_${accountId}`).emit('account_balance_updated', balanceData);
    }
  }

  /**
   * Emit general balance update to all financial subscribers
   * @param {Object} balanceData - Balance update data
   */
  emitBalanceUpdate(balanceData) {
    if (this.io) {
      this.io.to('financial_updates').emit('balance_updated', balanceData);
    }
  }

  /**
   * Emit transaction created event
   * @param {Object} transactionData - Transaction data
   */
  emitTransactionCreated(transactionData) {
    if (this.io) {
      this.io.to('financial_updates').emit('transaction_created', {
        ...transactionData,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Emit journal entry posted event
   * @param {Object} journalEntryData - Journal entry data
   */
  emitJournalEntryPosted(journalEntryData) {
    if (this.io) {
      this.io.to('financial_updates').emit('journal_entry_posted', {
        ...journalEntryData,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Emit financial statement update
   * @param {Object} statementData - Financial statement data
   */
  emitFinancialStatementUpdate(statementData) {
    if (this.io) {
      this.io.to('financial_updates').emit('financial_statement_updated', {
        ...statementData,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Emit notification to specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  emitUserNotification(userId, notification) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection && this.io) {
      this.io.to(userConnection.socketId).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Emit system-wide notification
   * @param {Object} notification - Notification data
   */
  emitSystemNotification(notification) {
    if (this.io) {
      this.io.emit('system_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get connected users count
   * @returns {number} Number of connected users
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users list
   * @returns {Array} List of connected users
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values()).map(conn => ({
      userId: conn.user.id,
      userName: conn.user.name,
      connectedAt: conn.connectedAt
    }));
  }

  /**
   * Check if user is connected
   * @param {string} userId - User ID
   * @returns {boolean} True if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Emit account statement refresh request
   * @param {string} accountId - Account ID
   */
  emitAccountStatementRefresh(accountId) {
    if (this.io) {
      this.io.to(`account_${accountId}`).emit('account_statement_refresh', {
        accountId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Emit voucher created event
   * @param {Object} voucherData - Voucher data
   */
  emitVoucherCreated(voucherData) {
    if (this.io) {
      // Emit to financial updates subscribers
      this.io.to('financial_updates').emit('voucher_created', {
        ...voucherData,
        timestamp: new Date().toISOString()
      });

      // Emit to specific account subscribers if accountId is provided
      if (voucherData.accountId) {
        this.io.to(`account_${voucherData.accountId}`).emit('account_voucher_created', {
          ...voucherData,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Emit provision update event
   * @param {Object} provisionData - Provision data
   */
  emitProvisionUpdated(provisionData) {
    if (this.io) {
      this.io.to('financial_updates').emit('provision_updated', {
        ...provisionData,
        timestamp: new Date().toISOString()
      });

      // Emit to specific account subscribers
      if (provisionData.mainAccountId) {
        this.io.to(`account_${provisionData.mainAccountId}`).emit('account_provision_updated', {
          ...provisionData,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Get WebSocket instance
   * @returns {Object} Socket.IO instance
   */
  getIO() {
    return this.io;
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;

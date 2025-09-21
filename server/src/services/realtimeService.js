import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import cacheService from './cacheService.js';

class RealtimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.roomSubscriptions = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    logger.info('🚀 Realtime service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`👤 User connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data) => {
        const { userId, role } = data;
        this.connectedUsers.set(socket.id, { userId, role, socket });
        
        // Join user to role-based room
        socket.join(`role:${role}`);
        socket.join(`user:${userId}`);
        
        logger.info(`🔐 User ${userId} authenticated with role ${role}`);
      });

      // Handle room subscriptions
      socket.on('subscribe', (room) => {
        socket.join(room);
        this.roomSubscriptions.set(socket.id, room);
        logger.debug(`📺 User ${socket.id} subscribed to room: ${room}`);
      });

      // Handle room unsubscriptions
      socket.on('unsubscribe', (room) => {
        socket.leave(room);
        this.roomSubscriptions.delete(socket.id);
        logger.debug(`📺 User ${socket.id} unsubscribed from room: ${room}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        this.roomSubscriptions.delete(socket.id);
        logger.info(`👋 User disconnected: ${socket.id}`);
      });

      // Handle custom events
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      logger.debug(`📢 Broadcasted event: ${event}`);
    }
  }

  // Broadcast to specific room
  broadcastToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      logger.debug(`📢 Broadcasted to room ${room}: ${event}`);
    }
  }

  // Broadcast to specific user
  broadcastToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      logger.debug(`📢 Broadcasted to user ${userId}: ${event}`);
    }
  }

  // Broadcast to users with specific role
  broadcastToRole(role, event, data) {
    if (this.io) {
      this.io.to(`role:${role}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      logger.debug(`📢 Broadcasted to role ${role}: ${event}`);
    }
  }

  // Financial updates
  async notifyFinancialUpdate(type, data) {
    // Invalidate related cache
    await cacheService.invalidatePattern('financial:*');
    
    // Broadcast to financial users
    this.broadcastToRole('financial', 'financial_update', {
      type,
      data
    });

    // Broadcast to admin users
    this.broadcastToRole('admin', 'financial_update', {
      type,
      data
    });

    logger.info(`💰 Financial update broadcasted: ${type}`);
  }

  // Sales updates
  async notifySalesUpdate(type, data) {
    // Invalidate related cache
    await cacheService.invalidatePattern('sales:*');
    
    // Broadcast to sales users
    this.broadcastToRole('sales', 'sales_update', {
      type,
      data
    });

    // Broadcast to admin users
    this.broadcastToRole('admin', 'sales_update', {
      type,
      data
    });

    logger.info(`🛒 Sales update broadcasted: ${type}`);
  }

  // System updates
  notifySystemUpdate(type, data) {
    this.broadcast('system_update', {
      type,
      data
    });
    logger.info(`⚙️ System update broadcasted: ${type}`);
  }

  // Notification updates
  notifyNotification(userId, notification) {
    this.broadcastToUser(userId, 'notification', notification);
    logger.info(`🔔 Notification sent to user ${userId}`);
  }

  // Dashboard updates
  async notifyDashboardUpdate(type, data) {
    // Invalidate dashboard cache
    await cacheService.invalidatePattern('dashboard:*');
    
    // Broadcast to all connected users
    this.broadcast('dashboard_update', {
      type,
      data
    });

    logger.info(`📊 Dashboard update broadcasted: ${type}`);
  }

  // Real-time analytics
  async notifyAnalyticsUpdate(type, data) {
    // Invalidate analytics cache
    await cacheService.invalidatePattern('analytics:*');
    
    // Broadcast to admin and financial users
    this.broadcastToRole('admin', 'analytics_update', {
      type,
      data
    });
    
    this.broadcastToRole('financial', 'analytics_update', {
      type,
      data
    });

    logger.info(`📈 Analytics update broadcasted: ${type}`);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get users by role
  getUsersByRole(role) {
    const users = [];
    for (const [socketId, userData] of this.connectedUsers) {
      if (userData.role === role) {
        users.push(userData);
      }
    }
    return users;
  }

  // Get room subscribers count
  getRoomSubscribersCount(roomName) {
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return room ? room.size : 0;
  }

  // Health check
  getHealthStatus() {
    return {
      connected: this.io ? true : false,
      connectedUsers: this.connectedUsers.size,
      rooms: Array.from(this.roomSubscriptions.values()),
      uptime: process.uptime()
    };
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;

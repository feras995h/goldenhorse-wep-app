import NotificationService from '../services/NotificationService.js';

/**
 * Middleware to track failed login attempts and create security notifications
 */
export const trackFailedLogin = async (req, res, next) => {
  // Store original res.status and res.json methods
  const originalStatus = res.status;
  const originalJson = res.json;

  // Override res.status to capture status code
  let statusCode = 200;
  res.status = function(code) {
    statusCode = code;
    return originalStatus.call(this, code);
  };

  // Override res.json to check for failed login
  res.json = async function(data) {
    // Check if this is a failed login attempt (401 status)
    if (statusCode === 401 && req.path === '/login') {
      try {
        const ip = req.ip || req.connection.remoteAddress || 'Unknown';
        const userAgent = req.get('User-Agent') || 'Unknown';
        
        await NotificationService.notifySecurityEvent('failed_login', {
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
          username: req.body?.username || 'Unknown',
          message: `محاولة تسجيل دخول فاشلة من IP: ${ip}`
        });
      } catch (error) {
        console.error('Error creating failed login notification:', error);
      }
    }
    
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware to track successful logins and create notifications
 */
export const trackSuccessfulLogin = async (req, res, next) => {
  // This should be called after successful authentication
  if (req.user && req.path === '/login') {
    try {
      const ip = req.ip || req.connection.remoteAddress || 'Unknown';
      const userAgent = req.get('User-Agent') || 'Unknown';
      
      // Only notify if login is from a new IP or device
      // For now, we'll create a simple login notification
      await NotificationService.createUserNotification(req.user.userId, {
        title: 'تسجيل دخول جديد',
        message: `تم تسجيل دخول جديد لحسابك من IP: ${ip}`,
        type: 'info',
        priority: 'low',
        category: 'security',
        metadata: {
          ip,
          userAgent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error creating login notification:', error);
    }
  }
  
  next();
};

/**
 * Middleware to track password changes
 */
export const trackPasswordChange = async (userId, details = {}) => {
  try {
    await NotificationService.notifySecurityEvent('password_changed', {
      userId,
      username: details.username || 'Unknown',
      timestamp: new Date().toISOString(),
      changedBy: details.changedBy || 'User',
      message: `تم تغيير كلمة المرور للمستخدم: ${details.username || 'Unknown'}`
    });
  } catch (error) {
    console.error('Error creating password change notification:', error);
  }
};

/**
 * Middleware to track suspicious activities
 */
export const trackSuspiciousActivity = async (activityType, details = {}) => {
  try {
    await NotificationService.notifySecurityEvent('suspicious_activity', {
      activityType,
      timestamp: new Date().toISOString(),
      ...details
    });
  } catch (error) {
    console.error('Error creating suspicious activity notification:', error);
  }
};

/**
 * Rate limiting middleware that creates notifications for potential attacks
 */
export const rateLimitNotification = (req, res, next) => {
  // This would be used with express-rate-limit
  // When rate limit is exceeded, create a security notification
  const originalSend = res.send;
  
  res.send = async function(data) {
    if (res.statusCode === 429) { // Too Many Requests
      try {
        const ip = req.ip || req.connection.remoteAddress || 'Unknown';
        
        await NotificationService.notifySecurityEvent('suspicious_activity', {
          activityType: 'rate_limit_exceeded',
          ip,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          message: `تم تجاوز حد الطلبات المسموح من IP: ${ip}`
        });
      } catch (error) {
        console.error('Error creating rate limit notification:', error);
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

export default {
  trackFailedLogin,
  trackSuccessfulLogin,
  trackPasswordChange,
  trackSuspiciousActivity,
  rateLimitNotification
};

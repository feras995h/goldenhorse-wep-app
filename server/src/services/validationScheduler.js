import cron from 'node-cron';
import AccountingValidationOrchestrator from './accountingValidationOrchestrator.js';
import { sendEmail } from '../utils/emailService.js'; // Assuming you have email service
import { createNotification } from '../utils/notificationService.js'; // Assuming notification service

/**
 * نظام جدولة المراجعات التلقائية للمحرك المحاسبي
 * يدير جدولة وتشغيل المراجعات الدورية وإرسال التقارير
 */
class ValidationScheduler {
  
  constructor() {
    this.validationOrchestrator = new AccountingValidationOrchestrator();
    this.scheduledTasks = new Map();
    this.alertSettings = {
      criticalThreshold: 3, // Number of critical issues that trigger alert
      scoreThreshold: 70,   // Score percentage below which alert is sent
      emailNotifications: true,
      systemNotifications: true
    };
    this.reportHistory = [];
  }

  /**
   * إنشاء مهمة جدولة جديدة
   */
  createScheduledValidation(config) {
    const {
      name,
      cronExpression,
      validationOptions = {},
      alertSettings = {},
      notificationSettings = {},
      enabled = true
    } = config;

    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    const taskId = `SCHED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const taskConfig = {
      id: taskId,
      name: name || `Scheduled Validation ${taskId}`,
      cronExpression,
      validationOptions: {
        includePerformanceTests: false,
        generateDetailedReport: true,
        validateHistoricalData: false,
        ...validationOptions
      },
      alertSettings: {
        ...this.alertSettings,
        ...alertSettings
      },
      notificationSettings: {
        emailRecipients: [],
        webhookUrl: null,
        slackChannel: null,
        ...notificationSettings
      },
      enabled,
      createdAt: new Date(),
      lastRun: null,
      nextRun: null,
      runCount: 0,
      task: null
    };

    if (enabled) {
      taskConfig.task = this.scheduleTask(taskConfig);
      taskConfig.nextRun = this.getNextRunTime(cronExpression);
    }

    this.scheduledTasks.set(taskId, taskConfig);
    
    console.log(`✅ Scheduled validation created: ${name} (${cronExpression})`);
    
    return taskId;
  }

  /**
   * جدولة المهمة الفعلية
   */
  scheduleTask(taskConfig) {
    return cron.schedule(taskConfig.cronExpression, async () => {
      await this.executeScheduledValidation(taskConfig.id);
    }, {
      scheduled: false,
      timezone: 'Africa/Tripoli' // Libya timezone
    });
  }

  /**
   * تشغيل مراجعة مجدولة
   */
  async executeScheduledValidation(taskId) {
    const taskConfig = this.scheduledTasks.get(taskId);
    
    if (!taskConfig || !taskConfig.enabled) {
      return;
    }

    try {
      console.log(`🚀 Executing scheduled validation: ${taskConfig.name}`);
      
      const startTime = new Date();
      taskConfig.lastRun = startTime;
      taskConfig.runCount++;
      
      // Run the validation
      const validationSession = await this.validationOrchestrator
        .performFullAccountingFlowValidation(taskConfig.validationOptions);
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      // Create validation report
      const report = await this.generateScheduledValidationReport(
        taskConfig,
        validationSession,
        duration
      );
      
      // Store report in history
      this.reportHistory.push(report);
      
      // Keep only last 100 reports
      if (this.reportHistory.length > 100) {
        this.reportHistory = this.reportHistory.slice(-100);
      }
      
      // Check if alerts should be sent
      await this.checkAndSendAlerts(taskConfig, validationSession, report);
      
      // Update next run time
      taskConfig.nextRun = this.getNextRunTime(taskConfig.cronExpression);
      
      console.log(`✅ Scheduled validation completed: ${taskConfig.name} (${duration}ms)`);
      
    } catch (error) {
      console.error(`❌ Scheduled validation failed: ${taskConfig.name}`, error);
      
      // Send error notification
      await this.sendErrorNotification(taskConfig, error);
    }
  }

  /**
   * إنتاج تقرير المراجعة المجدولة
   */
  async generateScheduledValidationReport(taskConfig, validationSession, duration) {
    const report = {
      id: `REPORT_${Date.now()}`,
      taskId: taskConfig.id,
      taskName: taskConfig.name,
      executionTime: taskConfig.lastRun,
      duration,
      validationSessionId: validationSession.sessionId,
      overallStatus: validationSession.results.overallStatus,
      score: validationSession.results.score,
      maxScore: validationSession.results.maxScore,
      scorePercentage: ((validationSession.results.score / validationSession.results.maxScore) * 100).toFixed(2),
      criticalIssuesCount: validationSession.results.criticalIssues.length,
      warningsCount: validationSession.results.warnings.length,
      recommendationsCount: validationSession.results.recommendations.length,
      moduleResults: {},
      summary: {
        healthy: validationSession.results.overallStatus !== 'critical' && validationSession.results.overallStatus !== 'error',
        requiresAttention: validationSession.results.criticalIssues.length > 0,
        improvementNeeded: parseFloat(((validationSession.results.score / validationSession.results.maxScore) * 100).toFixed(2)) < 80
      }
    };

    // Extract module results summary
    Object.entries(validationSession.results.validationModules).forEach(([moduleName, moduleResult]) => {
      report.moduleResults[moduleName] = {
        status: moduleResult.status,
        score: moduleResult.score,
        maxScore: moduleResult.maxScore,
        scorePercentage: ((moduleResult.score / moduleResult.maxScore) * 100).toFixed(2)
      };
    });

    return report;
  }

  /**
   * فحص وإرسال التنبيهات
   */
  async checkAndSendAlerts(taskConfig, validationSession, report) {
    const shouldAlert = this.shouldSendAlert(taskConfig, validationSession);
    
    if (shouldAlert.critical || shouldAlert.warning) {
      await this.sendValidationAlert(taskConfig, validationSession, report, shouldAlert);
    }
  }

  /**
   * تحديد ما إذا كان يجب إرسال تنبيه
   */
  shouldSendAlert(taskConfig, validationSession) {
    const criticalIssuesCount = validationSession.results.criticalIssues.length;
    const scorePercentage = (validationSession.results.score / validationSession.results.maxScore) * 100;
    const overallStatus = validationSession.results.overallStatus;
    
    const result = {
      critical: false,
      warning: false,
      reasons: []
    };

    // Critical alerts
    if (criticalIssuesCount >= taskConfig.alertSettings.criticalThreshold) {
      result.critical = true;
      result.reasons.push(`${criticalIssuesCount} critical issues detected`);
    }

    if (overallStatus === 'critical' || overallStatus === 'error') {
      result.critical = true;
      result.reasons.push(`System status is ${overallStatus}`);
    }

    if (scorePercentage < taskConfig.alertSettings.scoreThreshold) {
      result.critical = true;
      result.reasons.push(`Health score is ${scorePercentage.toFixed(2)}% (below ${taskConfig.alertSettings.scoreThreshold}%)`);
    }

    // Warning alerts
    if (!result.critical) {
      if (criticalIssuesCount > 0) {
        result.warning = true;
        result.reasons.push(`${criticalIssuesCount} critical issues found`);
      }

      if (overallStatus === 'poor') {
        result.warning = true;
        result.reasons.push('System health is poor');
      }

      if (validationSession.results.warnings.length > 5) {
        result.warning = true;
        result.reasons.push(`${validationSession.results.warnings.length} warnings detected`);
      }
    }

    return result;
  }

  /**
   * إرسال تنبيه المراجعة
   */
  async sendValidationAlert(taskConfig, validationSession, report, alertInfo) {
    const alertLevel = alertInfo.critical ? 'CRITICAL' : 'WARNING';
    const subject = `🚨 Accounting System ${alertLevel} Alert - ${taskConfig.name}`;
    
    const emailContent = this.generateAlertEmailContent(
      taskConfig, 
      validationSession, 
      report, 
      alertInfo
    );

    // Send email notifications
    if (taskConfig.alertSettings.emailNotifications && 
        taskConfig.notificationSettings.emailRecipients.length > 0) {
      
      try {
        await sendEmail({
          to: taskConfig.notificationSettings.emailRecipients,
          subject,
          html: emailContent,
          priority: alertInfo.critical ? 'high' : 'normal'
        });
        
        console.log(`📧 Alert email sent for ${taskConfig.name}`);
      } catch (error) {
        console.error('Failed to send alert email:', error);
      }
    }

    // Send system notifications
    if (taskConfig.alertSettings.systemNotifications) {
      try {
        await createNotification({
          type: alertInfo.critical ? 'critical' : 'warning',
          title: subject,
          message: `Validation ${taskConfig.name} detected ${alertInfo.reasons.join(', ')}`,
          data: {
            taskId: taskConfig.id,
            validationSessionId: validationSession.sessionId,
            reportId: report.id
          }
        });
        
        console.log(`🔔 System notification created for ${taskConfig.name}`);
      } catch (error) {
        console.error('Failed to create system notification:', error);
      }
    }

    // Send webhook notifications
    if (taskConfig.notificationSettings.webhookUrl) {
      try {
        await this.sendWebhookNotification(
          taskConfig.notificationSettings.webhookUrl,
          {
            alertLevel,
            taskName: taskConfig.name,
            validationSession,
            report,
            alertReasons: alertInfo.reasons
          }
        );
        
        console.log(`🔗 Webhook notification sent for ${taskConfig.name}`);
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }
  }

  /**
   * إنتاج محتوى البريد الإلكتروني للتنبيه
   */
  generateAlertEmailContent(taskConfig, validationSession, report, alertInfo) {
    const alertLevel = alertInfo.critical ? 'CRITICAL' : 'WARNING';
    const statusColor = alertInfo.critical ? '#dc3545' : '#ffc107';
    const textColor = alertInfo.critical ? '#721c24' : '#856404';
    
    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تنبيه النظام المحاسبي</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-info { background-color: ${statusColor}20; border-left: 4px solid ${statusColor}; padding: 15px; margin: 15px 0; color: ${textColor}; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-card { background-color: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #495057; }
          .stat-label { font-size: 12px; color: #6c757d; margin-top: 5px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 تنبيه النظام المحاسبي</h1>
            <h2>${alertLevel} ALERT</h2>
          </div>
          
          <div class="content">
            <h3>تفاصيل التنبيه</h3>
            <p><strong>اسم المهمة:</strong> ${taskConfig.name}</p>
            <p><strong>وقت التنفيذ:</strong> ${report.executionTime.toLocaleString('ar-EG')}</p>
            <p><strong>مدة التنفيذ:</strong> ${report.duration}ms</p>
            
            <div class="alert-info">
              <h4>أسباب التنبيه:</h4>
              <ul>
                ${alertInfo.reasons.map(reason => `<li>${reason}</li>`).join('')}
              </ul>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number" style="color: ${statusColor};">${report.scorePercentage}%</div>
                <div class="stat-label">نتيجة الصحة العامة</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${report.criticalIssuesCount}</div>
                <div class="stat-label">مشاكل حرجة</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${report.warningsCount}</div>
                <div class="stat-label">تحذيرات</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${report.recommendationsCount}</div>
                <div class="stat-label">توصيات</div>
              </div>
            </div>
            
            <h4>نتائج الوحدات:</h4>
            <ul>
              ${Object.entries(report.moduleResults).map(([module, result]) => 
                `<li><strong>${module}:</strong> ${result.status} (${result.scorePercentage}%)</li>`
              ).join('')}
            </ul>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 6px;">
              <p><strong>الإجراءات المطلوبة:</strong></p>
              <ul>
                <li>مراجعة المشاكل الحرجة فوراً</li>
                <li>تطبيق التوصيات المقترحة</li>
                <li>مراقبة النظام عن كثب</li>
                <li>الاتصال بالدعم الفني إذا لزم الأمر</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام مراقبة المحرك المحاسبي</p>
            <p>Session ID: ${validationSession.sessionId}</p>
            <p>Report ID: ${report.id}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * إرسال تنبيه الأخطاء
   */
  async sendErrorNotification(taskConfig, error) {
    const subject = `❌ Scheduled Validation Error - ${taskConfig.name}`;
    
    try {
      // Create system notification
      await createNotification({
        type: 'error',
        title: subject,
        message: `Scheduled validation "${taskConfig.name}" failed: ${error.message}`,
        data: {
          taskId: taskConfig.id,
          error: error.stack
        }
      });
      
      // Send email if configured
      if (taskConfig.notificationSettings.emailRecipients.length > 0) {
        const errorEmailContent = `
          <h2>خطأ في المراجعة المجدولة</h2>
          <p><strong>اسم المهمة:</strong> ${taskConfig.name}</p>
          <p><strong>وقت الخطأ:</strong> ${new Date().toLocaleString('ar-EG')}</p>
          <p><strong>رسالة الخطأ:</strong> ${error.message}</p>
          <pre>${error.stack}</pre>
        `;
        
        await sendEmail({
          to: taskConfig.notificationSettings.emailRecipients,
          subject,
          html: errorEmailContent,
          priority: 'high'
        });
      }
      
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
  }

  /**
   * إرسال تنبيه Webhook
   */
  async sendWebhookNotification(webhookUrl, data) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'accounting-validation-system',
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * تفعيل مهمة مجدولة
   */
  enableTask(taskId) {
    const taskConfig = this.scheduledTasks.get(taskId);
    
    if (!taskConfig) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (!taskConfig.enabled) {
      taskConfig.enabled = true;
      taskConfig.task = this.scheduleTask(taskConfig);
      taskConfig.task.start();
      taskConfig.nextRun = this.getNextRunTime(taskConfig.cronExpression);
      
      console.log(`✅ Task enabled: ${taskConfig.name}`);
    }

    return taskConfig;
  }

  /**
   * تعطيل مهمة مجدولة
   */
  disableTask(taskId) {
    const taskConfig = this.scheduledTasks.get(taskId);
    
    if (!taskConfig) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (taskConfig.enabled && taskConfig.task) {
      taskConfig.task.stop();
      taskConfig.enabled = false;
      taskConfig.nextRun = null;
      
      console.log(`⏹️ Task disabled: ${taskConfig.name}`);
    }

    return taskConfig;
  }

  /**
   * حذف مهمة مجدولة
   */
  deleteTask(taskId) {
    const taskConfig = this.scheduledTasks.get(taskId);
    
    if (!taskConfig) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (taskConfig.task) {
      taskConfig.task.destroy();
    }

    this.scheduledTasks.delete(taskId);
    
    console.log(`🗑️ Task deleted: ${taskConfig.name}`);
    
    return true;
  }

  /**
   * تحديث إعدادات مهمة
   */
  updateTask(taskId, updates) {
    const taskConfig = this.scheduledTasks.get(taskId);
    
    if (!taskConfig) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Stop current task if running
    if (taskConfig.task) {
      taskConfig.task.stop();
    }

    // Update configuration
    Object.assign(taskConfig, updates);

    // Validate new cron expression if updated
    if (updates.cronExpression && !cron.validate(updates.cronExpression)) {
      throw new Error(`Invalid cron expression: ${updates.cronExpression}`);
    }

    // Restart task with new settings if enabled
    if (taskConfig.enabled) {
      taskConfig.task = this.scheduleTask(taskConfig);
      taskConfig.task.start();
      taskConfig.nextRun = this.getNextRunTime(taskConfig.cronExpression);
    }

    console.log(`✏️ Task updated: ${taskConfig.name}`);
    
    return taskConfig;
  }

  /**
   * الحصول على قائمة المهام المجدولة
   */
  getTasks() {
    return Array.from(this.scheduledTasks.entries()).map(([id, config]) => ({
      id,
      name: config.name,
      cronExpression: config.cronExpression,
      enabled: config.enabled,
      createdAt: config.createdAt,
      lastRun: config.lastRun,
      nextRun: config.nextRun,
      runCount: config.runCount
    }));
  }

  /**
   * الحصول على تفاصيل مهمة محددة
   */
  getTask(taskId) {
    const taskConfig = this.scheduledTasks.get(taskId);
    
    if (!taskConfig) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return { ...taskConfig, task: undefined }; // Exclude the cron task object
  }

  /**
   * الحصول على سجل التقارير
   */
  getReportHistory(limit = 50) {
    return this.reportHistory.slice(-limit);
  }

  /**
   * الحصول على وقت التنفيذ التالي
   */
  getNextRunTime(cronExpression) {
    try {
      const task = cron.schedule(cronExpression, () => {}, { scheduled: false });
      // This is a simplified implementation - in a real scenario you'd use a proper cron parser
      return new Date(Date.now() + 60000); // Placeholder: next minute
    } catch (error) {
      return null;
    }
  }

  /**
   * بدء جميع المهام المفعلة
   */
  startAllTasks() {
    let startedCount = 0;
    
    this.scheduledTasks.forEach(taskConfig => {
      if (taskConfig.enabled && taskConfig.task) {
        taskConfig.task.start();
        startedCount++;
      }
    });

    console.log(`🚀 Started ${startedCount} scheduled validation tasks`);
    
    return startedCount;
  }

  /**
   * إيقاف جميع المهام
   */
  stopAllTasks() {
    let stoppedCount = 0;
    
    this.scheduledTasks.forEach(taskConfig => {
      if (taskConfig.task) {
        taskConfig.task.stop();
        stoppedCount++;
      }
    });

    console.log(`⏹️ Stopped ${stoppedCount} scheduled validation tasks`);
    
    return stoppedCount;
  }

  /**
   * إحصائيات المجدولة
   */
  getSchedulerStatistics() {
    const tasks = Array.from(this.scheduledTasks.values());
    
    return {
      totalTasks: tasks.length,
      enabledTasks: tasks.filter(t => t.enabled).length,
      disabledTasks: tasks.filter(t => !t.enabled).length,
      totalExecutions: tasks.reduce((sum, t) => sum + t.runCount, 0),
      reportsGenerated: this.reportHistory.length,
      lastExecution: tasks.reduce((latest, t) => {
        return !latest || (t.lastRun && t.lastRun > latest) ? t.lastRun : latest;
      }, null),
      nextExecution: tasks.reduce((earliest, t) => {
        return !earliest || (t.nextRun && t.nextRun < earliest) ? t.nextRun : earliest;
      }, null)
    };
  }
}

// Create singleton instance
const validationScheduler = new ValidationScheduler();

export default validationScheduler;
export { ValidationScheduler };
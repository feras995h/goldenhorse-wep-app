import express from 'express';
import AccountingValidationOrchestrator from '../services/accountingValidationOrchestrator.js';
import AccountingHealthMonitor from '../services/accountingHealthMonitor.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create a singleton instance of the orchestrator
const validationOrchestrator = new AccountingValidationOrchestrator();

/**
 * @route   POST /api/validation/full-accounting-flow
 * @desc    Run comprehensive accounting flow validation
 * @access  Admin only
 */
router.post('/full-accounting-flow', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const options = {
      includePerformanceTests: req.body.includePerformanceTests || false,
      generateDetailedReport: req.body.generateDetailedReport !== false,
      skipHealthyChecks: req.body.skipHealthyChecks || false,
      validateHistoricalData: req.body.validateHistoricalData || false,
      ...req.body.options
    };

    console.log(`🚀 Full accounting flow validation requested by user ${req.user.id}`);
    
    const validationSession = await validationOrchestrator.performFullAccountingFlowValidation(options);
    
    res.status(200).json({
      success: true,
      message: 'Full accounting flow validation completed',
      data: {
        sessionId: validationSession.sessionId,
        overallStatus: validationSession.results.overallStatus,
        scorePercentage: ((validationSession.results.score / validationSession.results.maxScore) * 100).toFixed(2),
        duration: validationSession.duration,
        summary: {
          totalModules: Object.keys(validationSession.results.validationModules).length,
          criticalIssues: validationSession.results.criticalIssues.length,
          warnings: validationSession.results.warnings.length,
          recommendations: validationSession.results.recommendations.length
        },
        results: validationSession.results,
        detailedReport: validationSession.detailedReport
      }
    });

  } catch (error) {
    console.error('Full accounting flow validation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Full accounting flow validation failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/validation/quick-check
 * @desc    Perform quick validation health check
 * @access  Admin, Manager, Accountant
 */
router.get('/quick-check', authenticate, authorize(['admin', 'manager', 'accountant']), async (req, res) => {
  try {
    const quickResults = await validationOrchestrator.quickValidationCheck();
    
    res.status(200).json({
      success: true,
      message: 'Quick validation check completed',
      data: quickResults
    });

  } catch (error) {
    console.error('Quick validation check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Quick validation check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/validation/system-health
 * @desc    Get comprehensive system health report
 * @access  Admin, Manager, Accountant
 */
router.get('/system-health', authenticate, authorize(['admin', 'manager', 'accountant']), async (req, res) => {
  try {
    const healthReport = await AccountingHealthMonitor.performComprehensiveHealthCheck();
    
    res.status(200).json({
      success: true,
      message: 'System health check completed',
      data: healthReport
    });

  } catch (error) {
    console.error('System health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'System health check failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/validation/module/:moduleName
 * @desc    Run specific validation module
 * @access  Admin only
 */
router.post('/module/:moduleName', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { moduleName } = req.params;
    const validModules = [
      'systemHealth',
      'dataConsistency', 
      'financialFlow',
      'integration',
      'businessRules',
      'performance',
      'historical'
    ];

    if (!validModules.includes(moduleName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid module name. Valid modules: ${validModules.join(', ')}`
      });
    }

    // Create a temporary session for single module validation
    const session = {
      sessionId: validationOrchestrator.generateSessionId(),
      startTime: new Date(),
      results: {
        criticalIssues: [],
        warnings: [],
        recommendations: []
      }
    };

    let moduleResults;
    
    switch (moduleName) {
      case 'systemHealth':
        moduleResults = await validationOrchestrator.runSystemHealthValidation(session);
        break;
      case 'dataConsistency':
        moduleResults = await validationOrchestrator.runDataConsistencyValidation(session);
        break;
      case 'financialFlow':
        moduleResults = await validationOrchestrator.runFinancialFlowValidation(session);
        break;
      case 'integration':
        moduleResults = await validationOrchestrator.runIntegrationValidation(session);
        break;
      case 'businessRules':
        moduleResults = await validationOrchestrator.runBusinessRulesValidation(session);
        break;
      case 'performance':
        moduleResults = await validationOrchestrator.runPerformanceValidation(session);
        break;
      case 'historical':
        moduleResults = await validationOrchestrator.runHistoricalDataValidation(session);
        break;
    }

    res.status(200).json({
      success: true,
      message: `${moduleName} validation completed`,
      data: {
        module: moduleName,
        results: moduleResults,
        sessionId: session.sessionId
      }
    });

  } catch (error) {
    console.error(`Module validation ${req.params.moduleName} failed:`, error);
    res.status(500).json({
      success: false,
      message: `Module validation failed`,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/validation/history
 * @desc    Get validation history
 * @access  Admin, Manager
 */
router.get('/history', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = validationOrchestrator.getValidationHistory(limit);
    
    // Remove detailed results for lighter response, keep only summary
    const historyLight = history.map(session => ({
      sessionId: session.sessionId,
      startTime: session.startTime,
      duration: session.duration,
      overallStatus: session.results?.overallStatus,
      scorePercentage: session.results?.maxScore > 0 ? 
        ((session.results.score / session.results.maxScore) * 100).toFixed(2) : '0',
      modulesCount: Object.keys(session.results?.validationModules || {}).length,
      criticalIssuesCount: session.results?.criticalIssues?.length || 0,
      warningsCount: session.results?.warnings?.length || 0
    }));

    res.status(200).json({
      success: true,
      message: 'Validation history retrieved',
      data: {
        history: historyLight,
        total: history.length
      }
    });

  } catch (error) {
    console.error('Failed to get validation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get validation history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/validation/history/:sessionId
 * @desc    Get detailed validation session results
 * @access  Admin, Manager
 */
router.get('/history/:sessionId', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = validationOrchestrator.getValidationHistory(50); // Get more history for search
    
    const session = history.find(s => s.sessionId === sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Validation session not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Validation session details retrieved',
      data: session
    });

  } catch (error) {
    console.error('Failed to get validation session details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get validation session details',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/validation/statistics
 * @desc    Get accounting system statistics
 * @access  Admin, Manager, Accountant
 */
router.get('/statistics', authenticate, authorize(['admin', 'manager', 'accountant']), async (req, res) => {
  try {
    const statistics = await AccountingHealthMonitor.gatherStatistics();
    
    res.status(200).json({
      success: true,
      message: 'System statistics retrieved',
      data: statistics
    });

  } catch (error) {
    console.error('Failed to get system statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/validation/schedule
 * @desc    Schedule periodic validation
 * @access  Admin only
 */
router.post('/schedule', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { cronExpression, options = {} } = req.body;
    
    if (!cronExpression) {
      return res.status(400).json({
        success: false,
        message: 'Cron expression is required'
      });
    }

    // Basic cron expression validation (simplified)
    const cronParts = cronExpression.split(' ');
    if (cronParts.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cron expression format'
      });
    }

    const scheduleId = await validationOrchestrator.scheduleValidation(cronExpression, {
      ...options,
      createdBy: req.user.id,
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Validation scheduled successfully',
      data: {
        scheduleId: scheduleId,
        cronExpression: cronExpression,
        options: options
      }
    });

  } catch (error) {
    console.error('Failed to schedule validation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule validation',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/validation/schedules
 * @desc    Get scheduled validations
 * @access  Admin only
 */
router.get('/schedules', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const schedules = validationOrchestrator.getScheduledValidations();
    
    res.status(200).json({
      success: true,
      message: 'Scheduled validations retrieved',
      data: schedules
    });

  } catch (error) {
    console.error('Failed to get scheduled validations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduled validations',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/validation/trial-balance
 * @desc    Validate trial balance
 * @access  Admin, Manager, Accountant
 */
router.post('/trial-balance', authenticate, authorize(['admin', 'manager', 'accountant']), async (req, res) => {
  try {
    const trialBalanceResults = await validationOrchestrator.validateTrialBalance();
    
    res.status(200).json({
      success: true,
      message: 'Trial balance validation completed',
      data: trialBalanceResults
    });

  } catch (error) {
    console.error('Trial balance validation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Trial balance validation failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/validation/dashboard
 * @desc    Get validation dashboard data
 * @access  Admin, Manager, Accountant
 */
router.get('/dashboard', authenticate, authorize(['admin', 'manager', 'accountant']), async (req, res) => {
  try {
    // Get quick validation check
    const quickCheck = await validationOrchestrator.quickValidationCheck();
    
    // Get last validation result
    const lastValidation = validationOrchestrator.getLastValidationResult();
    
    // Get recent history (last 5)
    const recentHistory = validationOrchestrator.getValidationHistory(5);
    
    // Get system statistics
    const statistics = await AccountingHealthMonitor.gatherStatistics();

    const dashboardData = {
      quickCheck: quickCheck,
      lastValidation: lastValidation ? {
        sessionId: lastValidation.sessionId,
        startTime: lastValidation.startTime,
        overallStatus: lastValidation.results?.overallStatus,
        scorePercentage: lastValidation.results?.maxScore > 0 ? 
          ((lastValidation.results.score / lastValidation.results.maxScore) * 100).toFixed(2) : '0',
        criticalIssuesCount: lastValidation.results?.criticalIssues?.length || 0,
        warningsCount: lastValidation.results?.warnings?.length || 0
      } : null,
      recentHistory: recentHistory.map(session => ({
        sessionId: session.sessionId,
        startTime: session.startTime,
        overallStatus: session.results?.overallStatus,
        scorePercentage: session.results?.maxScore > 0 ? 
          ((session.results.score / session.results.maxScore) * 100).toFixed(2) : '0'
      })),
      statistics: statistics
    };
    
    res.status(200).json({
      success: true,
      message: 'Validation dashboard data retrieved',
      data: dashboardData
    });

  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

export default router;
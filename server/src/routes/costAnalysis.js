import express from 'express';
import { Op } from 'sequelize';
import { authenticateToken, requireAccountingAccess } from '../middleware/auth.js';
import { sequelize } from '../models/index.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAccountingAccess);

/**
 * Get Activity-Based Costing (ABC) Analysis
 * Analyzes costs based on activities and cost drivers
 */
router.get('/abc-analysis', async (req, res) => {
  try {
    const { startDate, endDate, costCenter, activityType } = req.query;
    
    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Activity-based cost allocation query
    const abcAnalysis = await sequelize.query(`
      WITH activity_costs AS (
        SELECT 
          a.id as account_id,
          a.name as account_name,
          a.code as account_code,
          COALESCE(SUM(CASE WHEN je.type = 'debit' THEN je.amount ELSE 0 END), 0) as total_debits,
          COALESCE(SUM(CASE WHEN je.type = 'credit' THEN je.amount ELSE 0 END), 0) as total_credits,
          COALESCE(SUM(CASE WHEN je.type = 'debit' THEN je.amount ELSE -je.amount END), 0) as net_cost,
          COUNT(je.id) as transaction_count,
          a.category as cost_category
        FROM accounts a
        LEFT JOIN journal_entry_details je ON a.id = je."accountId"
        LEFT JOIN journal_entries j ON je."journalEntryId" = j.id
        WHERE j.date BETWEEN :startDate AND :endDate
          AND a.category IN ('expense', 'cost_of_goods_sold')
          ${costCenter ? 'AND a.cost_center = :costCenter' : ''}
        GROUP BY a.id, a.name, a.code, a.category
        HAVING COALESCE(SUM(CASE WHEN je.type = 'debit' THEN je.amount ELSE -je.amount END), 0) > 0
      ),
      cost_drivers AS (
        SELECT 
          ac.*,
          CASE 
            WHEN ac.cost_category = 'expense' THEN 
              CASE 
                WHEN ac.account_name LIKE '%salary%' OR ac.account_name LIKE '%wage%' THEN 'Labor Hours'
                WHEN ac.account_name LIKE '%rent%' OR ac.account_name LIKE '%facility%' THEN 'Square Footage'
                WHEN ac.account_name LIKE '%utility%' OR ac.account_name LIKE '%electric%' THEN 'Machine Hours'
                WHEN ac.account_name LIKE '%material%' OR ac.account_name LIKE '%supply%' THEN 'Material Usage'
                ELSE 'General Overhead'
              END
            ELSE 'Direct Cost'
          END as cost_driver,
          ROUND(ac.net_cost / NULLIF(ac.transaction_count, 0), 2) as cost_per_transaction
        FROM activity_costs ac
      )
      SELECT 
        cd.*,
        ROUND((cd.net_cost / (SELECT SUM(net_cost) FROM cost_drivers)) * 100, 2) as cost_percentage,
        CASE 
          WHEN cd.net_cost > (SELECT AVG(net_cost) * 1.5 FROM cost_drivers) THEN 'High'
          WHEN cd.net_cost > (SELECT AVG(net_cost) * 0.5 FROM cost_drivers) THEN 'Medium'
          ELSE 'Low'
        END as cost_impact_level
      FROM cost_drivers cd
      ORDER BY cd.net_cost DESC
    `, {
      replacements: { 
        startDate, 
        endDate,
        ...(costCenter && { costCenter })
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate summary metrics
    const summary = {
      totalCosts: abcAnalysis.reduce((sum, item) => sum + parseFloat(item.net_cost || 0), 0),
      totalActivities: abcAnalysis.length,
      highImpactActivities: abcAnalysis.filter(item => item.cost_impact_level === 'High').length,
      costDriverDistribution: {}
    };

    // Group by cost drivers
    abcAnalysis.forEach(item => {
      if (!summary.costDriverDistribution[item.cost_driver]) {
        summary.costDriverDistribution[item.cost_driver] = {
          count: 0,
          totalCost: 0,
          percentage: 0
        };
      }
      summary.costDriverDistribution[item.cost_driver].count++;
      summary.costDriverDistribution[item.cost_driver].totalCost += parseFloat(item.net_cost || 0);
    });

    // Calculate percentages for cost drivers
    Object.values(summary.costDriverDistribution).forEach(driver => {
      driver.percentage = summary.totalCosts > 0 ? 
        Math.round((driver.totalCost / summary.totalCosts) * 100 * 100) / 100 : 0;
    });

    res.json({
      success: true,
      data: {
        activities: abcAnalysis,
        summary,
        period: { startDate, endDate },
        filters: { costCenter, activityType }
      }
    });

  } catch (error) {
    console.error('Error in ABC analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ABC analysis',
      error: error.message
    });
  }
});

/**
 * Get Cost Allocation Analysis
 * Analyzes direct vs indirect cost allocation
 */
router.get('/cost-allocation', async (req, res) => {
  try {
    const { startDate, endDate, department, allocationMethod } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Cost allocation analysis
    const allocationAnalysis = await sequelize.query(`
      WITH cost_classification AS (
        SELECT 
          a.id as account_id,
          a.name as account_name,
          a.code as account_code,
          a.category,
          COALESCE(SUM(CASE WHEN je.type = 'debit' THEN je.amount ELSE 0 END), 0) as total_amount,
          CASE 
            WHEN a.name LIKE '%direct%' OR a.category = 'cost_of_goods_sold' THEN 'Direct'
            WHEN a.name LIKE '%overhead%' OR a.name LIKE '%admin%' OR a.name LIKE '%general%' THEN 'Indirect'
            WHEN a.category = 'expense' THEN 
              CASE 
                WHEN a.name LIKE '%salary%' OR a.name LIKE '%wage%' THEN 'Semi-Variable'
                WHEN a.name LIKE '%rent%' OR a.name LIKE '%insurance%' THEN 'Fixed Overhead'
                WHEN a.name LIKE '%utility%' OR a.name LIKE '%maintenance%' THEN 'Variable Overhead'
                ELSE 'General Overhead'
              END
            ELSE 'Other'
          END as cost_type,
          a.department,
          COUNT(je.id) as transaction_count
        FROM accounts a
        LEFT JOIN journal_entry_details je ON a.id = je."accountId"
        LEFT JOIN journal_entries j ON je."journalEntryId" = j.id
        WHERE j.date BETWEEN :startDate AND :endDate
          AND a.category IN ('expense', 'cost_of_goods_sold')
          ${department ? 'AND a.department = :department' : ''}
        GROUP BY a.id, a.name, a.code, a.category, a.department
        HAVING COALESCE(SUM(CASE WHEN je.type = 'debit' THEN je.amount ELSE 0 END), 0) > 0
      ),
      allocation_base AS (
        SELECT 
          department,
          COALESCE(SUM(CASE WHEN cost_type = 'Direct' THEN total_amount ELSE 0 END), 0) as direct_costs,
          COALESCE(SUM(CASE WHEN cost_type LIKE '%Overhead%' THEN total_amount ELSE 0 END), 0) as overhead_costs,
          COALESCE(SUM(total_amount), 0) as total_department_costs
        FROM cost_classification
        WHERE department IS NOT NULL
        GROUP BY department
      )
      SELECT 
        cc.*,
        ab.direct_costs as dept_direct_costs,
        ab.overhead_costs as dept_overhead_costs,
        ab.total_department_costs,
        CASE 
          WHEN ab.total_department_costs > 0 THEN 
            ROUND((cc.total_amount / ab.total_department_costs) * 100, 2)
          ELSE 0
        END as dept_cost_percentage,
        CASE 
          WHEN cc.cost_type = 'Direct' THEN cc.total_amount
          WHEN cc.cost_type LIKE '%Overhead%' THEN 
            CASE 
              WHEN :allocationMethod = 'direct_labor' THEN 
                cc.total_amount * (ab.direct_costs / NULLIF((SELECT SUM(direct_costs) FROM allocation_base), 0))
              WHEN :allocationMethod = 'machine_hours' THEN 
                cc.total_amount * (cc.transaction_count / NULLIF((SELECT SUM(transaction_count) FROM cost_classification), 0))
              ELSE cc.total_amount
            END
          ELSE cc.total_amount
        END as allocated_cost
      FROM cost_classification cc
      LEFT JOIN allocation_base ab ON cc.department = ab.department
      ORDER BY cc.total_amount DESC
    `, {
      replacements: { 
        startDate, 
        endDate,
        allocationMethod: allocationMethod || 'equal',
        ...(department && { department })
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate summary
    const summary = {
      totalCosts: allocationAnalysis.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0),
      directCosts: allocationAnalysis
        .filter(item => item.cost_type === 'Direct')
        .reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0),
      indirectCosts: allocationAnalysis
        .filter(item => item.cost_type.includes('Overhead'))
        .reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0),
      costTypeDistribution: {}
    };

    // Group by cost types
    allocationAnalysis.forEach(item => {
      if (!summary.costTypeDistribution[item.cost_type]) {
        summary.costTypeDistribution[item.cost_type] = {
          count: 0,
          totalCost: 0,
          percentage: 0
        };
      }
      summary.costTypeDistribution[item.cost_type].count++;
      summary.costTypeDistribution[item.cost_type].totalCost += parseFloat(item.total_amount || 0);
    });

    // Calculate percentages
    Object.values(summary.costTypeDistribution).forEach(type => {
      type.percentage = summary.totalCosts > 0 ? 
        Math.round((type.totalCost / summary.totalCosts) * 100 * 100) / 100 : 0;
    });

    summary.directCostPercentage = summary.totalCosts > 0 ? 
      Math.round((summary.directCosts / summary.totalCosts) * 100 * 100) / 100 : 0;
    summary.indirectCostPercentage = summary.totalCosts > 0 ? 
      Math.round((summary.indirectCosts / summary.totalCosts) * 100 * 100) / 100 : 0;

    res.json({
      success: true,
      data: {
        allocations: allocationAnalysis,
        summary,
        period: { startDate, endDate },
        filters: { department, allocationMethod }
      }
    });

  } catch (error) {
    console.error('Error in cost allocation analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cost allocation analysis',
      error: error.message
    });
  }
});

/**
 * Get Cost Center Performance Analysis
 */
router.get('/cost-centers', async (req, res) => {
  try {
    const { startDate, endDate, performanceMetric } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const costCenterAnalysis = await sequelize.query(`
      WITH cost_center_data AS (
        SELECT 
          COALESCE(a.cost_center, a.department, 'Unassigned') as cost_center,
          a.category,
          COALESCE(SUM(CASE WHEN je.type = 'debit' THEN je.amount ELSE 0 END), 0) as total_costs,
          COALESCE(SUM(CASE WHEN je.type = 'credit' THEN je.amount ELSE 0 END), 0) as total_credits,
          COUNT(DISTINCT je."journalEntryId") as transaction_count,
          COUNT(DISTINCT a.id) as account_count,
          AVG(CASE WHEN je.type = 'debit' THEN je.amount ELSE 0 END) as avg_transaction_amount
        FROM accounts a
        JOIN journal_entry_details je ON a.id = je."accountId"
        JOIN journal_entries j ON je."journalEntryId" = j.id
        WHERE j.date BETWEEN :startDate AND :endDate
          AND a.category IN ('expense', 'cost_of_goods_sold')
        GROUP BY COALESCE(a.cost_center, a.department, 'Unassigned'), a.category
      ),
      cost_center_totals AS (
        SELECT 
          cost_center,
          SUM(total_costs) as total_center_costs,
          SUM(total_credits) as total_center_credits,
          SUM(transaction_count) as total_transactions,
          SUM(account_count) as total_accounts,
          AVG(avg_transaction_amount) as center_avg_transaction
        FROM cost_center_data
        GROUP BY cost_center
      )
      SELECT 
        cct.*,
        ROUND(cct.total_center_costs / NULLIF(cct.total_transactions, 0), 2) as cost_per_transaction,
        ROUND(cct.total_center_costs / NULLIF(cct.total_accounts, 0), 2) as cost_per_account,
        ROUND((cct.total_center_costs / (SELECT SUM(total_center_costs) FROM cost_center_totals)) * 100, 2) as cost_percentage,
        CASE 
          WHEN cct.total_center_costs > (SELECT AVG(total_center_costs) * 1.5 FROM cost_center_totals) THEN 'High Cost'
          WHEN cct.total_center_costs > (SELECT AVG(total_center_costs) * 0.5 FROM cost_center_totals) THEN 'Medium Cost'
          ELSE 'Low Cost'
        END as cost_level,
        CASE 
          WHEN cct.total_transactions > (SELECT AVG(total_transactions) * 1.2 FROM cost_center_totals) THEN 'High Activity'
          WHEN cct.total_transactions > (SELECT AVG(total_transactions) * 0.8 FROM cost_center_totals) THEN 'Medium Activity'
          ELSE 'Low Activity'
        END as activity_level
      FROM cost_center_totals cct
      ORDER BY cct.total_center_costs DESC
    `, {
      replacements: { startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate performance metrics
    const performanceMetrics = {
      totalCostCenters: costCenterAnalysis.length,
      totalCosts: costCenterAnalysis.reduce((sum, cc) => sum + parseFloat(cc.total_center_costs || 0), 0),
      averageCostPerCenter: 0,
      highPerformingCenters: costCenterAnalysis.filter(cc => cc.cost_level === 'Low Cost' && cc.activity_level === 'High Activity').length,
      underperformingCenters: costCenterAnalysis.filter(cc => cc.cost_level === 'High Cost' && cc.activity_level === 'Low Activity').length
    };

    performanceMetrics.averageCostPerCenter = performanceMetrics.totalCostCenters > 0 ? 
      Math.round(performanceMetrics.totalCosts / performanceMetrics.totalCostCenters * 100) / 100 : 0;

    res.json({
      success: true,
      data: {
        costCenters: costCenterAnalysis,
        metrics: performanceMetrics,
        period: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Error in cost center analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cost center analysis',
      error: error.message
    });
  }
});

/**
 * Get Cost Variance Analysis
 * Compares actual costs vs budgeted/standard costs
 */
router.get('/variance-analysis', async (req, res) => {
  try {
    const { startDate, endDate, varianceType, threshold } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // For demonstration, we'll compare current period with previous period
    const periodDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(startDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevEndDate = new Date(new Date(endDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const varianceAnalysis = await sequelize.query(`
      WITH current_period AS (
        SELECT 
          a.id as account_id,
          a.name as account_name,
          a.code as account_code,
          a.category,
          COALESCE(a.cost_center, a.department, 'General') as cost_center,
          COALESCE(SUM(CASE WHEN je.type = 'debit' THEN je.amount ELSE 0 END), 0) as current_actual
        FROM accounts a
        LEFT JOIN journal_entry_details je ON a.id = je."accountId"
        LEFT JOIN journal_entries j ON je."journalEntryId" = j.id
        WHERE j.date BETWEEN :startDate AND :endDate
          AND a.category IN ('expense', 'cost_of_goods_sold')
        GROUP BY a.id, a.name, a.code, a.category, COALESCE(a.cost_center, a.department, 'General')
      ),
      previous_period AS (
        SELECT 
          a.id as account_id,
          COALESCE(SUM(CASE WHEN je.type = 'debit' THEN je.amount ELSE 0 END), 0) as previous_actual
        FROM accounts a
        LEFT JOIN journal_entry_details je ON a.id = je."accountId"
        LEFT JOIN journal_entries j ON je."journalEntryId" = j.id
        WHERE j.date BETWEEN :prevStartDate AND :prevEndDate
          AND a.category IN ('expense', 'cost_of_goods_sold')
        GROUP BY a.id
      )
      SELECT 
        cp.*,
        COALESCE(pp.previous_actual, 0) as previous_actual,
        (cp.current_actual - COALESCE(pp.previous_actual, 0)) as absolute_variance,
        CASE 
          WHEN COALESCE(pp.previous_actual, 0) > 0 THEN 
            ROUND(((cp.current_actual - pp.previous_actual) / pp.previous_actual) * 100, 2)
          ELSE 
            CASE WHEN cp.current_actual > 0 THEN 100 ELSE 0 END
        END as percentage_variance,
        CASE 
          WHEN cp.current_actual > COALESCE(pp.previous_actual, 0) THEN 'Unfavorable'
          WHEN cp.current_actual < COALESCE(pp.previous_actual, 0) THEN 'Favorable'
          ELSE 'No Change'
        END as variance_type,
        CASE 
          WHEN ABS(cp.current_actual - COALESCE(pp.previous_actual, 0)) > :threshold THEN 'Significant'
          WHEN ABS(cp.current_actual - COALESCE(pp.previous_actual, 0)) > (:threshold * 0.5) THEN 'Moderate'
          ELSE 'Minor'
        END as variance_significance
      FROM current_period cp
      LEFT JOIN previous_period pp ON cp.account_id = pp.account_id
      WHERE cp.current_actual > 0 OR COALESCE(pp.previous_actual, 0) > 0
      ORDER BY ABS(cp.current_actual - COALESCE(pp.previous_actual, 0)) DESC
    `, {
      replacements: { 
        startDate, 
        endDate, 
        prevStartDate, 
        prevEndDate,
        threshold: threshold || 1000
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate summary
    const summary = {
      totalCurrentCosts: varianceAnalysis.reduce((sum, item) => sum + parseFloat(item.current_actual || 0), 0),
      totalPreviousCosts: varianceAnalysis.reduce((sum, item) => sum + parseFloat(item.previous_actual || 0), 0),
      totalAbsoluteVariance: 0,
      totalPercentageVariance: 0,
      favorableVariances: varianceAnalysis.filter(item => item.variance_type === 'Favorable').length,
      unfavorableVariances: varianceAnalysis.filter(item => item.variance_type === 'Unfavorable').length,
      significantVariances: varianceAnalysis.filter(item => item.variance_significance === 'Significant').length
    };

    summary.totalAbsoluteVariance = summary.totalCurrentCosts - summary.totalPreviousCosts;
    summary.totalPercentageVariance = summary.totalPreviousCosts > 0 ? 
      Math.round((summary.totalAbsoluteVariance / summary.totalPreviousCosts) * 100 * 100) / 100 : 0;

    res.json({
      success: true,
      data: {
        variances: varianceAnalysis,
        summary,
        period: { 
          current: { startDate, endDate },
          previous: { startDate: prevStartDate, endDate: prevEndDate }
        },
        filters: { varianceType, threshold }
      }
    });

  } catch (error) {
    console.error('Error in variance analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate variance analysis',
      error: error.message
    });
  }
});

/**
 * Export cost analysis data
 */
router.get('/export', async (req, res) => {
  try {
    const { analysisType, format, startDate, endDate } = req.query;
    
    if (!analysisType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Analysis type, start date, and end date are required'
      });
    }

    // This is a placeholder for export functionality
    // In a real implementation, you would generate actual files
    const exportData = {
      analysisType,
      format: format || 'json',
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      data: `Export for ${analysisType} analysis from ${startDate} to ${endDate}`
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cost_analysis_${analysisType}_${startDate}_${endDate}.csv`);
      res.send('This would be CSV data in a real implementation');
    } else {
      res.json({
        success: true,
        message: 'Export generated successfully',
        data: exportData
      });
    }

  } catch (error) {
    console.error('Error exporting cost analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export cost analysis',
      error: error.message
    });
  }
});

export default router;
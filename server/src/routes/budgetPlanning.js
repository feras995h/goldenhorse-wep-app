import express from 'express';
import { Op } from 'sequelize';
import { authenticateToken, requireAccountingAccess } from '../middleware/auth.js';
import { sequelize } from '../models/index.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAccountingAccess);

/**
 * Get Budget Templates
 * Retrieve predefined budget templates for different periods
 */
router.get('/templates', async (req, res) => {
  try {
    const { budgetType, fiscalYear } = req.query;

    // Mock budget templates - in real implementation, these would come from database
    const templates = [
      {
        id: 'annual_2025',
        name: 'الميزانية السنوية 2025',
        type: 'annual',
        fiscalYear: 2025,
        status: 'active',
        totalBudget: 12000000,
        categories: [
          { name: 'الإيرادات', budgetAmount: 15000000, type: 'revenue' },
          { name: 'تكلفة البضاعة المباعة', budgetAmount: 8500000, type: 'cogs' },
          { name: 'المصاريف التشغيلية', budgetAmount: 3200000, type: 'operating' },
          { name: 'المصاريف الإدارية', budgetAmount: 1800000, type: 'administrative' }
        ],
        createdAt: '2024-12-01',
        lastModified: '2025-01-15'
      },
      {
        id: 'quarterly_q1_2025',
        name: 'ميزانية الربع الأول 2025',
        type: 'quarterly',
        fiscalYear: 2025,
        quarter: 1,
        status: 'draft',
        totalBudget: 3000000,
        categories: [
          { name: 'الإيرادات', budgetAmount: 3750000, type: 'revenue' },
          { name: 'تكلفة البضاعة المباعة', budgetAmount: 2125000, type: 'cogs' },
          { name: 'المصاريف التشغيلية', budgetAmount: 800000, type: 'operating' },
          { name: 'المصاريف الإدارية', budgetAmount: 450000, type: 'administrative' }
        ],
        createdAt: '2025-01-01',
        lastModified: '2025-01-20'
      }
    ];

    let filteredTemplates = templates;
    
    if (budgetType) {
      filteredTemplates = filteredTemplates.filter(t => t.type === budgetType);
    }
    
    if (fiscalYear) {
      filteredTemplates = filteredTemplates.filter(t => t.fiscalYear === parseInt(fiscalYear));
    }

    res.json({
      success: true,
      data: {
        templates: filteredTemplates,
        totalCount: filteredTemplates.length
      }
    });

  } catch (error) {
    console.error('Error fetching budget templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget templates',
      error: error.message
    });
  }
});

/**
 * Create New Budget
 * Create a new budget plan with categories and line items
 */
router.post('/create', async (req, res) => {
  try {
    const {
      name,
      type,
      fiscalYear,
      quarter,
      startDate,
      endDate,
      categories,
      description
    } = req.body;

    // Validate required fields
    if (!name || !type || !fiscalYear || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, fiscalYear, startDate, endDate'
      });
    }

    // Calculate total budget from categories
    const totalBudget = categories?.reduce((sum, cat) => sum + (cat.budgetAmount || 0), 0) || 0;

    // Mock budget creation - in real implementation, save to database
    const newBudget = {
      id: `budget_${Date.now()}`,
      name,
      type,
      fiscalYear: parseInt(fiscalYear),
      quarter: quarter ? parseInt(quarter) : null,
      startDate,
      endDate,
      description: description || '',
      totalBudget,
      categories: categories || [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      lastModified: new Date().toISOString(),
      version: 1,
      approvalStatus: 'pending',
      actualSpent: 0,
      variance: 0,
      utilizationPercentage: 0
    };

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: { budget: newBudget }
    });

  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget',
      error: error.message
    });
  }
});

/**
 * Get Budget Analysis
 * Compare budget vs actual spending with variance analysis
 */
router.get('/analysis/:budgetId', async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { period, compareType } = req.query;

    // Mock budget data
    const budgetData = {
      id: budgetId,
      name: 'الميزانية السنوية 2025',
      type: 'annual',
      fiscalYear: 2025,
      totalBudget: 12000000,
      actualSpent: 8750000,
      remainingBudget: 3250000,
      utilizationPercentage: 72.9,
      variance: -1250000,
      variancePercentage: -10.4
    };

    // Budget vs Actual analysis by category
    const categoryAnalysis = [
      {
        category: 'الإيرادات',
        type: 'revenue',
        budgetAmount: 15000000,
        actualAmount: 12500000,
        variance: -2500000,
        variancePercentage: -16.7,
        status: 'under_budget',
        trend: 'decreasing'
      },
      {
        category: 'تكلفة البضاعة المباعة',
        type: 'cogs',
        budgetAmount: 8500000,
        actualAmount: 7800000,
        variance: -700000,
        variancePercentage: -8.2,
        status: 'under_budget',
        trend: 'stable'
      },
      {
        category: 'المصاريف التشغيلية',
        type: 'operating',
        budgetAmount: 3200000,
        actualAmount: 3450000,
        variance: 250000,
        variancePercentage: 7.8,
        status: 'over_budget',
        trend: 'increasing'
      },
      {
        category: 'المصاريف الإدارية',
        type: 'administrative',
        budgetAmount: 1800000,
        actualAmount: 1650000,
        variance: -150000,
        variancePercentage: -8.3,
        status: 'under_budget',
        trend: 'stable'
      }
    ];

    // Monthly breakdown
    const monthlyBreakdown = [
      { month: 'يناير', budgeted: 1000000, actual: 925000, variance: -75000 },
      { month: 'فبراير', budgeted: 1000000, actual: 1150000, variance: 150000 },
      { month: 'مارس', budgeted: 1000000, actual: 980000, variance: -20000 },
      { month: 'أبريل', budgeted: 1000000, actual: 1075000, variance: 75000 },
      { month: 'مايو', budgeted: 1000000, actual: 890000, variance: -110000 },
      { month: 'يونيو', budgeted: 1000000, actual: 1025000, variance: 25000 }
    ];

    // Key Performance Indicators
    const kpis = {
      budgetAccuracy: 87.3, // How close actual is to budget
      forecastAccuracy: 91.2, // How accurate the forecasting is
      budgetUtilization: budgetData.utilizationPercentage,
      varianceThreshold: 10, // Acceptable variance percentage
      criticalVariances: categoryAnalysis.filter(cat => Math.abs(cat.variancePercentage) > 10).length,
      onTrackCategories: categoryAnalysis.filter(cat => cat.status === 'under_budget').length
    };

    res.json({
      success: true,
      data: {
        budget: budgetData,
        categoryAnalysis,
        monthlyBreakdown,
        kpis,
        period: period || 'current',
        compareType: compareType || 'budget_vs_actual'
      }
    });

  } catch (error) {
    console.error('Error in budget analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate budget analysis',
      error: error.message
    });
  }
});

/**
 * Get Cash Flow Forecast
 * Generate cash flow projections based on budget and historical data
 */
router.get('/cash-flow-forecast', async (req, res) => {
  try {
    const { periods, forecastType, budgetId } = req.query;
    const numPeriods = parseInt(periods) || 12;

    // Mock cash flow forecast data
    const baseAmount = 500000;
    const forecastData = [];

    for (let i = 0; i < numPeriods; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      // Add some variance to make it realistic
      const variance = (Math.random() - 0.5) * 0.3; // ±15% variance
      const seasonalFactor = 1 + 0.2 * Math.sin((i / 12) * 2 * Math.PI); // Seasonal variation
      
      const cashInflow = baseAmount * seasonalFactor * (1 + variance);
      const cashOutflow = baseAmount * 0.8 * seasonalFactor * (1 + variance * 0.5);
      const netCashFlow = cashInflow - cashOutflow;
      
      forecastData.push({
        period: date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }),
        date: date.toISOString().split('T')[0],
        cashInflow: Math.round(cashInflow),
        cashOutflow: Math.round(cashOutflow),
        netCashFlow: Math.round(netCashFlow),
        cumulativeCashFlow: i === 0 ? Math.round(netCashFlow) : 
          forecastData[i-1].cumulativeCashFlow + Math.round(netCashFlow),
        confidence: Math.max(60, 95 - (i * 3)) // Confidence decreases over time
      });
    }

    // Summary metrics
    const summary = {
      totalInflow: forecastData.reduce((sum, period) => sum + period.cashInflow, 0),
      totalOutflow: forecastData.reduce((sum, period) => sum + period.cashOutflow, 0),
      totalNetFlow: forecastData.reduce((sum, period) => sum + period.netCashFlow, 0),
      averageMonthlyFlow: forecastData.reduce((sum, period) => sum + period.netCashFlow, 0) / numPeriods,
      positiveFlowMonths: forecastData.filter(period => period.netCashFlow > 0).length,
      negativeFlowMonths: forecastData.filter(period => period.netCashFlow < 0).length,
      averageConfidence: forecastData.reduce((sum, period) => sum + period.confidence, 0) / numPeriods
    };

    // Risk indicators
    const riskIndicators = {
      liquidityRisk: forecastData.filter(period => period.cumulativeCashFlow < 100000).length > 0 ? 'high' : 'low',
      volatilityRisk: Math.max(...forecastData.map(p => p.netCashFlow)) - Math.min(...forecastData.map(p => p.netCashFlow)) > 200000 ? 'high' : 'medium',
      seasonalityRisk: 'medium', // Based on seasonal variations
      overallRisk: 'medium'
    };

    res.json({
      success: true,
      data: {
        forecast: forecastData,
        summary,
        riskIndicators,
        parameters: {
          periods: numPeriods,
          forecastType: forecastType || 'conservative',
          budgetId: budgetId || null
        }
      }
    });

  } catch (error) {
    console.error('Error generating cash flow forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cash flow forecast',
      error: error.message
    });
  }
});

/**
 * Get Budget Scenarios
 * Generate what-if scenarios for budget planning
 */
router.get('/scenarios', async (req, res) => {
  try {
    const { basebudgetId, scenarioType } = req.query;

    // Base scenario (current budget)
    const baseScenario = {
      name: 'السيناريو الأساسي',
      type: 'base',
      totalRevenue: 15000000,
      totalExpenses: 12000000,
      netProfit: 3000000,
      profitMargin: 20.0,
      riskLevel: 'medium'
    };

    // Generate alternative scenarios
    const scenarios = [
      {
        name: 'السيناريو المتفائل',
        type: 'optimistic',
        description: 'زيادة الإيرادات بنسبة 15% وتقليل المصروفات بنسبة 5%',
        totalRevenue: baseScenario.totalRevenue * 1.15,
        totalExpenses: baseScenario.totalExpenses * 0.95,
        netProfit: (baseScenario.totalRevenue * 1.15) - (baseScenario.totalExpenses * 0.95),
        profitMargin: 0,
        riskLevel: 'low',
        probability: 25,
        assumptions: [
          'نمو السوق بنسبة 15%',
          'تحسين الكفاءة التشغيلية',
          'عدم وجود أزمات اقتصادية'
        ]
      },
      {
        name: 'السيناريو المتشائم',
        type: 'pessimistic',
        description: 'انخفاض الإيرادات بنسبة 10% وزيادة المصروفات بنسبة 8%',
        totalRevenue: baseScenario.totalRevenue * 0.90,
        totalExpenses: baseScenario.totalExpenses * 1.08,
        netProfit: (baseScenario.totalRevenue * 0.90) - (baseScenario.totalExpenses * 1.08),
        profitMargin: 0,
        riskLevel: 'high',
        probability: 20,
        assumptions: [
          'ركود اقتصادي',
          'زيادة التضخم',
          'فقدان عملاء رئيسيين'
        ]
      },
      {
        name: 'السيناريو الواقعي',
        type: 'realistic',
        description: 'نمو متوسط بنسبة 5% مع زيادة طفيفة في المصروفات',
        totalRevenue: baseScenario.totalRevenue * 1.05,
        totalExpenses: baseScenario.totalExpenses * 1.03,
        netProfit: (baseScenario.totalRevenue * 1.05) - (baseScenario.totalExpenses * 1.03),
        profitMargin: 0,
        riskLevel: 'medium',
        probability: 55,
        assumptions: [
          'نمو طبيعي للأعمال',
          'استقرار الأسعار',
          'عدم وجود تغييرات جذرية'
        ]
      }
    ];

    // Calculate profit margins
    scenarios.forEach(scenario => {
      scenario.profitMargin = scenario.totalRevenue > 0 ? 
        (scenario.netProfit / scenario.totalRevenue) * 100 : 0;
    });

    // Add base scenario
    scenarios.unshift({
      ...baseScenario,
      description: 'الميزانية الحالية كما هي مخططة',
      probability: 100,
      assumptions: ['تنفيذ الخطة كما هو مقرر']
    });

    // Scenario comparison
    const comparison = {
      bestCase: scenarios.reduce((best, scenario) => 
        scenario.netProfit > best.netProfit ? scenario : best
      ),
      worstCase: scenarios.reduce((worst, scenario) => 
        scenario.netProfit < worst.netProfit ? scenario : worst
      ),
      mostLikely: scenarios.find(s => s.probability === Math.max(...scenarios.map(s => s.probability))),
      riskRange: {
        minProfit: Math.min(...scenarios.map(s => s.netProfit)),
        maxProfit: Math.max(...scenarios.map(s => s.netProfit)),
        variance: 0
      }
    };

    comparison.riskRange.variance = comparison.riskRange.maxProfit - comparison.riskRange.minProfit;

    res.json({
      success: true,
      data: {
        scenarios,
        comparison,
        baseScenario: baseScenario,
        summary: {
          totalScenarios: scenarios.length,
          averageProfit: scenarios.reduce((sum, s) => sum + s.netProfit, 0) / scenarios.length,
          averageMargin: scenarios.reduce((sum, s) => sum + s.profitMargin, 0) / scenarios.length
        }
      }
    });

  } catch (error) {
    console.error('Error generating budget scenarios:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate budget scenarios',
      error: error.message
    });
  }
});

/**
 * Export budget data
 */
router.get('/export/:budgetId', async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { format, includeAnalysis } = req.query;

    // Mock export data
    const exportData = {
      budgetId,
      format: format || 'json',
      includeAnalysis: includeAnalysis === 'true',
      generatedAt: new Date().toISOString(),
      data: `Budget export for ${budgetId}`
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=budget_${budgetId}.csv`);
      res.send('Budget CSV data would be here');
    } else {
      res.json({
        success: true,
        message: 'Budget export generated successfully',
        data: exportData
      });
    }

  } catch (error) {
    console.error('Error exporting budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export budget',
      error: error.message
    });
  }
});

export default router;
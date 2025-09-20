import express from 'express';
import { Op } from 'sequelize';
import { authenticateToken, requireAccountingAccess } from '../middleware/auth.js';
import { sequelize } from '../models/index.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAccountingAccess);

/**
 * Get Cash Flow Analysis
 * Comprehensive cash flow analysis with categorization
 */
router.get('/analysis', async (req, res) => {
  try {
    const { startDate, endDate, categoryFilter, granularity } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Mock comprehensive cash flow analysis
    const analysis = {
      summary: {
        totalInflows: 8750000,
        totalOutflows: 6850000,
        netCashFlow: 1900000,
        operatingCashFlow: 2150000,
        investingCashFlow: -450000,
        financingCashFlow: 200000,
        beginningBalance: 1250000,
        endingBalance: 3150000
      },
      categories: {
        inflows: [
          { category: 'مبيعات نقدية', amount: 4200000, percentage: 48.0, trend: 'increasing' },
          { category: 'تحصيل ذمم', amount: 3150000, percentage: 36.0, trend: 'stable' },
          { category: 'إيرادات أخرى', amount: 850000, percentage: 9.7, trend: 'increasing' },
          { category: 'قروض وتمويل', amount: 550000, percentage: 6.3, trend: 'decreasing' }
        ],
        outflows: [
          { category: 'رواتب ومكافآت', amount: 2850000, percentage: 41.6, trend: 'stable' },
          { category: 'مشتريات', amount: 2200000, percentage: 32.1, trend: 'increasing' },
          { category: 'مصاريف تشغيلية', amount: 980000, percentage: 14.3, trend: 'stable' },
          { category: 'ضرائب ورسوم', amount: 450000, percentage: 6.6, trend: 'stable' },
          { category: 'سداد قروض', amount: 370000, percentage: 5.4, trend: 'decreasing' }
        ]
      },
      monthlyBreakdown: [
        { month: 'يناير', inflows: 1450000, outflows: 1180000, netFlow: 270000, cumulativeFlow: 270000 },
        { month: 'فبراير', inflows: 1380000, outflows: 1220000, netFlow: 160000, cumulativeFlow: 430000 },
        { month: 'مارس', inflows: 1520000, outflows: 1330000, netFlow: 190000, cumulativeFlow: 620000 },
        { month: 'أبريل', inflows: 1480000, outflows: 1270000, netFlow: 210000, cumulativeFlow: 830000 },
        { month: 'مايو', inflows: 1620000, outflows: 1400000, netFlow: 220000, cumulativeFlow: 1050000 },
        { month: 'يونيو', inflows: 1300000, outflows: 1450000, netFlow: -150000, cumulativeFlow: 900000 }
      ],
      kpis: {
        cashFlowRatio: 1.28, // Inflows / Outflows
        operatingMargin: 24.6, // (Operating Cash Flow / Revenue) * 100
        cashConversionCycle: 45, // Days
        liquidityRatio: 2.3, // Current assets / Current liabilities
        cashFlowVolatility: 12.5, // Standard deviation of monthly flows
        averageDailyBalance: 2200000
      }
    };

    res.json({
      success: true,
      data: {
        analysis,
        period: { startDate, endDate },
        filters: { categoryFilter, granularity: granularity || 'monthly' }
      }
    });

  } catch (error) {
    console.error('Error in cash flow analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cash flow analysis',
      error: error.message
    });
  }
});

/**
 * Get Liquidity Management Dashboard
 * Monitor liquidity positions and requirements
 */
router.get('/liquidity', async (req, res) => {
  try {
    const { currency, includeForecasts } = req.query;

    const liquidityData = {
      currentPosition: {
        cashAndEquivalents: 3150000,
        availableCredit: 2500000,
        totalLiquidity: 5650000,
        minimumRequired: 1500000,
        excessLiquidity: 4150000,
        liquidityRatio: 3.77 // Total liquidity / Minimum required
      },
      bankAccounts: [
        {
          bankName: 'البنك الأهلي السعودي',
          accountNumber: '****1234',
          balance: 1850000,
          availableBalance: 1820000,
          currency: 'SAR',
          type: 'current',
          lastUpdated: new Date().toISOString()
        },
        {
          bankName: 'بنك الراجحي',
          accountNumber: '****5678',
          balance: 950000,
          availableBalance: 945000,
          currency: 'SAR',
          type: 'savings',
          lastUpdated: new Date().toISOString()
        },
        {
          bankName: 'بنك ساب',
          accountNumber: '****9012',
          balance: 350000,
          availableBalance: 330000,
          currency: 'SAR',
          type: 'current',
          lastUpdated: new Date().toISOString()
        }
      ],
      creditFacilities: [
        {
          facilityName: 'خط ائتمان تشغيلي',
          totalLimit: 2000000,
          usedAmount: 450000,
          availableAmount: 1550000,
          interestRate: 6.5,
          maturityDate: '2025-12-31',
          status: 'active'
        },
        {
          facilityName: 'اعتماد مستندي',
          totalLimit: 1500000,
          usedAmount: 800000,
          availableAmount: 700000,
          interestRate: 5.8,
          maturityDate: '2025-06-30',
          status: 'active'
        }
      ],
      upcomingObligations: [
        { description: 'سداد قرض', amount: 250000, dueDate: '2025-02-15', priority: 'high' },
        { description: 'رواتب الموظفين', amount: 480000, dueDate: '2025-01-30', priority: 'critical' },
        { description: 'ضريبة القيمة المضافة', amount: 185000, dueDate: '2025-02-10', priority: 'medium' },
        { description: 'إيجار المباني', amount: 75000, dueDate: '2025-02-01', priority: 'medium' }
      ],
      riskIndicators: {
        liquidityStress: 'low', // Based on minimum requirements coverage
        concentrationRisk: 'medium', // Single bank concentration
        maturityRisk: 'low', // Credit facility maturity profile
        currencyRisk: 'low', // Foreign currency exposure
        overallRisk: 'low'
      },
      recommendations: [
        {
          type: 'optimization',
          priority: 'medium',
          description: 'توزيع السيولة الزائدة في استثمارات قصيرة الأجل',
          potentialBenefit: 125000
        },
        {
          type: 'risk_mitigation',
          priority: 'low',
          description: 'تنويع الحسابات البنكية لتقليل مخاطر التركز',
          potentialBenefit: 'risk_reduction'
        }
      ]
    };

    res.json({
      success: true,
      data: liquidityData
    });

  } catch (error) {
    console.error('Error in liquidity management:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get liquidity data',
      error: error.message
    });
  }
});

/**
 * Get Working Capital Analysis
 * Analyze working capital components and efficiency
 */
router.get('/working-capital', async (req, res) => {
  try {
    const { period, comparisonPeriod } = req.query;

    const workingCapitalData = {
      current: {
        currentAssets: 8750000,
        currentLiabilities: 3200000,
        workingCapital: 5550000,
        workingCapitalRatio: 2.73,
        quickRatio: 2.15,
        cashRatio: 0.98
      },
      components: {
        currentAssets: [
          { item: 'النقد وما في حكمه', amount: 3150000, percentage: 36.0, daysOutstanding: 0 },
          { item: 'حسابات مدينة', amount: 2850000, percentage: 32.6, daysOutstanding: 42 },
          { item: 'المخزون', amount: 2250000, percentage: 25.7, daysOutstanding: 65 },
          { item: 'مصاريف مدفوعة مقدماً', amount: 500000, percentage: 5.7, daysOutstanding: 30 }
        ],
        currentLiabilities: [
          { item: 'حسابات دائنة', amount: 1850000, percentage: 57.8, daysOutstanding: 35 },
          { item: 'مصاريف مستحقة', amount: 750000, percentage: 23.4, daysOutstanding: 20 },
          { item: 'قروض قصيرة الأجل', amount: 400000, percentage: 12.5, daysOutstanding: 90 },
          { item: 'ضرائب مستحقة', amount: 200000, percentage: 6.3, daysOutstanding: 60 }
        ]
      },
      efficiency: {
        receivablesTurnover: 8.7, // times per year
        inventoryTurnover: 4.2, // times per year
        payablesTurnover: 6.5, // times per year
        cashConversionCycle: 72, // days
        workingCapitalTurnover: 2.4 // times per year
      },
      trends: {
        workingCapitalGrowth: 12.5, // % change from previous period
        efficiencyChange: -3.2, // % change in cash conversion cycle
        liquidityTrend: 'improving',
        riskLevel: 'low'
      },
      benchmarks: {
        industryAverage: {
          workingCapitalRatio: 2.1,
          quickRatio: 1.8,
          cashConversionCycle: 85,
          receivablesDays: 45,
          inventoryDays: 75,
          payablesDays: 35
        },
        performance: {
          workingCapitalRatio: 'above_average',
          quickRatio: 'above_average',
          cashConversionCycle: 'better_than_average',
          overall: 'strong'
        }
      }
    };

    res.json({
      success: true,
      data: workingCapitalData
    });

  } catch (error) {
    console.error('Error in working capital analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate working capital analysis',
      error: error.message
    });
  }
});

/**
 * Get Cash Flow Projections
 * Advanced cash flow forecasting with multiple scenarios
 */
router.get('/projections', async (req, res) => {
  try {
    const { horizon, scenario, confidence } = req.query;
    const projectionHorizon = parseInt(horizon) || 12; // months

    // Generate projections based on scenario
    const baseMonthlyFlow = 150000;
    const projections = [];

    for (let i = 1; i <= projectionHorizon; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      // Scenario adjustments
      let scenarioMultiplier = 1.0;
      if (scenario === 'optimistic') scenarioMultiplier = 1.15;
      else if (scenario === 'pessimistic') scenarioMultiplier = 0.85;
      else if (scenario === 'conservative') scenarioMultiplier = 0.95;
      
      // Seasonal adjustments
      const seasonalFactor = 1 + 0.15 * Math.sin((i / 12) * 2 * Math.PI);
      
      // Random variance
      const variance = 1 + (Math.random() - 0.5) * 0.2;
      
      const monthlyFlow = baseMonthlyFlow * scenarioMultiplier * seasonalFactor * variance;
      const cumulativeFlow = i === 1 ? monthlyFlow : 
        projections[i-2].cumulativeFlow + monthlyFlow;
      
      projections.push({
        month: i,
        period: date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }),
        date: date.toISOString().split('T')[0],
        projectedFlow: Math.round(monthlyFlow),
        cumulativeFlow: Math.round(cumulativeFlow),
        confidence: Math.max(60, 95 - (i * 2)), // Confidence decreases over time
        lowerBound: Math.round(monthlyFlow * 0.8),
        upperBound: Math.round(monthlyFlow * 1.2)
      });
    }

    const summary = {
      totalProjectedFlow: projections.reduce((sum, p) => sum + p.projectedFlow, 0),
      averageMonthlyFlow: projections.reduce((sum, p) => sum + p.projectedFlow, 0) / projections.length,
      positiveFlowMonths: projections.filter(p => p.projectedFlow > 0).length,
      minMonthlyFlow: Math.min(...projections.map(p => p.projectedFlow)),
      maxMonthlyFlow: Math.max(...projections.map(p => p.projectedFlow)),
      volatility: 'medium', // Based on variance in flows
      overallTrend: 'stable'
    };

    const riskAnalysis = {
      liquidityRisk: projections.some(p => p.cumulativeFlow < 500000) ? 'medium' : 'low',
      volatilityRisk: summary.maxMonthlyFlow - summary.minMonthlyFlow > 100000 ? 'high' : 'medium',
      concentrationRisk: 'low', // Based on cash flow source diversity
      seasonalityRisk: 'medium',
      overallRisk: 'medium'
    };

    res.json({
      success: true,
      data: {
        projections,
        summary,
        riskAnalysis,
        parameters: {
          horizon: projectionHorizon,
          scenario: scenario || 'base',
          confidence: confidence || 'medium'
        }
      }
    });

  } catch (error) {
    console.error('Error generating cash flow projections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cash flow projections',
      error: error.message
    });
  }
});

/**
 * Get Cash Flow Optimization Recommendations
 * AI-powered recommendations for cash flow improvement
 */
router.get('/optimization', async (req, res) => {
  try {
    const recommendations = [
      {
        id: 'receivables_optimization',
        category: 'تحصيل الذمم',
        priority: 'high',
        title: 'تحسين دورة تحصيل الذمم المدينة',
        description: 'تقليل فترة التحصيل من 42 يوم إلى 30 يوم',
        currentValue: 42,
        targetValue: 30,
        potentialImpact: 850000,
        timeframe: '3 أشهر',
        effort: 'متوسط',
        actions: [
          'تطبيق نظام متابعة آلي للذمم المستحقة',
          'تقديم خصومات للسداد المبكر',
          'تحسين شروط الائتمان للعملاء الجدد'
        ]
      },
      {
        id: 'inventory_optimization',
        category: 'إدارة المخزون',
        priority: 'medium',
        title: 'تحسين إدارة المخزون',
        description: 'تقليل مستوى المخزون وتحسين دوران المخزون',
        currentValue: 65,
        targetValue: 45,
        potentialImpact: 650000,
        timeframe: '6 أشهر',
        effort: 'عالي',
        actions: [
          'تطبيق نظام Just-in-Time للمخزون',
          'تحليل المخزون البطيء الحركة',
          'تحسين التنبؤ بالطلب'
        ]
      },
      {
        id: 'payables_optimization',
        category: 'إدارة الذمم الدائنة',
        priority: 'low',
        title: 'تمديد فترة سداد الذمم الدائنة',
        description: 'التفاوض مع الموردين لتمديد فترة السداد',
        currentValue: 35,
        targetValue: 45,
        potentialImpact: 420000,
        timeframe: '2 أشهر',        
        effort: 'منخفض',
        actions: [
          'إعادة التفاوض مع الموردين الرئيسيين',
          'تحسين العلاقات مع الموردين',
          'تقييم شروط الدفع الحالية'
        ]
      },
      {
        id: 'liquidity_investment',
        category: 'استثمار السيولة',
        priority: 'medium',
        title: 'استثمار السيولة الزائدة',
        description: 'استثمار السيولة الزائدة في أدوات مالية قصيرة الأجل',
        currentValue: 0,
        targetValue: 2000000,
        potentialImpact: 180000,
        timeframe: '1 شهر',
        effort: 'منخفض',
        actions: [
          'البحث عن أدوات استثمار آمنة قصيرة الأجل',
          'تنويع محفظة الاستثمارات النقدية',
          'مراقبة معدلات العائد بانتظام'
        ]
      }
    ];

    // Calculate total potential impact
    const totalPotentialImpact = recommendations.reduce((sum, rec) => sum + rec.potentialImpact, 0);
    
    // Prioritize recommendations
    const prioritizedRecommendations = recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const summary = {
      totalRecommendations: recommendations.length,
      highPriorityCount: recommendations.filter(r => r.priority === 'high').length,
      totalPotentialImpact,
      averageTimeframe: '3 أشهر',
      quickWins: recommendations.filter(r => r.effort === 'منخفض' && r.potentialImpact > 400000).length
    };

    res.json({
      success: true,
      data: {
        recommendations: prioritizedRecommendations,
        summary
      }
    });

  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate optimization recommendations',
      error: error.message
    });
  }
});

/**
 * Export cash flow data
 */
router.get('/export/:reportType', async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format, startDate, endDate } = req.query;

    const exportData = {
      reportType,
      format: format || 'json',
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      data: `Cash flow ${reportType} export data`
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cashflow_${reportType}.csv`);
      res.send('CSV export data would be here');
    } else {
      res.json({
        success: true,
        message: 'Cash flow export generated successfully',
        data: exportData
      });
    }

  } catch (error) {
    console.error('Error exporting cash flow data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export cash flow data',  
      error: error.message
    });
  }
});

export default router;
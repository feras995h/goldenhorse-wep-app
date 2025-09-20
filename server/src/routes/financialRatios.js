import express from 'express';
import { Op } from 'sequelize';
import { authenticateToken, requireAccountingAccess } from '../middleware/auth.js';
import { sequelize } from '../models/index.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAccountingAccess);

/**
 * Get Financial Ratios Overview
 * Calculate and analyze key financial ratios
 */
router.get('/overview', async (req, res) => {
  try {
    const { period, compareWith } = req.query;

    // Mock financial data for ratio calculations
    const financialData = {
      // Balance Sheet Items
      currentAssets: 8750000,
      currentLiabilities: 3200000,
      totalAssets: 25000000,
      totalLiabilities: 12000000,
      totalEquity: 13000000,
      inventory: 2250000,
      accountsReceivable: 2850000,
      cash: 3150000,
      longTermDebt: 8800000,
      
      // Income Statement Items
      revenue: 15000000,
      grossProfit: 6500000,
      operatingIncome: 3800000,
      netIncome: 3000000,
      interestExpense: 580000,
      costOfGoodsSold: 8500000,
      operatingExpenses: 2700000,
      
      // Market Data
      marketValue: 45000000,
      sharesOutstanding: 1000000,
      dividendsPaid: 450000,
    };

    // Calculate Liquidity Ratios
    const liquidityRatios = {
      currentRatio: financialData.currentAssets / financialData.currentLiabilities,
      quickRatio: (financialData.currentAssets - financialData.inventory) / financialData.currentLiabilities,
      cashRatio: financialData.cash / financialData.currentLiabilities,
      workingCapital: financialData.currentAssets - financialData.currentLiabilities
    };

    // Calculate Leverage/Solvency Ratios
    const leverageRatios = {
      debtToEquity: financialData.totalLiabilities / financialData.totalEquity,
      debtToAssets: financialData.totalLiabilities / financialData.totalAssets,
      equityRatio: financialData.totalEquity / financialData.totalAssets,
      interestCoverage: financialData.operatingIncome / financialData.interestExpense,
      debtServiceCoverage: (financialData.netIncome + financialData.interestExpense) / financialData.interestExpense
    };

    // Calculate Profitability Ratios
    const profitabilityRatios = {
      grossProfitMargin: (financialData.grossProfit / financialData.revenue) * 100,
      operatingMargin: (financialData.operatingIncome / financialData.revenue) * 100,
      netProfitMargin: (financialData.netIncome / financialData.revenue) * 100,
      returnOnAssets: (financialData.netIncome / financialData.totalAssets) * 100,
      returnOnEquity: (financialData.netIncome / financialData.totalEquity) * 100,
      returnOnInvestment: (financialData.operatingIncome / financialData.totalAssets) * 100
    };

    // Calculate Activity/Efficiency Ratios
    const activityRatios = {
      assetTurnover: financialData.revenue / financialData.totalAssets,
      receivablesTurnover: financialData.revenue / financialData.accountsReceivable,
      inventoryTurnover: financialData.costOfGoodsSold / financialData.inventory,
      daysSalesOutstanding: (financialData.accountsReceivable / financialData.revenue) * 365,
      daysInventoryOutstanding: (financialData.inventory / financialData.costOfGoodsSold) * 365,
      totalAssetTurnover: financialData.revenue / financialData.totalAssets
    };

    // Calculate Market Value Ratios
    const marketRatios = {
      priceToEarnings: financialData.marketValue / financialData.netIncome,
      marketToBook: financialData.marketValue / financialData.totalEquity,
      earningsPerShare: financialData.netIncome / financialData.sharesOutstanding,
      dividendYield: (financialData.dividendsPaid / financialData.marketValue) * 100,
      priceToSales: financialData.marketValue / financialData.revenue
    };

    // Industry benchmarks for comparison
    const industryBenchmarks = {
      liquidityRatios: {
        currentRatio: { excellent: 2.5, good: 2.0, average: 1.5, poor: 1.0 },
        quickRatio: { excellent: 1.5, good: 1.2, average: 1.0, poor: 0.8 },
        cashRatio: { excellent: 0.5, good: 0.3, average: 0.2, poor: 0.1 }
      },
      leverageRatios: {
        debtToEquity: { excellent: 0.3, good: 0.5, average: 0.8, poor: 1.2 },
        debtToAssets: { excellent: 0.3, good: 0.4, average: 0.5, poor: 0.7 },
        interestCoverage: { excellent: 10, good: 6, average: 3, poor: 1.5 }
      },
      profitabilityRatios: {
        grossProfitMargin: { excellent: 50, good: 40, average: 30, poor: 20 },
        netProfitMargin: { excellent: 20, good: 15, average: 10, poor: 5 },
        returnOnAssets: { excellent: 15, good: 10, average: 7, poor: 3 },
        returnOnEquity: { excellent: 20, good: 15, average: 12, poor: 8 }
      }
    };

    // Performance assessment function
    const assessPerformance = (value, benchmarks) => {
      if (value >= benchmarks.excellent) return { rating: 'ممتاز', color: 'green', score: 5 };
      if (value >= benchmarks.good) return { rating: 'جيد', color: 'blue', score: 4 };
      if (value >= benchmarks.average) return { rating: 'متوسط', color: 'yellow', score: 3 };
      if (value >= benchmarks.poor) return { rating: 'ضعيف', color: 'orange', score: 2 };
      return { rating: 'سيء جداً', color: 'red', score: 1 };
    };

    // Assess performance for each category
    const performanceAssessment = {
      liquidity: {
        currentRatio: assessPerformance(liquidityRatios.currentRatio, industryBenchmarks.liquidityRatios.currentRatio),
        quickRatio: assessPerformance(liquidityRatios.quickRatio, industryBenchmarks.liquidityRatios.quickRatio),
        cashRatio: assessPerformance(liquidityRatios.cashRatio, industryBenchmarks.liquidityRatios.cashRatio)
      },
      leverage: {
        debtToEquity: assessPerformance(1/leverageRatios.debtToEquity, industryBenchmarks.leverageRatios.debtToEquity), // Inverted for better is lower
        interestCoverage: assessPerformance(leverageRatios.interestCoverage, industryBenchmarks.leverageRatios.interestCoverage)
      },
      profitability: {
        grossProfitMargin: assessPerformance(profitabilityRatios.grossProfitMargin, industryBenchmarks.profitabilityRatios.grossProfitMargin),
        netProfitMargin: assessPerformance(profitabilityRatios.netProfitMargin, industryBenchmarks.profitabilityRatios.netProfitMargin),
        returnOnAssets: assessPerformance(profitabilityRatios.returnOnAssets, industryBenchmarks.profitabilityRatios.returnOnAssets),
        returnOnEquity: assessPerformance(profitabilityRatios.returnOnEquity, industryBenchmarks.profitabilityRatios.returnOnEquity)
      }
    };

    // Calculate overall financial health score
    const allScores = Object.values(performanceAssessment).flatMap(category => 
      Object.values(category).map(assessment => assessment.score)
    );
    const overallScore = (allScores.reduce((sum, score) => sum + score, 0) / allScores.length).toFixed(1);
    
    let healthRating = 'سيء جداً';
    let healthColor = 'red';
    if (overallScore >= 4.5) { healthRating = 'ممتاز'; healthColor = 'green'; }
    else if (overallScore >= 3.5) { healthRating = 'جيد'; healthColor = 'blue'; }
    else if (overallScore >= 2.5) { healthRating = 'متوسط'; healthColor = 'yellow'; }
    else if (overallScore >= 1.5) { healthRating = 'ضعيف'; healthColor = 'orange'; }

    res.json({
      success: true,
      data: {
        ratios: {
          liquidity: liquidityRatios,
          leverage: leverageRatios,
          profitability: profitabilityRatios,
          activity: activityRatios,
          market: marketRatios
        },
        performance: performanceAssessment,
        overallHealth: {
          score: parseFloat(overallScore),
          rating: healthRating,
          color: healthColor
        },
        benchmarks: industryBenchmarks,
        financialData,
        period: period || 'current'
      }
    });

  } catch (error) {
    console.error('Error calculating financial ratios:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate financial ratios',
      error: error.message
    });
  }
});

/**
 * Get Trend Analysis
 * Analyze ratio trends over time
 */
router.get('/trends', async (req, res) => {
  try {
    const { periods, ratioType } = req.query;
    const numPeriods = parseInt(periods) || 12;

    // Mock historical data for trend analysis
    const trendData = [];
    const baseRatios = {
      currentRatio: 2.73,
      quickRatio: 2.03,
      debtToEquity: 0.92,
      netProfitMargin: 20.0,
      returnOnAssets: 12.0,
      returnOnEquity: 23.1
    };

    for (let i = numPeriods - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Add realistic variance to base ratios
      const variance = 1 + (Math.random() - 0.5) * 0.2; // ±10% variance
      const trend = Math.sin((i / 12) * 2 * Math.PI) * 0.1; // Seasonal trend
      
      trendData.push({
        period: date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' }),
        date: date.toISOString().split('T')[0],
        currentRatio: Math.round((baseRatios.currentRatio * (variance + trend)) * 100) / 100,
        quickRatio: Math.round((baseRatios.quickRatio * (variance + trend)) * 100) / 100,
        debtToEquity: Math.round((baseRatios.debtToEquity * (variance - trend)) * 100) / 100, // Inverse trend for debt
        netProfitMargin: Math.round((baseRatios.netProfitMargin * (variance + trend)) * 100) / 100,
        returnOnAssets: Math.round((baseRatios.returnOnAssets * (variance + trend)) * 100) / 100,
        returnOnEquity: Math.round((baseRatios.returnOnEquity * (variance + trend)) * 100) / 100
      });
    }

    // Calculate trend direction for each ratio
    const trendAnalysis = {};
    Object.keys(baseRatios).forEach(ratio => {
      const values = trendData.map(d => d[ratio]);
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      const change = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      trendAnalysis[ratio] = {
        direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
        changePercentage: Math.round(change * 100) / 100,
        currentValue: values[values.length - 1],
        previousValue: values[values.length - 2],
        volatility: Math.round((Math.max(...values) - Math.min(...values)) * 100) / 100
      };
    });

    res.json({
      success: true,
      data: {
        trends: trendData,
        analysis: trendAnalysis,
        summary: {
          periodsAnalyzed: numPeriods,
          improvingRatios: Object.keys(trendAnalysis).filter(key => trendAnalysis[key].direction === 'improving').length,
          decliningRatios: Object.keys(trendAnalysis).filter(key => trendAnalysis[key].direction === 'declining').length,
          stableRatios: Object.keys(trendAnalysis).filter(key => trendAnalysis[key].direction === 'stable').length
        }
      }
    });

  } catch (error) {
    console.error('Error generating trend analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate trend analysis',
      error: error.message
    });
  }
});

/**
 * Get Peer Comparison
 * Compare ratios with industry peers
 */
router.get('/peer-comparison', async (req, res) => {
  try {
    const { industry, companySize } = req.query;

    // Mock peer comparison data
    const companyRatios = {
      currentRatio: 2.73,
      quickRatio: 2.03,
      debtToEquity: 0.92,
      netProfitMargin: 20.0,
      returnOnAssets: 12.0,
      returnOnEquity: 23.1,
      assetTurnover: 0.60,
      inventoryTurnover: 3.78
    };

    const peerData = {
      industryMedian: {
        currentRatio: 2.1,
        quickRatio: 1.8,
        debtToEquity: 1.2,
        netProfitMargin: 15.5,
        returnOnAssets: 8.5,
        returnOnEquity: 18.2,
        assetTurnover: 0.85,
        inventoryTurnover: 4.2
      },
      topQuartile: {
        currentRatio: 3.5,
        quickRatio: 2.8,
        debtToEquity: 0.6,
        netProfitMargin: 25.0,
        returnOnAssets: 15.0,
        returnOnEquity: 28.0,
        assetTurnover: 1.2,
        inventoryTurnover: 6.0
      },
      bottomQuartile: {
        currentRatio: 1.5,
        quickRatio: 1.2,
        debtToEquity: 2.0,
        netProfitMargin: 8.0,
        returnOnAssets: 4.0,
        returnOnEquity: 10.0,
        assetTurnover: 0.45,
        inventoryTurnover: 2.5
      }
    };

    // Calculate percentile ranking
    const percentileRanking = {};
    Object.keys(companyRatios).forEach(ratio => {
      const companyValue = companyRatios[ratio];
      const median = peerData.industryMedian[ratio];
      const topQuartile = peerData.topQuartile[ratio];
      const bottomQuartile = peerData.bottomQuartile[ratio];
      
      let percentile;
      if (companyValue >= topQuartile) percentile = 90;
      else if (companyValue >= median) percentile = 65;
      else if (companyValue >= bottomQuartile) percentile = 35;
      else percentile = 15;
      
      percentileRanking[ratio] = {
        percentile,
        companyValue,
        industryMedian: median,
        performance: companyValue > median ? 'above_average' : 
                    companyValue > bottomQuartile ? 'average' : 'below_average',
        gap: companyValue - median
      };
    });

    // Generate insights
    const insights = [
      {
        type: 'strength',
        title: 'نقاط القوة',
        items: Object.keys(percentileRanking)
          .filter(ratio => percentileRanking[ratio].performance === 'above_average')
          .map(ratio => ({
            ratio,
            message: `${ratio === 'currentRatio' ? 'نسبة السيولة الجارية' : 
                     ratio === 'netProfitMargin' ? 'هامش الربح الصافي' : 
                     ratio === 'returnOnEquity' ? 'العائد على الملكية' : ratio} أعلى من متوسط الصناعة`
          }))
      },
      {
        type: 'improvement',
        title: 'مجالات التحسين',
        items: Object.keys(percentileRanking)
          .filter(ratio => percentileRanking[ratio].performance === 'below_average')
          .map(ratio => ({
            ratio,
            message: `${ratio === 'assetTurnover' ? 'دوران الأصول' : 
                     ratio === 'inventoryTurnover' ? 'دوران المخزون' : ratio} أقل من متوسط الصناعة`
          }))
      }
    ];

    res.json({
      success: true,
      data: {
        companyRatios,
        peerData,
        percentileRanking,
        insights,
        metadata: {
          industry: industry || 'shipping_logistics',
          companySize: companySize || 'medium',
          peersAnalyzed: 25,
          dataSource: 'industry_database'
        }
      }
    });

  } catch (error) {
    console.error('Error generating peer comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate peer comparison',
      error: error.message
    });
  }
});

/**
 * Get Ratio Recommendations
 * AI-powered recommendations for improving financial ratios
 */
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = [
      {
        id: 'improve_liquidity',
        category: 'السيولة',
        priority: 'medium',
        title: 'تحسين إدارة السيولة قصيرة الأجل',
        currentRatio: 'currentRatio',
        currentValue: 2.73,
        targetValue: 3.0,
        description: 'زيادة نسبة السيولة الجارية لتعزيز القدرة على الوفاء بالالتزامات قصيرة الأجل',
        actions: [
          'تحسين إدارة النقد والاستثمارات قصيرة الأجل',
          'تقليل المخزون الزائد وتحسين دوران المخزون',
          'تسريع تحصيل الذمم المدينة'
        ],
        expectedImpact: 'زيادة الثقة لدى المقرضين والشركاء التجاريين',
        timeframe: '3-6 أشهر'
      },
      {
        id: 'reduce_leverage',
        category: 'المديونية',
        priority: 'high',
        title: 'تقليل نسبة المديونية إلى الملكية',
        currentRatio: 'debtToEquity',
        currentValue: 0.92,
        targetValue: 0.7,
        description: 'تحسين الهيكل المالي من خلال تقليل الاعتماد على الديون',
        actions: [
          'سداد جزء من الديون طويلة الأجل',
          'زيادة رأس المال من خلال الأرباح المحتجزة',
          'إعادة هيكلة الديون الحالية'
        ],
        expectedImpact: 'تحسين الملاءة المالية وتقليل مخاطر الإفلاس',
        timeframe: '6-12 شهر'
      },
      {
        id: 'improve_asset_efficiency',
        category: 'كفاءة الأصول',
        priority: 'medium',
        title: 'تحسين كفاءة استخدام الأصول',
        currentRatio: 'assetTurnover',
        currentValue: 0.60,
        targetValue: 0.85,
        description: 'زيادة المبيعات نسبة إلى الأصول لتحسين كفاءة استخدام الأصول',
        actions: [
          'تحسين استغلال الطاقة الإنتاجية',
          'التخلص من الأصول غير المنتجة',
          'تحسين استراتيجيات التسويق والمبيعات'
        ],
        expectedImpact: 'زيادة الإيرادات وتحسين العائد على الأصول',
        timeframe: '6-9 أشهر'
      },
      {
        id: 'optimize_inventory',
        category: 'إدارة المخزون',
        priority: 'high',
        title: 'تحسين دوران المخزون',
        currentRatio: 'inventoryTurnover',
        currentValue: 3.78,
        targetValue: 5.0,
        description: 'تسريع دوران المخزون لتحرير رأس المال العامل',
        actions: [
          'تطبيق نظام إدارة المخزون JIT',
          'تحليل وتصفية المخزون بطيء الحركة',
          'تحسين التنبؤ بالطلب'
        ],
        expectedImpact: 'تحرير رأس المال وتقليل تكاليف التخزين',
        timeframe: '3-6 أشهر'
      }
    ];

    // Calculate potential impact
    const totalPotentialImpact = {
      liquidityImprovement: 10, // percentage points
      leverageReduction: 24, // percentage points  
      assetEfficiencyGain: 42, // percentage points
      inventoryOptimization: 32 // percentage points
    };

    const summary = {
      totalRecommendations: recommendations.length,
      highPriorityCount: recommendations.filter(r => r.priority === 'high').length,
      mediumPriorityCount: recommendations.filter(r => r.priority === 'medium').length,
      averageTimeframe: '6 أشهر',
      totalPotentialImpact
    };

    res.json({
      success: true,
      data: {
        recommendations,
        summary
      }
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
});

/**
 * Export financial ratios data
 */
router.get('/export/:analysisType', async (req, res) => {
  try {
    const { analysisType } = req.params;
    const { format, period } = req.query;

    const exportData = {
      analysisType,
      format: format || 'json',
      period: period || 'current',
      generatedAt: new Date().toISOString(),
      data: `Financial ratios ${analysisType} export`
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=financial_ratios_${analysisType}.csv`);
      res.send('CSV export data would be here');
    } else {
      res.json({
        success: true,
        message: 'Financial ratios export generated successfully',
        data: exportData
      });
    }

  } catch (error) {
    console.error('Error exporting financial ratios:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export financial ratios',
      error: error.message
    });
  }
});

export default router;
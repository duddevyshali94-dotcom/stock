const express = require('express');
const aiGuidanceService = require('../services/aiGuidanceService');
const analyticsService = require('../services/analyticsService');
const { authenticateUser } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const logger = require('../utils/logger');
const healthChecker = require('../utils/healthCheck');

const router = express.Router();

/**
 * GET /api/guidance/portfolio
 * Get overall portfolio guidance for authenticated user
 */
router.get('/portfolio', authenticateUser, async (req, res) => {
    const startTime = Date.now();
    
    try {
        logger.logUserAction(req.user.id, 'portfolio_guidance_requested', {
            endpoint: '/api/guidance/portfolio'
        });

        const result = await aiGuidanceService.generatePortfolioGuidance(req.user.id);
        
        const responseTime = Date.now() - startTime;
        logger.logAIServiceCall('aiGuidanceService', 'generatePortfolioGuidance', responseTime, {
            userId: req.user.id,
            success: result.success
        });

        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        const responseTime = Date.now() - startTime;
        logger.error('Error in portfolio guidance endpoint', error, {
            userId: req.user.id,
            endpoint: '/api/guidance/portfolio',
            responseTime
        });

        res.status(500).json({
            success: false,
            error: 'Failed to generate portfolio guidance',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/guidance/stock/:symbol
 * Get guidance for specific stock
 */
router.get('/stock/:symbol', authenticateUser, async (req, res) => {
    const startTime = Date.now();
    const { symbol } = req.params;
    
    try {
        logger.logUserAction(req.user.id, 'stock_guidance_requested', {
            symbol,
            endpoint: `/api/guidance/stock/${symbol}`
        });

        // Get stock price data
        const priceData = await aiGuidanceService.getStockPriceData(symbol);
        
        if (!priceData) {
            return res.status(404).json({
                success: false,
                error: 'Stock not found or insufficient data',
                timestamp: new Date().toISOString()
            });
        }

        // Analyze price movement
        const priceAnalysis = await aiGuidanceService.analyzePriceMovement(symbol, priceData);
        
        if (!priceAnalysis.success) {
            return res.status(400).json({
                success: false,
                error: priceAnalysis.error,
                timestamp: new Date().toISOString()
            });
        }

        // Get user's portfolio context
        const { data: portfolio } = await supabase
            .from('portfolios')
            .select(`
                *,
                portfolio_holdings (
                    quantity,
                    stocks (
                        symbol,
                        current_price
                    )
                )
            `)
            .eq('user_id', req.user.id)
            .single();

        // Generate stock recommendation
        const recommendation = await aiGuidanceService.generateStockRecommendation(
            symbol, 
            priceAnalysis, 
            portfolio ? { 
                portfolio, 
                holdings: portfolio.portfolio_holdings 
            } : null
        );

        const responseTime = Date.now() - startTime;
        logger.logAIServiceCall('aiGuidanceService', 'generateStockRecommendation', responseTime, {
            userId: req.user.id,
            symbol,
            success: true,
            recommendation: recommendation.action
        });

        res.json({
            success: true,
            data: {
                stock: {
                    symbol: symbol.toUpperCase()
                },
                recommendation: recommendation.action,
                confidence: recommendation.confidence,
                reasoning: recommendation.reasoning,
                target_price: recommendation.target_price,
                analysis: {
                    trend: priceAnalysis.trend,
                    momentum: priceAnalysis.momentum,
                    volatility: priceAnalysis.volatility,
                    rsi: priceAnalysis.rsi,
                    support_level: priceAnalysis.support_level,
                    resistance_level: priceAnalysis.resistance_level,
                    price_change_percent: priceAnalysis.price_change_percent
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        logger.error('Error in stock guidance endpoint', error, {
            userId: req.user.id,
            symbol,
            endpoint: `/api/guidance/stock/${symbol}`,
            responseTime
        });

        res.status(500).json({
            success: false,
            error: 'Failed to generate stock guidance',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/guidance/beginner-tips
 * Get educational content for beginners (public endpoint)
 */
router.get('/beginner-tips', async (req, res) => {
    const startTime = Date.now();
    
    try {
        let userId = null;
        let personalizedContent = null;

        // If user is authenticated, provide personalized content
        if (req.user) {
            userId = req.user.id;
            logger.logUserAction(userId, 'beginner_guidance_requested', {
                endpoint: '/api/guidance/beginner-tips',
                personalized: true
            });
        } else {
            logger.info('Beginner tips accessed without authentication', {
                endpoint: '/api/guidance/beginner-tips',
                personalized: false
            });
        }

        // Get beginner guidance (with user context if authenticated)
        const result = await aiGuidanceService.getBeginnersGuidance(userId);
        
        const responseTime = Date.now() - startTime;
        logger.logAIServiceCall('aiGuidanceService', 'getBeginnersGuidance', responseTime, {
            userId: userId || 'anonymous',
            personalized: !!userId
        });

        if (result.success) {
            res.json({
                success: true,
                data: {
                    tips: result.data.tips,
                    educationalContent: result.data.educationalContent,
                    marketInsights: result.data.marketInsights,
                    riskAssessment: result.data.riskAssessment,
                    personalizedTips: result.data.personalizedTips || [],
                    isPersonalized: !!userId
                },
                timestamp: new Date().toISOString()
            });
        } else {
            // Return basic content even if personalized content fails
            const basicContent = {
                tips: [
                    {
                        title: 'Start with Diversification',
                        description: 'Don\'t put all your money in one stock. Spread investments across different sectors and asset types.',
                        level: 'beginner'
                    },
                    {
                        title: 'Understand Dollar-Cost Averaging',
                        description: 'Invest a fixed amount regularly regardless of market conditions to reduce timing risk.',
                        level: 'beginner'
                    },
                    {
                        title: 'Set Stop-Loss Orders',
                        description: 'Limit your losses by setting automatic sell orders when stocks drop to a certain price.',
                        level: 'intermediate'
                    }
                ],
                educationalContent: {
                    investmentPrinciples: [
                        'Never invest more than you can afford to lose',
                        'Diversification reduces risk',
                        'Long-term investing often outperforms short-term trading',
                        'Research before investing',
                        'Keep emotions out of investment decisions'
                    ],
                    readingMarketData: [
                        'P/E Ratio: Price-to-earnings ratio indicates stock valuation',
                        'Volume: Shows market interest in a stock',
                        'Moving Averages: Help identify price trends',
                        'RSI: Measures overbought/oversold conditions'
                    ],
                    riskManagement: [
                        'Set a budget for investing',
                        'Diversify across sectors',
                        'Use stop-loss orders',
                        'Don\'t panic sell',
                        'Review portfolio regularly'
                    ]
                },
                marketInsights: {
                    marketSentiment: 'Neutral',
                    topSectors: ['Technology', 'Healthcare', 'Financials'],
                    mostVolatile: ['TSLA', 'GME', 'AMC'],
                    trendingUp: ['AAPL', 'MSFT', 'GOOGL'],
                    trendingDown: ['NFLX', 'META', 'NVDA']
                },
                isPersonalized: false
            };

            res.json({
                success: true,
                data: basicContent,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        const responseTime = Date.now() - startTime;
        logger.error('Error in beginner tips endpoint', error, {
            endpoint: '/api/guidance/beginner-tips',
            responseTime
        });

        res.status(500).json({
            success: false,
            error: 'Failed to fetch beginner tips',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/guidance/feedback
 * Record user feedback on guidance quality
 */
router.post('/feedback', authenticateUser, async (req, res) => {
    const startTime = Date.now();
    const { recommendation_type, helpful, acted_upon, successful, rating, comments } = req.body;
    
    try {
        // Validate feedback data
        if (!recommendation_type) {
            return res.status(400).json({
                success: false,
                error: 'recommendation_type is required',
                timestamp: new Date().toISOString()
            });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5',
                timestamp: new Date().toISOString()
            });
        }

        logger.logUserAction(req.user.id, 'guidance_feedback_submitted', {
            recommendation_type,
            helpful,
            rating,
            endpoint: '/api/guidance/feedback'
        });

        const feedback = {
            recommendation_type,
            helpful: Boolean(helpful),
            acted_upon: Boolean(acted_upon),
            successful: Boolean(successful),
            rating: rating ? Number(rating) : null,
            comments: comments || ''
        };

        const result = await analyticsService.recordGuidanceFeedback(req.user.id, feedback);
        
        const responseTime = Date.now() - startTime;
        logger.logBusinessEvent('guidance_feedback_recorded', {
            userId: req.user.id,
            feedback,
            responseTime,
            success: result.success
        });

        if (result.success) {
            res.json({
                success: true,
                data: {
                    id: result.data.id,
                    message: 'Feedback recorded successfully'
                },
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        const responseTime = Date.now() - startTime;
        logger.error('Error recording guidance feedback', error, {
            userId: req.user.id,
            endpoint: '/api/guidance/feedback',
            responseTime
        });

        res.status(500).json({
            success: false,
            error: 'Failed to record feedback',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/guidance/dashboard
 * Get all guidance information for dashboard
 */
router.get('/dashboard', authenticateUser, async (req, res) => {
    const startTime = Date.now();
    
    try {
        logger.logUserAction(req.user.id, 'dashboard_guidance_requested', {
            endpoint: '/api/guidance/dashboard'
        });

        // Get all guidance data in parallel
        const [portfolioGuidance, beginnerTips, userAnalytics] = await Promise.all([
            aiGuidanceService.generatePortfolioGuidance(req.user.id),
            aiGuidanceService.getBeginnersGuidance(req.user.id),
            analyticsService.getUserActivityMetrics(req.user.id)
        ]);

        // Compile dashboard data
        const dashboardData = {
            portfolio_guidance: portfolioGuidance.success ? portfolioGuidance.data : null,
            beginner_guidance: beginnerTips.success ? {
                tips: beginnerTips.data.tips,
                marketInsights: beginnerTips.data.marketInsights,
                riskAssessment: beginnerTips.data.riskAssessment
            } : null,
            user_analytics: userAnalytics.success ? userAnalytics.data : null,
            system_health: healthChecker.getCurrentHealth()
        };

        const responseTime = Date.now() - startTime;
        logger.info('Dashboard guidance data compiled', {
            userId: req.user.id,
            responseTime,
            dataAvailability: {
                portfolio_guidance: !!dashboardData.portfolio_guidance,
                beginner_guidance: !!dashboardData.beginner_guidance,
                user_analytics: !!dashboardData.user_analytics
            }
        });

        res.json({
            success: true,
            data: dashboardData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        logger.error('Error in dashboard guidance endpoint', error, {
            userId: req.user.id,
            endpoint: '/api/guidance/dashboard',
            responseTime
        });

        res.status(500).json({
            success: false,
            error: 'Failed to compile dashboard data',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/guidance/analytics
 * Get guidance analytics (admin only)
 */
router.get('/analytics', authenticateUser, checkRole(['admin']), async (req, res) => {
    const startTime = Date.now();
    
    try {
        logger.logUserAction(req.user.id, 'guidance_analytics_requested', {
            endpoint: '/api/guidance/analytics',
            userRole: req.user.role
        });

        const [globalEffectiveness, platformMetrics] = await Promise.all([
            analyticsService.getGuidanceEffectiveness(), // No userId = global metrics
            analyticsService.getPlatformMetrics()
        ]);

        const responseTime = Date.now() - startTime;
        logger.logBusinessEvent('guidance_analytics_accessed', {
            adminId: req.user.id,
            responseTime,
            success: true
        });

        res.json({
            success: true,
            data: {
                guidance_effectiveness: globalEffectiveness.success ? globalEffectiveness.data : null,
                platform_metrics: platformMetrics.success ? platformMetrics.data : null
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        logger.error('Error in guidance analytics endpoint', error, {
            userId: req.user.id,
            endpoint: '/api/guidance/analytics',
            responseTime
        });

        res.status(500).json({
            success: false,
            error: 'Failed to fetch guidance analytics',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/guidance/health
 * Get guidance service health status
 */
router.get('/health', async (req, res) => {
    try {
        const healthStatus = healthChecker.getCurrentHealth();
        const guidanceHealth = {
            service: 'AI Guidance Service',
            status: healthStatus && healthStatus.status !== 'unhealthy' ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime: process.uptime(),
            features: {
                portfolio_guidance: true,
                stock_analysis: true,
                beginner_tips: true,
                feedback_tracking: true,
                analytics: true
            }
        };

        res.json({
            success: true,
            data: guidanceHealth
        });

    } catch (error) {
        logger.error('Error in guidance health endpoint', error, {
            endpoint: '/api/guidance/health'
        });

        res.status(500).json({
            success: false,
            error: 'Failed to get guidance health status',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
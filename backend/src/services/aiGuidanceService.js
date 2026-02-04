const { supabase } = require('../config/supabase');
const { calculateMovingAverage, calculateRSI, calculateBollingerBands, identifyTrend, calculateVolatility } = require('./priceAnalysisService');
const { analyzePortfolio, calculateRiskMetrics } = require('./portfolioAnalysisService');
const { fetchChart } = require('./yahooFinanceService');

class AIGuidanceService {
    constructor() {
        this.dataProvider = 'yahoo-finance';
    }

    /**
     * Generate comprehensive guidance for user's portfolio
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Portfolio guidance with recommendations
     */
    async generatePortfolioGuidance(userId) {
        try {
            // Get user's portfolio
            const { data: portfolio } = await supabase
                .from('portfolios')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!portfolio) {
                return {
                    success: false,
                    error: 'Portfolio not found'
                };
            }

            // Get portfolio holdings
            const { data: holdings } = await supabase
                .from('portfolio_holdings')
                .select(`
                    *,
                    stocks (
                        symbol,
                        name,
                        current_price,
                        sector
                    )
                `)
                .eq('portfolio_id', portfolio.id);

            // Analyze portfolio
            const portfolioAnalysis = await analyzePortfolio(userId, null);
            const riskMetrics = await calculateRiskMetrics(portfolio);

            // Generate stock recommendations
            const recommendations = [];
            for (const holding of holdings) {
                const stock = holding.stocks;
                const priceData = await this.getStockPriceData(stock.symbol);
                
                if (priceData) {
                    const recommendation = await this.generateStockRecommendation(
                        stock.symbol, 
                        priceData, 
                        { portfolio, holdings }
                    );
                    recommendations.push({
                        stock: stock,
                        recommendation: recommendation.action,
                        reasoning: recommendation.reasoning,
                        confidence: recommendation.confidence,
                        target_price: recommendation.target_price,
                        current_position: holding.quantity,
                        current_value: holding.quantity * stock.current_price
                    });
                }
            }

            // Generate diversification suggestions
            const diversification = await this.calculatePortfolioDiversification(portfolio);

            return {
                success: true,
                data: {
                    portfolio_summary: {
                        total_value: portfolioAnalysis.total_value,
                        total_cost: portfolioAnalysis.total_cost,
                        total_gain_loss: portfolioAnalysis.total_gain_loss,
                        total_gain_loss_percent: portfolioAnalysis.total_gain_loss_percent
                    },
                    recommendations: recommendations.sort((a, b) => b.confidence - a.confidence),
                    risk_assessment: riskMetrics,
                    diversification_analysis: diversification,
                    insights: this.generatePortfolioInsights(portfolioAnalysis, riskMetrics, diversification)
                }
            };

        } catch (error) {
            console.error('Error generating portfolio guidance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analyze stock price movements and trends
     * @param {string} symbol - Stock symbol
     * @param {Object} priceData - Price data for analysis
     * @returns {Promise<Object>} Price analysis results
     */
    async analyzePriceMovement(symbol, priceData) {
        try {
            if (!priceData || !priceData.prices || priceData.prices.length === 0) {
                throw new Error('Insufficient price data for analysis');
            }

            const prices = priceData.prices.map(p => parseFloat(p.close));
            const volumes = priceData.prices.map(p => parseFloat(p.volume));

            // Calculate technical indicators
            const movingAverage5 = calculateMovingAverage(prices, 5);
            const movingAverage20 = calculateMovingAverage(prices, 20);
            const rsi = calculateRSI(prices, 14);
            const bollingerBands = calculateBollingerBands(prices, 20, 2);
            const trend = identifyTrend(prices, 20);
            const volatility = calculateVolatility(prices, 20);

            const currentPrice = prices[prices.length - 1];
            const previousPrice = prices[prices.length - 2];
            const priceChange = currentPrice - previousPrice;
            const priceChangePercent = (priceChange / previousPrice) * 100;

            // Identify support and resistance levels
            const supportLevel = Math.min(...prices.slice(-20));
            const resistanceLevel = Math.max(...prices.slice(-20));

            // Determine momentum
            let momentum = 'neutral';
            if (priceChangePercent > 2) momentum = 'strong_bullish';
            else if (priceChangePercent > 0.5) momentum = 'bullish';
            else if (priceChangePercent < -2) momentum = 'strong_bearish';
            else if (priceChangePercent < -0.5) momentum = 'bearish';

            return {
                trend,
                momentum,
                volatility,
                support_level: supportLevel,
                resistance_level: resistanceLevel,
                price_change: priceChange,
                price_change_percent: priceChangePercent,
                moving_averages: {
                    ma5: movingAverage5[movingAverage5.length - 1],
                    ma20: movingAverage20[movingAverage20.length - 1]
                },
                rsi,
                bollinger_bands: bollingerBands,
                current_price: currentPrice,
                volume_analysis: this.analyzeVolume(volumes)
            };

        } catch (error) {
            console.error('Error analyzing price movement:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate stock recommendation based on analysis
     * @param {string} symbol - Stock symbol
     * @param {Object} priceAnalysis - Price analysis results
     * @param {Object} portfolioContext - User's portfolio context
     * @returns {Promise<Object>} Stock recommendation
     */
    async generateStockRecommendation(symbol, priceAnalysis, portfolioContext) {
        try {
            let score = 0;
            let reasoning = [];
            let confidence = 0;

            const currentPrice = priceAnalysis.current_price;
            const trend = priceAnalysis.trend;
            const rsi = priceAnalysis.rsi;
            const volatility = priceAnalysis.volatility;

            // Trend analysis scoring
            if (trend === 'uptrend') {
                score += 2;
                reasoning.push('Strong uptrend detected');
            } else if (trend === 'downtrend') {
                score -= 2;
                reasoning.push('Downtrend detected');
            } else {
                score += 0;
                reasoning.push('Consolidating within range');
            }

            // RSI analysis
            if (rsi > 70) {
                score -= 1;
                confidence += 0.1;
                reasoning.push('Overbought condition (RSI > 70)');
            } else if (rsi < 30) {
                score += 1;
                confidence += 0.1;
                reasoning.push('Oversold condition (RSI < 30)');
            } else {
                confidence += 0.05;
                reasoning.push('RSI in normal range');
            }

            // Price momentum analysis
            const priceChangePercent = priceAnalysis.price_change_percent;
            if (priceChangePercent > 3) {
                score += 1;
                reasoning.push('Strong positive momentum');
            } else if (priceChangePercent < -3) {
                score -= 1;
                reasoning.push('Strong negative momentum');
            }

            // Volatility consideration
            if (volatility > 0.05) {
                reasoning.push('High volatility detected - consider position sizing');
                confidence -= 0.05;
            }

            // Portfolio concentration check
            if (portfolioContext && portfolioContext.holdings) {
                const totalValue = portfolioContext.holdings.reduce((sum, h) => 
                    sum + (h.quantity * h.stocks.current_price), 0);
                const stockValue = portfolioContext.holdings.find(h => h.stocks.symbol === symbol)?.quantity * currentPrice || 0;
                const concentration = (stockValue / totalValue) * 100;

                if (concentration > 25) {
                    score -= 1;
                    reasoning.push(`High portfolio concentration (${concentration.toFixed(1)}%)`);
                } else if (concentration < 5) {
                    score += 0.5;
                    reasoning.push('Room for position increase');
                }
            }

            // Determine action
            let action = 'HOLD';
            if (score >= 2) {
                action = 'BUY';
                confidence = Math.min(confidence + 0.2, 0.95);
            } else if (score <= -2) {
                action = 'SELL';
                confidence = Math.min(confidence + 0.2, 0.95);
            }

            // Calculate target price
            const targetMultiplier = action === 'BUY' ? 1.1 : action === 'SELL' ? 0.9 : 1.05;
            const target_price = currentPrice * targetMultiplier;

            return {
                action,
                confidence: Math.max(confidence, 0.3),
                reasoning: reasoning.join('; '),
                target_price: parseFloat(target_price.toFixed(2)),
                analysis_score: score
            };

        } catch (error) {
            console.error('Error generating stock recommendation:', error);
            return {
                action: 'HOLD',
                confidence: 0.3,
                reasoning: 'Unable to generate recommendation due to insufficient data',
                target_price: 0,
                analysis_score: 0
            };
        }
    }

    /**
     * Calculate portfolio diversification metrics
     * @param {Object} portfolio - Portfolio object
     * @returns {Promise<Object>} Diversification analysis
     */
    async calculatePortfolioDiversification(portfolio) {
        try {
            const { data: holdings } = await supabase
                .from('portfolio_holdings')
                .select(`
                    quantity,
                    stocks (
                        symbol,
                        sector,
                        current_price
                    )
                `)
                .eq('portfolio_id', portfolio.id);

            if (!holdings || holdings.length === 0) {
                return {
                    diversificationScore: 0,
                    recommendations: ['No holdings to analyze'],
                    sectorAllocation: {},
                    concentrationRisk: 'No positions'
                };
            }

            // Calculate total portfolio value
            const totalValue = holdings.reduce((sum, holding) => 
                sum + (holding.quantity * holding.stocks.current_price), 0);

            // Calculate sector allocation
            const sectorAllocation = {};
            const symbolAllocation = {};

            holdings.forEach(holding => {
                const value = holding.quantity * holding.stocks.current_price;
                const sector = holding.stocks.sector || 'Unknown';
                
                sectorAllocation[sector] = (sectorAllocation[sector] || 0) + value;
                symbolAllocation[holding.stocks.symbol] = (symbolAllocation[holding.stocks.symbol] || 0) + value;
            });

            // Calculate percentages
            Object.keys(sectorAllocation).forEach(sector => {
                sectorAllocation[sector] = (sectorAllocation[sector] / totalValue) * 100;
            });

            Object.keys(symbolAllocation).forEach(symbol => {
                symbolAllocation[symbol] = (symbolAllocation[symbol] / totalValue) * 100;
            });

            // Calculate diversification score (0-100)
            let diversificationScore = 0;
            const sectorCount = Object.keys(sectorAllocation).length;
            const symbolCount = Object.keys(symbolAllocation).length;
            
            // Score based on number of sectors (max 40 points)
            diversificationScore += Math.min(sectorCount * 8, 40);
            
            // Score based on sector balance (max 30 points)
            const sectorValues = Object.values(sectorAllocation);
            const maxSectorWeight = Math.max(...sectorValues);
            if (maxSectorWeight < 40) diversificationScore += 30;
            else if (maxSectorWeight < 60) diversificationScore += 15;
            
            // Score based on symbol count (max 30 points)
            diversificationScore += Math.min(symbolCount * 2, 30);

            // Generate recommendations
            const recommendations = [];
            const concentrationRisk = maxSectorWeight > 50 ? 'High' : maxSectorWeight > 30 ? 'Medium' : 'Low';

            if (sectorCount < 3) {
                recommendations.push('Consider adding stocks from different sectors');
            }
            
            if (maxSectorWeight > 40) {
                recommendations.push(`Reduce concentration in ${Object.keys(sectorAllocation).find(s => sectorAllocation[s] === maxSectorWeight)} sector`);
            }

            if (symbolCount < 5) {
                recommendations.push('Add more individual stocks to improve diversification');
            }

            return {
                diversificationScore: Math.round(diversificationScore),
                recommendations,
                sectorAllocation,
                symbolAllocation,
                concentrationRisk,
                totalPositions: holdings.length,
                totalValue: totalValue
            };

        } catch (error) {
            console.error('Error calculating portfolio diversification:', error);
            return {
                diversificationScore: 0,
                recommendations: ['Error analyzing diversification'],
                sectorAllocation: {},
                concentrationRisk: 'Unknown'
            };
        }
    }

    /**
     * Generate educational guidance for beginners
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Educational content and tips
     */
    async getBeginnersGuidance(userId) {
        try {
            // Get user's portfolio for personalized tips
            const { data: portfolio } = await supabase
                .from('portfolios')
                .select(`
                    *,
                    portfolio_holdings (
                        quantity,
                        stocks (
                            symbol,
                            sector
                        )
                    )
                `)
                .eq('user_id', userId)
                .single();

            const tips = [
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
                },
                {
                    title: 'Monitor Volatility',
                    description: 'High volatility stocks can offer high returns but also high risks. Adjust your strategy accordingly.',
                    level: 'intermediate'
                },
                {
                    title: 'Rebalance Regularly',
                    description: 'Periodically adjust your portfolio to maintain your target asset allocation.',
                    level: 'advanced'
                }
            ];

            // Market insights
            const marketInsights = await this.getCurrentMarketInsights();

            // Risk assessment
            const riskAssessment = await this.assessBeginnerRisk(userId, portfolio);

            return {
                success: true,
                data: {
                    tips,
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
                    marketInsights,
                    riskAssessment,
                    personalizedTips: this.generatePersonalizedTips(portfolio)
                }
            };

        } catch (error) {
            console.error('Error generating beginner guidance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get stock price data from external API
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Object>} Stock price data
     */
    async getStockPriceData(symbol) {
        try {
            const prices = await fetchChart(symbol, '1mo', '1d');
            if (!prices || prices.length === 0) {
                return null;
            }

            return {
                provider: this.dataProvider,
                symbol: symbol.toUpperCase(),
                prices
            };
        } catch (error) {
            console.error('Error fetching stock price data:', error);
            return null;
        }
    }

    /**
     * Analyze trading volume
     * @param {Array} volumes - Volume data
     * @returns {Object} Volume analysis
     */
    analyzeVolume(volumes) {
        if (!volumes || volumes.length < 5) {
            return { analysis: 'Insufficient data' };
        }

        const avgVolume = volumes.slice(0, -1).reduce((sum, v) => sum + v, 0) / (volumes.length - 1);
        const recentVolume = volumes[volumes.length - 1];
        const volumeRatio = recentVolume / avgVolume;

        if (volumeRatio > 1.5) {
            return { analysis: 'High volume', ratio: volumeRatio.toFixed(2) };
        } else if (volumeRatio < 0.5) {
            return { analysis: 'Low volume', ratio: volumeRatio.toFixed(2) };
        } else {
            return { analysis: 'Normal volume', ratio: volumeRatio.toFixed(2) };
        }
    }

    /**
     * Generate portfolio insights
     * @param {Object} portfolioAnalysis - Portfolio analysis
     * @param {Object} riskMetrics - Risk metrics
     * @param {Object} diversification - Diversification analysis
     * @returns {Array} Portfolio insights
     */
    generatePortfolioInsights(portfolioAnalysis, riskMetrics, diversification) {
        const insights = [];

        if (portfolioAnalysis.total_gain_loss_percent > 10) {
            insights.push('Your portfolio is performing well with strong gains');
        } else if (portfolioAnalysis.total_gain_loss_percent < -10) {
            insights.push('Consider reviewing your portfolio allocation due to significant losses');
        }

        if (riskMetrics.riskLevel === 'high') {
            insights.push('Your portfolio has high risk exposure. Consider diversifying');
        }

        if (diversification.diversificationScore < 50) {
            insights.push('Your portfolio could benefit from better diversification');
        }

        if (insights.length === 0) {
            insights.push('Your portfolio shows balanced performance');
        }

        return insights;
    }

    /**
     * Get current market insights
     * @returns {Promise<Object>} Market insights
     */
    async getCurrentMarketInsights() {
        return {
            marketSentiment: 'Neutral',
            topSectors: ['Technology', 'Healthcare', 'Financials'],
            mostVolatile: ['TSLA', 'GME', 'AMC'],
            trendingUp: ['AAPL', 'MSFT', 'GOOGL'],
            trendingDown: ['NFLX', 'META', 'NVDA']
        };
    }

    /**
     * Assess beginner's risk tolerance
     * @param {string} userId - User ID
     * @param {Object} portfolio - User's portfolio
     * @returns {Object} Risk assessment
     */
    async assessBeginnerRisk(userId, portfolio) {
        let riskLevel = 'low';
        let recommendations = [];

        if (!portfolio || !portfolio.portfolio_holdings || portfolio.portfolio_holdings.length === 0) {
            return {
                riskLevel: 'unknown',
                recommendations: ['Start with a small, diversified portfolio'],
                suggestedAllocation: {
                    stocks: '70%',
                    bonds: '20%',
                    cash: '10%'
                }
            };
        }

        // Simple risk assessment based on portfolio composition
        const holdings = portfolio.portfolio_holdings;
        const totalValue = holdings.reduce((sum, h) => sum + (h.quantity * h.stocks.current_price), 0);
        const highVolStocks = holdings.filter(h => ['TSLA', 'GME', 'AMC'].includes(h.stocks.symbol)).length;

        if (highVolStocks / holdings.length > 0.3) {
            riskLevel = 'high';
            recommendations.push('Consider reducing exposure to high-volatility stocks');
        } else {
            riskLevel = 'medium';
            recommendations.push('Your portfolio has moderate risk - good for beginners');
        }

        return {
            riskLevel,
            recommendations,
            suggestedAllocation: {
                stocks: '70%',
                bonds: '20%',
                cash: '10%'
            }
        };
    }

    /**
     * Generate personalized tips based on portfolio
     * @param {Object} portfolio - User's portfolio
     * @returns {Array} Personalized tips
     */
    generatePersonalizedTips(portfolio) {
        const tips = [];

        if (!portfolio || !portfolio.portfolio_holdings || portfolio.portfolio_holdings.length === 0) {
            tips.push('Consider starting with index funds or ETFs for broad market exposure');
            tips.push('Begin with dollar-cost averaging to reduce timing risk');
            return tips;
        }

        const holdings = portfolio.portfolio_holdings;
        const symbolCount = new Set(holdings.map(h => h.stocks.symbol)).size;

        if (symbolCount < 5) {
            tips.push('Consider adding more stocks to improve diversification');
        }

        const sectors = [...new Set(holdings.map(h => h.stocks.sector))];
        if (sectors.length < 3) {
            tips.push('Add stocks from different sectors to reduce sector-specific risk');
        }

        tips.push('Review your portfolio monthly and rebalance if needed');
        tips.push('Keep some cash reserves for opportunities and emergencies');

        return tips;
    }
}

module.exports = new AIGuidanceService();

const { supabase } = require('../config/supabase');

class AnalyticsService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Track user activity metrics
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User activity metrics
     */
    async getUserActivityMetrics(userId) {
        try {
            const cacheKey = `user_activity_${userId}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            // Get user's trading activity
            const { data: transactions } = await supabase
                .from('transactions')
                .select(`
                    *,
                    portfolio_holdings (
                        stocks (
                            symbol,
                            current_price
                        )
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            // Get user's portfolios
            const { data: portfolios } = await supabase
                .from('portfolios')
                .select('*')
                .eq('user_id', userId);

            if (!transactions || !portfolios) {
                return {
                    success: false,
                    error: 'No user data found'
                };
            }

            // Calculate metrics
            const totalTrades = transactions.length;
            const buyTrades = transactions.filter(t => t.transaction_type === 'BUY').length;
            const sellTrades = transactions.filter(t => t.transaction_type === 'SELL').length;
            
            // Calculate win rate (simplified)
            const completedTrades = transactions.filter(t => t.status === 'completed');
            const winningTrades = completedTrades.filter(t => {
                // This is simplified - in reality, would need to track actual P&L
                return Math.random() > 0.5; // Mock winning rate
            });
            const winRate = completedTrades.length > 0 ? 
                (winningTrades.length / completedTrades.length) * 100 : 0;

            // Calculate average holding period
            const averageHoldingPeriod = this.calculateAverageHoldingPeriod(transactions);

            // Get most traded stocks
            const stockCounts = {};
            transactions.forEach(t => {
                const symbol = t.portfolio_holdings?.stocks?.symbol;
                if (symbol) {
                    stockCounts[symbol] = (stockCounts[symbol] || 0) + 1;
                }
            });
            const mostTradedStocks = Object.entries(stockCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([symbol, count]) => ({ symbol, trade_count: count }));

            // Calculate total trading volume
            const totalVolume = transactions.reduce((sum, t) => sum + Math.abs(t.quantity * t.price), 0);

            const metrics = {
                success: true,
                data: {
                    total_trades: totalTrades,
                    buy_trades: buyTrades,
                    sell_trades: sellTrades,
                    win_rate: Math.round(winRate * 100) / 100,
                    average_holding_period_days: Math.round(averageHoldingPeriod),
                    most_traded_stocks: mostTradedStocks,
                    total_trading_volume: Math.round(totalVolume * 100) / 100,
                    number_of_portfolios: portfolios.length,
                    account_age_days: this.calculateAccountAge(portfolios),
                    trading_frequency: this.calculateTradingFrequency(transactions),
                    risk_score: this.calculateUserRiskScore(transactions, portfolios)
                }
            };

            this.setCachedData(cacheKey, metrics);
            return metrics;

        } catch (error) {
            console.error('Error getting user activity metrics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get platform-wide metrics
     * @returns {Promise<Object>} Platform metrics
     */
    async getPlatformMetrics() {
        try {
            const cacheKey = 'platform_metrics';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            // Get total registered users
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // Get active users (last 7 days)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { count: activeUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('last_sign_in_at', sevenDaysAgo);

            // Get all transactions for volume calculation
            const { data: allTransactions } = await supabase
                .from('transactions')
                .select(`
                    *,
                    portfolio_holdings (
                        stocks (
                            symbol
                        )
                    )
                `)
                .eq('status', 'completed');

            // Get all stocks
            const { data: allStocks } = await supabase
                .from('stocks')
                .select('*');

            // Calculate total trading volume
            const totalTradingVolume = allTransactions?.reduce((sum, t) => 
                sum + Math.abs(t.quantity * t.price), 0) || 0;

            // Calculate average portfolio value
            const { data: portfolios } = await supabase
                .from('portfolios')
                .select(`
                    *,
                    portfolio_holdings (
                        quantity,
                        stocks (
                            current_price
                        )
                    )
                `);

            let totalPortfolioValue = 0;
            let portfolioCount = 0;

            if (portfolios) {
                portfolios.forEach(portfolio => {
                    let portfolioValue = 0;
                    portfolio.portfolio_holdings?.forEach(holding => {
                        portfolioValue += holding.quantity * holding.stocks?.current_price || 0;
                    });
                    totalPortfolioValue += portfolioValue;
                    portfolioCount++;
                });
            }

            const averagePortfolioValue = portfolioCount > 0 ? 
                totalPortfolioValue / portfolioCount : 0;

            // Get most traded stocks
            const stockCounts = {};
            allTransactions?.forEach(t => {
                const symbol = t.portfolio_holdings?.stocks?.symbol;
                if (symbol) {
                    stockCounts[symbol] = (stockCounts[symbol] || 0) + 1;
                }
            });
            const mostTradedStocks = Object.entries(stockCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([symbol, count]) => ({ symbol, trade_count: count }));

            // Calculate platform statistics
            const platformStats = {
                total_registered_users: totalUsers || 0,
                active_users_7_days: activeUsers || 0,
                total_trading_volume: Math.round(totalTradingVolume * 100) / 100,
                average_portfolio_value: Math.round(averagePortfolioValue * 100) / 100,
                total_trades: allTransactions?.length || 0,
                most_traded_stocks: mostTradedStocks,
                total_stocks_available: allStocks?.length || 0,
                total_portfolios: portfolios?.length || 0,
                platform_health: this.calculatePlatformHealth(),
                growth_metrics: await this.calculateGrowthMetrics()
            };

            const result = {
                success: true,
                data: platformStats
            };

            this.setCachedData(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Error getting platform metrics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Track guidance effectiveness metrics
     * @param {string} userId - User ID (optional, for user-specific metrics)
     * @returns {Promise<Object>} Guidance effectiveness metrics
     */
    async getGuidanceEffectiveness(userId = null) {
        try {
            const cacheKey = userId ? `guidance_${userId}` : 'guidance_global';
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            let query = supabase
                .from('guidance_feedback')
                .select(`
                    *,
                    users (
                        email
                    )
                `);

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data: feedback } = await query
                .order('created_at', { ascending: false });

            if (!feedback || feedback.length === 0) {
                return {
                    success: true,
                    data: {
                        total_feedback: 0,
                        acceptance_rate: 0,
                        success_rate: 0,
                        average_rating: 0,
                        feedback_breakdown: {},
                        recommendations: ['No feedback data available']
                    }
                };
            }

            // Calculate metrics
            const totalFeedback = feedback.length;
            const helpfulCount = feedback.filter(f => f.helpful === true).length;
            const actedUponCount = feedback.filter(f => f.acted_upon === true).length;
            const successfulCount = feedback.filter(f => f.successful === true).length;

            const acceptanceRate = (helpfulCount / totalFeedback) * 100;
            const actionRate = (actedUponCount / totalFeedback) * 100;
            const successRate = totalFeedback > 0 ? (successfulCount / totalFeedback) * 100 : 0;

            // Calculate average rating
            const ratings = feedback.filter(f => f.rating && f.rating > 0).map(f => f.rating);
            const averageRating = ratings.length > 0 ? 
                ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

            // Feedback breakdown by recommendation type
            const feedbackBreakdown = {};
            feedback.forEach(f => {
                const type = f.recommendation_type || 'unknown';
                if (!feedbackBreakdown[type]) {
                    feedbackBreakdown[type] = { total: 0, helpful: 0, acted: 0, successful: 0 };
                }
                feedbackBreakdown[type].total++;
                if (f.helpful) feedbackBreakdown[type].helpful++;
                if (f.acted_upon) feedbackBreakdown[type].acted++;
                if (f.successful) feedbackBreakdown[type].successful++;
            });

            // Calculate percentages for breakdown
            Object.keys(feedbackBreakdown).forEach(type => {
                const data = feedbackBreakdown[type];
                data.helpful_rate = data.total > 0 ? (data.helpful / data.total) * 100 : 0;
                data.action_rate = data.total > 0 ? (data.acted / data.total) * 100 : 0;
                data.success_rate = data.total > 0 ? (data.successful / data.total) * 100 : 0;
            });

            const metrics = {
                success: true,
                data: {
                    total_feedback: totalFeedback,
                    acceptance_rate: Math.round(acceptanceRate * 100) / 100,
                    action_rate: Math.round(actionRate * 100) / 100,
                    success_rate: Math.round(successRate * 100) / 100,
                    average_rating: Math.round(averageRating * 100) / 100,
                    feedback_breakdown: feedbackBreakdown,
                    recent_trends: this.calculateFeedbackTrends(feedback),
                    improvement_suggestions: this.generateImprovementSuggestions(feedbackBreakdown)
                }
            };

            this.setCachedData(cacheKey, metrics);
            return metrics;

        } catch (error) {
            console.error('Error getting guidance effectiveness:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Record user feedback on guidance
     * @param {string} userId - User ID
     * @param {Object} feedback - Feedback data
     * @returns {Promise<Object>} Recording result
     */
    async recordGuidanceFeedback(userId, feedback) {
        try {
            const { data, error } = await supabase
                .from('guidance_feedback')
                .insert({
                    user_id: userId,
                    recommendation_type: feedback.recommendation_type,
                    helpful: feedback.helpful,
                    acted_upon: feedback.acted_upon,
                    successful: feedback.successful,
                    rating: feedback.rating,
                    comments: feedback.comments,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            // Clear cache to refresh metrics
            this.clearCache(`guidance_${userId}`);
            this.clearCache('guidance_global');

            return {
                success: true,
                data: { id: data[0]?.id },
                message: 'Feedback recorded successfully'
            };

        } catch (error) {
            console.error('Error recording guidance feedback:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate average holding period
     * @param {Array} transactions - User transactions
     * @returns {number} Average holding period in days
     */
    calculateAverageHoldingPeriod(transactions) {
        if (!transactions || transactions.length === 0) return 0;

        // Group transactions by symbol to calculate holding periods
        const holdings = {};
        
        transactions.forEach(t => {
            const symbol = t.portfolio_holdings?.stocks?.symbol;
            if (!symbol) return;

            if (!holdings[symbol]) {
                holdings[symbol] = [];
            }
            holdings[symbol].push({
                type: t.transaction_type,
                date: new Date(t.created_at),
                quantity: t.quantity
            });
        });

        let totalHoldingPeriod = 0;
        let holdingCount = 0;

        Object.values(holdings).forEach(holding => {
            holding.sort((a, b) => a.date - b.date);
            
            let buyDate = null;
            let quantity = 0;

            holding.forEach(transaction => {
                if (transaction.type === 'BUY') {
                    if (quantity === 0) {
                        buyDate = transaction.date;
                    }
                    quantity += transaction.quantity;
                } else if (transaction.type === 'SELL' && buyDate && quantity > 0) {
                    const holdingPeriod = (transaction.date - buyDate) / (1000 * 60 * 60 * 24);
                    totalHoldingPeriod += holdingPeriod;
                    holdingCount++;
                    buyDate = null;
                    quantity = 0;
                }
            });
        });

        return holdingCount > 0 ? totalHoldingPeriod / holdingCount : 0;
    }

    /**
     * Calculate account age in days
     * @param {Array} portfolios - User portfolios
     * @returns {number} Account age in days
     */
    calculateAccountAge(portfolios) {
        if (!portfolios || portfolios.length === 0) return 0;

        const oldestDate = new Date(Math.min(...portfolios.map(p => new Date(p.created_at))));
        const now = new Date();
        return Math.floor((now - oldestDate) / (1000 * 60 * 60 * 24));
    }

    /**
     * Calculate trading frequency
     * @param {Array} transactions - User transactions
     * @returns {number} Trades per month
     */
    calculateTradingFrequency(transactions) {
        if (!transactions || transactions.length === 0) return 0;

        const oldestTransaction = new Date(Math.min(...transactions.map(t => new Date(t.created_at))));
        const now = new Date();
        const monthsActive = (now - oldestTransaction) / (1000 * 60 * 60 * 24 * 30);
        
        return monthsActive > 0 ? Math.round((transactions.length / monthsActive) * 100) / 100 : 0;
    }

    /**
     * Calculate user risk score
     * @param {Array} transactions - User transactions
     * @param {Array} portfolios - User portfolios
     * @returns {number} Risk score (0-100)
     */
    calculateUserRiskScore(transactions, portfolios) {
        let riskScore = 0;

        // Factor 1: Trading frequency
        const frequency = this.calculateTradingFrequency(transactions);
        if (frequency > 20) riskScore += 20;
        else if (frequency > 10) riskScore += 10;
        else if (frequency > 5) riskScore += 5;

        // Factor 2: Portfolio concentration (simplified)
        const totalPortfolios = portfolios?.length || 0;
        if (totalPortfolios === 1) riskScore += 15;
        else if (totalPortfolios < 3) riskScore += 5;

        // Factor 3: Position sizes (simplified - assume average position)
        const avgPositionSize = transactions?.reduce((sum, t) => sum + Math.abs(t.quantity * t.price), 0) / transactions?.length || 0;
        if (avgPositionSize > 10000) riskScore += 15;
        else if (avgPositionSize > 5000) riskScore += 10;
        else if (avgPositionSize > 1000) riskScore += 5;

        return Math.min(riskScore, 100);
    }

    /**
     * Calculate platform health score
     * @returns {Object} Platform health metrics
     */
    calculatePlatformHealth() {
        // This would typically involve monitoring various system metrics
        // For now, return mock health data
        return {
            overall_score: 95,
            uptime_percentage: 99.9,
            average_response_time: 150,
            error_rate: 0.1,
            last_incident: null,
            services_status: {
                database: 'healthy',
                api: 'healthy',
                realtime_updates: 'healthy',
                authentication: 'healthy'
            }
        };
    }

    /**
     * Calculate growth metrics
     * @returns {Promise<Object>} Growth metrics
     */
    async calculateGrowthMetrics() {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Get user growth
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            const { count: newUsersMonth } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', lastMonth.toISOString());

            const { count: newUsersWeek } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', lastWeek.toISOString());

            // Get trading volume growth
            const { data: transactions } = await supabase
                .from('transactions')
                .select('price, quantity, created_at')
                .eq('status', 'completed');

            const currentMonthVolume = transactions?.filter(t => 
                new Date(t.created_at) >= lastMonth
            ).reduce((sum, t) => sum + Math.abs(t.quantity * t.price), 0) || 0;

            return {
                user_growth_monthly: newUsersMonth || 0,
                user_growth_weekly: newUsersWeek || 0,
                total_users: totalUsers || 0,
                current_month_volume: Math.round(currentMonthVolume * 100) / 100,
                growth_trend: 'positive' // Would calculate based on historical data
            };

        } catch (error) {
            console.error('Error calculating growth metrics:', error);
            return {
                user_growth_monthly: 0,
                user_growth_weekly: 0,
                total_users: 0,
                current_month_volume: 0,
                growth_trend: 'unknown'
            };
        }
    }

    /**
     * Calculate feedback trends
     * @param {Array} feedback - Feedback data
     * @returns {Object} Feedback trends
     */
    calculateFeedbackTrends(feedback) {
        const recentFeedback = feedback.slice(0, 20); // Last 20 feedback items
        const olderFeedback = feedback.slice(20, 40); // Previous 20 feedback items

        const recentHelpful = recentFeedback.filter(f => f.helpful).length / recentFeedback.length * 100;
        const olderHelpful = olderFeedback.filter(f => f.helpful).length / olderFeedback.length * 100;

        const trend = recentHelpful > olderHelpful ? 'improving' : 
                     recentHelpful < olderHelpful ? 'declining' : 'stable';

        return {
            helpful_rate_recent: Math.round(recentHelpful * 100) / 100,
            helpful_rate_previous: Math.round(olderHelpful * 100) / 100,
            trend,
            sample_size: recentFeedback.length
        };
    }

    /**
     * Generate improvement suggestions
     * @param {Object} feedbackBreakdown - Feedback breakdown data
     * @returns {Array} Improvement suggestions
     */
    generateImprovementSuggestions(feedbackBreakdown) {
        const suggestions = [];

        Object.entries(feedbackBreakdown).forEach(([type, data]) => {
            if (data.helpful_rate < 60) {
                suggestions.push(`Improve ${type} recommendations - currently ${data.helpful_rate.toFixed(1)}% helpful`);
            }
            if (data.success_rate < 40) {
                suggestions.push(`Focus on ${type} accuracy - only ${data.success_rate.toFixed(1)}% successful`);
            }
        });

        if (suggestions.length === 0) {
            suggestions.push('Guidance quality is generally good - continue monitoring');
        }

        return suggestions;
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    /**
     * Set cached data
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear specific cache entry
     * @param {string} key - Cache key to clear
     */
    clearCache(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clearAllCache() {
        this.cache.clear();
    }
}

module.exports = new AnalyticsService();
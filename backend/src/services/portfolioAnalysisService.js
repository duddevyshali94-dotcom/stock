const { supabase } = require('../config/supabase');
const { calculateMovingAverage, calculateRSI, calculateVolatility } = require('./priceAnalysisService');

class PortfolioAnalysisService {
    /**
     * Analyze user's portfolio comprehensively
     * @param {string} userId - User ID
     * @param {Object} currentPrices - Current market prices
     * @returns {Promise<Object>} Comprehensive portfolio analysis
     */
    async analyzePortfolio(userId, currentPrices = null) {
        try {
            // Get user's portfolios
            const { data: portfolios } = await supabase
                .from('portfolios')
                .select(`
                    *,
                    portfolio_holdings (
                        *,
                        stocks (
                            symbol,
                            name,
                            current_price,
                            sector,
                            market_cap
                        )
                    )
                `)
                .eq('user_id', userId);

            if (!portfolios || portfolios.length === 0) {
                return {
                    success: false,
                    error: 'No portfolios found'
                };
            }

            const analysis = {
                portfolios: [],
                total_value: 0,
                total_cost: 0,
                total_gain_loss: 0,
                total_gain_loss_percent: 0,
                sector_allocation: {},
                risk_metrics: {},
                diversification_score: 0,
                top_holdings: [],
                performance_summary: {}
            };

            // Analyze each portfolio
            for (const portfolio of portfolios) {
                const portfolioAnalysis = await this.analyzeIndividualPortfolio(portfolio, currentPrices);
                analysis.portfolios.push(portfolioAnalysis);
                
                // Aggregate totals
                analysis.total_value += portfolioAnalysis.current_value;
                analysis.total_cost += portfolioAnalysis.total_cost;
            }

            // Calculate overall metrics
            analysis.total_gain_loss = analysis.total_value - analysis.total_cost;
            analysis.total_gain_loss_percent = analysis.total_cost > 0 ? 
                (analysis.total_gain_loss / analysis.total_cost) * 100 : 0;

            // Calculate sector allocation across all portfolios
            analysis.sector_allocation = this.calculateOverallSectorAllocation(analysis.portfolios);
            
            // Calculate overall diversification score
            analysis.diversification_score = this.calculateOverallDiversificationScore(analysis.portfolios);
            
            // Get top holdings across all portfolios
            analysis.top_holdings = this.getTopHoldings(analysis.portfolios);
            
            // Generate performance summary
            analysis.performance_summary = this.generatePerformanceSummary(analysis);

            return {
                success: true,
                data: analysis
            };

        } catch (error) {
            console.error('Error analyzing portfolio:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analyze individual portfolio
     * @param {Object} portfolio - Portfolio object
     * @param {Object} currentPrices - Current market prices
     * @returns {Promise<Object>} Individual portfolio analysis
     */
    async analyzeIndividualPortfolio(portfolio, currentPrices) {
        try {
            const holdings = portfolio.portfolio_holdings || [];
            
            if (holdings.length === 0) {
                return {
                    portfolio_id: portfolio.id,
                    name: portfolio.name,
                    holdings: [],
                    current_value: 0,
                    total_cost: 0,
                    gain_loss: 0,
                    gain_loss_percent: 0,
                    sector_allocation: {},
                    risk_score: 0,
                    diversification_score: 0
                };
            }

            let currentValue = 0;
            let totalCost = 0;
            const sectorAllocation = {};
            const holdingDetails = [];

            // Analyze each holding
            for (const holding of holdings) {
                const stock = holding.stocks;
                const currentPrice = currentPrices && currentPrices[stock.symbol] ? 
                    currentPrices[stock.symbol] : stock.current_price;
                
                const holdingValue = holding.quantity * currentPrice;
                const costBasis = holding.quantity * holding.average_cost;
                
                currentValue += holdingValue;
                totalCost += costBasis;
                
                // Calculate sector allocation
                const sector = stock.sector || 'Unknown';
                sectorAllocation[sector] = (sectorAllocation[sector] || 0) + holdingValue;

                // Calculate individual holding metrics
                const gainLoss = holdingValue - costBasis;
                const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
                
                // Calculate weight in portfolio
                const weight = currentValue > 0 ? (holdingValue / currentValue) * 100 : 0;

                holdingDetails.push({
                    symbol: stock.symbol,
                    name: stock.name,
                    quantity: holding.quantity,
                    current_price: currentPrice,
                    average_cost: holding.average_cost,
                    current_value: holdingValue,
                    cost_basis: costBasis,
                    gain_loss: gainLoss,
                    gain_loss_percent: gainLossPercent,
                    weight_in_portfolio: weight,
                    sector: sector
                });
            }

            // Calculate gain/loss
            const gainLoss = currentValue - totalCost;
            const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

            // Calculate portfolio metrics
            const diversificationScore = this.calculateDiversificationScore(sectorAllocation, currentValue);
            const riskScore = this.calculatePortfolioRiskScore(holdingDetails);

            // Convert sector allocation to percentages
            const sectorAllocationPercent = {};
            Object.keys(sectorAllocation).forEach(sector => {
                sectorAllocationPercent[sector] = (sectorAllocation[sector] / currentValue) * 100;
            });

            return {
                portfolio_id: portfolio.id,
                name: portfolio.name,
                holdings: holdingDetails,
                current_value: Math.round(currentValue * 100) / 100,
                total_cost: Math.round(totalCost * 100) / 100,
                gain_loss: Math.round(gainLoss * 100) / 100,
                gain_loss_percent: Math.round(gainLossPercent * 100) / 100,
                sector_allocation: sectorAllocationPercent,
                diversification_score: diversificationScore,
                risk_score: riskScore,
                number_of_holdings: holdings.length,
                most_weighted_sector: this.getMostWeightedSector(sectorAllocationPercent),
                top_holdings: holdingDetails
                    .sort((a, b) => b.weight_in_portfolio - a.weight_in_portfolio)
                    .slice(0, 5)
            };

        } catch (error) {
            console.error('Error analyzing individual portfolio:', error);
            throw error;
        }
    }

    /**
     * Calculate portfolio risk metrics
     * @param {Object} portfolio - Portfolio object
     * @returns {Promise<Object>} Risk assessment
     */
    async calculateRiskMetrics(portfolio) {
        try {
            const holdings = portfolio.portfolio_holdings || [];
            
            if (holdings.length === 0) {
                return {
                    riskLevel: 'low',
                    metrics: {
                        value_at_risk: 0,
                        sharpe_ratio: 0,
                        max_drawdown: 0,
                        beta: 0,
                        volatility: 0
                    },
                    recommendations: ['No positions to analyze']
                };
            }

            // Calculate portfolio volatility (simplified)
            const portfolioVolatility = await this.calculatePortfolioVolatility(holdings);
            
            // Calculate Value at Risk (simplified)
            const valueAtRisk = this.calculateValueAtRisk(holdings);
            
            // Estimate Sharpe Ratio (using simplified market return)
            const marketReturn = 0.08; // 8% assumed market return
            const riskFreeRate = 0.02; // 2% risk-free rate
            const sharpeRatio = portfolioVolatility > 0 ? 
                (marketReturn - riskFreeRate) / portfolioVolatility : 0;

            // Determine risk level
            let riskLevel = 'low';
            if (portfolioVolatility > 0.3) riskLevel = 'high';
            else if (portfolioVolatility > 0.15) riskLevel = 'medium';

            // Generate recommendations
            const recommendations = this.generateRiskRecommendations(riskLevel, portfolioVolatility, holdings);

            return {
                riskLevel,
                metrics: {
                    value_at_risk: Math.round(valueAtRisk * 100) / 100,
                    sharpe_ratio: Math.round(sharpeRatio * 100) / 100,
                    max_drawdown: Math.round((this.estimateMaxDrawdown(holdings)) * 100) / 100,
                    beta: Math.round(this.estimatePortfolioBeta(holdings) * 100) / 100,
                    volatility: Math.round(portfolioVolatility * 10000) / 100 // As percentage
                },
                recommendations
            };

        } catch (error) {
            console.error('Error calculating risk metrics:', error);
            return {
                riskLevel: 'unknown',
                metrics: {},
                recommendations: ['Error calculating risk metrics']
            };
        }
    }

    /**
     * Suggest portfolio rebalancing
     * @param {Object} portfolio - Portfolio object
     * @param {Object} targetAllocation - Target asset allocation
     * @returns {Promise<Object>} Rebalancing suggestions
     */
    async suggestRebalancing(portfolio, targetAllocation) {
        try {
            const currentAnalysis = await this.analyzeIndividualPortfolio(portfolio, null);
            const suggestions = [];

            // Compare current vs target allocation
            const currentAllocation = currentAnalysis.sector_allocation;
            
            for (const [sector, targetPercent] of Object.entries(targetAllocation)) {
                const currentPercent = currentAllocation[sector] || 0;
                const difference = targetPercent - currentPercent;

                // Only suggest rebalancing if difference is significant (>5%)
                if (Math.abs(difference) > 5) {
                    const action = difference > 0 ? 'BUY' : 'SELL';
                    const amount = Math.abs(difference) / 100 * currentAnalysis.current_value;
                    
                    suggestions.push({
                        sector,
                        action,
                        current_percent: Math.round(currentPercent * 100) / 100,
                        target_percent: targetPercent,
                        difference: Math.round(difference * 100) / 100,
                        suggested_amount: Math.round(amount * 100) / 100,
                        reasoning: `Portfolio is ${Math.abs(difference).toFixed(1)}% away from target allocation in ${sector}`
                    });
                }
            }

            // Sort by magnitude of difference
            suggestions.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

            return {
                success: true,
                data: {
                    current_allocation: currentAllocation,
                    target_allocation: targetAllocation,
                    rebalancing_suggestions: suggestions,
                    total_rebalancing_needed: suggestions.length,
                    estimated_costs: this.estimateRebalancingCosts(suggestions)
                }
            };

        } catch (error) {
            console.error('Error suggesting rebalancing:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Find diversification opportunities
     * @param {Object} portfolio - Portfolio object
     * @param {Array} availableStocks - Available stocks to invest in
     * @returns {Promise<Object>} Diversification suggestions
     */
    async findDiversificationOpportunities(portfolio, availableStocks) {
        try {
            const analysis = await this.analyzeIndividualPortfolio(portfolio, null);
            const currentSectors = Object.keys(analysis.sector_allocation);
            const opportunities = [];

            // Group available stocks by sector
            const stocksBySector = {};
            availableStocks.forEach(stock => {
                const sector = stock.sector || 'Unknown';
                if (!stocksBySector[sector]) {
                    stocksBySector[sector] = [];
                }
                stocksBySector[sector].push(stock);
            });

            // Find underrepresented sectors
            for (const [sector, stocks] of Object.entries(stocksBySector)) {
                if (!currentSectors.includes(sector) || 
                    (analysis.sector_allocation[sector] || 0) < 10) {
                    
                    // Select top 3 stocks from this sector
                    const topStocks = stocks
                        .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
                        .slice(0, 3);

                    opportunities.push({
                        sector,
                        current_allocation: analysis.sector_allocation[sector] || 0,
                        suggested_allocation: Math.min(15, 100 / (currentSectors.length + 1)),
                        top_stocks: topStocks.map(stock => ({
                            symbol: stock.symbol,
                            name: stock.name,
                            market_cap: stock.market_cap,
                            sector: stock.sector
                        })),
                        reasoning: `Adding exposure to ${sector} sector can improve diversification`
                    });
                }
            }

            return {
                success: true,
                data: {
                    current_diversification_score: analysis.diversification_score,
                    opportunities: opportunities.slice(0, 5), // Top 5 opportunities
                    estimated_improvement: this.estimateDiversificationImprovement(analysis, opportunities)
                }
            };

        } catch (error) {
            console.error('Error finding diversification opportunities:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate overall sector allocation across all portfolios
     * @param {Array} portfolios - Array of portfolio analyses
     * @returns {Object} Sector allocation percentages
     */
    calculateOverallSectorAllocation(portfolios) {
        const sectorTotals = {};
        let totalValue = 0;

        // Sum up sector values across all portfolios
        for (const portfolio of portfolios) {
            totalValue += portfolio.current_value;
            for (const [sector, percentage] of Object.entries(portfolio.sector_allocation)) {
                const sectorValue = (percentage / 100) * portfolio.current_value;
                sectorTotals[sector] = (sectorTotals[sector] || 0) + sectorValue;
            }
        }

        // Convert to percentages
        const allocation = {};
        for (const [sector, value] of Object.entries(sectorTotals)) {
            allocation[sector] = totalValue > 0 ? (value / totalValue) * 100 : 0;
        }

        return allocation;
    }

    /**
     * Calculate overall diversification score
     * @param {Array} portfolios - Array of portfolio analyses
     * @returns {number} Diversification score (0-100)
     */
    calculateOverallDiversificationScore(portfolios) {
        if (portfolios.length === 0) return 0;

        const totalScore = portfolios.reduce((sum, p) => sum + p.diversification_score, 0);
        return Math.round(totalScore / portfolios.length);
    }

    /**
     * Get top holdings across all portfolios
     * @param {Array} portfolios - Array of portfolio analyses
     * @returns {Array} Top holdings
     */
    getTopHoldings(portfolios) {
        const allHoldings = [];
        
        portfolios.forEach(portfolio => {
            portfolio.holdings.forEach(holding => {
                allHoldings.push({
                    ...holding,
                    portfolio_name: portfolio.name
                });
            });
        });

        return allHoldings
            .sort((a, b) => b.current_value - a.current_value)
            .slice(0, 10);
    }

    /**
     * Generate performance summary
     * @param {Object} analysis - Portfolio analysis
     * @returns {Object} Performance summary
     */
    generatePerformanceSummary(analysis) {
        const portfolioCount = analysis.portfolios.length;
        const profitablePortfolios = analysis.portfolios.filter(p => p.gain_loss_percent > 0).length;
        const avgReturn = analysis.portfolios.reduce((sum, p) => sum + p.gain_loss_percent, 0) / portfolioCount;
        
        let performance = 'neutral';
        if (avgReturn > 10) performance = 'excellent';
        else if (avgReturn > 5) performance = 'good';
        else if (avgReturn < -10) performance = 'poor';
        else if (avgReturn < -5) performance = 'below_average';

        return {
            total_portfolios: portfolioCount,
            profitable_portfolios: profitablePortfolios,
            profit_rate: Math.round((profitablePortfolios / portfolioCount) * 100),
            average_return: Math.round(avgReturn * 100) / 100,
            performance_rating: performance,
            best_performing_portfolio: this.getBestPerformingPortfolio(analysis.portfolios),
            worst_performing_portfolio: this.getWorstPerformingPortfolio(analysis.portfolios)
        };
    }

    /**
     * Calculate diversification score for a portfolio
     * @param {Object} sectorAllocation - Sector allocation
     * @param {number} totalValue - Total portfolio value
     * @returns {number} Diversification score (0-100)
     */
    calculateDiversificationScore(sectorAllocation, totalValue) {
        if (totalValue === 0) return 0;

        const sectors = Object.keys(sectorAllocation);
        const sectorCount = sectors.length;
        const sectorValues = Object.values(sectorAllocation);

        // Score based on number of sectors (max 40 points)
        let score = Math.min(sectorCount * 8, 40);

        // Score based on sector balance (max 40 points)
        const maxSectorWeight = Math.max(...sectorValues);
        if (maxSectorWeight < 30) score += 40;
        else if (maxSectorWeight < 50) score += 20;
        else if (maxSectorWeight < 70) score += 10;

        // Score based on sector diversity (max 20 points)
        if (sectorCount >= 5) score += 20;
        else if (sectorCount >= 3) score += 10;

        return Math.round(score);
    }

    /**
     * Calculate portfolio risk score
     * @param {Array} holdings - Portfolio holdings
     * @returns {number} Risk score (0-100)
     */
    calculatePortfolioRiskScore(holdings) {
        if (holdings.length === 0) return 0;

        // Calculate concentration risk
        const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
        const weights = holdings.map(h => (h.current_value / totalValue) * 100);
        const maxWeight = Math.max(...weights);
        const herfindahlIndex = weights.reduce((sum, w) => sum + Math.pow(w / 100, 2), 0);

        // Risk score based on concentration
        let riskScore = 0;
        if (maxWeight > 40) riskScore += 40;
        else if (maxWeight > 25) riskScore += 20;
        else if (maxWeight > 15) riskScore += 10;

        // Add risk for volatility (simplified)
        riskScore += Math.min(holdings.filter(h => 
            ['TSLA', 'GME', 'AMC'].includes(h.symbol)).length * 10, 30);

        // Add risk for portfolio size
        if (holdings.length < 3) riskScore += 20;
        else if (holdings.length < 5) riskScore += 10;

        return Math.min(riskScore, 100);
    }

    /**
     * Get most weighted sector
     * @param {Object} sectorAllocation - Sector allocation
     * @returns {string} Most weighted sector
     */
    getMostWeightedSector(sectorAllocation) {
        const sectors = Object.entries(sectorAllocation);
        if (sectors.length === 0) return 'None';

        const maxSector = sectors.reduce((max, current) => 
            current[1] > max[1] ? current : max
        );

        return maxSector[0];
    }

    /**
     * Calculate portfolio volatility (simplified)
     * @param {Array} holdings - Portfolio holdings
     * @returns {number} Portfolio volatility
     */
    async calculatePortfolioVolatility(holdings) {
        // Simplified calculation - in reality, would need correlation data
        const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
        let weightedVolatility = 0;

        holdings.forEach(holding => {
            const weight = holding.current_value / totalValue;
            const sectorVolatility = this.getSectorVolatility(holding.sector);
            weightedVolatility += weight * sectorVolatility;
        });

        return weightedVolatility;
    }

    /**
     * Get estimated sector volatility
     * @param {string} sector - Sector name
     * @returns {number} Estimated volatility
     */
    getSectorVolatility(sector) {
        const sectorVolatilities = {
            'Technology': 0.25,
            'Healthcare': 0.20,
            'Financial': 0.18,
            'Consumer': 0.22,
            'Energy': 0.35,
            'Industrial': 0.20,
            'Utilities': 0.15,
            'Real Estate': 0.18,
            'Materials': 0.25,
            'Unknown': 0.22
        };

        return sectorVolatilities[sector] || 0.22;
    }

    /**
     * Calculate Value at Risk
     * @param {Array} holdings - Portfolio holdings
     * @returns {number} Value at Risk (5% confidence level)
     */
    calculateValueAtRisk(holdings) {
        const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
        // Simplified VaR calculation - 5% of portfolio value
        return totalValue * 0.05;
    }

    /**
     * Estimate maximum drawdown
     * @param {Array} holdings - Portfolio holdings
     * @returns {number} Maximum drawdown percentage
     */
    estimateMaxDrawdown(holdings) {
        // Simplified calculation - assume 20% max drawdown for diversified portfolio
        return 0.20;
    }

    /**
     * Estimate portfolio beta
     * @param {Array} holdings - Portfolio holdings
     * @returns {number} Portfolio beta
     */
    estimatePortfolioBeta(holdings) {
        // Simplified calculation - assume portfolio beta around 1.0
        return 1.0;
    }

    /**
     * Generate risk recommendations
     * @param {string} riskLevel - Risk level
     * @param {number} volatility - Portfolio volatility
     * @param {Array} holdings - Portfolio holdings
     * @returns {Array} Recommendations
     */
    generateRiskRecommendations(riskLevel, volatility, holdings) {
        const recommendations = [];

        if (riskLevel === 'high') {
            recommendations.push('Consider reducing position sizes in volatile stocks');
            recommendations.push('Diversify across more sectors to reduce concentration risk');
            recommendations.push('Consider adding some defensive stocks or bonds');
        } else if (riskLevel === 'medium') {
            recommendations.push('Monitor your portfolio regularly for rebalancing opportunities');
            recommendations.push('Consider your investment timeline when making changes');
        } else {
            recommendations.push('Your portfolio shows good risk management');
            recommendations.push('Continue monitoring and periodic rebalancing');
        }

        if (volatility > 0.25) {
            recommendations.push('High volatility detected - consider position sizing carefully');
        }

        return recommendations;
    }

    /**
     * Estimate rebalancing costs
     * @param {Array} suggestions - Rebalancing suggestions
     * @returns {Object} Estimated costs
     */
    estimateRebalancingCosts(suggestions) {
        const tradingCosts = suggestions.length * 10; // Assume $10 per trade
        const taxImplications = 'Tax implications depend on holding period and gains';
        
        return {
            estimated_trading_costs: tradingCosts,
            tax_considerations: taxImplications,
            total_estimated_cost: tradingCosts + 0 // Add tax estimates if applicable
        };
    }

    /**
     * Estimate diversification improvement
     * @param {Object} analysis - Current analysis
     * @param {Array} opportunities - Diversification opportunities
     * @returns {Object} Improvement estimate
     */
    estimateDiversificationImprovement(analysis, opportunities) {
        const currentScore = analysis.diversification_score;
        const potentialImprovement = Math.min(30, opportunities.length * 5);
        
        return {
            current_score: currentScore,
            potential_new_score: Math.min(100, currentScore + potentialImprovement),
            improvement_amount: potentialImprovement
        };
    }

    /**
     * Get best performing portfolio
     * @param {Array} portfolios - Portfolio analyses
     * @returns {Object} Best performing portfolio
     */
    getBestPerformingPortfolio(portfolios) {
        if (portfolios.length === 0) return null;
        
        return portfolios.reduce((best, current) => 
            current.gain_loss_percent > best.gain_loss_percent ? current : best
        );
    }

    /**
     * Get worst performing portfolio
     * @param {Array} portfolios - Portfolio analyses
     * @returns {Object} Worst performing portfolio
     */
    getWorstPerformingPortfolio(portfolios) {
        if (portfolios.length === 0) return null;
        
        return portfolios.reduce((worst, current) => 
            current.gain_loss_percent < worst.gain_loss_percent ? current : worst
        );
    }
}

module.exports = new PortfolioAnalysisService();
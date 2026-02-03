/**
 * Guidance Page JavaScript
 * Handles all functionality for the AI guidance page
 */

class GuidancePage {
    constructor() {
        this.isLoading = false;
        this.guidanceData = null;
        this.selectedRating = 0;
        
        this.init();
    }

    /**
     * Initialize the guidance page
     */
    async init() {
        this.showLoading(true);
        
        try {
            await this.checkAuthentication();
            this.bindEvents();
            await this.loadGuidanceData();
        } catch (error) {
            console.error('Error initializing guidance page:', error);
            this.showError('Failed to initialize page');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Check if user is authenticated
     */
    async checkAuthentication() {
        const token = this.getAuthToken();
        if (!token) {
            window.location.href = '/index.html';
            return;
        }

        // Verify token with server
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            window.location.href = '/index.html';
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation events
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Refresh events
        document.getElementById('refresh-portfolio').addEventListener('click', () => {
            this.refreshPortfolioData();
        });

        document.getElementById('retry-btn').addEventListener('click', () => {
            this.loadGuidanceData();
        });

        // Filter events
        document.getElementById('recommendation-filter').addEventListener('change', (e) => {
            this.filterRecommendations(e.target.value);
        });

        // Stock analysis events
        document.getElementById('analyze-stock-btn').addEventListener('click', () => {
            this.analyzeSelectedStock();
        });

        document.getElementById('stock-search').addEventListener('input', (e) => {
            this.filterStockSelector(e.target.value);
        });

        // Tab events
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Feedback events
        this.bindFeedbackEvents();

        // Modal events
        this.bindModalEvents();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'r') {
                    e.preventDefault();
                    this.refreshPortfolioData();
                }
            }
        });
    }

    /**
     * Bind feedback events
     */
    bindFeedbackEvents() {
        const stars = document.querySelectorAll('#guidance-rating .star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                this.selectedRating = parseInt(star.dataset.value);
                this.updateStarRating();
            });
        });

        document.getElementById('submit-feedback-btn').addEventListener('click', () => {
            this.submitFeedback();
        });
    }

    /**
     * Bind modal events
     */
    bindModalEvents() {
        const modal = document.getElementById('stock-analysis-modal');
        const closeBtn = modal.querySelector('.modal-close');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Load guidance data from API
     */
    async loadGuidanceData() {
        this.isLoading = true;
        
        try {
            const response = await fetch('/api/guidance/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.guidanceData = data.data;
                this.renderGuidanceData(data.data);
                this.hideError();
            } else {
                throw new Error(data.error || 'Failed to load guidance data');
            }

        } catch (error) {
            console.error('Error loading guidance data:', error);
            this.showError(error.message || 'Failed to load guidance data');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render all guidance data
     * @param {Object} data - Guidance data
     */
    renderGuidanceData(data) {
        try {
            this.renderPortfolioOverview(data.portfolio_guidance);
            this.renderRiskAssessment(data.portfolio_guidance);
            this.renderRecommendations(data.portfolio_guidance);
            this.renderDiversificationAnalysis(data.portfolio_guidance);
            this.renderStockAnalysis(data.portfolio_guidance);
            this.renderEducationalContent(data.beginner_guidance);
            this.renderMarketInsights(data.beginner_guidance);
            this.renderUserAnalytics(data.user_analytics);
            this.populateStockSelector(data.portfolio_guidance);

            // Show content
            document.getElementById('guidance-content').style.display = 'block';

        } catch (error) {
            console.error('Error rendering guidance data:', error);
            this.showError('Error displaying guidance data');
        }
    }

    /**
     * Render portfolio overview
     * @param {Object} portfolioData - Portfolio data
     */
    renderPortfolioOverview(portfolioData) {
        if (!portfolioData) return;

        const { portfolio_summary, risk_assessment, diversification_analysis } = portfolioData;

        // Update portfolio value and gains/losses
        if (portfolio_summary) {
            document.getElementById('portfolio-total-value').textContent = 
                this.formatCurrency(portfolio_summary.total_value);
            
            const gainLoss = portfolio_summary.total_gain_loss;
            const gainLossPercent = portfolio_summary.total_gain_loss_percent;
            
            document.getElementById('portfolio-gain-loss').textContent = 
                `${gainLoss >= 0 ? '+' : ''}${this.formatCurrency(Math.abs(gainLoss))}`;
            
            document.getElementById('portfolio-gain-loss-percent').textContent = 
                `${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%`;
            
            // Update colors
            const gainLossElement = document.getElementById('portfolio-gain-loss');
            const gainLossPercentElement = document.getElementById('portfolio-gain-loss-percent');
            
            [gainLossElement, gainLossPercentElement].forEach(el => {
                el.className = `card-change ${gainLoss >= 0 ? 'positive' : 'negative'}`;
            });
        }

        // Update health score
        if (risk_assessment) {
            const healthScore = this.calculateHealthScore(risk_assessment);
            document.getElementById('health-score').textContent = healthScore;
            document.getElementById('health-rating').textContent = this.getHealthRating(healthScore);
        }

        // Update diversification score
        if (diversification_analysis) {
            const divScore = diversification_analysis.diversificationScore || 0;
            document.getElementById('diversification-score').textContent = divScore;
            document.getElementById('diversification-rating').textContent = this.getDiversificationRating(divScore);
        }
    }

    /**
     * Render risk assessment
     * @param {Object} portfolioData - Portfolio data
     */
    renderRiskAssessment(portfolioData) {
        if (!portfolioData?.risk_assessment) return;

        const { risk_assessment } = portfolioData;
        
        // Update risk meter
        const riskLevel = risk_assessment.riskLevel;
        const needle = document.getElementById('risk-needle');
        
        let needlePosition = '50%'; // Medium
        if (riskLevel === 'low') needlePosition = '20%';
        else if (riskLevel === 'high') needlePosition = '80%';
        
        needle.style.left = needlePosition;

        // Update risk details
        const riskDetails = document.getElementById('risk-details');
        riskDetails.innerHTML = `
            <div class="risk-item">
                <span class="risk-label">Risk Level:</span>
                <span class="risk-value ${riskLevel}">${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}</span>
            </div>
            <div class="risk-item">
                <span class="risk-label">Volatility:</span>
                <span class="risk-value">${(risk_assessment.metrics?.volatility || 0).toFixed(2)}%</span>
            </div>
            <div class="risk-recommendations">
                <h5>Risk Management Tips:</h5>
                <ul>
                    ${risk_assessment.recommendations?.map(rec => `<li>${rec}</li>`).join('') || '<li>No specific recommendations</li>'}
                </ul>
            </div>
        `;
    }

    /**
     * Render AI recommendations
     * @param {Object} portfolioData - Portfolio data
     */
    renderRecommendations(portfolioData) {
        if (!portfolioData?.recommendations) return;

        const recommendationsGrid = document.getElementById('recommendations-grid');
        recommendationsGrid.innerHTML = portfolioData.recommendations.map(rec => `
            <div class="recommendation-card" data-action="${rec.recommendation.toLowerCase()}">
                <div class="recommendation-header">
                    <div class="stock-info">
                        <h4>${rec.stock.symbol}</h4>
                        <span class="stock-name">${rec.stock.name || rec.stock.symbol}</span>
                    </div>
                    <div class="recommendation-badge ${rec.recommendation.toLowerCase()}">
                        ${rec.recommendation}
                    </div>
                </div>

                <div class="recommendation-body">
                    <div class="confidence-score">
                        <span class="confidence-label">Confidence:</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${(rec.confidence * 100)}%"></div>
                        </div>
                        <span class="confidence-value">${(rec.confidence * 100).toFixed(0)}%</span>
                    </div>

                    <div class="reasoning">
                        <h5>AI Reasoning:</h5>
                        <p>${rec.reasoning}</p>
                    </div>

                    <div class="target-price">
                        <span class="target-label">Target Price:</span>
                        <span class="target-value">${this.formatCurrency(rec.target_price)}</span>
                    </div>

                    <div class="position-info">
                        <span class="position-label">Current Position:</span>
                        <span class="position-value">${rec.current_position} shares (${this.formatCurrency(rec.current_value)})</span>
                    </div>
                </div>

                <div class="recommendation-actions">
                    <button class="btn btn-primary act-on-recommendation" data-symbol="${rec.stock.symbol}" data-action="${rec.recommendation}">
                        Act on this
                    </button>
                    <button class="btn btn-secondary analyze-stock-btn" data-symbol="${rec.stock.symbol}">
                        Detailed Analysis
                    </button>
                </div>
            </div>
        `).join('');

        // Bind recommendation action buttons
        document.querySelectorAll('.act-on-recommendation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.actOnRecommendation(e.target.dataset.symbol, e.target.dataset.action);
            });
        });

        document.querySelectorAll('.analyze-stock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.analyzeStock(e.target.dataset.symbol);
            });
        });
    }

    /**
     * Render diversification analysis
     * @param {Object} portfolioData - Portfolio data
     */
    renderDiversificationAnalysis(portfolioData) {
        if (!portfolioData?.diversification_analysis) return;

        const { diversification_analysis } = portfolioData;

        // Update diversification score
        document.getElementById('div-score-value').textContent = 
            diversification_analysis.diversificationScore || 0;

        // Render sector allocation
        const sectorAllocation = document.getElementById('sector-allocation');
        if (diversification_analysis.sectorAllocation) {
            sectorAllocation.innerHTML = Object.entries(diversification_analysis.sectorAllocation)
                .map(([sector, percentage]) => `
                    <div class="sector-item">
                        <span class="sector-name">${sector}</span>
                        <div class="sector-bar">
                            <div class="sector-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="sector-percentage">${percentage.toFixed(1)}%</span>
                    </div>
                `).join('');
        }

        // Render diversification suggestions
        const suggestions = document.getElementById('diversification-suggestions');
        if (diversification_analysis.recommendations?.length > 0) {
            suggestions.innerHTML = `
                <h4>Improvement Suggestions</h4>
                <ul class="suggestions-list">
                    ${diversification_analysis.recommendations.map(rec => `
                        <li class="suggestion-item">
                            <i class="icon-lightbulb"></i>
                            ${rec}
                        </li>
                    `).join('')}
                </ul>
            `;
        }
    }

    /**
     * Render stock analysis section
     * @param {Object} portfolioData - Portfolio data
     */
    renderStockAnalysis(portfolioData) {
        // This will be handled by populateStockSelector and analyzeSelectedStock methods
    }

    /**
     * Render educational content
     * @param {Object} beginnerData - Beginner guidance data
     */
    renderEducationalContent(beginnerData) {
        if (!beginnerData) return;

        const { tips, educationalContent } = beginnerData;

        // Render tips
        if (tips?.length > 0) {
            const tipsGrid = document.getElementById('tips-grid');
            tipsGrid.innerHTML = tips.map(tip => `
                <div class="tip-card">
                    <div class="tip-header">
                        <h4>${tip.title}</h4>
                        <span class="tip-level ${tip.level}">${tip.level}</span>
                    </div>
                    <div class="tip-content">
                        <p>${tip.description}</p>
                    </div>
                </div>
            `).join('');
        }

        // Render investment principles
        if (educationalContent?.investmentPrinciples?.length > 0) {
            const principlesList = document.getElementById('principles-list');
            principlesList.innerHTML = educationalContent.investmentPrinciples.map(principle => `
                <div class="principle-item">
                    <i class="icon-check-circle"></i>
                    <span>${principle}</span>
                </div>
            `).join('');
        }

        // Render market data guide
        if (educationalContent?.readingMarketData?.length > 0) {
            const marketDataGuide = document.getElementById('market-data-guide');
            marketDataGuide.innerHTML = educationalContent.readingMarketData.map(item => `
                <div class="market-data-item">
                    <h5>${item.split(':')[0]}:</h5>
                    <p>${item.split(':')[1]}</p>
                </div>
            `).join('');
        }
    }

    /**
     * Render market insights
     * @param {Object} beginnerData - Beginner guidance data
     */
    renderMarketInsights(beginnerData) {
        if (!beginnerData?.marketInsights) return;

        const { marketInsights } = beginnerData;

        // Update market sentiment
        document.getElementById('market-sentiment').textContent = marketInsights.marketSentiment;

        // Update top sectors
        document.getElementById('top-sectors').textContent = 
            marketInsights.topSectors?.slice(0, 3).join(', ') || 'N/A';

        // Update volatile stocks
        document.getElementById('volatile-stocks').textContent = 
            marketInsights.mostVolatile?.slice(0, 3).join(', ') || 'N/A';

        // Update trending up
        document.getElementById('trending-up').textContent = 
            marketInsights.trendingUp?.slice(0, 3).join(', ') || 'N/A';
    }

    /**
     * Render user analytics
     * @param {Object} userData - User analytics data
     */
    renderUserAnalytics(userData) {
        if (!userData) return;

        // Update analytics values
        document.getElementById('total-trades').textContent = userData.total_trades || 0;
        document.getElementById('win-rate').textContent = 
            userData.win_rate ? `${userData.win_rate.toFixed(1)}%` : 'N/A';
        document.getElementById('avg-holding').textContent = 
            userData.average_holding_period_days ? `${userData.average_holding_period_days} days` : 'N/A';
        document.getElementById('user-risk-score').textContent = userData.risk_score || 'N/A';
    }

    /**
     * Populate stock selector dropdown
     * @param {Object} portfolioData - Portfolio data
     */
    populateStockSelector(portfolioData) {
        if (!portfolioData?.recommendations) return;

        const stockSelect = document.getElementById('stock-select');
        stockSelect.innerHTML = '<option value="">Choose a stock...</option>';

        portfolioData.recommendations.forEach(rec => {
            const option = document.createElement('option');
            option.value = rec.stock.symbol;
            option.textContent = `${rec.stock.symbol} - ${rec.stock.name || rec.stock.symbol}`;
            stockSelect.appendChild(option);
        });
    }

    /**
     * Filter recommendations by action
     * @param {string} filter - Filter value
     */
    filterRecommendations(filter) {
        const recommendations = document.querySelectorAll('.recommendation-card');
        
        recommendations.forEach(card => {
            const action = card.dataset.action;
            const shouldShow = filter === 'all' || action === filter;
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    /**
     * Filter stock selector by search term
     * @param {string} searchTerm - Search term
     */
    filterStockSelector(searchTerm) {
        const options = document.querySelectorAll('#stock-select option');
        
        options.forEach(option => {
            const shouldShow = option.textContent.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             option.value === '';
            option.style.display = shouldShow ? 'block' : 'none';
        });
    }

    /**
     * Analyze selected stock
     */
    async analyzeSelectedStock() {
        const stockSelect = document.getElementById('stock-select');
        const symbol = stockSelect.value;

        if (!symbol) {
            alert('Please select a stock to analyze');
            return;
        }

        await this.analyzeStock(symbol);
    }

    /**
     * Analyze specific stock
     * @param {string} symbol - Stock symbol
     */
    async analyzeStock(symbol) {
        try {
            const response = await fetch(`/api/guidance/stock/${symbol}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.showStockAnalysisModal(symbol, data.data);
            } else {
                throw new Error(data.error || 'Failed to analyze stock');
            }

        } catch (error) {
            console.error('Error analyzing stock:', error);
            alert(`Failed to analyze ${symbol}: ${error.message}`);
        }
    }

    /**
     * Show stock analysis in modal
     * @param {string} symbol - Stock symbol
     * @param {Object} analysisData - Analysis data
     */
    showStockAnalysisModal(symbol, analysisData) {
        const modal = document.getElementById('stock-analysis-modal');
        const modalHeader = document.getElementById('modal-stock-symbol');
        const modalBody = document.getElementById('modal-stock-analysis');

        modalHeader.textContent = `${symbol} Analysis`;
        
        modalBody.innerHTML = `
            <div class="stock-analysis-modal-content">
                <div class="recommendation-summary">
                    <div class="recommendation-badge large ${analysisData.recommendation.toLowerCase()}">
                        ${analysisData.recommendation}
                    </div>
                    <div class="confidence-summary">
                        <span>Confidence: ${(analysisData.confidence * 100).toFixed(0)}%</span>
                    </div>
                </div>

                <div class="technical-indicators">
                    <h4>Technical Analysis</h4>
                    <div class="indicators-grid">
                        <div class="indicator-item">
                            <span class="indicator-label">Trend:</span>
                            <span class="indicator-value ${analysisData.analysis.trend}">${analysisData.analysis.trend}</span>
                        </div>
                        <div class="indicator-item">
                            <span class="indicator-label">Momentum:</span>
                            <span class="indicator-value ${analysisData.analysis.momentum}">${analysisData.analysis.momentum}</span>
                        </div>
                        <div class="indicator-item">
                            <span class="indicator-label">RSI:</span>
                            <span class="indicator-value">${analysisData.analysis.rsi?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div class="indicator-item">
                            <span class="indicator-label">Volatility:</span>
                            <span class="indicator-value">${(analysisData.analysis.volatility * 100)?.toFixed(2) || 'N/A'}%</span>
                        </div>
                    </div>
                </div>

                <div class="price-levels">
                    <h4>Price Levels</h4>
                    <div class="price-grid">
                        <div class="price-item">
                            <span class="price-label">Current Price:</span>
                            <span class="price-value">${this.formatCurrency(analysisData.analysis.current_price)}</span>
                        </div>
                        <div class="price-item">
                            <span class="price-label">Target Price:</span>
                            <span class="price-value">${this.formatCurrency(analysisData.target_price)}</span>
                        </div>
                        <div class="price-item">
                            <span class="price-label">Support:</span>
                            <span class="price-value">${this.formatCurrency(analysisData.analysis.support_level)}</span>
                        </div>
                        <div class="price-item">
                            <span class="price-label">Resistance:</span>
                            <span class="price-value">${this.formatCurrency(analysisData.analysis.resistance_level)}</span>
                        </div>
                    </div>
                </div>

                <div class="ai-reasoning">
                    <h4>AI Analysis</h4>
                    <p>${analysisData.reasoning}</p>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('stock-analysis-modal');
        modal.style.display = 'none';
    }

    /**
     * Switch educational content tab
     * @param {string} tabName - Tab name
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-content`);
        });
    }

    /**
     * Submit feedback
     */
    async submitFeedback() {
        const comments = document.getElementById('feedback-comments').value;

        if (this.selectedRating === 0) {
            alert('Please select a rating');
            return;
        }

        try {
            const feedback = {
                rating: this.selectedRating,
                comments: comments,
                helpful: this.selectedRating >= 4,
                recommendation_type: 'general'
            };

            const response = await fetch('/api/guidance/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(feedback)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Thank you for your feedback!');
                this.resetFeedbackForm();
            } else {
                throw new Error(data.error || 'Failed to submit feedback');
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        }
    }

    /**
     * Update star rating display
     */
    updateStarRating() {
        const stars = document.querySelectorAll('#guidance-rating .star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < this.selectedRating);
        });
    }

    /**
     * Reset feedback form
     */
    resetFeedbackForm() {
        this.selectedRating = 0;
        document.getElementById('feedback-comments').value = '';
        this.updateStarRating();
    }

    /**
     * Refresh portfolio data
     */
    refreshPortfolioData() {
        this.loadGuidanceData();
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 12px 16px;
            border-radius: 4px;
            border: 1px solid #c3e6cb;
            z-index: 1000;
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
            }
        }, 3000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-state').style.display = 'block';
        document.getElementById('guidance-content').style.display = 'none';
    }

    /**
     * Hide error message
     */
    hideError() {
        document.getElementById('error-state').style.display = 'none';
    }

    /**
     * Show/hide loading state
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        document.getElementById('loading-state').style.display = show ? 'flex' : 'none';
        if (show) {
            document.getElementById('guidance-content').style.display = 'none';
            document.getElementById('error-state').style.display = 'none';
        }
    }

    /**
     * Calculate health score
     * @param {Object} riskAssessment - Risk assessment data
     * @returns {number} Health score
     */
    calculateHealthScore(riskAssessment) {
        let score = 70; // Base score

        // Adjust based on risk level
        if (riskAssessment.riskLevel === 'low') score += 20;
        else if (riskAssessment.riskLevel === 'high') score -= 20;

        // Adjust based on volatility
        const volatility = riskAssessment.metrics?.volatility || 0;
        if (volatility < 0.15) score += 10;
        else if (volatility > 0.30) score -= 15;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Get health rating text
     * @param {number} score - Health score
     * @returns {string} Health rating
     */
    getHealthRating(score) {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Attention';
    }

    /**
     * Get diversification rating text
     * @param {number} score - Diversification score
     * @returns {string} Diversification rating
     */
    getDiversificationRating(score) {
        if (score >= 80) return 'Well Diversified';
        if (score >= 60) return 'Moderately Diversified';
        if (score >= 40) return 'Somewhat Diversified';
        return 'Needs Diversification';
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/index.html';
    }

    /**
     * Get authentication token
     * @returns {string|null} Auth token
     */
    getAuthToken() {
        return localStorage.getItem('authToken') || 
               sessionStorage.getItem('authToken') || 
               this.getCookie('authToken');
    }

    /**
     * Get cookie value
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

// Initialize guidance page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GuidancePage();
});
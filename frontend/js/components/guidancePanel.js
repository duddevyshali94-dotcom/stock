/**
 * AI Guidance Panel Component
 * Displays AI-powered investment recommendations and guidance
 */

class GuidancePanel {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            autoRefresh: true,
            refreshInterval: 60000, // 1 minute
            showConfidence: true,
            showReasoning: true,
            theme: 'light',
            ...options
        };
        
        this.isLoading = false;
        this.currentData = null;
        this.refreshTimer = null;
        
        this.init();
    }

    /**
     * Initialize the guidance panel
     */
    init() {
        if (!this.container) {
            console.error('GuidancePanel: Container not found');
            return;
        }

        this.createPanelStructure();
        this.bindEvents();
        this.loadGuidanceData();
        
        if (this.options.autoRefresh) {
            this.startAutoRefresh();
        }
    }

    /**
     * Create panel HTML structure
     */
    createPanelStructure() {
        this.container.innerHTML = `
            <div class="guidance-panel ${this.options.theme}">
                <div class="guidance-header">
                    <h3>
                        <i class="icon-ai"></i>
                        AI Investment Guidance
                    </h3>
                    <div class="guidance-status">
                        <span class="status-indicator" id="guidance-status">Loading...</span>
                        <button class="refresh-btn" id="refresh-guidance">
                            <i class="icon-refresh"></i>
                        </button>
                    </div>
                </div>

                <div class="guidance-content">
                    <div class="loading-spinner" id="guidance-loading" style="display: none;">
                        <div class="spinner"></div>
                        <p>Analyzing your portfolio...</p>
                    </div>

                    <div class="guidance-summary" id="guidance-summary" style="display: none;">
                        <div class="summary-card">
                            <h4>Portfolio Health</h4>
                            <div class="health-score" id="portfolio-health-score">
                                <span class="score">--</span>
                                <span class="label">Score</span>
                            </div>
                            <div class="summary-metrics" id="portfolio-summary-metrics">
                                <!-- Dynamic content -->
                            </div>
                        </div>
                    </div>

                    <div class="recommendations-section" id="recommendations-section" style="display: none;">
                        <h4>
                            <i class="icon-trending-up"></i>
                            Top Recommendations
                        </h4>
                        <div class="recommendations-list" id="recommendations-list">
                            <!-- Dynamic recommendations -->
                        </div>
                    </div>

                    <div class="educational-tips" id="educational-tips" style="display: none;">
                        <h4>
                            <i class="icon-lightbulb"></i>
                            Learning Tips
                        </h4>
                        <div class="tips-carousel" id="tips-carousel">
                            <!-- Dynamic tips -->
                        </div>
                    </div>

                    <div class="market-insights" id="market-insights" style="display: none;">
                        <h4>
                            <i class="icon-chart"></i>
                            Market Insights
                        </h4>
                        <div class="insights-grid" id="insights-grid">
                            <!-- Dynamic insights -->
                        </div>
                    </div>

                    <div class="guidance-actions" id="guidance-actions" style="display: none;">
                        <button class="btn btn-primary" id="view-full-guidance">
                            View Full Guidance
                        </button>
                        <button class="btn btn-secondary" id="feedback-btn">
                            Provide Feedback
                        </button>
                    </div>
                </div>

                <div class="guidance-footer">
                    <div class="confidence-indicator">
                        <span>AI Confidence:</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" id="confidence-fill" style="width: 0%"></div>
                        </div>
                        <span id="confidence-text">--</span>
                    </div>
                    <div class="last-updated" id="last-updated">
                        Last updated: --
                    </div>
                </div>
            </div>
        `;

        this.addStyles();
    }

    /**
     * Add CSS styles for the guidance panel
     */
    addStyles() {
        if (document.getElementById('guidance-panel-styles')) return;

        const styles = `
            <style id="guidance-panel-styles">
                .guidance-panel {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 400px;
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    transition: transform 0.3s ease;
                }

                .guidance-panel.dark {
                    background: #1a1a1a;
                    color: #ffffff;
                }

                .guidance-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .guidance-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .guidance-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-indicator {
                    font-size: 12px;
                    padding: 4px 8px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 12px;
                }

                .refresh-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .refresh-btn:hover {
                    background: rgba(255,255,255,0.3);
                }

                .guidance-content {
                    padding: 16px;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .loading-spinner {
                    text-align: center;
                    padding: 20px;
                }

                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 12px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .summary-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 16px;
                }

                .guidance-panel.dark .summary-card {
                    background: #2a2a2a;
                }

                .health-score {
                    text-align: center;
                    margin: 12px 0;
                }

                .health-score .score {
                    font-size: 32px;
                    font-weight: bold;
                    color: #28a745;
                    display: block;
                }

                .health-score .label {
                    font-size: 12px;
                    color: #6c757d;
                }

                .recommendations-section h4,
                .educational-tips h4,
                .market-insights h4 {
                    margin: 16px 0 12px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #495057;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .guidance-panel.dark .recommendations-section h4,
                .guidance-panel.dark .educational-tips h4,
                .guidance-panel.dark .market-insights h4 {
                    color: #ffffff;
                }

                .recommendation-item {
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 8px;
                    transition: all 0.2s;
                }

                .guidance-panel.dark .recommendation-item {
                    background: #2a2a2a;
                    border-color: #444;
                }

                .recommendation-item:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transform: translateY(-1px);
                }

                .recommendation-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .recommendation-symbol {
                    font-weight: 600;
                    color: #495057;
                }

                .guidance-panel.dark .recommendation-symbol {
                    color: #ffffff;
                }

                .recommendation-action {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .recommendation-action.buy {
                    background: #d4edda;
                    color: #155724;
                }

                .recommendation-action.hold {
                    background: #fff3cd;
                    color: #856404;
                }

                .recommendation-action.sell {
                    background: #f8d7da;
                    color: #721c24;
                }

                .confidence-score {
                    font-size: 12px;
                    color: #6c757d;
                    margin-top: 4px;
                }

                .reasoning {
                    font-size: 13px;
                    color: #6c757d;
                    margin-top: 8px;
                    line-height: 1.4;
                }

                .tip-item {
                    background: #e3f2fd;
                    border-left: 4px solid #2196f3;
                    padding: 12px;
                    margin-bottom: 8px;
                    border-radius: 0 4px 4px 0;
                }

                .guidance-panel.dark .tip-item {
                    background: #1e3a5f;
                    border-left-color: #42a5f5;
                }

                .tip-title {
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 4px;
                    color: #1976d2;
                }

                .guidance-panel.dark .tip-title {
                    color: #64b5f6;
                }

                .tip-content {
                    font-size: 12px;
                    color: #495057;
                    line-height: 1.4;
                }

                .guidance-panel.dark .tip-content {
                    color: #cccccc;
                }

                .insight-item {
                    background: #f8f9fa;
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 8px;
                }

                .guidance-panel.dark .insight-item {
                    background: #2a2a2a;
                }

                .insight-label {
                    font-size: 11px;
                    color: #6c757d;
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 4px;
                }

                .insight-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #495057;
                }

                .guidance-panel.dark .insight-value {
                    color: #ffffff;
                }

                .guidance-actions {
                    margin-top: 16px;
                    display: flex;
                    gap: 8px;
                }

                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .btn-primary {
                    background: #667eea;
                    color: white;
                }

                .btn-primary:hover {
                    background: #5a6fd8;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn-secondary:hover {
                    background: #5a6268;
                }

                .guidance-footer {
                    background: #f8f9fa;
                    padding: 12px 16px;
                    border-top: 1px solid #e9ecef;
                    font-size: 12px;
                    color: #6c757d;
                }

                .guidance-panel.dark .guidance-footer {
                    background: #2a2a2a;
                    border-top-color: #444;
                    color: #cccccc;
                }

                .confidence-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .confidence-bar {
                    flex: 1;
                    height: 4px;
                    background: #e9ecef;
                    border-radius: 2px;
                    overflow: hidden;
                }

                .confidence-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #28a745, #20c997);
                    transition: width 0.3s ease;
                }

                .last-updated {
                    text-align: right;
                }

                .hidden {
                    display: none !important;
                }

                @media (max-width: 768px) {
                    .guidance-panel {
                        position: relative;
                        top: auto;
                        right: auto;
                        max-width: 100%;
                        margin: 16px;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-guidance');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadGuidanceData();
            });
        }

        // View full guidance button
        const viewFullBtn = document.getElementById('view-full-guidance');
        if (viewFullBtn) {
            viewFullBtn.addEventListener('click', () => {
                this.showFullGuidance();
            });
        }

        // Feedback button
        const feedbackBtn = document.getElementById('feedback-btn');
        if (feedbackBtn) {
            feedbackBtn.addEventListener('click', () => {
                this.showFeedbackModal();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'r') {
                    e.preventDefault();
                    this.loadGuidanceData();
                }
            }
        });
    }

    /**
     * Load guidance data from API
     */
    async loadGuidanceData() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.updateStatus('Loading...');
        this.showLoading(true);

        try {
            const response = await fetch('/api/guidance/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.currentData = data.data;
                this.renderGuidanceData(data.data);
                this.updateStatus('Active');
                this.showLoading(false);
                this.updateLastUpdated();
            } else {
                throw new Error(data.error || 'Failed to load guidance data');
            }

        } catch (error) {
            console.error('Error loading guidance data:', error);
            this.updateStatus('Error');
            this.showError('Failed to load guidance data. Please try again.');
            this.showLoading(false);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render guidance data in the panel
     * @param {Object} data - Guidance data
     */
    renderGuidanceData(data) {
        try {
            // Render portfolio summary
            if (data.portfolio_guidance) {
                this.renderPortfolioSummary(data.portfolio_guidance);
            }

            // Render recommendations
            if (data.portfolio_guidance && data.portfolio_guidance.recommendations) {
                this.renderRecommendations(data.portfolio_guidance.recommendations.slice(0, 3));
            }

            // Render educational tips
            if (data.beginner_guidance && data.beginner_guidance.tips) {
                this.renderEducationalTips(data.beginner_guidance.tips.slice(0, 2));
            }

            // Render market insights
            if (data.beginner_guidance && data.beginner_guidance.marketInsights) {
                this.renderMarketInsights(data.beginner_guidance.marketInsights);
            }

            // Show guidance actions
            this.showGuidanceActions(true);

            // Update confidence indicator
            this.updateConfidenceIndicator(data);

        } catch (error) {
            console.error('Error rendering guidance data:', error);
            this.showError('Error displaying guidance data');
        }
    }

    /**
     * Render portfolio summary
     * @param {Object} portfolioData - Portfolio data
     */
    renderPortfolioSummary(portfolioData) {
        const summarySection = document.getElementById('guidance-summary');
        if (!summarySection) return;

        const healthScore = portfolioData.risk_assessment?.riskLevel === 'low' ? 85 :
                          portfolioData.risk_assessment?.riskLevel === 'medium' ? 70 : 55;

        const healthScoreElement = document.getElementById('portfolio-health-score');
        if (healthScoreElement) {
            const scoreElement = healthScoreElement.querySelector('.score');
            if (scoreElement) {
                scoreElement.textContent = healthScore;
                scoreElement.style.color = healthScore >= 80 ? '#28a745' : 
                                          healthScore >= 60 ? '#ffc107' : '#dc3545';
            }
        }

        const metricsElement = document.getElementById('portfolio-summary-metrics');
        if (metricsElement && portfolioData.portfolio_summary) {
            const { total_value, total_gain_loss, total_gain_loss_percent } = portfolioData.portfolio_summary;
            metricsElement.innerHTML = `
                <div class="metric">
                    <span class="label">Portfolio Value:</span>
                    <span class="value">$${this.formatCurrency(total_value)}</span>
                </div>
                <div class="metric">
                    <span class="label">Total Gain/Loss:</span>
                    <span class="value ${total_gain_loss >= 0 ? 'positive' : 'negative'}">
                        ${total_gain_loss >= 0 ? '+' : ''}$${this.formatCurrency(Math.abs(total_gain_loss))} 
                        (${total_gain_loss_percent >= 0 ? '+' : ''}${total_gain_loss_percent.toFixed(2)}%)
                    </span>
                </div>
            `;
        }

        summarySection.style.display = 'block';
    }

    /**
     * Render recommendations
     * @param {Array} recommendations - Recommendations array
     */
    renderRecommendations(recommendations) {
        const recommendationsSection = document.getElementById('recommendations-section');
        const recommendationsList = document.getElementById('recommendations-list');
        
        if (!recommendationsSection || !recommendationsList || !recommendations.length) {
            return;
        }

        recommendationsList.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <span class="recommendation-symbol">${rec.stock.symbol}</span>
                    <span class="recommendation-action ${rec.recommendation.toLowerCase()}">
                        ${rec.recommendation}
                    </span>
                </div>
                <div class="confidence-score">
                    Confidence: ${(rec.confidence * 100).toFixed(0)}%
                </div>
                ${this.options.showReasoning ? `
                    <div class="reasoning">
                        ${rec.reasoning}
                    </div>
                ` : ''}
            </div>
        `).join('');

        recommendationsSection.style.display = 'block';
    }

    /**
     * Render educational tips
     * @param {Array} tips - Tips array
     */
    renderEducationalTips(tips) {
        const tipsSection = document.getElementById('educational-tips');
        const tipsCarousel = document.getElementById('tips-carousel');
        
        if (!tipsSection || !tipsCarousel || !tips.length) {
            return;
        }

        tipsCarousel.innerHTML = tips.map(tip => `
            <div class="tip-item">
                <div class="tip-title">${tip.title}</div>
                <div class="tip-content">${tip.description}</div>
            </div>
        `).join('');

        tipsSection.style.display = 'block';
    }

    /**
     * Render market insights
     * @param {Object} insights - Market insights data
     */
    renderMarketInsights(insights) {
        const insightsSection = document.getElementById('market-insights');
        const insightsGrid = document.getElementById('insights-grid');
        
        if (!insightsSection || !insightsGrid) {
            return;
        }

        insightsGrid.innerHTML = `
            <div class="insight-item">
                <div class="insight-label">Market Sentiment</div>
                <div class="insight-value">${insights.marketSentiment}</div>
            </div>
            <div class="insight-item">
                <div class="insight-label">Top Sectors</div>
                <div class="insight-value">${insights.topSectors?.slice(0, 3).join(', ') || 'N/A'}</div>
            </div>
        `;

        insightsSection.style.display = 'block';
    }

    /**
     * Update confidence indicator
     * @param {Object} data - Guidance data
     */
    updateConfidenceIndicator(data) {
        const confidenceFill = document.getElementById('confidence-fill');
        const confidenceText = document.getElementById('confidence-text');

        let avgConfidence = 0;
        let recommendationCount = 0;

        if (data.portfolio_guidance?.recommendations) {
            const totalConfidence = data.portfolio_guidance.recommendations.reduce((sum, rec) => {
                return sum + (rec.confidence || 0);
            }, 0);
            recommendationCount = data.portfolio_guidance.recommendations.length;
            avgConfidence = recommendationCount > 0 ? totalConfidence / recommendationCount : 0;
        }

        const confidencePercent = Math.round(avgConfidence * 100);
        
        if (confidenceFill) {
            confidenceFill.style.width = `${confidencePercent}%`;
        }
        
        if (confidenceText) {
            confidenceText.textContent = `${confidencePercent}%`;
        }
    }

    /**
     * Show/hide loading state
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        const loadingElement = document.getElementById('guidance-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show/hide guidance actions
     * @param {boolean} show - Whether to show actions
     */
    showGuidanceActions(show) {
        const actionsElement = document.getElementById('guidance-actions');
        if (actionsElement) {
            actionsElement.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create or update error message
        let errorElement = document.getElementById('guidance-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'guidance-error';
            errorElement.className = 'error-message';
            errorElement.style.cssText = `
                background: #f8d7da;
                color: #721c24;
                padding: 12px;
                border-radius: 4px;
                margin: 16px 0;
                border: 1px solid #f5c6cb;
            `;
            this.container.querySelector('.guidance-content').appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }, 5000);
    }

    /**
     * Update status indicator
     * @param {string} status - Status text
     */
    updateStatus(status) {
        const statusElement = document.getElementById('guidance-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    /**
     * Update last updated timestamp
     */
    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    /**
     * Start auto refresh
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.refreshTimer = setInterval(() => {
            if (!this.isLoading) {
                this.loadGuidanceData();
            }
        }, this.options.refreshInterval);
    }

    /**
     * Stop auto refresh
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Show full guidance page
     */
    showFullGuidance() {
        // Navigate to full guidance page or open modal
        window.location.href = '/guidance.html';
    }

    /**
     * Show feedback modal
     */
    showFeedbackModal() {
        // Create feedback modal
        const modal = this.createFeedbackModal();
        document.body.appendChild(modal);
        
        // Bind modal events
        this.bindFeedbackModalEvents(modal);
    }

    /**
     * Create feedback modal
     * @returns {HTMLElement} Modal element
     */
    createFeedbackModal() {
        const modal = document.createElement('div');
        modal.className = 'guidance-feedback-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Rate AI Guidance</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="rating-section">
                        <label>How helpful was the AI guidance?</label>
                        <div class="rating-stars" data-rating="0">
                            ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}">★</span>`).join('')}
                        </div>
                    </div>
                    <div class="feedback-section">
                        <label for="feedback-comments">Additional comments (optional):</label>
                        <textarea id="feedback-comments" placeholder="Share your thoughts on the guidance quality..."></textarea>
                    </div>
                    <div class="action-section">
                        <label>
                            <input type="checkbox" id="helpful-checkbox"> 
                            This guidance was helpful
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancel</button>
                    <button class="btn btn-primary modal-submit">Submit Feedback</button>
                </div>
            </div>
        `;

        this.addModalStyles();
        return modal;
    }

    /**
     * Add modal styles
     */
    addModalStyles() {
        if (document.getElementById('guidance-modal-styles')) return;

        const styles = `
            <style id="guidance-modal-styles">
                .guidance-feedback-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                }

                .modal-content {
                    background: white;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                    z-index: 1;
                }

                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #495057;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6c757d;
                }

                .modal-body {
                    padding: 20px;
                }

                .rating-section {
                    margin-bottom: 20px;
                }

                .rating-section label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #495057;
                }

                .rating-stars {
                    display: flex;
                    gap: 4px;
                    font-size: 24px;
                    cursor: pointer;
                }

                .star {
                    color: #dee2e6;
                    transition: color 0.2s;
                }

                .star:hover,
                .star.active {
                    color: #ffc107;
                }

                .feedback-section {
                    margin-bottom: 20px;
                }

                .feedback-section label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #495057;
                }

                .feedback-section textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 8px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    resize: vertical;
                    font-family: inherit;
                }

                .action-section {
                    margin-bottom: 20px;
                }

                .action-section label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid #e9ecef;
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }

                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: #667eea;
                    color: white;
                }

                .btn-primary:hover {
                    background: #5a6fd8;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn-secondary:hover {
                    background: #5a6268;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Bind feedback modal events
     * @param {HTMLElement} modal - Modal element
     */
    bindFeedbackModalEvents(modal) {
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const submitBtn = modal.querySelector('.modal-submit');
        const backdrop = modal.querySelector('.modal-backdrop');
        const stars = modal.querySelectorAll('.star');

        // Star rating
        let selectedRating = 0;
        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.value);
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i < selectedRating);
                });
                modal.querySelector('.rating-stars').dataset.rating = selectedRating;
            });
        });

        // Close modal
        [closeBtn, cancelBtn, backdrop].forEach(element => {
            element.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });

        // Submit feedback
        submitBtn.addEventListener('click', async () => {
            const comments = modal.querySelector('#feedback-comments').value;
            const helpful = modal.querySelector('#helpful-checkbox').checked;

            if (selectedRating === 0) {
                alert('Please select a rating');
                return;
            }

            try {
                await this.submitFeedback({
                    rating: selectedRating,
                    comments,
                    helpful,
                    recommendation_type: 'general'
                });

                document.body.removeChild(modal);
                this.showSuccess('Thank you for your feedback!');
            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('Failed to submit feedback. Please try again.');
            }
        });
    }

    /**
     * Submit feedback to API
     * @param {Object} feedback - Feedback data
     */
    async submitFeedback(feedback) {
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
        if (!data.success) {
            throw new Error(data.error || 'Failed to submit feedback');
        }

        return data;
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const successElement = document.createElement('div');
        successElement.className = 'guidance-success';
        successElement.textContent = message;
        successElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 12px 16px;
            border-radius: 4px;
            border: 1px solid #c3e6cb;
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(successElement);

        setTimeout(() => {
            if (document.body.contains(successElement)) {
                document.body.removeChild(successElement);
            }
        }, 3000);
    }

    /**
     * Get authentication token
     * @returns {string|null} Auth token
     */
    getAuthToken() {
        // Try to get token from localStorage, sessionStorage, or cookies
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

    /**
     * Destroy the guidance panel
     */
    destroy() {
        this.stopAutoRefresh();
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Clean up styles
        const styles = document.getElementById('guidance-panel-styles');
        if (styles) {
            styles.remove();
        }
        
        const modalStyles = document.getElementById('guidance-modal-styles');
        if (modalStyles) {
            modalStyles.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuidancePanel;
}
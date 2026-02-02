function renderPortfolioSummary(portfolio) {
    if (!portfolio) {
        return '';
    }
    return `
        <div class="metric">
            <span class="helper-text">Wallet Balance</span>
            <span class="value">${window.formatting.formatCurrency(portfolio.wallet_balance)}</span>
        </div>
        <div class="metric">
            <span class="helper-text">Portfolio Value</span>
            <span class="value">${window.formatting.formatCurrency(portfolio.total_value)}</span>
        </div>
        <div class="metric ${portfolio.pnl >= 0 ? 'profit' : 'loss'}">
            <span class="helper-text">Unrealized P&amp;L</span>
            <span class="value">${window.formatting.formatCurrency(portfolio.pnl)} (${window.formatting.formatPercent(portfolio.pnl_percent)})</span>
        </div>
    `;
}

window.portfolioCard = {
    renderPortfolioSummary
};

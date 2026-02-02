const portfolioSummary = document.getElementById('portfolio-summary');
const portfolioTableBody = document.querySelector('#portfolio-table tbody');
const performanceMetrics = document.getElementById('performance-metrics');

function renderSummaryCards(portfolio) {
    portfolioSummary.innerHTML = `
        <div class="card">
            <h4>Total Invested</h4>
            <p>${window.formatting.formatCurrency(portfolio.total_invested)}</p>
        </div>
        <div class="card">
            <h4>Current Value</h4>
            <p>${window.formatting.formatCurrency(portfolio.total_value)}</p>
        </div>
        <div class="card">
            <h4>Total P&amp;L</h4>
            <p>${window.formatting.formatCurrency(portfolio.pnl)} (${window.formatting.formatPercent(portfolio.pnl_percent)})</p>
        </div>
    `;
}

function renderHoldingsTable(holdings = []) {
    portfolioTableBody.innerHTML = holdings.map(holding => {
        const pnl = holding.current_value - holding.total_invested;
        return `
            <tr>
                <td>${holding.symbol}</td>
                <td>${holding.company_name}</td>
                <td>${holding.quantity}</td>
                <td>${window.formatting.formatCurrency(holding.avg_buy_price)}</td>
                <td>${window.formatting.formatCurrency(holding.current_price)}</td>
                <td>${window.formatting.formatCurrency(holding.total_invested)}</td>
                <td>${window.formatting.formatCurrency(holding.current_value)}</td>
                <td class="${pnl >= 0 ? 'success' : 'danger'}">${window.formatting.formatCurrency(pnl)}</td>
                <td>↗︎</td>
            </tr>
        `;
    }).join('');
}

function renderPerformanceMetrics(portfolio) {
    performanceMetrics.innerHTML = `
        <li>Best Performer: ${portfolio.best_stock || 'AAPL'}</li>
        <li>Worst Performer: ${portfolio.worst_stock || 'TSLA'}</li>
        <li>Most Recent Trade: ${portfolio.recent_trade || 'Buy AAPL'}</li>
        <li>Win Rate: ${portfolio.win_rate || '62%'} </li>
    `;
}

async function loadPortfolio() {
    try {
        const response = await window.apiClient.getPortfolio();
        const portfolio = response.data || response;
        renderSummaryCards(portfolio);
        renderHoldingsTable(portfolio.holdings || []);
        renderPerformanceMetrics(portfolio);
    } catch (error) {
        portfolioSummary.innerHTML = '<div class="alert">Unable to load portfolio.</div>';
    }
}

function bindPortfolioEvents() {
    document.getElementById('refresh-portfolio').addEventListener('click', loadPortfolio);
    document.getElementById('logout-button').addEventListener('click', window.auth.handleLogout);
}

async function initPortfolioPage() {
    if (!window.auth.isAuthenticated()) {
        window.location.href = '../pages/login.html';
        return;
    }
    await loadPortfolio();
    bindPortfolioEvents();
}

initPortfolioPage();

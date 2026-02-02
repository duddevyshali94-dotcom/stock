const marketTableBody = document.querySelector('#market-table tbody');
const holdingsTableBody = document.querySelector('#holdings-table tbody');
const portfolioMetrics = document.getElementById('portfolio-metrics');
let cachedStocks = [];
let cachedHoldings = [];

async function loadPortfolioSummary() {
    try {
        const response = await window.apiClient.getPortfolio();
        const portfolio = response.data || response;
        window.currentPortfolio = portfolio;
        portfolioMetrics.innerHTML = window.portfolioCard.renderPortfolioSummary(portfolio);
        window.guidance.renderGuidance(portfolio);
        const welcome = document.getElementById('welcome-name');
        if (welcome && portfolio.user_name) {
            welcome.textContent = `Welcome, ${portfolio.user_name}`;
        }
    } catch (error) {
        portfolioMetrics.innerHTML = '<div class="alert">Unable to load portfolio summary.</div>';
    }
}

async function loadMarketStocks() {
    try {
        const response = await window.apiClient.getStocks();
        cachedStocks = response.data || response;
        renderMarketTable(cachedStocks);
    } catch (error) {
        marketTableBody.innerHTML = '<tr><td colspan="7">Unable to load stocks.</td></tr>';
    }
}

function renderMarketTable(stocks) {
    if (!marketTableBody) {
        return;
    }
    marketTableBody.innerHTML = stocks.map(stock => {
        const changeClass = stock.change >= 0 ? 'success' : 'danger';
        return `
            <tr>
                <td>${stock.symbol}</td>
                <td>${stock.company_name}</td>
                <td>${window.formatting.formatCurrency(stock.price)}</td>
                <td class="${changeClass}">${window.formatting.formatNumber(stock.change)}</td>
                <td class="${changeClass}">${window.formatting.formatPercent(stock.change_percent)}</td>
                <td>${window.formatting.formatDateTime(stock.updated_at)}</td>
                <td><button class="btn btn-success" data-action="buy" data-id="${stock.id}">Buy</button></td>
            </tr>
        `;
    }).join('');
}

async function loadHoldings() {
    try {
        const response = await window.apiClient.getPortfolio();
        const portfolio = response.data || response;
        cachedHoldings = portfolio.holdings || [];
        holdingsTableBody.innerHTML = cachedHoldings.map(item => {
            const pnl = item.current_value - item.total_invested;
            const pnlPercent = item.total_invested ? (pnl / item.total_invested) * 100 : 0;
            const pnlClass = pnl >= 0 ? 'success' : 'danger';
            return `
                <tr>
                    <td>${item.symbol}</td>
                    <td>${item.company_name}</td>
                    <td>${item.quantity}</td>
                    <td>${window.formatting.formatCurrency(item.avg_buy_price)}</td>
                    <td>${window.formatting.formatCurrency(item.current_price)}</td>
                    <td>${window.formatting.formatCurrency(item.total_invested)}</td>
                    <td>${window.formatting.formatCurrency(item.current_value)}</td>
                    <td class="${pnlClass}">${window.formatting.formatCurrency(pnl)}</td>
                    <td class="${pnlClass}">${window.formatting.formatPercent(pnlPercent)}</td>
                    <td class="holdings-actions">
                        <button class="btn btn-danger" data-action="sell" data-id="${item.stock_id}">Sell</button>
                        <button class="btn btn-outline" data-action="details" data-id="${item.stock_id}">View</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        holdingsTableBody.innerHTML = '<tr><td colspan="10">Unable to load holdings.</td></tr>';
    }
}

function bindMarketActions() {
    marketTableBody.addEventListener('click', event => {
        const action = event.target.getAttribute('data-action');
        if (action === 'buy') {
            const stockId = event.target.getAttribute('data-id');
            const stock = cachedStocks.find(item => String(item.id) === String(stockId));
            const balance = window.currentPortfolio?.wallet_balance || 0;
            if (stock) {
                window.tradingModal.openTradeModal({
                    mode: 'buy',
                    stock,
                    holdings: 0,
                    balance,
                    onSubmit: async quantity => {
                        await window.apiClient.buyStock(stock.id, quantity);
                        window.tradingModal.closeTradeModal();
                        await loadPortfolioSummary();
                        await loadHoldings();
                    }
                });
            }
        }
    });
}

function bindHoldingsActions() {
    holdingsTableBody.addEventListener('click', event => {
        const action = event.target.getAttribute('data-action');
        if (action === 'sell') {
            const stockId = event.target.getAttribute('data-id');
            const holding = cachedHoldings.find(item => String(item.stock_id) === String(stockId));
            const stock = cachedStocks.find(item => String(item.id) === String(stockId));
            if (holding && stock) {
                window.tradingModal.openTradeModal({
                    mode: 'sell',
                    stock,
                    holdings: holding.quantity,
                    balance: window.currentPortfolio?.wallet_balance || 0,
                    onSubmit: async quantity => {
                        await window.apiClient.sellStock(stock.id, quantity);
                        window.tradingModal.closeTradeModal();
                        await loadPortfolioSummary();
                        await loadHoldings();
                    }
                });
            }
        }
    });
}

function bindFilters() {
    document.getElementById('stock-search').addEventListener('input', event => {
        const term = event.target.value.toLowerCase();
        const filtered = cachedStocks.filter(stock => stock.symbol.toLowerCase().includes(term) || stock.company_name.toLowerCase().includes(term));
        renderMarketTable(filtered);
    });

    document.getElementById('stock-sort').addEventListener('change', event => {
        const value = event.target.value;
        const sorted = [...cachedStocks].sort((a, b) => {
            if (value === 'price') {
                return b.price - a.price;
            }
            if (value === 'change') {
                return b.change - a.change;
            }
            return a.symbol.localeCompare(b.symbol);
        });
        renderMarketTable(sorted);
    });
}

function bindUserEvents() {
    document.getElementById('logout-button').addEventListener('click', window.auth.handleLogout);
    document.getElementById('refresh-ticker').addEventListener('click', window.priceTicker.startTicker);
    document.getElementById('refresh-holdings').addEventListener('click', loadHoldings);
    document.getElementById('view-portfolio').addEventListener('click', () => {
        window.location.href = 'portfolio.html';
    });
    bindMarketActions();
    bindHoldingsActions();
    bindFilters();
    window.guidance.bindGuidanceEvents();
    document.getElementById('close-trade-modal').addEventListener('click', window.tradingModal.closeTradeModal);
}

async function initUserDashboard() {
    if (!window.auth.isAuthenticated()) {
        window.location.href = '../pages/login.html';
        return;
    }
    await loadPortfolioSummary();
    await loadMarketStocks();
    await loadHoldings();
    window.priceTicker.startTicker();
    bindUserEvents();
}

initUserDashboard();

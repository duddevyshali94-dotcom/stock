let tickerInterval;

function renderTicker(stocks) {
    const ticker = document.getElementById('price-ticker');
    if (!ticker) {
        return;
    }
    const items = stocks.slice(0, 5).map(stock => {
        const direction = stock.change >= 0 ? 'up' : 'down';
        const arrow = stock.change >= 0 ? '▲' : '▼';
        return `
            <div class="ticker-item">
                <span>${stock.symbol}</span>
                <span>${window.formatting.formatCurrency(stock.price)}</span>
                <span class="change ${direction}">${arrow} ${window.formatting.formatNumber(stock.change)}</span>
                <span class="change ${direction}">${window.formatting.formatPercent(stock.change_percent)}</span>
            </div>
        `;
    }).join('');
    ticker.innerHTML = items + items;
}

async function startTicker() {
    if (tickerInterval) {
        clearInterval(tickerInterval);
    }
    const loadStocks = async () => {
        try {
            const response = await window.apiClient.getStocks();
            renderTicker(response.data || response);
        } catch (error) {
            console.error('Failed to load ticker', error);
        }
    };

    await loadStocks();
    tickerInterval = setInterval(loadStocks, 30000);
}

function stopTicker() {
    if (tickerInterval) {
        clearInterval(tickerInterval);
    }
}

window.priceTicker = {
    startTicker,
    renderTicker,
    stopTicker
};

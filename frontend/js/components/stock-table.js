function renderStockRows(stocks, onAction) {
    return stocks.map(stock => {
        const changeClass = stock.change >= 0 ? 'success' : 'danger';
        return `
            <tr>
                <td>${stock.symbol}</td>
                <td>${stock.company_name}</td>
                <td>${window.formatting.formatCurrency(stock.price)}</td>
                <td class="${changeClass}">${window.formatting.formatNumber(stock.change)}</td>
                <td class="${changeClass}">${window.formatting.formatPercent(stock.change_percent)}</td>
                <td>${window.formatting.formatDateTime(stock.updated_at)}</td>
                <td>
                    <button class="btn btn-outline" data-action="view" data-id="${stock.id}">View</button>
                    ${onAction ? '<button class="btn btn-primary" data-action="action" data-id="' + stock.id + '">Action</button>' : ''}
                </td>
            </tr>
        `;
    }).join('');
}

window.stockTable = {
    renderStockRows
};

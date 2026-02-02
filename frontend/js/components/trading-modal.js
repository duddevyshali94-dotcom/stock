function openTradeModal({ mode, stock, holdings, balance, onSubmit }) {
    const modal = document.getElementById('trade-modal');
    const body = document.getElementById('trade-modal-body');
    const title = document.getElementById('trade-modal-title');
    const maxQuantity = mode === 'buy' ? Math.floor(balance / stock.price) : holdings;

    title.textContent = `${mode === 'buy' ? 'Buy' : 'Sell'} ${stock.symbol}`;

    body.innerHTML = `
        <div class="form-group">
            <label>Stock Symbol</label>
            <input type="text" value="${stock.symbol} - ${stock.company_name}" disabled>
        </div>
        <div class="form-group">
            <label>Current Price</label>
            <input type="text" value="${window.formatting.formatCurrency(stock.price)}" disabled>
        </div>
        <div class="form-group">
            <label for="trade-quantity">Quantity</label>
            <input type="number" id="trade-quantity" min="1" max="${maxQuantity}" value="1">
            <small class="helper-text">Max ${maxQuantity} shares</small>
        </div>
        <div class="form-group">
            <label>Total ${mode === 'buy' ? 'Cost' : 'Proceeds'}</label>
            <input type="text" id="trade-total" value="${window.formatting.formatCurrency(stock.price)}" disabled>
        </div>
        <div class="form-group">
            <label>Available Balance</label>
            <input type="text" value="${window.formatting.formatCurrency(balance)}" disabled>
        </div>
        <div id="trade-error" class="alert" style="display:none;"></div>
        <button class="btn ${mode === 'buy' ? 'btn-success' : 'btn-danger'}" id="trade-submit">${mode === 'buy' ? 'Buy' : 'Sell'} Shares</button>
    `;

    const quantityInput = body.querySelector('#trade-quantity');
    const totalInput = body.querySelector('#trade-total');
    const submitButton = body.querySelector('#trade-submit');
    const errorBox = body.querySelector('#trade-error');

    const updateTotal = () => {
        const qty = Number(quantityInput.value);
        const total = qty * stock.price;
        totalInput.value = window.formatting.formatCurrency(total);
        if (mode === 'buy' && total > balance) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Insufficient balance for this purchase.';
            submitButton.disabled = true;
        } else if (mode === 'sell' && qty > holdings) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Quantity exceeds holdings.';
            submitButton.disabled = true;
        } else {
            errorBox.style.display = 'none';
            submitButton.disabled = false;
        }
    };

    quantityInput.addEventListener('input', updateTotal);
    updateTotal();

    submitButton.addEventListener('click', () => {
        const quantity = Number(quantityInput.value);
        if (!window.validators.isPositiveInteger(quantity)) {
            errorBox.style.display = 'block';
            errorBox.textContent = 'Enter a valid quantity.';
            return;
        }
        onSubmit(quantity);
    });

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function closeTradeModal() {
    const modal = document.getElementById('trade-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

window.tradingModal = {
    openTradeModal,
    closeTradeModal
};

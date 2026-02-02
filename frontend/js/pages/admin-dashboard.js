const stocksTableBody = document.querySelector('#stocks-table tbody');
const usersTableBody = document.querySelector('#users-table tbody');
const stockModal = document.getElementById('stock-modal');
const stockModalBody = document.getElementById('stock-modal-body');
const addStockError = document.getElementById('add-stock-error');

async function loadStocks() {
    if (!stocksTableBody) {
        return;
    }
    try {
        const response = await window.apiClient.getStocks();
        const stocks = response.data || response;
        stocksTableBody.innerHTML = stocks.map(stock => {
            const changeClass = stock.change >= 0 ? 'success' : 'danger';
            return `
                <tr>
                    <td>${stock.symbol}</td>
                    <td>${stock.company_name}</td>
                    <td>${window.formatting.formatCurrency(stock.price)}</td>
                    <td class="${changeClass}">${window.formatting.formatNumber(stock.change)}</td>
                    <td class="${changeClass}">${window.formatting.formatPercent(stock.change_percent)}</td>
                    <td>${window.formatting.formatDateTime(stock.updated_at)}</td>
                    <td class="inline-actions">
                        <button class="btn btn-outline" data-action="view" data-id="${stock.id}">View</button>
                        <button class="btn btn-outline" data-action="toggle" data-id="${stock.id}">${stock.enabled ? 'Disable' : 'Enable'}</button>
                        <button class="btn btn-danger" data-action="delete" data-id="${stock.id}">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        stocksTableBody.innerHTML = '<tr><td colspan="7">Unable to load stocks.</td></tr>';
    }
}

async function loadUsers() {
    if (!usersTableBody) {
        return;
    }
    try {
        const response = await window.apiClient.getAdminUsers();
        const users = response.data || response;
        usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${window.formatting.formatCurrency(user.balance)}</td>
                <td>${user.total_trades || 0}</td>
                <td>${window.formatting.formatDateTime(user.last_login)}</td>
                <td><button class="btn btn-outline" data-action="portfolio" data-id="${user.id}">View</button></td>
            </tr>
        `).join('');
    } catch (error) {
        usersTableBody.innerHTML = '<tr><td colspan="7">Unable to load users.</td></tr>';
    }
}

function openStockModal(stock) {
    stockModalBody.innerHTML = `
        <div class="form-group">
            <label>Symbol</label>
            <input type="text" value="${stock.symbol}" disabled>
        </div>
        <div class="form-group">
            <label>Company Name</label>
            <input type="text" value="${stock.company_name}" disabled>
        </div>
        <div class="form-group">
            <label>Current Price</label>
            <input type="text" value="${window.formatting.formatCurrency(stock.price)}" disabled>
        </div>
        <button class="btn btn-outline" id="manual-refresh">Refresh Price</button>
    `;
    stockModal.classList.add('active');
    stockModal.setAttribute('aria-hidden', 'false');

    const refreshButton = document.getElementById('manual-refresh');
    refreshButton.addEventListener('click', async () => {
        await loadStocks();
    });
}

function closeStockModal() {
    stockModal.classList.remove('active');
    stockModal.setAttribute('aria-hidden', 'true');
}

async function handleAddStock(event) {
    event.preventDefault();
    addStockError.style.display = 'none';

    const symbol = document.getElementById('stock-symbol').value.trim().toUpperCase();
    const company = document.getElementById('stock-company').value.trim();
    const price = document.getElementById('stock-price').value;

    if (!symbol || !company || !window.validators.isPositiveNumber(price)) {
        addStockError.textContent = 'Provide valid stock details.';
        addStockError.style.display = 'block';
        return;
    }

    try {
        await window.apiClient.addStock(symbol, company, Number(price));
        document.getElementById('add-stock-form').reset();
        loadStocks();
    } catch (error) {
        addStockError.textContent = error.message || 'Unable to add stock.';
        addStockError.style.display = 'block';
    }
}

function bindStockActions() {
    stocksTableBody.addEventListener('click', async event => {
        const action = event.target.getAttribute('data-action');
        if (!action) {
            return;
        }
        const stockId = event.target.getAttribute('data-id');
        const response = await window.apiClient.getStocks();
        const stocks = response.data || response;
        const stock = stocks.find(item => String(item.id) === String(stockId));
        if (!stock) {
            return;
        }

        if (action === 'view') {
            openStockModal(stock);
        }
        if (action === 'toggle') {
            await window.apiClient.updateStock(stockId, { enabled: !stock.enabled });
            loadStocks();
        }
        if (action === 'delete') {
            await window.apiClient.deleteStock(stockId);
            loadStocks();
        }
    });
}

function bindAdminEvents() {
    document.getElementById('refresh-stocks').addEventListener('click', loadStocks);
    document.getElementById('refresh-users').addEventListener('click', loadUsers);
    document.getElementById('add-stock-form').addEventListener('submit', handleAddStock);
    document.getElementById('logout-button').addEventListener('click', window.auth.handleLogout);
    document.getElementById('close-stock-modal').addEventListener('click', closeStockModal);
    document.getElementById('fetch-price').addEventListener('click', () => {
        document.getElementById('stock-price').value = (Math.random() * 500 + 10).toFixed(2);
    });
    bindStockActions();
}

async function initAdminDashboard() {
    if (!window.auth.isAuthenticated()) {
        window.location.href = '../pages/login.html';
        return;
    }
    await loadStocks();
    await loadUsers();
    bindAdminEvents();
}

initAdminDashboard();

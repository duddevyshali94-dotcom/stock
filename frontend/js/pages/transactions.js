const transactionsTableBody = document.querySelector('#transactions-table tbody');

function renderTransactions(transactions = []) {
    transactionsTableBody.innerHTML = transactions.map(transaction => `
        <tr>
            <td>${window.formatting.formatDateTime(transaction.date)}</td>
            <td>${transaction.type}</td>
            <td>${transaction.symbol}</td>
            <td>${transaction.quantity}</td>
            <td>${window.formatting.formatCurrency(transaction.price)}</td>
            <td>${window.formatting.formatCurrency(transaction.total_amount)}</td>
            <td>${transaction.status || 'Completed'}</td>
        </tr>
    `).join('');
}

async function loadTransactions() {
    try {
        const response = await window.apiClient.getTransactions();
        const transactions = response.data || response;
        renderTransactions(transactions);
    } catch (error) {
        transactionsTableBody.innerHTML = '<tr><td colspan="7">Unable to load transactions.</td></tr>';
    }
}

function applyFilters() {
    const type = document.getElementById('filter-type').value;
    const symbol = document.getElementById('filter-symbol').value.toLowerCase();
    const startDate = document.getElementById('filter-start').value;
    const endDate = document.getElementById('filter-end').value;

    window.apiClient.getTransactions().then(response => {
        let transactions = response.data || response;
        if (type) {
            transactions = transactions.filter(item => item.type === type);
        }
        if (symbol) {
            transactions = transactions.filter(item => item.symbol.toLowerCase().includes(symbol));
        }
        if (startDate) {
            transactions = transactions.filter(item => new Date(item.date) >= new Date(startDate));
        }
        if (endDate) {
            transactions = transactions.filter(item => new Date(item.date) <= new Date(endDate));
        }
        renderTransactions(transactions);
    });
}

function bindTransactionEvents() {
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('export-csv').addEventListener('click', () => {
        alert('CSV export is coming soon.');
    });
    document.getElementById('download-statement').addEventListener('click', () => {
        alert('Statement download is coming soon.');
    });
    document.getElementById('logout-button').addEventListener('click', window.auth.handleLogout);
}

async function initTransactionsPage() {
    if (!window.auth.isAuthenticated()) {
        window.location.href = '../pages/login.html';
        return;
    }
    await loadTransactions();
    bindTransactionEvents();
}

initTransactionsPage();

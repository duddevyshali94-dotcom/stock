async function request(path, options = {}, retryCount = window.APP_CONFIG.RETRY_COUNT) {
    const url = `${window.APP_CONFIG.API_BASE_URL}${path}`;
    const token = window.storage.getFromStorage('stockpulse_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            window.storage.removeFromStorage('stockpulse_token');
            window.location.href = '../pages/login.html';
            return Promise.reject(new Error('Unauthorized'));
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        return data;
    } catch (error) {
        if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, window.APP_CONFIG.RETRY_DELAY));
            return request(path, options, retryCount - 1);
        }
        throw error;
    }
}

const apiClient = {
    getStocks() {
        return request('/stocks');
    },
    buyStock(stockId, quantity) {
        return request(`/trades/buy`, {
            method: 'POST',
            body: JSON.stringify({ stockId, quantity })
        });
    },
    sellStock(stockId, quantity) {
        return request(`/trades/sell`, {
            method: 'POST',
            body: JSON.stringify({ stockId, quantity })
        });
    },
    getPortfolio() {
        return request('/portfolio');
    },
    getTransactions() {
        return request('/transactions');
    },
    getWalletBalance() {
        return request('/wallet');
    },
    getAdminUsers() {
        return request('/admin/users');
    },
    addStock(symbol, company_name, price) {
        return request('/admin/stocks', {
            method: 'POST',
            body: JSON.stringify({ symbol, company_name, price })
        });
    },
    updateStock(id, data) {
        return request(`/admin/stocks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    deleteStock(id) {
        return request(`/admin/stocks/${id}`, {
            method: 'DELETE'
        });
    }
};

window.apiClient = apiClient;

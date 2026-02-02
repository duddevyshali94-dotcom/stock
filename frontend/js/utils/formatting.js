function formatCurrency(value) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '--';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2
    }).format(Number(value));
}

function formatNumber(value, digits = 2) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '--';
    }
    return Number(value).toFixed(digits);
}

function formatPercent(value) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '--';
    }
    return `${Number(value).toFixed(2)}%`;
}

function formatDateTime(value) {
    if (!value) {
        return '--';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '--';
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

window.formatting = {
    formatCurrency,
    formatNumber,
    formatPercent,
    formatDateTime
};

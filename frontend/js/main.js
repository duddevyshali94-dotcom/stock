async function checkSystemHealth() {
    const statusElement = document.getElementById('system-status');
    if (!statusElement) {
        return;
    }
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/health`);
        const data = await response.json();

        if (data.success) {
            statusElement.textContent = 'Online';
            statusElement.classList.remove('offline');
        } else {
            statusElement.textContent = 'Error';
            statusElement.classList.add('offline');
        }
    } catch (error) {
        console.error('Failed to check system health:', error);
        statusElement.textContent = 'Offline';
        statusElement.classList.add('offline');
    }
}

function initializeApp() {
    checkSystemHealth();
    const button = document.getElementById('open-login');
    if (button) {
        button.addEventListener('click', () => {
            window.location.href = 'pages/login.html';
        });
    }
    setInterval(checkSystemHealth, 30000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

const API_BASE_URL = 'http://localhost:5000/api';

async function checkSystemHealth() {
    const statusElement = document.getElementById('system-status');
    
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.success) {
            statusElement.textContent = 'Online';
            statusElement.className = 'online';
            console.log('System health check:', data);
        } else {
            statusElement.textContent = 'Error';
            statusElement.className = 'offline';
        }
    } catch (error) {
        console.error('Failed to check system health:', error);
        statusElement.textContent = 'Offline';
        statusElement.className = 'offline';
    }
}

function initializeApp() {
    console.log('Real-Time Stock Market System initialized');
    checkSystemHealth();
    
    setInterval(checkSystemHealth, 30000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

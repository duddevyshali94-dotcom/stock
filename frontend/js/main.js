const API_BASE_URL = 'http://localhost:5000/api';

// Global state management
let currentUser = null;
let guidancePanel = null;

// Utility functions
function getAuthToken() {
    return localStorage.getItem('authToken') || 
           sessionStorage.getItem('authToken') || 
           getCookie('authToken');
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatPercent(value) {
    return `${(value >= 0 ? '+' : '')}${value.toFixed(2)}%`;
}

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

async function initializeGuidancePanel() {
    // Only initialize if user is authenticated
    const token = getAuthToken();
    if (!token) {
        console.log('User not authenticated, skipping guidance panel');
        return;
    }

    try {
        // Verify token is still valid
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            currentUser = userData.data.user;
            
            // Initialize guidance panel
            if (typeof GuidancePanel !== 'undefined') {
                guidancePanel = new GuidancePanel('guidance-panel-container', {
                    autoRefresh: true,
                    refreshInterval: 60000, // 1 minute
                    theme: 'light'
                });
                
                console.log('AI Guidance Panel initialized for user:', currentUser.email);
            } else {
                console.warn('GuidancePanel class not found');
            }
        } else {
            console.log('Invalid token, removing guidance panel');
            clearAuthToken();
        }
    } catch (error) {
        console.error('Error initializing guidance panel:', error);
    }
}

function clearAuthToken() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    currentUser = null;
    
    if (guidancePanel) {
        guidancePanel.destroy();
        guidancePanel = null;
    }
}

function setupNavigation() {
    // Add navigation event listeners
    document.addEventListener('click', (e) => {
        // Handle logout
        if (e.target.matches('#logout-btn') || e.target.closest('#logout-btn')) {
            e.preventDefault();
            handleLogout();
        }
        
        // Handle navigation
        if (e.target.matches('nav a[href]')) {
            const href = e.target.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                navigateToSection(href.substring(1));
            }
        }
    });
}

function navigateToSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('main > section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

async function handleLogout() {
    try {
        const token = getAuthToken();
        if (token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.error('Error during logout:', error);
    } finally {
        clearAuthToken();
        // Redirect to login page or refresh
        window.location.reload();
    }
}

function setupGlobalErrorHandling() {
    // Global error handler for unhandled promises
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Show user-friendly error message
        showErrorMessage('An unexpected error occurred. Please try again.');
    });

    // Global error handler for JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });
}

function showErrorMessage(message) {
    // Create or update error message element
    let errorElement = document.getElementById('global-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'global-error';
        errorElement.className = 'global-error-message';
        errorElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 12px 16px;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function showSuccessMessage(message) {
    // Create or update success message element
    let successElement = document.getElementById('global-success');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'global-success';
        successElement.className = 'global-success-message';
        successElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 12px 16px;
            border-radius: 4px;
            border: 1px solid #c3e6cb;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(successElement);
    }
    
    successElement.textContent = message;
    successElement.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R: Refresh data (prevent page reload)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshCurrentView();
        }
        
        // Escape: Close modals or dropdowns
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function refreshCurrentView() {
    // Refresh current page data
    if (guidancePanel) {
        guidancePanel.loadGuidanceData();
    }
    
    // Refresh system health
    checkSystemHealth();
    
    showSuccessMessage('Data refreshed successfully');
}

function closeAllModals() {
    // Close any open modals
    const modals = document.querySelectorAll('.modal, [style*="display: flex"]');
    modals.forEach(modal => {
        if (modal.classList.contains('modal') || modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
}

function setupRealTimeUpdates() {
    // Set up periodic updates for various components
    setInterval(() => {
        checkSystemHealth();
        
        // Update guidance panel if user is authenticated
        if (guidancePanel && !guidancePanel.isLoading) {
            guidancePanel.loadGuidanceData();
        }
    }, 30000); // 30 seconds

    // More frequent updates for critical data (every 5 seconds)
    setInterval(() => {
        // Update any real-time stock prices or portfolio values
        updateRealTimeData();
    }, 5000);
}

function updateRealTimeData() {
    // Update stock prices, portfolio values, etc.
    const priceElements = document.querySelectorAll('.stock-price');
    priceElements.forEach(element => {
        // Simulate price updates (in real implementation, fetch from API)
        const currentPrice = parseFloat(element.textContent.replace(/[$,]/g, ''));
        const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
        const newPrice = currentPrice + change;
        
        element.textContent = formatCurrency(newPrice);
        
        // Update color based on change
        element.className = `stock-price ${change >= 0 ? 'positive' : 'negative'}`;
    });
}

function initializeApp() {
    console.log('AI-Powered Real-Time Stock Market System initialized');
    
    // Setup global error handling
    setupGlobalErrorHandling();
    
    // Setup navigation
    setupNavigation();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Check system health
    checkSystemHealth();
    
    // Initialize guidance panel if on appropriate page
    if (document.getElementById('guidance-panel-container') || 
        document.body.classList.contains('dashboard-page')) {
        initializeGuidancePanel();
    }
    
    // Setup real-time updates
    setupRealTimeUpdates();
    
    // Show success message
    console.log('✅ Application ready for use');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export functions for use in other scripts
window.StockMarketApp = {
    checkSystemHealth,
    initializeGuidancePanel,
    handleLogout,
    showErrorMessage,
    showSuccessMessage,
    formatCurrency,
    formatPercent,
    getAuthToken,
    clearAuthToken
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Real-Time Stock Market System initialized');

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Login button clicked - Redirecting to auth (Phase 2)');
            alert('Authentication will be implemented in Phase 2.');
        });
    }

    // Health check call to backend
    fetch('http://localhost:5000/api/health')
        .then(response => response.json())
        .then(data => {
            console.log('Backend status:', data.status);
        })
        .catch(err => {
            console.warn('Backend not reachable. Make sure the server is running on port 5000.');
        });
});

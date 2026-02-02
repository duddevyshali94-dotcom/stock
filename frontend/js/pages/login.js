const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

function clearErrors() {
    loginError.style.display = 'none';
    document.getElementById('login-email-error').textContent = '';
    document.getElementById('login-password-error').textContent = '';
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    clearErrors();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    let isValid = true;
    if (!window.validators.isValidEmail(email)) {
        document.getElementById('login-email-error').textContent = 'Enter a valid email address.';
        isValid = false;
    }
    if (!password) {
        document.getElementById('login-password-error').textContent = 'Password is required.';
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    try {
        const response = await window.auth.handleLogin(email, password);
        window.auth.saveToken(response.token || response.data?.token, response.user || response.data?.user);
        const role = response.user?.role || response.data?.user?.role;
        if (role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
    } catch (error) {
        showLoginError(error.message || 'Login failed.');
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
}

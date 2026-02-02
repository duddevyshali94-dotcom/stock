const signupForm = document.getElementById('signup-form');
const signupError = document.getElementById('signup-error');

function clearSignupErrors() {
    signupError.style.display = 'none';
    ['signup-email-error', 'signup-password-error', 'signup-confirm-error', 'signup-role-error'].forEach(id => {
        document.getElementById(id).textContent = '';
    });
}

function showSignupError(message) {
    signupError.textContent = message;
    signupError.style.display = 'block';
}

async function handleSignupSubmit(event) {
    event.preventDefault();
    clearSignupErrors();

    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const role = document.getElementById('signup-role').value;

    let isValid = true;
    if (!window.validators.isValidEmail(email)) {
        document.getElementById('signup-email-error').textContent = 'Enter a valid email address.';
        isValid = false;
    }
    if (!window.validators.isStrongPassword(password)) {
        document.getElementById('signup-password-error').textContent = 'Password must be 8+ chars, include uppercase and number.';
        isValid = false;
    }
    if (password !== confirm) {
        document.getElementById('signup-confirm-error').textContent = 'Passwords do not match.';
        isValid = false;
    }
    if (!role) {
        document.getElementById('signup-role-error').textContent = 'Select a role.';
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    try {
        const response = await window.auth.handleSignup(email, password, role);
        window.auth.saveToken(response.token || response.data?.token, response.user || response.data?.user);
        if (role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
    } catch (error) {
        showSignupError(error.message || 'Signup failed.');
    }
}

if (signupForm) {
    signupForm.addEventListener('submit', handleSignupSubmit);
}

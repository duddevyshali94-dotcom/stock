const AUTH_TOKEN_KEY = 'stockpulse_token';
const USER_KEY = 'stockpulse_user';

async function handleLogin(email, password) {
    return window.apiClient.post('/auth/login', { email, password });
}

async function handleSignup(email, password, role) {
    return window.apiClient.post('/auth/signup', { email, password, role });
}

function handleLogout() {
    window.storage.removeFromStorage(AUTH_TOKEN_KEY);
    window.storage.removeFromStorage(USER_KEY);
    window.location.href = '../pages/login.html';
}

function isAuthenticated() {
    return Boolean(window.storage.getFromStorage(AUTH_TOKEN_KEY));
}

function getUser() {
    return window.storage.getFromStorage(USER_KEY);
}

function saveToken(token, user) {
    window.storage.saveToStorage(AUTH_TOKEN_KEY, token);
    if (user) {
        window.storage.saveToStorage(USER_KEY, user);
    }
}

function removeToken() {
    window.storage.removeFromStorage(AUTH_TOKEN_KEY);
    window.storage.removeFromStorage(USER_KEY);
}

window.auth = {
    handleLogin,
    handleSignup,
    handleLogout,
    isAuthenticated,
    getUser,
    saveToken,
    removeToken
};

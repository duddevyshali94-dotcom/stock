function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getFromStorage(key, fallback = null) {
    const stored = localStorage.getItem(key);
    if (!stored) {
        return fallback;
    }
    try {
        return JSON.parse(stored);
    } catch (error) {
        return fallback;
    }
}

function removeFromStorage(key) {
    localStorage.removeItem(key);
}

window.storage = {
    saveToStorage,
    getFromStorage,
    removeFromStorage
};

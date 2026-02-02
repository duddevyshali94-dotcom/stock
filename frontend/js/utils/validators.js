function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
    return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function isPositiveInteger(value) {
    return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isPositiveNumber(value) {
    return !Number.isNaN(Number(value)) && Number(value) > 0;
}

window.validators = {
    isValidEmail,
    isStrongPassword,
    isPositiveInteger,
    isPositiveNumber
};

const { AppError } = require('./errors');

function requireFields(payload, fields) {
  const missing = fields.filter(field => payload[field] === undefined || payload[field] === null || payload[field] === '');
  if (missing.length) {
    throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
  }
}

function ensurePositiveNumber(value, fieldName) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue) || numericValue <= 0) {
    throw new AppError(`${fieldName} must be a positive number`, 400);
  }
  return numericValue;
}

function ensureNonNegativeNumber(value, fieldName) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue) || numericValue < 0) {
    throw new AppError(`${fieldName} must be a non-negative number`, 400);
  }
  return numericValue;
}

function ensurePositiveInteger(value, fieldName) {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }
  return numericValue;
}

function ensureNumber(value, fieldName) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    throw new AppError(`${fieldName} must be a valid number`, 400);
  }
  return numericValue;
}

module.exports = {
  requireFields,
  ensurePositiveNumber,
  ensureNonNegativeNumber,
  ensurePositiveInteger,
  ensureNumber
};

const express = require('express');
const stockService = require('../services/stockService');
const adminService = require('../services/adminService');
const { authenticateUser } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { requireFields, ensureNonNegativeNumber, ensureNumber } = require('../utils/validation');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/stocks', authenticateUser, checkRole('admin'), asyncHandler(async (req, res) => {
  const stocks = await stockService.getAllStocks(false);
  res.json({
    success: true,
    data: stocks
  });
}));

router.post('/stocks', authenticateUser, checkRole('admin'), asyncHandler(async (req, res) => {
  const { symbol, company_name: companyName, current_price: currentPrice } = req.body;
  requireFields(req.body, ['symbol', 'company_name', 'current_price']);

  const parsedPrice = ensureNonNegativeNumber(currentPrice, 'current_price');

  const stock = await stockService.addStock(symbol, companyName, parsedPrice, {
    added_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: stock
  });
}));

router.put('/stocks/:id', authenticateUser, checkRole('admin'), asyncHandler(async (req, res) => {
  const updatePayload = { ...req.body };
  if (updatePayload.current_price !== undefined) {
    updatePayload.current_price = ensureNonNegativeNumber(updatePayload.current_price, 'current_price');
  }
  if (updatePayload.daily_change !== undefined) {
    updatePayload.daily_change = ensureNumber(updatePayload.daily_change, 'daily_change');
  }
  if (updatePayload.daily_change_percent !== undefined) {
    updatePayload.daily_change_percent = ensureNumber(updatePayload.daily_change_percent, 'daily_change_percent');
  }

  const updated = await stockService.updateStock(req.params.id, updatePayload);
  res.json({
    success: true,
    data: updated
  });
}));

router.delete('/stocks/:id', authenticateUser, checkRole('admin'), asyncHandler(async (req, res) => {
  await stockService.deleteStock(req.params.id);
  res.json({
    success: true,
    message: 'Stock deleted'
  });
}));

router.put('/stocks/:id/toggle', authenticateUser, checkRole('admin'), asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  if (enabled === undefined) {
    return res.status(400).json({
      success: false,
      error: 'enabled is required'
    });
  }

  const isEnabled = enabled === true || enabled === 'true' || enabled === 1 || enabled === '1';

  const updated = await stockService.toggleStockStatus(req.params.id, isEnabled);

  res.json({
    success: true,
    data: updated
  });
}));

router.get('/users', authenticateUser, checkRole('admin'), asyncHandler(async (req, res) => {
  const users = await adminService.listUsers();
  res.json({
    success: true,
    data: users
  });
}));

router.get('/users/:userId/activity', authenticateUser, checkRole('admin'), asyncHandler(async (req, res) => {
  const data = await adminService.getUserActivity(req.params.userId);
  res.json({
    success: true,
    data
  });
}));

router.get('/statistics', authenticateUser, checkRole('admin'), asyncHandler(async (req, res) => {
  const data = await adminService.getStatistics();
  res.json({
    success: true,
    data
  });
}));

module.exports = router;

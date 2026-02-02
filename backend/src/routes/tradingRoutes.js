const express = require('express');
const tradingService = require('../services/tradingService');
const walletService = require('../services/walletService');
const { authenticateUser } = require('../middleware/authMiddleware');
const { requireFields, ensurePositiveInteger, ensureNonNegativeNumber } = require('../utils/validation');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/buy', authenticateUser, asyncHandler(async (req, res) => {
  const { stock_id: stockId, quantity, current_price: currentPrice } = req.body;
  requireFields(req.body, ['stock_id', 'quantity', 'current_price']);

  const parsedQuantity = ensurePositiveInteger(quantity, 'quantity');
  const parsedPrice = ensureNonNegativeNumber(currentPrice, 'current_price');

  const result = await tradingService.buyStock(req.user.id, stockId, parsedQuantity, parsedPrice);

  res.status(201).json({
    success: true,
    data: result
  });
}));

router.post('/sell', authenticateUser, asyncHandler(async (req, res) => {
  const { stock_id: stockId, quantity, current_price: currentPrice } = req.body;
  requireFields(req.body, ['stock_id', 'quantity', 'current_price']);

  const parsedQuantity = ensurePositiveInteger(quantity, 'quantity');
  const parsedPrice = ensureNonNegativeNumber(currentPrice, 'current_price');

  const result = await tradingService.sellStock(req.user.id, stockId, parsedQuantity, parsedPrice);

  res.status(201).json({
    success: true,
    data: result
  });
}));

router.get('/portfolio', authenticateUser, asyncHandler(async (req, res) => {
  const data = await tradingService.getPortfolio(req.user.id);
  res.json({
    success: true,
    data
  });
}));

router.get('/transactions', authenticateUser, asyncHandler(async (req, res) => {
  const data = await tradingService.getTransactionHistory(req.user.id);
  res.json({
    success: true,
    data
  });
}));

router.get('/wallet', authenticateUser, asyncHandler(async (req, res) => {
  const balance = await walletService.getBalance(req.user.id);
  res.json({
    success: true,
    data: {
      balance
    }
  });
}));

module.exports = router;

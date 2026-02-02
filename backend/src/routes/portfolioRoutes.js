const express = require('express');
const tradingService = require('../services/tradingService');
const { authenticateUser } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/summary', authenticateUser, asyncHandler(async (req, res) => {
  const summary = await tradingService.calculatePortfolioValue(req.user.id);
  res.json({
    success: true,
    data: summary
  });
}));

router.get('/holdings', authenticateUser, asyncHandler(async (req, res) => {
  const holdings = await tradingService.getPortfolio(req.user.id);
  res.json({
    success: true,
    data: holdings
  });
}));

router.get('/:stockId', authenticateUser, asyncHandler(async (req, res) => {
  const holdings = await tradingService.getPortfolio(req.user.id);
  const holding = holdings.find(item => item.stock_id === req.params.stockId);

  if (!holding) {
    return res.status(404).json({
      success: false,
      error: 'Holding not found'
    });
  }

  res.json({
    success: true,
    data: holding
  });
}));

module.exports = router;

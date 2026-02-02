const express = require('express');
const stockService = require('../services/stockService');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const stocks = await stockService.getAllStocks(true);
  res.json({
    success: true,
    data: stocks
  });
}));

router.get('/prices/bulk', authenticateUser, asyncHandler(async (req, res) => {
  const ids = (req.query.ids || '').split(',').filter(Boolean);
  if (!ids.length) {
    return res.status(400).json({
      success: false,
      error: 'ids query parameter is required'
    });
  }

  const { data, error } = await supabaseAdmin
    .from('stocks')
    .select('id, symbol, current_price, daily_change, daily_change_percent')
    .in('id', ids)
    .eq('is_enabled', true);

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  res.json({
    success: true,
    data
  });
}));

router.get('/:id', authenticateUser, asyncHandler(async (req, res) => {
  const stock = await stockService.getStockById(req.params.id);
  if (!stock.is_enabled) {
    return res.status(404).json({
      success: false,
      error: 'Stock not found'
    });
  }

  res.json({
    success: true,
    data: stock
  });
}));

module.exports = router;

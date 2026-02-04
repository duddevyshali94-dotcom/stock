const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/authMiddleware');
const { fetchQuotes } = require('../services/yahooFinanceService');

const router = express.Router();

router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('stocks')
      .select('id, symbol, name, is_active')
      .eq('is_active', true)
      .order('symbol');

    if (error) {
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/quotes', authenticateUser, async (req, res) => {
  try {
    const symbols = (req.query.symbols || '')
      .split(',')
      .map(symbol => symbol.trim().toUpperCase())
      .filter(Boolean);

    if (!symbols.length) {
      return res.status(400).json({ success: false, error: 'Symbols are required' });
    }

    const quotes = await fetchQuotes(symbols);
    res.json({ success: true, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

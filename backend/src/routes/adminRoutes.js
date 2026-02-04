const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/stocks', authenticateUser, checkRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('stocks')
      .select('id, symbol, name, is_active')
      .order('symbol');

    if (error) {
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/stocks', authenticateUser, checkRole('admin'), async (req, res) => {
  try {
    const { symbol, name } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }

    const payload = {
      symbol: symbol.toUpperCase(),
      name: name || symbol.toUpperCase(),
      is_active: true
    };

    const { data, error } = await supabaseAdmin
      .from('stocks')
      .insert(payload)
      .select('id, symbol, name, is_active')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/stocks/:id', authenticateUser, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('stocks')
      .update(updates)
      .eq('id', id)
      .select('id, symbol, name, is_active')
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/stocks/:id', authenticateUser, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('stocks')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/activity', authenticateUser, checkRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('id, user_id, symbol, side, quantity, price, total, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

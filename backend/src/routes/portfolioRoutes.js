const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { fetchQuotes } = require('../services/yahooFinanceService');

const router = express.Router();

async function ensureUserProfile(user) {
  const { data: existing, error } = await supabaseAdmin
    .from('users')
    .select('id, role, virtual_balance')
    .eq('id', user.id)
    .single();

  if (existing) {
    return existing;
  }

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  const { data: created, error: createError } = await supabaseAdmin
    .from('users')
    .insert({
      id: user.id,
      email: user.email,
      role: 'user',
      virtual_balance: 100000
    })
    .select('id, role, virtual_balance')
    .single();

  if (createError) {
    throw createError;
  }

  return created;
}

async function ensurePortfolio(userId) {
  const { data: portfolio } = await supabaseAdmin
    .from('portfolios')
    .select('id, user_id')
    .eq('user_id', userId)
    .single();

  if (portfolio) {
    return portfolio;
  }

  const { data: created, error } = await supabaseAdmin
    .from('portfolios')
    .insert({ user_id: userId })
    .select('id, user_id')
    .single();

  if (error) {
    throw error;
  }

  return created;
}

router.get('/me', authenticateUser, async (req, res) => {
  try {
    const profile = await ensureUserProfile(req.user);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', authenticateUser, async (req, res) => {
  try {
    const profile = await ensureUserProfile(req.user);
    const portfolio = await ensurePortfolio(req.user.id);

    const { data: holdings } = await supabaseAdmin
      .from('portfolio_holdings')
      .select('id, symbol, quantity, avg_price')
      .eq('portfolio_id', portfolio.id);

    const symbols = holdings.map(holding => holding.symbol);
    const quotes = symbols.length ? await fetchQuotes(symbols) : [];
    const quoteMap = new Map(quotes.map(quote => [quote.symbol, quote]));

    const enrichedHoldings = holdings.map(holding => {
      const quote = quoteMap.get(holding.symbol);
      const price = quote?.regularMarketPrice || 0;
      const value = price * holding.quantity;
      const cost = holding.avg_price * holding.quantity;
      const gainLoss = value - cost;

      return {
        ...holding,
        current_price: price,
        market_value: value,
        gain_loss: gainLoss
      };
    });

    const totalValue = enrichedHoldings.reduce((sum, holding) => sum + holding.market_value, 0);
    const totalCost = enrichedHoldings.reduce((sum, holding) => sum + (holding.avg_price * holding.quantity), 0);

    res.json({
      success: true,
      data: {
        balance: profile.virtual_balance,
        total_value: totalValue,
        total_cost: totalCost,
        total_gain_loss: totalValue - totalCost,
        holdings: enrichedHoldings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/buy', authenticateUser, checkRole('user'), async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Valid symbol and quantity are required' });
    }

    const profile = await ensureUserProfile(req.user);
    const portfolio = await ensurePortfolio(req.user.id);

    const { data: stockRecord } = await supabaseAdmin
      .from('stocks')
      .select('is_active')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (!stockRecord || !stockRecord.is_active) {
      return res.status(400).json({ success: false, error: 'Stock is not available for trading' });
    }

    const [quote] = await fetchQuotes([symbol.toUpperCase()]);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    const price = quote.regularMarketPrice;
    const totalCost = price * quantity;

    if (profile.virtual_balance < totalCost) {
      return res.status(400).json({ success: false, error: 'Insufficient virtual balance' });
    }

    const { data: existingHolding } = await supabaseAdmin
      .from('portfolio_holdings')
      .select('id, quantity, avg_price')
      .eq('portfolio_id', portfolio.id)
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (existingHolding) {
      const newQuantity = existingHolding.quantity + quantity;
      const newAvgPrice = ((existingHolding.avg_price * existingHolding.quantity) + totalCost) / newQuantity;

      await supabaseAdmin
        .from('portfolio_holdings')
        .update({ quantity: newQuantity, avg_price: newAvgPrice })
        .eq('id', existingHolding.id);
    } else {
      await supabaseAdmin
        .from('portfolio_holdings')
        .insert({
          portfolio_id: portfolio.id,
          symbol: symbol.toUpperCase(),
          quantity,
          avg_price: price
        });
    }

    await supabaseAdmin
      .from('users')
      .update({ virtual_balance: profile.virtual_balance - totalCost })
      .eq('id', profile.id);

    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: profile.id,
        symbol: symbol.toUpperCase(),
        side: 'BUY',
        quantity,
        price,
        total: totalCost
      });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sell', authenticateUser, checkRole('user'), async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Valid symbol and quantity are required' });
    }

    const profile = await ensureUserProfile(req.user);
    const portfolio = await ensurePortfolio(req.user.id);

    const { data: holding } = await supabaseAdmin
      .from('portfolio_holdings')
      .select('id, quantity, avg_price')
      .eq('portfolio_id', portfolio.id)
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ success: false, error: 'Insufficient holdings to sell' });
    }

    const [quote] = await fetchQuotes([symbol.toUpperCase()]);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    const price = quote.regularMarketPrice;
    const totalProceeds = price * quantity;
    const remainingQuantity = holding.quantity - quantity;

    if (remainingQuantity === 0) {
      await supabaseAdmin
        .from('portfolio_holdings')
        .delete()
        .eq('id', holding.id);
    } else {
      await supabaseAdmin
        .from('portfolio_holdings')
        .update({ quantity: remainingQuantity })
        .eq('id', holding.id);
    }

    await supabaseAdmin
      .from('users')
      .update({ virtual_balance: profile.virtual_balance + totalProceeds })
      .eq('id', profile.id);

    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: profile.id,
        symbol: symbol.toUpperCase(),
        side: 'SELL',
        quantity,
        price,
        total: totalProceeds
      });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

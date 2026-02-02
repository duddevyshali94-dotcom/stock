const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../utils/errors');
const walletService = require('./walletService');
const stockService = require('./stockService');

async function buyStock(userId, stockId, quantity, currentPrice) {
  const stock = await stockService.getStockById(stockId);
  if (!stock.is_enabled) {
    throw new AppError('Stock is not available for trading', 400);
  }

  const totalAmount = Number(currentPrice) * quantity;
  const balanceBefore = await walletService.getBalance(userId);

  if (balanceBefore < totalAmount) {
    throw new AppError('Insufficient balance', 400);
  }

  const balanceAfter = await walletService.deductBalance(userId, totalAmount);

  const { data: existingHolding, error: holdingError } = await supabaseAdmin
    .from('portfolio')
    .select('*')
    .eq('user_id', userId)
    .eq('stock_id', stockId)
    .maybeSingle();

  if (holdingError) {
    throw new AppError(holdingError.message, 500);
  }

  let updatedHolding = null;
  if (existingHolding) {
    const newQuantity = existingHolding.quantity + quantity;
    const totalInvested = Number(existingHolding.total_invested) + totalAmount;
    const averageBuyPrice = totalInvested / newQuantity;

    const { data: holding, error } = await supabaseAdmin
      .from('portfolio')
      .update({
        quantity: newQuantity,
        average_buy_price: averageBuyPrice,
        total_invested: totalInvested,
        current_value: newQuantity * Number(currentPrice),
        profit_loss: (newQuantity * Number(currentPrice)) - totalInvested,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingHolding.id)
      .select()
      .single();

    if (error) {
      throw new AppError(error.message, 400);
    }

    updatedHolding = holding;
  } else {
    const { data: holding, error } = await supabaseAdmin
      .from('portfolio')
      .insert({
        user_id: userId,
        stock_id: stockId,
        quantity,
        average_buy_price: currentPrice,
        total_invested: totalAmount,
        current_value: totalAmount,
        profit_loss: 0
      })
      .select()
      .single();

    if (error) {
      throw new AppError(error.message, 400);
    }

    updatedHolding = holding;
  }

  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      stock_id: stockId,
      transaction_type: 'BUY',
      quantity,
      price_per_share: currentPrice,
      total_amount: totalAmount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      transaction_date: new Date().toISOString()
    })
    .select()
    .single();

  if (transactionError) {
    throw new AppError(transactionError.message, 400);
  }

  return {
    holding: updatedHolding,
    transaction,
    balance: balanceAfter
  };
}

async function sellStock(userId, stockId, quantity, currentPrice) {
  const { data: existingHolding, error } = await supabaseAdmin
    .from('portfolio')
    .select('*')
    .eq('user_id', userId)
    .eq('stock_id', stockId)
    .single();

  if (error || !existingHolding) {
    throw new AppError('Holding not found', 404);
  }

  if (existingHolding.quantity < quantity) {
    throw new AppError('Insufficient shares to sell', 400);
  }

  const totalAmount = Number(currentPrice) * quantity;
  const balanceBefore = await walletService.getBalance(userId);
  const balanceAfter = await walletService.addBalance(userId, totalAmount);

  const remainingQuantity = existingHolding.quantity - quantity;

  let updatedHolding = null;
  if (remainingQuantity > 0) {
    const totalInvested = Number(existingHolding.average_buy_price) * remainingQuantity;
    const currentValue = remainingQuantity * Number(currentPrice);
    const profitLoss = currentValue - totalInvested;

    const { data: holding, error: updateError } = await supabaseAdmin
      .from('portfolio')
      .update({
        quantity: remainingQuantity,
        total_invested: totalInvested,
        current_value: currentValue,
        profit_loss: profitLoss,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingHolding.id)
      .select()
      .single();

    if (updateError) {
      throw new AppError(updateError.message, 400);
    }

    updatedHolding = holding;
  } else {
    const { error: deleteError } = await supabaseAdmin
      .from('portfolio')
      .delete()
      .eq('id', existingHolding.id);

    if (deleteError) {
      throw new AppError(deleteError.message, 400);
    }
  }

  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      stock_id: stockId,
      transaction_type: 'SELL',
      quantity,
      price_per_share: currentPrice,
      total_amount: totalAmount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      transaction_date: new Date().toISOString()
    })
    .select()
    .single();

  if (transactionError) {
    throw new AppError(transactionError.message, 400);
  }

  return {
    holding: updatedHolding,
    transaction,
    balance: balanceAfter
  };
}

async function getPortfolio(userId) {
  const { data, error } = await supabaseAdmin
    .from('portfolio')
    .select('*, stocks (symbol, company_name, current_price, daily_change, daily_change_percent)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

async function getTransactionHistory(userId) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*, stocks (symbol, company_name)')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

async function calculatePortfolioValue(userId, stockPrices = {}) {
  const holdings = await getPortfolio(userId);

  const summary = holdings.reduce((acc, holding) => {
    const currentPrice = stockPrices[holding.stock_id] || holding.stocks?.current_price || holding.current_value / holding.quantity;
    const currentValue = currentPrice * holding.quantity;
    acc.totalValue += currentValue;
    acc.totalInvested += Number(holding.total_invested);
    acc.totalProfitLoss += currentValue - Number(holding.total_invested);
    return acc;
  }, {
    totalValue: 0,
    totalInvested: 0,
    totalProfitLoss: 0
  });

  return {
    holdings,
    ...summary
  };
}

module.exports = {
  buyStock,
  sellStock,
  getPortfolio,
  getTransactionHistory,
  calculatePortfolioValue
};

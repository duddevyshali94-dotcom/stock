const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../utils/errors');

async function getBalance(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('virtual_balance')
    .eq('id', userId)
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return Number(data.virtual_balance || 0);
}

async function updateBalance(userId, amount) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      virtual_balance: amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('virtual_balance')
    .single();

  if (error) {
    throw new AppError(error.message, 400);
  }

  return Number(data.virtual_balance);
}

async function deductBalance(userId, amount) {
  const currentBalance = await getBalance(userId);
  if (currentBalance < amount) {
    throw new AppError('Insufficient balance', 400);
  }
  const newBalance = currentBalance - amount;
  await updateBalance(userId, newBalance);
  return newBalance;
}

async function addBalance(userId, amount) {
  const currentBalance = await getBalance(userId);
  const newBalance = currentBalance + amount;
  await updateBalance(userId, newBalance);
  return newBalance;
}

module.exports = {
  getBalance,
  updateBalance,
  deductBalance,
  addBalance
};

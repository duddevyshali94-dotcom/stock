const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../utils/errors');

async function listUsers() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, role, virtual_balance, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

async function getUserActivity(userId) {
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, role, virtual_balance, created_at')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError(userError?.message || 'User not found', 404);
  }

  const { data: transactions, error: txError } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (txError) {
    throw new AppError(txError.message, 500);
  }

  return {
    user,
    transactions
  };
}

async function getStatistics() {
  const [userResult, tradeResult, volumeResult] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('transactions').select('total_amount')
  ]);

  if (userResult.error) {
    throw new AppError(userResult.error.message, 500);
  }

  if (tradeResult.error) {
    throw new AppError(tradeResult.error.message, 500);
  }

  if (volumeResult.error) {
    throw new AppError(volumeResult.error.message, 500);
  }

  const volumeSum = (volumeResult.data || []).reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0);

  return {
    totalUsers: userResult.count || 0,
    totalTrades: tradeResult.count || 0,
    totalVolume: volumeSum
  };
}

module.exports = {
  listUsers,
  getUserActivity,
  getStatistics
};

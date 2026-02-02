const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../utils/errors');

async function getAllStocks(enabledOnly = false) {
  const query = supabaseAdmin.from('stocks').select('*').order('symbol');
  if (enabledOnly) {
    query.eq('is_enabled', true);
  }
  const { data, error } = await query;
  if (error) {
    throw new AppError(error.message, 500);
  }
  return data;
}

async function getStockById(id) {
  const { data, error } = await supabaseAdmin
    .from('stocks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new AppError(error.message, 404);
  }

  return data;
}

async function addStock(symbol, companyName, price, data = {}) {
  const { data: created, error } = await supabaseAdmin
    .from('stocks')
    .insert({
      symbol,
      company_name: companyName,
      current_price: price,
      daily_change: data.daily_change || 0,
      daily_change_percent: data.daily_change_percent || 0,
      is_enabled: data.is_enabled !== undefined ? data.is_enabled : true,
      added_by: data.added_by,
      last_updated: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 400);
  }

  return created;
}

async function updateStock(id, data) {
  const payload = {
    ...data,
    last_updated: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: updated, error } = await supabaseAdmin
    .from('stocks')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 400);
  }

  return updated;
}

async function deleteStock(id) {
  const { error } = await supabaseAdmin
    .from('stocks')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError(error.message, 400);
  }

  return true;
}

async function toggleStockStatus(id, enabled) {
  return updateStock(id, {
    is_enabled: enabled
  });
}

module.exports = {
  getAllStocks,
  getStockById,
  addStock,
  updateStock,
  deleteStock,
  toggleStockStatus
};

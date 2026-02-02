function handleSupabaseError(error, status = 500) {
  if (!error) {
    return null;
  }

  const err = new Error(error.message || 'Database error');
  err.status = status;
  return err;
}

module.exports = {
  handleSupabaseError
};

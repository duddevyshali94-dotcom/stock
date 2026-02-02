const { supabase, supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../utils/errors');

async function signUp(email, password, role = 'user') {
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role
    }
  });

  if (error) {
    throw new AppError(error.message, 400);
  }

  if (!authData.user) {
    throw new AppError('Unable to create user', 500);
  }

  const { data: existingProfile, error: profileFetchError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileFetchError) {
    throw new AppError(profileFetchError.message, 400);
  }

  if (!existingProfile) {
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role
      });

    if (profileError) {
      throw new AppError(profileError.message, 400);
    }
  }

  return authData;
}

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new AppError(error.message, 401);
  }

  return data;
}

async function logout(token) {
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    throw new AppError('Invalid or expired token', 401);
  }

  const { error } = await supabaseAdmin.auth.admin.signOut(user.id);
  if (error) {
    throw new AppError(error.message, 400);
  }
  return true;
}

async function refreshToken(refreshTokenValue) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshTokenValue
  });

  if (error) {
    throw new AppError(error.message, 401);
  }

  return data;
}

async function verifyToken(token) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new AppError('Invalid or expired token', 401);
  }
  return user;
}

async function getUserRole(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError('User profile not found', 404);
  }

  return data.role || 'user';
}

module.exports = {
  signUp,
  login,
  logout,
  refreshToken,
  verifyToken,
  getUserRole
};

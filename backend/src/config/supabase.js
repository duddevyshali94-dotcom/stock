const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase configuration in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
    
    if (error && error.code !== 'PGRST204' && error.code !== '42P01') {
      console.warn('Supabase connection warning:', error.message);
    } else {
      console.log('✓ Supabase connection established successfully');
    }
    
    return true;
  } catch (err) {
    console.error('✗ Supabase connection failed:', err.message);
    return false;
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection
};

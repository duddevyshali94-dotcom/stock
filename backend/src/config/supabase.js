const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Tests the connection to Supabase.
 * Since we might not have tables yet, we just try a simple query.
 */
const testConnection = async () => {
  try {
    // Attempting to list buckets or a similar metadata action that doesn't require a specific table
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
        console.warn('Supabase connection test warning:', error.message);
    } else {
        console.log('Supabase connection initialized successfully.');
    }
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
};

module.exports = {
  supabase,
  testConnection
};

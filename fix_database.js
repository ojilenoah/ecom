const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to vendor_profiles table...');
    
    // Add missing columns using raw SQL
    const { data, error } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE vendor_profiles 
        ADD COLUMN IF NOT EXISTS business_address TEXT,
        ADD COLUMN IF NOT EXISTS business_type TEXT;
      `
    });
    
    if (error) {
      console.error('Error adding columns:', error);
      // Try alternative approach using individual ALTER statements
      console.log('Trying alternative approach...');
      
      const { error: error1 } = await supabase.rpc('sql', {
        query: 'ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS business_address TEXT;'
      });
      
      const { error: error2 } = await supabase.rpc('sql', {
        query: 'ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS business_type TEXT;'
      });
      
      if (error1) console.log('business_address column may already exist');
      if (error2) console.log('business_type column may already exist');
    }
    
    console.log('Database update completed!');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

addMissingColumns();
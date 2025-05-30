import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingSettings() {
  console.log('Adding missing settings to the database...');
  
  const missingSettings = [
    // General Settings
    { key: 'allow_user_registration', value: 'true' },
    { key: 'require_vendor_approval', value: 'true' },
    
    // Payment Settings
    { key: 'platform_commission', value: '5' },
    { key: 'minimum_order_amount', value: '10.00' },
    
    // Email Settings
    { key: 'smtp_host', value: 'smtp.gmail.com' },
    { key: 'smtp_port', value: '587' },
    { key: 'from_email', value: 'noreply@softshop.com' },
    { key: 'smtp_username', value: '' },
    { key: 'smtp_password', value: '' },
    
    // Additional useful settings
    { key: 'max_upload_size', value: '10485760' }, // 10MB in bytes
    { key: 'default_currency', value: 'USD' },
    { key: 'tax_rate', value: '0' },
    { key: 'shipping_fee', value: '5.00' },
    { key: 'free_shipping_threshold', value: '50.00' }
  ];

  try {
    for (const setting of missingSettings) {
      const { error } = await supabase
        .from('settings')
        .upsert(setting, { onConflict: 'key' });

      if (error) {
        console.error(`Error adding setting ${setting.key}:`, error);
      } else {
        console.log(`✓ Added/updated setting: ${setting.key} = ${setting.value}`);
      }
    }

    console.log('\n✅ All missing settings have been added successfully!');
    
    // Verify by fetching all settings
    const { data: allSettings, error: fetchError } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (fetchError) {
      console.error('Error fetching settings:', fetchError);
    } else {
      console.log('\n📋 Current settings in database:');
      allSettings.forEach(setting => {
        console.log(`  ${setting.key}: ${setting.value}`);
      });
    }

  } catch (error) {
    console.error('Script execution error:', error);
  }
}

addMissingSettings();
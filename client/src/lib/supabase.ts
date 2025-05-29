import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database direct access for custom queries
export const db = {
  async query(sql: string, params: any[] = []) {
    const { data, error } = await supabase.rpc('query_db', {
      query: sql,
      params: params
    });
    
    if (error) throw error;
    return data;
  }
};

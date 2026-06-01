// Supabase configuration
const SUPABASE_URL = 'https://qmyrfdhveqqkhsynhzci.supabase.co' ;
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

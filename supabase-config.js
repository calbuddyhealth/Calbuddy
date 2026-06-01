// Supabase configuration
const SUPABASE_URL = 'https://qmyrfdhveqqkhsynhzci.supabase.co' ;
const SUPABASE_ANON_KEY = 'sb_publishable_Ol6fATXdLGiQiEKnImBwlA_Zq4544KA';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

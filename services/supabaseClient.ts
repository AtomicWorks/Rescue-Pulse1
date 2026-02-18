
import { createClient } from '@supabase/supabase-js';

// Supabase Project URL
const supabaseUrl = 'https://hzmctgllmfiybhkciamc.supabase.co'; 

// Using the provided Publishable Key
const supabaseKey = 'sb_publishable_ZtwTTqT_cizC8SPaVema9A_AjustAwr';

export const supabase = createClient(supabaseUrl, supabaseKey);

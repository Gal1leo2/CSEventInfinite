import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qchneutbsjulogcigvtn.supabase.co';  // Add your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaG5ldXRic2p1bG9nY2lndnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyOTg4NzAsImV4cCI6MjAzODg3NDg3MH0.2eqvCk6Nk0QQ1I8zoF2sve75gLESvTZlaTp8fhCpX_A';                 // Add your Supabase anon public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js';

const supabaseurl ='https://rorwpelcykogxwqyaopv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcndwZWxjeWtvZ3h3cXlhb3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNTE4ODcsImV4cCI6MjA1OTgyNzg4N30.abHEeNuVnCHUCshVD6fGnzdZzTIafuCuAYM2HPJGU3w';

export const supabase = createClient(supabaseurl, supabaseKey);
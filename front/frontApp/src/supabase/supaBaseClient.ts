import { createClient } from '@supabase/supabase-js';
import { environment } from '../environ/environ';

export const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);

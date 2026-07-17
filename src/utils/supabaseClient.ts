import { createClient } from '@supabase/supabase-js';

const sanitizeEnvVal = (val: any): string => {
  if (!val || typeof val !== 'string') return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://babpaxmleomvgnwikhoe.supabase.co';
const rawKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-bdEGEN9Gnd_yZJww4qMYQ_et6ZmLyo';

const SUPABASE_URL = sanitizeEnvVal(rawUrl);
const SUPABASE_ANON_KEY = sanitizeEnvVal(rawKey);

// Clean url by removing trailing rest/v1 paths if incorrectly supplied
const cleanUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').trim();

export const supabase = createClient(cleanUrl, SUPABASE_ANON_KEY);

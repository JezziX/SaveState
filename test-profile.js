import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://babpaxmleomvgnwikhoe.supabase.co', 'sb_publishable_-bdEGEN9Gnd_yZJww4qMYQ_et6ZmLyo');
async function run() {
  const { data, error } = await supabase.from('public_reviews').insert({ id: '00000000-0000-0000-0000-000000000000' }).select();
  console.log(error);
}
run();

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseCredentials = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseCredentials) {
  console.warn('Supabase credentials missing. Persistence disabled.');
}

const createNoopResult = async () => ({ data: null, error: null });

const createNoopClient = () =>
  ({
    from: () => ({
      select: createNoopResult,
      insert: createNoopResult,
      update: () => ({
        eq: createNoopResult,
      }),
      delete: () => ({
        neq: createNoopResult,
      }),
    }),
  }) as unknown as Pick<SupabaseClient, 'from'>;

export const supabase = hasSupabaseCredentials
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : createNoopClient();

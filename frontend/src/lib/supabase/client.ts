import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./types";

// Create a Supabase client for client-side usage
export function createClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if Supabase is configured
  if (!supabaseUrl || !supabaseAnonKey ||
      supabaseUrl.includes('your-project') ||
      supabaseAnonKey === 'eyJhbGc...') {
    console.warn(
      '⚠️ Supabase not configured. Using mock client for testing.\n' +
      'To enable Supabase:\n' +
      '1. Create a project at https://supabase.com\n' +
      '2. Update frontend/.env.local with your credentials'
    );

    // Return a mock client that won't crash
    return createSupabaseClient<Database>(
      'https://mock.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2siLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxOTI1MDM1MjAwfQ.mock'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}

// For backward compatibility (only create if in browser)
export const supabase = typeof window !== 'undefined' ? createClient() : null;

export function useSupabase() {
  return supabase;
}


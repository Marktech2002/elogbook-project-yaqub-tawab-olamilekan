import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if environment variables are available
const isMissingEnvVars = !supabaseUrl || !supabaseAnonKey;

if (isMissingEnvVars) {
  console.warn('Missing Supabase environment variables. Using development mode with mocked authentication.');
}

// Log Supabase connection details (without exposing full key)
console.log(`Connecting to Supabase at: ${supabaseUrl}`);
console.log(`Using key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'missing'}`);

// Create a client (explicitly persist session and auto refresh)
export const supabase = createClient<Database>(
  'https://vftjdgtyedqiuppivhkb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdGpkZ3R5ZWRxaXVwcGl2aGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjU2MjMsImV4cCI6MjA3MDQ0MTYyM30.WSU7vvGH0Vw0fqmh_QvVMmkKGpnFvC8g8-UECtxynl0',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

// Mock auth for development when env vars are missing
const mockAuthResponse = {
  data: {
    user: {
      id: 'mock-user-id',
      email: 'user@example.com',
      user_metadata: { name: 'Test User' },
    },
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      user: {
        id: 'mock-user-id',
        email: 'user@example.com',
        user_metadata: { name: 'Test User' },
      }
    }
  },
  error: null
};

// Auth helper functions
export const signIn = async (email: string, password: string) => {
  if (isMissingEnvVars) {
    console.log('DEV MODE: Mocking successful sign-in');
    return mockAuthResponse;
  }
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string) => {
  if (isMissingEnvVars) {
    console.log('DEV MODE: Mocking successful sign-up');
    return mockAuthResponse;
  }
  return supabase.auth.signUp({ email, password });
};

export const signOut = async () => {
  if (isMissingEnvVars) {
    console.log('DEV MODE: Mocking sign-out');
    return { error: null };
  }
  return supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  if (isMissingEnvVars) {
    console.log('DEV MODE: Returning mock user');
    return { data: { user: mockAuthResponse.data.user }, error: null };
  }
  return supabase.auth.getUser();
};

export const getSession = async () => {
  if (isMissingEnvVars) {
    console.log('DEV MODE: Returning mock session');
    return { data: { session: mockAuthResponse.data.session }, error: null };
  }
  return supabase.auth.getSession();
};

export default supabase; 
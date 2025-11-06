import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create client with fallback to prevent build failures
// Error will be thrown at runtime when client is actually used if vars are missing
let supabase = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
} else {
  // Create a mock client that throws helpful error on first use
  console.error('⚠️ Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  // Create a proxy that throws error on any method call
  supabase = new Proxy({}, {
    get() {
      throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Please set these in your environment variables.')
    }
  })
}

export { supabase }

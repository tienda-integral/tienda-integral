import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vivjsythvwsvpysdwgdp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdmpzeXRodndzdnB5c2R3Z2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1Nzc4NjgsImV4cCI6MjEwNTE1Mzg2OH0.TShYar96lBYDUGCKoiQgk5VMCNajER67077JBo3ZLew";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
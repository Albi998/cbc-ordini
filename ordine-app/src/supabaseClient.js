// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yzanckxqkhjxnfpgdyhz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW5ja3hxa2hqeG5mcGdkeWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Njc2MjEsImV4cCI6MjA2MjA0MzYyMX0.ojfIIybs11SlOTOyhHwzkTDgx-P_NI3uSNxIjuKqBnk";

export const supabase = createClient(supabaseUrl, supabaseKey);

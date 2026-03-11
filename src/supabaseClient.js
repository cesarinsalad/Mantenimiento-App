import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Esto te dirá en la consola del navegador si las llaves llegaron bien
console.log("Conectando a:", supabaseUrl ? "URL encontrada" : "URL NO ENCONTRADA");

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
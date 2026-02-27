import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://bzxzmaeipsvxuhbtioym.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eHptYWVpcHN2eHVoYnRpb3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDgzMTIsImV4cCI6MjA4NzcyNDMxMn0.xk3DXtKgnIMK1vTc4TW-Eba5s1781smYTMLCerGAGR4',
  { auth: { persistSession: false } }
);

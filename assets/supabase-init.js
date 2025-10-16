/* /assets/supabase-init.js  */
(() => {
  // 🔧 SUBSTITUA APENAS A CHAVE ABAIXO PELA SUA ANON KEY DO SUPABASE
  // URL do seu projeto (você já me passou): 
  const SUPABASE_URL = 'https://gqwgyresqsuciikmymkd.supabase.co';
  // Sua ANON KEY (pública) — copie do Supabase (Project Settings → API → anon public):
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2d5cmVzcXN1Y2lpa215bWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDQ5NTIsImV4cCI6MjA3NTkyMDk1Mn0.e9EfNqXvrujJm9jmG5SCJ2EShoq0PAbxTuv1kvs0FnQ';

  if (!window.supabase) {
    console.error('Biblioteca supabase-js não carregou. Adicione <script src="https://unpkg.com/@supabase/supabase-js@2"></script> antes deste arquivo.');
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('COLE_')) {
    console.error('SUPABASE_URL/ANON_KEY ausentes. Edite /assets/supabase-init.js com seus valores.');
  }

  // Cliente global
  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  // Helper usado nas páginas para garantir sessão pronta
  window.waitForSupabaseSession = async function waitForSupabaseSession(timeoutMs = 4000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data: { session } } = await sb.auth.getSession();
      if (session || session === null) return; // null = sem login; ok também.
      await new Promise(r => setTimeout(r, 150));
    }
  };
})();

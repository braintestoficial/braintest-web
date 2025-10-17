// Inicialização assíncrona e segura do Supabase
(async () => {
  // Aguarda o carregamento da lib Supabase
  const waitForSupabase = () =>
    new Promise((resolve) => {
      const check = () => {
        if (window.supabase) resolve();
        else setTimeout(check, 100);
      };
      check();
    });

  await waitForSupabase();

  // Cria cliente global
  const SUPABASE_URL = "https://gqwgyresqsuciikmymkd.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2d5cmVzcXN1Y2lpa215bWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDQ5NTIsImV4cCI6MjA3NTkyMDk1Mn0.e9EfNqXvrujJm9jmG5SCJ2EShoq0PAbxTuv1kvs0FnQ";

  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  // Aguarda a sessão e notifica app.js
  const { data: { session } } = await sb.auth.getSession();
  console.log("✅ Supabase inicializado — sessão atual:", session?.user?.email || "nenhuma");

  // Dispara evento global para o app iniciar
  window.dispatchEvent(new Event("braintest-ready"));
})();

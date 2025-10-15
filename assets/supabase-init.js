;(function(){
  // <<< TROQUE A SUA ANON KEY AQUI >>>
  const SUPABASE_URL = "https://gqwgyresqsuciikmymkd.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2d5cmVzcXN1Y2lpa215bWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDQ5NTIsImV4cCI6MjA3NTkyMDk1Mn0.e9EfNqXvrujJm9jmG5SCJ2EShoq0PAbxTuv1kvs0FnQ";

  // Cliente único, com sessão persistente
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  // Expor globalmente
  window.sb = client;

  // Espera restauração da sessão do localStorage
  window.waitForSupabaseSession = async function(tries = 20){
    for(let i=0;i<tries;i++){
      const { data:{ session } } = await client.auth.getSession();
      if(session) return session;
      await new Promise(r => setTimeout(r,100));
    }
    return (await client.auth.getSession()).data.session; // pode ser null
  };
})();

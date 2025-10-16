// ================================================
// Inicialização oficial do Supabase (Braintest)
// ================================================
// Este arquivo precisa existir em /assets/supabase-init.js
// e ser incluído em todas as páginas HTML do projeto.
//
// Ele cria uma instância global `sb` que é usada
// por todo o site para comunicação com o banco.
//
// ================================================

// ⚙️ Substitua pelos dados reais do seu projeto Supabase
const SUPABASE_URL = "https://gqwgyresqsuciikmymkd.supabase.co";   // ✅ URL do seu projeto
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2d5cmVzcXN1Y2lpa215bWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDQ5NTIsImV4cCI6MjA3NTkyMDk1Mn0.e9EfNqXvrujJm9jmG5SCJ2EShoq0PAbxTuv1kvs0FnQ";              // ✅ Cole aqui sua anon key completa

// ✅ Criação do cliente Supabase
window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,         // mantém o login entre páginas
    autoRefreshToken: true,       // renova token automaticamente
    detectSessionInUrl: true      // permite login por callback
  },
  global: {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  }
});

// Teste rápido (opcional — log no console se estiver tudo certo)
sb.from("test_questions")
  .select("id")
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error("⚠️ Erro Supabase init:", error);
    } else {
      console.log("✅ Supabase conectado com sucesso!");
    }
  });

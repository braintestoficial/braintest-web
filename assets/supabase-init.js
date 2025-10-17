// Inicialização central do Supabase
// ================================
const sb = window.sb = supabase.createClient(
  "https://gqwgyresqsuciikmymkd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2d5cmVzcXN1Y2lpa215bWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDQ5NTIsImV4cCI6MjA3NTkyMDk1Mn0.e9EfNqXvrujJm9jmG5SCJ2EShoq0PAbxTuv1kvs0FnQ"
);

// Dispara o evento quando o Supabase estiver pronto
window.dispatchEvent(new Event("braintest-ready"));

// Corrige loop de logout — só dispara evento se houver sessão
sb.auth.onAuthStateChange((_event, session) => {
  if (!session) {
    console.log("Usuário desconectado.");
  } else {
    console.log("Sessão ativa detectada.");
    window.dispatchEvent(new Event("braintest-ready"));
  }
});

// Utilitário opcional: aguarda sessão antes de executar ações dependentes
async function waitForSupabaseSession() {
  for (let i = 0; i < 30; i++) {
    const { data: { session } } = await sb.auth.getSession();
    if (session) return session;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error("Sessão não encontrada após tentativa.");
}

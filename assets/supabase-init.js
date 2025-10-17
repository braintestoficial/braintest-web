// =====================================
// BrainTest - Supabase Init (versão estável)
// =====================================
const sb = window.sb = supabase.createClient(
  "https://gqwgyresqsuciikmymkd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2d5cmVzcXN1Y2lpa215bWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDQ5NTIsImV4cCI6MjA3NTkyMDk1Mn0.e9EfNqXvrujJm9jmG5SCJ2EShoq0PAbxTuv1kvs0FnQ"
);

// dispara evento quando o Supabase está pronto
window.dispatchEvent(new Event("braintest-ready"));

// garante que a sessão persiste mesmo após "voltar página"
sb.auth.onAuthStateChange((_event, session) => {
  if (session) {
    window.dispatchEvent(new Event("braintest-ready"));
  } else {
    console.log("Usuário desconectado.");
  }
});

// aguarda sessão antes de executar qualquer lógica dependente
async function waitForSupabaseSession(maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    const { data: { session } } = await sb.auth.getSession();
    if (session) return session;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error("Sessão não encontrada após múltiplas tentativas.");
}

// ========================================================
// /assets/supabase-init.js — Inicialização global segura
// ========================================================

const SUPABASE_URL = "https://gqwgyresqsuciikmymkd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2d5cmVzcXN1Y2lpa215bWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDQ5NTIsImV4cCI6MjA3NTkyMDk1Mn0.e9EfNqXvrujJm9jmG5SCJ2EShoq0PAbxTuv1kvs0FnQ";

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  global: {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  }
});

// 🔄 Aguarda sessão válida
window.waitForSupabaseSession = async function (maxWait = 6000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const { data } = await sb.auth.getSession();
    if (data.session) return data.session;
    await new Promise(r => setTimeout(r, 300));
  }
  console.warn("⚠️ Nenhuma sessão Supabase ativa dentro do tempo limite.");
  return null;
};

// 🔐 Garante login obrigatório
window.requireAuth = async function (redirect) {
  const session = await waitForSupabaseSession();
  if (!session || !session.user) {
    location.href = "/login.html";
    return null;
  }
  return session.user;
};

// 👤 Atualiza barra superior
window.ensureTopbarUser = async function () {
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const { data: w } = await sb.from("wallets").select("balance").eq("user_id", user.id).maybeSingle();
    const saldo = w?.balance || 0;
    const userChip = document.getElementById("userChip");
    const saldoTop = document.getElementById("saldoTop");
    if (userChip) userChip.textContent = user.email;
    if (saldoTop) saldoTop.textContent = saldo;
  }
};

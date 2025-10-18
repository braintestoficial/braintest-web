// ================================================
// BrainTest - Supabase Init (versão estável 1.0)
// ================================================

// ✅ Substitua pelos seus dados reais do Supabase
const SUPABASE_URL = "https://gqwgyresqsuciikmymkd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2d5cmVzcXN1Y2lpa215bWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDQ5NTIsImV4cCI6MjA3NTkyMDk1Mn0.e9EfNqXvrujJm9jmG5SCJ2EShoq0PAbxTuv1kvs0FnQ";

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// ================================================
// Sessão global do usuário
// ================================================
async function getCurrentUser() {
  const { data, error } = await sb.auth.getSession();
  if (error) {
    console.error("Erro ao obter sessão:", error.message);
    return null;
  }
  return data?.session?.user || null;
}

// ================================================
// Função segura para carregar perguntas
// ================================================
async function getQuestions(testKey, limit = 15) {
  try {
    const { data, error } = await sb.rpc("get_random_questions", {
      test_key: testKey,
      q_limit: limit
    });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Erro ao carregar perguntas:", err.message);
    return [];
  }
}

// ================================================
// Atualização de saldo e perfil
// ================================================
async function getWallet(userId) {
  if (!userId) return null;
  const { data, error } = await sb.from("wallets").select("balance").eq("user_id", userId).single();
  if (error) console.warn("Carteira não encontrada:", error.message);
  return data;
}

async function updateWalletDisplay() {
  const user = await getCurrentUser();
  if (!user) return;
  const wallet = await getWallet(user.id);
  const walletEl = document.getElementById("walletBalance");
  if (walletEl) walletEl.textContent = wallet ? `${wallet.balance} 🪙` : "0 🪙";
}

// ================================================
// Observador de sessão (mantém login ativo)
// ================================================
sb.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_OUT") {
    console.log("Usuário desconectado");
    window.location.href = "login.html";
  }
  if (event === "SIGNED_IN" && window.location.pathname.includes("login")) {
    window.location.href = "index.html";
  }
});

// ================================================
// Helper: Logout rápido
// ================================================
async function logout() {
  await sb.auth.signOut();
  window.location.href = "login.html";
}

// ================================================
// Disponibiliza funções globalmente
// ================================================
window.getCurrentUser = getCurrentUser;
window.getQuestions = getQuestions;
window.updateWalletDisplay = updateWalletDisplay;
window.logout = logout;

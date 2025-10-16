// ========================================================
// /assets/app.js — Controle da UI e navegação
// ========================================================

(function () {
  // Marca link ativo na barra lateral
  const path = location.pathname.replace(/\/+$/, "");
  document.querySelectorAll("[data-current]").forEach((el) => {
    const href = el.getAttribute("href") || "";
    try {
      const u = new URL(href, location.origin);
      if (u.pathname.replace(/\/+$/, "") === path) el.classList.add("active");
    } catch {}
  });

  // Atualiza topo com email/saldo
  window.setTopUser = (email, saldoBC) => {
    const chip = document.getElementById("userChip");
    const saldo = document.getElementById("saldoTop");
    if (chip) chip.textContent = email || "Usuário";
    if (saldo) saldo.textContent = (saldoBC ?? 0).toFixed(0);
  };

  // Força login
  window.requireAuth = async (nextPath) => {
    const session = await waitForSupabaseSession();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      location.href = "/login.html?next=" + encodeURIComponent(nextPath || location.pathname);
      return null;
    }
    return user;
  };

  // Garante exibição correta
  window.ensureTopbarUser = async () => {
    const session = await waitForSupabaseSession();
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: w } = await sb.from("wallets").select("balance").eq("user_id", user.id).maybeSingle();
      setTopUser(user.email, w?.balance || 0);
    }
    return user;
  };
})();

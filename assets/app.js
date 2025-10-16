// /assets/app.js
(function(){
  // Marca link ativo no menu lateral
  const path = location.pathname.replace(/\/+$/,'');
  document.querySelectorAll('[data-current]').forEach(el=>{
    const href = el.getAttribute('href') || '';
    if(!href) return;
    try{
      const u = new URL(href, location.origin);
      if(u.pathname.replace(/\/+$/,'') === path){ el.classList.add('active'); }
    }catch(_) {}
  });

  // Exibe usuário/saldo no topo
  window.setTopUser = function(email, saldoBC){
    const chip = document.getElementById('userChip'); if(chip) chip.textContent = email || 'Usuário';
    const saldo = document.getElementById('saldoTop'); if(saldo) saldo.textContent = (saldoBC ?? 0).toFixed(2);
  };

  // Força login: se não tiver sessão, manda para perfil com ?next=...
  window.requireAuth = async function(nextPath){
    await waitForSupabaseSession();
    const { data:{ user } } = await sb.auth.getUser();
    if(!user){
      const next = encodeURIComponent(nextPath || location.pathname + location.search);
      location.href = '/perfil.html?next='+next;
      return null;
    }
    return user;
  };

  // Garante email/saldo no topo (para páginas que precisam carregar o chip e saldo)
  window.ensureTopbarUser = async function(){
    await waitForSupabaseSession();
    const { data:{ user } } = await sb.auth.getUser();
    if(user){
      const { data:w } = await sb.from('wallets').select('balance_cents').eq('user_id', user.id).single();
      setTopUser(user.email || 'Usuário', ((w?.balance_cents||0)/100));
    }else{
      const chip = document.getElementById('userChip'); if(chip) chip.textContent = 'Visitante';
    }
    return user;
  };
})();

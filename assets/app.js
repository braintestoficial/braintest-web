// /assets/app.js
(function(){
  // marca links ativos (sidebar e bottom)
  const path = location.pathname.replace(/\/+$/,'');
  document.querySelectorAll('[data-current]').forEach(el=>{
    const href = el.getAttribute('href') || '';
    if(!href) return;
    try{
      const u = new URL(href, location.origin);
      if(u.pathname.replace(/\/+$/,'') === path){ el.classList.add('active'); }
    }catch(_) {}
  });

  // helper para atualizar chip e saldo no topo
  window.setTopUser = function(email, saldoBC){
    const chip = document.getElementById('userChip');
    if(chip) chip.textContent = email || 'Usuário';
    const saldo = document.getElementById('saldoTop');
    if(saldo) saldo.textContent = (saldoBC ?? 0).toFixed(2);
  };
})();

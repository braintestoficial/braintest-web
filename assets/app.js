// /assets/app.js
(function(){
  // marca link ativo da sidebar/bottom bar conforme a página
  const path = location.pathname.replace(/\/+$/,'');
  document.querySelectorAll('[data-current]').forEach(el=>{
    const href = el.getAttribute('href') || '';
    if(!href) return;
    try{
      const u = new URL(href, location.origin);
      if(u.pathname.replace(/\/+$/,'') === path){ el.classList.add('active'); }
    }catch(_) {}
  });

  // helper simples: copiar saldo para topo em páginas que já consultam a carteira
  window.setTopUser = function(email, saldoBC){
    const chip = document.getElementById('userChip');
    if(chip) chip.innerHTML = `<span>${email||'Usuário'}</span>`;
    const saldo = document.getElementById('saldoTop');
    if(saldo) saldo.textContent = (saldoBC ?? 0).toFixed(2);
  };
})();

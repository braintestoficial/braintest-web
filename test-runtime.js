<script>
/**
 * test-runtime.js (hotfix debug)
 * - Mostra mensagens detalhadas (login, RPC, pool vazio, erros reais).
 * - Faz um "probe" no pool quando a RPC retorna vazio.
 * Uso: igual ao anterior (createTestEngine(...)).
 */
function createTestEngine(cfg){
  const state = { questions: [], answers: {} };

  function setStatus(msg, type='info'){
    if(!cfg.containerStatus) return;
    cfg.containerStatus.innerHTML = `<div style="
      padding:.75rem;border:1px solid ${type==='error'?'#f5b5ab':'#e9ecf2'};
      background:${type==='error'?'#fff7f5':'#f9fbff'};border-radius:12px;
      color:#303540;font-size:.92rem">${msg}</div>`;
  }

  function renderEmpty(){
    const f = cfg.containerForm;
    f.innerHTML = `<p style="color:#6b7380">Sem perguntas para exibir.</p>`;
  }

  async function load(){
    try{
      setStatus('Carregando perguntas…');

      // 1) Sessão?
      const { data:{ user }, error:errUser } = await sb.auth.getUser();
      if(errUser) throw errUser;
      if(!user){
        setStatus('Você precisa entrar para realizar esta triagem. <a href="/perfil.html">Entrar com Google</a>', 'error');
        renderEmpty();
        return;
      }

      // 2) RPC
      const { data, error } = await sb.rpc('get_random_questions', { p_test: cfg.testKey, p_qty: cfg.qty || 15 });
      if(error){
        console.error('RPC get_random_questions error', error);
        setStatus(`Erro ao carregar perguntas (RPC): <code style="font-family:monospace">${error.message||'desconhecido'}</code>`, 'error');
        renderEmpty();
        return;
      }

      // 3) Vazio? Faz "probe" no pool bruto para diagnosticar.
      if(!data || data.length === 0){
        // probe 1: existe pelo menos 1 pergunta ativa desse teste?
        const { data:probeQ, error:probeErr } = await sb
          .from('test_questions')
          .select('id', { count:'exact', head:true })
          .eq('test_key', cfg.testKey)
          .eq('active', true);

        if(probeErr){
          console.error('Probe test_questions error', probeErr);
          setStatus(`Sem perguntas. Erro ao verificar pool: <code style="font-family:monospace">${probeErr.message||'desconhecido'}</code>`, 'error');
          renderEmpty();
          return;
        }

        if((probeQ === null) || (probeQ?.length === 0)){
          // count não vem no head:true, então cuidamos pela ausência; mensagem amigável:
          setStatus('Não encontramos perguntas ativas para este teste. Verifique se o pool foi criado no Supabase (tabela <b>test_questions</b>) e se há opções em <b>test_question_options</b>.', 'error');
        }else{
          setStatus('Existe pool, mas a função retornou vazio. Confirme se a RPC <b>get_random_questions</b> está criada e com <i>grant execute to authenticated</i>.', 'error');
        }
        renderEmpty();
        return;
      }

      state.questions = data;
      setStatus(''); // limpa
      renderForm();
    }catch(e){
      console.error('engine.load fatal error', e);
      setStatus(`Falha inesperada ao carregar. <code style="font-family:monospace">${e.message||e.toString()}</code>`, 'error');
      renderEmpty();
    }
  }

  function renderForm(){
    const f = cfg.containerForm;
    f.innerHTML = '';

    state.questions.forEach((q, idx)=>{
      const block = document.createElement('div');
      block.className = 'q';
      block.style.margin = '.8rem 0';

      const label = document.createElement('label');
      label.style.fontWeight = '600';
      label.style.display = 'block';
      label.style.marginBottom = '.35rem';
      label.textContent = `${idx+1}. ${q.prompt}`;
      block.appendChild(label);

      (q.options || []).forEach(opt=>{
        const wrap = document.createElement('div');
        wrap.className = 'opt';
        wrap.style.margin = '.25rem 0';
        const id = `q${q.question_id}_${opt.id}`;
        wrap.innerHTML = `
          <label>
            <input type="radio" name="q_${q.question_id}" id="${id}" required
                   data-qid="${q.question_id}"
                   data-oid="${opt.id}"
                   data-val="${opt.value ?? ''}"
                   data-correct="${opt.is_correct ? '1':'0'}">
            ${opt.label}
          </label>`;
        block.appendChild(wrap);
      });

      f.appendChild(block);
    });

    if(!f.querySelector('button[type=submit]')){
      const btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'btn';
      btn.textContent = 'Ver resultado gratuito';
      btn.style.marginTop = '.8rem';
      f.appendChild(btn);
    }

    f.onsubmit = (e)=>{
      e.preventDefault();
      computeAndRender();
    };
  }

  function computeAndRender(){
    state.answers = {};
    state.questions.forEach(q=>{
      const sel = document.querySelector(`input[name="q_${q.question_id}"]:checked`);
      if(sel){
        state.answers[q.question_id] = {
          option_id: Number(sel.dataset.oid),
          value: sel.dataset.val === '' ? null : Number(sel.dataset.val),
          is_correct: sel.dataset.correct === '1'
        };
      }
    });

    let scoreLikert = 0, countLikert = 0;
    let scoreQI = 0, countQI = 0;

    state.questions.forEach(q=>{
      const a = state.answers[q.question_id];
      if(!a) return;
      if(q.kind === 'likert'){
        if(a.value !== null && !isNaN(a.value)){ scoreLikert += a.value; countLikert++; }
      }else if(q.kind === 'single'){
        if(a.is_correct) scoreQI++;
        countQI++;
      }
    });

    cfg.onFreeResult?.({scoreLikert, countLikert, scoreQI, countQI});
  }

  return { load, computeAndRender, state };
}

window.createTestEngine = createTestEngine;
</script>

<script>
/**
 * Motor para carregar perguntas aleatórias do Supabase e renderizar o formulário.
 * Mostra estados de "carregando", "login exigido", "sem perguntas" e erros.
 *
 * Requer:
 *  - window.sb (do /assets/supabase-init.js)
 *  - containerForm: <form> onde as perguntas serão montadas
 *  - containerResult: div para o resultado gratuito
 *  - containerStatus (opcional): div para mensagens de status
 */
function createTestEngine(cfg){
  const state = {
    questions: [],
    answers: {} // question_id -> { option_id, value(int|null), is_correct(bool) }
  };

  function setStatus(msg, type='info'){
    if(!cfg.containerStatus) return;
    cfg.containerStatus.innerHTML = `<div style="
      padding:.75rem;border:1px solid ${type==='error'?'#f5b5ab':'#e9ecf2'};
      background:${type==='error'?'#fff7f5':'#f9fbff'};border-radius:12px;
      color:#303540;font-size:.92rem">${msg}</div>`;
  }

  async function load(){
    try{
      setStatus('Carregando perguntas…', 'info');

      const { data:{ user }, error:errUser } = await sb.auth.getUser();
      if(errUser) throw errUser;

      if(!user){
        setStatus('Você precisa entrar para realizar esta triagem. <a href="/perfil.html">Entrar com Google</a>', 'error');
        renderEmpty();
        return;
      }

      const { data, error } = await sb.rpc('get_random_questions', {
        p_test: cfg.testKey,
        p_qty: cfg.qty || 15
      });

      if(error) throw error;

      if(!data || data.length === 0){
        setStatus('Não encontramos perguntas ativas para este teste. Tente novamente em alguns minutos.', 'error');
        renderEmpty();
        return;
      }

      state.questions = data;
      setStatus(''); // limpa
      renderForm();
    }catch(e){
      console.error('engine.load error', e);
      setStatus('Não foi possível carregar as perguntas agora. Tente recarregar a página.', 'error');
      renderEmpty();
    }
  }

  function renderEmpty(){
    const f = cfg.containerForm;
    f.innerHTML = `<p style="color:#6b7380">Sem perguntas para exibir.</p>`;
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
    // coleta respostas
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

    // pontuação
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

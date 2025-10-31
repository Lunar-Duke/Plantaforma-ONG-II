document.addEventListener('DOMContentLoaded', () => {
  // Atualiza anos nos rodapés
  document.getElementById('year')?.textContent = new Date().getFullYear();
  document.getElementById('year2')?.textContent = new Date().getFullYear();
  document.getElementById('year3')?.textContent = new Date().getFullYear();

  /* ------------------ MOBILE MENU (hamburger) ------------------ */
  function bindHamburger(btnId, closeId) {
    const btn = document.getElementById(btnId);
    const mobile = document.getElementById('mobileMenu');
    const closeBtn = document.getElementById(closeId);
    if (!btn || !mobile) return;
    btn.addEventListener('click', () => {
      mobile.classList.add('open');
      mobile.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
    });
    closeBtn?.addEventListener('click', () => {
      mobile.classList.remove('open');
      mobile.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
    });
  }
  bindHamburger('btn-hamburger', 'btn-close');
  bindHamburger('btn-hamburger-2', 'btn-close-2');
  bindHamburger('btn-hamburger-3', 'btn-close-3');

  /* ------------------ INPUT MASKS E RESTRIÇÕES ------------------ */
  const onlyDigits = s => (s || '').replace(/\D/g, '');

  // Masking helpers
  const maskCPF = v => {
    v = onlyDigits(v).slice(0,11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return v;
  };
  const maskCEP = v => {
    v = onlyDigits(v).slice(0,8);
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    return v;
  };
  const maskTel = v => {
    v = onlyDigits(v).slice(0,11);
    v = v.replace(/^(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    return v;
  };

  function bindNumericInput(elem, maskFn) {
    if (!elem) return;
    elem.addEventListener('input', e => {
      const pos = e.target.selectionStart;
      const oldLen = e.target.value.length;
      e.target.value = maskFn(e.target.value);
      const newLen = e.target.value.length;
      const diff = newLen - oldLen;
      e.target.setSelectionRange(pos + Math.max(0,diff), pos + Math.max(0,diff));
    });
    elem.addEventListener('keydown', e => {
      const allowed = ['Backspace','ArrowLeft','ArrowRight','Delete','Tab','Home','End'];
      if (allowed.includes(e.key)) return;
      if ((e.ctrlKey || e.metaKey) && ['a','c','v','x','A','C','V','X'].includes(e.key)) return;
      if (/^[0-9]$/.test(e.key)) return;
      e.preventDefault();
    });
    elem.addEventListener('paste', e => {
      const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
      const digits = onlyDigits(pasted);
      if (!digits) { e.preventDefault(); return; }
      e.preventDefault();
      elem.value = maskFn(digits);
      elem.dispatchEvent(new Event('input'));
    });
  }

  bindNumericInput(document.getElementById('cpf'), maskCPF);
  bindNumericInput(document.getElementById('cep'), maskCEP);
  bindNumericInput(document.getElementById('telefone'), maskTel);

  // set max date for nascimento to today
  const nasc = document.getElementById('nascimento');
  if (nasc) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const dd = String(today.getDate()).padStart(2,'0');
    nasc.max = `${yyyy}-${mm}-${dd}`;
  }

  /* ------------------ ESTADOS E CIDADES (API IBGE) ------------------ */
  const estadoSelect = document.getElementById('estado');
  const cidadeSelect = document.getElementById('cidade');

  const estados = [
    { uf: 'AC', name: 'Acre' },{ uf: 'AL', name: 'Alagoas' },{ uf: 'AP', name: 'Amapá' },{ uf: 'AM', name: 'Amazonas' },
    { uf: 'BA', name: 'Bahia' },{ uf: 'CE', name: 'Ceará' },{ uf: 'DF', name: 'Distrito Federal' },{ uf: 'ES', name: 'Espírito Santo' },
    { uf: 'GO', name: 'Goiás' },{ uf: 'MA', name: 'Maranhão' },{ uf: 'MT', name: 'Mato Grosso' },{ uf: 'MS', name: 'Mato Grosso do Sul' },
    { uf: 'MG', name: 'Minas Gerais' },{ uf: 'PA', name: 'Pará' },{ uf: 'PB', name: 'Paraíba' },{ uf: 'PR', name: 'Paraná' },
    { uf: 'PE', name: 'Pernambuco' },{ uf: 'PI', name: 'Piauí' },{ uf: 'RJ', name: 'Rio de Janeiro' },{ uf: 'RN', name: 'Rio Grande do Norte' },
    { uf: 'RS', name: 'Rio Grande do Sul' },{ uf: 'RO', name: 'Rondônia' },{ uf: 'RR', name: 'Roraima' },{ uf: 'SC', name: 'Santa Catarina' },
    { uf: 'SP', name: 'São Paulo' },{ uf: 'SE', name: 'Sergipe' },{ uf: 'TO', name: 'Tocantins' }
  ];

  if (estadoSelect) {
    estadoSelect.innerHTML = '<option value="">Selecione o estado</option>';
    estados.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.uf;
      opt.textContent = `${s.name} (${s.uf})`;
      estadoSelect.appendChild(opt);
    });

    if (cidadeSelect) {
      estadoSelect.addEventListener('change', async (e) => {
        const uf = e.target.value;
        cidadeSelect.innerHTML = '<option value="">Carregando cidades...</option>';
        cidadeSelect.disabled = true;
        if (!uf) {
          cidadeSelect.innerHTML = '<option value="">Selecione o estado primeiro</option>';
          cidadeSelect.disabled = true;
          return;
        }
        try {
          const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
          if (!resp.ok) throw new Error('IBGE error');
          const data = await resp.json();
          cidadeSelect.innerHTML = '<option value="">Selecione a cidade</option>';
          data.forEach(item => {
            const o = document.createElement('option');
            o.value = item.nome;
            o.textContent = item.nome;
            cidadeSelect.appendChild(o);
          });
          cidadeSelect.disabled = false;
        } catch (err) {
          console.error('Erro IBGE:', err);
          cidadeSelect.innerHTML = '<option value="">Não foi possível carregar cidades</option>';
          cidadeSelect.disabled = true;
        }
      });

      cidadeSelect.innerHTML = '<option value="">Selecione o estado primeiro</option>';
      cidadeSelect.disabled = true;
    }
  }

  /* ------------------ FORM SUBMIT (validação visual + limpar máscaras) ------------------ */
  const form = document.getElementById('cadastroForm');
  if (form) {
    form.addEventListener('submit', e => {
      if (!form.checkValidity()) {
        e.preventDefault();
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.classList.add('error');
          // show small message if not present
          if (!firstInvalid.nextElementSibling || !firstInvalid.nextElementSibling.classList || !firstInvalid.nextElementSibling.classList.contains('error')) {
            const msg = document.createElement('small');
            msg.className = 'error';
            msg.textContent = 'Por favor, corrija este campo.';
            firstInvalid.parentNode.appendChild(msg);
          }
        }
        return;
      }

      e.preventDefault(); // demo: não envia de verdade
      const cpfRaw = document.getElementById('cpf')?.value.replace(/\D/g,'') ?? '';
      const cepRaw = document.getElementById('cep')?.value.replace(/\D/g,'') ?? '';
      console.log('Enviar (simulado):', {
        nome: document.getElementById('nome')?.value,
        email: document.getElementById('email')?.value,
        cpf: cpfRaw,
        cep: cepRaw,
        estado: document.getElementById('estado')?.value,
        cidade: document.getElementById('cidade')?.value
      });
      // toast feedback
      showToast('Cadastro válido! (envio simulado)');
      // reset opcional: form.reset();
    });
  }

  /* ------------------ TOAST ------------------ */
  function showToast(text, time = 3000) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), time);
  }

}); // DOMContentLoaded end

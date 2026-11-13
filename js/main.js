/* Auto Center Barcelona — prévia Patron */
(function () {
  'use strict';

  // CONFIRMAR: WhatsApp da oficina. Formato: código do país + DDD + número, só dígitos (ex.: '5511900000000').
  // Enquanto estiver vazio, o botão de WhatsApp só avisa que o número ainda vai ser definido.
  var WHATSAPP_NUMERO = '';

  var TELEFONE = 'tel:+551151185058';

  // Horário publicado no Google em 13/11/2026 (minutos desde 00:00). 0 = domingo.
  var HORARIO = { 1: [510, 1080], 2: [510, 1080], 3: [510, 1080], 4: [510, 1080], 5: [510, 1080], 6: [510, 720] };
  var DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  var $ = function (id) { return document.getElementById(id); };
  function hhmm(min) { return ('0' + Math.floor(min / 60)).slice(-2) + ':' + ('0' + (min % 60)).slice(-2); }

  /* ---------- Selo "aberto agora" (sempre no horário de São Paulo) ---------- */
  function agoraEmSaoPaulo() {
    try {
      var partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var p = {};
      partes.forEach(function (x) { p[x.type] = x.value; });
      var dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
      if (dia < 0) throw new Error('dia');
      return { dia: dia, min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function atualizarSelo() {
    var selo = $('selo-aberto'), texto = $('selo-aberto-texto');
    if (!selo || !texto) return;
    var a = agoraEmSaoPaulo(), h = HORARIO[a.dia];

    document.querySelectorAll('.horario tr[data-dias]').forEach(function (tr) {
      var hoje = tr.getAttribute('data-dias').split(',').indexOf(String(a.dia)) >= 0;
      if (hoje) tr.setAttribute('data-hoje', 'sim'); else tr.removeAttribute('data-hoje');
    });

    if (h && a.min >= h[0] && a.min < h[1]) {
      selo.setAttribute('data-estado', 'aberto');
      texto.textContent = 'Aberto agora · fecha às ' + hhmm(h[1]);
      return;
    }
    selo.setAttribute('data-estado', 'fechado');
    if (h && a.min < h[0]) { texto.textContent = 'Fechado agora · abre hoje às ' + hhmm(h[0]); return; }
    for (var i = 1; i <= 7; i++) {
      var d = (a.dia + i) % 7;
      if (HORARIO[d]) {
        texto.textContent = 'Fechado agora · abre ' + (i === 1 ? 'amanhã' : DIAS[d]) + ' às ' + hhmm(HORARIO[d][0]);
        return;
      }
    }
  }
  atualizarSelo();
  setInterval(atualizarSelo, 60000);

  /* ---------- Aviso curto ---------- */
  var avisoTimer;
  function avisar(msg) {
    var el = $('aviso');
    el.textContent = msg;
    el.setAttribute('data-ativo', 'sim');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { el.removeAttribute('data-ativo'); }, 3600);
  }

  /* ---------- Montador de orçamento ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip-servico'));
  var chipsSintoma = Array.prototype.slice.call(document.querySelectorAll('.chip-sintoma'));
  var campoModelo = $('campo-modelo'), campoAno = $('campo-ano'), campoSintoma = $('campo-sintoma');

  function estado() {
    return {
      servicos: chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; }).map(function (c) { return c.getAttribute('data-servico'); }),
      modelo: campoModelo.value.trim(),
      ano: campoAno.value.trim(),
      sintoma: campoSintoma.value.trim().replace(/\s+/g, ' ')
    };
  }

  function preencher(dd, valor, vazio) {
    dd.textContent = valor || vazio;
    dd.classList.toggle('vazio', !valor);
  }

  function atualizarPedido() {
    var e = estado();
    var carro = [e.modelo, e.ano].filter(Boolean).join(', ');
    preencher($('pedido-servicos'), e.servicos.join(' · '), 'toque nos serviços');
    preencher($('pedido-carro'), carro, 'modelo e ano');
    preencher($('pedido-sintoma'), e.sintoma, 'descreva o sintoma');

    var partes = (e.servicos.length ? 1 : 0) + (carro ? 1 : 0) + (e.sintoma ? 1 : 0);
    var carimbo = $('pedido-carimbo');
    carimbo.textContent = partes === 0 ? 'em branco' : partes === 3 ? 'pronto' : partes + ' de 3';
    if (partes === 3) carimbo.setAttribute('data-pronto', 'sim'); else carimbo.removeAttribute('data-pronto');

    chipsSintoma.forEach(function (c) {
      var usado = campoSintoma.value.toLowerCase().indexOf(c.getAttribute('data-sintoma').toLowerCase()) >= 0;
      if (usado) c.setAttribute('data-usado', 'sim'); else c.removeAttribute('data-usado');
    });
  }

  function textoDoPedido() {
    var e = estado();
    var linhas = ['Olá! Quero pedir um orçamento no Auto Center Barcelona.'];
    if (e.servicos.length) linhas.push('Serviços: ' + e.servicos.join(', '));
    var carro = [e.modelo, e.ano].filter(Boolean).join(', ');
    if (carro) linhas.push('Carro: ' + carro);
    if (e.sintoma) linhas.push('O que está acontecendo: ' + e.sintoma);
    return linhas.join('\n');
  }

  function pedidoVazio() {
    var e = estado();
    return !e.servicos.length && !e.sintoma && !e.modelo;
  }

  function marcarServico(nome, ligado) {
    chips.forEach(function (c) {
      if (c.getAttribute('data-servico') === nome) {
        c.setAttribute('aria-pressed', ligado === undefined ? String(c.getAttribute('aria-pressed') !== 'true') : String(ligado));
      }
    });
    atualizarPedido();
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () { marcarServico(c.getAttribute('data-servico')); });
  });

  chipsSintoma.forEach(function (c) {
    c.addEventListener('click', function () {
      var frase = c.getAttribute('data-sintoma');
      var atual = campoSintoma.value;
      var pos = atual.toLowerCase().indexOf(frase.toLowerCase());
      if (pos >= 0) {
        campoSintoma.value = (atual.slice(0, pos) + atual.slice(pos + frase.length)).replace(/^[\s.]+|\s+$/g, '').replace(/\.\s*\./g, '.').replace(/\s{2,}/g, ' ');
      } else {
        var base = atual.trim();
        campoSintoma.value = base ? base.replace(/[.\s]+$/, '') + '. ' + frase : frase;
      }
      atualizarPedido();
    });
  });

  campoAno.addEventListener('input', function () { campoAno.value = campoAno.value.replace(/\D/g, '').slice(0, 4); });
  [campoModelo, campoAno, campoSintoma].forEach(function (c) { c.addEventListener('input', atualizarPedido); });
  $('form-orcamento').addEventListener('submit', function (ev) { ev.preventDefault(); });

  // "Pedir orçamento" nos cartões de serviço: marca o serviço e leva ao montador.
  document.querySelectorAll('[data-add]').forEach(function (b) {
    b.addEventListener('click', function () {
      marcarServico(b.getAttribute('data-add'), true);
      $('orcamento').scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth', block: 'start' });
      avisar(b.getAttribute('data-add') + ' entrou no seu pedido.');
    });
  });

  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto);
    return new Promise(function (ok, erro) {
      var t = document.createElement('textarea');
      t.value = texto; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy') ? ok() : erro(); } catch (e) { erro(e); }
      document.body.removeChild(t);
    });
  }

  $('btn-copiar').addEventListener('click', function () {
    if (pedidoVazio()) { avisar('Toque em um serviço ou descreva o sintoma primeiro.'); chips[0].focus(); return; }
    var rotulo = $('btn-copiar-texto');
    copiar(textoDoPedido()).then(function () {
      rotulo.textContent = 'Pedido copiado';
      avisar('Pedido copiado. É só colar onde quiser.');
      setTimeout(function () { rotulo.textContent = 'Copiar pedido'; }, 2600);
    }, function () {
      avisar('Não foi possível copiar aqui. Leia o pedido ao telefone.');
    });
  });

  var btnZap = $('btn-zap');
  if (WHATSAPP_NUMERO) btnZap.setAttribute('data-estado', 'ativo');
  btnZap.addEventListener('click', function () {
    if (!WHATSAPP_NUMERO) { avisar('O WhatsApp entra aqui quando a oficina definir o número. Por enquanto, copie o pedido ou ligue.'); return; }
    if (pedidoVazio()) { avisar('Toque em um serviço ou descreva o sintoma primeiro.'); return; }
    window.open('https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(textoDoPedido()), '_blank', 'noopener');
  });

  $('btn-limpar').addEventListener('click', function () {
    chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    campoModelo.value = campoAno.value = campoSintoma.value = '';
    atualizarPedido();
    avisar('Pedido limpo.');
  });

  atualizarPedido();

  /* ---------- Entrada das seções e barra de contato ---------- */
  function reduzMovimento() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  var revelar = document.querySelectorAll('.revela');
  if ('IntersectionObserver' in window && !reduzMovimento()) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visto'); obs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revelar.forEach(function (el) { obs.observe(el); });
  } else {
    revelar.forEach(function (el) { el.classList.add('visto'); });
  }

  var barra = $('barra-contato'), botoesHeroi = $('heroi-botoes');
  if ('IntersectionObserver' in window && botoesHeroi) {
    new IntersectionObserver(function (entradas) {
      barra.setAttribute('data-visivel', entradas[0].isIntersecting ? 'nao' : 'sim');
    }, { threshold: 0 }).observe(botoesHeroi);
  } else {
    barra.setAttribute('data-visivel', 'sim');
  }
})();

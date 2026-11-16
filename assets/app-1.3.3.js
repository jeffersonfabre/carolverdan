/* =========================================================
   Caroline Verdan — filtro de dicas e calculadora de IMC
   Tudo roda no navegador. Nenhum dado sai da página.
   ========================================================= */
(function () {
  'use strict';

  /* Troque pelo número real, só dígitos, com 55 e DDD */
  var WHATSAPP = '5521979771526';

  var ESCALA_MIN = 15, ESCALA_MAX = 40;
  var ATRASO_ANUNCIO = 700;   /* ms de silêncio antes de falar ao leitor de tela */

  /* ---------------- ano do rodapé ---------------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* =========================================================
     FILTRO DAS DICAS
     ========================================================= */
  (function filtroDicas() {
    var botoes = Array.prototype.slice.call(document.querySelectorAll('.filtro'));
    var dicas  = Array.prototype.slice.call(document.querySelectorAll('.dica'));
    var aviso  = document.getElementById('filtro-aviso');
    if (!botoes.length || !dicas.length) return;

    botoes.forEach(function (b) {
      b.addEventListener('click', function () {
        var tema = b.getAttribute('data-filtro');
        botoes.forEach(function (o) { o.classList.toggle('ativo', o === b); });

        var visiveis = 0;
        dicas.forEach(function (d) {
          var mostra = tema === 'todas' || d.getAttribute('data-tema') === tema;
          d.hidden = !mostra;
          if (mostra) visiveis++;
        });

        if (aviso) {
          aviso.textContent = visiveis === 1
            ? '1 dica em ' + b.textContent.toLowerCase() + '.'
            : visiveis + ' dicas em ' + b.textContent.toLowerCase() + '.';
        }
      });
    });
  })();

  /* =========================================================
     CALCULADORA
     ========================================================= */
  var el = {};
  [ 'form-medidas','peso','altura','idade','rotina','erro','btn-limpar',
    'marcador','marcador-valor','leitura-vazia','leitura-corpo',
    'imc-numero','imc-classe','imc-frase','faixa-peso','linha-diferenca','diferenca-rotulo',
    'diferenca-valor','linha-energia','energia-valor','anuncio',
    'visual','graf-faixa','faixa-desc','painel-projecao','graf-projecao','proj-desc',
    'leg-rapida','leg-lenta'
  ].forEach(function (id) {
    el[id.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); })] =
      document.getElementById(id);
  });

  /* Se um dia o HTML mudar e sumir com algum elemento, o script não pode
     estourar na primeira linha e derrubar a calculadora inteira: avisa no
     console e sai em silêncio. */
  var faltando = Object.keys(el).filter(function (k) { return !el[k]; });
  if (faltando.length) {
    if (window.console) console.warn('Calculadora desligada, faltam elementos:', faltando);
    return;
  }

  var radiosSexo = Array.prototype.slice.call(document.querySelectorAll('input[name="sexo"]'));
  function sexoEscolhido() {
    var m = radiosSexo.filter(function (r) { return r.checked; })[0];
    return m ? m.value : '';
  }

  /* ---------------- formatação em português ---------------- */
  function num(v, casas) {
    return v.toLocaleString('pt-BR', {
      minimumFractionDigits: casas, maximumFractionDigits: casas
    });
  }
  function kcal(v) { return (Math.round(v / 10) * 10).toLocaleString('pt-BR'); }
  function ritmoTxt(v) { return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }

  /* Lê vírgula ou ponto, ignora espaço e "kg"/"cm" digitados sem querer.
     Não depende do idioma do navegador, como o input[type=number] dependia. */
  function lerNumero(texto) {
    if (texto === null || texto === undefined) return NaN;
    var limpo = String(texto).replace(/\s/g, '').replace(/[^0-9,.\-]/g, '');
    if (!limpo) return NaN;
    limpo = limpo.replace(',', '.');
    var partes = limpo.split('.');
    if (partes.length > 2) limpo = partes.shift() + '.' + partes.join('');
    var v = parseFloat(limpo);
    return isFinite(v) ? v : NaN;
  }

  /* ---------------- classificação (OMS, adultos) ---------------- */
  function classificar(imc) {
    if (imc < 18.5) return {
      nome: 'Abaixo do peso de referência',
      frase: 'Nessa faixa o caminho não é perder peso. Vale investigar a causa com um profissional antes de mudar a alimentação.',
      lado: 'abaixo', emagrecer: false
    };
    if (imc < 25) return {
      nome: 'Peso adequado',
      frase: 'Seu peso está dentro da faixa de referência para a sua altura. Aqui o assunto é manutenção e qualidade do que entra no prato.',
      lado: 'dentro', emagrecer: false
    };
    if (imc < 30) return {
      nome: 'Sobrepeso',
      frase: 'Uma mudança gradual de hábito costuma dar conta, sem restrição agressiva e sem dieta de revista.',
      lado: 'acima', emagrecer: true
    };
    if (imc < 35) return {
      nome: 'Obesidade grau I',
      frase: 'Perder de 5% a 10% do peso atual já melhora pressão, glicemia e sono — bem antes de chegar ao fim da faixa.',
      lado: 'acima', emagrecer: true
    };
    if (imc < 40) return {
      nome: 'Obesidade grau II',
      frase: 'Vale uma avaliação com exames e acompanhamento contínuo. As primeiras metas são de saúde, não de número na balança.',
      lado: 'acima', emagrecer: true
    };
    return {
      nome: 'Obesidade grau III',
      frase: 'Essa faixa pede acompanhamento conjunto de nutricionista e médico. Procure uma avaliação clínica.',
      lado: 'acima', emagrecer: true
    };
  }

  /* ---------------- gasto energético (Mifflin-St Jeor) ---------------- */
  function gastoEnergetico(peso, alturaCm, idade, sexo, fator) {
    var tmb = 10 * peso + 6.25 * alturaCm - 5 * idade + (sexo === 'm' ? 5 : -161);
    return tmb * fator;
  }

  /* ---------------- anúncio ao leitor de tela, com atraso ---------------- */
  var temporizador = null;
  function anunciar(texto) {
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { el.anuncio.textContent = texto; }, ATRASO_ANUNCIO);
  }

  /* ---------------- cálculo principal ---------------- */
  function calcular() {
    var peso   = lerNumero(el.peso.value);
    var altura = lerNumero(el.altura.value);

    if (!el.peso.value.trim() && !el.altura.value.trim()) { limparLeitura(); return; }
    if (isNaN(peso) || isNaN(altura)) { limparLeitura(); return; }

    if (peso < 25 || peso > 350) {
      mostrarErro('Confira o peso: use um valor em quilos, entre 25 e 350.'); return;
    }
    if (altura > 0.5 && altura < 3) {
      mostrarErro('A altura vai em centímetros. Para 1,65 m, digite 165.'); return;
    }
    if (altura < 120 || altura > 230) {
      mostrarErro('Confira a altura: use um valor em centímetros, entre 120 e 230.'); return;
    }
    esconderErro();

    var m = altura / 100;
    var imc = peso / (m * m);
    var c = classificar(imc);
    var sexo = sexoEscolhido();

    el.leituraVazia.hidden = true;
    el.leituraCorpo.hidden = false;
    el.imcNumero.textContent = num(imc, 1);
    el.imcClasse.textContent = c.nome;
    el.imcFrase.textContent = c.frase;

    var pos = Math.max(3, Math.min(97, ((imc - ESCALA_MIN) / (ESCALA_MAX - ESCALA_MIN)) * 100));
    el.marcador.hidden = false;
    el.marcador.style.bottom = pos + '%';
    el.marcadorValor.textContent = num(imc, 1);

    var pesoMin = 18.5 * m * m;
    var pesoMax = 24.9 * m * m;
    el.faixaPeso.textContent = num(pesoMin, 1) + ' kg a ' + num(pesoMax, 1) + ' kg';

    /* ---- quanto falta: só quando está fora da faixa ---- */
    var alvo = null, diferenca = 0, ritmoLento, ritmoRapido;
    if (c.lado === 'acima') {
      alvo = pesoMax; diferenca = peso - pesoMax; ritmoLento = 0.5; ritmoRapido = 1;
    } else if (c.lado === 'abaixo') {
      alvo = pesoMin; diferenca = pesoMin - peso; ritmoLento = 0.25; ritmoRapido = 0.5;
    }

    if (alvo === null) {
      el.linhaDiferenca.hidden = true;
      el.painelProjecao.hidden = true;
    } else {
      var perder = c.lado === 'acima';
      var semanasRapido = Math.ceil(diferenca / ritmoRapido);
      var semanasLento  = Math.ceil(diferenca / ritmoLento);

      el.linhaDiferenca.hidden = false;
      el.diferencaRotulo.textContent = perder
        ? 'Quanto falta perder para entrar na faixa'
        : 'Quanto falta ganhar para entrar na faixa';
      el.diferencaValor.textContent = num(diferenca, 1) + ' kg';

      el.painelProjecao.hidden = false;
      el.legRapida.textContent = ritmoTxt(ritmoRapido) + ' kg por semana';
      el.legLenta.textContent  = ritmoTxt(ritmoLento) + ' kg por semana';
      el.grafProjecao.innerHTML = window.CVDesenho.grafProjecao(
        peso, alvo, ritmoLento, ritmoRapido, num);
      el.projDesc.textContent = 'Projeção de ' + (perder ? 'perda' : 'ganho') + ' de '
        + num(diferenca, 1) + ' kg num ritmo seguro: entre ' + semanasRapido + ' e '
        + semanasLento + ' semanas. A linha tracejada é o limite da faixa de referência.';
    }

    /* ---- gráficos ---- */
    el.visual.hidden = false;
    el.visual.classList.toggle('sem-projecao', alvo === null);
    el.grafFaixa.innerHTML = window.CVDesenho.grafFaixa(peso, pesoMin, pesoMax, num);
    el.faixaDesc.textContent = 'Seu peso é ' + num(peso, 1) + ' kg. A faixa de referência para '
      + num(altura, 0) + ' cm vai de ' + num(pesoMin, 1) + ' a ' + num(pesoMax, 1) + ' kg.';

    /* ---- gasto energético, se idade e sexo estiverem preenchidos ---- */
    var idade = lerNumero(el.idade.value);
    var fator = parseFloat(el.rotina.value);

    if (!isNaN(idade) && idade >= 18 && idade <= 100 && (sexo === 'm' || sexo === 'f')) {
      var total = gastoEnergetico(peso, altura, idade, sexo, fator);
      var texto = kcal(total) + ' kcal';
      if (c.emagrecer) {
        var piso = sexo === 'm' ? 1500 : 1200;
        texto += ' · uma mudança gradual costuma partir de '
              + kcal(Math.max(piso, total * 0.80)) + ' a '
              + kcal(Math.max(piso, total * 0.85))
              + ' kcal, sempre definido em consulta';
      }
      el.energiaValor.textContent = texto;
      el.linhaEnergia.hidden = false;
    } else {
      el.linhaEnergia.hidden = true;
    }

    anunciar('IMC ' + num(imc, 1) + '. ' + c.nome + '. '
      + (alvo !== null
          ? 'Faltam ' + num(diferenca, 1) + ' quilos para entrar na faixa de referência, de '
            + num(pesoMin, 1) + ' a ' + num(pesoMax, 1) + ' quilos.'
          : 'Seu peso está dentro da faixa de referência, de '
            + num(pesoMin, 1) + ' a ' + num(pesoMax, 1) + ' quilos.'));
  }

  function mostrarErro(msg) {
    el.erro.textContent = msg;
    el.erro.hidden = false;
    limparLeitura(true);
    anunciar(msg);
  }
  function esconderErro() { el.erro.hidden = true; el.erro.textContent = ''; }

  function limparLeitura(manterErro) {
    el.leituraCorpo.hidden = true;
    el.leituraVazia.hidden = false;
    el.marcador.hidden = true;
    el.visual.hidden = true;
    el.painelProjecao.hidden = true;
    if (!manterErro) { esconderErro(); anunciar(''); }
  }

  /* ---------------- eventos ---------------- */
  ['peso', 'altura', 'idade', 'rotina'].forEach(function (id) {
    el[id].addEventListener('input', calcular);
    el[id].addEventListener('change', calcular);
  });
  radiosSexo.forEach(function (r) { r.addEventListener('change', calcular); });

  el.formMedidas.addEventListener('submit', function (e) { e.preventDefault(); calcular(); });

  el.btnLimpar.addEventListener('click', function () {
    el.peso.value = ''; el.altura.value = ''; el.idade.value = ''; el.rotina.value = '1.55';
    radiosSexo.forEach(function (r) { r.checked = false; });
    limparLeitura();
    el.peso.focus();
  });

  /* deixa o número do WhatsApp num único lugar */
  Array.prototype.forEach.call(document.querySelectorAll('a[href*="wa.me/"]'), function (a) {
    a.href = 'https://wa.me/' + WHATSAPP;
    a.target = '_blank';
    a.rel = 'noopener';
  });
})();

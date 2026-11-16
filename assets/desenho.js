/* =========================================================
   Caroline Verdan — gráficos em SVG puro
   Sem biblioteca externa: mantém a CSP estrita e o site leve.
   ========================================================= */
(function (raiz) {
  'use strict';

  /* Catmull-Rom convertido em curvas de Bézier cúbicas */
  function suavizar(pts, fechado) {
    if (pts.length < 2) return '';
    var d = 'M' + fmt(pts[0][0]) + ',' + fmt(pts[0][1]);
    var n = pts.length;
    var ultimo = fechado ? n : n - 1;
    for (var i = 0; i < ultimo; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i % n],
          p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (!fechado) {
        p0 = pts[Math.max(i - 1, 0)];
        p3 = pts[Math.min(i + 2, n - 1)];
      }
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + fmt(c1x) + ',' + fmt(c1y) + ' ' + fmt(c2x) + ',' + fmt(c2y)
         + ' ' + fmt(p2[0]) + ',' + fmt(p2[1]);
    }
    return d + (fechado ? 'Z' : '');
  }

  function fmt(v) { return Math.round(v * 10) / 10; }
  function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function texto(x, y, classe, ancora, conteudo) {
    return '<text x="' + fmt(x) + '" y="' + fmt(y) + '" class="' + classe
         + '" text-anchor="' + ancora + '">' + conteudo + '</text>';
  }

  /* =========================================================
     GRÁFICO 1 — seu peso diante da faixa de referência
     Escala em quilos, com os limites da faixa escritos embaixo
     exatamente como aparecem na leitura (uma casa decimal).
     ========================================================= */
  function grafFaixa(peso, pesoMin, pesoMax, rotular) {
    var L = 16, R = 324, T = 40, alt = 26, base = T + alt;

    var lo = Math.min(peso, pesoMin) - 6;
    var hi = Math.max(peso, pesoMax) + 6;
    function x(v) { return L + ((v - lo) / (hi - lo)) * (R - L); }

    var xMin = x(pesoMin), xMax = x(pesoMax), xPeso = limitar(x(peso), L, R);

    var s = '<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + alt
          + '" rx="4" class="g-trilho"/>'
          + '<rect x="' + fmt(xMin) + '" y="' + T + '" width="' + fmt(xMax - xMin)
          + '" height="' + alt + '" rx="4" class="g-faixa"/>';

    /* limites da faixa, escritos sob as bordas */
    [[xMin, pesoMin, 'start'], [xMax, pesoMax, 'end']].forEach(function (p) {
      s += '<line x1="' + fmt(p[0]) + '" y1="' + base + '" x2="' + fmt(p[0])
         + '" y2="' + (base + 6) + '" class="g-tick"/>'
         + texto(p[0], base + 19, 'g-rotulo', p[2], rotular(p[1], 1));
    });

    /* marcador do peso atual */
    var ancora = xPeso > R - 56 ? 'end' : (xPeso < L + 56 ? 'start' : 'middle');
    s += '<line x1="' + fmt(xPeso) + '" y1="' + (T - 8) + '" x2="' + fmt(xPeso)
       + '" y2="' + (base + 4) + '" class="g-marca"/>'
       + '<circle cx="' + fmt(xPeso) + '" cy="' + (T - 8) + '" r="3.5" class="g-ponto-marca"/>'
       + texto(xPeso, T - 18, 'g-valor', ancora, 'você · ' + rotular(peso, 1) + ' kg');
    return s;
  }

  /* =========================================================
     GRÁFICO 2 — quanto tempo até a faixa, nos dois ritmos
     Eixo em múltiplos redondos de quilo e semanas marcadas
     onde cada ritmo chega ao alvo.
     ========================================================= */
  function grafProjecao(pesoAtual, alvo, ritmoLento, ritmoRapido, rotular) {
    var L = 42, R = 316, T = 20, B = 116;
    var ganhar = alvo > pesoAtual;
    var semLento  = Math.abs(alvo - pesoAtual) / ritmoLento;
    var semRapido = Math.abs(alvo - pesoAtual) / ritmoRapido;
    var totalSem = Math.max(Math.ceil(semLento), 2);

    /* escala vertical em passos redondos */
    var bruto = Math.abs(alvo - pesoAtual);
    var passo = bruto > 40 ? 10 : bruto > 16 ? 5 : bruto > 6 ? 2 : 1;
    var pMin = Math.floor(Math.min(pesoAtual, alvo) / passo) * passo;
    var pMax = Math.ceil(Math.max(pesoAtual, alvo) / passo) * passo;
    while ((pMax - pMin) / passo > 6) passo *= 2;
    pMin = Math.floor(pMin / passo) * passo;
    pMax = Math.ceil(pMax / passo) * passo;

    function x(s) { return L + (s / totalSem) * (R - L); }
    function y(p) { return B - ((p - pMin) / (pMax - pMin)) * (B - T); }

    var s = '';
    for (var v = pMin; v <= pMax + 0.001; v += passo) {
      s += '<line x1="' + L + '" y1="' + fmt(y(v)) + '" x2="' + R + '" y2="' + fmt(y(v))
         + '" class="g-grade"/>'
         + texto(L - 8, y(v) + 4, 'g-rotulo', 'end', rotular(v, 0));
    }
    s += texto(L - 8, T - 8, 'g-rotulo-forte', 'end', 'kg');

    /* eixos */
    s += '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + B + '" class="g-eixo"/>';

    /* linha do alvo */
    s += '<line x1="' + L + '" y1="' + fmt(y(alvo)) + '" x2="' + R + '" y2="' + fmt(y(alvo))
       + '" class="g-alvo"/>'
       + texto(L + 6, y(alvo) + (ganhar ? 15 : -7), 'g-rotulo-forte', 'start',
                 'meta ' + rotular(alvo, 1) + ' kg');

    /* as duas curvas, com ponto de chegada */
    function linha(ritmo, sem, classe) {
      var pts = [], t;
      for (t = 0; t < sem; t += Math.max(sem / 20, 0.2)) {
        pts.push([x(t), y(ganhar ? pesoAtual + ritmo * t : pesoAtual - ritmo * t)]);
      }
      pts.push([x(sem), y(alvo)]);
      return '<path d="' + suavizar(pts, false) + '" class="g-linha ' + classe + '"/>'
           + '<circle cx="' + fmt(x(sem)) + '" cy="' + fmt(y(alvo)) + '" r="4" class="g-ponto '
           + classe + '-ponto"/>';
    }
    s += linha(ritmoLento, semLento, 'g-linha-lenta');
    s += linha(ritmoRapido, semRapido, 'g-linha-rapida');

    /* semanas marcadas: hoje e a chegada de cada ritmo */
    var marcas = [[0, 'hoje', 'start']];
    var xr = x(semRapido), xl = x(semLento);
    marcas.push([semRapido, 'sem. ' + Math.ceil(semRapido), xl - xr < 56 ? 'end' : 'middle']);
    marcas.push([semLento, 'sem. ' + Math.ceil(semLento), 'end']);
    marcas.forEach(function (m, i) {
      var px = x(m[0]);
      if (i > 0) {
        s += '<line x1="' + fmt(px) + '" y1="' + B + '" x2="' + fmt(px) + '" y2="'
           + (B + 5) + '" class="g-tick"/>';
      }
      s += texto(px, B + 19, i === 0 ? 'g-rotulo' : 'g-rotulo-forte', m[2], m[1]);
    });
    return s;
  }

  raiz.CVDesenho = {
    grafFaixa: grafFaixa,
    grafProjecao: grafProjecao
  };
})(typeof window !== 'undefined' ? window : this);

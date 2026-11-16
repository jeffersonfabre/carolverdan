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

  /* =========================================================
     GRÁFICO 1 — seu peso dentro da faixa saudável (em kg)
     ========================================================= */
  function grafFaixa(peso, pesoMin, pesoMax, rotular) {
    var L = 44, R = 300, T = 46, alt = 26;
    var lo = Math.min(peso, pesoMin) * 0.88;
    var hi = Math.max(peso, pesoMax) * 1.08;
    function x(v) { return L + ((v - lo) / (hi - lo)) * (R - L); }

    var s = '<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + alt
          + '" rx="2" class="g-trilho"/>'
          + '<rect x="' + fmt(x(pesoMin)) + '" y="' + T + '" width="'
          + fmt(x(pesoMax) - x(pesoMin)) + '" height="' + alt + '" rx="2" class="g-faixa"/>'
          + '<text x="' + fmt((x(pesoMin) + x(pesoMax)) / 2) + '" y="' + (T + alt + 16)
          + '" class="g-rotulo" text-anchor="middle">faixa saudável · '
          + rotular(pesoMin, 0) + '–' + rotular(pesoMax, 0) + ' kg</text>';

    var px = limitar(x(peso), L + 1, R - 1);
    s += '<line x1="' + fmt(px) + '" y1="' + (T - 10) + '" x2="' + fmt(px) + '" y2="'
       + (T + alt + 6) + '" class="g-marca"/>'
       + '<text x="' + fmt(px) + '" y="' + (T - 16) + '" class="g-valor" text-anchor="'
       + (px > R - 60 ? 'end' : (px < L + 40 ? 'start' : 'middle')) + '">seu peso · '
       + rotular(peso, 1) + ' kg</text>';
    return s;
  }

  /* =========================================================
     GRÁFICO 2 — projeção de semanas até a faixa
     ========================================================= */
  function grafProjecao(pesoAtual, alvo, ritmoLento, ritmoRapido, rotular) {
    var L = 46, R = 302, T = 22, B = 132;
    var ganhar = alvo > pesoAtual;
    var semanas = Math.ceil(Math.abs(alvo - pesoAtual) / ritmoLento);
    if (semanas < 2) semanas = 2;

    var pMax = Math.max(pesoAtual, alvo) + 2;
    var pMin = Math.min(pesoAtual, alvo) - 2;
    function x(s) { return L + (s / semanas) * (R - L); }
    function y(p) { return B - ((p - pMin) / (pMax - pMin)) * (B - T); }

    var s = '';
    /* grade horizontal */
    [0, 0.5, 1].forEach(function (f) {
      var v = pMin + f * (pMax - pMin);
      s += '<line x1="' + L + '" y1="' + fmt(y(v)) + '" x2="' + R + '" y2="' + fmt(y(v))
         + '" class="g-grade"/>'
         + '<text x="' + (L - 8) + '" y="' + fmt(y(v) + 4) + '" class="g-rotulo" text-anchor="end">'
         + rotular(v, 0) + '</text>';
    });

    /* faixa alvo */
    s += '<line x1="' + L + '" y1="' + fmt(y(alvo)) + '" x2="' + R + '" y2="' + fmt(y(alvo))
       + '" class="g-alvo"/>';

    function linha(ritmo, classe) {
      var pts = [], sem = Math.abs(alvo - pesoAtual) / ritmo;
      for (var t = 0; t <= sem; t += Math.max(sem / 24, 0.25)) {
        var p = ganhar ? pesoAtual + ritmo * t : pesoAtual - ritmo * t;
        pts.push([x(Math.min(t, semanas)), y(p)]);
      }
      pts.push([x(Math.min(sem, semanas)), y(alvo)]);
      return '<path d="' + suavizar(pts, false) + '" class="' + classe + '"/>';
    }
    s += linha(ritmoLento, 'g-linha g-linha-lenta');
    s += linha(ritmoRapido, 'g-linha g-linha-rapida');

    s += '<text x="' + L + '" y="' + (B + 18) + '" class="g-rotulo">hoje</text>'
       + '<text x="' + R + '" y="' + (B + 18) + '" class="g-rotulo" text-anchor="end">semana '
       + semanas + '</text>';
    return s;
  }

  raiz.CVDesenho = {
    grafFaixa: grafFaixa,
    grafProjecao: grafProjecao
  };
})(typeof window !== 'undefined' ? window : this);

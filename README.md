# Caroline Verdan — Acadêmica de Nutrição

Site estático de uma página, em tons femininos (ameixa, rosa e dourado), com
dicas de nutrição filtráveis por tema e uma calculadora de IMC educativa.
Todo o cálculo acontece no navegador do visitante — nenhum dado é enviado a
servidor algum, o que evita qualquer tratamento de dado sensível de saúde.

**Versão:** v1.3.3
**Desenvolvido por:** DomDevLabs · domdevlabs@gmail.com · (21) 99532-1173

## Estrutura

```
.
├── index.html              # conteúdo, Open Graph, JSON-LD
├── assets/
│   ├── style-1.3.3.css       # paleta, tipografia, layout (versão no nome)
│   ├── app-1.3.3.js          # filtro das dicas + calculadora
│   ├── desenho-1.3.3.js      # gráficos em SVG, sem biblioteca
│   ├── caroline.webp       # retrato recortado em círculo (25 KB)
│   ├── capa.jpg            # imagem 1200×630 do link no WhatsApp e no Google
│   ├── domdevlabs.png     # emblema da DomDevLabs, fundo recortado
│   ├── favicon.svg
│   └── fontes/             # 5 woff2 (76 KB), subconjunto latin
├── vercel.json             # cache, CSP e cabeçalhos de segurança
├── robots.txt
├── sitemap.xml
└── README.md
```

## Rodar localmente

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Pelo protocolo `file://` as fontes locais podem não carregar — prefira o servidor.

## Já publicado

- **Site:** https://caroline-verdan.vercel.app
- **Repositório:** https://github.com/jeffersonfabre/carolverdan
- A Vercel está ligada ao repositório: todo `git push` na `main` gera um deploy novo sozinho.

Se trocar o domínio depois, atualize `canonical`, `og:url`, `og:image` e o
JSON-LD no `index.html`, mais `robots.txt` e `sitemap.xml` — e recalcule o hash
da CSP (instruções abaixo).

## Publicar no GitHub (histórico)

O repositório já está iniciado, com o primeiro commit feito. Falta só apontar
para o seu GitHub e enviar:

```bash
git remote add origin https://github.com/jeffersonfabre/carolverdan.git
git branch -M main
git push -u origin main
```

## Publicar na Vercel

1. Em vercel.com, **Add New → Project** e importe o repositório.
2. *Framework Preset*: **Other**. Build Command vazio, Output Directory `./`.
3. **Deploy**. Cada `git push` na `main` gera um deploy novo.

## O que trocar antes de divulgar

| Onde | O que |
| --- | --- |
| `index.html`, seção `#sobre` | texto de apresentação na voz dela |
| `robots.txt` e `sitemap.xml` | domínio real |
| `assets/style.css`, bloco `:root` | cores, se quiser outro tom |

Se editar o bloco `application/ld+json`, a CSP em `vercel.json` para de aceitá-lo,
porque ela guarda o hash SHA-256 do conteúdo atual. Recalcule assim e cole no
lugar do `sha256-...`:

```bash
python3 - <<'EOF'
import re, hashlib, base64
c = re.search(r'<script type="application/ld\+json">(.*?)</script>',
              open('index.html').read(), re.S).group(1)
print("sha256-" + base64.b64encode(hashlib.sha256(c.encode()).digest()).decode())
EOF
```

## Limite profissional embutido no conteúdo

Caroline é **acadêmica**, não nutricionista registrada. Avaliação individual,
prescrição de dieta e acompanhamento clínico são atividades privativas do
nutricionista com registro no CRN (Lei 8.234/1991). Por isso o site:

- não oferece consulta, plano alimentar, avaliação individual nem indicação de suplemento;
- apresenta as dicas como **conteúdo educativo de caráter geral**;
- traz esse aviso na seção "Sobre", em duas perguntas frequentes e no rodapé;
- apresenta a calculadora como ferramenta de educação, não de diagnóstico.

Manter esses avisos protege a Caroline. Quando ela se formar e tirar o CRN,
é só trocar o texto do selo, o aviso da seção "Sobre" e as duas perguntas —
aí sim pode anunciar consulta.

## A versão vai no NOME do CSS e do JS

`style-<versão>.css`, `app-<versão>.js`, `desenho-<versão>.js`. A cada release,
renomeie os três e atualize as referências no `index.html`.

Antes isso era feito com `?v=`, e não bastou: há navegadores e proxies que
ignoram a query string ao decidir o que está em cache. O resultado foi um
visitante rodando o `app.js` antigo com o `index.html` novo — e o JS antigo
procurava um elemento que o HTML novo não tem mais, estourava na primeira
linha e deixava a calculadora morta, sem nada na tela.

O `app.js` agora confere se todos os elementos existem antes de ligar a
calculadora, e avisa no console se faltar algum, em vez de quebrar calado.

## Cuidado ao editar: a CSP proíbe `style=` inline

O site roda com `style-src 'self'`, sem `unsafe-inline`. Isso significa que
**atributo `style=` no HTML é simplesmente ignorado pelo navegador** — o
elemento aparece fora do lugar e o único aviso fica no console. Foi assim que
os números da régua apareceram empilhados em produção enquanto o arquivo
local, sem CSP, ficava perfeito.

- posição fixa → regra no `style.css` (a régua usa `li[data-p="60"]`)
- posição calculada → JavaScript via `elemento.style.prop = valor`, que a CSP
  permite, porque CSSOM não é atributo inline

Para testar como o navegador do visitante vê, sirva os arquivos com o mesmo
cabeçalho, e não pelo `file://`:

```bash
python3 - <<'EOF'
import http.server, functools
CSP = "default-src 'self'; style-src 'self'; script-src 'self'"
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy', CSP); super().end_headers()
http.server.HTTPServer(('127.0.0.1', 8778), H).serve_forever()
EOF
```

## Acessibilidade e privacidade

- Contraste mínimo de 4,5:1 em todo texto; os tons de apoio são separados por
  fundo (`--cinza` para fundo claro, `--cinza-inv` para a ameixa). O dourado é
  decorativo — filetes e ícones, nunca texto pequeno.
- O resultado da calculadora é anunciado a leitores de tela 700 ms depois que a
  digitação para, para não ler o número parcial a cada tecla.
- O filtro das dicas avisa quantas ficaram visíveis.
- `prefers-reduced-motion` desliga o deslizamento do marcador.
- Fontes hospedadas no próprio domínio: nenhum IP de visitante vai para o Google.
- CSP sem `unsafe-inline`, HSTS, `nosniff` e `Permissions-Policy` restritiva.

## Cálculos usados

- **IMC**: peso (kg) ÷ altura (m)². Classificação da OMS para adultos.
- **Faixa de referência**: IMC 18,5 a 24,9 aplicado à altura informada.
- **Quanto falta**: só aparece fora da faixa. Acima, o que falta para 24,9;
  abaixo, o que falta para 18,5. Dentro, a linha some.
- **Ritmo**: 0,5 a 1 kg por semana para perder; 0,25 a 0,5 para ganhar.
- **Gasto energético**: TMB por Mifflin-St Jeor × fator de atividade, com piso de
  1.500 kcal (masculino) e 1.200 kcal (feminino) — a página nunca sugere menos.

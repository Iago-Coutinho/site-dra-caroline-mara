# Site da Dra. Caroline Mara

Site institucional estático (HTML, CSS e JavaScript puros, sem build) da Dra. Caroline Mara,
cirurgiã-dentista com atendimento em Recife (Casa Forte) e Carpina.

## Estrutura

```
index.html          página única (hero, sobre, procedimentos, destaques, resultados,
                    primeira consulta, endereços, dúvidas, contato)
css/styles.css      estilos (paleta branco quente + verde-sálvia, Fraunces + Inter)
js/main.js          interações: header, menu mobile, reveal no scroll, acordeão,
                    filtros da galeria, lightbox, spotlight nos cards, gancho de analytics
assets/img/         imagens otimizadas para web (JPEG + WebP), geradas pelo script abaixo
assets/originais/   fotos originais (ignoradas pelo Git; manter cópia local)
tools/optimize_images.py  gera assets/img a partir de assets/originais
```

## Rodar localmente

Qualquer servidor estático serve. Exemplo com Python:

```
python -m http.server 8080
```

Depois abra http://localhost:8080.

## Atualizar imagens

1. Coloque o arquivo original em `assets/originais/<grupo>/` com nome descritivo.
2. Rode `python tools/optimize_images.py` (precisa do Pillow: `pip install pillow`).
3. Referencie `assets/img/<grupo>/<nome>.webp` e `.jpg` no `index.html`.

## Analytics

O site chama `window.track(nome, params)` nos cliques de WhatsApp, Instagram, mapas e galeria.
A função está definida como no-op em `js/main.js`. Para ativar, inclua o script do provedor
escolhido e redefina `window.track` para chamar a API dele (ver comentário no arquivo).

## Publicação

Hospedagem estática (Cloudflare Pages, Netlify ou similar) apontando para a raiz do repositório.
Domínio pretendido: dracarolinemara.com.br. Ao publicar, ajuste as URLs absolutas em
`index.html` (canonical, Open Graph e JSON-LD) se o domínio final for outro.

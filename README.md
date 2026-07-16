# RAVO — Website institucional

Site estático (HTML/CSS/JS puro, sem framework e sem build step) da RAVO, AI Software House.

## Estrutura do projeto

```
.
├── index.html              Home
├── sobre.html               Sobre a RAVO
├── servicos.html             Serviços
├── solucoes.html             Soluções / roadmap de produtos
├── contato.html              Contato (formulário via Formspree)
├── privacidade.html          Política de Privacidade (LGPD)
├── 404.html                  Página de erro customizada
├── sitemap.xml                Sitemap para SEO
├── robots.txt                 Diretivas para crawlers
├── site.webmanifest           Manifest PWA (nome, ícones, theme-color)
├── README.md                  Este arquivo
└── assets/
    ├── css/
    │   ├── styles.css         Design system — fonte legível, editar aqui
    │   └── styles.min.css     Versão minificada, referenciada pelo HTML
    ├── js/
    │   ├── script.js           Comportamento do site — fonte legível, editar aqui
    │   └── script.min.js       Versão minificada, referenciada pelo HTML
    ├── fonts/                  Inter e Space Grotesk self-hosted (.woff2)
    └── images/
        ├── favicon.svg          Marca "R" (SVG, vetorial)
        ├── favicon.ico          Fallback para navegadores antigos
        ├── apple-touch-icon.png Ícone para iOS "adicionar à tela de início"
        ├── icon-192.png         Ícone PWA (Android)
        ├── icon-512.png         Ícone PWA (Android, alta resolução)
        └── og-image.png        Imagem de compartilhamento (Open Graph / Twitter Card)
```

Todas as páginas HTML ficam na raiz (necessário para que os caminhos relativos simples como
`sobre.html`, `contato.html` etc. continuem funcionando). Apenas os assets estáticos
(CSS, JS, fontes, imagens) vivem dentro de `assets/`.

## Fluxo de edição

O HTML referencia sempre os arquivos **minificados** (`assets/css/styles.min.css` e
`assets/js/script.min.js`). Ao editar o design ou o comportamento do site:

1. Edite `assets/css/styles.css` e/ou `assets/js/script.js` (versões legíveis).
2. Gere as versões minificadas a partir delas:

   ```bash
   npx csso assets/css/styles.css -o assets/css/styles.min.css
   npx terser assets/js/script.js -c -m -o assets/js/script.min.js
   ```

3. Confirme visualmente as páginas antes de publicar.

Não edite os arquivos `.min.css` / `.min.js` diretamente — eles são gerados e serão
sobrescritos na próxima minificação.

### Identidade visual

A marca "R" (ícone geométrico em gradiente laranja/vermelho, `#E8442C` → `#F7931E`) foi
recriada em SVG a partir de imagens de referência da identidade original da RAVO, já que
o arquivo vetorial oficial não estava disponível neste projeto. As cores de destaque do
site (`--accent` e `--accent-2` em `assets/css/styles.css`) foram ajustadas para essa
paleta. Se a RAVO tiver o arquivo original do logo (SVG/AI), o ideal é substituir
`assets/images/favicon.svg` e regerar os ícones derivados (`favicon.ico`,
`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.png`) a partir dele para
máxima fidelidade à marca.

## Configurar o formulário de contato (Formspree)

O formulário em `contato.html` usa o [Formspree](https://formspree.io) para receber
submissões sem precisar de backend próprio.

1. Crie uma conta gratuita em formspree.io e um novo formulário.
2. Copie o Form ID gerado (algo como `xzzjqwer`).
3. Em `contato.html`, localize a tag `<form id="contact-form" action="https://formspree.io/f/SEU_FORM_ID" ...>`
   e substitua `SEU_FORM_ID` pelo ID copiado.
4. Enquanto `SEU_FORM_ID` não for substituído, o site exibe um aviso ao usuário em vez de
   tentar enviar o formulário (comportamento intencional, ver `assets/js/script.js`).

## Deploy

Por ser um site 100% estático, pode ser publicado em qualquer hospedagem de arquivos
estáticos (Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3, etc.) — basta enviar todo
o conteúdo desta pasta, mantendo a estrutura acima. Não há passo de build.

Antes do primeiro deploy em produção, revise:

- `sitemap.xml` e `robots.txt` — confirme que o domínio está correto.
- As meta tags `og:url` / `canonical` em cada página — apontam para `https://ravocompany.com.br/`.
- O Form ID do Formspree (ver seção acima).

## Contato oficial

- E-mail: sistema@ravocompany.com.br
- Telefone/WhatsApp: (64) 99964-9783

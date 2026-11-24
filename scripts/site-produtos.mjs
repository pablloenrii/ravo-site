// Build da Vercel: abre o pacote do site publicado (bundle.b64), inclui os produtos novos
// (RAVO Edu e RAVO JurisCalc) na vitrine e gera a pasta "public" servida pela Vercel.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';

const AQUI = process.cwd();
const SAIDA = join(AQUI, 'public');

// ---------- 1. Abrir o pacote ----------
function lerTar(buf) {
  const arquivos = [];
  let pos = 0, nomeLongo = null;
  while (pos + 512 <= buf.length) {
    const cab = buf.subarray(pos, pos + 512);
    if (cab.every((b) => b === 0)) break;
    const str = (a, b) => cab.subarray(a, b).toString('utf8').replace(/\0.*$/s, '');
    let nome = str(0, 100);
    const prefixo = str(345, 500);
    if (prefixo && str(257, 263).startsWith('ustar')) nome = prefixo + '/' + nome;
    const tam = parseInt(str(124, 136).trim() || '0', 8);
    const tipo = String.fromCharCode(cab[156] || 48);
    const dados = buf.subarray(pos + 512, pos + 512 + tam);
    pos += 512 + Math.ceil(tam / 512) * 512;
    if (tipo === 'L') { nomeLongo = dados.toString('utf8').replace(/\0.*$/s, ''); continue; }
    if (tipo === 'x' || tipo === 'g') {
      const m = /\d+ path=([^\n]+)\n/.exec(dados.toString('utf8'));
      if (m) nomeLongo = m[1];
      continue;
    }
    if (nomeLongo) { nome = nomeLongo; nomeLongo = null; }
    if (tipo === '0' || tipo === '\0' || tipo === '7') arquivos.push({ nome: nome.replace(/^\.\//, ''), dados: Buffer.from(dados) });
  }
  return arquivos;
}

let bruto = readFileSync(join(AQUI, 'bundle.b64'), 'utf8').replace(/\s+/g, '');
let buf = Buffer.from(bruto, 'base64');
if (buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf);
const arquivos = lerTar(buf);
console.log(`[patch] ${arquivos.length} arquivos no pacote`);

const idx = arquivos.find((a) => /(^|\/)index\.html$/.test(a.nome) && a.dados.includes('id="pt-ponto"'));
if (!idx) throw new Error('index.html com a vitrine de produtos não encontrado no pacote');
const raiz = idx.nome.slice(0, idx.nome.length - 'index.html'.length);
console.log(`[patch] raiz do site no pacote: "${raiz || '.'}"`);

const site = new Map();
for (const a of arquivos) if (a.nome.startsWith(raiz)) site.set(a.nome.slice(raiz.length), a.dados);

// ---------- 2. Produtos novos ----------
const PRODUTOS = [
  {
    depoisDe: 'juris',
    k: 'calc', name: 'RAVO JurisCalc', sub: 'Cálculos trabalhistas com memória de cálculo', path: 'juriscalc/rescisao',
    shots: [
      ['/produtos/juriscalc-resultado.webp', 'Verbas rescisórias com total bruto e FGTS'],
      ['/produtos/juriscalc-memoria.webp', 'Fórmula e base legal de cada verba'],
    ],
    d: 'Calculadora para escritórios trabalhistas. Faz a rescisão, a liquidação mês a mês e a atualização judicial, e mostra em cada verba a fórmula usada e a base legal. O resultado sai em PDF ou planilha para conferir e anexar ao processo.',
    items: ['Verbas rescisórias e FGTS', 'Liquidação mensal com reflexos', 'Correção monetária, juros e prescrição', 'Memória de cálculo em PDF'],
  },
  {
    depoisDe: 'atend',
    k: 'edu', name: 'RAVO Edu', sub: 'Plataforma de ensino a distância', path: 'edu/inicio',
    shots: [
      ['/produtos/edu-aluno.webp', 'Painel do aluno com a aula em andamento e as entregas da semana'],
      ['/produtos/edu-coordenacao.webp', 'Visão da coordenação com correções pendentes e acesso por dia'],
    ],
    d: 'Ambiente virtual para faculdades, escolas e cursos. O aluno estuda pelo navegador ou pelo celular, com vídeos, leituras, questionários e atividades. O tutor corrige as entregas com critérios definidos, e a coordenação acompanha o acesso, as notas e o risco de evasão de cada turma.',
    items: ['Aulas, questionários e atividades', 'Correção pelo tutor com critérios', 'Importação de alunos e turmas', 'Painel da coordenação'],
  },
];
const SEGMENTO_NOVO = 'Instituição de ensino';

// 2a. JavaScript da página (componente da vitrine)
const jsEsc = (t) => JSON.stringify(t).replace(/[^\x00-\x7e]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const objJs = (p) => `{k:${jsEsc(p.k)},name:${jsEsc(p.name)},sub:${jsEsc(p.sub)},path:${jsEsc(p.path)},shots:[${p.shots.map(([s, l]) => `[${jsEsc(s)},${jsEsc(l)}]`).join(',')}],d:${jsEsc(p.d)},items:[${p.items.map(jsEsc).join(',')}]}`;

let jsPatched = 0;
for (const [nome, dados] of site) {
  if (!/_next\/static\/chunks\/app\/page-[^/]+\.js$/.test(nome)) continue;
  let js = dados.toString('utf8');
  if (!js.includes('{k:"track",name:"RAVO Track"')) continue;
  for (const p of PRODUTOS) {
    // insere depois do objeto do produto de referência (antes do próximo "},{k:")
    const ini = js.indexOf(`{k:"${p.depoisDe}",name:`);
    if (ini < 0) throw new Error('produto de referência não achado no JS: ' + p.depoisDe);
    const fim = js.indexOf('},{k:"', ini);
    js = js.slice(0, fim + 1) + ',' + objJs(p) + js.slice(fim + 1);
  }
  const alvoSeg = '"Outra opera\\xe7\\xe3o complexa"]';
  if (js.includes(alvoSeg) && !js.includes('Institui\\xe7\\xe3o de ensino')) js = js.replace(alvoSeg, '"Institui\\xe7\\xe3o de ensino",' + alvoSeg);
  site.set(nome, Buffer.from(js, 'utf8'));
  jsPatched++;
  console.log('[patch] JS da vitrine atualizado: ' + nome);
}
if (!jsPatched) throw new Error('chunk da vitrine de produtos não encontrado');

// 2b. HTML pré-renderizado (mesma marcação que o React gera, para não haver diferença na hidratação)
const h = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const aba = (p) => `<button role="tab" id="pt-${p.k}" aria-selected="false" aria-controls="pp-${p.k}" class="ptab group relative shrink-0 rounded-xl px-4 py-3 text-left lg:py-3.5 transition-colors duration-500 "><span class="flex items-baseline justify-between gap-3"><span class="whitespace-nowrap font-display text-[16px] text-white lg:text-[17px]">${h(p.name)}</span><span class="hidden font-mono text-[10px] uppercase tracking-[.18em] text-mut lg:inline">demo real</span></span><span class="mt-0.5 hidden text-[13.5px] text-mut lg:block">${h(p.sub)}</span></button>`;
const painel = (p) => `<div id="pp-${p.k}" role="tabpanel" aria-labelledby="pt-${p.k}" class="pp "><div class="dk frame overflow-hidden rounded-[18px] bg-g0 shadow-[0_30px_80px_-30px_rgba(14,18,23,.45)]"><div class="flex items-center gap-2 border-b border-white/[.06] px-4 py-2.5"><span class="h-2.5 w-2.5 rounded-full bg-white/10"></span><span class="h-2.5 w-2.5 rounded-full bg-white/10"></span><span class="h-2.5 w-2.5 rounded-full bg-white/10"></span><span class="ml-3 truncate rounded-md bg-white/[.04] px-3 py-1 font-mono text-[11px] text-mut">app.ravo / <!-- -->${h(p.path)}</span><span class="ml-auto hidden font-mono text-[10px] uppercase tracking-[.18em] text-mut sm:inline">Dados de demonstração</span></div><div class="relative aspect-[16/10] bg-g1">${p.shots.map(([s, l], i) => `<img src="${s}" alt="${h(p.name)}: ${h(l)}" width="1200" height="750" loading="lazy" decoding="async" class="shot absolute inset-0 h-full w-full object-cover object-center ${i === 0 ? 'on' : ''}"/>`).join('')}</div></div><div class="mt-3 flex min-h-[20px] items-center justify-between gap-4 text-[13px] text-mut"><span>${h(p.shots[0][1])}</span><span class="flex gap-1.5">${p.shots.map((_, i) => `<button aria-label="Tela ${i + 1}" class="dot h-1.5 rounded-full transition-all duration-500 ${i === 0 ? 'w-6 bg-em' : 'w-1.5 bg-white/15'}"></button>`).join('')}</span></div><div class="mt-8"><p class="font-mono text-xs uppercase tracking-[.2em] text-em">${h(p.name)}</p><h3 class="mt-3 font-display text-2xl font-medium text-white sm:text-3xl">${h(p.sub)}</h3><p class="mt-3 max-w-2xl leading-relaxed text-mut">${h(p.d)}</p><ul class="mt-5 grid gap-3 sm:grid-cols-2">${p.items.map((t) => `<li class="flex gap-3 text-[14.5px] leading-snug text-[#C5CED3]"><span class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-em"></span>${h(t)}</li>`).join('')}</ul></div></div>`;

let html = site.get('index.html').toString('utf8');
for (const p of PRODUTOS) {
  // a aba e o painel entram logo antes da aba/painel que vem depois do produto de referência
  const abaRef = html.indexOf(`<button role="tab" id="pt-${p.depoisDe}"`);
  const abaFim = html.indexOf('</button>', html.indexOf('lg:block', abaRef)) + '</button>'.length;
  html = html.slice(0, abaFim) + aba(p) + html.slice(abaFim);
  const painelRef = html.indexOf(`<div id="pp-${p.depoisDe}"`);
  const proximo = html.indexOf('<div id="pp-', painelRef + 10);
  html = html.slice(0, proximo) + painel(p) + html.slice(proximo);
}
html = html.replace('<option class="bg-g1">Outra operação complexa</option>', `<option class="bg-g1">${SEGMENTO_NOVO}</option><option class="bg-g1">Outra operação complexa</option>`);
site.set('index.html', Buffer.from(html, 'utf8'));
console.log('[patch] HTML da vitrine atualizado');

// ---------- 3. Gravar ----------
for (const [nome, dados] of site) {
  if (!nome || nome.endsWith('/')) continue;
  const dest = join(SAIDA, nome);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, dados);
}
mkdirSync(join(SAIDA, 'produtos'), { recursive: true });
// telas novas: versionadas no repositório público pablloenrii/ravo-site (commit fixo, conferidas por SHA-1)
const BASE_TELAS = 'https://raw.githubusercontent.com/pablloenrii/ravo-site/8cb8d81/assets/produtos/';
const TELAS = {
  'edu-aluno.webp': 'f1435ea7847688ee22c91c531e4a26c5d4dac095',
  'edu-coordenacao.webp': '2ff87e7b607e435505353bb1db0e557b4bd7c643',
  'juriscalc-memoria.webp': 'ab1e88c02f0c78ebfbfe3f7b5a6fe153acf5077a',
  'juriscalc-resultado.webp': 'd250e9c8ef8550493db105d751f74ea4b26383d7',
};
const { createHash } = await import('node:crypto');
for (const [f, sha] of Object.entries(TELAS)) {
  const r = await fetch(BASE_TELAS + f);
  if (!r.ok) throw new Error(`tela ${f}: HTTP ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer());
  if (createHash('sha1').update(b).digest('hex') !== sha) throw new Error(`tela ${f}: conteúdo diferente do esperado`);
  writeFileSync(join(SAIDA, 'produtos', f), b);
}
console.log('[patch] pronto: ' + (site.size + Object.keys(TELAS).length) + ' arquivos em public/');

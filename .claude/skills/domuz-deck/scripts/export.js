#!/usr/bin/env node
/**
 * Domuz デザインシステム v2 — HTML → 自己完結 HTML ＋ PDF ＋ ページ PNG（検査用）
 *
 * domuz_design_system.md §8-2 の Chrome headless と同じ出力を、Chrome が無い環境（Claude Code
 * のクラウドセッション等）でも出せるようにしたもの。加えて:
 *   - <img src> / <link> / <script> のローカス参照を base64 で埋め込み、HTML 単体で完結させる（§8-1 (4)）
 *   - 各 .page を PNG に書き出し、はみ出し（scrollHeight > clientHeight）を検査する（§8-2）
 *
 *   node .claude/skills/domuz-deck/scripts/export.js decks/<name> [--name "YYYYMMDD_テーマ"] [--no-pdf] [--no-png]
 *   node .claude/skills/domuz-deck/scripts/export.js path/to/file.html
 *
 * 出力: <deck>/output/<name>.html, <name>.pdf, preview/page-NN.png（preview は git 管理外）
 * ページサイズは HTML 側の @page（提案資料・発表スライド＝1128×846px、レポート＝A4）に従う。
 * macOS で Chrome があるなら §8-2 のコマンドでも同じ PDF になる。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const args = process.argv.slice(2);
const target = path.resolve(ROOT, args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || 'decks/company-overview');
const src = target.endsWith('.html') ? target : path.join(target, 'index.html');
const deckDir = path.dirname(src);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const name = opt('--name', target.endsWith('.html') ? path.basename(target, '.html') : path.basename(deckDir));
const doPdf = !args.includes('--no-pdf'), doPng = !args.includes('--no-png');

if (!fs.existsSync(src)) { console.error('not found:', src); process.exit(1); }
const outDir = path.join(deckDir, 'output');
fs.mkdirSync(outDir, { recursive: true });

// ---------- 1. 単一 HTML に埋め込み ----------
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const isLocal = (u) => u && !/^(https?:|data:|\/\/|#|mailto:)/i.test(u);
const resolveFrom = (base, u) => path.resolve(path.dirname(base), u.split('?')[0].split('#')[0]);
const dataUri = (p) => `data:${MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(p).toString('base64')}`;

function inlineCss(cssPath, seen = new Set()) {
  if (seen.has(cssPath)) return '';
  seen.add(cssPath);
  let css = fs.readFileSync(cssPath, 'utf8');
  css = css.replace(/@import\s+url\((['"]?)([^'")]+)\1\)\s*;/g, (m, q, u) => (isLocal(u) ? inlineCss(resolveFrom(cssPath, u), seen) : m));
  css = css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => { if (!isLocal(u)) return m; const p = resolveFrom(cssPath, u); return fs.existsSync(p) ? `url("${dataUri(p)}")` : m; });
  return css;
}

let html = fs.readFileSync(src, 'utf8');
let inlined = 0;
html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => { const m = tag.match(/href=["']([^"']+)["']/i); return m && isLocal(m[1]) ? `<style>\n${inlineCss(resolveFrom(src, m[1]))}\n</style>` : tag; });
html = html.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (tag, u) => (isLocal(u) ? `<script>\n${fs.readFileSync(resolveFrom(src, u), 'utf8')}\n</script>` : tag));
html = html.replace(/(<img\s+[^>]*src=["'])([^"']+)(["'])/gi, (m, a, u, b) => { if (!isLocal(u)) return m; const p = resolveFrom(src, u); if (!fs.existsSync(p)) { console.warn('missing image:', u); return m; } inlined++; return `${a}${dataUri(p)}${b}`; });
const outHtml = path.join(outDir, `${name}.html`);
fs.writeFileSync(outHtml, html);
console.log(`html: ${path.relative(ROOT, outHtml)} (${(fs.statSync(outHtml).size / 1024 / 1024).toFixed(1)} MB, ${inlined} images inlined)`);

// ---------- 2. PDF / PNG / はみ出し検査（Chromium） ----------
(async () => {
  if (!doPdf && !doPng) return;
  let pw;
  try { pw = require('playwright'); } catch (e) {
    try { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } catch (e2) { console.error('playwright not found: npm i -g playwright'); process.exit(1); }
  }
  const launch = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) launch.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await pw.chromium.launch(launch).catch(async (e) => { const fb = '/opt/pw-browsers/chromium'; if (fs.existsSync(fb)) return pw.chromium.launch({ ...launch, executablePath: fb }); throw e; });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.warn('[page]', m.text()); });
  await page.goto('file://' + outHtml, { waitUntil: 'load' });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
  await page.waitForTimeout(300);

  // はみ出し検査（§8-2）: scrollHeight > clientHeight の .page を列挙
  // 表紙の透かし（.watermark）は意図的に紙面外へはみ出す設計なので計測から外す
  const over = await page.evaluate(() => {
    const wm = Array.from(document.querySelectorAll('.page .watermark')); wm.forEach((e) => (e.style.display = 'none'));
    const r = Array.from(document.querySelectorAll('.page')).map((p, i) => ({ i: i + 1, over: p.scrollHeight - p.clientHeight, w: p.scrollWidth - p.clientWidth })).filter((x) => x.over > 0 || x.w > 0);
    wm.forEach((e) => (e.style.display = '')); return r;
  });
  const count = await page.evaluate(() => document.querySelectorAll('.page').length);
  if (over.length) console.warn(`OVERFLOW: ${over.map((r) => `page ${r.i} (+${r.over}px${r.w > 0 ? `, +${r.w}px wide` : ''})`).join(', ')}`);
  else console.log(`overflow check: OK (${count} pages)`);

  if (doPdf) {
    await page.emulateMedia({ media: 'print' });
    const outPdf = path.join(outDir, `${name}.pdf`);
    await page.pdf({ path: outPdf, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    console.log(`pdf:  ${path.relative(ROOT, outPdf)} (${(fs.statSync(outPdf).size / 1024 / 1024).toFixed(1)} MB)`);
    await page.emulateMedia({ media: 'screen' });
  }
  if (doPng) {
    const prev = path.join(outDir, 'preview');
    fs.rmSync(prev, { recursive: true, force: true }); fs.mkdirSync(prev, { recursive: true });
    const pages = await page.$$('.page');
    for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: path.join(prev, `page-${String(i + 1).padStart(2, '0')}.png`) });
    console.log(`png:  ${path.relative(ROOT, prev)}/page-01..${String(pages.length).padStart(2, '0')}.png`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

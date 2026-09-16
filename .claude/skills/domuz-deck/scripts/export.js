#!/usr/bin/env node
/**
 * Export an HTML deck → self-contained HTML + PDF (+ per-slide PNG previews for QA).
 *
 *   node .claude/skills/domuz-deck/scripts/export.js decks/company-overview [--name "Domuz_会社概要_2026-09"] [--no-pdf] [--no-png]
 *
 * Reads  decks/<deck>/index.html
 * Writes decks/<deck>/output/<name>.html   (CSS, JS, images inlined — safe to send as one file)
 *        decks/<deck>/output/<name>.pdf    (one 10in × 7.5in page per slide, via Chromium)
 *        decks/<deck>/output/preview/slide-NN.png + contact-sheet.png (QA only, git-ignored)
 *
 * Uses the globally installed playwright if the repo has none (PLAYWRIGHT_BROWSERS_PATH is honoured).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const args = process.argv.slice(2);
// positional arg: a deck directory (containing index.html) or a path to an .html file
const target = path.resolve(ROOT, args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || 'decks/company-overview');
const src = target.endsWith('.html') ? target : path.join(target, 'index.html');
const deckDir = path.dirname(src);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const name = opt('--name', target.endsWith('.html') ? path.basename(target, '.html') : path.basename(deckDir));
const doPdf = !args.includes('--no-pdf'), doPng = !args.includes('--no-png');

if (!fs.existsSync(src)) { console.error('not found:', src); process.exit(1); }
const outDir = path.join(deckDir, 'output');
fs.mkdirSync(outDir, { recursive: true });

// ---------- 1. inline into a single HTML ----------
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const isLocal = (u) => u && !/^(https?:|data:|\/\/|#|mailto:)/i.test(u);
const resolveFrom = (base, u) => path.resolve(path.dirname(base), u.split('?')[0].split('#')[0]);

function inlineCss(cssPath, seen = new Set()) {
  if (seen.has(cssPath)) return '';
  seen.add(cssPath);
  let css = fs.readFileSync(cssPath, 'utf8');
  // @import url("local.css") → recurse; remote imports stay
  css = css.replace(/@import\s+url\((['"]?)([^'")]+)\1\)\s*;/g, (m, q, u) => (isLocal(u) ? inlineCss(resolveFrom(cssPath, u), seen) : m));
  // url(local asset) → data URI
  css = css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => {
    if (!isLocal(u)) return m;
    const p = resolveFrom(cssPath, u); if (!fs.existsSync(p)) return m;
    return `url("data:${MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(p).toString('base64')}")`;
  });
  return css;
}

let html = fs.readFileSync(src, 'utf8');
let inlinedAssets = 0;
html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
  const m = tag.match(/href=["']([^"']+)["']/i); if (!m || !isLocal(m[1])) return tag;
  return `<style>\n${inlineCss(resolveFrom(src, m[1]))}\n</style>`;
});
html = html.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (tag, u) => {
  if (!isLocal(u)) return tag;
  return `<script>\n${fs.readFileSync(resolveFrom(src, u), 'utf8')}\n</script>`;
});
html = html.replace(/(<img\s+[^>]*src=["'])([^"']+)(["'])/gi, (m, a, u, b) => {
  if (!isLocal(u)) return m;
  const p = resolveFrom(src, u); if (!fs.existsSync(p)) { console.warn('missing image:', u); return m; }
  inlinedAssets++;
  return `${a}data:${MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(p).toString('base64')}${b}`;
});
const outHtml = path.join(outDir, `${name}.html`);
fs.writeFileSync(outHtml, html);
console.log(`html: ${path.relative(ROOT, outHtml)} (${(fs.statSync(outHtml).size / 1024 / 1024).toFixed(1)} MB, ${inlinedAssets} images inlined)`);

// ---------- 2. PDF + PNG via Chromium ----------
(async () => {
  if (!doPdf && !doPng) return;
  let pw;
  try { pw = require('playwright'); } catch (e) {
    try { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } catch (e2) { console.error('playwright not found: npm i -g playwright (browser: PLAYWRIGHT_BROWSERS_PATH)'); process.exit(1); }
  }
  const launch = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) launch.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await pw.chromium.launch(launch).catch(async (e) => {
    const fallback = '/opt/pw-browsers/chromium';
    if (fs.existsSync(fallback)) return pw.chromium.launch({ ...launch, executablePath: fallback });
    throw e;
  });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.warn('[page]', m.text()); });
  await page.goto('file://' + outHtml, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts ? document.fonts.ready : null);
  await page.waitForTimeout(300);
  const count = await page.evaluate(() => document.querySelectorAll('.slide').length);

  if (doPdf) {
    await page.emulateMedia({ media: 'print' });
    // re-render charts at print geometry
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(200);
    const outPdf = path.join(outDir, `${name}.pdf`);
    await page.pdf({ path: outPdf, width: '10in', height: '7.5in', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    console.log(`pdf:  ${path.relative(ROOT, outPdf)} (${count} slides, ${(fs.statSync(outPdf).size / 1024 / 1024).toFixed(1)} MB)`);
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  }

  if (doPng) {
    const prev = path.join(outDir, 'preview');
    fs.rmSync(prev, { recursive: true, force: true }); fs.mkdirSync(prev, { recursive: true });
    await page.setViewportSize({ width: 1040, height: 800 });
    await page.evaluate(() => { document.querySelector('.deck').style.setProperty('--scale', 1); });
    await page.waitForTimeout(200);
    const slides = await page.$$('.slide');
    for (let i = 0; i < slides.length; i++) {
      await slides[i].screenshot({ path: path.join(prev, `slide-${String(i + 1).padStart(2, '0')}.png`) });
    }
    console.log(`png:  ${path.relative(ROOT, prev)}/slide-01..${String(slides.length).padStart(2, '0')}.png`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

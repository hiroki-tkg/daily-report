#!/usr/bin/env node
/**
 * design-system/tokens.json → design-system/html/tokens.css
 *
 * Generates CSS custom properties so HTML decks read the same values as the
 * pptx renderer. Run after editing tokens.json:
 *   node .claude/skills/domuz-deck/scripts/tokens-to-css.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'design-system', 'tokens.json'), 'utf8'));
const out = path.join(ROOT, 'design-system', 'html', 'tokens.css');

const lines = [];
lines.push(`/* GENERATED from design-system/tokens.json v${tokens.version} (${tokens.updated}) — do not edit by hand. */`);
lines.push(':root {');

lines.push('  /* colors */');
for (const [k, v] of Object.entries(tokens.color)) lines.push(`  --c-${k}: #${v};`);
lines.push('  /* semantic colors */');
for (const [k, v] of Object.entries(tokens.semantic)) {
  if (Array.isArray(v)) v.forEach((c, i) => lines.push(`  --s-${k}-${i + 1}: var(--c-${c});`));
  else lines.push(`  --s-${k}: var(--c-${v});`);
}

lines.push('  /* fonts */');
const q = (f) => `"${f}"`;
const latinStack = [tokens.font.latin, ...tokens.font['latin-fallbacks']].map(q).join(', ');
const jaStack = [tokens.font.japanese, ...tokens.font['japanese-fallbacks']].map(q).join(', ');
lines.push(`  --font-latin: ${latinStack};`);
lines.push(`  --font-display: ${q(tokens.font['latin-display'])}, ${latinStack};`);
lines.push(`  --font-ja: ${jaStack};`);
// Latin first so digits/ASCII use Century Gothic, Japanese glyphs fall through to Hiragino
lines.push(`  --font-body: ${latinStack}, ${jaStack}, sans-serif;`);

lines.push('  /* type scale (pt) */');
for (const [k, t] of Object.entries(tokens.type)) {
  lines.push(`  --t-${k}-size: ${t.size}pt;`);
  lines.push(`  --t-${k}-weight: ${t.bold ? 700 : 400};`);
  lines.push(`  --t-${k}-spacing: ${t.spacing || 0}pt;`);
  lines.push(`  --t-${k}-color: var(--c-${t.color});`);
  if (t.lineSpacingMultiple) lines.push(`  --t-${k}-lh: ${t.lineSpacingMultiple};`);
}

lines.push('  /* layout (in) */');
const L = tokens.layout;
lines.push(`  --slide-w: ${L[L.default].width}in;`);
lines.push(`  --slide-h: ${L[L.default].height}in;`);
lines.push(`  --slide-w-wide: ${L.wide.width}in;`);
for (const k of ['margin', 'chrome-inset', 'header-y', 'footer-y', 'title-top', 'content-top', 'content-bottom', 'gutter', 'card-padding', 'min-gap']) lines.push(`  --l-${k}: ${L[k]}in;`);

lines.push('  /* radius (pt) */');
for (const [k, v] of Object.entries(tokens.radius)) lines.push(`  --r-${k}: ${v}pt;`);
lines.push('  /* strokes (pt) */');
for (const [k, v] of Object.entries(tokens.stroke)) lines.push(`  --stroke-${k}: ${v}pt;`);
lines.push('}');

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log('wrote', path.relative(ROOT, out), `(${lines.length} lines)`);

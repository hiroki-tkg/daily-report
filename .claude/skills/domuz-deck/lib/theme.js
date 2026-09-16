/**
 * Domuz Design System — pptxgenjs theme helper
 *
 * Reads design-system/tokens.json and exposes slide primitives that follow
 * DESIGN_SYSTEM.md. Deck scripts (decks/<name>/build.js) should only call
 * these helpers; if a value needs to change, change tokens.json, not this file.
 *
 * Usage:
 *   const { createDeck } = require('<repo>/.claude/skills/domuz-deck/lib/theme');
 *   const deck = createDeck({ audience: 'financial' });
 *   deck.addCover({ ... });
 *   const s = deck.addContent({ eyebrow: 'Our Business', title: '運営サービス' });
 *   await s.photo(deck.asset('photos/plant-01.jpg'), { x: 1, y: 2, w: 3, h: 2 });
 *   await deck.save('decks/company-overview/output/Domuz_会社概要.pptx');
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const TOKENS_PATH = path.join(ROOT, 'design-system', 'tokens.json');
const ASSETS_DIR = path.join(ROOT, 'design-system', 'assets');
const POSTPROCESS = path.join(__dirname, 'postprocess.py');

const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));

let pptxgen; // lazy — resolved from repo root node_modules
function requirePptx() {
  if (!pptxgen) pptxgen = require(require.resolve('pptxgenjs', { paths: [ROOT, __dirname] }));
  return pptxgen;
}
function requireSharp() {
  return require(require.resolve('sharp', { paths: [ROOT, __dirname] }));
}

/** Resolve a color token (or pass through a raw 6-digit hex). */
function color(name) {
  if (!name) return undefined;
  if (tokens.color[name]) return tokens.color[name];
  if (tokens.semantic[name] && typeof tokens.semantic[name] === 'string') return color(tokens.semantic[name]);
  if (/^[0-9A-Fa-f]{6}$/.test(name)) return name.toUpperCase();
  throw new Error(`Unknown color token: ${name}`);
}

/** Resolve a type style from tokens.type into pptxgenjs text options. */
function typeStyle(name, overrides = {}) {
  const t = tokens.type[name];
  if (!t) throw new Error(`Unknown type style: ${name}`);
  const o = {
    fontFace: tokens.font.latin,
    fontSize: t.size,
    bold: !!t.bold,
    charSpacing: t.spacing || 0,
    color: color(t.color),
  };
  if (t.lineSpacingMultiple) o.lineSpacingMultiple = t.lineSpacingMultiple;
  return Object.assign(o, overrides);
}

const pt = (p) => p / 72; // points → inches

function createDeck(opts = {}) {
  const Pptx = requirePptx();
  const audience = tokens.audience[opts.audience || 'financial'] || tokens.audience.financial;
  const layoutName = opts.layout || tokens.layout.default;
  const L = tokens.layout[layoutName];
  const scale = L.width / tokens.layout.standard.width; // horizontal scale for wide layouts

  const pres = new Pptx();
  pres.defineLayout({ name: 'DOMUZ', width: L.width, height: L.height });
  pres.layout = 'DOMUZ';
  pres.author = tokens.text['company-en'];
  pres.company = tokens.text['company-en'];
  pres.title = opts.title || '';
  pres.lang = 'ja-JP';

  const W = L.width, H = L.height;
  const M = tokens.layout.margin;
  const CW = W - 2 * M; // content width
  const showHeader = opts.header !== undefined ? opts.header : audience.header;
  const confidential = opts.confidential !== undefined ? opts.confidential : audience.header;
  const cardTone = audience.card === 'card-cool' ? 'cool' : 'warm';

  let slideCount = 0;

  // ---------- chrome ----------
  function chrome(slide, { header = showHeader, footer = true, pageNumber = true, dark = false } = {}) {
    const c = dark ? color('green-200') : color('gray-500');
    const st = typeStyle('chrome', { color: c, isTextBox: true, margin: 0 });
    if (header) {
      slide.addText(tokens.text['company-en'], { ...st, x: M, y: tokens.layout['header-y'] - 0.1, w: 3, h: 0.2, align: 'left' });
      if (confidential) {
        slide.addText(tokens.text.confidential, { ...st, x: W - M - 3, y: tokens.layout['header-y'] - 0.1, w: 3, h: 0.2, align: 'right' });
      }
    }
    if (footer) {
      slide.addText(tokens.text.copyright, { ...st, x: M, y: tokens.layout['footer-y'] - 0.1, w: 5, h: 0.2, align: 'left' });
    }
    if (pageNumber) {
      slide.slideNumber = { x: W - M - 1, y: tokens.layout['footer-y'] - 0.1, w: 1, h: 0.2, align: 'right', fontFace: tokens.font.latin, fontSize: tokens.type.chrome.size, color: c, margin: 0 };
    }
  }

  // ---------- helpers bound to a slide ----------
  function bind(slide) {
    const ctx = {
      slide, W, H, M, CW,
      top: tokens.layout['content-top'],
      bottom: tokens.layout['content-bottom'],
      gutter: tokens.layout.gutter,
      pad: tokens.layout['card-padding'],

      /** Plain or rich text. `style` is a tokens.type key. */
      text(content, o = {}) {
        const { style = 'body', x, y, w, h, ...rest } = o;
        const base = typeStyle(style);
        if (rest.color) rest.color = color(rest.color);
        if (rest.fill) rest.fill = { color: color(rest.fill) };
        const opt = { ...base, x, y, w, h, isTextBox: true, margin: 0, valign: 'top', align: 'left', ...rest };
        if (Array.isArray(content)) {
          content = content.map((r) => {
            // style first, then the run's own overrides win
            const { style: rs, ...own } = r.options || {};
            const ro = rs ? { ...typeStyle(rs), ...own } : { ...own };
            if (ro.color) ro.color = color(ro.color);
            if (!ro.fontFace) ro.fontFace = tokens.font.latin;
            return { text: r.text, options: ro };
          });
        }
        slide.addText(content, opt);
        return ctx;
      },

      heading(str, o = {}) { return ctx.text(str, { style: 'heading-ja', h: 0.35, ...o }); },
      label(str, o = {}) { return ctx.text(str, { style: 'label', h: 0.22, ...o }); },
      caption(en, ja, o = {}) {
        const runs = [];
        if (en) runs.push({ text: en.toUpperCase(), options: { style: 'caption' } });
        if (en && ja) runs.push({ text: '  ', options: { style: 'caption' } });
        if (ja) runs.push({ text: ja, options: { style: 'caption', charSpacing: 0.5 } });
        return ctx.text(runs, { style: 'caption', h: 0.22, ...o });
      },

      /** Rounded card. tone: warm | warm-deep | cool | emphasis | paper | sand */
      card(o) {
        const tones = { warm: 'beige-100', 'warm-deep': 'beige-200', cool: 'gray-100', emphasis: 'green-900', paper: 'paper', sand: 'sand-300', auto: cardTone === 'cool' ? 'gray-100' : 'beige-100' };
        const { x, y, w, h, tone = 'auto', radius = tokens.radius.card, border } = o;
        const opt = { x, y, w, h, fill: { color: color(tones[tone] || tone) }, rectRadius: pt(radius), line: border ? { color: color(border), width: tokens.stroke.rule } : { color: color(tones[tone] || tone), width: 0 } };
        slide.addShape(pres.shapes.ROUNDED_RECTANGLE, opt);
        return ctx;
      },

      /** Small pill badge: PLAN 1 / 案 A. tone: solid | soft */
      badge(str, o = {}) {
        const { x, y, w = 0.75, h = 0.28, tone = 'solid' } = o;
        const bg = tone === 'solid' ? color('badge') : color('green-100');
        const fg = tone === 'solid' ? color('badge-text') : color('green-800');
        slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: bg }, line: { color: bg, width: 0 }, rectRadius: pt(tokens.radius.badge) });
        slide.addText(str, { ...typeStyle('badge', { color: fg }), x, y, w, h, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
        return ctx;
      },

      /** Horizontal hairline. */
      rule(o) {
        const { x, y, w, color: c = 'rule', width = tokens.stroke.rule } = o;
        slide.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color: color(c), width } });
        return ctx;
      },

      /** Straight arrow (or plain line) between two points. */
      arrow(o) {
        const { x1, y1, x2, y2, color: c = 'ink-900', width = 1.25, head = true, both = false, dash } = o;
        const x = Math.min(x1, x2), y = Math.min(y1, y2);
        const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
        const flipH = x2 < x1, flipV = y2 < y1;
        const line = { color: color(c), width };
        if (head) line.endArrowType = 'triangle';
        if (both) line.beginArrowType = 'triangle';
        if (dash) line.dashType = dash;
        slide.addShape(pres.shapes.LINE, { x, y, w, h, line, flipH, flipV });
        return ctx;
      },

      /** Diagram box with centered text. */
      box(str, o = {}) {
        const { x, y, w, h, tone = 'paper', border = 'gray-200', radius = tokens.radius['diagram-box'], size = 10.5, bold = false, color: fg = 'ink-900', borderWidth = tokens.stroke.rule } = o;
        const tones = { warm: 'beige-100', 'warm-deep': 'beige-200', cool: 'gray-100', emphasis: 'green-900', paper: 'paper', sand: 'sand-300' };
        slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: color(tones[tone] || tone) }, line: border ? { color: color(border), width: borderWidth } : { color: color(tones[tone] || tone), width: 0 }, rectRadius: pt(radius) });
        if (str) slide.addText(str, { fontFace: tokens.font.latin, fontSize: size, bold, color: color(fg), x, y, w, h, align: 'center', valign: 'middle', isTextBox: true, margin: 0.04, charSpacing: 0.5 });
        return ctx;
      },

      /** Circle with centered text (career steps etc.). */
      circle(str, o = {}) {
        const { x, y, d, tone = 'warm', size = 10.5, bold = true, color: fg = 'ink-900' } = o;
        const tones = { warm: 'beige-100', 'warm-deep': 'beige-200', cool: 'gray-100', emphasis: 'green-900', paper: 'paper' };
        slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: color(tones[tone] || tone) }, line: { color: color(tones[tone] || tone), width: 0 } });
        if (str) slide.addText(str, { fontFace: tokens.font.latin, fontSize: size, bold, color: color(fg), x: x + 0.1, y, w: d - 0.2, h: d, align: 'center', valign: 'middle', isTextBox: true, margin: 0, lineSpacingMultiple: 1.3 });
        return ctx;
      },

      /** KPI: big number + unit + label. */
      kpi(o) {
        const { x, y, w, value, unit = '', label = '', note = '', color: c = 'number-emphasis', size = tokens.type.kpi.size, align = 'left' } = o;
        let yy = y;
        if (label) { ctx.text(label, { style: 'label', x, y: yy, w, h: 0.22, align }); yy += 0.28; }
        const runs = [{ text: String(value), options: typeStyle('kpi', { color: color(c), fontSize: size }) }];
        if (unit) runs.push({ text: ' ' + unit, options: typeStyle('kpi-unit', { color: color('ink-700') }) });
        slide.addText(runs, { x, y: yy, w, h: size / 72 * 1.25, align, valign: 'bottom', isTextBox: true, margin: 0 });
        yy += size / 72 * 1.25 + 0.05;
        if (note) ctx.text(note, { style: 'body-small', x, y: yy, w, h: 0.4, align, color: 'gray-500' });
        return ctx;
      },

      /** Outlined / filled note box with optional title. tone: outline | fill */
      note(body, o = {}) {
        const { x, y, w, h, tone = 'outline', title } = o;
        if (tone === 'outline') {
          slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: color('paper') }, line: { color: color('green-500'), width: tokens.stroke['note-border'] }, rectRadius: pt(tokens.radius.note) });
        } else {
          slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: color('beige-200') }, line: { color: color('beige-200'), width: 0 }, rectRadius: pt(tokens.radius.note) });
        }
        const runs = [];
        if (title) runs.push({ text: title + '\n', options: { fontFace: tokens.font.latin, fontSize: 10, bold: true, color: color('green-800') } });
        runs.push({ text: body, options: typeStyle('body-small') });
        slide.addText(runs, { x: x + 0.18, y: y + 0.12, w: w - 0.36, h: h - 0.24, isTextBox: true, margin: 0, valign: 'middle' });
        return ctx;
      },

      /**
       * Photo with cover-crop and rounded corners (or circle). Async.
       * radius: points (default tokens.radius.photo) or 'circle' or 0.
       */
      async photo(src, o) {
        const sharp = requireSharp();
        const { x, y, w, h, radius = tokens.radius.photo, caption, captionJa, fit = 'cover', dpi = 150 } = o;
        const pw = Math.round(w * dpi), ph = Math.round(h * dpi);
        let img = sharp(src).rotate();
        if (fit === 'cover') img = img.resize(pw, ph, { fit: 'cover', position: o.position || 'centre' });
        else img = img.resize(pw, ph, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } });
        let buf;
        if (radius === 'circle') {
          const d = Math.min(pw, ph);
          const mask = Buffer.from(`<svg width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}"/></svg>`);
          buf = await img.resize(d, d, { fit: 'cover' }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
        } else if (radius > 0) {
          const r = Math.round(radius / 72 * dpi);
          const mask = Buffer.from(`<svg width="${pw}" height="${ph}"><rect x="0" y="0" width="${pw}" height="${ph}" rx="${r}" ry="${r}"/></svg>`);
          buf = await img.composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
        } else {
          buf = await img.jpeg({ quality: 88 }).toBuffer();
        }
        const mime = radius === 0 ? 'image/jpeg' : 'image/png';
        slide.addImage({ data: `${mime};base64,` + buf.toString('base64'), x, y, w: radius === 'circle' ? Math.min(w, h) : w, h: radius === 'circle' ? Math.min(w, h) : h, altText: o.alt || path.basename(src) });
        if (caption || captionJa) ctx.caption(caption, captionJa, { x, y: y + h + 0.06, w });
        return ctx;
      },

      /** Logo or transparent PNG, contained (no crop, no rounding). Async. */
      async logo(src, o) {
        const sharp = requireSharp();
        const { x, y, w, h, dpi = 200 } = o;
        const meta = await sharp(src).metadata();
        const boxAR = w / h, imgAR = meta.width / meta.height;
        let dw = w, dh = h;
        if (imgAR > boxAR) dh = w / imgAR; else dw = h * imgAR;
        const buf = await sharp(src).resize(Math.round(dw * dpi), Math.round(dh * dpi), { fit: 'inside' }).png().toBuffer();
        slide.addImage({ data: 'image/png;base64,' + buf.toString('base64'), x: x + (w - dw) / 2, y: y + (h - dh) / 2, w: dw, h: dh, altText: o.alt || path.basename(src) });
        return ctx;
      },

      /**
       * Table. rows: array of arrays (string or {text, options}).
       * headerTone: green | highlight | none. align: per-column array.
       */
      table(rows, o = {}) {
        const { x, y, w, colW, header = true, headerTone = audience['table-header'] === 'table-header-sales' ? 'highlight' : 'green', firstColBold = true, rowH = 0.45, fontSize = 10.5, align = [], firstColFill } = o;
        const ruleC = color('rule');
        const hdrBg = headerTone === 'highlight' ? color('highlight') : headerTone === 'none' ? color('paper') : color('green-100');
        const data = rows.map((r, ri) => r.map((cell, ci) => {
          const c = typeof cell === 'object' && cell !== null && 'text' in cell ? cell : { text: String(cell) };
          const isHdr = header && ri === 0;
          const opt = {
            fontFace: tokens.font.latin, fontSize: isHdr ? fontSize - 0.5 : fontSize,
            color: isHdr ? color('green-800') : (ci === 0 && firstColBold ? color('green-800') : color('ink-700')),
            bold: isHdr || (ci === 0 && firstColBold),
            align: align[ci] || 'left', valign: 'middle', margin: [0.06, 0.1, 0.06, 0.1],
            border: [
              { type: 'solid', pt: tokens.stroke.rule, color: ruleC },
              { type: 'none' },
              { type: 'solid', pt: tokens.stroke.rule, color: ruleC },
              { type: 'none' },
            ],
            ...(c.options || {}),
          };
          if (opt.color && !/^[0-9A-F]{6}$/.test(opt.color)) opt.color = color(opt.color);
          if (isHdr) opt.fill = { color: hdrBg };
          else if (ci === 0 && firstColFill) opt.fill = { color: color(firstColFill) };
          if (opt.fill && typeof opt.fill === 'string') opt.fill = { color: color(opt.fill) };
          return { text: c.text, options: opt };
        }));
        slide.addTable(data, { x, y, w, colW, rowH, autoPage: false });
        return ctx;
      },

      /** Native chart with palette defaults. type: 'bar' | 'line' | 'pie' | 'doughnut' */
      chart(type, data, o = {}) {
        const types = { bar: pres.charts.BAR, line: pres.charts.LINE, pie: pres.charts.PIE, doughnut: pres.charts.DOUGHNUT };
        const palette = tokens.semantic['chart-series'].map(color);
        const opt = {
          chartColors: palette,
          catAxisLabelColor: color('gray-500'), catAxisLabelFontFace: tokens.font.latin, catAxisLabelFontSize: 9,
          valAxisLabelColor: color('gray-500'), valAxisLabelFontFace: tokens.font.latin, valAxisLabelFontSize: 9,
          valGridLine: { color: color('gray-200'), size: 0.5 }, catGridLine: { style: 'none' },
          valAxisLineShow: false, catAxisLineShow: false,
          dataLabelColor: color('gray-500'), dataLabelFontFace: tokens.font.latin, dataLabelFontSize: 8,
          showLegend: false, legendFontFace: tokens.font.latin, legendFontSize: 9, legendColor: color('ink-700'),
          barGapWidthPct: 45,
          ...o,
        };
        slide.addChart(types[type] || type, data, opt);
        return ctx;
      },

      /** Even N-column x positions inside the content width. Returns [{x,w},...] */
      columns(n, o = {}) {
        const { x = M, w = CW, gutter = tokens.layout.gutter } = o;
        const cw = (w - gutter * (n - 1)) / n;
        return Array.from({ length: n }, (_, i) => ({ x: x + i * (cw + gutter), w: cw }));
      },
    };
    return ctx;
  }

  // ---------- slide factories ----------
  function titleBlock(slide, { eyebrow, title, subtitleEn, align = 'center', badge, y = tokens.layout['title-top'] }) {
    const ctx = bind(slide);
    const x = M, w = CW;
    let yy = y;
    if (eyebrow) {
      const label = tokens.text['eyebrow-format'].replace('{LABEL}', eyebrow);
      ctx.text(label, { style: 'eyebrow', x, y: yy, w, h: 0.22, align });
      yy += 0.30;
    }
    if (badge) {
      const bw = Math.max(0.7, badge.length * 0.11 + 0.3);
      ctx.badge(badge, { x, y: yy + 0.06, w: bw });
      ctx.text(title, { style: 'title-ja', x: x + bw + 0.2, y: yy, w: w - bw - 0.2, h: 0.45, align: 'left', valign: 'middle' });
      if (subtitleEn) {
        // inline small English after the JP title is easier as a second box aligned right of a measured title; keep it below for reliability
        ctx.text(subtitleEn, { style: 'subtitle-en', x: x + bw + 0.2, y: yy + 0.5, w: w - bw - 0.2, h: 0.2, align: 'left' });
      }
    } else {
      ctx.text(title, { style: 'title-ja', x, y: yy, w, h: 0.5, align, valign: 'top' });
      if (subtitleEn) ctx.text(subtitleEn, { style: 'subtitle-en', x, y: yy + 0.55, w, h: 0.2, align });
    }
    return ctx;
  }

  const deck = {
    pres, tokens, W, H, M, CW, color, pt, typeStyle,
    asset: (rel) => path.join(ASSETS_DIR, rel),

    /** Cover. variant: watermark | minimal */
    addCover(o) {
      const { variant = audience.cover, eyebrow, titleJa, subtitleEn, date, author, logos = [], footer = true } = o;
      const slide = pres.addSlide();
      slide.background = { color: color('paper') };
      const ctx = bind(slide);
      slideCount++;
      if (variant === 'watermark') {
        // Signature motif: three rows of huge, near-white "Domuz"
        const rows = 3, fs = 205 * scale;
        const rowH = H / rows;
        for (let i = 0; i < rows; i++) {
          slide.addText('Domuz', { fontFace: tokens.font.latin, fontSize: fs, bold: true, color: color('watermark'), x: -0.05, y: i * rowH - 0.35, w: W + 0.1, h: rowH + 0.5, align: 'center', valign: 'middle', isTextBox: true, margin: 0, charSpacing: 4 });
        }
        if (eyebrow) ctx.text(tokens.text['eyebrow-format'].replace('{LABEL}', eyebrow.toUpperCase()), { style: 'eyebrow', x: M + 0.2, y: 2.35, w: 6, h: 0.25 });
        ctx.text(titleJa, { style: 'cover-title-ja', x: M + 0.2, y: 2.7, w: W - 2 * M - 0.4, h: 1.5, valign: 'top', lineSpacingMultiple: 1.25 });
        if (subtitleEn) ctx.text(subtitleEn.toUpperCase(), { style: 'subtitle-en', x: M + 0.2, y: 4.25, w: W - 2 * M - 0.4, h: 0.25, color: 'green-500', fontSize: 9.5 });
        const metaY = 4.85;
        if (date) ctx.text(date, { style: 'label', x: M + 0.2, y: metaY, w: 3, h: 0.22, color: 'ink-700', charSpacing: 2 });
        if (author) ctx.text(author, { style: 'body-small', x: M + 0.2, y: metaY + 0.3, w: 6, h: 0.5, color: 'ink-700' });
      } else {
        // Minimal (sales proposal) cover
        if (eyebrow) ctx.text(eyebrow.toUpperCase(), { style: 'eyebrow', x: M + 0.2, y: 1.95, w: 6, h: 0.25, charSpacing: 5 });
        ctx.text(titleJa, { style: 'cover-title-ja', x: M + 0.2, y: 2.35, w: W - 2 * M - 0.4, h: 1.5, valign: 'top', lineSpacingMultiple: 1.25, fontSize: 32 });
        if (subtitleEn) ctx.text(subtitleEn.toUpperCase(), { style: 'subtitle-en', x: M + 0.2, y: 3.9, w: W - 2 * M - 0.4, h: 0.25 });
        // the one allowed mint accent
        slide.addShape(pres.shapes.LINE, { x: M + 0.2, y: 4.45, w: 0.7, h: 0, line: { color: color('mint'), width: 3 } });
        const metaY = 4.85;
        if (date) ctx.text(date, { style: 'body-small', x: M + 0.2, y: metaY, w: 4, h: 0.22, color: 'ink-700' });
        if (author) ctx.text(author, { style: 'body-small', x: M + 0.2, y: metaY + 0.28, w: 6, h: 0.3, color: 'ink-700' });
      }
      const logoJobs = logos.map((lg, i) => ctx.logo(lg.path, { x: M + 0.2 + i * 1.6, y: 5.85, w: lg.w || 1.3, h: 0.5 }));
      chrome(slide, { header: false, footer, pageNumber: false });
      return Object.assign(ctx, { ready: Promise.all(logoJobs) });
    },

    /** Full-bleed green section divider. */
    addSection({ en, ja, footer = false }) {
      const slide = pres.addSlide();
      slide.background = { color: color('background-section') };
      const ctx = bind(slide);
      slideCount++;
      ctx.text(en.toUpperCase(), { style: 'section-en', x: M, y: H / 2 - 0.65, w: CW, h: 0.9, align: 'center', valign: 'middle' });
      if (ja) ctx.text(ja, { style: 'section-ja', x: M, y: H / 2 + 0.3, w: CW, h: 0.3, align: 'center' });
      chrome(slide, { header: false, footer, pageNumber: false, dark: true });
      return ctx;
    },

    /** Standard content slide: eyebrow + JP title (+ small EN). Returns ctx. */
    addContent(o = {}) {
      const slide = pres.addSlide();
      slide.background = { color: color('paper') };
      slideCount++;
      const ctx = o.title ? titleBlock(slide, o) : bind(slide);
      if (o.notes) slide.addNotes(o.notes);
      chrome(slide, { header: o.header, footer: o.footer !== false });
      return ctx;
    },

    /** Blank slide with chrome (for fully custom layouts). */
    addBlank(o = {}) {
      const slide = pres.addSlide();
      slide.background = { color: color(o.background || 'paper') };
      slideCount++;
      chrome(slide, { header: o.header, footer: o.footer !== false, dark: !!o.dark });
      return bind(slide);
    },

    /** Closing slide: dark green with company name and URLs. */
    addClosing({ titleEn = 'Domuz', ja, urls = [], footer = true } = {}) {
      const slide = pres.addSlide();
      slide.background = { color: color('background-section') };
      const ctx = bind(slide);
      slideCount++;
      ctx.text(titleEn, { style: 'section-en', x: M, y: H / 2 - 1.1, w: CW, h: 0.9, align: 'center', valign: 'middle', charSpacing: 8 });
      if (ja) ctx.text(ja, { style: 'section-ja', x: M, y: H / 2 - 0.15, w: CW, h: 0.3, align: 'center' });
      urls.forEach((u, i) => ctx.text(u, { style: 'label', x: M, y: H / 2 + 0.45 + i * 0.3, w: CW, h: 0.25, align: 'center', color: 'green-200', charSpacing: 1.5 }));
      chrome(slide, { header: false, footer, pageNumber: false, dark: true });
      return ctx;
    },

    get slideCount() { return slideCount; },

    /** Write the .pptx, then post-process fonts (Hiragino ea font + theme). */
    async save(outPath) {
      const abs = path.isAbsolute(outPath) ? outPath : path.join(ROOT, outPath);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      await pres.writeFile({ fileName: abs });
      execFileSync('python3', [POSTPROCESS, abs], { stdio: 'inherit' });
      return abs;
    },
  };
  return deck;
}

module.exports = { createDeck, tokens, color, typeStyle, pt, ROOT, ASSETS_DIR };

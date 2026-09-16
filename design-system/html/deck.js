/* Domuz Design System — HTML deck runtime
 * - injects header/footer chrome + page numbers per DESIGN_SYSTEM.md §4.7
 * - scales slides to the viewport, keyboard navigation, presentation mode (P)
 * - renders <div class="chart" data-chart="{...}"> as an SVG stacked/grouped column chart
 * No dependencies. Works from file:// and inside the PDF exporter.
 */
(function () {
  'use strict';
  const deck = document.querySelector('.deck');
  if (!deck) return;
  const cfg = {
    company: deck.dataset.company || 'Domuz inc.',
    confidential: deck.dataset.confidential !== 'false',
    header: deck.dataset.header !== 'false' && !deck.classList.contains('deck--internal'),
    copyright: deck.dataset.copyright || 'Copyright (C) Domuz inc, All Rights Reserved.',
  };
  const slides = Array.from(deck.querySelectorAll('.slide'));

  // ---------- chrome ----------
  slides.forEach((s, i) => {
    const n = i + 1;
    const isCover = s.classList.contains('slide--cover') || s.classList.contains('slide--cover-minimal');
    const isSection = s.classList.contains('slide--section') || s.classList.contains('slide--closing');
    const noChrome = s.classList.contains('slide--no-chrome');
    if (noChrome) return;
    if (isSection) { s.classList.add('slide--dark'); }
    if (!isCover && !isSection && cfg.header) {
      const h = document.createElement('div');
      h.className = 'chrome chrome--header';
      h.innerHTML = `<span>${cfg.company}</span><span>${cfg.confidential ? 'Confidential' : ''}</span>`;
      s.appendChild(h);
    }
    const f = document.createElement('div');
    f.className = 'chrome chrome--footer';
    const showNum = !isCover && !isSection;
    f.innerHTML = `<span>${isSection && !s.hasAttribute('data-footer') ? '' : cfg.copyright}</span><span>${showNum ? n : ''}</span>`;
    s.appendChild(f);
  });

  // ---------- scaling ----------
  function fit() {
    if (document.body.classList.contains('present')) {
      const s = slides[0]; if (!s) return;
      const w = parseFloat(getComputedStyle(s).width), h = parseFloat(getComputedStyle(s).height);
      deck.style.setProperty('--scale', Math.min(window.innerWidth / w, window.innerHeight / h));
    } else {
      const s = slides[0]; if (!s) return;
      const w = parseFloat(getComputedStyle(s).width) || 960;
      deck.style.setProperty('--scale', Math.min(1, (window.innerWidth - 48) / w));
    }
  }
  // measure unscaled width once
  slides.forEach((s) => (s.style.zoom = '1'));
  fit();
  slides.forEach((s) => (s.style.zoom = ''));
  window.addEventListener('resize', fit);

  // ---------- navigation ----------
  let cur = 0;
  function show(i) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => s.classList.toggle('current', k === cur));
    if (!document.body.classList.contains('present')) slides[cur].scrollIntoView({ block: 'center' });
    location.hash = '#' + (cur + 1);
  }
  if (/^#\d+$/.test(location.hash)) cur = parseInt(location.hash.slice(1), 10) - 1;
  slides.forEach((s, k) => s.classList.toggle('current', k === cur));
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); show(cur + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(cur - 1); }
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(slides.length - 1);
    else if (e.key.toLowerCase() === 'p') { document.body.classList.toggle('present'); fit(); show(cur); }
    else if (e.key === 'Escape' && document.body.classList.contains('present')) { document.body.classList.remove('present'); fit(); show(cur); }
  });

  // ---------- charts ----------
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const PALETTE = [css('--s-chart-series-1'), css('--s-chart-series-2'), css('--s-chart-series-3'), css('--s-chart-series-4')].filter(Boolean);

  function renderChart(el) {
    let spec; try { spec = JSON.parse(el.dataset.chart); } catch (e) { console.error('bad data-chart', e); return; }
    const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
    const series = spec.series || []; const labels = spec.labels || [];
    const stacked = spec.type !== 'grouped';
    const n = labels.length;
    const legendH = series.length >= 2 ? 22 : 0;
    const pad = { l: 34, r: 8, t: 10 + (spec.lastLabel ? 14 : 0), b: 30 + (spec.groups ? 12 : 0) };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b - legendH;
    const totals = labels.map((_, i) => series.reduce((a, s) => a + (s.values[i] || 0), 0));
    const maxRaw = spec.max || Math.max(...(stacked ? totals : series.flatMap((s) => s.values)));
    const step = spec.step || niceStep(maxRaw);
    const max = Math.ceil(maxRaw / step) * step;
    const y = (v) => pad.t + ih - (v / max) * ih;
    const slot = iw / n; const bw = Math.min(slot * 0.62, 28);
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H - legendH}`); svg.setAttribute('preserveAspectRatio', 'none');
    const g = (cls) => { const e = document.createElementNS(NS, 'g'); e.setAttribute('class', cls); svg.appendChild(e); return e; };
    const grid = g('grid'), axis = g('axis'), bars = g('bars'), lbl = g('labels');
    for (let v = 0; v <= max; v += step) {
      const l = document.createElementNS(NS, 'line'); l.setAttribute('x1', pad.l); l.setAttribute('x2', W - pad.r); l.setAttribute('y1', y(v)); l.setAttribute('y2', y(v)); grid.appendChild(l);
      const t = document.createElementNS(NS, 'text'); t.setAttribute('x', pad.l - 6); t.setAttribute('y', y(v) + 3); t.setAttribute('text-anchor', 'end'); t.textContent = v.toLocaleString(); axis.appendChild(t);
    }
    const tip = document.createElement('div'); tip.className = 'tip';
    labels.forEach((lab, i) => {
      const cx = pad.l + slot * i + slot / 2;
      const t = document.createElementNS(NS, 'text'); t.setAttribute('x', cx); t.setAttribute('y', pad.t + ih + 14); t.setAttribute('text-anchor', 'middle'); t.textContent = lab; axis.appendChild(t);
      let acc = 0;
      const segs = series.map((s, si) => ({ s, si, v: s.values[i] || 0 })).filter((d) => d.v > 0);
      segs.forEach((d, k) => {
        const top = stacked ? acc + d.v : d.v; const base = stacked ? acc : 0;
        const x = stacked ? cx - bw / 2 : cx - bw / 2 + (bw / series.length) * d.si;
        const w = stacked ? bw : bw / series.length - 2;
        const isTop = k === segs.length - 1;
        let y0 = y(top), y1 = y(base);
        if (k > 0 && stacked) y1 -= 2; // 2px surface gap between stacked segments
        const h = Math.max(0.5, y1 - y0);
        const p = document.createElementNS(NS, 'path');
        const r = isTop ? Math.min(4, h, w / 2) : 0; // rounded data-end
        p.setAttribute('d', `M${x},${y1} V${y0 + r} Q${x},${y0} ${x + r},${y0} H${x + w - r} Q${x + w},${y0} ${x + w},${y0 + r} V${y1} Z`);
        p.setAttribute('fill', d.s.color || PALETTE[d.si % PALETTE.length]);
        p.dataset.tip = `${lab} ${d.s.name}: ${d.v.toLocaleString()}${spec.unit || ''}`;
        p.addEventListener('mousemove', (ev) => { tip.textContent = p.dataset.tip; tip.style.left = ev.offsetX + 'px'; tip.style.top = ev.offsetY + 'px'; tip.classList.add('on'); });
        p.addEventListener('mouseleave', () => tip.classList.remove('on'));
        bars.appendChild(p);
        acc += d.v;
      });
      const showLbl = spec.labelEvery ? (i % spec.labelEvery === 0 || i === n - 1) : (spec.lastLabel && i === n - 1) || (spec.labelIndexes || []).includes(i);
      if (showLbl && totals[i] > 0) {
        const t = document.createElementNS(NS, 'text'); t.setAttribute('class', 'value-label'); t.setAttribute('x', cx); t.setAttribute('y', y(totals[i]) - 6); t.setAttribute('text-anchor', 'middle'); t.textContent = totals[i].toLocaleString(); lbl.appendChild(t);
      }
    });
    // optional group row (years) under the category labels: groups = [{label, from, to}]
    (spec.groups || []).forEach((gr) => {
      const x0 = pad.l + slot * gr.from, x1 = pad.l + slot * (gr.to + 1);
      const l = document.createElementNS(NS, 'line'); l.setAttribute('x1', x0 + 3); l.setAttribute('x2', x1 - 3); l.setAttribute('y1', pad.t + ih + 22); l.setAttribute('y2', pad.t + ih + 22); l.setAttribute('stroke', css('--c-gray-200')); axis.appendChild(l);
      const t = document.createElementNS(NS, 'text'); t.setAttribute('class', 'year'); t.setAttribute('x', (x0 + x1) / 2); t.setAttribute('y', pad.t + ih + 34); t.setAttribute('text-anchor', 'middle'); t.textContent = gr.label; axis.appendChild(t);
    });
    el.innerHTML = '';
    el.appendChild(svg); el.appendChild(tip);
    if (legendH) {
      const lg = document.createElement('div'); lg.className = 'legend';
      lg.style.justifyContent = spec.legendAlign || 'flex-end';
      series.forEach((s, si) => { const it = document.createElement('span'); it.innerHTML = `<i style="background:${s.color || PALETTE[si % PALETTE.length]}"></i>${s.name}`; lg.appendChild(it); });
      el.appendChild(lg);
    }
  }
  function niceStep(max) { const raw = max / 5; const p = Math.pow(10, Math.floor(Math.log10(raw))); const m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function renderAll() { document.querySelectorAll('.chart[data-chart]').forEach(renderChart); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderAll); else renderAll();
  window.addEventListener('resize', renderAll);
  window.__deckReady = true;
})();

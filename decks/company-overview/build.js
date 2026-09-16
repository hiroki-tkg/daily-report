/**
 * Domuz 会社概要 — Company Profile deck
 *
 * Built with the Domuz design system (design-system/DESIGN_SYSTEM.md, tokens.json)
 * via .claude/skills/domuz-deck/lib/theme.js.
 *
 * Run:  node decks/company-overview/build.js
 * Out:  decks/company-overview/output/Domuz_会社概要_2026-09.pptx
 *
 * Content source: 会社概要 (2025-07) + 会社概要ページ of the 2026-08 proposals.
 * Update the DATA block below when figures change.
 */
'use strict';
const path = require('path');
const { createDeck } = require(path.join(__dirname, '..', '..', '.claude', 'skills', 'domuz-deck', 'lib', 'theme'));

// ------------------------------------------------------------------ DATA
const DATA = {
  date: '2026.09',
  asOf: '2025年10月現在',
  company: {
    name: '株式会社Domuz', address: '神奈川県川崎市中原区小杉御殿町2-69-6 2F', ceo: '髙木 弘貴',
    founded: '2018年10月（花卉産業DX事業の開始は2021年5月）', capital: '1億円',
    employees: '65名（社員20名、アルバイト43名）※2025年10月現在', bank: 'みずほ銀行',
    services: 'AND PLANTS（観葉植物・生花EC）／ AND FLOWER（フラワーギフトEC）／ ハナイチ（花卉事業者向け卸マーケットプレイス）',
    urls: ['https://domuz.jp/', 'https://andplants.jp/', 'https://hana-ichi.jp/'],
  },
  kpi: { founded: '2018', employees: '65', raised: '4.4', pv: '120', line: '30', sns: '30' },
  // 売上進捗（百万円）。ラベルの付いていない四半期は元資料のグラフからの読み取り値 → 実数に差し替えること
  growth: {
    labels: ["3Q '21", "4Q", "1Q '22", "2Q", "3Q", "4Q", "1Q '23", "2Q", "3Q", "4Q", "1Q '24", "2Q", "3Q", "4Q", "1Q '25", "2Q", "3Q"],
    andplants: [2, 7, 17, 28, 32, 32, 36, 50, 75, 70, 78, 110, 168, 146, 151, 186, 235],
    hanaichi: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 7, 7, 4, 4, 18],
  },
};

// ------------------------------------------------------------------ BUILD
(async () => {
  const deck = createDeck({ audience: 'financial', title: 'Domuz 会社概要' });
  const A = (p) => deck.asset(p);
  const M = deck.M, CW = deck.CW;

  // 1. Cover -------------------------------------------------------------
  const cover = deck.addCover({
    eyebrow: 'Company Profile',
    titleJa: '花卉産業DX／プラットフォーム\n事業概要資料',
    subtitleEn: 'Domuz inc. — Company Profile',
    date: DATA.date,
    author: `${DATA.company.name}　代表取締役　${DATA.company.ceo}`,
    logos: [{ path: A('logos/andplants-logo.png'), w: 1.1 }, { path: A('logos/hanaichi-logo.png'), w: 1.5 }],
  });
  await cover.ready;

  // 2. About ---------------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'About Domuz', title: '花と植物の産業を、テクノロジーで前へ', subtitleEn: 'Flower & plant industry DX platform', align: 'center' });
    const y = s.top + 0.1;
    await s.photo(A('photos/kv-andplants-greenhouse.jpg'), { x: M, y, w: 4.35, h: 2.3 });
    s.caption('AND PLANTS', '観葉植物・お花のオンラインストア', { x: M, y: y + 2.36, w: 4.35 });
    s.text(
      '観葉植物・お花のオンラインストア「AND PLANTS」を運営し、パーソナル診断による植物選びと、育てやすさに寄り添ったプロダクト・サポートを提供しています。\n\n' +
      '自社の花拠点から全国へ配送するフラワーギフト事業では、母の日・国際女性デーなど季節の企画を毎年展開。ECで培った品質管理・物流ノウハウを活かし、法人さまの一斉配送ギフトにも対応しています。\n\n' +
      '花卉事業者向けの卸マーケットプレイス「ハナイチ」も運営し、C向け・B向けの両面から花卉産業のDXに取り組んでいます。',
      { x: M + 4.65, y: y - 0.05, w: CW - 4.65, h: 2.85, style: 'body', fontSize: 9.5, lineSpacingMultiple: 1.5 },
    );
    const cols = s.columns(3);
    const cy = 4.75, ch = 1.75;
    const kpis = [
      { label: '創業', value: DATA.kpi.founded, unit: '年', note: '花卉産業DX事業の開始は 2021年' },
      { label: '従業員数', value: DATA.kpi.employees, unit: '名', note: `社員20名・アルバイト43名（${DATA.asOf}）` },
      { label: '累計エクイティ調達額', value: DATA.kpi.raised, unit: '億円', note: 'VC 7社・エンジェル投資家' },
    ];
    kpis.forEach((k, i) => {
      s.card({ x: cols[i].x, y: cy, w: cols[i].w, h: ch });
      s.kpi({ x: cols[i].x + s.pad, y: cy + 0.22, w: cols[i].w - 2 * s.pad, ...k, color: 'green-800', size: 36 });
    });
  }

  // 3. Section -------------------------------------------------------------
  deck.addSection({ en: 'Our Business', ja: '事業内容' });

  // 4. Services ------------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Our Business', title: '運営サービス', subtitleEn: 'Our services', align: 'center' });
    const cols = s.columns(3);
    const y = s.top + 0.05, h = s.bottom - y - 0.1;
    const items = [
      { photo: 'photos/kv-andplants-greenhouse.jpg', logo: null /* KV already carries the logo */, tag: 'C向けEC', name: 'AND PLANTS', ja: '観葉植物・生花D2C',
        body: '2021年より、観葉植物、生花、ドライフラワー、園芸グッズなどを中心に、個体差のある商品でも買いやすい領域特化型D2C事業を展開。' },
      { photo: 'photos/bouquet-04.jpg', logo: null, tag: 'C向け・法人向け', name: 'AND FLOWER', ja: 'フラワーギフトEC',
        body: '自社の花拠点から全国へ配送するフラワーギフト。母の日・国際女性デーなどの季節企画、法人さまの一斉配送ギフト、他社ECへの「花を添えて贈る」オプション提供。' },
      { photo: null, logo: 'logos/hanaichi-logo.png', logoW: 1.7, tag: 'B向けEC', name: 'ハナイチ', ja: '花卉産業向け卸マーケットプレイス',
        body: '生花や植物などを販売する事業者に向けた卸のマーケットプレイス。生花、植物、資材など、花や植物に関わる事業者が必要な商材を販売。' },
    ];
    for (let i = 0; i < 3; i++) {
      const it = items[i], c = cols[i];
      s.card({ x: c.x, y, w: c.w, h });
      const ix = c.x + 0.15, iw = c.w - 0.3, iy = y + 0.15, ih = 1.55;
      if (it.photo) {
        await s.photo(A(it.photo), { x: ix, y: iy, w: iw, h: ih });
        if (it.logo) { s.card({ x: ix + 0.12, y: iy + 0.12, w: it.logoW + 0.2, h: 0.62, tone: 'paper', radius: 6 }); await s.logo(A(it.logo), { x: ix + 0.22, y: iy + 0.18, w: it.logoW, h: 0.5 }); }
      } else {
        s.card({ x: ix, y: iy, w: iw, h: ih, tone: 'paper', radius: 8 });
        await s.logo(A(it.logo), { x: ix + (iw - it.logoW) / 2, y: iy + (ih - 0.6) / 2, w: it.logoW, h: 0.6 });
      }
      let ty = iy + ih + 0.25;
      s.badge(it.tag, { x: ix, y: ty, w: Math.max(0.8, it.tag.length * 0.13 + 0.3), tone: 'soft' });
      ty += 0.42;
      s.text(it.name, { x: ix, y: ty, w: iw, h: 0.32, style: 'heading-ja', fontSize: 15, charSpacing: 1.5 });
      ty += 0.34;
      s.text(it.ja, { x: ix, y: ty, w: iw, h: 0.22, style: 'label', color: 'green-500' });
      ty += 0.36;
      s.text(it.body, { x: ix, y: ty, w: iw, h: h - (ty - y) - 0.15, style: 'body-small', fontSize: 9.5 });
    }
  }

  // 5. AND PLANTS detail ---------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Our Business', title: '観葉植物と花のD2C「AND PLANTS」', subtitleEn: 'andplants.jp', align: 'center' });
    const cols = s.columns(3);
    const y = s.top + 0.05, h = s.bottom - y - 0.1;
    const heads = ['扱っている商品', '特徴的な機能', 'マーケティング'];
    cols.forEach((c, i) => { s.card({ x: c.x, y, w: c.w, h }); s.heading(heads[i], { x: c.x, y: y + 0.18, w: c.w, align: 'center', fontSize: 13 }); });
    // col 1: product grid 3x3 with row labels
    {
      const c = cols[0]; const gx = c.x + 0.22, gw = c.w - 0.44; const tw = (gw - 0.16) / 3, th = tw * 1.25;
      const rows = [['観葉植物', ['plant-01', 'plant-02', 'plant-03']], ['花', ['flower-01', 'flower-02', 'flower-03']], ['資材', ['goods-01', 'goods-02', 'goods-03']]];
      let gy = y + 0.65;
      for (const [lab, imgs] of rows) {
        s.text(lab, { x: c.x, y: gy, w: c.w, h: 0.22, style: 'label', align: 'center', color: 'ink-700', bold: true });
        gy += 0.26;
        for (let k = 0; k < 3; k++) await s.photo(A(`photos/${imgs[k]}.jpg`), { x: gx + k * (tw + 0.08), y: gy, w: tw, h: th, radius: 6 });
        gy += th + 0.14;
      }
    }
    // col 2: features
    {
      const c = cols[1]; const ix = c.x + 0.22, iw = c.w - 0.44; let fy = y + 0.7;
      s.text('個体差があっても\n安心して買える仕組み', { x: c.x, y: fy, w: c.w, h: 0.5, style: 'heading-ja', fontSize: 11.5, align: 'center' });
      fy += 0.6;
      await s.photo(A('photos/plant-04.jpg'), { x: ix, y: fy, w: iw * 0.42, h: 1.1, radius: 6 });
      s.text([{ text: '配送前実物写真\n', options: { style: 'body-small', fontSize: 9, bold: true, color: 'green-800' } }, { text: '実際に届く商品を配送前に写真で確認。樹形を選べる機能なども提供。', options: { style: 'body-small', fontSize: 8.5 } }], { x: ix + iw * 0.42 + 0.12, y: fy, w: iw * 0.58 - 0.12, h: 1.1 });
      fy += 1.35;
      s.text('自社ロジスティクス', { x: c.x, y: fy, w: c.w, h: 0.3, style: 'heading-ja', fontSize: 11.5, align: 'center' });
      fy += 0.38;
      await s.photo(A('photos/greenhouse-01.jpg'), { x: ix, y: fy, w: (iw - 0.08) / 2, h: 0.95, radius: 6 });
      await s.photo(A('photos/flower-hub-02.jpg'), { x: ix + (iw + 0.08) / 2, y: fy, w: (iw - 0.08) / 2, h: 0.95, radius: 6 });
      fy += 1.03;
      s.text('産地と繋がり、自社でビニールハウスや大規模発送拠点を構えることで、質の高い商品管理と発送を実現。', { x: ix, y: fy, w: iw, h: 0.75, style: 'body-small', fontSize: 8.5 });
    }
    // col 3: marketing
    {
      const c = cols[2]; const ix = c.x + 0.22, iw = c.w - 0.44; let my = y + 0.7;
      s.text('ライフスタイル提案', { x: c.x, y: my, w: c.w, h: 0.3, style: 'heading-ja', fontSize: 11.5, align: 'center' });
      my += 0.36;
      await s.photo(A('photos/app-diagnosis-question.png'), { x: c.x + c.w / 2 - 0.95, y: my, w: 0.85, h: 1.45, radius: 6, fit: 'contain' });
      await s.photo(A('photos/app-diagnosis-screen.png'), { x: c.x + c.w / 2 + 0.1, y: my, w: 0.85, h: 1.45, radius: 6, fit: 'contain' });
      my += 1.52;
      s.text('診断機能で、暮らしにぴったりの植物・花を提案。「花や植物のある生活」というライフスタイル自体を訴求。', { x: ix, y: my, w: iw, h: 0.7, style: 'body-small', fontSize: 8.5 });
      my += 0.78;
      s.text('デジタルマーケティング', { x: c.x, y: my, w: c.w, h: 0.3, style: 'heading-ja', fontSize: 11.5, align: 'center' });
      my += 0.4;
      const stats = [['サイト PV', DATA.kpi.pv, '万PV/月'], ['LINE・メルマガ', DATA.kpi.line, '万名'], ['SNS フォロワー', DATA.kpi.sns, '万人']];
      for (const [lab, v, u] of stats) {
        s.text(lab, { x: ix, y: my, w: iw * 0.5, h: 0.3, style: 'label', valign: 'middle' });
        s.text([{ text: v, options: { style: 'kpi', fontSize: 16, color: 'green-800' } }, { text: ' ' + u, options: { style: 'kpi-unit', fontSize: 8.5 } }], { x: ix + iw * 0.5, y: my, w: iw * 0.5, h: 0.3, align: 'right', valign: 'middle' });
        my += 0.34;
      }
    }
  }

  // 6. C x B synergy -------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Our Business', title: 'C向け事業とB向け事業のシナジー', subtitleEn: 'Retail × wholesale', align: 'center' });
    const y = s.top + 0.05, panelH = 3.55;
    s.card({ x: M, y, w: CW, h: panelH, tone: 'warm' });
    const steps = ['生産農家', '卸（市場）', '仲卸', '小売', '消費者'];
    const bw = 1.35, bh = 0.5, gap = (CW - 0.6 - bw * 5) / 4, x0 = M + 0.3;
    const row = async (ry, label, sub, hi, logo, logoW) => {
      s.text([{ text: label, options: { style: 'heading-ja', fontSize: 12 } }, { text: '  ' + sub, options: { style: 'label' } }], { x: x0, y: ry - 0.42, w: 6, h: 0.3, valign: 'middle' });
      for (let i = 0; i < 5; i++) {
        const bx = x0 + i * (bw + gap);
        const isHi = i === hi;
        s.box(steps[i], { x: bx, y: ry, w: bw, h: bh, tone: 'paper', border: isHi ? 'coral' : 'gray-200', borderWidth: isHi ? 1.5 : 0.5, bold: isHi });
        if (i < 4) s.arrow({ x1: bx + bw + 0.04, y1: ry + bh / 2, x2: bx + bw + gap - 0.04, y2: ry + bh / 2, width: 1.25 });
        if (isHi) {
          s.card({ x: bx, y: ry + bh + 0.08, w: bw, h: 0.55, tone: 'paper', radius: 6, border: 'coral' });
          await s.logo(A(logo), { x: bx + (bw - logoW) / 2, y: ry + bh + 0.13, w: logoW, h: 0.45 });
        }
      }
    };
    await row(y + 0.6, 'AND PLANTS EC', '現事業 ｜ C向けEC', 3, 'logos/andplants-logo.png', 0.7);
    s.text('年商 1.1億 → 2.3億 → 5.2億円（2024年9月期）', { x: x0, y: y + 1.78, w: CW - 0.6, h: 0.22, style: 'label', color: 'coral-deep', align: 'right', bold: true });
    s.rule({ x: M + 0.3, y: y + 2.0, w: CW - 0.6, color: 'taupe-400' });
    await row(y + 2.55, 'ハナイチ', '新事業 ｜ B向けEC（マーケットプレイス）', 2, 'logos/hanaichi-logo.png', 1.1);
    s.text('▶ 生花・植物の流れ', { x: M + CW - 2.0, y: y + 0.12, w: 1.8, h: 0.22, style: 'label', align: 'right' });
    // synergy points
    const py = y + panelH + 0.22;
    s.heading('B向け事業を持つことで', { x: M, y: py, w: CW, fontSize: 12 });
    const pts = [
      ['1', '仕入れ力・交渉力が向上し、多様な仕入れが可能に。'],
      ['2', 'ハナイチで余りそうな商品を小売でフラッシュセール（Instagram約16万フォロワー・100万UU/月を活用）し、ロス率を減少。'],
      ['3', 'C向け・B向けの両方を持つことで、小売のみのときよりも多様な商品の販売が可能に。'],
    ];
    pts.forEach(([n, t], i) => {
      const ly = py + 0.4 + i * 0.36;
      s.circle(n, { x: M, y: ly, d: 0.26, tone: 'emphasis', color: 'paper', size: 9 });
      s.text(t, { x: M + 0.38, y: ly, w: CW - 0.38, h: 0.3, style: 'body-small', valign: 'middle' });
    });
  }

  // 7. Growth --------------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Our Growth', title: '売上進捗', subtitleEn: 'Quarterly revenue (JPY million)', align: 'center' });
    const y = s.top;
    s.chart('bar', [
      { name: 'AND PLANTS', labels: DATA.growth.labels, values: DATA.growth.andplants },
      { name: 'ハナイチ', labels: DATA.growth.labels, values: DATA.growth.hanaichi },
    ], { x: M, y, w: CW - 2.3, h: s.bottom - y - 0.15, barDir: 'col', barGrouping: 'stacked', valAxisMinVal: 0, valAxisMaxVal: 300, valAxisMajorUnit: 50, catAxisLabelFontSize: 8, valAxisLabelFormatCode: '#,##0' });
    const kx = M + CW - 2.05, kw = 2.05;
    s.card({ x: kx, y: y + 0.1, w: kw, h: 1.65 });
    s.kpi({ x: kx + 0.2, y: y + 0.28, w: kw - 0.4, label: '2025年 3Q 売上', value: '253', unit: '百万円', color: 'green-800', size: 34 });
    s.card({ x: kx, y: y + 1.95, w: kw, h: 1.25 });
    s.kpi({ x: kx + 0.2, y: y + 2.1, w: kw - 0.4, label: '前年同期比', value: '+45', unit: '%', color: 'coral', size: 28, note: '175 → 253 百万円' });
    // legend with brand marks
    const ly = y + 3.5;
    s.card({ x: kx, y: ly, w: 0.22, h: 0.22, tone: 'green-800', radius: 3 }); s.text('AND PLANTS', { x: kx + 0.32, y: ly, w: 1.6, h: 0.22, style: 'label', valign: 'middle', color: 'ink-700' });
    s.card({ x: kx, y: ly + 0.34, w: 0.22, h: 0.22, tone: 'hanaichi-yellow', radius: 3 }); s.text('ハナイチ', { x: kx + 0.32, y: ly + 0.34, w: 1.6, h: 0.22, style: 'label', valign: 'middle', color: 'ink-700' });
    s.text('単位：百万円 ／ 2025年7月時点', { x: kx, y: ly + 0.8, w: kw, h: 0.4, style: 'caption', charSpacing: 0 });
  }

  // 8. Section: Assets -----------------------------------------------------
  deck.addSection({ en: 'Our Assets', ja: '自社ロジスティクス・発送拠点' });

  // 9. Plant hub -----------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Land / House', title: '観葉植物発送拠点', subtitleEn: 'Plant fulfillment center — Yokohama', align: 'center' });
    const y = s.top + 0.05, ph = 2.75;
    await s.photo(A('photos/greenhouse-sitemap.jpg'), { x: M, y, w: 4.4, h: ph });
    const sw = (CW - 4.4 - 0.2 - 0.15) / 2, sh = (ph - 0.15) / 2;
    const sx = M + 4.4 + 0.2;
    await s.photo(A('photos/greenhouse-01.jpg'), { x: sx, y, w: sw, h: sh });
    await s.photo(A('photos/greenhouse-02.jpg'), { x: sx + sw + 0.15, y, w: sw, h: sh });
    await s.photo(A('photos/greenhouse-03.jpg'), { x: sx, y: y + sh + 0.15, w: sw, h: sh });
    await s.photo(A('photos/greenhouse-04.jpg'), { x: sx + sw + 0.15, y: y + sh + 0.15, w: sw, h: sh });
    const fy = y + ph + 0.25, fh = s.bottom - fy;
    s.card({ x: M, y: fy, w: CW, h: fh, tone: 'cool' });
    const lx = M + 0.3;
    s.text([{ text: '[面積]  ', options: { style: 'heading-ja', fontSize: 11 } }, { text: '約2,850㎡（ビニールハウス4棟）', options: { style: 'body', fontSize: 11 } }], { x: lx, y: fy + 0.3, w: 4, h: 0.3, valign: 'middle' });
    s.text([{ text: '[場所]  ', options: { style: 'heading-ja', fontSize: 11 } }, { text: '神奈川県横浜市都筑区（渋谷駅まで約20km）', options: { style: 'body', fontSize: 11 } }], { x: lx, y: fy + 0.85, w: 4, h: 0.3, valign: 'middle' });
    s.text('観葉植物の発送拠点。2023年3月から運用開始。\n花卉生産農家の生産拠点（ビニールハウス）をそのまま居抜きで賃借中。観葉植物の管理に必要な基本的な設備が備わっています。全国の観葉植物農家さんから仕入れた植物をここで管理、植替、発送しています。', { x: M + 4.6, y: fy + 0.25, w: CW - 4.9, h: fh - 0.4, style: 'body-small', fontSize: 9.5 });
  }

  // 10. Flower hub ---------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Land / House', title: '生花発送拠点', subtitleEn: 'Flower fulfillment centers — Kawasaki', align: 'center' });
    const y = s.top + 0.05, ph = 2.75, pw = (CW - 0.2) / 2;
    await s.photo(A('photos/flower-hub-01.jpg'), { x: M, y, w: pw, h: ph });
    await s.photo(A('photos/flower-hub-02.jpg'), { x: M + pw + 0.2, y, w: pw, h: ph });
    const fy = y + ph + 0.25, fh = s.bottom - fy;
    s.card({ x: M, y: fy, w: CW, h: fh, tone: 'cool' });
    const lx = M + 0.3;
    s.text([{ text: '[面積]  ', options: { style: 'heading-ja', fontSize: 11 } }, { text: '約560㎡（2拠点）', options: { style: 'body', fontSize: 11 } }], { x: lx, y: fy + 0.3, w: 4, h: 0.3, valign: 'middle' });
    s.text([{ text: '[場所]  ', options: { style: 'heading-ja', fontSize: 11 } }, { text: '溝の口駅、川崎駅', options: { style: 'body', fontSize: 11 } }], { x: lx, y: fy + 0.85, w: 4, h: 0.3, valign: 'middle' });
    s.text('生花発送のための拠点を2拠点運用しています。\n大きな冷蔵庫を完備しており、質の高いブーケやアレンジメントの製作・発送を可能にしています。法人様向けの大量発注にも対応可能です。', { x: M + 4.6, y: fy + 0.25, w: CW - 4.9, h: fh - 0.4, style: 'body-small', fontSize: 9.5 });
  }

  // 11. Section: Vision ----------------------------------------------------
  deck.addSection({ en: 'Platform Vision', ja: 'DX／プラットフォーム構想' });

  // 12. Platform map -------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Platform Vision', title: '花卉産業DXを軸としたプラットフォーム', subtitleEn: 'From two marketplaces to an industry platform', align: 'center' });
    const y = s.top + 0.05, h = s.bottom - y - 0.05;
    s.card({ x: M, y, w: CW, h, tone: 'warm' });
    // center column: the two existing businesses
    const cx = M + CW / 2 - 1.15, cw = 2.3, ch = 1.55;
    const c1y = y + 0.45, c2y = y + h - 0.45 - ch;
    const core = async (cy, tag, name, sub, logo, logoW) => {
      s.card({ x: cx, y: cy, w: cw, h: ch, tone: 'paper', radius: 8, border: 'green-800' });
      s.badge(tag, { x: cx + 0.15, y: cy + 0.15, w: 0.85 });
      s.text('現事業', { x: cx + cw - 0.9, y: cy + 0.15, w: 0.75, h: 0.28, style: 'label', align: 'right', valign: 'middle', color: 'green-500' });
      await s.logo(A(logo), { x: cx + (cw - logoW) / 2, y: cy + 0.52, w: logoW, h: 0.45 });
      s.text(name, { x: cx, y: cy + 1.0, w: cw, h: 0.25, style: 'heading-ja', fontSize: 11, align: 'center' });
      s.text(sub, { x: cx, y: cy + 1.24, w: cw, h: 0.22, style: 'label', align: 'center' });
    };
    await core(c1y, 'C向けEC', 'AND PLANTS', '花・植物領域特化EC', 'logos/andplants-logo.png', 0.75);
    await core(c2y, 'B向けEC', 'ハナイチ', '花屋／植物屋向け 仕入れEC', 'logos/hanaichi-logo.png', 1.2);
    s.arrow({ x1: cx + 0.55, y1: c2y - 0.08, x2: cx + 0.55, y2: c1y + ch + 0.08, width: 1.5 });
    s.arrow({ x1: cx + 0.8, y1: c1y + ch + 0.08, x2: cx + 0.8, y2: c2y - 0.08, width: 1.5 });
    s.text('余り商品の販売\n仕入れ力向上\nアセット共有', { x: cx + 1.0, y: c1y + ch + 0.18, w: cw - 1.0, h: c2y - (c1y + ch) - 0.36, style: 'caption', charSpacing: 0, color: 'mocha-700', valign: 'middle', lineSpacingMultiple: 1.35 });
    // satellite cards
    const sat = [
      { x: M + 0.3, y: y + 0.35, name: 'リアル店舗', en: 'RETAIL', body: '観葉植物・花の専門店。OMO施策・送客' },
      { x: M + 0.3, y: y + 2.05, name: 'グリーンレンタル', en: 'GREEN RENTAL', body: '法人向けに社内緑化およびメンテナンス' },
      { x: M + 0.3, y: y + 3.75, name: '生産者ロールアップ', en: 'GROWER ROLL-UP', body: '小売・卸の情報を元に売れる商品を生産。M&A→DX' },
      { x: M + CW - 2.5, y: y + 0.35, name: '高付加価値3PL', en: '3PL', body: '他ジャンルの商材を保管し、高付加価値の梱包発送' },
      { x: M + CW - 2.5, y: y + 2.05, name: '生花イネイブラー', en: 'ENABLER', body: '異業種に花の販売機能を提供 → AND FLOWER ギフトオプションとして提供中', now: true },
      { x: M + CW - 2.5, y: y + 3.75, name: '輸出プラットフォーム', en: 'EXPORT', body: '国内生産者・加工品メーカーと海外サプライヤーを繋ぐ' },
    ];
    for (const k of sat) {
      const kw = 2.2, kh = 1.4;
      s.card({ x: k.x, y: k.y, w: kw, h: kh, tone: 'paper', radius: 8 });
      s.text(k.en, { x: k.x + 0.18, y: k.y + 0.14, w: kw - 0.36, h: 0.2, style: 'subtitle-en', fontSize: 7.5 });
      s.text(k.name, { x: k.x + 0.18, y: k.y + 0.36, w: kw - 0.36, h: 0.28, style: 'heading-ja', fontSize: 11.5 });
      s.text(k.body, { x: k.x + 0.18, y: k.y + 0.68, w: kw - 0.36, h: kh - 0.78, style: 'body-small', fontSize: 8.5 });
      if (k.now) s.badge('一部実現', { x: k.x + kw - 0.95, y: k.y + 0.12, w: 0.8, tone: 'soft' });
      // connector to center column
      const fromLeft = k.x < W2();
      const ax1 = fromLeft ? k.x + kw + 0.04 : k.x - 0.04;
      const ax2 = fromLeft ? cx - 0.06 : cx + cw + 0.06;
      const ay = k.y + kh / 2;
      const target = ay < (c1y + ch + c2y) / 2 ? c1y + ch / 2 : c2y + ch / 2;
      s.arrow({ x1: ax1, y1: ay, x2: ax2, y2: target, color: 'green-500', width: 1, both: true });
    }
    function W2() { return M + CW / 2; }
  }

  // 13. Section: Team ------------------------------------------------------
  deck.addSection({ en: 'Team', ja: 'チーム' });

  // 14. CEO profile --------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Member Profile', title: '代表取締役　髙木 弘貴', subtitleEn: 'Hiroki Takagi — Founder & CEO', align: 'center' });
    const y = s.top + 0.05;
    await s.photo(A('photos/member-takagi.jpg'), { x: M, y, w: 2.9, h: 2.9 });
    s.text(
      '早稲田大学政治経済学部卒業後、タイのバンコクにて旅行系情報／予約サイトで起業。その後、東証プライム上場企業エス・エム・エス創業者の諸藤周平氏が創業したREAPRAグループのベトナム現地法人代表に就任し、ベトナム人向け人材サービス、ベトナム女性向けWEBメディアの立ち上げ、日系大手企業向けの受託開発オフショア拠点開発を行う。\n\n' +
      '2018年に帰国し、株式会社Domuzを創業。システム開発やマーケティング支援を行いながら、1つ目の自社事業としてプログラミングスクールの口コミサイトを立ち上げ、東証グロース上場のGMOメディア社に売却。\n\n' +
      '2つ目の事業として、花卉産業DX／プラットフォーム事業に挑戦中。',
      { x: M + 3.2, y: y - 0.05, w: CW - 3.2, h: 3.0, style: 'body', fontSize: 10, lineSpacingMultiple: 1.55 },
    );
    const steps = ['旅行系\nスタートアップ創業\n@タイ', 'オフショア開発\n会社現地代表\n@ベトナム', 'エンジニア向け\nメディア\n売却', '花卉産業DX・\nプラットフォーム\n事業'];
    const d = 1.45, gap = (CW - d * 4) / 3, cy = 5.05;
    steps.forEach((t, i) => {
      const x = M + i * (d + gap);
      s.circle(t, { x, y: cy, d, tone: 'warm', size: 9.5, color: 'ink-900' });
      if (i < 3) s.arrow({ x1: x + d + 0.08, y1: cy + d / 2, x2: x + d + gap - 0.08, y2: cy + d / 2, color: 'hanaichi-yellow', width: 2 });
    });
  }

  // 15. Members ------------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Team', title: 'メンバー紹介', subtitleEn: 'Core members', align: 'center' });
    const members = [
      { photo: 'member-komatsu', role: '事業開発', name: '小松 泰彦', bio: '東京工業大学環境・社会理工学院建築学系卒業後、ADKマーケティング・ソリューションズに入社。データ分析やメディアプランニングに従事。その後、学生時代にインターンとして関わっていたDomuzへ出戻り入社。' },
      { photo: 'member-suzuki', role: 'リードエンジニア', name: '鈴木 新芽', bio: '東京大学情報理工学修士卒業後、富士通に入社。ネットワークサービスの企画・運用、ブロックチェーンを軸にした新規事業開発を経てREAPRA Venturesに入社。投資先の共通テクノロジー支援を担当。2020年7月Domuzに参画。' },
      { photo: 'member-kadoike', role: '経営企画・HR', name: '門池 金八', bio: '東京大学卒業後、営業職を経て教育分野で起業。その後、教育系スタートアップ企業に参画し、プロダクトマネージャーやCOOなど様々なキャリアを積む。現在の主な専門領域はバックオフィス。2022年よりDomuzに参画。' },
      { photo: 'member-sato', role: 'バイヤー', name: '佐藤 桃子', bio: 'ハウスメーカーで造園・観葉植物などに携わったのち、観葉植物専門店の店長としてトータルでプロデュースを手掛ける。2022年よりアンドプランツに所属。著書に『INTERIOR GREEN 観葉植物と日常』（ブティック社）。他、監修本多数。' },
    ];
    const rowH = (s.bottom - s.top - 0.3) / 2, colW = (CW - 0.3) / 2;
    for (let i = 0; i < 4; i++) {
      const m = members[i];
      const x = M + (i % 2) * (colW + 0.3), y = s.top + Math.floor(i / 2) * (rowH + 0.3);
      s.card({ x, y, w: colW, h: rowH });
      await s.photo(A(`photos/${m.photo}.jpg`), { x: x + 0.25, y: y + (rowH - 1.35) / 2, w: 1.35, h: 1.35, radius: 'circle' });
      const tx = x + 1.85, tw = colW - 1.85 - 0.25;
      s.text(m.role, { x: tx, y: y + 0.28, w: tw, h: 0.22, style: 'label', color: 'green-500' });
      s.text(m.name, { x: tx, y: y + 0.52, w: tw, h: 0.32, style: 'heading-ja', fontSize: 14 });
      s.text(m.bio, { x: tx, y: y + 0.92, w: tw, h: rowH - 1.1, style: 'body-small', fontSize: 8.5, lineSpacingMultiple: 1.45 });
    }
  }

  // 16. Investors ----------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Our Investor', title: '支援いただいているVC／エンジェル投資家', subtitleEn: 'Investors', align: 'center' });
    const y = s.top;
    s.card({ x: M, y, w: CW, h: 1.05, tone: 'cool' });
    s.text([{ text: '累計エクイティ調達額  ', options: { style: 'label', fontSize: 10, color: 'ink-700' } }, { text: '4.4', options: { style: 'kpi', fontSize: 32, color: 'green-800' } }, { text: ' 億円', options: { style: 'kpi-unit', color: 'ink-700' } }, { text: '（累計）', options: { style: 'label' } }], { x: M, y, w: CW, h: 1.05, align: 'center', valign: 'middle' });
    const logos = ['investor-chiba-dojo', 'investor-new-commerce-ventures', 'investor-ffg', 'investor-pola-orbis-capital', 'investor-value-chain-innovation-fund', 'investor-seibu-holdings'];
    const lw = (CW - 0.3 * 5) / 6, ly = y + 1.35;
    for (let i = 0; i < 6; i++) await s.logo(A(`logos/${logos[i]}.png`), { x: M + i * (lw + 0.3), y: ly, w: lw, h: 0.8 });
    s.text('giftee', { x: M, y: ly + 0.95, w: CW, h: 0.25, style: 'label', align: 'center', color: 'ink-700', bold: true, charSpacing: 2 });
    s.rule({ x: M + 1, y: ly + 1.45, w: CW - 2 });
    // angels
    const angels = [
      { photo: 'angel-yanagisawa', org: 'ファンコミュニケーションズ（A8.net）', role: '創業者・元代表取締役社長', name: '柳澤 安慶' },
      { photo: 'angel-sugita', org: 'JMDC', role: '元COO', name: '杉田 玲夢' },
      { photo: null, org: 'DNX Ventures', role: 'Managing Partner / Head of Japan', name: '倉林 陽' },
    ];
    const ay = ly + 1.7, aw = 2.6, agap = (CW - aw * 3) / 2;
    for (let i = 0; i < 3; i++) {
      const a = angels[i], x = M + i * (aw + agap);
      if (a.photo) await s.photo(A(`photos/${a.photo}.jpg`), { x: x + (aw - 1.1) / 2, y: ay, w: 1.1, h: 1.1, radius: 'circle' });
      else s.circle('DNX', { x: x + (aw - 1.1) / 2, y: ay, d: 1.1, tone: 'cool', size: 11, color: 'green-800' });
      s.text(a.org, { x, y: ay + 1.2, w: aw, h: 0.2, style: 'label', align: 'center', fontSize: 8 });
      s.text(a.role, { x, y: ay + 1.4, w: aw, h: 0.2, style: 'label', align: 'center', fontSize: 8, color: 'green-500' });
      s.text(a.name, { x, y: ay + 1.62, w: aw, h: 0.28, style: 'heading-ja', align: 'center', fontSize: 12 });
    }
    s.text('等 その他5名', { x: M, y: ay + 2.0, w: CW, h: 0.22, style: 'label', align: 'center' });
  }

  // 17. Company table ------------------------------------------------------
  {
    const s = deck.addContent({ eyebrow: 'Company', title: '会社概要', subtitleEn: 'Corporate profile', align: 'center' });
    const c = DATA.company;
    const rows = [
      ['会社名', c.name], ['所在地', c.address], ['代表取締役', c.ceo], ['創業', c.founded], ['資本金', c.capital],
      ['従業員数', c.employees], ['主要取引銀行', c.bank], ['運営サービス', c.services], ['URL', c.urls.join('　／　')],
    ];
    s.table(rows, { x: M + 0.6, y: s.top + 0.1, w: CW - 1.2, colW: [1.9, CW - 1.2 - 1.9], header: false, rowH: 0.5, fontSize: 10.5 });
  }

  // 18. Closing ------------------------------------------------------------
  deck.addClosing({ titleEn: 'Domuz', ja: '花卉産業DX／プラットフォーム', urls: DATA.company.urls });

  const out = await deck.save(path.join(__dirname, 'output', `Domuz_会社概要_${DATA.date.replace('.', '-')}.pptx`));
  console.log('written:', out, `(${deck.slideCount} slides)`);
})().catch((e) => { console.error(e); process.exit(1); });

/**
 * Template: 外部営業向け提案書（sales）
 *
 * Cover B（ミニマル）→ バッジ付きタイトル＋写真2枚＋価格 → 比較表 → 会社概要 → クロージング
 * の最小構成。コピーして decks/<name>/build.js にし、DATA を差し替える。
 *
 * Run: node .claude/skills/domuz-deck/templates/sales-proposal.js  (→ /tmp 以下に出力)
 */
'use strict';
const path = require('path');
const { createDeck } = require(path.join(__dirname, '..', 'lib', 'theme'));

const DATA = {
  client: '◯◯様',
  title: 'ミモザギフト 企画のご提案',
  subtitleEn: "International Women's Day / Mimosa Gift",
  date: '2026年8月27日',
  owner: '株式会社Domuz　小松 泰彦',
  plans: [
    { badge: 'PLAN 1', name: 'ミモザ', sub: 'ミモザのみ', price: '¥2,000', photos: ['mimosa-01', 'mimosa-02'] },
    { badge: 'PLAN 2', name: 'ミモザ × ユーカリ', sub: 'グリーンで洗練された印象に', price: '¥2,000', photos: ['mimosa-03', 'mimosa-04'] },
  ],
};

(async () => {
  const deck = createDeck({ audience: 'sales', title: DATA.title });
  const A = (p) => deck.asset(p);
  const M = deck.M, CW = deck.CW;

  // Cover B — minimal
  const cover = deck.addCover({ eyebrow: 'Proposal', titleJa: `${DATA.client}\n${DATA.title}`, subtitleEn: DATA.subtitleEn, date: DATA.date, author: DATA.owner, logos: [{ path: A('logos/andplants-logo.png'), w: 1.0 }] });
  await cover.ready;

  // Plan slides — badge title + two photos + price
  for (const p of DATA.plans) {
    const s = deck.addContent({ eyebrow: 'Plan A ¥2,000', badge: p.badge, title: p.name, subtitleEn: p.sub });
    // price, top right
    s.text([{ text: p.price, options: { style: 'kpi', fontSize: 26, color: 'green-800' } }, { text: ' 税抜・送料別', options: { style: 'kpi-unit', fontSize: 9 } }], { x: M + CW - 3, y: 1.0, w: 3, h: 0.5, align: 'right', valign: 'bottom' });
    const y = s.top + 0.05, ph = s.bottom - y - 0.45, pw = (CW - 0.25) / 2;
    await s.photo(A(`photos/${p.photos[0]}.jpg`), { x: M, y, w: pw, h: ph, caption: 'Wrapping', captionJa: 'ラッピング' });
    await s.photo(A(`photos/${p.photos[1]}.jpg`), { x: M + pw + 0.25, y, w: pw, h: ph, caption: 'In a vase', captionJa: '花瓶に飾った状態' });
  }

  // Comparison table with highlight header (sales default)
  {
    const s = deck.addContent({ eyebrow: 'Comparison', title: '2案の比較', subtitleEn: 'Plan comparison', align: 'center' });
    s.table([
      ['', 'PLAN 1  ミモザ', 'PLAN 2  ミモザ × ユーカリ'],
      ['価格（税抜・送料別）', { text: '¥2,000', options: { color: 'coral', bold: true } }, { text: '¥2,000', options: { color: 'coral', bold: true } }],
      ['花材', 'ミモザ', 'ミモザ、ユーカリ'],
      ['印象', '春らしい黄色一色', 'グリーンで洗練'],
      ['納期', '最短2日で発送', '最短2日で発送'],
    ], { x: M, y: s.top + 0.2, w: CW, colW: [2.4, (CW - 2.4) / 2, (CW - 2.4) / 2], rowH: 0.55, align: ['left', 'center', 'center'] });
    s.note('記載の金額はすべて税抜で、確定値ではなく現時点でのイメージ（概算）です。', { x: M, y: s.top + 3.4, w: CW, h: 0.7, tone: 'fill', title: '※ ご留意点' });
  }

  // Company profile (short)
  {
    const s = deck.addContent({ eyebrow: 'Company', title: '会社概要', subtitleEn: 'AND PLANTS / 株式会社Domuz', align: 'center' });
    s.table([
      ['会社名', '株式会社Domuz'], ['所在地', '神奈川県川崎市中原区小杉御殿町2-69-6 2F'], ['代表取締役', '髙木 弘貴'],
      ['創業', '2018年10月（花卉産業DX事業の開始は2021年5月）'], ['資本金', '1億円'], ['主要取引銀行', 'みずほ銀行'],
    ], { x: M + 1, y: s.top + 0.2, w: CW - 2, colW: [1.8, CW - 3.8], header: false, rowH: 0.5 });
  }

  deck.addClosing({ titleEn: 'AND PLANTS', ja: '株式会社Domuz', urls: ['https://andplants.jp/'] });

  const out = await deck.save(path.join(require('os').tmpdir(), 'domuz-template-sales.pptx'));
  console.log('written:', out);
})().catch((e) => { console.error(e); process.exit(1); });

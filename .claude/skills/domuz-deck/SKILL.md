---
name: domuz-deck
description: Domuz の統一デザインシステムで資料（.pptx）を作る／直す。営業提案・投資家/銀行向け・社内資料のすべてで使う。「資料を作って」「スライドにして」「会社概要をアップデート」「提案書」「デッキ」「pptx」「デザインシステム」と言われたら必ずこのスキルを使う。
---

# domuz-deck — Domuz デザインシステムで資料を作る

このスキルは `design-system/DESIGN_SYSTEM.md`（ルール）と `design-system/tokens.json`（値）を **唯一の基準** として、pptxgenjs で .pptx を生成する。デザインの判断をこの場で新しく発明しない。迷ったら DESIGN_SYSTEM.md を読み直す。

## 手順

1. **基準を読む**（毎回）
   - `design-system/DESIGN_SYSTEM.md` — 特に §0 ひとことで／§2.3 タイトルの組み方／§4.1 スライドの種類／§6 用途別／§8 チェックリスト
   - `design-system/tokens.json` — 値はここから。ハードコードしない
2. **用途を決める** — `sales`（外部営業）/ `financial`（投資家・銀行）/ `internal`（社内）。カード色・表紙・強調色が自動で切り替わる
3. **既存デッキがあれば流用** — `decks/<name>/build.js` をコピーして中身を差し替える。会社概要は `decks/company-overview/build.js` が最も網羅的な見本
4. **構成を先に書く** — 1スライド＝1メッセージ。各スライドを §4.1 の種類のどれかに当てはめる。文字だけのスライドが出たら写真・図・数字を足す
5. **素材を選ぶ** — `design-system/assets/photos|logos/` の自社素材を最優先。無いものはユーザーに写真を依頼する（汎用ストック・AI 画像は使わない。参考用に AI 画像を使うときは「※AI生成によるイメージ画像です」必須）
6. **build.js を書いて実行** — `node decks/<name>/build.js`（下の API 参照）。`deck.save()` が自動で日本語フォント（ヒラギノ）の後処理を行う
7. **検証**（必須）
   - `python3 <pptx-skill>/scripts/office/validate.py decks/<name>/output/*.pptx`
   - `python3 <pptx-skill>/scripts/office/soffice.py --headless --convert-to pdf --outdir decks/<name>/output decks/<name>/output/*.pptx` → `pdftoppm -jpeg -r 80` で全ページを目視。文字はみ出し／重なり／余白の偏り／強調色の混在を直す
   - §8 チェックリストを一通り確認
8. **納品** — .pptx と PDF を `decks/<name>/output/` に置き、SendUserFile で渡す

## API（`.claude/skills/domuz-deck/lib/theme.js`）

```js
const path = require('path');
const { createDeck } = require(path.join(__dirname, '../../.claude/skills/domuz-deck/lib/theme'));

const deck = createDeck({ audience: 'financial', title: '会社概要' }); // layout: 'standard'(4:3, 既定) | 'wide'(16:9)
const A = (p) => deck.asset(p); // design-system/assets/ からの相対パス

// 表紙  variant は audience から自動（sales→minimal, それ以外→watermark）
const cover = deck.addCover({ eyebrow: 'Company Profile', titleJa: '会社概要', subtitleEn: 'Domuz inc.', date: '2026.09', author: '株式会社Domuz', logos: [{ path: A('logos/andplants-logo.png') }] });
await cover.ready;

deck.addSection({ en: 'Our Business', ja: '事業内容' });          // 緑全面の区切り

const s = deck.addContent({ eyebrow: 'Our Business', title: '運営サービス', subtitleEn: 'Our services', align: 'center' });
// バッジ付きタイトル: deck.addContent({ badge: '案 A', title: '祭壇形式', subtitleEn: 'Altar style' })
// s.top(=1.65) 〜 s.bottom(=6.85) がコンテンツ領域。s.M(=0.55) 余白、s.CW(=8.9) 幅、s.columns(3) で等分

s.card({ x, y, w, h, tone: 'warm' | 'warm-deep' | 'cool' | 'emphasis' | 'sand' | 'paper' });  // 角丸10pt。tone省略で audience 既定
s.text('本文', { x, y, w, h, style: 'body' });               // style は tokens.type のキー。runs 配列も可
s.text([{ text: '¥2,000', options: { style: 'kpi' } }, { text: ' 税抜', options: { style: 'kpi-unit' } }], { x, y, w, h });
s.heading('小見出し', { x, y, w });   s.label('ラベル', { x, y, w });   s.caption('Wrapping', 'ラッピング', { x, y, w });
s.badge('PLAN 1', { x, y, w: 0.8, tone: 'solid' | 'soft' });
s.kpi({ x, y, w, label: '累計エクイティ調達額', value: '4.4', unit: '億円', note: '2025年7月時点', color: 'green-800' });
await s.photo(A('photos/plant-01.jpg'), { x, y, w, h, radius: 8 | 0 | 'circle', caption: 'Plants', captionJa: '観葉植物' }); // cover-crop
await s.logo(A('logos/hanaichi-logo.png'), { x, y, w, h });                                 // contain、角丸なし
s.table([['項目', '値'], ['会社名', '株式会社Domuz']], { x, y, w, colW: [2, 6.9], headerTone: 'green' | 'highlight' | 'none', align: ['left', 'right'] });
s.chart('bar', [{ name: 'AND PLANTS', labels: [...], values: [...] }], { x, y, w, h, barDir: 'col', barGrouping: 'stacked' });
s.note('※ 注記本文', { x, y, w, h, tone: 'outline' | 'fill', title: '※ ご留意点' });
s.box('生産農家', { x, y, w, h, tone: 'paper', border: 'gray-200' });   // 図のボックス
s.circle('旅行系\nスタートアップ創業', { x, y, d: 1.4 });                  // 経歴ステップ
s.arrow({ x1, y1, x2, y2, both: false, color: 'ink-900' });   s.rule({ x, y, w });
s.slide.addNotes('スピーカーノート');

deck.addClosing({ titleEn: 'Domuz', urls: ['https://domuz.jp/'] });
await deck.save('decks/company-overview/output/Domuz_会社概要_2026-09.pptx');
```

## 守ること（DESIGN_SYSTEM.md の要点）

- 英数字 **Century Gothic**、日本語 **ヒラギノ角ゴ**（後処理で自動設定）。游ゴシック禁止
- 見出しは **日本語が主役・英語は小さく大文字・字間広め**。eyebrow は `- Label -` 形式
- 緑（`green-900`）を面積で使うのは区切り／クロージングだけ。地色は白、カードは生成り or グレー（同一スライド内で混ぜない）
- 角丸：カード 10pt／写真 8pt／バッジ 4pt。影・グラデーション・端のカラーバー・タイトル下線は使わない
- 強調色は 1 スライド 1 種類（営業＝coral、投資家＝green-800、社内＝hanaichi-yellow）
- **文字だけのスライドを作らない**。写真は自社素材、人物は円形
- 数字は Century Gothic・右揃え・単位は小さく。グラフはネイティブ（画像禁止）
- 同じレイアウトを 3 枚以上続けない

## デザインシステムを更新するとき

1. `design-system/tokens.json` の値を変える
2. `design-system/DESIGN_SYSTEM.md` の同じ箇所とバージョン・変更履歴を直す
3. 新しい部品が必要なら `lib/theme.js` にヘルパーを追加し、この SKILL.md の API 表にも一行足す
4. `node decks/company-overview/build.js` で再ビルドして崩れが無いか見る
5. コミット

## ファイル

- `lib/theme.js` — tokens.json → pptxgenjs 部品
- `lib/postprocess.py` — 生成後に `<a:ea typeface="Hiragino Sans"/>` とテーマフォントを注入（pptxgenjs は日本語フォントを書けないため必須）
- `templates/` — スライド種類ごとの最小サンプル
- `../../..//decks/company-overview/build.js` — フル実装の見本

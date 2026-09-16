---
name: domuz-deck
description: Domuz の統一デザインシステムで資料を作る／直す。資料は HTML（decks/<name>/index.html）が正本で、送付・DL 時だけ PDF に書き出す。営業提案・投資家/銀行向け・社内資料のすべてで使う。「資料を作って」「スライドにして」「会社概要をアップデート」「提案書」「デッキ」「PDFにして」「デザインシステム」と言われたら必ずこのスキルを使う。
---

# domuz-deck — Domuz デザインシステムで資料を作る

`design-system/DESIGN_SYSTEM.md`（ルール）と `design-system/tokens.json`（値）が **唯一の基準**。
資料は **HTML が正本**（`decks/<name>/index.html`）。先方に送る／ダウンロードするときだけ `scripts/export.js` で PDF にする。
デザインの判断をこの場で新しく発明しない。迷ったら DESIGN_SYSTEM.md を読み直す。

## 手順

1. **基準を読む**（毎回）
   - `design-system/DESIGN_SYSTEM.md` — 特に §0 ひとことで／§2.3 タイトルの組み方／§4.1 スライドの種類／§6 用途別／§8 チェックリスト
   - `design-system/html/deck.css` — 使えるクラスの一覧（下の「クラス早見表」も参照）。値は `tokens.css`（tokens.json から生成）経由
2. **用途を決める** — `.deck--sales` / `.deck--financial` / `.deck--internal`。カード色・ヘッダー有無が切り替わる
3. **既存デッキを流用** — `decks/company-overview/index.html` が最も網羅的な見本。営業提案は `templates/sales-proposal.html`。コピーして `decks/<name>/index.html` に
4. **構成を先に書く** — 1スライド＝1メッセージ。各スライドを §4.1 の種類に当てはめる。文字だけのスライドが出たら写真・図・数字を足す
5. **素材** — `design-system/assets/photos|logos/` の自社素材を最優先。無いものはユーザーに写真を依頼（汎用ストック・AI 画像は使わない。参考用 AI 画像には「※AI生成によるイメージ画像です」必須）
6. **書き出し**
   ```bash
   node .claude/skills/domuz-deck/scripts/export.js decks/<name> --name "Domuz_<資料名>_<YYYY-MM>"
   ```
   → `decks/<name>/output/<name>.html`（CSS・JS・画像を1ファイルに埋め込み。そのまま送れる）
   → `decks/<name>/output/<name>.pdf`（4:3、1スライド＝1ページ）
   → `decks/<name>/output/preview/slide-NN.png`（QA 用、git 管理外）
7. **検証**（必須）— preview の PNG を **全ページ目視**。文字はみ出し／重なり／余白の偏り／強調色の混在／低解像度写真を直す。§8 チェックリストを通す。PDF も `pdftoppm` で1度ラスタライズして画面版と一致するか見る
8. **納品** — HTML と PDF を SendUserFile で渡す

## クラス早見表（`design-system/html/deck.css`）

| 目的 | クラス |
|---|---|
| 枚組 | `.deck` ＋ `.deck--sales` / `.deck--financial` / `.deck--internal`。`data-company` `data-confidential="false"` |
| スライド | `.slide`（既定：タイトル帯＋コンテンツ）／ `.slide--cover`（ウォーターマーク表紙）／ `.slide--cover-minimal`（営業表紙）／ `.slide--section`／ `.slide--closing` |
| タイトル | `.title-block > .eyebrow + h1.title + .subtitle-en`。バッジ横並びは `.title-row > .badge + h1.title + .subtitle-en` |
| 文字 | `.heading` `.heading--sm` `.body` `.body-sm` `.body-xs` `.label` `.label--green` `.caption > .en` `.num` `.green` `.coral` `.muted` `.bold` `.center` `.right` |
| KPI | `.kpi > .kpi__label + .kpi__value(+ .unit) + .kpi__note`。`.kpi--coral` `.kpi--sm` `.kpi--lg` `.kpi--center` |
| レイアウト | `.content`（コンテンツ領域）`.cols.cols-2/3/4` `.row` `.stack` `.spread` `.flex-1` `.mt-1..4` |
| カード | `.card`（用途で色が決まる）`.card--warm` `--warm-deep` `--cool` `--sand` `--paper` `--emphasis` `--bordered` `--tight` `--flush` |
| バッジ | `.badge` `.badge--soft` `.badge--yellow` |
| 注記 | `.note` `.note--fill` `> .note__title` |
| 写真 | `.frame > img.photo`（cover・角丸8pt）`.photo--circle` `.photo--contain` `.photo--square` `figure.fig > .frame + figcaption.caption` |
| ロゴ | `.logo-box > img` `.logos > div > img`（等高で並べる） |
| 表 | `table.table`（`thead` は green-100）`.table--highlight`（営業比較表）`.table--lg` `td.num` |
| 図 | `.box` `.box--hi` `.arrow` `.arrow--green` `.arrow--yellow` `.arrow--both` `.circle-step` `.dot-num` `hr.rule` `.rule--taupe` |
| グラフ | `<div class="chart" data-chart='{"type":"stacked","labels":[...],"series":[{"name","values"}],"max","step","labelIndexes":[...],"groups":[{"label","from","to"}],"unit"}'>`（deck.js が SVG 描画。色は tokens の chart-series） |
| 表示 | ブラウザで `index.html` を開く：←→ でページ送り、`P` で発表モード、`#7` で7枚目へ |

ページ番号・ヘッダー（Domuz inc. / Confidential）・フッター（コピーライト）は `deck.js` が自動で入れる。手で書かない。

## 守ること（DESIGN_SYSTEM.md の要点）

- 英数字 **Century Gothic**、日本語 **ヒラギノ角ゴ**（`--font-body` が自動でこの順に当てる）。游ゴシック禁止
- 見出しは **日本語が主役・英語は小さく大文字・字間広め**。eyebrow は `- Label -` 形式（CSS が自動で付ける）
- 緑（`green-900`）を面積で使うのは区切り／クロージングだけ。地色は白、カードは生成り or グレー（同一スライド内で混ぜない）
- 角丸：カード 10pt／写真 8pt／バッジ 4pt。影・グラデーション・端のカラーバー・タイトル下線は使わない
- 強調色は 1 スライド 1 種類（営業＝coral、投資家＝green-800、社内＝hanaichi-yellow）
- **文字だけのスライドを作らない**。写真は自社素材、人物は円形
- 数字は `.num`（Century Gothic）・右揃え・単位は小さく。グラフは `data-chart`（画像禁止）
- 同じレイアウトを 3 枚以上続けない
- スライド内でしか使わない微調整は `index.html` の `<style>` に。再利用できるものは `deck.css` に昇格させる

## デザインシステムを更新するとき

1. `design-system/tokens.json` の値を変える → `node .claude/skills/domuz-deck/scripts/tokens-to-css.js` で `tokens.css` を再生成
2. `design-system/DESIGN_SYSTEM.md` の同じ箇所とバージョン・変更履歴を直す
3. 新しい部品が必要なら `design-system/html/deck.css` にクラスを追加し、この SKILL.md の早見表にも一行足す
4. `node .claude/skills/domuz-deck/scripts/export.js decks/company-overview` で再書き出しして崩れが無いか見る
5. コミット

## PowerPoint が必要なとき（副経路）

先方から .pptx を求められた場合だけ `lib/theme.js`（pptxgenjs）で生成する。見本は `decks/company-overview/build.js`、雛形は `templates/sales-proposal.js`。生成後 `lib/postprocess.py` が日本語フォントをヒラギノに設定する。HTML と pptx の二重メンテは避け、pptx は都度生成物として扱う。

## ファイル

- `scripts/export.js` — HTML → 自己完結 HTML ＋ PDF ＋ プレビュー PNG（Playwright/Chromium）
- `scripts/tokens-to-css.js` — tokens.json → design-system/html/tokens.css
- `templates/sales-proposal.html` — 営業提案の HTML 雛形（Cover B・バッジ付きタイトル・写真2枚＋価格・比較表）
- `lib/theme.js` `lib/postprocess.py` `templates/sales-proposal.js` — pptx 副経路
- `../../..//decks/company-overview/index.html` — フル実装の見本

---
name: domuz-deck
description: Domuz デザインシステム v2（design-system/domuz_design_system.md）で提案資料・発表スライド・分析レポートを HTML で作る／直す／PDF にする。「資料を作って」「提案資料」「発表スライド」「締め会」「合宿」「レポート」「会社概要をアップデート」「PDFにして」「デザインシステム」と言われたら必ずこのスキルを使う。
---

# domuz-deck — Domuz デザインシステム v2 で資料を作る

正は **`design-system/domuz_design_system.md`**（色・フォント・型カタログ・禁則・チェックリスト）と **`design-system/templates/` の雛形**。このスキルは、その手順を Claude Code で回すための入口。ルールをここで言い換えない。迷ったら本体を読み直す。

## 0. 最初に種別を決める（混ぜない）

| 種別 | 用途 | 雛形 | 型 | 中身の作り方 |
|---|---|---|---|---|
| **提案資料** | 他社・法人向け提案、営業資料、会社概要、見積・プラン。相手が手元で読む | `templates/proposal.template.html` | §6 B-1〜B-25 | `guides/提案資料の作り方.md` |
| **発表スライド** | 社内発表・合宿・締め会・経営MTG。プロジェクターで見せる | `templates/presentation.template.html`（グラフは `templates/presentation_charts.py`） | §6-2 P-1〜P-14 | `guides/発表スライドの作り方.md` |
| **レポート** | 分析レポート・市場調査・たたき台。縦スクロール | `templates/report.template.html` | §6-3 | — |

依頼に種別が無ければ、作り始める前に確認する（文字サイズ・1枚の情報量・フォントがすべて違うため）。

## 1. 手順

1. **読む**（毎回）: `design-system/domuz_design_system.md` の §0・§1・§5・該当種別の §6・§7・§9・§10。種別のガイド（`guides/`）の該当章
2. **雛形をコピー**: `decks/<YYYYMMDD>_<テーマ>/index.html` に `templates/<種別>.template.html` を複製。`<title>`・表紙・ヘッダの `Confidential/Internal` を差し替える。見本は `decks/company-overview/index.html`（提案資料・会社概要）
3. **構成を先に書く**: §6-1（提案資料 10〜15枚）／§6-2 の構成例に沿って、各ページを型 ID（B-x／P-x）で列挙してからHTMLに落とす。発表スライドは「一本の筋 → 構成 → 数字 → HTML」の順で1段ずつ（ガイド参照）
4. **型のクラスだけで組む**: `.cover` `.divider` `.cols` `.cards` `.kpis` `.flow` `.timeline` `.gallery` `.company` 等。**`:root` の変数は書き換えない。色は `var(--…)` のみ、HEX 直書き禁止**。足りない型はページ内 `<style>` に最小限で足し、再利用するなら本体 §6 の表に1行追記
5. **素材**: 写真・ロゴは `design-system/assets/`（過去資料から抽出した参考素材。正式ロゴ規定は §11 で未定義）または依頼者から受け取る。商品写真は 3:4・`object-fit: contain`・トリミング禁止（ガイド §2）。未撮影は破線プレースホルダー「〇〇（撮影後に差し替えます）」。AI生成画像は使わない
6. **書き出し**（HTML 単体化＋PDF＋はみ出し検査）
   ```bash
   node .claude/skills/domuz-deck/scripts/export.js decks/<dir> --name "<YYYYMMDD>_<相手先>様_<テーマ>"
   ```
   → `decks/<dir>/output/<name>.html`（画像 base64 埋め込み済み。そのまま送れる）／`<name>.pdf`／`preview/page-NN.png`
   `OVERFLOW:` が出たら該当ページを直してから進む。macOS なら §8-2 の Chrome コマンドでも同じ PDF になる
7. **検査**（必須）: preview の PNG を全ページ目視（文字はみ出し・改ページ・画像欠け・表の最終行欠け）。本体 **§10 チェックリスト**と、提案資料ならガイド §6 の納品前チェックを通す
8. **納品**: HTML と PDF を渡す。ファイル名は日付先頭 `YYYYMMDD_テーマ`。送付済みファイルは上書きしない（訂正は別ファイル）

## 2. 守ること（本体の要点。詳細は本体）

- 文字色は Moss Green `--text-primary`。黒禁止。濃色全面は章扉だけ、透かしは表紙だけ
- 英字は ALL CAPS＋字間広め。見出し上の小ラベル `- OUR BUSINESS -`。和文と英文を同一行で混ぜない
- 赤 `--text-strong` は1枚に1〜2箇所。警告色 `--text-alert` を強調に使わない
- 余白は4の倍数、角丸 8px（写真 6px）、**box-shadow・グラデーション・イラスト・絵文字禁止**
- 表はヘッダ Moss Green＋白、金額右寄せ、「※税抜」。グラフは系列色順（① `--brand-primary` ② `--brand-secondary` ③ `--brand-tertiary` …）、**数値ラベル必須**、円グラフ禁止、SVG で描く（画像化しない）
- 提案資料は会社概要（B-22）で終える。会社概要の数値（従業員数など）は使う前に最新を確認
- 発表スライドは提案資料のヘッダ・フッタ・カードを使わない。本文 25px 以上、1枚1メッセージ、売上は送料込み・税抜で検算
- 1スライド1メッセージ。入らなければ分ける。ゼロから組まず雛形から

## 3. ファイル

- `design-system/domuz_design_system.md` — 本体（正）
- `design-system/README.md` — 配布パッケージの README（導入手順・頼み方のコツ）
- `design-system/guides/` — 提案資料の作り方／発表スライドの作り方
- `design-system/templates/` — 3種の雛形＋プレビュー PDF＋グラフヘルパー
- `design-system/assets/` — 参考ロゴ・写真（過去資料から抽出）
- `scripts/export.js` — 単一 HTML 化＋PDF＋PNG＋はみ出し検査（Playwright/Chromium。`npm i -g playwright`）
- `decks/company-overview/index.html` — 提案資料型の実装見本（会社概要）

# Domuz Design System & Decks

株式会社Domuz の資料（外部営業・投資家/銀行向け・社内）を **1つのデザインシステム** で作るためのリポジトリ。
**資料は HTML が正本**。先方に送る／ダウンロードするときだけ PDF に書き出す。

| 場所 | 中身 |
|---|---|
| [`design-system/DESIGN_SYSTEM.md`](design-system/DESIGN_SYSTEM.md) | **デザインの基準書**（色・フォント・レイアウト・スライド種類・用途別ルール・チェックリスト）。資料を作る人は全員これを読む |
| [`design-system/tokens.json`](design-system/tokens.json) | 同じ値の機械可読版 → `html/tokens.css` を自動生成 |
| `design-system/html/` | `deck.css`（スライド部品）`deck.js`（ヘッダー／ページ番号／ページ送り／グラフ）`tokens.css`（生成物） |
| `design-system/assets/` | 自社ロゴ・写真（過去資料から抽出）。※商品写真の一部は圧縮PDF由来で低解像度 → 原本に差し替え推奨 |
| [`.claude/skills/domuz-deck/`](.claude/skills/domuz-deck/SKILL.md) | Claude Code スキル。`/domuz-deck` で資料を作る／直す。`scripts/export.js` が PDF 書き出し |
| `decks/company-overview/` | **会社概要資料**（第1弾）。`index.html` が正本、`output/` に送付用 HTML と PDF |

## 使い方

### 見る
`decks/company-overview/index.html` をブラウザで開く。←→ でページ送り、`P` で全画面プレゼン、`Esc` で戻る。

### Claude Code で資料を作る
```
/domuz-deck 会社概要の従業員数を70名に更新してPDFも出して
/domuz-deck ◯◯様向けのフラワーギフト提案書を、PLAN 1〜3 の写真と価格で作って
```
スキルが `DESIGN_SYSTEM.md` と `deck.css` を読み、`decks/<name>/index.html` を書いて HTML／PDF を書き出し、全ページを目視検証する。

### PDF に書き出す（送付・ダウンロード用）
```bash
npm install                      # 初回のみ（sharp / pptxgenjs）。Playwright は npm i -g playwright
node .claude/skills/domuz-deck/scripts/export.js decks/company-overview --name "Domuz_会社概要_2026-09"
# → decks/company-overview/output/Domuz_会社概要_2026-09.html  （1ファイル、そのまま送れる）
# → decks/company-overview/output/Domuz_会社概要_2026-09.pdf   （4:3、1スライド＝1ページ）
```
ブラウザの「印刷 → PDF」でも同じ結果になる（`@page` で 4:3 に設定済み）。

### 手で作る（Keynote / Google スライド）
`DESIGN_SYSTEM.md` の値をそのまま使う。特に §0（ひとことで）、§2.3（タイトルの組み方）、§4.1（スライドの種類）、§8（チェックリスト）。

### PowerPoint が必要なとき
`node decks/company-overview/build.js` で pptxgenjs 版を生成できる（副経路。日本語フォントは `lib/postprocess.py` がヒラギノに設定）。

## デザインシステムを更新する
1. `design-system/tokens.json` を変える → `node .claude/skills/domuz-deck/scripts/tokens-to-css.js`
2. `design-system/DESIGN_SYSTEM.md` の該当箇所・バージョン・変更履歴を直す
3. `export.js` で会社概要を再書き出しし、崩れが無いか確認
4. コミット

## 注意
- 会社概要の売上グラフ（`index.html` の `data-chart`）は、元資料でラベルの無かった四半期をグラフから読み取った概算値を含む。実数に差し替えてから外部に出すこと
- フォント：Century Gothic（英数字）／ヒラギノ角ゴ（日本語）。無い環境では Jost／Noto Sans JP（Google Fonts）に自動フォールバック

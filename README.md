# Domuz Design System & Decks

株式会社Domuz の資料（外部営業・投資家/銀行向け・社内）を **1つのデザインシステム** で作るためのリポジトリ。

| 場所 | 中身 |
|---|---|
| [`design-system/DESIGN_SYSTEM.md`](design-system/DESIGN_SYSTEM.md) | **デザインの基準書**（色・フォント・レイアウト・スライド種類・用途別ルール・チェックリスト）。資料を作る人は全員これを読む |
| [`design-system/tokens.json`](design-system/tokens.json) | 同じ値の機械可読版。プログラムはここから読む |
| `design-system/assets/` | 自社ロゴ・写真（過去資料から抽出）。※商品写真の一部は圧縮PDF由来で低解像度 → 原本に差し替え推奨 |
| [`.claude/skills/domuz-deck/`](.claude/skills/domuz-deck/SKILL.md) | Claude Code スキル。`/domuz-deck` で資料を作る／直す。`lib/theme.js` がデザインシステムを pptxgenjs の部品にしたもの |
| `decks/company-overview/` | **会社概要資料**（第1弾）。`build.js` がソース、`output/` に .pptx と PDF |

## 使い方

### Claude Code で資料を作る
```
/domuz-deck 会社概要の従業員数を70名に更新して再出力して
/domuz-deck ◯◯様向けのフラワーギフト提案書を、PLAN 1〜3 の写真と価格で作って
```
スキルが `DESIGN_SYSTEM.md` と `tokens.json` を読み、`decks/<name>/build.js` を書いて .pptx を生成、検証・レンダリングまで行う。

### 手で作る（PowerPoint / Keynote / Google スライド）
`DESIGN_SYSTEM.md` の値をそのまま使う。特に §0（ひとことで）、§2.3（タイトルの組み方）、§4.1（スライドの種類）、§8（チェックリスト）。

### ローカルでビルド
```bash
npm install                                  # pptxgenjs, sharp
node decks/company-overview/build.js         # → decks/company-overview/output/*.pptx
```
生成後に `lib/postprocess.py` が自動で走り、日本語フォントを **ヒラギノ角ゴシック** に設定する（pptxgenjs は日本語フォントを書けないため。これが無いと PowerPoint 既定の游ゴシックになる）。

PDF プレビュー（LibreOffice が必要）:
```bash
soffice --headless --convert-to pdf --outdir decks/company-overview/output decks/company-overview/output/*.pptx
```

## デザインシステムを更新する
1. `design-system/tokens.json` を変える
2. `design-system/DESIGN_SYSTEM.md` の該当箇所・バージョン・変更履歴を直す
3. `node decks/company-overview/build.js` で再ビルドし、崩れが無いか確認
4. コミット

## 注意
- 会社概要の売上グラフ（`decks/company-overview/build.js` の `DATA.growth`）は、元資料でラベルの無かった四半期をグラフから読み取った概算値を含む。実数に差し替えてから外部に出すこと
- フォント：Century Gothic（英数字）／ヒラギノ角ゴ（日本語）。Windows・Google スライドでは Noto Sans JP を代替にする

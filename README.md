# Domuz 提案資料・発表スライド — proposal-materials

株式会社Domuz の資料を **デザインシステム v2.1**（小松泰彦 作成の配布パッケージ）に沿って HTML で作り、PDF を併産するためのリポジトリ。

| 場所 | 中身 |
|---|---|
| [`design-system/domuz_design_system.md`](design-system/domuz_design_system.md) | **本体（正）**。色・フォント・レイアウト・型カタログ（提案資料 B-1〜B-25／発表スライド P-1〜P-14）・禁則・PDF手順・チェックリスト |
| [`design-system/README.md`](design-system/README.md) | 配布パッケージの README（提案資料と発表スライドの違い、導入、Claude への頼み方） |
| `design-system/guides/` | 提案資料の作り方／発表スライドの作り方（中身の組み立て方と表現の癖） |
| `design-system/templates/` | 雛形 3 種（`proposal` / `presentation` / `report`）＋プレビュー PDF＋ `presentation_charts.py` |
| `design-system/examples/` | **手本 PDF**。発表スライド＝`20261009_1Day合宿…`（小松作・32枚）、提案資料＝会社概要。トンマナはこの2本に揃える |
| `design-system/assets/` | 過去資料から抽出したロゴ・写真（参考素材。正式ロゴ規定は本体 §11 で未定義） |
| [`.claude/skills/domuz-deck/`](.claude/skills/domuz-deck/SKILL.md) | Claude Code 用スキル（手順）と `scripts/export.js`（単一 HTML 化・PDF・はみ出し検査） |
| `decks/company-overview/` | 会社概要（提案資料型の実装見本）。`index.html` が正本、`output/` に送付用 HTML と PDF |

## 使い方

### Claude Code で作る
リポジトリ直下の `CLAUDE.md` が本体を読ませる設定になっているので、種別を明言して頼む:
```
〇〇様向けのグリーンレンタル提案資料をHTMLで作って（提案資料）
来週の締め会の発表スライドをHTMLで作って（発表スライド）
会社概要の従業員数を更新してPDFも出して
```

### PDF にする
macOS（Chrome あり）:
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --no-pdf-header-footer --print-to-pdf="出力.pdf" "file:///絶対パス/入力.html"
```
Chrome が無い環境（Claude Code のクラウド等）／画像を base64 で単一 HTML にまとめたいとき:
```bash
npm i -g playwright            # 初回のみ
node .claude/skills/domuz-deck/scripts/export.js decks/company-overview --name "20261001_Domuz_会社概要"
# → decks/company-overview/output/20261001_Domuz_会社概要.html / .pdf / preview/page-NN.png（はみ出し検査つき）
```

### 見る
`decks/<dir>/index.html` または `output/*.html` をブラウザで開く（画像は `output/` 側が自己完結）。

## ルール（本体より）
- 色・フォントの正は Figma「AND PLANTS スタイルガイド」。変更提案は小松まで
- 雛形の `:root` の変数は書き換えない。型やクラスを足したら本体 §6 の型カタログに1行書く
- 会社概要の数値は使う前に最新を確認。社外秘の数字を含む資料は宛先と中身を確認してから送る

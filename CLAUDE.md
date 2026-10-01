# proposal-materials

株式会社Domuz の資料（提案資料・発表スライド・分析レポート）を HTML で作り、PDF を併産するリポジトリ。

## デザインシステム（提案資料・発表スライド・レポート）
視覚的なアウトプットをHTMLで作るときは、必ず `design-system/domuz_design_system.md` を読む。
**提案資料と発表スライドは別物。雛形も型も混ぜない**（違いは同文書 §0-1）。
- 提案資料（他社・法人向け・手元で読む）→ `design-system/templates/proposal.template.html`＋§6（B-1〜B-25）＋ `design-system/guides/提案資料の作り方.md`。最終ページは会社概要
- 発表スライド（社内発表・合宿・締め会・プロジェクター投影）→ `design-system/templates/presentation.template.html`＋§6-2（P-1〜P-14）＋ `design-system/guides/発表スライドの作り方.md`。グラフは `design-system/templates/presentation_charts.py` でSVG生成
- 分析レポート → `design-system/templates/report.template.html`
- 色はCSS変数のみ（HEX直書き禁止）、4:3・1128×846px、PDF併産、納品前に §10 のチェックリスト
- 保存: `decks/<YYYYMMDD>_<テーマ>/index.html` を正本に、`output/` に単一 HTML と PDF（ファイル名は日付先頭 `YYYYMMDD_テーマ`）

## 手順・ツール
- 手順は `.claude/skills/domuz-deck/SKILL.md`（`/domuz-deck` で呼べる）
- PDF 化・単一 HTML 化・はみ出し検査: `node .claude/skills/domuz-deck/scripts/export.js decks/<dir> --name "<YYYYMMDD>_<テーマ>"`（要 `npm i -g playwright`。macOS で Chrome があるなら本体 §8-2 のコマンドでも可）
- 写真・ロゴの参考素材: `design-system/assets/`

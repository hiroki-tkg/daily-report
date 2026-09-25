/**
 * OLIVE+ 上場一覧の受け口。GitHub Actions（export_sheet.py）から POST される。
 *
 * 設定:
 *   1. プロジェクトの設定 → スクリプト プロパティ に TOKEN を追加（長いランダムな文字列）
 *   2. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *      次のユーザーとして実行: 自分 / アクセスできるユーザー: 全員
 *   3. 表示された URL を GitHub Secrets の SHEET_WEBHOOK_URL に、TOKEN を SHEET_TOKEN に入れる
 */
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token || body.token !== token) return json_({ ok: false, error: 'unauthorized' });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    writeDetail_(ss, body.sheet, body.rows);
    writeSummary_(ss, body.summary_header, body.summary);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// 売立日のタブ。新しい日ほど左（「推移」のすぐ右）に来る。
function writeDetail_(ss, name, rows) {
  let sh = ss.getSheetByName(name);
  if (sh) sh.clear();
  else sh = ss.insertSheet(name, 1);
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold').setBackground('#DDEBF7');
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, rows.length, rows[0].length).createFilter();
}

// 1売立日1行。同じ売立日なら上書き。
function writeSummary_(ss, header, row) {
  let sh = ss.getSheetByName('推移');
  if (!sh) sh = ss.insertSheet('推移', 0);
  if (sh.getLastRow() === 0) {
    sh.appendRow(header);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#DDEBF7');
  }
  const labels = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(r => r[0]);
  const i = labels.indexOf(row[0]);
  const at = i >= 1 ? i + 1 : sh.getLastRow() + 1;
  sh.getRange(at, 1, 1, row.length).setValues([row]);
  header.forEach((h, c) => {
    if (h.endsWith('比率')) sh.getRange(2, c + 1, sh.getMaxRows() - 1, 1).setNumberFormat('0.0%');
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

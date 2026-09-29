/**
 * 피움 구글 시트 수신 스크립트.
 *
 * 1. 새 구글 시트를 만들고, 확장 프로그램 > Apps Script 를 엽니다.
 * 2. 이 파일 내용을 붙여 넣고 저장합니다.
 * 3. 배포 > 새 배포 > 유형: 웹 앱
 *    - 실행 사용자: 나
 *    - 액세스 권한: 모든 사용자
 * 4. 나온 /exec URL을 앱의 관리자 SOS 화면 > 시트 URL 에 붙여 넣습니다.
 *
 * 시트 탭은 water / diary / session 세 개가 자동으로 만들어집니다.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.kind || 'misc';
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    var keys = Object.keys(data);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['receivedAt'].concat(keys));
    } else {
      var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var missing = keys.filter(function (k) { return header.indexOf(k) === -1; });
      if (missing.length) {
        sheet.getRange(1, header.length + 1, 1, missing.length).setValues([missing]);
      }
    }

    var finalHeader = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = finalHeader.map(function (h) {
      if (h === 'receivedAt') return new Date();
      return data[h] === undefined ? '' : data[h];
    });
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('pium ok');
}

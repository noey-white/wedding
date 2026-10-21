/**
 * 청첩장 참석 여부 · 방명록 저장용 구글 Apps Script
 *
 * 사용법
 * 1) 구글 시트를 새로 만들고, 메뉴 [확장 프로그램] → [Apps Script] 를 연다.
 * 2) 이 파일 내용을 전부 붙여넣고 저장한다.
 * 3) [배포] → [새 배포] → 유형: 웹 앱
 *    - 실행 사용자: 나
 *    - 액세스 권한: 모든 사용자
 * 4) 배포 후 나오는 "웹 앱 URL"을 index.html 의 CONFIG.sheetApiUrl 에 붙여넣는다.
 *
 * 시트 탭 '참석'  : 참석 여부 응답이 쌓임
 * 시트 탭 '방명록': 방명록이 쌓임. '숨김' 칸에 아무 글자나 넣으면 청첩장에서 안 보임
 */

function sheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(s, max) {
  return String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max);
}

function doGet(e) {
  if (e && e.parameter && e.parameter.type === 'guestbook') {
    const sh = sheet_('방명록', ['작성시각', '날짜', '이름', '메시지', '숨김']);
    const rows = sh.getDataRange().getValues().slice(1);
    const entries = rows
      .filter(function (r) { return !r[4]; })
      .map(function (r) { return { when: String(r[1]), name: String(r[2]), msg: String(r[3]) }; })
      .reverse();
    return json_({ entries: entries });
  }
  return json_({ ok: true });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const now = new Date();
    if (d.type === 'rsvp') {
      const sh = sheet_('참석', ['작성시각', '구분', '참석', '성함', '인원', '식사']);
      sh.appendRow([
        now,
        d.side === 'groom' ? '신랑측' : d.side === 'bride' ? '신부측' : '',
        d.attend === 'yes' ? '참석' : '불참',
        clean_(d.name, 30),
        Number(d.count) || 0,
        d.meal === 'yes' ? '식사 예정' : d.meal === 'no' ? '안 함' : d.meal === 'tbd' ? '미정' : ''
      ]);
    } else if (d.type === 'guestbook') {
      const sh = sheet_('방명록', ['작성시각', '날짜', '이름', '메시지', '숨김']);
      sh.appendRow([now, clean_(d.when, 12), clean_(d.name, 20), clean_(d.msg, 300), '']);
    }
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

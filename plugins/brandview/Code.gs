const SHEET_ID = '1k344un5a1RQ-StE6dLjJFAs6jo_BImn8D6RpvLFkvGY';

const INSTALL_HEADERS = ['Hành động', 'Site URL', 'Tên site', 'Email admin', 'Phiên bản', 'Thời gian'];
const INSTALL_KEYS    = ['action',    'site_url', 'site_name', 'admin_email', 'version',  'timestamp'];

const CLICK_HEADERS   = ['Site URL', 'Tên site', 'Brand', 'Domain', 'URL click', 'IP', 'Thời gian click'];
const CLICK_KEYS      = ['site_url', 'site_name', 'brand', 'domain', 'target_url', 'ip', 'clicked_at'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'click_batch') {
      return handleClicks(data);
    }

    return handleInstall(data);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleInstall(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('Cài đặt plugin');
  if (!sheet) {
    sheet = ss.insertSheet('Cài đặt plugin');
    sheet.appendRow(INSTALL_HEADERS);
  }

  const row = INSTALL_KEYS.map(k => data[k] || '');
  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleClicks(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('Clicks');
  if (!sheet) {
    sheet = ss.insertSheet('Clicks');
    sheet.appendRow(CLICK_HEADERS);
  }

  const rows = data.clicks.map(click => {
    return CLICK_KEYS.map(k => {
      if (k === 'site_url') return data.site_url || '';
      if (k === 'site_name') return data.site_name || '';
      return click[k] || '';
    });
  });

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, CLICK_HEADERS.length).setValues(rows);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

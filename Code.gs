// ============================================================
//  SUNFOOD INQUIRY — Apps Script
//  Sheet: EXPORT SALES _ OFFER  |  Tab: Inquiry Requests
//  Deploy URL: https://script.google.com/macros/s/AKfycbyAfBG-BNJfw7y7MnbC6t4zC4Vckewu-VGQBBgSnEhAXqHEYRyFxjmKuvoLZxpM-Lw/exec
// ============================================================

var SHEET_ID   = '15fxIAqk32f898h4nN-CG1HstFe3GPSy-33ALiJlJHwU';
var SHEET_NAME = 'Inquiry Requests';

// ── GET ──────────────────────────────────────────────────
function doGet(e) {
  return handle(e.parameter.data);
}

// ── POST (fallback) ──────────────────────────────────────
function doPost(e) {
  var raw = (e.postData && e.postData.contents) ? e.postData.contents : (e.parameter.data || '');
  return handle(raw);
}

// ── handler หลัก ────────────────────────────────────────
function handle(raw) {
  try {
    if (!raw) throw new Error('no data');
    // e.parameter ถูก decode มาแล้ว 1 รอบ — decode เพิ่มเฉพาะเมื่อจำเป็น
    // (กัน URIError เมื่อข้อมูลมีเครื่องหมาย % เช่น "48.6%")
    var payload;
    try { payload = JSON.parse(raw); }
    catch (e1) { payload = JSON.parse(decodeURIComponent(raw)); }
    writeToSheet(payload);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', ref: payload.ref }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', msg: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── เขียนข้อมูลลง Sheet ─────────────────────────────────
function writeToSheet(p) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" not found');

  var products = p.products || [];

  if (products.length === 0) {
    sheet.appendRow(buildRow(p, {}));
    return;
  }

  // 1 แถว ต่อ 1 product (แต่ละ product มี offer ของตัวเอง)
  products.forEach(function(prod) {
    sheet.appendRow(buildRow(p, prod));
  });
}

// ── สร้างแถว 1 แถว ──────────────────────────────────────
//
//  A   Timestamp
//  B   REF
//  C   Sales User
//  D   Company
//  E   Contact          (ยังไม่มีใน form)
//  F   Country          (ยังไม่มีใน form)
//  G   Destination Port
//  H   Incoterm
//  I   Payment Term
//  J   Order Type
//  K   Product
//  L   Code / Specification
//  M   Quantity Request (FCL/MT)
//  N   Shipment Request
//  O   Idea Price
//  P   %Margin (Idea)
//  Q   จัดสรรเนื้อ
//  R   ราคาปิดการขายล่าสุด
//  S   ราคาเสนอล่าสุด
//  T   ค่าเงิน
//  U   อื่นๆ
//  V   Shipment ที่จะเสนอ   ← per-product
//  W   ราคาเสนอ (USD/MT)    ← per-product
//  X   %Margin (Offer)      ← per-product
//  Y   Total Quantity (MT)  ← ว่าง (คำนวณเองใน Sheet)
//  Z   Quantity per Month   ← per-product
//  AA  หมายเหตุ
// ────────────────────────────────────────────────────────

function buildRow(p, prod) {
  var tz = 'Asia/Bangkok';
  var ts = p.submittedAt
    ? Utilities.formatDate(new Date(p.submittedAt), tz, 'dd/MM/yyyy HH:mm:ss')
    : Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm:ss');

  return [
    /* A  */ ts,
    /* B  */ p.ref         || '',
    /* C  */ p.salesUser   || '',
    /* D  */ p.company     || '',
    /* E  */ p.contact     || '',
    /* F  */ p.country     || '',
    /* G  */ p.port        || '',
    /* H  */ p.incoterm    || '',
    /* I  */ p.payment     || '',
    /* J  */ p.orderType   || '',
    /* K  */ prod.type     || '',
    /* L  */ prod.code     || '',
    /* M  */ prod.qty      || '',
    /* N  */ prod.months   || '',
    /* O  */ prod.idea     || '',
    /* P  */ prod.margin   || '',
    /* Q  */ p.allocation  || '',
    /* R  */ p.lastClosed  || '',
    /* S  */ p.lastOffer   || '',
    /* T  */ p.currency    || '',
    /* U  */ p.otherDetail || '',
    /* V  */ prod.period      || '',
    /* W  */ prod.offerPrice  || '',
    /* X  */ prod.offerMargin || '',
    /* Y  */ '',
    /* Z  */ prod.qtyMonth    || '',
    /* AA */ prod.remark || p.remark || ''
  ];
}

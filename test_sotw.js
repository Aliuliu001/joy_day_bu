#!/usr/bin/env node
// Test tự động cho Code.gs (Dạy Bù + SOTW) — mock Google Apps Script API
const fs = require('fs');
const vm = require('vm');

// ================= MOCK =================
let FAIL = 0, PASS = 0;
function ok(cond, name) {
  if (cond) { PASS++; console.log('  ✅ ' + name); }
  else { FAIL++; console.log('  ❌ FAIL: ' + name); }
}
function eq(a, b, name) { ok(JSON.stringify(a) === JSON.stringify(b), name + (a === b ? '' : ` [got ${JSON.stringify(a)}, want ${JSON.stringify(b)}]`)); }

let SHEET_SEQ = 1;

class MockRange {
  constructor(sheet, r, c, h, w) { this.sheet = sheet; this.r = r; this.c = c; this.h = h; this.w = w; }
  _get(r, c) {
    const row = this.sheet.rows[r - 1];
    if (!row) return '';
    const v = row[c - 1];
    return v === undefined ? '' : v;
  }
  _set(r, c, v) {
    this.sheet.writes = (this.sheet.writes || 0) + 1; // đếm lượt GHI — test "chỉ đọc file chính"
    while (this.sheet.rows.length < r) this.sheet.rows.push([]);
    const row = this.sheet.rows[r - 1];
    while (row.length < c) row.push('');
    row[c - 1] = v;
  }
  getValues() {
    const out = [];
    for (let i = 0; i < this.h; i++) {
      const row = [];
      for (let j = 0; j < this.w; j++) row.push(this._get(this.r + i, this.c + j));
      out.push(row);
    }
    return out;
  }
  setValues(vals) {
    for (let i = 0; i < vals.length; i++)
      for (let j = 0; j < vals[i].length; j++)
        this._set(this.r + i, this.c + j, vals[i][j]);
    return this;
  }
  getValue() { return this._get(this.r, this.c); }
  setValue(v) { this._set(this.r, this.c, v); return this; }
  setFormula(f) { this._set(this.r, this.c, f); return this; }
  clear() {
    if (this.h === 1 && this.w === 1) { this._set(this.r, this.c, ''); return this; }
    for (let i = 0; i < this.h; i++)
      for (let j = 0; j < this.w; j++) this._set(this.r + i, this.c + j, '');
    return this;
  }
  clearContent() { return this.clear(); }
  setFontWeight() { return this; } setFontStyle() { return this; } setFontColor() { return this; }
  setBackground(v) { this.sheet.bgRules.push({ r: this.r, c: this.c, h: this.h, w: this.w, bg: v }); return this; }
  setFontSize() { return this; }
  setDataValidation(rule) { this.sheet.validations.push({ r: this.r, c: this.c, h: this.h, w: this.w, rule }); return this; }
  clearDataValidations() {
    const overlap = (a1, a2, b1, b2) => a1 <= b2 && b1 <= a2;
    this.sheet.validations = this.sheet.validations.filter(v =>
      !overlap(this.r, this.r + this.h - 1, v.r, v.r + v.h - 1) ||
      !overlap(this.c, this.c + this.w - 1, v.c, v.c + v.w - 1));
    return this;
  }
  protect() {
    const p = {
      desc: '', editors: [],
      r: this.r, c: this.c, h: this.h, w: this.w,
      setDescription(d) { this.desc = d; return this; },
      getDescription() { return this.desc; },
      addEditors(e) { this.editors = this.editors.concat(e); return this; },
      canDomainEdit() { return false; },
      setDomainEdit() { return this; },
      remove: () => { this.sheet.protectedRanges = this.sheet.protectedRanges.filter(x => x !== p); },
    };
    this.sheet.protectedRanges.push(p);
    return p;
  }
  getSheet() { return this.sheet; }
  // API THẬT của Google Range: getRow/getColumn (mock từng thiếu → onEdit test fail ảo)
  getRow() { return this.r; }
  getColumn() { return this.c; }
}

class MockSheet {
  constructor(name) {
    this.name = name; this.id = SHEET_SEQ++; this.rows = []; this.hiddenRows = {};
    this.validations = []; this.protectedRanges = []; this.bgRules = []; this.cfRules = [];
  }
  getName() { return this.name; }
  getSheetId() { return this.id; }
  getLastRow() {
    let last = 0;
    this.rows.forEach((r, i) => { if (r && r.some(v => v !== '' && v !== undefined)) last = i + 1; });
    return last;
  }
  getRange(a, b, c, d) {
    if (typeof a === 'string') return new MockRange(this, 1, 1, 1, 1); // A1-string (chỉ dùng CF)
    if (c === undefined) return new MockRange(this, a, b, 1, 1);
    return new MockRange(this, a, b, c, d);
  }
  getDataRange() { const n = Math.max(this.getLastRow(), 1); return new MockRange(this, 1, 1, n, Math.max(this._maxCols(), 1)); }
  _maxCols() { let m = 1; this.rows.forEach(r => { if (r) m = Math.max(m, r.length); }); return m; }
  appendRow(row) {
    // tìm dòng trống cuối (giống Sheets appendRow thật — append sau dòng có data)
    let idx = this.getLastRow(); // 0-based vị trí append
    while (this.rows.length < idx + 1) this.rows.push([]);
    this.rows[idx] = row.slice();
    return this;
  }
  insertRows(rowIndex, amount) {
    const at = Math.max(rowIndex - 1, 0);
    for (let i = 0; i < amount; i++) this.rows.splice(at, 0, []);
    return this;
  }
  // Google Sheets API thật: chèn cột sau vị trí chỉ định, giữ nguyên dữ liệu cũ.
  insertColumnsAfter(columnPosition, howMany) {
    const at = columnPosition;
    this.rows.forEach(row => {
      for (let i = 0; i < howMany; i++) row.splice(at, 0, '');
    });
    return this;
  }
  deleteRow(rowIndex) { this.rows.splice(rowIndex - 1, 1); return this; }
  clear() { this.rows = []; return this; }
  getProtections() { return this.protectedRanges.slice(); }
  setConditionalFormatRules(rules) { this.cfRules = rules; return this; }
  getConditionalFormatRules() { return this.cfRules || []; }
  hideSheet() { this.hidden = true; return this; }
  showSheet() { this.hidden = false; return this; }
  hideRows(r, n) { n = n || 1; for (let i = r; i < r + n; i++) this.hiddenRows[i] = true; return this; }
  showRows(r, n) { n = n || 1; for (let i = r; i < r + n; i++) delete this.hiddenRows[i]; return this; }
  isRowHiddenByUser(r) { return !!this.hiddenRows[r]; }
  getMaxRows() { return Math.max(this.rows.length, 1000); }
  isSheetHidden() { return !!this.hidden; }
}

class MockSS {
  constructor() { this.sheets = {}; }
  getSheetByName(n) { return this.sheets[n] || null; }
  insertSheet(n) { const s = new MockSheet(n); this.sheets[n] = s; return s; }
  getSheets() { return Object.values(this.sheets); }
  getSpreadsheetLocale() { return STATE.sheetLocale; }
}

// State toàn cục test
const STATE = {
  ss: new MockSS(),
  alerts: [],
  fetches: [],
  confirms: [], // queue: true=YES, false=NO
  menuEntries: [],
  triggers: [],
  logs: [],
  sheetLocale: 'vi_VN', // file Google Sheet tiếng Việt → công thức phải dùng ';'
  ssFileChinh: null,     // bảng mock của FILE CHÍNH (độc lập với ss chính)
  openByIdLoi: false,    // giả lập Google chưa cấp quyền đọc file chính
};

function makeUi() {
  const menu = () => {
  const m = {
    addItem(name, fn) { STATE.menuEntries.push({ type: 'item', name, fn }); return m; },
    addSeparator() { STATE.menuEntries.push({ type: 'sep' }); return m; },
    // MÔ PHỎNG ĐÚNG HÀNH VI GOOGLE: addSubMenu ném lỗi nếu menu con đã được addToUi()
    // (bug thật 17/10: gọi addToUi() trong menu con → menu chính không hiện)
    addSubMenu(sub) {
      if (sub.added) throw new Error('Cannot add submenu "' + sub.name + '" — already added to UI');
      STATE.menuEntries.push({ type: 'sub', name: sub.name });
      return m;
    },
    addToUi() { m.added = true; return m; },
    name: '',
    added: false,
  };
  return m;
  };
  return {
    ButtonSet: { YES_NO: 'YES_NO' },
    Button: { YES: 'YES' },
    prompt(title, message) { STATE.prompts = STATE.prompts || []; const text = STATE.prompts.length ? STATE.prompts.shift() : ''; return { getSelectedButton: () => 'OK', getResponseText: () => text }; },
    alert(a, b) {
      if (typeof a === 'string' && b === undefined) { STATE.alerts.push(a); return 'OK'; }
      const ans = STATE.confirms.length ? STATE.confirms.shift() : true;
      STATE.alerts.push('[confirm] ' + a + ' → ' + ans);
      return ans ? 'YES' : 'NO';
    },
    createMenu(name) { const m = menu(); m.name = name; return m; },
  };
}

const ui = makeUi();

const dvBuilder = {
  requireValueInList(list, show) { this.list = list; return this; },
  requireCheckbox() { this.checkbox = true; return this; },
  setAllowInvalid(v) { this.allowInvalid = v; return this; },
  build() { return { list: this.list, checkbox: this.checkbox, allowInvalid: this.allowInvalid }; },
};

const Utilities = {
  formatDate(date, tz, fmt) {
    const d = new Date(date.getTime() + 7 * 3600 * 1000);
    const p = n => String(n).padStart(2, '0');
    const map = {
      'dd/MM/yyyy': `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`,
      'dd/MM': `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}`,
      'MM-yyyy': `${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`,
      'dd/MM HH:mm': `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`,
      'u': String(((d.getUTCDay() + 6) % 7) + 1),
    };
    if (!map[fmt]) throw new Error('Unsupported format: ' + fmt);
    return map[fmt];
  },
};

const SpreadsheetApp = {
  getActiveSpreadsheet: () => STATE.ss,
  // openById: file chính → bảng mock riêng; ĐÚNG NGUYÊN TẮC: mock này chỉ có read (writes được đếm ở _set)
  openById: (id) => {
    if (id && typeof sandbox !== 'undefined' && sandbox.FCHINH_ID && id === sandbox.FCHINH_ID) {
      if (STATE.openByIdLoi) throw new Error('Exception: You do not have permission to call openById');
      return STATE.ssFileChinh || null;
    }
    return STATE.ss;
  },
  getUi: () => ui,
  newDataValidation: () => Object.create(dvBuilder),
  // Builder mô phỏng đúng API THẬT của Google (ConditionalFormatRuleBuilder).
  // KHÔNG được "bịa" method theo code — bug 17/10: code gọi setFormulaRelativeFormula
  // (không tồn tại) mà mock y hệt → test PASS, Google thật TypeError.
  newConditionalFormatRule: () => Object.create(cfrBuilder),
  ProtectionType: { RANGE: 'RANGE' },
};
// DriveApp (API thật): iterator hasNext/next — STATE.driveFiles = [{getName, getUrl}]
const DriveApp = {
  getFolderById: () => ({
    getFiles: () => {
      const arr = STATE.driveFiles || [];
      let i = 0;
      return { hasNext: () => i < arr.length, next: () => arr[i++] };
    },
  }),
};
const cfrBuilder = {
  whenFormulaSatisfied(f) { this.f = f; return this; },
  setRanges(r) { this.ranges = r; return this; },
  setBackground(b) { this.bg = b; return this; },
  setFontColor(c) { this.fc = c; return this; },
  build() { return { f: this.f, ranges: this.ranges, bg: this.bg, fc: this.fc }; },
};

const sandbox = {
  SpreadsheetApp, Utilities, DriveApp,
  Logger: { log: (m) => STATE.logs.push(String(m)) },
  PropertiesService: { getScriptProperties: () => ({
    getProperty: (key) => ({
      TELEGRAM_BOT_TOKEN: 'TEST_LEGACY_TOKEN',
      DAY_BU_BOT_TOKEN: 'TEST_DAY_BU_TOKEN',
      SOTW_BOT_TOKEN: 'TEST_SOTW_TOKEN',
      SOTW_CHAT_ID: '-1003955550981',
      SOTW_THREAD_ID: '22',
    })[key] || '',
    setProperty: (key, value) => { STATE.scriptProperties = STATE.scriptProperties || {}; STATE.scriptProperties[key] = value; }
  }) },
  UrlFetchApp: {
    fetch(url, opts) {
      opts = opts || {};
      const payload = opts.payload || {};
      STATE.fetches.push({ url, text: payload.text || '', payload });
      if (url.indexOf('/getMe') >= 0) return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ result: { username: 'joy_lichlam_sotw_daybu_bot' } }) };
      return { getResponseCode: () => 200, getContentText: () => 'ok' };
    },
  },
  ScriptApp: {
    getProjectTriggers: () => STATE.triggers.slice(),
    newTrigger(fn) {
      const t = {
        timeBased() { return t; }, onWeekDay() { return t; }, atHour() { return t; },
        create() { STATE.triggers.push({ fn, getHandlerFunction() { return fn; } }); return t; },
      };
      return t;
    },
    deleteTrigger(tr) { const i = STATE.triggers.indexOf(tr); if (i >= 0) STATE.triggers.splice(i, 1); },
    WeekDay: { SATURDAY: 'SATURDAY' },
  },
  console, Date, JSON, Math, Object, Array, String, Number, parseInt, isNaN,
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname + '/Code.gs', 'utf8'), sandbox, { filename: 'Code.gs' });

// Helpers test
function sheet(n) { return STATE.ss.getSheetByName(n); }
function rows(n) { return typeof n === 'string' ? sheet(n).rows : n.rows; }
function findRow(n, colIdx, val) {
  const rs = rows(n);
  for (let i = 1; i < rs.length; i++) if ((rs[i][colIdx] || '') === val) return i + 1;
  return -1;
}
function lastAlert() { return STATE.alerts[STATE.alerts.length - 1]; }

// ================= TESTS =================
console.log('\n=== T1: Nâng cấp sheet SOTW ===');
{
  // Tạo BAO_BU có sẵn data (mô phỏng sheet cũ của chị)
  const bao = STATE.ss.insertSheet('BAO_BU');
  bao.appendRow(['Ngày báo', 'GV báo', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú']);
  // dòng mẫu CŨ (bản trước)
  bao.appendRow(['', '', '(ghi chú mẫu: nếu lớp không ai nghỉ, GV gõ "Không bù" ở đây)', '', '', '', '', '', '']);
  // data thật
  // Sheet CŨ thật: Tên bé ở cột C, Lớp ở cột D (migration sẽ hoán lại)
  bao.appendRow([new Date(), 'Ms. Vân', 'Bé Một', 'S1.005 - Peach', 'SP1', '', '', '', '']);
  bao.appendRow([new Date(), 'Ms. Vân', 'Bé Hai', 'S1.005 - Peach', 'SP1', '', '', '', '']);
  bao.appendRow([new Date(), 'Mr. Ngọc', 'Bé Ba', 'S1.001 - Cashew', 'Kids', '', '', '', '']);

  sandbox.nangCapSheetSotw();

  const sotw = sheet('DS HỌC SINH');
  ok(!!sotw, 'Tạo tab DS HỌC SINH');
  eq(sotw.getRange(2, 1).getValue(), 'Tên bé', 'Header DS HỌC SINH');
  eq(sotw.getRange(1, 1).getValue(), 'GV đang chọn:', 'Ô GV đang chọn');
  ok(sotw.cfRules.length === 1, 'Conditional formatting đã gắn');
  ok(sotw.validations.some(v => v.rule && v.rule.checkbox), 'Validation checkbox cột tick');

  eq(bao.getRange(1, 10).getValue(), 'SOTW', 'Cột J BAO_BU = SOTW');
  ok(String(bao.getRange(4, 10).getValue()).includes('HYPERLINK'), 'Hyperlink ở dòng data');
  ok(String(bao.getRange(4, 10).getValue()).includes(';"Mở'), 'J dùng ngách ";" theo locale vi_VN (không #ERROR!)');
  // 2 dòng mẫu mới, data giữ nguyên
  const r2 = bao.getRange(2, 9).getValue(), r3 = bao.getRange(3, 9).getValue();
  ok(String(r2).includes('(DÒNG MẪU)'), 'Dòng mẫu 1 tại row2');
  ok(String(r3).includes('(DÒNG MẪU)'), 'Dòng mẫu 2 tại row3');
  eq(bao.getRange(2, 11).getValue(), '', 'Dòng mẫu 1 để trống Ca đặc biệt');
  eq(bao.getRange(3, 11).getValue(), 'ĐB-01 | Thứ 4 | 14h00 - 15h30 | Ms. Vân', 'Dòng mẫu 2 có form Ca đặc biệt mới');
  eq(findRow(bao, 3, 'Bé Một'), 4, 'Data cũ trượt xuống row4 (không mất)');
  const pMau = bao.protectedRanges.find(pp => (pp.desc || '').indexOf('Dòng mẫu') >= 0);
  const pQl = bao.protectedRanges.find(pp => (pp.desc || '').indexOf('Chỉ quản lý sửa') >= 0);
  ok(!!pMau && pMau.editors.length === 3 && pMau.w === 12, 'Bảo vệ đủ 2 dòng mẫu gồm Ca đặc biệt/GV ưu tiên');
  ok(!!pQl && pQl.w === 1, 'Chỉ khóa Trạng thái; quản lý được đổi Ca xếp bằng dropdown');

  // chạy lại lần 2 → không thêm dòng mẫu trùng
  sandbox.nangCapSheetSotw();
  const cnt = bao.rows.filter(r => String((r[8] || '')).includes('(DÒNG MẪU)')).length;
  eq(cnt, 2, 'Chạy lại không tạo dòng mẫu trùng');
}

console.log('\n=== T2: onEdit bỏ qua dòng mẫu ===');
{
  const bao = sheet('BAO_BU');
  sandbox.onEdit({ range: bao.getRange(2, 3) }); // dòng mẫu
  ok(!bao.getRange(2, 1).getValue(), 'Dòng mẫu: không tự gõ ngày');
  sandbox.onEdit({ range: bao.getRange(4, 3) }); // dòng data
  ok(!!bao.getRange(4, 1).getValue(), 'Dòng data: tự gõ ngày');
}

// Replaced by the approved two-stage workflow test (T39).
console.log('\n=== T12: menu onOpen — workflow tuần + 4 menu con rõ việc ===');
{
  STATE.menuEntries.length = 0;
  STATE.logs.length = 0;
  try { sandbox.onOpen(); ok(true, 'onOpen OK'); }
  catch (e) { ok(false, 'onOpen lỗi: ' + e.message); }
  const items = STATE.menuEntries.filter(e => e.type === 'item');
  const subs = STATE.menuEntries.filter(e => e.type === 'sub');
  ['menuDongBoDS', 'gomNhom', 'xuLyCaseDacBiet', 'chotBaoBuTaoLichTinPH', 'chotLichTaoTinGV', 'guiTinChoGV', 'lamMoiTuanMoi'].forEach(fn => {
    ok(items.some(e => e.fn === fn), 'Nút chính workflow có: ' + fn);
  });
  eq(items.slice(0, 7).map(e => e.fn),
    ['menuDongBoDS', 'gomNhom', 'chotBaoBuTaoLichTinPH', 'xuLyCaseDacBiet', 'chotLichTaoTinGV', 'guiTinChoGV', 'lamMoiTuanMoi'],
    '7 nút đầu theo workflow hai giai đoạn');
  eq(subs.length, 4, 'Đúng 4 menu con');
  ok(subs.some(s => s.name.includes('Gửi tin / Nhắc việc')), 'Menu con: Gửi tin / Nhắc việc');
  ok(subs.some(s => s.name.includes('Backup / Thống kê / Chốt tháng')), 'Menu con: Backup / Thống kê / Chốt tháng');
  ok(subs.some(s => s.name.includes('Cập nhật dữ liệu phụ')), 'Menu con: Cập nhật dữ liệu phụ');
  ok(subs.some(s => s.name.includes('Cài đặt kỹ thuật')), 'Menu con: Cài đặt kỹ thuật');
  ok(items.some(e => e.fn === 'huongDanQuyTrinhDayBu'), 'Có hướng dẫn quy trình tuần + chốt tháng');
  ok(items.some(e => e.fn === 'lamMoiDanhSachCaXep'), 'Có nút làm mới danh sách Ca xếp');
  // Mọi hàm menu trỏ tới phải tồn tại
  const missing = items.filter(e => typeof sandbox[e.fn] !== 'function').map(e => e.fn);
  eq(missing.length, 0, 'Đủ hàm cho mọi nút menu');
  // Bắt lỗi bị nuốt trong try/catch của onOpen (bug thật 17/10: menu con addToUi
  // → addSubMenu ném lỗi → menu chính "📚 Dạy Bù" biến mất, chỉ còn menu con lèo ra ngoài)
  ok(!STATE.logs.some(l => String(l).includes('LỖI TẠO MENU')), 'onOpen không có lỗi bị nuốt');
}

console.log('\n=== T13: setupDayBu trên sheet TRỐNG (sheet mới) ===');
{
  STATE.ss = new MockSS(); // sheet mới hoàn toàn
  STATE.confirms.push(true);
  sandbox.setupDayBu();
  ok(!!sheet('BAO_BU') && !!sheet('LICH_BU') && !!sheet('LOP') && !!sheet('DS HỌC SINH'), 'Tạo đủ 4 tab');
  eq(rows('LOP').length, 26, 'Tab LOP đủ 25 lớp + header');
  eq(sheet('BAO_BU').getRange(1, 10).getValue(), 'SOTW', 'BAO_BU có cột SOTW');
  ok(String(sheet('BAO_BU').getRange(2, 9).getValue()).includes('(DÒNG MẪU)'), 'Có dòng mẫu 1');
  ok(String(sheet('BAO_BU').getRange(3, 9).getValue()).includes('(DÒNG MẪU)'), 'Có dòng mẫu 2');
  eq(sheet('DS HỌC SINH').getRange(2, 6).getValue(), '☑ SOTW tuần này', 'DS HỌC SINH header tick');
  ok(sheet('LOP').isSheetHidden(), 'Tab LOP bị ẩn sau khi tạo sheet');
  const cfr = sheet('DS HỌC SINH').getConditionalFormatRules();
  eq(cfr.length, 1, 'DS HỌC SINH có đúng 1 rule tô màu');
  ok(String(cfr[0].f).indexOf('=AND($B$1') === 0, 'Rule dùng whenFormulaSatisfied (API thật) + đúng công thức');
  // setupDayBu lần 2 → hủy (confirm NO)
  STATE.confirms.push(false);
  const rowsBefore = rows('BAO_BU').length;
  sandbox.setupDayBu();
  eq(rows('BAO_BU').length, rowsBefore, 'Trả lời KHÔNG → không xoá data');
}

console.log('\n=== T14: Nhắc GV báo bù + gửi tin GV + trigger ===');
{
  STATE.alerts.length = 0;
  const f0 = STATE.fetches.length;
  sandbox.nhacGVBaoBu();
  eq(STATE.fetches.length, f0 + 1, 'Nhắc GV gửi 1 tin');
  ok(STATE.fetches[STATE.fetches.length - 1].text.includes('DS HỌC SINH'), 'Tin nhắc có hướng dẫn SOTW');

  // LICH có ca ✅
  const lich = sheet('LICH_BU');
  lich.appendRow(['T5-1', 'Thứ 5', '17h30 - 19h00', 'Ms. Vân', 'Bé A', 'S1.005 - Peach', 'SP1', 'https://slide', '✅ Đi được', '', '', '✅ Đã học', '', '', '', '', 'T5-1 | Thứ 5 | 17h30 - 19h00 | Ms. Vân', 'DB-T14-1']);
  sandbox.chotLichTaoTin();
  const f1 = STATE.fetches.length;
  sandbox.guiTinChoGV();
  eq(STATE.fetches.length, f1 + 1, 'Gửi tin cho GV: 1 tin');
  ok(STATE.fetches[STATE.fetches.length - 1].text.includes('HỌC BÙ'), 'Nội dung tin GV đúng');

  sandbox.setupTriggerTuanBu();
  ok(lastAlert().includes('trigger'), 'Cài trigger thành công');

  // guiSOTW khi chưa tick gì (sheet mới chưa có data tick)
  const rs = sandbox.guiSOTW(false);
  ok(rs.msg.includes('Chưa bé nào') || rs.msg.includes('Chưa có tab'), 'SOTW chưa tick → báo đúng');
}

// Replaced by the approved two-stage workflow test (T39).
console.log('\n=== T17: Nâng cấp — hỏi cài trigger 1 lần + ẩn/hiện LOP ===');
{
  STATE.triggers.length = 0; // xoá để test nhánh "chưa có trigger"
  const lop = sheet('LOP');
  ok(!!lop && lop.isSheetHidden(), 'T13 đã ẩn tab LOP');
  sandbox.anTabLop();
  ok(!lop.isSheetHidden(), '🗜️ anTabLop: hiện lại được');
  STATE.confirms.push(true); // trả lời CÓ
  STATE.alerts.length = 0;
  sandbox.nangCapSheetSotw();
  eq(STATE.triggers.length, 1, 'Hỏi 1 lần → cài trigger backup T7');
  ok(lop.isSheetHidden(), 'Nâng cấp sheet: tự ẩn tab LOP');
  // Chạy lại: trigger đã có → KHÔNG hỏi nữa (không tiêu confirm)
  STATE.alerts.length = 0;
  sandbox.nangCapSheetSotw();
  ok(!STATE.alerts.some(a => a.indexOf('[confirm]') >= 0), 'Chạy lại KHÔNG hỏi cài trigger nữa');
  eq(STATE.triggers.length, 1, 'Không cài trùng trigger');
  sandbox.anTabLop();
  ok(!lop.isSheetHidden(), '🗜️ anTabLop: ẩn/hiện đảo đúng lần 2');
}

console.log('\n=== T18: Google thiếu API / 1 bước lỗi → nangCap KHÔNG chết giữa chừng ===');
{
  // A) Google không có method whenFormulaSatisfied (mô phỏng bug API thật)
  const saved = cfrBuilder.whenFormulaSatisfied;
  delete cfrBuilder.whenFormulaSatisfied;
  STATE.alerts.length = 0; STATE.logs.length = 0;
  try { sandbox.nangCapSheetSotw(); ok(true, 'A) nangCap chạy hết, không ném lỗi ra ngoài'); }
  catch (e) { ok(false, 'A) nangCap vẫn ném lỗi: ' + e.message); }
  cfrBuilder.whenFormulaSatisfied = saved;
  ok(STATE.logs.some(l => String(l).indexOf('Bỏ qua rule tô màu') >= 0), 'A) Lý do rule được ghi nhật ký');
  ok(String(sheet('BAO_BU').getRange(2, 10).getValue()).indexOf('HYPERLINK') >= 0, 'A) Cột J link vẫn hoạt động (các bước sau vẫn chạy)');
  // B) Một bước cốt lõi lỗi → vẫn chạy nốt, BÁO RÕ chỗ lỗi cuối popup
  const origDongMau = sandbox.taoDongMau;
  sandbox.taoDongMau = function () { throw new Error('giả lập lỗi dòng mẫu'); };
  STATE.alerts.length = 0;
  try { sandbox.nangCapSheetSotw(); ok(true, 'B) nangCap chạy hết dù có bước lỗi'); }
  catch (e) { ok(false, 'B) nangCap ném lỗi ra ngoài: ' + e.message); }
  sandbox.taoDongMau = origDongMau;
  ok(lastAlert().indexOf('gặp lỗi') >= 0, 'B) Popup báo rõ N chỗ gặp lỗi');
  ok(lastAlert().indexOf('giả lập lỗi dòng mẫu') >= 0, 'B) Nêu đúng tên bước lỗi');
  ok(lastAlert().indexOf('Bước tiếp') >= 0, 'Vẫn hiện hướng dẫn bước tiếp (không mất)');
}

console.log('\n=== T19: Ngách công thức theo locale + ghi đè ô J đang #ERROR! ===');
{
  const bao = sheet('BAO_BU');
  const ds = sheet('DS HỌC SINH');
  // Mô phỏng đúng triệu chứng Google thật: ô J lỗi + công thức gõ sai kiểu en-US
  bao.getRange(4, 10).setValue('#ERROR!');
  bao.getRange(5, 10).setFormula('=BROKEN("x","y")');
  STATE.sheetLocale = 'vi_VN';
  sandbox.themLinkSotw(bao, ds.getSheetId());
  ok(String(bao.getRange(4, 10).getValue()).indexOf('#ERROR!') < 0, 'Ô #ERROR! được ghi đè lại');
  ok(String(bao.getRange(5, 10).getValue()).indexOf('BROKEN') < 0, 'Công thức hỏng bị thay');
  ok(String(bao.getRange(4, 10).getValue()).includes(';"Mở'), 'vi_VN → dùng ";"');
  STATE.sheetLocale = 'en_US';
  sandbox.themLinkSotw(bao, ds.getSheetId());
  ok(String(bao.getRange(4, 10).getValue()).includes(',"Mở'), 'en_US → dùng ","');
  STATE.sheetLocale = 'vi_VN';
}

console.log('\n=== T20: Đồng bộ DS từ file chính — CHỈ ĐỌC, chỉ giữ bé trong file chính ===');
{
  // File chính mock: 2 tab, tab theo gid = 294797681 (đúng gid anh gửi)
  const fc = new MockSS();
  const khac = fc.insertSheet('Sheet1'); khac.id = 111;
  const goc = fc.insertSheet('DANH SACH'); goc.id = 294797681;
  goc.getRange(1, 1, 5, 4).setValues([
    ['STT', 'Họ và tên', 'Lớp', 'GV chính'],
    [1, 'Ngô Bảo Hàn', 'S1.001 - Cashew', 'Mr. Ngọc'],
    [2, 'Bé Mới Tên', 'S1.001 - Cashew', 'Mr. Ngọc'],
    [3, 'Bé Lớp Khác', 'S2.003 - Peanut', 'Ms. Vân'],
    [4, 'Bé GV Lạ', 'C2.002 - Chestnut', 'Cô Mai'],
  ]);
  goc.writes = 0; // reset bộ đếm TRƯỚC khi đồng bộ

  // DS hiện tại: 1 bé khớp file (đã có link+tick), 1 bé chỉ có trong DS
  const ds = sheet('DS HỌC SINH');
  ds.getRange(3, 1, 2, 6).setValues([
    ['Ngô Bảo Hàn', 'S1.001 - Cashew', 'Mr. Ngọc', 'Nam', 'https://x/a.png', true],
    ['Bé Chỉ Trong DS', 'S1.001 - Cashew', 'Mr. Ngọc', '', '', false],
  ]);

  STATE.ssFileChinh = fc;
  STATE.openByIdLoi = false;
  const kq = sandbox.dongBoAnToan(STATE.ss);
  ok(!kq.loi, 'Đồng bộ không lỗi' + (kq.loi ? ': ' + kq.loi : ''));
  eq(kq.tongNguon, 4, 'Đọc đủ 4 bé từ file chính (tab theo gid)');
  eq(kq.them, 3, '3 bé mới');
  ok(kq.boTen.includes('Bé Chỉ Trong DS'), 'Bé thiếu trong file chính → tự bỏ');
  ok(kq.gvLa.includes('Cô Mai'), 'GV lạ trong file chính được cảnh báo');

  // GIỮ link/tick/giới tính theo tên bé
  const dHan = findRow(ds, 0, 'Ngô Bảo Hàn');
  ok(dHan > 0, 'Bé khớp file vẫn có trong DS');
  eq(ds.getRange(dHan, 4).getValue(), 'Nam', 'Giới tính GIỮ');
  eq(ds.getRange(dHan, 5).getValue(), 'https://x/a.png', 'Link ảnh GIỮ');
  eq(ds.getRange(dHan, 6).getValue(), true, 'Tick SOTW GIữ');
  // Bé mới vào với GV lấy từ file chính
  const dMoi = findRow(ds, 0, 'Bé Mới Tên');
  ok(dMoi > 0, 'Bé mới được thêm');
  eq(ds.getRange(dMoi, 3).getValue(), 'Mr. Ngọc', 'GV chính lấy từ file chính');
  // Bé chỉ trong DS: file chính là nguồn chuẩn nên tự bỏ.
  const dBo = findRow(ds, 0, 'Bé Chỉ Trong DS');
  eq(dBo, -1, 'Bé chỉ trong DS được tự bỏ');
  // Tiêu đề2 hàng đầu không bị đụng
  eq(ds.getRange(1, 1).getValue(), 'GV đang chọn:', 'Hàng tiêu đề/filter nguyên vẹn');
  // NGUYÊN TẮC BẤT DI BẤT DỌNG: file chính 0 lượt ghi
  eq(goc.writes || 0, 0, 'CHỈ ĐỌC — file chính không 1 lần bị ghi');

  // Thiếu quyền → bọc an toàn, không ném exception
  STATE.openByIdLoi = true;
  const kq2 = sandbox.dongBoAnToan(STATE.ss);
  ok(!!kq2.loi, 'Thiếu quyền → trả {loi}, không ném lỗi');
  // Nút menu thiếu quyền → hướng dẫn cấp quyền
  STATE.alerts.length = 0;
  sandbox.menuDongBoDS();
  ok(lastAlert().indexOf('Chưa đọc được file chính') >= 0, 'Popup báo chưa đọc được');
  ok(lastAlert().indexOf('Cho phép') >= 0, 'Nêu bước Cho phép quyền');
  // Gom nhóm chạy được cả khi thiếu quyền (không chết)
  STATE.alerts.length = 0;
  try { sandbox.gomNhom(); ok(true, 'gomNhom vẫn chạy khi thiếu quyền file chính'); }
  catch (e) { ok(false, 'gomNhom ném lỗi vì thiếu quyền: ' + e.message); }
  ok(lastAlert().indexOf('chưa đọc được file chính') >= 0, 'Gom nhóm nhắc cách cấp quyền');
  STATE.openByIdLoi = false;

  // Nâng cấp sheet có nhắc kết quả đồng bộ
  STATE.alerts.length = 0;
  sandbox.nangCapSheetSotw();
  ok(lastAlert().indexOf('file chính') >= 0, 'Nâng cấp nhắc kết quả đồng bộ file chính');
}

console.log('\n=== T21: Đọc file chính — "Full name"/"Lớp", fallback tab, lỗi nêu rõ ===');
{
  // A) tab theo gid TRỐNG → tự fallback sang tab có header 'Full name' + 'Lớp'
  const fc = new MockSS();
  const trong = fc.insertSheet('Trang trắng'); trong.id = 294797681;
  const f2 = fc.insertSheet('DS GỐC'); f2.id = 777;
  f2.getRange(1, 1, 3, 3).setValues([
    ['Full name', 'Lớp', 'GV'],
    ['Bé Một A', 'S1.001 - Cashew', 'Mr. Ngọc'],
    ['Bé Hai A', 'S2.003 - Peanut', 'Ms. Vân'],
  ]);
  STATE.ssFileChinh = fc;
  STATE.openByIdLoi = false;
  const kq = sandbox.dongBoAnToan(STATE.ss);
  ok(!kq.loi, 'Fallback sang tab có tiêu đề' + (kq.loi ? ': ' + kq.loi : ''));
  eq(kq.tongNguon, 2, 'Đọc đủ 2 bé qua tab phụ');

  // B) Không tab nào có header → lỗi nêu SỐ tab + TÊN tab đã thử
  const fc2 = new MockSS();
  const a = fc2.insertSheet('Ảnh'); a.id = 294797681;
  a.getRange(1, 2, 2, 2).setValues([['Ghi chú', 'Khác'], ['abc', 'xyz']]);
  const b = fc2.insertSheet('Báo cáo'); b.id = 5;
  STATE.ssFileChinh = fc2;
  const kq2 = sandbox.dongBoAnToan(STATE.ss);
  ok(!!kq2.loi, 'Không có header → báo lỗi');
  ok(String(kq2.loi).indexOf('Đã thử 2 tab') >= 0, 'Nêu số tab đã thử');
  ok(String(kq2.loi).indexOf('"Ảnh"') >= 0 && String(kq2.loi).indexOf('"Báo cáo"') >= 0, 'Nêu tên các tab');
  ok(String(kq2.loi).indexOf('Full name') >= 0, 'Gợi ý header cần có');

  // C) Có cột Tên nhưng thiếu cột Lớp → báo ĐÚNG chỗ thiếu
  const fc3 = new MockSS();
  const c1 = fc3.insertSheet('DS'); c1.id = 294797681;
  c1.getRange(1, 1, 2, 2).setValues([['Full name', 'Ghi chú'], ['Bé A', 'x']]);
  STATE.ssFileChinh = fc3;
  const kq3 = sandbox.dongBoAnToan(STATE.ss);
  ok(!!kq3.loi && String(kq3.loi).indexOf('thiếu cột chứa chữ "Lớp"') >= 0, 'Báo đúng thiếu cột Lớp');
  STATE.ssFileChinh = fc;
}

console.log('\n=== T22: Lọc DS theo GV + lớp — ẩn dòng THẬT, dropdown theo dữ liệu ===');
{
  const ds = sheet('DS HỌC SINH');
  ds.showRows(3, 1000);
  ds.getRange(3, 1, 60, 6).clearContent();
  ds.getRange(3, 1, 6, 6).setValues([
    ['Bé V1', 'C2.001 - Strawberry', 'Ms. Uyên Vi', '', '', ''],
    ['Bé V2', 'C2.001 - Strawberry', 'Ms. Uyên Vi', '', '', ''],
    ['Bé N1', 'S2.006 - Avocado', 'Ms. Nhung', '', '', ''],
    ['Bé N2', 'S2.006 - Avocado', 'Ms. Nhung', '', '', ''],
    ['Bé N3', 'S1.005 - Peach', 'Ms. Nhung', '', '', ''],
    ['Bé K1', 'C2.002 - Chestnut', 'Ms. Vân', '', '', ''],
  ]);
  ds.getRange(1, 2).clearContent();
  ds.getRange(1, 4).clearContent();

  // 1) Chọn Ms. Nhung → hiện đúng 3 bé Nhung, ẩn 3 bé khác
  ds.getRange(1, 2).setValue('Ms. Nhung');
  sandbox.apLocDS(ds);
  ok(ds.isRowHiddenByUser(3) && ds.isRowHiddenByUser(4), 'Ẩn 2 dòng Ms. Uyên Vi');
  ok(!ds.isRowHiddenByUser(5) && !ds.isRowHiddenByUser(6) && !ds.isRowHiddenByUser(7), 'Hiện 3 dòng Ms. Nhung');
  ok(ds.isRowHiddenByUser(8), 'Ẩn dòng Ms. Vân');
  // Dropdown Lớp = CHỈ lớp của GV đang chọn
  const dvLop = ds.validations.filter(v => v.r === 1 && v.c === 4).pop();
  eq(dvLop.rule.list.join('|'), 'S2.006 - Avocado|S1.005 - Peach', 'Dropdown Lớp = lớp của Ms. Nhung');

  // 2) Chọn thêm lớp Peach → chỉ bé N3 (hàng 7) hiện
  ds.getRange(1, 4).setValue('S1.005 - Peach');
  sandbox.apLocDS(ds);
  ok(!ds.isRowHiddenByUser(7) && ds.isRowHiddenByUser(5) && ds.isRowHiddenByUser(6), 'Lọc tiếp theo lớp');

  // 3) Lớp không thuộc GV → tự xoá ô lớp, về 3 bé Nhung
  ds.getRange(1, 4).setValue('C2.001 - Strawberry');
  sandbox.apLocDS(ds);
  eq(String(ds.getRange(1, 4).getValue()), '', 'Lớp lạc GV → tự xoá ô chọn');
  ok(!ds.isRowHiddenByUser(5), 'Về lại danh sách bé Ms. Nhung');

  // 4) Người dùng đổi B1 → onEdit tự chạy lọc (không cần bấm nút nào)
  ds.getRange(1, 2).setValue('Ms. Vân');
  sandbox.onEdit({ range: ds.getRange(1, 2) });
  ok(!ds.isRowHiddenByUser(8) && ds.isRowHiddenByUser(5), 'onEdit B1 → lọc theo Ms. Vân');

  // 5) Xoá ô GV → hiện toàn bộ; dropdown GV lấy từ CHÍNH DỮ LIỆU
  ds.getRange(1, 2).clearContent();
  sandbox.onEdit({ range: ds.getRange(1, 2) });
  ok(!ds.isRowHiddenByUser(3) && !ds.isRowHiddenByUser(8), 'Xoá lọc → hiện toàn bộ');
  const dvGv = ds.validations.filter(v => v.r === 1 && v.c === 2).pop();
  ok(dvGv.rule.list.indexOf('Ms. Nhung') >= 0 && dvGv.rule.list.indexOf('Ms. Uyên Vi') >= 0,
    'Dropdown GV = tên GV có thật trong dữ liệu');

  // 6) Đồng bộ → bộ lọc tự chạy lại, chỉ giữ đúng danh sách từ file chính.
  const fcT22 = new MockSS(), srcT22 = fcT22.insertSheet('DANH SACH'); srcT22.id = 294797681;
  srcT22.getRange(1,1,7,3).setValues([
    ['Họ và tên','Lớp','GV chính'],
    ['Bé V1','C2.001 - Strawberry','Ms. Uyên Vi'], ['Bé V2','C2.001 - Strawberry','Ms. Uyên Vi'],
    ['Bé N1','S2.006 - Avocado','Ms. Nhung'], ['Bé N2','S2.006 - Avocado','Ms. Nhung'],
    ['Bé N3','S1.005 - Peach','Ms. Nhung'], ['Bé K1','C2.002 - Chestnut','Ms. Vân'],
    ['Bé Một A','S1.001 - Cashew','Mr. Ngọc']
  ]);
  STATE.ssFileChinh = fcT22; ds.getRange(1, 2).setValue('Ms. Uyên Vi');
  const kq = sandbox.dongBoAnToan(STATE.ss);
  ok(!kq.loi, 'Đồng bộ OK' + (kq.loi ? ': ' + kq.loi : ''));
  ok(!ds.isRowHiddenByUser(3) && !ds.isRowHiddenByUser(4), 'Bé Ms. Uyên Vi vẫn hiện sau đồng bộ');
  ok(ds.isRowHiddenByUser(5), 'Dòng mới từ GV khác bị ẩn theo filter');
}

console.log('\n=== T23: Đổi cột BAO_BU — Lớp ngay sau GV báo (sheet cũ tự chuyển) ===');
{
  const bao = sheet('BAO_BU');
  // Giả lập sheet CHƯA nâng cấp: header kiểu cũ + 1 dòng data kiểu cũ
  bao.getRange(1, 3).setValue('Tên bé');
  bao.getRange(1, 4).setValue('Lớp');
  bao.appendRow([new Date(), 'Ms. Vân', 'Bé Cũ CV', 'S1.005 - Peach', 'SP1', '', '', '', '']);
  const chuyen = sandbox.chuyenCotMoiBAOBU(bao);
  ok(chuyen === true, 'Nhận diện cột cũ → chuyển');
  eq(bao.getRange(1, 3).getValue(), 'Lớp', 'C1 = Lớp (ngay sau GV báo)');
  eq(bao.getRange(1, 4).getValue(), 'Tên bé', 'D1 = Tên bé');
  const dCu = findRow(bao, 3, 'Bé Cũ CV');
  ok(dCu > 0, 'Dữ liệu hoán cột đúng (tên về D)');
  eq(bao.getRange(dCu, 3).getValue(), 'S1.005 - Peach', 'Lớp về cột C');
  ok(sandbox.chuyenCotMoiBAOBU(bao) === false, 'Chạy lần 2 → bỏ qua (idempotent)');
}

console.log('\n=== T24: BAO_BU chọn nhanh GV → Lớp → Tên bé (cascade từ DS) ===');
{
  const bao = sheet('BAO_BU');
  // Chọn GV → dropdown Lớp = lớp của GV đó (theo DS HỌC SINH)
  bao.getRange(4, 2).setValue('Ms. Nhung');
  sandbox.apCascading(bao, 4);
  const dv3 = bao.validations.filter(v => v.r === 4 && v.c === 3).pop();
  ok(dv3 && dv3.rule.list && dv3.rule.list.indexOf('S2.006 - Avocado') >= 0,
    'Chọn GV → dropdown Lớp theo thiết lập LOP của Ms. Nhung');
  ok(dv3.rule.list.indexOf('S1.005 - Peach') < 0, 'LOP ưu tiên hơn GV cũ trong DS khi có khác biệt');
  ok(dv3.rule.list.indexOf('C2.001 - Strawberry') < 0, 'Không lẫn lớp của GV khác');
  // Chọn lớp → dropdown Tên bé = bé lớp đó
  bao.getRange(4, 3).setValue('S1.005 - Peach');
  sandbox.apCascading(bao, 4);
  const dv4 = bao.validations.filter(v => v.r === 4 && v.c === 4).pop();
  eq(dv4.rule.list.join('|'), 'Bé N3', 'Chọn lớp → dropdown Tên bé = bé lớp đó');
  // Xoá GV → dropdown Lớp về toàn bộ lớp trong DS
  bao.getRange(4, 2).clearContent();
  sandbox.apCascading(bao, 4);
  const dv3b = bao.validations.filter(v => v.r === 4 && v.c === 3).pop();
  ok(dv3b.rule.list.indexOf('S1.001 - Cashew') >= 0, 'Xoá GV → dropdown Lớp = mọi lớp trong DS');
  // Người dùng sửa B1 (GV) → onEdit tự chạy cascade
  bao.getRange(4, 2).setValue('Ms. Nhung');
  sandbox.onEdit({ range: bao.getRange(4, 2) });
  const dv3c = bao.validations.filter(v => v.r === 4 && v.c === 3).pop();
  ok(dv3c.rule.list.indexOf('S2.006 - Avocado') >= 0, 'onEdit cột GV → tự cập nhật dropdown Lớp');

  // ĐẢO CHIỀU: chọn TÊN BÉ trước → tự điền Lớp + GV
  const bao2 = sheet('BAO_BU');
  bao2.appendRow([new Date(), '', '', 'Bé N1', 'SP1', '', '', '', '']); // row mới: chỉ gõ tên
  const dMoi = findRow(bao2, 3, 'Bé N1');
  ok(dMoi > 0, 'Thêm dòng chỉ có tên bé');
  sandbox.apCascading(bao2, dMoi, undefined, 4);
  eq(bao2.getRange(dMoi, 3).getValue(), 'S2.006 - Avocado', 'Chọn tên bé → tự điền Lớp');
  eq(bao2.getRange(dMoi, 2).getValue(), 'Ms. Nhung', 'Chọn tên bé → tự điền GV báo (ô trống)');
  // onEdit cột D cũng chạy
  const bao3 = sheet('BAO_BU');
  bao3.appendRow([new Date(), '', '', 'Bé K1', '', '', '', '', '']);
  const dK1 = findRow(bao3, 3, 'Bé K1');
  sandbox.onEdit({ range: bao3.getRange(dK1, 4) });
  eq(bao3.getRange(dK1, 3).getValue(), 'C2.002 - Chestnut', 'onEdit cột Tên bé → tự điền Lớp');
  eq(bao3.getRange(dK1, 2).getValue(), 'Ms. Vân', 'onEdit cột Tên bé → tự điền GV');
  // Tên trùng 2 lớp → không tự điền, dropdown hiện 2 lớp đó
  STATE.ss.getSheetByName('DS HỌC SINH').appendRow(['Bé Trùng', 'S1.001 - Cashew', 'Mr. Ngọc', '', '', '']);
  STATE.ss.getSheetByName('DS HỌC SINH').appendRow(['Bé Trùng', 'S2.003 - Peanut', 'Ms. Vân', '', '', '']);
  const bao4 = sheet('BAO_BU');
  bao4.appendRow([new Date(), '', '', 'Bé Trùng', '', '', '', '', '']);
  const dTrung = findRow(bao4, 3, 'Bé Trùng');
  sandbox.apCascading(bao4, dTrung, undefined, 4);
  eq(bao4.getRange(dTrung, 3).getValue(), '', 'Tên trùng 2 lớp → KHÔNG tự điền Lớp');
  const dvTrung = bao4.validations.filter(v => v.r === dTrung && v.c === 3).pop();
  eq(dvTrung.rule.list.length, 2, 'Dropdown Lớp hiện 2 lớp của bé trùng tên');

  // Quản lý đổi GV của lớp trong tab LOP: BAO_BU phải lấy theo LOP ngay,
  // dù cột GV cũ trong DS HỌC SINH chưa kịp đồng bộ.
  const lopSh = sheet('LOP');
  const dCarrot = lopSh.rows.findIndex(r => r[0] === 'T2.002 - Carrot') + 1;
  const dsForOverride = sheet('DS HỌC SINH');
  dsForOverride.appendRow(['Bé Carrot Test', 'T2.002 - Carrot', '', '', '', '']);
  lopSh.getRange(dCarrot, 2).setValue('Ms. Uyên Vi');
  const dUy = bao.getLastRow() + 1;
  bao.appendRow([new Date(), 'Ms. Uyên Vi', '', '', 'SP1', '', '', '', '']);
  sandbox.apCascading(bao, dUy);
  const dvUy = bao.validations.filter(v => v.r === dUy && v.c === 3).pop();
  ok(dvUy.rule.list.indexOf('T2.002 - Carrot') >= 0, 'Đổi GV trong LOP → BAO_BU hiện đúng lớp của GV mới');
}

console.log('\n=== T27: 🔍 Kiểm tra / sửa thứ tự cột BAO_BU ===');
{
  const bao = sheet('BAO_BU');
  // 1 dòng bị ngược (C = tên, D = lớp) trong sheet header đúng
  bao.appendRow([new Date(), 'Ms. Vân', 'Bé Nguoc', 'S1.006 - Lychee', 'SP1', '', '', '', '']);
  STATE.alerts.length = 0;
  sandbox.kiemTraThuTuCot();
  ok(findRow(bao, 2, 'Bé Nguoc') < 0, 'Dòng ngược đã bị hoán (không còn tên ở cột C)');
  const dS106 = findRow(bao, 2, 'S1.006 - Lychee');
  ok(dS106 > 0 && bao.getRange(dS106, 4).getValue() === 'Bé Nguoc', 'Lớp về C, tên về D');
  ok(lastAlert().indexOf('ĐÃ TỰ SỬA') >= 0, 'Popup báo đã tự sửa');
  // Chạy lại → không còn gì để sửa
  STATE.alerts.length = 0;
  sandbox.kiemTraThuTuCot();
  ok(lastAlert().indexOf('Không dòng nào bị ngược') >= 0, 'Chạy lại → sạch');
  // Dòng không chắc (2 cột đều giống tên) → báo để anh xem tay
  bao.appendRow([new Date(), 'Ms. Vân', 'Bé La', 'Bé Lanh', 'SP1', '', '', '', '']);
  STATE.alerts.length = 0;
  sandbox.kiemTraThuTuCot();
  ok(lastAlert().indexOf('không chắc') >= 0, 'Dòng mơ hồ → báo anh xem tay');
  // Dọn lại
  const dLa = findRow(bao, 3, 'Bé La');
  bao.deleteRow(dLa);
}

// Replaced by the approved two-stage workflow test (T39).
console.log('\n=== T26: 🖼️ Gắn link ảnh từ folder Drive (khớp tên file) ===');
{
  const ds = sheet('DS HỌC SINH');
  // Thiếu link folder → hướng dẫn đầy đủ
  STATE.alerts.length = 0;
  sandbox.ganLinkAnhTuFolder();
  ok(lastAlert().indexOf('Ô H1') >= 0 || lastAlert().indexOf('ô H1') >= 0, 'Thiếu link → hướng dẫn dán vào ô H1');
  ok(lastAlert().indexOf('Bất kỳ ai có') >= 0, 'Hướng dẫn share folder');
  // Có link folder + file ảnh khớp tên bé
  ds.getRange(1, 8).setValue('https://drive.google.com/drive/folders/x1y2z3abcDEFG');
  STATE.driveFiles = [
    { getName: () => 'Bé Một A.png', getUrl: () => 'https://drive.google.com/file/d/AAA' },
    { getName: () => 'anh-la-khac.jpg', getUrl: () => 'https://drive.google.com/file/d/BBB' },
  ];
  STATE.alerts.length = 0;
  sandbox.ganLinkAnhTuFolder();
  const dAnh = findRow(ds, 0, 'Bé Một A');
  ok(dAnh > 0, 'Bé khớp tên file vẫn có trong DS');
  eq(ds.getRange(dAnh, 5).getValue(), 'https://drive.google.com/file/d/AAA', 'Link ảnh tự điền theo TÊN FILE (bỏ dấu)');
  // File thật có dạng MSHS-Họ tên.png: phải ưu tiên MSHS để không lệch khi tên có ký tự Unicode khác nhau.
  ds.getRange(dAnh, 7).setValue('HV152');
  STATE.driveFiles.push({ getName: () => 'HV152-Phạm Gia Khải.png', getUrl: () => 'https://drive.google.com/file/d/HV152' });
  ds.getRange(dAnh, 1).setValue('Phạm Gia Khải');
  STATE.alerts.length = 0;
  sandbox.ganLinkAnhTuFolder();
  eq(ds.getRange(dAnh, 5).getValue(), 'https://drive.google.com/file/d/HV152', 'Link ảnh tự điền theo MSHS trong tên file');
  ok(lastAlert().indexOf('Đã gắn 1') >= 0, 'Báo số link gồm ảnh khớp theo MSHS');
  // MSHS đúng nhưng phần họ tên trong file sai: vẫn ghép theo MSHS, đồng thời phải cảnh báo rõ để quản lý kiểm tra.
  STATE.driveFiles = [{ getName: () => 'HV152-Tên Ghi Nhầm.png', getUrl: () => 'https://drive.google.com/file/d/HV152-sai' }];
  STATE.alerts.length = 0;
  sandbox.ganLinkAnhTuFolder();
  eq(ds.getRange(dAnh, 5).getValue(), 'https://drive.google.com/file/d/HV152-sai', 'MSHS đúng vẫn gắn ảnh dù tên file khác');
  ok(lastAlert().indexOf('⚠️ MSHS và họ tên chưa khớp') >= 0, 'MSHS đúng nhưng tên sai → có cảnh báo');
  ok(lastAlert().indexOf('HV152') >= 0 && lastAlert().indexOf('Phạm Gia Khải') >= 0 && lastAlert().indexOf('Tên Ghi Nhầm') >= 0, 'Cảnh báo nêu MSHS, tên danh sách và tên file');
  ok(lastAlert().indexOf('Chưa khớp file ảnh') >= 0, 'Liệt kê bé chưa có ảnh');
  // Link sai dạng → báo rõ
  ds.getRange(1, 8).setValue('khong-phai-link');
  STATE.alerts.length = 0;
  sandbox.ganLinkAnhTuFolder();
  ok(lastAlert().indexOf('đúng dạng folder') >= 0, 'Link sai → báo đúng bệnh');
  ds.getRange(1, 8).clearContent();
  STATE.driveFiles = [];
}

console.log('\n=== T28: Ca đặc biệt — thứ tiếng Việt T2 đến CN ===');
{
  // Quy ước hệ thống: T2=1 ... T7=6, CN=0 (JavaScript / Utilities ISO).
  // Hàm này chưa tồn tại ở bản cũ: test phải đỏ trước khi sửa Code.gs.
  eq(sandbox.thuVietSangSo('T2'), 1, 'T2 được hiểu là Thứ 2');
  eq(sandbox.thuVietSangSo('T3'), 2, 'T3 được hiểu là Thứ 3');
  eq(sandbox.thuVietSangSo('T4'), 3, 'T4 được hiểu là Thứ 4, không phải Thứ 5');
  eq(sandbox.thuVietSangSo('T5'), 4, 'T5 được hiểu là Thứ 5');
  eq(sandbox.thuVietSangSo('T6'), 5, 'T6 được hiểu là Thứ 6');
  eq(sandbox.thuVietSangSo('T7'), 6, 'T7 được hiểu là Thứ 7');
  eq(sandbox.thuVietSangSo('CN'), 0, 'CN được hiểu là Chủ nhật');
  const caT2 = sandbox.parseCaDacBiet('T2 08h00-09h30 Ms. Vân');
  eq([caT2.thu, caT2.gio, caT2.gv], ['Thứ 2', '08h00-09h30', 'Ms. Vân'], 'Ca riêng T2 giữ đúng ngày, giờ, GV');
  const caCN = sandbox.parseCaDacBiet('CN 14h00-15h30 Mr. Đức Anh');
  eq([caCN.thu, caCN.gio, caCN.gv], ['Chủ nhật', '14h00-15h30', 'Mr. Đức Anh'], 'Ca riêng CN chỉ dùng GV dạy bù hợp lệ');
  eq(sandbox.parseCaDacBiet('CN 14h00-15h30 Ms. Hồng Anh'), null, 'Ca riêng không nhận GV đã rời cơ sở');
}

console.log('\n=== T29: Backup — cùng bé/cùng ca ở hai ngày vẫn lưu đủ ===');
{
  const lich = sheet('LICH_BU');
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú', 'Ngày học']);
  lich.appendRow(['T2-Riêng', 'Thứ 2', '08:00-09:30', 'Ms. Vân', 'Bé Backup Lặp', 'S1.005 - Peach', 'SP1', '', '✅ Đi được', '', '', '✅ Đã học', '', '03/11/2026']);
  sandbox.backupTuanBu(true);
  const tenBk = 'Backup tháng ' + sandbox.Utilities.formatDate(new Date(), 'GMT+7', 'MM-yyyy');
  const bk = sheet(tenBk);
  const sauLan1 = bk.rows.filter(r => r[5] === 'Bé Backup Lặp').length;
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú', 'Ngày học']);
  lich.appendRow(['T2-Riêng', 'Thứ 2', '08:00-09:30', 'Ms. Vân', 'Bé Backup Lặp', 'S1.005 - Peach', 'SP1', '', '✅ Đi được', '', '', '✅ Đã học', '', '10/11/2026']);
  sandbox.backupTuanBu(true);
  const sauLan2 = bk.rows.filter(r => r[5] === 'Bé Backup Lặp').length;
  eq([sauLan1, sauLan2], [1, 2], 'Hai buổi khác ngày của cùng bé/cùng ca đều được backup');
}

console.log('\n=== T30: Gửi tin GV có kiểm soát + dashboard ===');
{
  STATE.ss = new MockSS(); STATE.fetches.length = 0; STATE.alerts.length = 0;
  const bao = STATE.ss.insertSheet('BAO_BU');
  bao.appendRow(['Ngày báo', 'GV báo', 'Lớp', 'Tên bé', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú', 'SOTW', 'Ca đặc biệt', 'GV dạy bù ưu tiên']);
  bao.appendRow(['', '', 'L1', 'Bé Đã Học', 'SP1', '', 'Đã chốt chờ PH', 'T5-1 | Thứ 5 | 17h00-18h30 | Ms. Vân', '', '', '', '']);
  bao.appendRow(['', '', 'L1', 'Bé Chờ', 'SP1', '', 'Đã chốt chờ PH', '', '', '', '', '']);
  bao.appendRow(['', '', 'L2', 'Bé Đổi', 'SP2', '', 'Đã chốt chờ PH', '', '', '', '', '']);
  const lich = STATE.ss.insertSheet('LICH_BU');
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú', 'Ngày học', 'Đã gửi GV lúc', 'Đã chốt lịch lúc', 'Ca xếp (chọn)', 'Mã buổi']);
  lich.appendRow(['T5-1', 'Thứ 5', '17h00-18h30', 'Ms. Vân', 'Bé Đã Học', 'L1', 'SP1', '', '✅ Đi được', '', '', '✅ Đã học', '', '', '', '', 'T5-1 | Thứ 5 | 17h00-18h30 | Ms. Vân', 'DB-T30-1']);
  lich.appendRow(['T6-1', 'Thứ 6', '15h00-16h30', 'Ms. Vân', 'Bé Chờ', 'L1', 'SP1', '', 'Chờ Ms. Vân Anh', '', '', '', '', '', '', '', '', 'DB-T30-2']);
  lich.appendRow(['T6-2', 'Thứ 6', '17h00-18h30', 'Mr. Ngọc', 'Bé Đổi', 'L2', 'SP2', '', '🔄 Xin đổi', '', '', '', '', '', '', '', '', 'DB-T30-3']);
  // Chốt lịch xong, đổi lại 2 dòng dưới để chúng tiếp tục đại diện cho trạng thái chờ/xin đổi.
  sandbox.chotLichTaoTin();
  lich.getRange(3, 9).setValue('Chờ Ms. Vân Anh');
  lich.getRange(4, 9).setValue('🔄 Xin đổi');
  sandbox.guiTinChoGV();
  eq(STATE.fetches.length, 1, 'Lần đầu chỉ gửi ca đã chốt');
  eq(lich.getRange(1, 15).getValue(), 'Đã gửi GV lúc', 'Tự thêm cột đánh dấu gửi an toàn');
  ok(!!lich.getRange(2, 15).getValue(), 'Chỉ đánh dấu sau khi Telegram gửi thành công');
  sandbox.guiTinChoGV();
  eq(STATE.fetches.length, 1, 'Lần hai không gửi trùng');
  STATE.confirms.push(false); sandbox.guiLaiTinChoGV();
  eq(STATE.fetches.length, 1, 'Gửi lại bị chặn nếu không xác nhận');
  STATE.confirms.push(true); sandbox.guiLaiTinChoGV();
  eq(STATE.fetches.length, 2, 'Gửi lại chỉ sau xác nhận rõ ràng');
  sandbox.tongQuanCongViec();
  ok(lastAlert().includes('Chờ PH xác nhận: 1 bé'), 'Dashboard đếm bé chờ');
  ok(lastAlert().includes('PH xin đổi: 1 bé'), 'Dashboard đếm bé xin đổi');
  ok(lastAlert().includes('Ca đã chốt chưa gửi GV: 0 ca'), 'Dashboard đếm ca chưa gửi');
}

console.log('\n=== T31: Kiểm tra gom nhóm trước khi ghi lịch ===');
{
  const kq = sandbox.kiemTraDuLieuTruocKhiXep([
    { tenBe: 'Bé Thiếu', lop: '', trinhDo: '', link: '' },
    { tenBe: 'Bé A', lop: 'L1', trinhDo: 'SP1', link: '' },
    { tenBe: 'Bé B', lop: 'L1', trinhDo: 'SP2', link: 'x' }
  ], [
    { ma: 'T5-1', gv: 'Ms. Vân', thu: 'Thứ 5', gio: '17h00-18h30', bes: 5, trinhDos: 3 },
    { ma: 'T5-2', gv: 'Ms. Vân', thu: 'Thứ 5', gio: '17h30-18h45', bes: 1, trinhDos: 1 }
  ]);
  eq(kq.thieuThongTin, 1, 'Phát hiện bé thiếu tên/lớp/trình độ');
  eq(kq.thieuLink, 2, 'Tóm tắt bé thiếu link Canva');
  ok(kq.canhBao.some(x => x.includes('quá 4 bé')), 'Cảnh báo ca quá sức chứa');
  ok(kq.canhBao.some(x => x.includes('trùng giờ')), 'Cảnh báo cùng GV trùng giờ');
}

console.log('\n=== T32: Báo cáo tháng chỉ tính Đã học, chọn tháng ===');
{
  const ss = STATE.ss; const bk = ss.insertSheet('Backup tháng 11-2026');
  bk.appendRow(['Ngày backup', 'Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'PH xác nhận', 'Đã dạy', 'Ngày học']);
  bk.appendRow(['01/11/2026', 'T5-1', 'Thứ 5', '17h00-18h30', 'Ms. Vân', 'Bé Học', 'L1', '✅ Đi được', '✅ Đã học', '']);
  bk.appendRow(['01/11/2026', 'T5-1', 'Thứ 5', '17h00-18h30', 'Ms. Vân', 'Bé Vắng', 'L1', '✅ Đi được', '❌ Vắng', '']);
  bk.appendRow(['01/11/2026', 'T6-1', 'Thứ 6', '15h00-16h30', 'Mr. Ngọc', 'Bé Nghỉ', 'L2', '❌ Nghỉ', '❌ Nghỉ', '']);
  const t = sandbox.tongHopBaoCaoBackup(bk.getDataRange().getValues());
  eq([t.daHoc, t.vang, t.nghi, t.gioTheoGV['Ms. Vân'], t.gioTheoGV['Mr. Ngọc'] || 0], [1, 1, 1, 1.5, 0], 'Vắng/Nghỉ tách riêng và không tính giờ');
  sandbox.lamMoiThongKeTheoThang('11-2026');
  ok(String(sheet('THỐNG KÊ').getRange(1, 1).getValue()).includes('11-2026'), 'Báo cáo dùng tháng được chọn');
  ok(String(sheet('THỐNG KÊ').getDataRange().getValues().flat().join(' ')).includes('Bé vắng'), 'Báo cáo hiện số bé vắng');
}

console.log('\n=== T33: Làm mới tuần dừng an toàn khi backup lỗi ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0; STATE.confirms.length = 0;
  const bao = STATE.ss.insertSheet('BAO_BU');
  bao.appendRow(['Ngày báo', 'GV báo', 'Lớp', 'Tên bé', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú']);
  bao.appendRow(['01/11/2026', '', 'L1', 'Bé Giữ Lại', 'SP1', '', '', '', '']);
  const lich = STATE.ss.insertSheet('LICH_BU');
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận']);
  lich.appendRow(['T5-1', 'Thứ 5', '17h00-18h30', 'Ms. Vân', 'Bé Trong Lịch', 'L1', 'SP1', '', '✅ Đi được']);
  const backupGoc = sandbox.backupTuanBu;
  sandbox.backupTuanBu = function() { return { ok: false, msg: 'Lỗi backup mô phỏng' }; };
  STATE.confirms.push(true);
  sandbox.lamMoiTuanMoi();
  eq(rows('LICH_BU').length, 2, 'Backup lỗi → LICH_BU không bị xoá');
  eq(rows('BAO_BU').length, 2, 'Backup lỗi → BAO_BU không bị xoá');
  ok(lastAlert().includes('DỪNG làm mới tuần'), 'Backup lỗi → báo dừng an toàn rõ ràng');
  sandbox.backupTuanBu = backupGoc;
}

console.log('\n=== T36: Dạy Bù dùng bot riêng ===');
{
  STATE.fetches.length = 0; STATE.alerts.length = 0;
  const rs = sandbox.guiTelegram('🧪 Tin thử Dạy Bù');
  ok(rs, 'Gửi thử Dạy Bù thành công');
  eq(STATE.fetches.length, 1, 'Gửi thử Dạy Bù tạo đúng 1 tin');
  eq(STATE.fetches[0].payload.chat_id, sandbox.CFG.GROUP_ID, 'Dạy Bù gửi đúng nhóm đã cài');
  eq(STATE.fetches[0].payload.message_thread_id, sandbox.CFG.TOPIC_ID, 'Dạy Bù gửi đúng Topic Dạy Bù');
  ok(STATE.fetches[0].url.includes('TEST_DAY_BU_TOKEN'), 'Dạy Bù chỉ dùng DAY_BU_BOT_TOKEN riêng');
  ok(!STATE.fetches[0].url.includes('TEST_LEGACY_TOKEN'), 'Dạy Bù không dùng TELEGRAM_BOT_TOKEN cũ');
}

console.log('\n=== T35: SOTW gửi đúng topic riêng ===');
{
  STATE.fetches.length = 0; STATE.alerts.length = 0;
  const rs = sandbox.guiTelegramSOTW('🏆 Tin thử SOTW');
  ok(rs, 'Gửi thử SOTW thành công');
  eq(STATE.fetches.length, 1, 'Gửi thử SOTW tạo đúng 1 tin');
  eq(STATE.fetches[0].payload.chat_id, '-1003955550981', 'SOTW gửi đúng nhóm Office - Joy');
  eq(STATE.fetches[0].payload.message_thread_id, 22, 'SOTW gửi đúng topic đã cài');
  ok(STATE.fetches[0].url.includes('TEST_SOTW_TOKEN'), 'SOTW chỉ dùng SOTW_BOT_TOKEN riêng');
  ok(!STATE.fetches[0].url.includes('TEST_DAY_BU_TOKEN'), 'SOTW không dùng token Dạy Bù/chấm công cũ');
  eq(STATE.fetches[0].text, '🏆 Tin thử SOTW', 'Nội dung tin thử SOTW giữ nguyên');
  STATE.fetches.length = 0;
}

console.log('\n=== T34: Ca đặc biệt cảnh báo rõ trước khi ghi lịch ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0; STATE.confirms.length = 0;
  const bao = STATE.ss.insertSheet('BAO_BU');
  bao.appendRow(['Ngày báo', 'GV báo', 'Lớp', 'Tên bé', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú', 'SOTW', 'Ca đặc biệt']);
  bao.appendRow(['01/11/2026', '', 'L1', 'Bé Ca Riêng', 'SP1', 'https://slide', '', '', '', '', 'T5 17h30-18h45 Ms. Vân']);
  const lich = STATE.ss.insertSheet('LICH_BU');
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận']);
  lich.appendRow(['T5-1', 'Thứ 5', '17h00-18h30', 'Ms. Vân', 'Bé 1', 'L1', 'SP1', '', '✅ Đi được']);
  lich.appendRow(['T5-1', 'Thứ 5', '17h00-18h30', 'Ms. Vân', 'Bé 2', 'L1', 'SP1', '', '✅ Đi được']);
  lich.appendRow(['T5-1', 'Thứ 5', '17h00-18h30', 'Ms. Vân', 'Bé 3', 'L1', 'SP1', '', '✅ Đi được']);
  lich.appendRow(['T5-1', 'Thứ 5', '17h00-18h30', 'Ms. Vân', 'Bé 4', 'L1', 'SP1', '', '✅ Đi được']);
  STATE.confirms.push(false);
  const msg = sandbox.xepLichChinh(STATE.ss, bao, lich);
  eq(rows('LICH_BU').length, 5, 'Không xác nhận cảnh báo → không ghi ca đặc biệt');
  ok(msg.includes('Đã dừng gom lịch'), 'Không xác nhận cảnh báo → dừng gom lịch');
  ok(lastAlert().includes('trùng giờ') && lastAlert().includes('quá 4 bé'), 'Cảnh báo nêu trùng giờ và quá sức chứa');
}

console.log('\n=== T37: Chốt lịch tạo tin theo ca/GV đã sửa ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0; STATE.fetches.length = 0;
  const lich = STATE.ss.insertSheet('LICH_BU');
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú', 'Ngày học', 'Đã gửi GV lúc', 'Đã chốt lịch lúc']);
  lich.appendRow(['T6-4', 'Thứ 6', '15h00 - 16h30', 'Mr. Đức Anh', 'Bé Chốt Lịch', 'L1', 'SP1', 'https://slide', '✅ Đi được', '', '', '', 'Ôn đọc', '07/11/2026', 'đã gửi cũ', '']);
  sandbox.taoCaiDatCaDayBu(STATE.ss); sandbox.chotLichTaoTin();
  eq(lich.getRange(2, 17).getValue(), 'T6-4 | Thứ 6 | 15h00 - 16h30 | Mr. Đức Anh', 'Lịch cũ tự có Ca xếp (chọn) khi nâng cấp');
  ok(String(lich.getRange(2, 11).getValue()).includes('Mr. Đức Anh'), 'Tin GV lấy GV cuối cùng trong LICH_BU');
  eq(lich.getRange(2, 15).getValue(), '', 'Chốt lại xoá mốc gửi cũ để gửi thông tin mới');
  ok(!!lich.getRange(2, 16).getValue(), 'Chốt lại ghi mốc chốt lịch');
}

console.log('\n=== T38: Cài đặt ca tạo đủ 6 ca và ưu tiên theo lớp ===');
{
  const ss = new MockSS();
  const cd = sandbox.taoCaiDatCaDayBu(ss);
  eq(cd.getRange(1, 1).getValue(), 'Mã ca', 'Có bảng cài đặt ca');
  eq(cd.getRange(2, 1, 6, 1).getValues().filter(r => r[0]).length, 6, 'Tạo sẵn 6 ca Dạy Bù');
  const ca = sandbox.layDanhSachCa(ss);
  eq(ca.length, 6, 'Đọc 6 ca từ sheet cài đặt');
  cd.getRange(2, 12).setValue('Ms. Vân');
  const uuTien = sandbox.layGvBuUuTienTheoLop(ss);
  eq(uuTien[cd.getRange(2, 10).getValue()], 'Ms. Vân', 'Ưu tiên GV theo lớp đọc từ sheet cài đặt');
}


console.log('\n=== T39: Workflow BAO_BU tạm → PH → GV theo ca chuẩn ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0; STATE.fetches.length = 0;
  const bao = STATE.ss.insertSheet('BAO_BU');
  bao.appendRow(['Ngày báo', 'GV báo', 'Lớp', 'Tên bé', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú', 'SOTW', 'Ca đặc biệt', 'GV dạy bù ưu tiên']);
  bao.appendRow(['01/11/2026', 'Ms. Vân', 'L1', 'Bé Workflow', 'SP1', 'https://slide', '', '', '', '', '', '']);
  const lich = STATE.ss.insertSheet('LICH_BU');
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú', 'Ngày học', 'Đã gửi GV lúc', 'Đã chốt lịch lúc']);
  const cd = sandbox.taoCaiDatCaDayBu(STATE.ss), active = sandbox.layDanhSachCa(STATE.ss);
  eq(active[3].nhan, 'T6-2 | Thứ 6 | 15h00 - 16h30 | Ms. Vân', 'Ca chuẩn có nhãn gộp mã | thứ | giờ | GV');
  cd.getRange(2, 3).setValue('18h00 - 19h30');
  cd.getRange(2, 5).setValue('Mr. Đức Anh');
  sandbox.onEdit({range:cd.getRange(2, 5)});
  eq(cd.getRange(2, 4).getValue(), 'T4-1 | Thứ 4 | 18h00 - 19h30 | Mr. Đức Anh', 'Cột Ca hiển thị tự cập nhật ngay khi đổi giờ hoặc GV');
  const caSauSua = sandbox.layDanhSachCa(STATE.ss).filter(c => c.ma === 'T4-1')[0];
  eq(caSauSua.nhan, 'T4-1 | Thứ 4 | 18h00 - 19h30 | Mr. Đức Anh', 'Dropdown đọc nhãn mới từ dữ liệu ca thay vì nhãn cũ lưu sẵn');
  ok(active.filter(c => c.gio === '15h00 - 16h30').map(c => c.nhan).every(n => n.includes(' | Ms. Vân') || n.includes(' | Mr. Đức Anh')), 'Ca trùng giờ vẫn phân biệt được bằng GV');
  sandbox.xepLichTam(STATE.ss, bao, lich, true);
  const caTamLanDau = bao.getRange(2, 8).getValue();
  sandbox.xepLichTam(STATE.ss, bao, lich, true);
  eq(bao.getRange(2, 8).getValue(), caTamLanDau, 'Gom lần hai giữ nguyên ca tạm quản lý đã chọn');
  eq(rows('LICH_BU').length, 1, 'Gom chỉ ghi lịch tạm BAO_BU, không tạo LICH_BU');
  ok(String(bao.getRange(2, 8).getValue()).includes(' | ') && bao.getRange(2, 7).getValue() === 'Đã xếp tạm', 'BAO_BU có dropdown ca chuẩn và trạng thái tạm');
  sandbox.chotBaoBuTaoLichTinPH();
  eq(rows('LICH_BU').length, 2, 'Chốt BAO_BU tạo LICH_BU');
  ok(String(lich.getRange(2,10).getValue()).includes('thông báo lịch học bù'), 'Chốt BAO_BU tạo tin PH');
  eq(lich.getRange(2,11).getValue(), '', 'Chốt BAO_BU không tạo tin GV');
  lich.getRange(2,9).setValue('✅ Đi được'); sandbox.guiTinChoGV();
  eq(STATE.fetches.length, 0, 'Không gửi GV trước chốt LICH_BU');
  sandbox.chotLichTaoTinGV(); sandbox.guiTinChoGV();
  eq(STATE.fetches.length, 1, 'Chốt LICH_BU rồi mới gửi GV cho PH xác nhận');
  lich.getRange(2,17).setValue(active[3].nhan); sandbox.onEdit({range:lich.getRange(2,17)});
  eq([lich.getRange(2,1).getValue(),lich.getRange(2,2).getValue(),lich.getRange(2,3).getValue(),lich.getRange(2,4).getValue()], [active[3].ma,active[3].thu,active[3].gio,active[3].gv], 'Chọn ca LICH_BU tự cập nhật mã/thứ/giờ/GV');
}

console.log('\n=== T40: Chốt an toàn + đồng bộ ca cuối về BAO_BU ===');
{
  STATE.ss = new MockSS(); STATE.fetches.length = 0; STATE.alerts.length = 0;
  const bao = STATE.ss.insertSheet('BAO_BU');
  bao.appendRow(['Ngày báo','GV báo','Lớp','Tên bé','Trình độ','Link Canva','Trạng thái','Ca xếp','Ghi chú','SOTW','Ca đặc biệt','GV dạy bù ưu tiên']);
  bao.appendRow(['01/11/2026','Ms. Vân','L1','Bé A','SP1','link','','','','','','']);
  eq(bao.getRange(1,13).getValue(), '', 'BAO_BU dừng ở cột L, không thêm cột kỹ thuật M');
  const lich = STATE.ss.insertSheet('LICH_BU');
  lich.appendRow(['Ca','Thứ','Giờ','GV dạy','Tên bé','Lớp','Trình độ','Link Canva','PH xác nhận','Tin nhắn PH','Tin nhắn GV','Đã dạy','Ghi chú','Ngày học','Đã gửi GV lúc','Đã chốt lịch lúc','Ca xếp (chọn)']);
  const cd=sandbox.taoCaiDatCaDayBu(STATE.ss), ca=sandbox.layDanhSachCa(STATE.ss)[0];
  bao.getRange(2,7).setValue('Đã xếp tạm'); bao.getRange(2,8).setValue(ca.nhan);
  sandbox.chotBaoBuTaoLichTinPH();
  const kyThuat=STATE.ss.getSheetByName('DỮ LIỆU KỸ THUẬT');
  ok(!!kyThuat && kyThuat.isSheetHidden(), 'Mã buổi được cất ở tab kỹ thuật ẩn, không ghi BAO_BU');
  eq(lich.getRange(2,18).getValue(), kyThuat.getRange(2,1).getValue(), 'LICH_BU liên kết đúng Mã buổi kỹ thuật');
  eq(bao.getRange(2,7).getValue(), 'Đã chốt chờ PH', 'Chốt BAO_BU chỉ chờ PH, chưa báo GV');
  lich.getRange(2,9).setValue('✅ Đi được'); sandbox.chotLichTaoTinGV(); sandbox.guiTinChoGV();
  eq(bao.getRange(2,7).getValue(), 'Đã báo GV', 'Telegram thành công mới phản ánh đã báo GV về BAO_BU');
  eq(bao.getRange(2,8).getValue(), lich.getRange(2,17).getValue(), 'BAO_BU nhận đúng ca cuối ở LICH_BU');
  const caDoi=sandbox.layDanhSachCa(STATE.ss)[1]; lich.getRange(2,17).setValue(caDoi.nhan); sandbox.onEdit({range:lich.getRange(2,17)});
  eq(lich.getRange(2,9).getValue(), 'Chờ Ms. Vân Anh', 'Đổi ca cuối bắt PH xác nhận lại');
  eq(lich.getRange(2,15).getValue(), '', 'Đổi ca xoá mốc gửi GV cũ');
  eq(lich.getRange(2,14).getValue(), sandbox.layNgayThu(caDoi.thu), 'Đổi ca cập nhật ngày học');
}

console.log('\n=== T41: Chặn chốt ca tắt/quá chỗ ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0;
  const bao=STATE.ss.insertSheet('BAO_BU'), lich=STATE.ss.insertSheet('LICH_BU');
  bao.appendRow(['Ngày báo','GV báo','Lớp','Tên bé','Trình độ','Link Canva','Trạng thái','Ca xếp']);
  bao.appendRow(['','','L1','Bé sai','SP1','','Đã xếp tạm','Ca không tồn tại']);
  lich.appendRow(['Ca','Thứ','Giờ','GV dạy','Tên bé','Lớp','Trình độ','Link Canva','PH xác nhận']);
  sandbox.taoCaiDatCaDayBu(STATE.ss); sandbox.chotBaoBuTaoLichTinPH();
  eq(lich.getLastRow(),1,'Ca không còn Dùng bị chặn trước khi ghi LICH_BU');
  ok(lastAlert().includes('Chưa chốt'), 'Chặn chốt nêu rõ cần sửa ca');
}

console.log('\n=== T42: Chặn gửi GV nếu lịch cuối không còn ca hợp lệ ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0;
  const lich=STATE.ss.insertSheet('LICH_BU');
  lich.appendRow(['Ca','Thứ','Giờ','GV dạy','Tên bé','Lớp','Trình độ','Link Canva','PH xác nhận','Tin nhắn PH','Tin nhắn GV','Đã dạy','Ghi chú','Ngày học','Đã gửi GV lúc','Đã chốt lịch lúc','Ca xếp (chọn)']);
  lich.appendRow(['T99','Thứ 6','15h00 - 16h30','Ms. Vân','Bé lịch sai','L1','SP1','','✅ Đi được','','','','','','','','Ca đã tắt']);
  sandbox.taoCaiDatCaDayBu(STATE.ss); sandbox.chotLichTaoTinGV();
  eq(lich.getRange(2,11).getValue(), '', 'Lịch cuối sai không tạo tin GV');
  ok(lastAlert().includes('lịch cuối cần sửa'), 'Chặn lịch cuối nêu rõ cần sửa');
}

console.log('\n=== T43: Ca đặc biệt ĐB-01 ưu tiên và đi trọn workflow ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0; STATE.fetches.length = 0;
  const bao=STATE.ss.insertSheet('BAO_BU'), lich=STATE.ss.insertSheet('LICH_BU');
  bao.appendRow(['Ngày báo','GV báo','Lớp','Tên bé','Trình độ','Link Canva','Trạng thái','Ca xếp','Ghi chú','SOTW','Ca đặc biệt','GV dạy bù ưu tiên']);
  bao.appendRow(['01/11/2026','Ms. Vân','L1','Bé ĐB','SP1','link','','','', '', 'ĐB-01 | Thứ 5 | 17h00 - 18h30 | Mr. Ngọc','']);
  lich.appendRow(['Ca','Thứ','Giờ','GV dạy','Tên bé','Lớp','Trình độ','Link Canva','PH xác nhận','Tin nhắn PH','Tin nhắn GV','Đã dạy','Ghi chú','Ngày học','Đã gửi GV lúc','Đã chốt lịch lúc','Ca xếp (chọn)','Mã buổi']);
  sandbox.taoCaiDatCaDayBu(STATE.ss);
  sandbox.datDropdownCaBaoBu(STATE.ss, bao);
  const validationH = bao.validations.filter(v => v.c === 8 && v.r <= 2 && 2 < v.r + v.h).pop();
  eq(validationH, undefined, 'Cột H của bé có K ca đặc biệt được miễn dropdown ca thường');
  const db=sandbox.parseCaDacBiet('ĐB-01 | Thứ 5 | 17h00 - 18h30 | Mr. Ngọc');
  eq([db.ma,db.thu,db.gio,db.gv],['ĐB-01','Thứ 5','17h00 - 18h30','Mr. Ngọc'],'Ca đặc biệt nhận đúng form ĐB-01 với Mr. Ngọc');
  // Mô phỏng copy dòng mẫu: đã mang trạng thái tạm nhưng Ca xếp H còn trống.
  bao.getRange(2,7).setValue('Đã xếp tạm');
  sandbox.xepLichTam(STATE.ss,bao,lich,true);
  eq(bao.getRange(2,8).getValue(),'ĐB-01 | Thứ 5 | 17h00 - 18h30 | Mr. Ngọc','Ca đặc biệt tự sửa Ca xếp dù dòng copy đã có trạng thái tạm');
  eq(bao.getRange(2,7).getValue(),'Đã xếp tạm','Ca đặc biệt vào trạng thái xếp tạm');
  eq(lich.getLastRow(),1,'Gom tạm ca đặc biệt chưa tạo LICH_BU');
  sandbox.chotBaoBuTaoLichTinPH();
  eq([lich.getRange(2,1).getValue(),lich.getRange(2,17).getValue()],['ĐB-01','ĐB-01 | Thứ 5 | 17h00 - 18h30 | Mr. Ngọc'],'Chốt ca đặc biệt sang LICH_BU đúng nhãn');
  lich.getRange(2,9).setValue('✅ Đi được'); sandbox.chotLichTaoTinGV(); sandbox.guiTinChoGV();
  eq(bao.getRange(2,7).getValue(),'Đã báo GV','Ca đặc biệt gửi thành công đồng bộ về BAO_BU');
  ok(!!sandbox.parseCaDacBiet('T4 14h00-15h30 Ms. Vân'),'Vẫn đọc form ca đặc biệt cũ để không kẹt dữ liệu');
}

console.log('\n=== T45: Dòng mẫu và Ca đặc biệt không bị validation chặn ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0;
  const bao=STATE.ss.insertSheet('BAO_BU'), lich=STATE.ss.insertSheet('LICH_BU');
  bao.appendRow(['Ngày báo','GV báo','Lớp','Tên bé','Trình độ','Link Canva','Trạng thái','Ca xếp','Ghi chú','SOTW','Ca đặc biệt','GV dạy bù ưu tiên']);
  bao.appendRow(['','Mr. Ngọc','S1.001 - Cashew','Không bù','','','','','(DÒNG MẪU) Lớp đi đủ','','','']);
  bao.appendRow(['','Mr. Ngọc','S2.001 - Pumpkin Seed','Iphone','SP1','','','ĐB-01 | Thứ 5 | 17h00 - 18h00 | Mr. Ngọc','(DÒNG MẪU) Ca riêng','','ĐB-01 | Thứ 5 | 17h00 - 18h00 | Mr. Ngọc','']);
  lich.appendRow(['Ca','Thứ','Giờ','GV dạy','Tên bé','Lớp','Trình độ','Link Canva','PH xác nhận','Tin nhắn PH','Tin nhắn GV','Đã dạy','Ghi chú','Ngày học','Đã gửi GV lúc','Đã chốt lịch lúc','Ca xếp (chọn)']);
  sandbox.taoCaiDatCaDayBu(STATE.ss);
  const ds=sandbox.taoBangSotw(STATE.ss);
  ds.getRange(3,1,1,3).setValues([['Bé Test','S1.001 - Cashew','Mr. Ngọc']]);
  sandbox.datDropdownBaoBu(STATE.ss, bao);
  const tenValidations = bao.validations.filter(v => v.c === 4 && v.rule);
  ok(tenValidations.every(v => v.r >= 4), 'Dropdown Tên bé chỉ bắt đầu từ dòng dữ liệu 4, không chặn dòng mẫu');
  const caValidationH2 = bao.validations.filter(v => v.c === 8 && v.r <= 2 && 2 < v.r + v.h).pop();
  const caValidationH3 = bao.validations.filter(v => v.c === 8 && v.r <= 3 && 3 < v.r + v.h).pop();
  eq(caValidationH2, undefined, 'Dòng mẫu 1 không nhận dropdown ca thường');
  eq(caValidationH3, undefined, 'Dòng mẫu 2 có Ca đặc biệt không nhận dropdown ca thường');
}

console.log('\n=== T44: Trạng thái ON/OFF và làm mới Ca xếp ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0;
  const bao = STATE.ss.insertSheet('BAO_BU'), lich = STATE.ss.insertSheet('LICH_BU');
  bao.appendRow(['Ngày báo','GV báo','Lớp','Tên bé','Trình độ','Link Canva','Trạng thái','Ca xếp']);
  lich.appendRow(['Ca','Thứ','Giờ','GV dạy','Tên bé','Lớp','Trình độ','Link Canva','PH xác nhận','Tin nhắn PH','Tin nhắn GV','Đã dạy','Ghi chú','Ngày học','Đã gửi GV lúc','Đã chốt lịch lúc','Ca xếp (chọn)']);
  const cd = sandbox.taoCaiDatCaDayBu(STATE.ss);
  eq(cd.getRange(2,6).getValue(), 'ON', 'Ca mặc định dùng trạng thái ON, không dùng chữ Dùng/Dừng');
  cd.getRange(2,6).setValue('OFF');
  sandbox.onEdit({range:cd.getRange(2,6)});
  ok(!sandbox.layDanhSachCa(STATE.ss).some(c => c.ma === 'T4-1'), 'Ca OFF không nằm trong danh sách Ca xếp');
  cd.getRange(2,6).setValue('ON');
  sandbox.onEdit({range:cd.getRange(2,6)});
  ok(sandbox.layDanhSachCa(STATE.ss).some(c => c.ma === 'T4-1'), 'Ca ON xuất hiện ngay trong danh sách Ca xếp');
  sandbox.lamMoiDanhSachCaXep();
  ok(lastAlert().includes('ca đang ON'), 'Làm mới thủ công nêu số ca đang ON');
}

console.log('\n=== T46: H dòng mẫu/ca đặc biệt miễn dropdown, ca thường chỉ nhận ON ===');
{
  STATE.ss = new MockSS(); STATE.alerts.length = 0;
  const bao=STATE.ss.insertSheet('BAO_BU'), lich=STATE.ss.insertSheet('LICH_BU');
  bao.appendRow(['Ngày báo','GV báo','Lớp','Tên bé','Trình độ','Link Canva','Trạng thái','Ca xếp','Ghi chú','SOTW','Ca đặc biệt','GV dạy bù ưu tiên']);
  bao.appendRow(['','Mr. Ngọc','S1','Không bù','','','','','(DÒNG MẪU) Lớp đi đủ','','','']);
  bao.appendRow(['','Mr. Ngọc','S2','Iphone','SP1','','','GIỮ NGUYÊN H3','(DÒNG MẪU) Ca riêng','','ĐB-01 | Thứ 4 | 14h00 - 15h30 | Ms. Vân','']);
  bao.appendRow(['','Ms. Vân','L1','Bé ca thường','SP1','','','T4-1 | Thứ 4 | 17h30 - 19h00 | Mr. Đức Anh','','','']);
  bao.appendRow(['','Ms. Vân','L1','Bé ca ĐB','SP1','','','GIỮ NGUYÊN H5','','','ĐB-01 | Thứ 5 | 17h00 - 18h30 | Mr. Ngọc','']);
  lich.appendRow(['Ca','Thứ','Giờ','GV dạy','Tên bé','Lớp','Trình độ','Link Canva','PH xác nhận','Tin nhắn PH','Tin nhắn GV','Đã dạy','Ghi chú','Ngày học','Đã gửi GV lúc','Đã chốt lịch lúc','Ca xếp (chọn)']);
  sandbox.taoCaiDatCaDayBu(STATE.ss);
  sandbox.datDropdownCaBaoBu(STATE.ss, bao);
  const ruleAt = row => bao.validations.filter(v => v.c === 8 && v.r <= row && row < v.r + v.h).pop();
  eq(ruleAt(2), undefined, 'H2 dòng mẫu không có dropdown');
  eq(ruleAt(3), undefined, 'H3 dòng mẫu không có dropdown và không bị tự đổi');
  eq(ruleAt(4).rule.allowInvalid, false, 'H4 bé ca thường chỉ nhận danh sách ca ON');
  eq(ruleAt(5), undefined, 'H5 có K ca đặc biệt không có dropdown ca thường');
  eq([bao.getRange(3,8).getValue(),bao.getRange(5,8).getValue()],['GIỮ NGUYÊN H3','GIỮ NGUYÊN H5'],'Làm mới dropdown không ghi đè H3/H5');
  sandbox.lamMoiDanhSachCaXep();
  eq([bao.getRange(3,8).getValue(),bao.getRange(5,8).getValue()],['GIỮ NGUYÊN H3','GIỮ NGUYÊN H5'],'Nút Làm mới không đổi lịch hoặc giá trị H');
}

console.log('\n============================');
console.log(`PASS: ${PASS}  FAIL: ${FAIL}`);
process.exit(FAIL > 0 ? 1 : 0);

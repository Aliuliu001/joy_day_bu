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
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'TEST_TOKEN' }) },
  UrlFetchApp: {
    fetch(url, opts) {
      STATE.fetches.push({ url, text: opts.payload.text, payload: opts.payload });
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
  eq(findRow(bao, 3, 'Bé Một'), 4, 'Data cũ trượt xuống row4 (không mất)');
  const pMau = bao.protectedRanges.find(pp => (pp.desc || '').indexOf('Dòng mẫu') >= 0);
  const pQl = bao.protectedRanges.find(pp => (pp.desc || '').indexOf('Chỉ quản lý sửa') >= 0);
  ok(!!pMau && pMau.editors.length === 3, 'Bảo vệ 2 dòng mẫu (3 quản lý sửa)');
  ok(!!pQl && pQl.w === 2, 'Khóa đúng 2 cột Trạng thái/Ca xếp — Ghi chú GV được sửa');

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

console.log('\n=== T3: Nhập DS HS + tick + Gom nhóm (gộp SOTW) ===');
{
  // Sheet LICH_BU đã có sẵn (mô phỏng sheet thật)
  if (!sheet('LICH_BU')) {
    const lich = STATE.ss.insertSheet('LICH_BU');
    lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  }
  const sotw = sheet('DS HỌC SINH');
  sotw.appendRow(['Ngô Bảo Hân', 'S1.001 - Cashew', '', 'Nam', 'https://img/1.jpg', true]);
  sotw.appendRow(['Lê Quốc Thiên Bảo', 'S1.001 - Cashew', '', 'Nam', '', true]);
  sotw.appendRow(['Trần Kiên', 'S2.001 - Pumpkin Seed', '', 'Nam', 'https://img/3.jpg', false]);
  sotw.appendRow(['Bé Vân', 'S1.005 - Peach', '', 'Nữ', '', false]);
  // chạy lại nangCap để backfill GV chính
  sandbox.nangCapSheetSotw();
  eq(sotw.getRange(3, 3).getValue(), 'Mr. Ngọc', 'Backfill GV chính = Mr. Ngọc');
  // thêm bé nữa cho đủ test
  const bao = sheet('BAO_BU');
  bao.appendRow([new Date(), 'Ms. Vân', 'S2.003 - Peanut', 'Bé Bốn', 'SP1', '', '', '', '']);
  bao.appendRow([new Date(), 'Mr. Đức Anh', 'S1.006 - Lychee', 'Bé Năm', 'Kids', '', '', '', '']);

  sandbox.gomNhom();

  const lich = rows('LICH_BU');
  ok(lich.length >= 6, 'LICH có header + bé được xếp (rows=' + lich.length + ')');
  // dòng mẫu không vào lịch
  ok(!lich.some(r => String(r[4] || '').includes('Iphone') || String(r[4] || '').includes('Không bù')), 'Dòng mẫu không bị xếp lịch');
  // trạng thái đã xếp
  eq(bao.getRange(4, 7).getValue(), 'Đã xếp', 'Bé Một = Đã xếp');

  // SOTW đã gửi
  eq(STATE.fetches.length, 1, 'Gửi đúng 1 tin SOTW');
  const tin = STATE.fetches[0].text;
  ok(tin.includes('Ngô Bảo Hân') && tin.includes('https://img/1.jpg'), 'Tin SOTW có tên + link ảnh');
  ok(tin.includes('(Nam)'), 'Tin SOTW có giới tính');
  ok(tin.includes('Chưa nộp SOTW'), 'Tin liệt kê GV chưa nộp');
  ok(String(sotw.getRange(1, 6).getValue()).includes('đã gửi'), 'Mốc đã gửi được ghi');

  // KHÔNG xoá tick (bổ sung mới)
  eq(sotw.getRange(3, 6).getValue(), true, 'Tick GIỮ NGUYÊN sau khi gửi (check lại được)');

  // Tin nhắn PH: không có GV/Lớp
  const phRows = lich.filter(r => String(r[9] || '').includes('thông báo lịch học bù'));
  ok(phRows.length > 0, 'Có tin nhắn PH');
  ok(phRows.every(r => !String(r[9]).includes('• GV:') && !String(r[9]).includes('• Lớp:')), 'Tin PH bỏ dòng GV và Lớp');
}

console.log('\n=== T4: Gom nhóm lần 2 — không gửi trùng SOTW, không mất bé ===');
{
  const before = STATE.fetches.length;
  const bao = sheet('BAO_BU');
  bao.appendRow([new Date(), 'Ms. Vân', 'C2.002 - Chestnut', 'Bé Sáu', 'SP0', '', '', '', '']);
  sandbox.gomNhom();
  eq(STATE.fetches.length, before, 'Gom lại: KHÔNG gửi trùng SOTW (có mốc)');
  ok(lastAlert().includes('ĐÃ GỬI rồi'), 'Báo đã gửi rồi khi gom lại');
  // bé đã xếp trước đó VẪN còn trong LICH
  const lich = rows('LICH_BU');
  ok(lich.some(r => r[4] === 'Bé Một'), 'Bé đã xếp không mất khi gom lại (fix bug cũ)');
  ok(lich.some(r => r[4] === 'Bé Sáu'), 'Bé mới được xếp');
  // trạng thái vẫn 'Đã xếp'
  eq(bao.getRange(4, 7).getValue(), 'Đã xếp', 'Trạng thái giữ Đã xếp');
}

console.log('\n=== T5: Gửi lại SOTW (nút menu) — hỏi trước ===');
{
  const before = STATE.fetches.length;
  STATE.confirms.push(false); // trả lời KHÔNG
  sandbox.guiSOTWMenu();
  eq(STATE.fetches.length, before, 'Trả lời KHÔNG → không gửi');
  STATE.confirms.push(true); // trả lời CÓ
  sandbox.guiSOTWMenu();
  eq(STATE.fetches.length, before + 1, 'Trả lời CÓ → gửi lại');
}

console.log('\n=== T6: Xử lý case đặc biệt (Xin đổi + Quá hạn) ===');
{
  const lich = sheet('LICH_BU');
  const bao = sheet('BAO_BU');
  // thêm case Xin đổi (bé đã xếp sẵn)
  const dongBeHai = findRow(bao, 3, 'Bé Hai');
  lich.appendRow(['T6-1', 'Thứ 6', '15h00 - 16h30', 'Ms. Vân', 'Bé Hai', 'S1.005 - Peach', 'SP1', '', '🔄 Xin đổi', '', '', '']);
  STATE.confirms.push(true);
  const fBefore = STATE.fetches.length;
  sandbox.xuLyCaseDacBiet();
  eq(STATE.fetches.length, fBefore + 1, 'Gửi Telegram case đặc biệt');
  ok(lastAlert().includes('Xin đổi'), 'Thông báo có case Xin đổi');
  // Bé Hai: quay về BAO_BU, KHÔNG trùng dòng, status trống
  const found = [];
  const rs = bao.rows;
  for (let i = 1; i < rs.length; i++) if (rs[i][3] === 'Bé Hai') found.push(i + 1);
  eq(found.length, 1, 'KHÔNG tạo dòng trùng cho Bé Hai');
  eq(bao.getRange(found[0], 7).getValue(), '', 'Bé Hai: status trống để xếp lại');
  eq(bao.getRange(found[0], 8).getValue(), '', 'Bé Hai: Ca xếp trống');
  ok(String(bao.getRange(found[0], 9).getValue()).includes('Xin đổi'), 'Ghi chú case Xin đổi');
  // LICH không còn row Xin đổi
  ok(!rows('LICH_BU').some(r => r[4] === 'Bé Hai' && String(r[8]).includes('Xin đổi')), 'Đã xoá khỏi LICH');
  // Gom lại sau xử lý case: sắp xếp lại hết, SOTW không gửi trùng
  const fAfterCase = STATE.fetches.length;
  sandbox.gomNhom();
  eq(STATE.fetches.length, fAfterCase, 'Gom lại sau case: SOTW không gửi trùng (còn mốc)');
  ok(rows('LICH_BU').some(r => r[4] === 'Bé Một'), 'Bé được xếp lại sau khi chuyển về BAO_BU');
}

console.log('\n=== T7: Capacity — bé Nghỉ không chiếm chỗ ===');
{
  // Tạo LICH mới sạch để test chonCaChoBe
  const lichTest = new MockSheet('LICH_TEST');
  lichTest.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  // ca T5-1: 3 bé sống (SP1) + 1 bé Nghỉ (SP1)
  lichTest.appendRow(['T5-1', 'Thứ 5', '17h00 - 18h30', 'Ms. Vân', 'L1', 'L1', 'SP1', '', '✅ Đi được', '', '', '']);
  lichTest.appendRow(['T5-1', 'Thứ 5', '17h00 - 18h30', 'Ms. Vân', 'L2', 'L2', 'SP1', '', '✅ Đi được', '', '', '']);
  lichTest.appendRow(['T5-1', 'Thứ 5', '17h00 - 18h30', 'Ms. Vân', 'L3', 'L3', 'SP1', '', '✅ Đi được', '', '', '']);
  lichTest.appendRow(['T5-1', 'Thứ 5', '17h00 - 18h30', 'Ms. Vân', 'Nghỉ1', 'N1', 'SP1', '', '❌ Nghỉ', '', '', '']);
  const ca = sandbox.chonCaChoBe({ lop: 'S1.005 - Peach', trinhDo: 'SP1' }, sandbox.layDanhSachCa(), lichTest);
  ok(ca && ca.ma === 'T5-1', 'Bé SP1 vào ca T5-1 (Nghỉ không chiếm chỗ)');
}

console.log('\n=== T8: Backup chống trùng ===');
{
  const lich = sheet('LICH_BU');
  // đánh dấu 1 bé đã học
  const rs = lich.rows;
  let foundMot = false;
  for (let i = 1; i < rs.length; i++) {
    if (rs[i][4] === 'Bé Một') { rs[i][8] = '✅ Đi được'; rs[i][11] = '✅ Đã học'; foundMot = true; break; }
  }
  ok(foundMot, 'Tìm thấy Bé Một trong LICH để backup');
  STATE.alerts.length = 0;
  sandbox.backupThuCong();
  const bk = rows('Backup tháng ' + new Date().toLocaleString('en', { month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).replace('/', '-'));
  // backup sheet có data
  const bkName = STATE.ss.getSheetByName('Backup tháng ' + Utilities.formatDate(new Date(), 'GMT+7', 'MM-yyyy'));
  ok(!!bkName, 'Tạo sheet backup tháng');
  const rowsBk = bkName.rows.length;
  ok(rowsBk >= 2, 'Backup có dữ liệu (rows=' + rowsBk + ')');
  const cntBk = bkName.rows.length;
  sandbox.backupThuCong();
  eq(bkName.rows.length, cntBk, 'Chạy backup lần 2: KHÔNG duplicate dòng');
  ok(lastAlert().includes('Không có dòng mới'), 'Báo không có dòng mới (không trùng)');
}

console.log('\n=== T9: LamMoiThongKe không lỗi appendRow([]) ===');
{
  try {
    sandbox.lamMoiThongKe();
    ok(!!sheet('THỐNG KÊ'), 'Tạo tab THỐNG KÊ không exception');
    ok(sheet('THỐNG KÊ').getRange(4, 1).getValue() === 'Mr. Đức Anh', 'Dòng GV đầu tiên');
    ok(typeof sheet('THỐNG KÊ').getRange(4, 2).getValue() === 'number', 'Thống kê ghi số ca thực, không phụ thuộc công thức locale');
  } catch (e) {
    ok(false, 'lamMoiThongKe exception: ' + e.message);
  }
}

console.log('\n=== T10: Làm mới tuần mới — xoá tick + giữ mẫu + giữ bé chưa xếp ===');
{
  const sotw = sheet('DS HỌC SINH');
  const bao = sheet('BAO_BU');
  const lich = sheet('LICH_BU');
  // trạng thái trước
  ok(sotw.getRange(3, 6).getValue() === true, 'Trước: còn tick');
  ok(!!sotw.getRange(1, 6).getValue(), 'Trước: còn mốc');
  // thêm 1 bé CHƯA xếp (GV báo mới, chưa gom) → phải được giữ lại
  bao.appendRow([new Date(), 'Ms. Vân', 'C2.002 - Chestnut', 'Bé Mới', 'SP0', '', '', '', '']);
  const dongMoi = findRow(bao, 3, 'Bé Mới');
  ok(dongMoi > 0, 'Có Bé Mới (chưa xếp) trong BAO_BU');
  eq(bao.getRange(dongMoi, 8).getValue(), '', 'Bé Mới chưa xếp (Ca xếp trống)');
  // bé đã xếp có Ca xếp đầy → sẽ bị clear
  const dongBaTruoc = findRow(bao, 3, 'Bé Ba');
  ok(dongBaTruoc > 0, 'Có Bé Ba (đã xếp) trong BAO_BU');
  ok(!!bao.getRange(dongBaTruoc, 8).getValue(), 'Bé Ba đã có Ca xếp');
  STATE.confirms.push(true);
  sandbox.lamMoiTuanMoi();

  // tick + mốc xoá
  ok(!sotw.getRange(3, 6).getValue(), 'Sau: tick đã xoá');
  ok(!sotw.getRange(1, 6).getValue(), 'Sau: mốc đã xoá');
  // danh sách HS giữ nguyên
  eq(sotw.getRange(3, 1).getValue(), 'Ngô Bảo Hân', 'Danh sách HS GIỮ NGUYÊN');
  eq(sotw.getRange(3, 5).getValue(), 'https://img/1.jpg', 'Link ảnh GIỮ NGUYÊN');
  // 2 dòng mẫu giữ
  ok(String(bao.getRange(2, 9).getValue()).includes('(DÒNG MẪU)'), 'Dòng mẫu 1 giữ');
  ok(String(bao.getRange(3, 9).getValue()).includes('(DÒNG MẪU)'), 'Dòng mẫu 2 giữ');
  // bé chưa xếp giữ; bé 'Chờ' được giữ nhờ chuyển chưa chốt; bé ✅ không giữ
  const dongMoi2 = findRow(bao, 3, 'Bé Mới');
  ok(dongMoi2 > 0, 'Bé chưa xếp (Bé Mới) ĐƯỢC GIỮ');
  ok(findRow(bao, 3, 'Bé Ba') > 0, 'Bé "Chờ" (Bé Ba) ĐƯỢC GIỮ nhờ chuyển chưa chốt');
  ok(findRow(bao, 3, 'Bé Một') < 0, 'Bé đã ✅ (Bé Một) KHÔNG giữ lại (đã backup)');
  // LICH clean
  eq(lich.rows.length, 1, 'LICH_BU chỉ còn header');
  // cột J link vẫn còn
  ok(String(bao.getRange(4, 10).getValue()).includes('HYPERLINK'), 'Cột J link vẫn còn sau clear');
}

console.log('\n=== T11: Gom nhóm sau Làm mới tuần mới — SOTW gửi được lại ===');
{
  // GV tick lại cho tuần mới
  sheet('DS HỌC SINH').getRange(3, 6).setValue(true);
  const before = STATE.fetches.length;
  sandbox.gomNhom();
  eq(STATE.fetches.length, before + 1, 'Tuần mới → gửi SOTW mới (mốc đã xoá)');
}

console.log('\n=== T12: menu onOpen — 4 nút chính + 3 menu con ===');
{
  STATE.menuEntries.length = 0;
  STATE.logs.length = 0;
  try { sandbox.onOpen(); ok(true, 'onOpen OK'); }
  catch (e) { ok(false, 'onOpen lỗi: ' + e.message); }
  const items = STATE.menuEntries.filter(e => e.type === 'item');
  const subs = STATE.menuEntries.filter(e => e.type === 'sub');
  ['gomNhom', 'xuLyCaseDacBiet', 'guiTinChoGV', 'lamMoiTuanMoi'].forEach(fn => {
    ok(items.some(e => e.fn === fn), 'Nút chính có: ' + fn);
  });
  eq(subs.length, 3, 'Đúng 3 menu con');
  ok(subs.some(s => s.name.includes('Gửi / Nhắc lẻ')), 'Menu con: Gửi / Nhắc lẻ');
  ok(subs.some(s => s.name.includes('Báo cáo')), 'Menu con: Báo cáo');
  ok(subs.some(s => s.name.includes('Cài đặt')), 'Menu con: Cài đặt');
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
  lich.appendRow(['T5-1', 'Thứ 5', '17h00 - 18h30', 'Ms. Vân', 'Bé A', 'S1.005 - Peach', 'SP1', 'https://slide', '✅ Đi được', '', '', '✅ Đã học']);
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

console.log('\n=== T15: Tràn sức chứa → bé dư "Tuần sau" ===');
{
  // 20 bé chưa xếp, sức chứa = 4 ca × 4 = 16
  const bao = sheet('BAO_BU');
  for (let i = 1; i <= 20; i++) {
    bao.appendRow([new Date(), 'Ms. Vân', 'S1.005 - Peach', 'Tràn Bé ' + i, 'SP1', '', '', '', '']);
  }
  sandbox.gomNhom();
  const lich = rows('LICH_BU');
  const xep = lich.filter(r => r[4] && String(r[4]).startsWith('Tràn Bé')).length;
  const du = bao.rows.filter(r => String(r[6] || '') === 'Tuần sau').length;
  eq(xep, 15, 'Xếp tối đa 15 (16 trừ bé A đã có)'); // bé A đã chiếm 1 chỗ
  eq(du, 5, 'Bé dư = Tuần sau (20+1 - 16)');
  // SOTW chưa tick (sheet mới) → không gửi, không lỗi
  ok(lastAlert().includes('SOTW'), 'Gom nhóm vẫn báo phần SOTW');
}

console.log('\n=== T16: Làm mới tuần mới — TỰ BACKUP + GIỮ bé chưa chốt ===');
{
  const lich = sheet('LICH_BU');
  const bao = sheet('BAO_BU');
  const tenBk = 'Backup tháng ' + Utilities.formatDate(new Date(), 'GMT+7', 'MM-yyyy');
  // Trước: LICH có Bé A (✅) + 15 bé 'Chờ'; CHƯA có backup lần nào trên sheet mới này
  ok(rows('LICH_BU').length > 10, 'LICH có dữ liệu trước làm mới (rows=' + rows('LICH_BU').length + ')');
  ok(!sheet(tenBk), 'Trước: chưa có sheet backup');
  STATE.confirms.push(true);
  sandbox.lamMoiTuanMoi();
  const last = lastAlert();
  ok(last.includes('Đã backup thêm'), 'TỰ backup trước khi xoá (không còn cảnh quên backup)');
  ok(last.includes('Chuyển 15'), 'Thông báo chuyển 15 bé chưa chốt về BAO_BU');
  // Backup có bé ✅
  const bkName = sheet(tenBk);
  ok(!!bkName && bkName.rows.some(r => r[5] === 'Bé A'), 'Backup chứa bé đã ✅ (Bé A)');
  // Bé 'Chờ' được GIỮ — trước đây sẽ MẤT (bug core logic đã fix)
  const d1 = findRow(bao, 3, 'Tràn Bé 1');
  ok(d1 > 0, 'Bé "Chờ" được GIỮ lại trong BAO_BU (không mất)');
  eq(bao.getRange(d1, 8).getValue(), '', 'Bé giữ lại: Ca xếp trống');
  ok(String(bao.getRange(d1, 9).getValue()).includes('chưa chốt'), 'Có ghi chú "giữ lại từ tuần trước"');
  // Bé đã ✅: đã backup → KHÔNG quay lại BAO_BU (không cần xếp lại)
  ok(findRow(bao, 3, 'Bé A') < 0, 'Bé đã ✅ (Bé A) đã backup → không quay lại BAO_BU');
  // LICH sạch + mẫu giữ + backup không trùng
  eq(lich.rows.length, 1, 'LICH_BU chỉ còn header');
  ok(String(bao.getRange(2, 9).getValue()).includes('(DÒNG MẪU)'), 'Dòng mẫu giữ nguyên');
  const cntBk = bkName.rows.length;
  sandbox.backupThuCong();
  eq(bkName.rows.length, cntBk, 'Backup sau làm mới: không thêm dòng trùng');
}

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

console.log('\n=== T20: Đồng bộ DS từ file chính — CHỈ ĐỌC, giữ tick/link, bé thiếu giữ lại ===');
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
  ok(kq.giuTen.includes('Bé Chỉ Trong DS'), 'Bé thiếu trong file chính → báo giữ lại');
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
  // Bé chỉ trong DS: giữ lại, KHÔNG mất
  const dGiu = findRow(ds, 0, 'Bé Chỉ Trong DS');
  ok(dGiu > 0, 'Bé chỉ trong DS được GIỮ lại');
  ok(dGiu > dMoi, 'Bé giữ lại chuyển xuống cuối bảng');
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

  // 6) Đồng bộ → bộ lọc tự chạy lại, dòng mới không lẫn
  ds.getRange(1, 2).setValue('Ms. Uyên Vi');
  const kq = sandbox.dongBoAnToan(STATE.ss);
  ok(!kq.loi, 'Đồng bộ OK' + (kq.loi ? ': ' + kq.loi : ''));
  ok(ds.isRowHiddenByUser(3), 'Dòng mới từ file (GV khác) bị ẩn theo filter');
  ok(!ds.isRowHiddenByUser(5) && !ds.isRowHiddenByUser(6), 'Bé Ms. Uyên Vi vẫn hiện sau đồng bộ');
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
  ok(dv3 && dv3.rule.list && dv3.rule.list.indexOf('S2.006 - Avocado') >= 0 && dv3.rule.list.indexOf('S1.005 - Peach') >= 0,
    'Chọn GV → dropdown Lớp = lớp của Ms. Nhung');
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

console.log('\n=== T25: Ghi chú GV — vào LICH + tin nhắn, gộp 2 bé cùng lớp ===');
{
  // a) Bé có ghi chú trong BAO_BU → khi gom vào lịch: cột Ghi chú + trong tin GV
  const lich = sheet('LICH_BU');
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú']);
  const bao = sheet('BAO_BU');
  bao.appendRow([new Date(), 'Ms. Vân', 'S1.005 - Peach', 'Bé GhiChu', 'SP1', 'https://s/slide', '', '', 'Ôn unit 4 + 10 câu đọc lại']);
  sandbox.gomNhom();
  const dGC = findRow('LICH_BU', 4, 'Bé GhiChu');
  ok(dGC > 0, 'Bé có ghi chú được xếp vào lịch');
  eq(lich.getRange(dGC, 13).getValue(), 'Ôn unit 4 + 10 câu đọc lại', 'LICH có cột Ghi chú (13) chứa nội dung');
  ok(String(lich.getRange(dGC, 11).getValue()).indexOf('📌 Ghi chú: Ôn unit 4') >= 0, 'Tin nhắn GV kèm 📌 Ghi chú');
  const dBao = findRow(bao, 3, 'Bé GhiChu');
  ok(dBao > 0 && bao.getRange(dBao, 7).getValue() === 'Đã xếp', 'Dánh dấu Đã xếp');

  // b) 2 bé cùng lớp + cùng ghi chú → guiTinChoGV gộp 1 dòng ghi chú
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú']);
  lich.appendRow(['T9-1', 'Thứ 9', '10h00', 'Ms. Vân', 'Bé G1', 'S1.002 - Almond', 'SP1', 'https://s/1', '✅ Đi được', '', '', '', 'Ôn unit 4, đọc từ vựng']);
  lich.appendRow(['T9-1', 'Thứ 9', '10h00', 'Ms. Vân', 'Bé G2', 'S1.002 - Almond', 'SP1', 'https://s/2', '✅ Đi được', '', '', '', 'Ôn unit 4, đọc từ vựng']);
  lich.appendRow(['T9-2', 'Thứ 9', '12h00', 'Ms. Vân', 'Bé G3', 'S1.003 - Hazelnut', 'SP1', '', '✅ Đi được', '', '', '', 'Ôn unit 5']);
  STATE.fetches.length = 0;
  sandbox.guiTinChoGV();
  const texts = STATE.fetches.map(f => f.text);
  const t91 = texts.find(t => t.indexOf('10h00') >= 0) || '';
  const t92 = texts.find(t => t.indexOf('12h00') >= 0) || '';
  const demNote = (t91.match(/Ôn unit 4, đọc từ vựng/g) || []).length;
  eq(demNote, 1, '2 bé cùng lớp cùng ghi chú → GỘP 1 dòng (không lặp)');
  ok(t91.indexOf('📌 Ghi chú (S1.002 - Almond)') >= 0, 'Ghi chú gộp nêu rõ lớp');
  ok(t92.indexOf('📌 Ghi chú (S1.003 - Hazelnut): Ôn unit 5') >= 0, 'Ghi chú khác → dòng riêng');
}

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
  eq([caT2.thu, caT2.gio, caT2.gv], ['Thứ 2', '08:00-09:30', 'Ms. Vân'], 'Ca riêng T2 giữ đúng ngày, giờ, GV');
  const caCN = sandbox.parseCaDacBiet('CN 14h00-15h30 Mr. Ngọc');
  eq([caCN.thu, caCN.gio, caCN.gv], ['Chủ nhật', '14:00-15:30', 'Mr. Ngọc'], 'Ca riêng CN được xếp như mọi ngày khác');
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
  const lich = STATE.ss.insertSheet('LICH_BU');
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú', 'Ngày học']);
  lich.appendRow(['T5-1', 'Thứ 5', '17h00-18h30', 'Ms. Vân', 'Bé Đã Học', 'L1', 'SP1', '', '✅ Đi được', '', '', '✅ Đã học', '', '']);
  lich.appendRow(['T6-1', 'Thứ 6', '15h00-16h30', 'Ms. Vân', 'Bé Chờ', 'L1', 'SP1', '', 'Chờ Ms. Vân Anh', '', '', '', '', '']);
  lich.appendRow(['T6-2', 'Thứ 6', '17h00-18h30', 'Mr. Ngọc', 'Bé Đổi', 'L2', 'SP2', '', '🔄 Xin đổi', '', '', '', '', '']);
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

console.log('\n=== T35: SOTW gửi đúng topic riêng ===');
{
  STATE.fetches.length = 0; STATE.alerts.length = 0;
  const rs = sandbox.guiTelegramSOTW('🏆 Tin thử SOTW');
  ok(rs, 'Gửi thử SOTW thành công');
  eq(STATE.fetches.length, 1, 'Gửi thử SOTW tạo đúng 1 tin');
  eq(STATE.fetches[0].payload.chat_id, '-1003955550981', 'SOTW gửi đúng nhóm Office - Joy');
  eq(STATE.fetches[0].payload.message_thread_id, 22, 'SOTW gửi đúng topic 22');
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

console.log('\n============================');
console.log(`PASS: ${PASS}  FAIL: ${FAIL}`);
process.exit(FAIL > 0 ? 1 : 0);

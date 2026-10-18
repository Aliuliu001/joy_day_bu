/****************************************************
 * JOY DẠY BÙ — Code.gs (bản SOTW — 14/10/2026)
 * Chạy trong Google Apps Script (gắn với Google Sheet DẠY BÙ)
 *
 * THAY ĐỔI TRONG BẢN NÀY:
 * + Tab DS HỌC SINH: dropdown "GV đang chọn" (chỉ lớp GV đó sáng),
 *   cột tick SOTW, giới tính, link ảnh — GV chỉ click & tick
 * + Cột J BAO_BU = "SOTW" link mở DS HỌC SINH
 * + 2 dòng mẫu BAO_BU (bảo vệ, không xếp lịch)
 * + Nút "Gom nhóm" chạy GỘP phần gửi SOTW cho Mr. Khôi
 * + Gửi SOTW: GIỮ tick cả tuần (check lại được),
 *   chống trùng bằng mốc "đã gửi"
 * + "Làm mới tuần mới": clear BAO_BU + LICH_BU + tick SOTW + mốc
 * + Gom nhóm lại: không mất bé đã xếp (fix reset trạng thái)
 * + Backup T7: chỉ lưu, không xoá (chống duplicate)
 * + Tin nhắn PH: bỏ dòng GV và Lớp
 * + Gộp "Xin đổi" + "Quá hạn" = nút "Xử lý case đặc biệt"
 ****************************************************/

// ===== CẤU HÌNH =====
var CFG = {
  GROUP_ID: '-1004378772858',    // nhóm Học Bù
  TOPIC_ID: 2,                   // topic Học Bù
  HAN_TRA_LOI: '12h trưa Thứ 4',
  HAN_PH_XAC_NHAN: '11h trưa Thứ 3',
  TOI_DA_CA: 4,
  TOI_DA_TRINH_DO: 2,
  HONG_ANH_DEN_HT: '2026-10-31',
};

var SHEET_ID = '1O_RUUL9P4YggLI2Vp1AcFraZuUHcF8CXULtZ9jPZGsg';
var SOTW_SHEET = 'DS HỌC SINH';
var DAU_MAU = '(DÒNG MẪU)';

function laySS() {
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!ss) ss = SpreadsheetApp.openById(SHEET_ID);
  return ss;
}

function baoXong(msg) {
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
}

function xacNhan(cauHoi) {
  try {
    var ui = SpreadsheetApp.getUi();
    return ui.alert(cauHoi, ui.ButtonSet.YES_NO) === ui.Button.YES;
  } catch (e) {
    return true;
  }
}

var TRINH_DO = ['Kids', 'SP0', 'SP1', 'SP2', 'SP3', 'SP4'];
var GV_LIST = ['Mr. Đức Anh', 'Mr. Ngọc', 'Ms. Hồng Anh', 'Ms. Nhung', 'Ms. Trâm', 'Ms. Uyên Vi', 'Ms. Vân'];
var PH_TRANG_THAI = ['Chờ Ms. Vân Anh', '✅ Đi được', '🔄 Xin đổi', '❌ Nghỉ', 'Tuần sau (quá hạn)'];
var DA_DAY = ['✅ Đã học', '❌ Vắng (không tới)'];
var GIOI_TINH = ['Nam', 'Nữ'];
var EMAIL_QUAN_LY = ['tuanngoctruong2710@gmail.com', 'nguyenthiuyenvi@gmail.com', 'vananhhthuy@gmail.com'];

var LOP_LIST = [
  'S1.006 - Lychee', 'S2.004 - Cherry', 'C2.004 - Kiwi', 'T1.001 - Apple', 'W2.001 - Cookie',
  'S1.005 - Peach', 'S2.003 - Peanut', 'C2.002 - Chestnut', 'W1.002 - Ice-cream', 'T2.004 - Pea',
  'S1.004 - Watermelon', 'S2.002 - Blueberry', 'C2.003 - Tomato', 'T2.002 - Carrot',
  'S1.001 - Cashew', 'S2.001 - Pumpkin Seed', 'C2.005 - Pineapple', 'W1.003 - Tiramisu',
  'S1.003 - Hazelnut', 'S2.005 - Acorn', 'C2.006 - Broccoli', 'T2.003 - Potato',
  'S1.002 - Almond', 'C2.001 - Strawberry',
  'S2.006 - Avocado'
];

// Lớp → GV chính (dùng chung cho setupDayBu + SOTW)
var LOP_GV_MAP = {
  'S1.006 - Lychee': 'Mr. Đức Anh', 'S2.004 - Cherry': 'Mr. Đức Anh', 'C2.004 - Kiwi': 'Mr. Đức Anh',
  'T1.001 - Apple': 'Mr. Đức Anh', 'W2.001 - Cookie': 'Mr. Đức Anh',
  'S1.005 - Peach': 'Ms. Vân', 'S2.003 - Peanut': 'Ms. Vân', 'C2.002 - Chestnut': 'Ms. Vân',
  'W1.002 - Ice-cream': 'Ms. Vân', 'T2.004 - Pea': 'Ms. Vân',
  'S1.004 - Watermelon': 'Ms. Hồng Anh', 'S2.002 - Blueberry': 'Ms. Hồng Anh',
  'C2.003 - Tomato': 'Ms. Hồng Anh', 'T2.002 - Carrot': 'Ms. Hồng Anh',
  'S1.001 - Cashew': 'Mr. Ngọc', 'S2.001 - Pumpkin Seed': 'Mr. Ngọc',
  'C2.005 - Pineapple': 'Mr. Ngọc', 'W1.003 - Tiramisu': 'Mr. Ngọc',
  'S1.003 - Hazelnut': 'Ms. Trâm', 'S2.005 - Acorn': 'Ms. Trâm',
  'C2.006 - Broccoli': 'Ms. Trâm', 'T2.003 - Potato': 'Ms. Trâm',
  'S1.002 - Almond': 'Ms. Uyên Vi', 'C2.001 - Strawberry': 'Ms. Uyên Vi',
  'S2.006 - Avocado': 'Ms. Nhung'
};

var LOP_DUC_ANH = ['S1.006 - Lychee', 'S2.004 - Cherry', 'C2.004 - Kiwi', 'T1.001 - Apple', 'W2.001 - Cookie'];

function layDanhSachCa() {
  var gvVan = 'Ms. Vân';
  return [
    { ma: 'T5-1', thu: 'Thứ 5', gio: '17h00 - 18h30', gv: gvVan },
    { ma: 'T6-1', thu: 'Thứ 6', gio: '15h00 - 16h30', gv: gvVan },
    { ma: 'T6-2', thu: 'Thứ 6', gio: '17h00 - 18h30', gv: gvVan },
    { ma: 'T6-3', thu: 'Thứ 6', gio: '18h00 - 19h30', gv: 'Mr. Đức Anh' },
  ];
}

function layNgayThu(thu) {
  var homNay = new Date();
  var thuHienTai = parseInt(Utilities.formatDate(homNay, 'GMT+7', 'u'), 10) % 7;
  var thuMuon = thu === 'Thứ 6' ? 5 : 4;
  var ngayCach = thuMuon - thuHienTai;
  if (ngayCach <= 0) ngayCach += 7;
  var ngayHoc = new Date(homNay.getTime() + ngayCach * 24 * 60 * 60 * 1000);
  return Utilities.formatDate(ngayHoc, 'GMT+7', 'dd/MM/yyyy');
}

function hongAnhConLam() {
  var homNay = new Date();
  var han = new Date(CFG.HONG_ANH_DEN_HT + 'T23:59:59+07:00');
  return homNay <= han;
}

// ===== MENU (4 nút workflow + 3 menu con) =====
// LƯU Ý: menu con KHÔNG được gọi addToUi() — chỉ gọi 1 lần cuối cho menu chính,
// nếu không Google sẽ ném lỗi → menu chính không hiện (bug đã fix 17/10)
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('📚 Dạy Bù')
      .addItem('1️⃣ Gom nhóm + gửi SOTW (T2 chiều)', 'gomNhom')
      .addItem('2️⃣ Xử lý Xin đổi / Quá hạn (T4)', 'xuLyCaseDacBiet')
      .addItem('3️⃣ Gửi tin cho GV (T5-T6)', 'guiTinChoGV')
      .addItem('4️⃣ Làm mới tuần mới (cuối tuần)', 'lamMoiTuanMoi')
      .addSeparator()
      .addSubMenu(ui.createMenu('🔁 Gửi / Nhắc lẻ')
        .addItem('🏆 Gửi lại SOTW', 'guiSOTWMenu')
        .addItem('🔔 Nhắc GV báo bù (T2 sáng)', 'nhacGVBaoBu')
        .addItem('💾 Backup thủ công', 'backupThuCong'))
      .addSubMenu(ui.createMenu('📊 Báo cáo')
        .addItem('📊 Làm mới thống kê', 'lamMoiThongKe'))
      .addSubMenu(ui.createMenu('⚙️ Cài đặt (chạy 1 lần)')
        .addItem('🔧 Nâng cấp sheet SOTW', 'nangCapSheetSotw')
        .addItem('🔨 Tạo sheet mới (xoá data!)', 'setupDayBu')
        .addItem('🗜️ Ẩn / hiện tab LOP', 'anTabLop'))
      .addToUi();
  } catch (e) {
    Logger.log('LỖI TẠO MENU: ' + e);
  }
}

// Ẩn/ hiện tab LOP (bảng tham khảo — ẩn cho gọn, hiện lại khi cần)
function anTabLop() {
  var ss = laySS();
  var lop = ss.getSheetByName('LOP');
  if (!lop) { baoXong('Chưa có tab LOP.'); return; }
  if (lop.isSheetHidden()) {
    lop.setHidden(false);
    baoXong('Đã HIỆN lại tab LOP.');
  } else {
    lop.setHidden(true);
    baoXong('Đã ẨN tab LOP (dữ liệu không mất — hiện lại bằng nút 🗜️ trong Cài đặt).');
  }
}

// ===== TẠO / NÂNG CẤP SHEET =====
function layHoacTaoSheet(ss, ten) {
  var sh = ss.getSheetByName(ten);
  if (!sh) sh = ss.insertSheet(ten);
  return sh;
}

function datDropdown(sh, cot, toiDong, danhSach) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(danhSach, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(2, cot, toiDong - 1, 1).setDataValidation(rule);
}

// Tạo/cập nhật tab DS HỌC SINH (không xoá data)
function taoBangSotw(ss) {
  var sh = layHoacTaoSheet(ss, SOTW_SHEET);
  if (sh.getRange(2, 1).getValue() !== 'Tên bé') {
    sh.getRange(1, 1).setValue('GV đang chọn:');
    sh.getRange(1, 3).setValue('Lớp cần chọn:');
    sh.getRange(1, 5).setValue('SOTW đã gửi:');
    sh.getRange(2, 1, 1, 6).setValues([['Tên bé', 'Lớp', 'GV chính', 'Giới tính', 'Link ảnh', '☑ SOTW tuần này']]);
    sh.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#F6F3EE');
    sh.getRange(2, 1, 1, 6).setFontWeight('bold').setBackground('#F6F3EE');
  }
  // Dropdown GV đang chọn + lớp cần chọn
  sh.getRange(1, 2).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(GV_LIST, true).setAllowInvalid(true).build());
  sh.getRange(1, 4).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(LOP_LIST, true).setAllowInvalid(true).build());
  // Giới tính + tick checkbox
  sh.getRange(3, 4, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(GIOI_TINH, true).setAllowInvalid(true).build());
  sh.getRange(3, 6, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireCheckbox().setAllowInvalid(true).build());
  // Conditional formatting: chọn GV → chỉ lớp GV đó sáng
  // API THẬT = whenFormulaSatisfied (setFormulaRelativeFormula KHÔNG tồn tại — bug 17/10)
  // Bọc try/catch: tô màu chỉ là trang trí → lỗi không được chặn các bước còn lại
  try {
    var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($B$1<>"",OR($C3<>$B$1,AND($D$1<>"",$B3<>$D$1)))')
      .setRanges([sh.getRange(3, 1, 500, 6)])
      .setBackground('#EDEDED')
      .setFontColor('#AAAAAA')
      .build();
    sh.setConditionalFormatRules([rule]);
  } catch (eRule) {
    Logger.log('Bỏ qua rule tô màu (không quan trọng): ' + eRule);
  }
  // Điền GV chính cho các dòng đã có Lớp (chưa có GV)
  var last = sh.getLastRow();
  if (last >= 3) {
    var vals = sh.getRange(3, 1, last - 2, 3).getValues();
    for (var i = 0; i < vals.length; i++) {
      var lop = (vals[i][1] || '').toString().trim();
      if (lop && !(vals[i][2] || '').toString().trim()) {
        sh.getRange(3 + i, 3).setValue(LOP_GV_MAP[lop] || '');
      }
    }
  }
  return sh;
}

// Ngách phân tách tham số công thức theo NGÔN NGỮ CỦA FILE (File → Cài đặt → Ngôn ngữ).
// vi_VN dùng ';' — gõ ',' → Google báo #ERROR! + "Khắc phục" (bug 17/10: cột J BAO_BU)
function ngachCongThuc() {
  var loc = '';
  try { loc = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetLocale() || ''; } catch (e) {}
  return loc && loc.indexOf('en_') !== 0 ? ';' : ',';
}

// Cột J BAO_BU = link mở DS HỌC SINH
function themLinkSotw(bao, gid) {
  if (!bao.getRange(1, 10).getValue()) {
    bao.getRange(1, 10).setValue('SOTW');
    bao.getRange(1, 10).setFontWeight('bold').setBackground('#F6F3EE');
  }
  var sep = ngachCongThuc();
  var toiDong = Math.max(bao.getLastRow(), 100);
  for (var r = 2; r <= toiDong; r++) {
    // Ghi ĐÈ mọi ô cột J (cột này chỉ chứa link của mình) → sửa luôn ô đang #ERROR!
    bao.getRange(r, 10).setFormula('=HYPERLINK("#gid=' + gid + '"' + sep + '"Mở DS SOTW ⬈")');
  }
}

// 2 dòng mẫu BAO_BU (bảo vệ — không cho GV sửa, gom nhóm bỏ qua)
function taoDongMau(bao) {
  var data = bao.getDataRange().getValues();
  var dem = 0;
  for (var i = 1; i < data.length; i++) {
    if ((data[i][8] || '').toString().indexOf(DAU_MAU) >= 0) dem++;
  }
  if (dem >= 2) return false;
  var mau1 = ['', 'Mr. Ngọc', 'Không bù', 'S1.001 - Cashew', '', '', '', '',
    DAU_MAU + ' Lớp đi đủ → gõ "Không bù" ở cột Tên bé', ''];
  var mau2 = ['', 'Mr. Ngọc', 'Iphone', 'S2.001 - Pumpkin Seed', 'SP1', '', '', '',
    DAU_MAU + ' Vắng bạn Iphone → ghi tên bé nghỉ ở cột Tên bé', ''];
  var dong2LaMau = data.length >= 2 &&
    ((data[1][8] || '').toString().indexOf(DAU_MAU) >= 0 ||
     (data[1][2] || '').toString().toLowerCase().indexOf('ghi chú mẫu') >= 0);
  if (dong2LaMau) {
    bao.getRange(2, 1, 1, 10).setValues([mau1]);
    bao.insertRows(3, 1);
    bao.getRange(3, 1, 1, 10).setValues([mau2]);
  } else if (data.length < 2) {
    bao.appendRow(mau1);
    bao.appendRow(mau2);
  } else {
    bao.insertRows(2, 2);
    bao.getRange(2, 1, 1, 10).setValues([mau1]);
    bao.getRange(3, 1, 1, 10).setValues([mau2]);
  }
  bao.getRange(2, 1, 2, 10).setFontStyle('italic').setFontColor('#999999');
  return true;
}

// Bảo vệ 2 dòng mẫu: chỉ quản lý sửa được
function chongCheDongMau(bao) {
  try {
    var olds = bao.getProtections(SpreadsheetApp.ProtectionType.RANGE) || [];
    for (var i = 0; i < olds.length; i++) {
      if ((olds[i].getDescription() || '').indexOf('Dòng mẫu') >= 0) return;
    }
  } catch (e) {}
  var prot = bao.getRange(2, 1, 2, 10).protect().setDescription('Dòng mẫu - chỉ quản lý sửa');
  prot.addEditors(EMAIL_QUAN_LY);
  try { if (prot.canDomainEdit()) prot.setDomainEdit(false); } catch (e) {}
}

// NÂNG CẤP SHEET (menu) — không xoá data cũ
// Nâng cấp sheet: mỗi bước BỌC RIÊNG — 1 chỗ lỗi không được chặn các bước còn lại,
// lỗi gom vào mảng `loi` báo cuối cùng (trước đây lỗi API → dừng giữa chừng, không biết đã chạy tới đâu)
function nangCapSheetSotw() {
  var ss = laySS();
  var loi = [];
  var sotw = null;
  try { sotw = taoBangSotw(ss); } catch (e) { loi.push('Tạo tab ' + SOTW_SHEET + ': ' + e); }
  var msg = '✅ Đã nâng cấp sheet SOTW:\n• Tab "' + SOTW_SHEET + '"';
  if (sotw) msg = '✅ Đã nâng cấp sheet SOTW:\n• Tab "' + SOTW_SHEET + '" sẵn sàng (dropdown GV / lớp, ô tick)';
  var bao = ss.getSheetByName('BAO_BU');
  if (bao) {
    try {
      if (sotw) themLinkSotw(bao, sotw.getSheetId());
      var themMau = false;
      themMau = taoDongMau(bao);
      chongCheDongMau(bao);
      datDropdown(bao, 2, 100, GV_LIST);
      datDropdown(bao, 4, 100, LOP_LIST);
      datDropdown(bao, 5, 100, TRINH_DO);
      msg += '\n• Cột J BAO_BU = link mở DS HỌC SINH';
      msg += themMau ? '\n• Đã thêm 2 dòng mẫu (bảo vệ)' : '\n• 2 dòng mẫu đã có';
    } catch (e) { loi.push('BAO_BU (cột J / dòng mẫu / ô chọn): ' + e); }
  } else {
    msg += '\n⚠️ Chưa có tab BAO_BU.';
  }
  // Ẩn tab LOP cho gọn (dữ liệu không mất)
  try {
    var lop = ss.getSheetByName('LOP');
    if (lop && !lop.isSheetHidden()) {
      lop.setHidden(true);
      msg += '\n• Đã ẨN tab LOP (hiện lại: 🗜️ trong menu Cài đặt)';
    }
  } catch (e) { loi.push('Ẩn tab LOP: ' + e); }
  // Cài backup tự động T7 — chỉ hỏi 1 lần khi chưa có trigger
  var daCoTrigger = false;
  try {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'backupTuanBu') daCoTrigger = true;
    }
  } catch (e) {}
  if (!daCoTrigger) {
    try {
      if (xacNhan('Cài luôn backup tự động mỗi tối Thứ 7 lúc 22h?\n(Chỉ LƯU dữ liệu, không xoá gì — an toàn)')) {
        setupTriggerTuanBu(false);
        msg += '\n• Đã cài backup tự động tối T7 22h';
      }
    } catch (e) { loi.push('Cài backup T7: ' + e); }
  }
  if (loi.length) {
    msg += '\n\n⚠️ ' + loi.length + ' chỗ gặp lỗi (xem Nhật ký thực thi — code vẫn chạy các bước khác):';
    loi.forEach(function (x) { msg += '\n• ' + x; });
  }
  msg += '\n\nBước tiếp: dán danh sách HS vào tab "' + SOTW_SHEET + '" từ ô A3'
    + '\n(Excel: Tên | Lớp | GV — copy rồi paste là vào đủ cột).';
  baoXong(msg);
}

// ===== TẠO SHEET (1 lần) =====
function setupDayBu() {
  if (!xacNhan('Việc này sẽ XOÁ HẾT dữ liệu 3 tab BAO_BU, LICH_BU, LOP và tạo lại. Tiếp tục?')) return;
  var ss = laySS();

  var sh1 = layHoacTaoSheet(ss, 'BAO_BU');
  sh1.clear();
  sh1.appendRow(['Ngày báo', 'GV báo', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú', 'SOTW']);
  sh1.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#F6F3EE');
  taoDongMau(sh1);
  datDropdown(sh1, 2, 100, GV_LIST);
  datDropdown(sh1, 4, 100, LOP_LIST);
  datDropdown(sh1, 5, 100, TRINH_DO);

  var sh2 = layHoacTaoSheet(ss, 'LICH_BU');
  sh2.clear();
  sh2.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  sh2.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(sh2, 9, 200, PH_TRANG_THAI);
  datDropdown(sh2, 12, 200, DA_DAY);

  var sh3 = layHoacTaoSheet(ss, 'LOP');
  sh3.clear();
  sh3.appendRow(['Lớp', 'GV chính']);
  LOP_LIST.forEach(function (lop) {
    sh3.appendRow([lop, LOP_GV_MAP[lop] || '']);
  });

  var sotw = taoBangSotw(ss);
  themLinkSotw(sh1, sotw.getSheetId());
  chongCheDongMau(sh1);
  try { sh3.setHidden(true); } catch (e) {}
  baoXong('Xong! Đã tạo: BAO_BU (kèm 2 dòng mẫu + cột SOTW), LICH_BU, DS HỌC SINH (tab LOP đã ẩn).');
}

function setupNhe() {
  var ss = laySS();
  var sh1 = layHoacTaoSheet(ss, 'BAO_BU');
  if (!sh1.getRange(1, 1).getValue()) {
    sh1.getRange(1, 1, 1, 10).setValues([['Ngày báo', 'GV báo', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú', 'SOTW']]);
    sh1.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#F6F3EE');
  }
  datDropdown(sh1, 2, 100, GV_LIST);
  datDropdown(sh1, 4, 100, LOP_LIST);
  datDropdown(sh1, 5, 100, TRINH_DO);
  var sh2n = layHoacTaoSheet(ss, 'LICH_BU');
  if (!sh2n.getRange(1, 1).getValue()) {
    sh2n.getRange(1, 1, 1, 12).setValues([['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']]);
    sh2n.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  }
  datDropdown(sh2n, 9, 200, PH_TRANG_THAI);
  datDropdown(sh2n, 12, 200, DA_DAY);
  layHoacTaoSheet(ss, 'LOP');
  var sotw = taoBangSotw(ss);
  themLinkSotw(sh1, sotw.getSheetId());
  baoXong('Xong bản nhẹ! Không mất dữ liệu cũ.');
}

// ===== QUYỀN SỬA =====
function khoaCotQuanLy() {
  var ss = laySS();
  var sh = ss.getSheetByName('BAO_BU');
  if (!sh) return;
  var range = sh.getRange(1, 7, 500, 3);
  var prot = range.protect().setDescription('Chỉ quản lý sửa');
  prot.addEditors(EMAIL_QUAN_LY);
  if (prot.canDomainEdit()) prot.setDomainEdit(false);
}

// Tự điền ngày khi GV gõ (bỏ qua dòng mẫu)
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    if (sh.getName() !== 'BAO_BU') return;
    var dong = e.range.getRow();
    if (dong < 2) return;
    var cot = e.range.getColumn();
    if (cot < 2 || cot > 6) return;
    var ghiChu = (sh.getRange(dong, 9).getValue() || '').toString();
    if (ghiChu.indexOf(DAU_MAU) >= 0) return;
    var oNgay = sh.getRange(dong, 1);
    if (!oNgay.getValue()) oNgay.setValue(new Date());
  } catch (err) { }
}

function laySheetBaoBu(ss) {
  return ss.getSheetByName('BAO_BU');
}

// ===== TIM DÒNG BÉ TRONG BAO_BU =====
function timDongBaoBu(bao, ten, lop) {
  var data = bao.getDataRange().getValues();
  var dauTien = -1;
  for (var i = 1; i < data.length; i++) {
    if ((data[i][8] || '').toString().indexOf(DAU_MAU) >= 0) continue;
    if ((data[i][2] || '').toString().trim().toLowerCase() !== ten.toLowerCase()) continue;
    if (lop && (data[i][3] || '').toString().trim() !== lop) continue;
    var st = (data[i][6] || '').toString();
    if (st === 'Đã xếp') return i + 1;
    if (dauTien < 0) dauTien = i + 1;
  }
  return dauTien;
}

// ===== GOM NHÓM + SOTW (1 nút chạy gộp) =====
function gomNhom() {
  var ss = laySS();
  var bao = laySheetBaoBu(ss);
  var lich = ss.getSheetByName('LICH_BU');
  if (!bao || !lich) {
    baoXong('Chưa có sheet. Bấm menu "🔧 Nâng cấp sheet SOTW" (hoặc "Tạo sheet") trước.');
    return;
  }
  var msgXep = xepLichChinh(ss, bao, lich);
  var rs = guiSOTW(false);
  baoXong(msgXep + (rs.skip ? '\n\nℹ️ SOTW: ' + rs.msg : '\n\n🏆 SOTW: ' + rs.msg));
}

function xepLichChinh(ss, bao, lich) {
  // 1. Giữ dòng chốt (✅ / ❌ Nghỉ / 🔄 Xin đổi), xoá dòng chưa chốt
  //    + reset trạng thái bé tương ứng trong BAO_BU (KHÔNG mất bé khi gom lại)
  var daCo = giuLaiDongDaChot(lich, bao);

  // 2. Đọc bé chưa xếp
  var data = bao.getDataRange().getValues();
  if (data.length < 2) return 'Chưa có bé nào báo bù.';
  var chuaXep = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var trangThai = (r[6] || '').toString().trim();
    var tenBe = (r[2] || '').toString().trim().toLowerCase();
    if (!tenBe) continue;
    if ((r[8] || '').toString().indexOf(DAU_MAU) >= 0) continue;
    if (tenBe.indexOf('ghi chú mẫu') >= 0 || tenBe.indexOf('không bù') === 0) continue;
    if (trangThai === '' || trangThai === 'Chờ') {
      chuaXep.push({ dong: i + 1, gvBao: r[1], tenBe: r[2], lop: r[3], trinhDo: r[4], link: r[5] });
    }
  }
  if (chuaXep.length === 0) return 'Không còn bé nào chờ xếp.';

  chuaXep.sort(function (a, b) {
    var au = LOP_DUC_ANH.indexOf(a.lop) >= 0 ? 0 : 1;
    var bu = LOP_DUC_ANH.indexOf(b.lop) >= 0 ? 0 : 1;
    if (au !== bu) return au - bu;
    if (a.trinhDo < b.trinhDo) return -1;
    if (a.trinhDo > b.trinhDo) return 1;
    return 0;
  });

  var caList = layDanhSachCa();
  var conCho = caList.length * CFG.TOI_DA_CA - daCo;

  var beDu = [];
  var stt = 0;
  chuaXep.forEach(function (be) {
    var ca = conCho > 0 ? chonCaChoBe(be, caList, lich) : null;
    if (ca) {
      themBeVaoLich(lich, bao, be, ca);
      stt++;
      conCho--;
    } else {
      beDu.push(be);
    }
  });

  beDu.forEach(function (be) {
    bao.getRange(be.dong, 7).setValue('Tuần sau');
    bao.getRange(be.dong, 9).setValue('Hết chỗ các ca, tự đẩy sang tuần sau');
  });

  toDoCa3TrinhDo(lich);

  return 'Đã xếp ' + stt + ' bé vào ' + caList.length + ' ca.'
    + (beDu.length ? '\nDư ' + beDu.length + ' bé → đẩy sang tuần sau.' : '')
    + '\nBước tiếp: mở tab LICH_BU, copy cột "Tin nhắn PH" gửi Zalo cho PH.';
}

// Chọn ca cho 1 bé
function chonCaChoBe(be, caList, lich) {
  var rows = lich.getDataRange().getValues();

  function beTrongCa(maCa) {
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] !== maCa) continue;
      if ((rows[i][8] || '').toString().indexOf('❌ Nghỉ') >= 0) continue; // nghỉ = không chiếm chỗ
      list.push({ trinhDo: rows[i][6], tenBe: rows[i][4] });
    }
    return list;
  }

  if (LOP_DUC_ANH.indexOf(be.lop) >= 0) {
    var caDA = caList[caList.length - 1];
    if (beTrongCa(caDA.ma).length < CFG.TOI_DA_CA) return caDA;
  }

  for (var k = 0; k < caList.length; k++) {
    var trong = beTrongCa(caList[k].ma);
    if (trong.length >= CFG.TOI_DA_CA) continue;
    var trinhDos = {};
    trong.forEach(function (x) { trinhDos[x.trinhDo] = 1; });
    var ds = Object.keys(trinhDos);
    if (ds.length === 0) continue;
    if (ds.indexOf(be.trinhDo) >= 0) return caList[k];
    if (ds.length < CFG.TOI_DA_TRINH_DO) return caList[k];
  }

  for (var j = 0; j < caList.length; j++) {
    if (beTrongCa(caList[j].ma).length === 0) return caList[j];
  }

  for (var m = 0; m < caList.length; m++) {
    if (beTrongCa(caList[m].ma).length < CFG.TOI_DA_CA) return caList[m];
  }
  return null;
}

function themBeVaoLich(lich, bao, be, ca) {
  var ngayHoc = layNgayThu(ca.thu);
  var tinPH = 'Dạ em chào chị, em xin thông báo lịch học bù cho bé ' + be.tenBe + ':\n'
    + '• Thời gian: ' + ca.thu + ' ngày ' + ngayHoc + ' lúc ' + ca.gio + '\n'
    + 'Dạ thời gian này chị có sắp xếp đưa bé đến Trung tâm học bù được không ạ?\n'
    + 'Nhờ chị xác nhận giúp em trước ' + CFG.HAN_PH_XAC_NHAN + ' nhé!\nEm cám ơn chị ạ.';
  var tinGV = '📚 [' + ca.thu + ' ' + ca.gio + '] ' + ca.gv + ' dạy bù: bé ' + be.tenBe
    + ' (' + be.lop + ' - ' + be.trinhDo + '). Slide: ' + (be.link || '(chưa có link)');
  lich.appendRow([ca.ma, ca.thu, ca.gio, ca.gv, be.tenBe, be.lop, be.trinhDo, be.link, 'Chờ Ms. Vân Anh', tinPH, tinGV, '']);
  if (!be.link || !be.link.toString().trim()) {
    var dongMoi = lich.getLastRow();
    lich.getRange(dongMoi, 8).setBackground('#FFF3CD');
  }
  bao.getRange(be.dong, 7).setValue('Đã xếp');
  bao.getRange(be.dong, 8).setValue(ca.ma + ' ' + ca.thu + ' ' + ca.gio);
}

// Giữ dòng chốt, xoá dòng chưa chốt + reset BAO_BU để xếp lại
// Trả về số chỗ đang chiếm (không tính bé ❌ Nghỉ)
function giuLaiDongDaChot(lich, bao) {
  var data = lich.getDataRange().getValues();
  var header = data.length ? data[0].slice() : [];
  if (header.length < 12) header = header.concat([]);
  while (header.length < 12) header.push(header.length === 11 ? 'Đã dạy' : '');
  var giu = [header];
  var xoa = [];
  for (var i = 1; i < data.length; i++) {
    var ten = (data[i][4] || '').toString().trim();
    if (!ten) continue;
    var st = (data[i][8] || '').toString();
    var cuoi = st.indexOf('✅') >= 0 || st.indexOf('Đi được') >= 0 ||
      st.indexOf('❌ Nghỉ') >= 0 || st.indexOf('🔄') >= 0;
    if (cuoi) {
      giu.push(data[i]);
    } else {
      xoa.push({ ten: ten, lop: (data[i][5] || '').toString().trim() });
    }
  }
  // Đếm chỗ chiếm: không tính bé Nghỉ
  var dem = 0;
  for (var d = 1; d < giu.length; d++) {
    if ((giu[d][8] || '').toString().indexOf('❌ Nghỉ') < 0) dem++;
  }
  lich.clear();
  giu.forEach(function (r) { lich.appendRow(r); });
  lich.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(lich, 9, 200, PH_TRANG_THAI);
  datDropdown(lich, 12, 200, DA_DAY);
  // Reset BAO_BU cho bé bị xoá khỏi lịch → lần gom sau xếp lại
  if (bao && xoa.length) {
    xoa.forEach(function (x) {
      var dong = timDongBaoBu(bao, x.ten, x.lop);
      if (dong > 0) {
        bao.getRange(dong, 7).setValue('');
        bao.getRange(dong, 8).setValue('');
      }
    });
  }
  return dem;
}

function toDoCa3TrinhDo(lich) {
  var data = lich.getDataRange().getValues();
  var theoCa = {};
  for (var i = 1; i < data.length; i++) {
    if ((data[i][8] || '').toString().indexOf('❌ Nghỉ') >= 0) continue;
    var ma = data[i][0];
    if (!theoCa[ma]) theoCa[ma] = {};
    theoCa[ma][data[i][6]] = 1;
  }
  for (var j = 1; j < data.length; j++) {
    var ma2 = data[j][0];
    if (theoCa[ma2] && Object.keys(theoCa[ma2]).length > CFG.TOI_DA_TRINH_DO) {
      lich.getRange(j + 1, 1, 1, 12).setBackground('#FCE4E4');
    }
  }
}

// ===== SOTW: ĐỌC TICK / TÍNH TUẦN =====
function tinhTuanSotw() {
  var now = new Date();
  var dow = parseInt(Utilities.formatDate(now, 'GMT+7', 'u'), 10) % 7; // 0=CN
  var di = dow === 0 ? 6 : dow - 1;
  var thu2 = new Date(now.getTime() - di * 24 * 60 * 60 * 1000);
  var cn = new Date(thu2.getTime() + 6 * 24 * 60 * 60 * 1000);
  return 'Tuần ' + Utilities.formatDate(thu2, 'GMT+7', 'dd/MM')
    + ' - ' + Utilities.formatDate(cn, 'GMT+7', 'dd/MM');
}

function docTickSotw(sotw) {
  var tuan = tinhTuanSotw();
  var moc = (sotw.getRange(1, 6).getValue() || '').toString();
  var selector = (sotw.getRange(1, 2).getValue() || '').toString().trim();
  var last = sotw.getLastRow();
  var list = [];
  var warnings = [];
  if (last >= 3) {
    var vals = sotw.getRange(3, 1, last - 2, 6).getValues();
    for (var i = 0; i < vals.length; i++) {
      var r = vals[i];
      var tick = r[5] === true || (r[5] || '').toString().toUpperCase() === 'TRUE';
      if (!tick) continue;
      var ten = (r[0] || '').toString().trim();
      if (!ten) continue;
      var lop = (r[1] || '').toString().trim();
      var gv = (r[2] || '').toString().trim() || LOP_GV_MAP[lop] || '';
      if (!gv) {
        gv = 'Chưa rõ GV';
        warnings.push('Lớp không có trong danh sách: ' + lop + ' (' + ten + ')');
      }
      if (selector && gv !== selector) {
        warnings.push('Đang chọn "' + selector + '" nhưng tick bé lớp ' + gv + ': ' + ten + ' — kiểm tra lại');
      }
      list.push({ ten: ten, lop: lop, gv: gv, gt: (r[3] || '').toString().trim(), link: (r[4] || '').toString().trim() });
    }
  }
  return { tuan: tuan, moc: moc, selector: selector, list: list, warnings: warnings };
}

function taoTinSotw(d) {
  var theoGv = {};
  d.list.forEach(function (p) {
    if (!theoGv[p.gv]) theoGv[p.gv] = [];
    theoGv[p.gv].push(p);
  });
  var tin = '🏆 [' + d.tuan + ']\n';
  var thuTu = GV_LIST.filter(function (g) { return theoGv[g]; });
  Object.keys(theoGv).forEach(function (g) { if (thuTu.indexOf(g) < 0) thuTu.push(g); });
  thuTu.forEach(function (gv) {
    tin += '\n👨‍🏫 ' + gv + ':\n';
    var theoLop = {};
    theoGv[gv].forEach(function (p) {
      if (!theoLop[p.lop]) theoLop[p.lop] = [];
      theoLop[p.lop].push(p);
    });
    Object.keys(theoLop).forEach(function (lop) {
      tin += '• ' + (lop || '(chưa rõ lớp)') + ':\n';
      theoLop[lop].forEach(function (p) {
        tin += '  - ' + p.ten + (p.gt ? ' (' + p.gt + ')' : '') + (p.link ? ' 🔗 ' + p.link : '') + '\n';
      });
    });
  });
  var daNop = {};
  d.list.forEach(function (p) { daNop[p.gv] = 1; });
  var gvCanBao = GV_LIST.filter(function (g) { return g !== 'Ms. Hồng Anh' || hongAnhConLam(); });
  var chua = gvCanBao.filter(function (g) { return !daNop[g]; });
  if (chua.length) tin += '\n⚠️ Chưa nộp SOTW: ' + chua.join(', ');
  if (d.warnings.length) tin += '\n⚠️ Kiểm tra lại:\n• ' + d.warnings.join('\n• ');
  return tin;
}

// Gửi SOTW. force=true → gửi lại dù đã có mốc.
// KHÔNG xoá tick sau gửi (giữ để check) — xoá khi "Làm mới tuần mới".
function guiSOTW(force) {
  var ss = laySS();
  var sotw = ss.getSheetByName(SOTW_SHEET);
  if (!sotw) {
    return { sent: false, msg: 'Chưa có tab "' + SOTW_SHEET + '". Bấm "🔧 Nâng cấp sheet SOTW" trước.' };
  }
  var d = docTickSotw(sotw);
  if (!d.list.length) {
    return { sent: false, msg: 'Chưa bé nào được tick SOTW (' + d.tuan + ').' };
  }
  if (!force && d.moc.indexOf(d.tuan) >= 0) {
    return { sent: false, skip: true, msg: d.tuan + ' ĐÃ GỬI rồi (' + d.moc + ') — bỏ qua để tránh trùng. Cần gửi lại → bấm "4️⃣ 🏆 Gửi SOTW".' };
  }
  var tin = taoTinSotw(d);
  if (!guiTelegram(tin)) {
    return { sent: false, msg: 'Gửi Telegram thất bại — xem Nhật ký thực thi.' };
  }
  var mocMoi = d.tuan + ' — đã gửi ' + Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM HH:mm');
  sotw.getRange(1, 6).setValue(mocMoi);
  return {
    sent: true,
    msg: 'Đã gửi ' + d.list.length + ' bé SOTW cho Mr. Khôi.\nMốc: ' + mocMoi
      + '\n(tick giữ nguyên đến khi bấm "5️⃣ Làm mới tuần mới")'
  };
}

// Nút menu "Gửi SOTW (gửi lại)" — hỏi trước nếu tuần này đã gửi
function guiSOTWMenu() {
  var ss = laySS();
  var sotw = ss.getSheetByName(SOTW_SHEET);
  if (!sotw) {
    baoXong('Chưa có tab "' + SOTW_SHEET + '". Bấm "🔧 Nâng cấp sheet SOTW" trước.');
    return;
  }
  var d = docTickSotw(sotw);
  var force = false;
  if (d.moc.indexOf(d.tuan) >= 0) {
    if (!xacNhan(d.tuan + ' ĐÃ GỬI rồi:\n' + d.moc + '\n\nGửi LẠI cho Mr. Khôi?')) return;
    force = true;
  }
  var rs = guiSOTW(force);
  baoXong(rs.msg);
}

// Tìm dòng trống đầu tiên trong BAO_BU để thêm bé mới
// (appendRow thường sẽ nhảy xuống dòng 101+ vì cột J có link tới dòng 100)
function dongTrongDauTien(bao) {
  var last = bao.getLastRow();
  for (var r = 2; r <= last; r++) {
    if (!bao.getRange(r, 2).getValue() && !bao.getRange(r, 3).getValue()) return r;
  }
  return last + 1;
}

// ===== XỬ LÝ CASE ĐẶC BIỆT (Xin đổi + Quá hạn) =====
function xuLyCaseDacBiet() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var bao = ss.getSheetByName('BAO_BU');
  if (!lich || !bao) {
    baoXong('Chưa có sheet LICH_BU hoặc BAO_BU.');
    return;
  }

  var data = lich.getDataRange().getValues();
  var chuyen = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][4]) continue;
    var st = (data[i][8] || '').toString().trim();
    var loai = '';
    if (st.indexOf('🔄') >= 0 || st.indexOf('Xin đổi') >= 0) {
      loai = 'Xin đổi';
    } else if (st === '' || st.indexOf('Chờ') === 0) {
      loai = 'Quá hạn';
    }
    if (loai) {
      chuyen.push({
        dong: i + 1, loai: loai,
        tenBe: data[i][4], lop: data[i][5], trinhDo: data[i][6], link: data[i][7],
        maCa: data[i][0], thu: data[i][1], gio: data[i][2]
      });
    }
  }

  if (chuyen.length === 0) {
    baoXong('Không có bé nào cần xử lý (không có "Xin đổi" hay "Quá hạn").');
    return;
  }

  var danhSach = chuyen.map(function (be, idx) {
    return (idx + 1) + '. ' + be.tenBe + ' (' + be.loai + ' ca ' + be.maCa + ')';
  }).join('\n');
  if (!xacNhan('Tìm thấy ' + chuyen.length + ' bé cần xử lý:\n\n' + danhSach
    + '\n\nChuyển về BAO_BU để xếp lại?')) return;

  var demXinDoi = 0, demQuaHan = 0;
  chuyen.forEach(function (be) {
    var ghiChu = be.loai + ' ca ' + be.maCa + ' (' + be.thu + ' ' + be.gio + ')';
    var dong = timDongBaoBu(bao, be.tenBe, be.lop);
    if (dong > 0) {
      // Cập nhật dòng CŨ (không tạo trùng)
      bao.getRange(dong, 7).setValue('');
      bao.getRange(dong, 8).setValue('');
      bao.getRange(dong, 9).setValue(ghiChu);
    } else {
      var dongMoi = dongTrongDauTien(bao);
      bao.getRange(dongMoi, 1, 1, 9).setValues([[new Date(), '', be.tenBe, be.lop, be.trinhDo, be.link, '', '', ghiChu]]);
    }
    if (be.loai === 'Xin đổi') demXinDoi++;
    else demQuaHan++;
  });

  for (var j = chuyen.length - 1; j >= 0; j--) {
    lich.deleteRow(chuyen[j].dong);
  }

  var tin = '🔔 [XỬ LÝ CASE ĐẶC BIỆT]\n\n';
  if (demXinDoi > 0) {
    tin += '🔄 ' + demXinDoi + ' bé PH xin đổi ca:\n';
    chuyen.filter(function (be) { return be.loai === 'Xin đổi'; })
      .forEach(function (be) { tin += '  • ' + be.tenBe + ' (ca ' + be.maCa + ')\n'; });
    tin += '\n';
  }
  if (demQuaHan > 0) {
    tin += '⏰ ' + demQuaHan + ' bé quá hạn chưa xác nhận:\n';
    chuyen.filter(function (be) { return be.loai === 'Quá hạn'; })
      .forEach(function (be) { tin += '  • ' + be.tenBe + ' (ca ' + be.maCa + ')\n'; });
    tin += '\n';
  }
  tin += '✅ Đã chuyển về BAO_BU để Ms. Vân Anh xếp lại.\nCác ca đã giải phóng chỗ, có thể xếp bé khác vào.';

  if (guiTelegram(tin)) {
    baoXong('Đã chuyển ' + chuyen.length + ' bé về BAO_BU và gửi Telegram ✅\n\n'
      + 'Chi tiết:\n• Xin đổi: ' + demXinDoi + '\n• Quá hạn: ' + demQuaHan);
  } else {
    baoXong('Đã chuyển ' + chuyen.length + ' bé về BAO_BU, nhưng gửi Telegram thất bại.\nXem lỗi ở Nhật ký thực thi.');
  }
}

// ===== GỬI TIN CHO GV (ca đã ✅) =====
function guiTinChoGV() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var data = lich.getDataRange().getValues();

  var theoCa = {};
  for (var i = 1; i < data.length; i++) {
    var st = (data[i][8] || '').toString();
    if (st.indexOf('✅') < 0 && st.indexOf('Đi được') < 0) continue;
    var ma = data[i][0];
    if (!theoCa[ma]) theoCa[ma] = { thu: data[i][1], gio: data[i][2], gv: data[i][3], bes: [] };
    theoCa[ma].bes.push({ ten: data[i][4], lop: data[i][5], td: data[i][6], link: data[i][7] });
  }

  var keys = Object.keys(theoCa);
  if (!keys.length) {
    baoXong('Chưa có ca nào được chốt ✅.');
    return;
  }

  var daGui = 0;
  keys.forEach(function (ma) {
    var c = theoCa[ma];
    var tin = '📚 [HỌC BÙ ' + c.thu + ' ' + c.gio + '] ' + c.gv + ' dạy:\n';
    c.bes.forEach(function (b, idx) {
      tin += (idx + 1) + '. ' + b.ten + ' (' + b.lop + ' - ' + b.td + ')\n   Slide: ' + (b.link || '(chưa có)') + '\n';
    });
    if (guiTelegram(tin)) daGui++;
  });
  if (daGui === keys.length) baoXong('Đã gửi ' + daGui + ' tin vào nhóm Học Bù.');
  else if (daGui > 0) baoXong('Chỉ gửi được ' + daGui + '/' + keys.length + ' tin. Xem lỗi ở Nhật ký thực thi.');
}

// ===== NHẮC GV BÁO BÙ =====
function nhacGVBaoBu() {
  var ss = laySS();
  var bao = ss.getSheetByName('BAO_BU');
  var data = bao.getDataRange().getValues();
  var daBao = {};
  for (var i = 1; i < data.length; i++) {
    var gv = (data[i][1] || '').toString().trim();
    var tenBe = (data[i][2] || '').toString().trim().toLowerCase();
    if (gv && tenBe) daBao[gv] = 1;
  }
  var gvCanBao = GV_LIST.filter(function (g) { return g !== 'Ms. Hồng Anh' || hongAnhConLam(); });
  var chuaBao = gvCanBao.filter(function (g) { return !daBao[g]; });
  var tin = '📢 [SÁNG T2] Nhắc báo bù:\n';
  if (!chuaBao.length) {
    tin += 'Cả ' + gvCanBao.length + ' GV đều đã báo ✅ Cảm ơn thầy cô!';
  } else {
    tin += 'GV chưa báo: ' + chuaBao.join(', ')
      + '\nThầy cô vào tab BAO_BU:\n• Nếu có bé nghỉ: ghi tên bé + lớp + trình độ + link Canva\n• Nếu lớp đi đủ: gõ "Không bù" vào cột Tên bé';
  }
  tin += '\n\n📌 SOTW tuần này: vào tab DS HỌC SINH → chọn tên mình → tick ☑ bé SOTW.';
  if (guiTelegram(tin)) baoXong('Đã gửi tin nhắc vào nhóm Học Bù.');
}

// ===== BACKUP =====
function backupThuCong() {
  backupTuanBu(false);
}

// imLang=true: trả về thông điệp thay vì popup (dùng khi chạy gộp trong "Làm mới tuần mới")
// Chống trùng theo TỪNG DÒNG (Ca+Thứ+Giờ+GV+Tên bé) → chạy bao nhiêu lần cũng không trùng
function backupTuanBu(imLang) {
  function ketQua(m) { if (imLang === true) return m; baoXong(m); return m; }

  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  if (!lich) return ketQua('Chưa có sheet LICH_BU.');

  var homNay = new Date();
  var thang = Utilities.formatDate(homNay, 'GMT+7', 'MM-yyyy');
  var tenBackup = 'Backup tháng ' + thang;
  var backup = ss.getSheetByName(tenBackup);
  if (!backup) {
    backup = ss.insertSheet(tenBackup);
    backup.appendRow(['Ngày', 'Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'PH xác nhận', 'Đã dạy']);
    backup.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#F6F3EE');
  }

  // Đánh dấu các dòng ĐÃ có trong backup (khóa: Ca|Thứ|Giờ|GV|Tên bé)
  var daCo = {};
  var dataCu = backup.getDataRange().getValues();
  for (var c = 1; c < dataCu.length; c++) {
    var k = [dataCu[c][1], dataCu[c][2], dataCu[c][3], dataCu[c][4], dataCu[c][5]].join('|');
    if (k !== '||||') daCo[k] = 1;
  }

  var dataLich = lich.getDataRange().getValues();
  var ngay = Utilities.formatDate(homNay, 'GMT+7', 'dd/MM/yyyy');
  var demTong = 0, demMoi = 0;
  for (var i = 1; i < dataLich.length; i++) {
    if (!dataLich[i][4]) continue;
    var st = (dataLich[i][8] || '').toString().trim();
    if (st === '' || st.indexOf('Chờ') === 0) continue; // chưa có phản hồi → không backup
    demTong++;
    var key = [dataLich[i][0], dataLich[i][1], dataLich[i][2], dataLich[i][3], dataLich[i][4]].join('|');
    if (daCo[key]) continue; // dòng này đã backup rồi
    backup.appendRow([ngay, dataLich[i][0], dataLich[i][1], dataLich[i][2], dataLich[i][3],
      dataLich[i][4], dataLich[i][5], st, dataLich[i][11]]);
    daCo[key] = 1;
    demMoi++;
  }

  if (demTong === 0) {
    return ketQua('⚠️ Không có ca nào để backup (tất cả đang "Chờ Ms. Vân Anh").');
  }
  if (demMoi === 0) {
    return ketQua('✅ Không có dòng mới — toàn bộ ' + demTong + ' ca đã có trong "' + tenBackup + '" rồi.');
  }
  return ketQua('✅ Đã backup thêm ' + demMoi + ' dòng vào "' + tenBackup + '"'
    + ' (chạy lại sẽ không trùng).\n📝 Bao gồm: Đi được, Nghỉ, Vắng — chưa có phản hồi thì không backup.');
}

// ===== LÀM MỚI TUẦN MỚI (backup → clear → xoá tick SOTW) =====
function lamMoiTuanMoi() {
  if (!xacNhan('Việc này sẽ:\n'
    + '1. TỰ BACKUP trước (nếu tuần này chưa có — đã backup rồi sẽ tự bỏ qua, không trùng)\n'
    + '2. Chuyển bé CHƯA CHỐT (Chờ / Xin đổi / chưa xác nhận) về BAO_BU để giữ lại\n'
    + '3. XOÁ TRẮNG BAO_BU (giữ 2 dòng mẫu + bé chưa xếp) + XOÁ LICH_BU\n'
    + '4. XOÁ TICK SOTW + mốc "đã gửi" (danh sách HS: GIỮ)\n\n'
    + '⚠️ Chỉ làm khi đã sẵn sàng bắt đầu tuần mới.\n\nTiếp tục?')) return;

  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var bao = ss.getSheetByName('BAO_BU');

  if (!lich || !bao) {
    baoXong('Chưa có sheet LICH_BU hoặc BAO_BU.');
    return;
  }

  // 1. TỰ BACKUP trước khi xoá (im lặng — chèn vào thông báo cuối)
  var msgBackup = backupTuanBu(true);

  // 2. Chuyển bé CHƯA CHỐT trong LICH → về BAO_BU (trạng thái trống) → sẽ được GIỮ
  var dataLich = lich.getDataRange().getValues();
  var demChuyen = 0;
  for (var p = 1; p < dataLich.length; p++) {
    var tenP = (dataLich[p][4] || '').toString().trim();
    if (!tenP) continue;
    var stP = (dataLich[p][8] || '').toString();
    var cuoiP = stP.indexOf('✅') >= 0 || stP.indexOf('Đi được') >= 0 || stP.indexOf('❌ Nghỉ') >= 0;
    if (cuoiP) continue; // đã chốt xong (đã backup) → không giữ
    var lopP = (dataLich[p][5] || '').toString().trim();
    var ghiChuP = 'Giữ lại từ tuần trước (chưa chốt)';
    var dongP = timDongBaoBu(bao, tenP, lopP);
    if (dongP > 0) {
      bao.getRange(dongP, 7).setValue('');
      bao.getRange(dongP, 8).setValue('');
      bao.getRange(dongP, 9).setValue(ghiChuP);
    } else {
      var dongMoiP = dongTrongDauTien(bao);
      bao.getRange(dongMoiP, 1, 1, 9).setValues([[
        new Date(), '', tenP, lopP, (dataLich[p][6] || ''), (dataLich[p][7] || ''), '', '', ghiChuP
      ]]);
    }
    demChuyen++;
  }

  // 3. Lấy bé CHƯA XẾP (Ca xếp trống), bỏ dòng mẫu
  var dataBao = bao.getDataRange().getValues();
  var batDau = 2;
  while (batDau - 1 < dataBao.length) {
    var g = (dataBao[batDau - 1][8] || '').toString();
    var tenMau = (dataBao[batDau - 1][2] || '').toString().toLowerCase();
    if (g.indexOf(DAU_MAU) >= 0 || tenMau.indexOf('ghi chú mẫu') >= 0) batDau++;
    else break;
  }

  var giuLai = [];
  for (var i = batDau - 1; i < dataBao.length; i++) {
    var r = dataBao[i];
    if (!r[2]) continue;
    var caXep = (r[7] || '').toString().trim();
    if (caXep === '') {
      giuLai.push([r[0] || new Date(), r[1], r[2], r[3], r[4], r[5], '', '', r[8] || '']);
    }
  }

  // 4. Clear LICH_BU (giữ tiêu đề)
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  lich.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(lich, 9, 200, PH_TRANG_THAI);
  datDropdown(lich, 12, 200, DA_DAY);

  // 5. Clear BAO_BU nội dung (giữ dòng mẫu + CỘT J LINK — chỉ clear A:I)
  if (dataBao.length >= batDau) {
    bao.getRange(batDau, 1, dataBao.length - batDau + 1, 9).clearContent();
  }
  if (giuLai.length > 0) {
    // Chỉ ghi 9 cột (A:I) — cột J (link SOTW) giữ nguyên công thức cũ
    bao.getRange(batDau, 1, giuLai.length, 9).setValues(giuLai);
  }

  // 6. XOÁ TICK SOTW + mốc (danh sách HS giữ nguyên)
  var xoatable = false;
  var sotw = ss.getSheetByName(SOTW_SHEET);
  if (sotw) {
    var lastS = sotw.getLastRow();
    if (lastS >= 3) sotw.getRange(3, 6, lastS - 2, 1).clearContent();
    if (sotw.getRange(1, 6).getValue()) {
      sotw.getRange(1, 6).clearContent();
      xoatable = true;
    }
  }

  baoXong('✅ Đã làm mới tuần mới:\n'
    + '• ' + msgBackup + '\n'
    + (demChuyen > 0 ? '• Chuyển ' + demChuyen + ' bé chưa chốt về BAO_BU (giữ lại)\n' : '')
    + (giuLai.length > 0 ? '• Giữ lại ' + giuLai.length + ' bé chưa xếp trong BAO_BU\n' : '• Không bé nào chưa xếp\n')
    + '• LICH_BU đã xoá\n'
    + (xoatable ? '• Đã xoá tick SOTW + mốc đã gửi\n' : '')
    + '• Danh sách HS / link ảnh: giữ nguyên');
}

// ===== TRIGGER T7 =====
// hienThongBao=false: chạy từ hàm khác (không hiện popup riêng)
function setupTriggerTuanBu(hienThongBao) {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'backupTuanBu') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('backupTuanBu')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(22)
    .create();
  if (hienThongBao !== false) baoXong('Đã cài trigger: mỗi tối T7 22h tự BACKUP (không xoá gì) ✅');
}

// ===== THỐNG KÊ =====
function lamMoiThongKe() {
  var ss = laySS();
  var homNay = new Date();
  var thang = Utilities.formatDate(homNay, 'GMT+7', 'MM-yyyy');
  var tenBackup = 'Backup tháng ' + thang;

  if (!ss.getSheetByName(tenBackup)) {
    baoXong('Chưa có sheet "' + tenBackup + '" (tháng này chưa backup lần nào).');
    return;
  }

  var tk = ss.getSheetByName('THỐNG KÊ');
  if (!tk) tk = ss.insertSheet('THỐNG KÊ');
  tk.clear();

  var b = '\'' + tenBackup + '\'';
  var sep = ngachCongThuc(); // ';' với file vi_VN — gõ ',' → #ERROR!
  tk.getRange(1, 1).setValue('THỐNG KÊ DẠY BÙ THÁNG ' + thang).setFontSize(14).setFontWeight('bold');
  tk.getRange(3, 1, 1, 3).setValues([['GV dạy', 'Số ca dạy', 'Tổng giờ']]).setFontWeight('bold').setBackground('#F6F3EE');

  var dongBatDau = 4;
  var dongCuoi = dongBatDau + GV_LIST.length - 1;
  GV_LIST.forEach(function (gv, idx) {
    var dong = dongBatDau + idx;
    tk.getRange(dong, 1).setValue(gv);
    tk.getRange(dong, 2).setFormula(
      '=IFERROR(COUNTA(UNIQUE(FILTER(ARRAYFORMULA(' + b + '!A2:A&' + b + '!B2:B)' + sep + b + '!E2:E=A' + dong + ')))' + sep + '0)');
    tk.getRange(dong, 3).setFormula('=B' + dong + '*1.5');
  });

  var dongTong = dongCuoi + 2;
  tk.getRange(dongTong, 1).setValue('Tổng cả tháng').setFontWeight('bold');
  tk.getRange(dongTong + 1, 1, 3, 2).setValues([
    ['Tổng số bé học bù', '=COUNTA(' + b + '!F2:F)'],
    ['Tổng số ca dạy', '=SUM(B' + dongBatDau + ':B' + dongCuoi + ')'],
    ['Tổng số giờ', '=SUM(C' + dongBatDau + ':C' + dongCuoi + ')']
  ]);

  baoXong('Đã làm mới tab THỐNG KÊ với công thức tự động ✅');
}

// ===== TELEGRAM =====
function guiTelegram(text) {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) {
    baoXong('Chưa có token bot. Vào Cài đặt dự án → Thuộc tính tập lệnh → thêm TELEGRAM_BOT_TOKEN.');
    return false;
  }
  if (text.length > 4000) text = text.substring(0, 4000) + '…';
  var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      muteHttpExceptions: true,
      payload: { chat_id: CFG.GROUP_ID, message_thread_id: CFG.TOPIC_ID, text: text }
    });
    if (res.getResponseCode() !== 200) {
      baoXong('Telegram báo lỗi ' + res.getResponseCode() + ': ' + res.getContentText());
      return false;
    }
    return true;
  } catch (err) {
    baoXong('Không gửi được Telegram: ' + err);
    return false;
  }
}

function testGuiTelegram() {
  if (guiTelegram('✅ Bot Dạy Bù đã vào nhóm thành công!')) baoXong('Gửi thử thành công ✅');
}

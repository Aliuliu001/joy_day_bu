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

// FILE CHÍNH — danh sách học sinh trung tâm (CHỈ ĐỌC, không bao giờ ghi — nguyên tắc của anh Trương)
var FCHINH_ID = '1fD1ox5bz3oBzPogjtmbNbU0tjwaEJo3kJ8IAeJRD2ok';
var FCHINH_GID = 294797681;
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

// Khóa các sheet quan trọng — chỉ 3 email EMAIL_QUAN_LY được sửa
// GV chỉ sửa được: BAO_BU (trừ cột G/H đã khóa riêng) + DS HỌC SINH (tick SOTW)
function baoVeSheet() {
  var ss = laySS();
  var sheetsBaoVe = ['LICH_BU', 'THỐNG KÊ', 'LOP'];
  sheetsBaoVe.forEach(function (ten) {
    var sh = ss.getSheetByName(ten);
    if (!sh) return;
    try {
      var prots = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      prots.forEach(function (p) { p.remove(); }); // gỡ khóa cũ
      var prot = sh.protect().setDescription('Chỉ quản lý');
      prot.addEditors(EMAIL_QUAN_LY);
      if (prot.canDomainEdit()) prot.setDomainEdit(false);
    } catch (e) { Logger.log('Khóa sheet ' + ten + ' lỗi: ' + e); }
  });
  // Backup tabs theo pattern "Backup tháng …"
  ss.getSheets().forEach(function (sh) {
    var n = sh.getName();
    if (n.indexOf('Backup tháng') === 0) {
      try {
        var prots = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
        prots.forEach(function (p) { p.remove(); });
        var prot = sh.protect().setDescription('Chỉ quản lý');
        prot.addEditors(EMAIL_QUAN_LY);
        if (prot.canDomainEdit()) prot.setDomainEdit(false);
      } catch (e) {}
    }
  });
  Logger.log('Đã khóa các sheet quan trọng (GV chỉ sửa BAO_BU + DS HỌC SINH).');
}
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
    ui.createMenu('⚙️ Quản lý Dạy Bù')
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
      .addSubMenu(ui.createMenu('⚙️ Cài đặt')
        .addItem('📖 Khi nào dùng lệnh nào (đọc trước)', 'huongDanCacLenh')
        .addSeparator()
        .addItem('🔧 Nâng cấp sheet SOTW — chạy 1 lần sau khi copy code mới', 'nangCapSheetSotw')
        .addItem('🔍 Kiểm tra / sửa thứ tự cột BAO_BU', 'kiemTraThuTuCot')
        .addItem('🔄 Đồng bộ DS học sinh — khi có HS mới vào/ra (chỉ đọc file chính)', 'menuDongBoDS')
        .addItem('🖼️ Gắn link ảnh SOTW — khi thêm/thay ảnh (theo tên file)', 'ganLinkAnhTuFolder')
        .addItem('🗜️ Ẩn / hiện tab LOP', 'anTabLop')
        .addSeparator()
        .addItem('🔨 Tạo sheet mới — ⚠️ XOÁ HẾT DATA, chỉ dùng khi sheet trống', 'setupDayBu'))
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
    lop.showSheet();
    baoXong('Đã HIỆN lại tab LOP.');
  } else {
    lop.hideSheet();
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
  apLocDS(sh); // dropdown + bộ lọc ẩn/hiện theo dữ liệu thật
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
  try { chuyenCotMoiBAOBU(bao); } catch (e) {} // phòng sheet cũ đang ở thứ tự cột cũ
  var data = bao.getDataRange().getValues();
  var dem = 0;
  for (var i = 1; i < data.length; i++) {
    if ((data[i][8] || '').toString().indexOf(DAU_MAU) >= 0) dem++;
  }
  if (dem >= 2) return false;
  var mau1 = ['', 'Mr. Ngọc', 'S1.001 - Cashew', 'Không bù', '', '', '', '',
    DAU_MAU + ' Lớp đi đủ → gõ "Không bù" ở cột Tên bé', ''];
  var mau2 = ['', 'Mr. Ngọc', 'S2.001 - Pumpkin Seed', 'Iphone', 'SP1', '', '', '',
    DAU_MAU + ' Vắng bạn Iphone → ghi tên bé nghỉ ở cột Tên bé', ''];
  var dong2LaMau = false;
  if (data.length >= 2) {
    var dong2 = data[1];
    var tenDong2 = ((dong2[2] || '') + ' ' + (dong2[3] || '')).toLowerCase();
    dong2LaMau = (dong2[8] || '').toString().indexOf(DAU_MAU) >= 0 || tenDong2.indexOf('ghi chú mẫu') >= 0;
  }
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
      if (chuyenCotMoiBAOBU(bao)) msg += '\n• Đã đổi cột: Lớp ngay sau GV báo (Tên bé dời sang cột D)';
      if (sotw) themLinkSotw(bao, sotw.getSheetId());
      var themMau = false;
      themMau = taoDongMau(bao);
      chongCheDongMau(bao);
      datDropdownBaoBu(ss, bao);
      khoaCotQuanLy();
      msg += '\n• Cột J BAO_BU = link mở DS HỌC SINH';
      msg += '\n• Chọn nhanh GV → Lớp → Tên bé (dropdown theo DS HỌC SINH)';
      msg += '\n• Khóa cột Trạng thái/Ca xếp — ô GHI CHÚ GV được sửa';
      msg += themMau ? '\n• Đã thêm 2 dòng mẫu (bảo vệ)' : '\n• 2 dòng mẫu đã có';
    } catch (e) { loi.push('BAO_BU (cột J / dòng mẫu / ô chọn): ' + e); }
  } else {
    msg += '\n⚠️ Chưa có tab BAO_BU.';
  }
  // Ẩn tab LOP cho gọn (dữ liệu không mất)
  try {
    var lop = ss.getSheetByName('LOP');
    if (lop && !lop.isSheetHidden()) {
      lop.hideSheet();
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
  // Đồng bộ DS HỌC SINH từ file chính (chỉ đọc) — lỗi quyền chỉ báo, không chặn
  try {
    var kqDB2 = dongBoAnToan(ss);
    msg += kqDB2.loi
      ? '\n• DS HS chưa đọc file chính được → bấm 🔄 Đồng bộ trong Cài đặt khi Google hỏi quyền'
      : ('\n• DS HS đồng bộ từ file chính: ' + kqDB2.tongNguon + ' bé' + (kqDB2.them ? ' (+' + kqDB2.them + ' mới)' : ''));
  } catch (e) {}
  if (loi.length) {
    msg += '\n\n⚠️ ' + loi.length + ' chỗ gặp lỗi (xem Nhật ký thực thi — code vẫn chạy các bước khác):';
    loi.forEach(function (x) { msg += '\n• ' + x; });
  }
  msg += '\n\nBước tiếp: dán danh sách HS vào tab "' + SOTW_SHEET + '" từ ô A3'
    + '\n(Excel: Tên | Lớp | GV — copy rồi paste là vào đủ cột).';
  kiemTraThuTuCot();
  baoVeSheet();
  msg += '\n• Tự kiểm tra/sửa cột BAO_BU\n• Khóa sheet quan trọng (GV chỉ sửa BAO_BU + DS HỌC SINH)';
  baoXong(msg);
}

// ===== TẠO SHEET (1 lần) =====
function setupDayBu() {
  if (!xacNhan('Việc này sẽ XOÁ HẾT dữ liệu 3 tab BAO_BU, LICH_BU, LOP và tạo lại. Tiếp tục?')) return;
  var ss = laySS();

  var sh1 = layHoacTaoSheet(ss, 'BAO_BU');
  sh1.clear();
  sh1.appendRow(['Ngày báo', 'GV báo', 'Lớp', 'Tên bé', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú', 'SOTW']);
  sh1.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#F6F3EE');
  taoDongMau(sh1);

  var sh2 = layHoacTaoSheet(ss, 'LICH_BU');
  sh2.clear();
  sh2.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú']);
  sh2.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#F6F3EE');
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
  datDropdownBaoBu(ss, sh1);
  khoaCotQuanLy();
  try { sh3.hideSheet(); } catch (e) {}
  baoXong('Xong! Đã tạo: BAO_BU (kèm 2 dòng mẫu + cột SOTW), LICH_BU, DS HỌC SINH (tab LOP đã ẩn).');
}

function setupNhe() {
  var ss = laySS();
  var sh1 = layHoacTaoSheet(ss, 'BAO_BU');
  chuyenCotMoiBAOBU(sh1); // sheet cũ → thứ tự cột mới
  if (!sh1.getRange(1, 1).getValue()) {
    sh1.getRange(1, 1, 1, 10).setValues([['Ngày báo', 'GV báo', 'Lớp', 'Tên bé', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú', 'SOTW']]);
    sh1.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#F6F3EE');
  }
  var sh2n = layHoacTaoSheet(ss, 'LICH_BU');
  if (!sh2n.getRange(1, 1).getValue()) {
    sh2n.getRange(1, 1, 1, 13).setValues([['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú']]);
    sh2n.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#F6F3EE');
  }
  datDropdown(sh2n, 9, 200, PH_TRANG_THAI);
  datDropdown(sh2n, 12, 200, DA_DAY);
  layHoacTaoSheet(ss, 'LOP');
  var sotw = taoBangSotw(ss);
  themLinkSotw(sh1, sotw.getSheetId());
  datDropdownBaoBu(ss, sh1);
  khoaCotQuanLy();
  baoXong('Xong bản nhẹ! Không mất dữ liệu cũ.');
}

// ===== QUYỀN SỬA =====
function khoaCotQuanLy() {
  var ss = laySS();
  var sh = ss.getSheetByName('BAO_BU');
  if (!sh) return;
  // Gỡ quyền cũ (trước đây khoá cả Ghi chú → GV không ghi được yêu cầu ôn tập)
  try {
    var olds = sh.getProtections(SpreadsheetApp.ProtectionType.RANGE) || [];
    for (var i = 0; i < olds.length; i++) {
      if ((olds[i].getDescription() || '').indexOf('Chỉ quản lý sửa') >= 0) olds[i].remove();
    }
  } catch (e) {}
  var range = sh.getRange(1, 7, 500, 2); // G Trạng thái + H Ca xếp — ô I Ghi chú GV được sửa
  var prot = range.protect().setDescription('Chỉ quản lý sửa');
  prot.addEditors(EMAIL_QUAN_LY);
  if (prot.canDomainEdit()) prot.setDomainEdit(false);
}

// LỌC DS HỌC SINH THEO GV + LỚP (ý tưởng anh Trương 17/10):
//  • Chọn GV (ô B1) → ẨN dòng không phải GV đó + dropdown "Lớp" chỉ còn lớp của GV
//  • Chọn thêm lớp (ô D1) → ẩn tiếp, chỉ còn bé lớp đó để tick
//  • Xoá ô chọn → hiện lại toàn bộ
//  • Dropdown GV/Lớp lấy TỪ CHÍNH DỮ LIỆU (tên trong file có thể khác list cứng)
//  • Tự chạy lại sau mỗi lần Đồng bộ → dòng mới không bị lẫn
function apLocDS(ds) {
  if (!ds) return;
  var oGv = ds.getRange(1, 2), oLop = ds.getRange(1, 4);
  var vGv = oGv.getValue(), vLop = oLop.getValue();
  var gv = String(vGv === null || vGv === undefined ? '' : vGv).trim();
  var lop = String(vLop === null || vLop === undefined ? '' : vLop).trim();
  var data = ds.getDataRange().getValues();
  var gvSet = {}, gvDS = [], lopSet = {}, lopDS = [], recMap = {};
  for (var r = 2; r < data.length; r++) {
    var ten = String(data[r][0] === undefined || data[r][0] === null ? '' : data[r][0]).trim();
    if (!ten) continue;
    var gvR = String(data[r][2] === undefined || data[r][2] === null ? '' : data[r][2]).trim();
    var lopR = String(data[r][1] === undefined || data[r][1] === null ? '' : data[r][1]).trim();
    recMap[r] = { gv: gvR, lop: lopR };
    if (gvR && !gvSet[gvR]) { gvSet[gvR] = 1; gvDS.push(gvR); }
    if (lopR && !lopSet[lopR]) { lopSet[lopR] = 1; lopDS.push(lopR); }
  }
  // Lớp của GV đã chọn (chưa chọn GV → mọi lớp có trong DS)
  var lopCuaGv = [];
  for (var key in recMap) {
    if (gv && recMap[key].gv === gv && recMap[key].lop && lopCuaGv.indexOf(recMap[key].lop) < 0) {
      lopCuaGv.push(recMap[key].lop);
    }
  }
  // Dropdown GV = tên GV CÓ THẬT trong dữ liệu (rỗng → list gốc)
  var dsGv = gvDS.length ? gvDS : GV_LIST.slice();
  oGv.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(dsGv, true).setAllowInvalid(true).build());
  var dsLop = gv ? (lopCuaGv.length ? lopCuaGv : lopDS) : (lopDS.length ? lopDS : LOP_LIST.slice());
  oLop.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(dsLop, true).setAllowInvalid(true).build());
  // Lớp đang chọn không thuộc GV nữa → tự xoá khỏi khỏi lọc nhầm
  if (lop && dsLop.indexOf(lop) < 0) { oLop.clearContent(); lop = ''; }
  // Hiện hết (1 lệnh) rồi ẩn theo cụm liên tiếp — nhanh, không bao giờ sót dòng cũ
  var maxDong = ds.getMaxRows();
  var soDong = Math.min(1000, maxDong - 2);
  if (soDong > 0) ds.showRows(3, soDong);
  // GV được chọn nhưng file chưa có bé nào của GV đó → bỏ lọc (không để Sheet trống rỗng)
  if (gv && lopCuaGv.length === 0) return;
  var batDau = -1, dem = 0;
  function dongCum(bd, n) { if (n > 0) ds.hideRows(bd, n); }
  for (var i = 2; i < data.length; i++) {
    if (!String(data[i][0] || '').trim()) continue;
    var rec = recMap[i];
    if (!rec) continue;
    var hien = (!gv || rec.gv === gv) && (!lop || rec.lop === lop);
    if (hien) { dongCum(batDau, dem); batDau = -1; dem = 0; continue; }
    var rowSo = i + 1;
    if (dem > 0 && rowSo === batDau + dem) dem++;
    else { dongCum(batDau, dem); batDau = rowSo; dem = 1; }
  }
  dongCum(batDau, dem);
}

// ===== ĐỔI CỘT BAO_BU (yêu cầu 17/10): Lớp ngay sau GV báo =====
// Thứ tự MỚI: A Ngày | B GV báo | C Lớp | D Tên bé | E Trình độ | F Link | G Trạng | H Ca xếp | I Ghi chú
// (chỉ hoán C↔D; G/H/I giữ nguyên số cột → status/caXep/gHi chú không đổi chỗ)
function chuyenCotMoiBAOBU(bao) {
  if (!bao) return false;
  if (String(bao.getRange(1, 3).getValue() || '').trim() !== 'Tên bé') return false; // đã mới
  var last = Math.max(bao.getLastRow(), 1);
  var vals = bao.getRange(1, 3, last, 2).getValues();
  var doi = vals.map(function (r) { return [r[1], r[0]]; });
  bao.getRange(1, 3, last, 2).setValues(doi);
  try { bao.getRange(2, 3, 100, 2).setDataValidation(null); } catch (e) {} // gỡ ô chọn cũ theo cột sai
  return true;
}

// Nguồn cho cascade GV → Lớp → Tên bé: lấy từ tab DS HỌC SINH (đã đồng bộ từ file chính)
function nguonBAOBU(ss) {
  var out = { gvs: [], lops: [], tenAll: [], theoGv: {}, tenTheoLop: {}, theoTen: {} };
  var ds = ss.getSheetByName(SOTW_SHEET);
  if (!ds) return out;
  var data = ds.getDataRange().getValues();
  for (var r = 2; r < data.length; r++) {
    var ten = String(data[r][0] === undefined || data[r][0] === null ? '' : data[r][0]).trim();
    if (!ten) continue;
    var lop = String(data[r][1] === undefined || data[r][1] === null ? '' : data[r][1]).trim();
    var gv = String(data[r][2] === undefined || data[r][2] === null ? '' : data[r][2]).trim();
    if (out.tenAll.indexOf(ten) < 0) out.tenAll.push(ten);
    if (lop && out.lops.indexOf(lop) < 0) out.lops.push(lop);
    if (gv && out.gvs.indexOf(gv) < 0) out.gvs.push(gv);
    if (gv && lop) {
      if (!out.theoGv[gv]) out.theoGv[gv] = [];
      if (out.theoGv[gv].indexOf(lop) < 0) out.theoGv[gv].push(lop);
    }
    // Đảo chiều: chọn TÊN BÉ trước → biết ngay lớp + GV (nhiều lớp trùng tên → giữ list)
    if (!out.theoTen[ten]) out.theoTen[ten] = { lops: [], gv: gv };
    if (lop && out.theoTen[ten].lops.indexOf(lop) < 0) out.theoTen[ten].lops.push(lop);
    if (gv && !out.theoTen[ten].gv) out.theoTen[ten].gv = gv;
    if (lop) {
      if (!out.tenTheoLop[lop]) out.tenTheoLop[lop] = [];
      if (out.tenTheoLop[lop].indexOf(ten) < 0) out.tenTheoLop[lop].push(ten);
    }
  }
  return out;
}

function datList(sh, dong, cot, danhSach) {
  var o = sh.getRange(dong, cot);
  if (!danhSach.length) { try { o.setDataValidation(null); } catch (e) {} return; }
  o.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(danhSach, true).setAllowInvalid(true).build());
}

// Ô chọn BAO_BU (thứ tự mới): B=GV, C=Lớp, D=Tên bé (chọn nhanh từ DS), E=Trình độ
function datDropdownBaoBu(ss, bao) {
  var src = nguonBAOBU(ss);
  datDropdown(bao, 2, 100, GV_LIST);
  datList(bao, 2, 3, src.lops.length ? src.lops : LOP_LIST.slice());
  datList(bao, 2, 4, src.tenAll);
  datDropdown(bao, 5, 100, TRINH_DO);
  if (src.lops.length || src.tenAll.length) {
    // mở rộng dropdown theo data cho cả 100 dòng
    bao.getRange(2, 3, 100, 1).setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(src.lops.length ? src.lops : LOP_LIST, true).setAllowInvalid(true).build());
    if (src.tenAll.length) datDropdown(bao, 4, 100, src.tenAll);
  }
}

// GV đổi ô B (GV) / C (Lớp) / D (Tên bé) ở 1 dòng → cập nhật dropdown cho CHÍNH DÒNG đó.
// cotSua=4: chọn TÊN BÉ trước → tự điền Lớp + (nếu ô GV trống) GV báo + lọc 2 dropdown còn lại
function apCascading(sh, dong, ss, cotSua) {
  try {
    var src = nguonBAOBU(ss || laySS());
    var gv = String(sh.getRange(dong, 2).getValue() || '').trim();
    var lop = String(sh.getRange(dong, 3).getValue() || '').trim();
    var ten = String(sh.getRange(dong, 4).getValue() || '').trim();

    // Đảo chiều: vừa chọn tên bé → tự điền lớp + GV (giữ GV đang có nếu anh đã chọn)
    if (cotSua === 4 && ten && src.theoTen[ten]) {
      var thongTin = src.theoTen[ten];
      if (thongTin.lops.length === 1) {
        sh.getRange(dong, 3).setValue(thongTin.lops[0]);
        lop = thongTin.lops[0];
      }
      if (!gv && thongTin.gv) {
        sh.getRange(dong, 2).setValue(thongTin.gv);
        gv = thongTin.gv;
      }
      datList(sh, dong, 3, thongTin.lops.length ? thongTin.lops : src.lops);
      datList(sh, dong, 4, (lop && src.tenTheoLop[lop]) ? src.tenTheoLop[lop].slice() : src.tenAll);
      return;
    }

    var lopsCuaGv = (gv && src.theoGv[gv]) ? src.theoGv[gv] : [];
    // Cột Lớp: lớp của GV đó (GV chưa có trong DS → mọi lớp)
    datList(sh, dong, 3, lopsCuaGv.length ? lopsCuaGv : src.lops);
    // Cột Tên bé: bé của lớp đang chọn → (chưa chọn) bé các lớp của GV → (chưa chọn GV) mọi bé
    var dsTen;
    if (lop && src.tenTheoLop[lop]) dsTen = src.tenTheoLop[lop].slice();
    else {
      dsTen = [];
      var nguonLop = lopsCuaGv.length ? lopsCuaGv : src.lops;
      nguonLop.forEach(function (l) {
        (src.tenTheoLop[l] || []).forEach(function (t) { if (dsTen.indexOf(t) < 0) dsTen.push(t); });
      });
      if (!nguonLop.length) src.tenAll.forEach(function (t) { if (dsTen.indexOf(t) < 0) dsTen.push(t); });
    }
    datList(sh, dong, 4, dsTen);
  } catch (e) { Logger.log('apCascading lỗi: ' + e); }
}

// Tự điền ngày khi GV gõ (bỏ qua dòng mẫu)
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    var dong = e.range.getRow();
    var cot = e.range.getColumn();
    // DS HỌC SINH: đổi GV (B1) hoặc Lớp (D1) → chạy lại bộ lọc ẩn/hiện dòng
    if (sh.getName() === SOTW_SHEET && dong === 1 && (cot === 2 || cot === 4)) {
      apLocDS(sh);
      return;
    }
    if (sh.getName() !== 'BAO_BU') return;
    // Sheet cũ (chưa nâng cấp) → tự đổi cột sang thứ tự mới ngay khi GV gõ
    chuyenCotMoiBAOBU(sh);
    if (dong < 2) return;
    // Chọn nhanh: GV (B) → dropdown Lớp; Lớp (C) → dropdown Tên bé;
    // Tên bé (D) → tự điền Lớp + GV (đảo chiều)
    if (cot === 2 || cot === 3 || cot === 4) apCascading(sh, dong, undefined, cot);
    // GV nhập liệu (B..F) hoặc ghi Ghi chú (I) → tự ghi ngày báo
    if (!((cot >= 2 && cot <= 6) || cot === 9)) return;
    var ghiChu = (sh.getRange(dong, 9).getValue() || '').toString();
    if (ghiChu.indexOf(DAU_MAU) >= 0) return;
    var oNgay = sh.getRange(dong, 1);
    if (!oNgay.getValue()) oNgay.setValue(new Date());
  } catch (err) { Logger.log('onEdit lỗi: ' + err); }
}

function laySheetBaoBu(ss) {
  return ss.getSheetByName('BAO_BU');
}

// ===== 📖 HƯỚNG DẪN CÁC LỆNH (popup trong menu Cài đặt) =====
function huongDanCacLenh() {
  var txt = '📖 MỖI TUẦN BẤM THEO THỨ TỰ NÀY:\n'
    + '1️⃣ Gom nhóm + gửi SOTW (T2 chiều) — bấm lại bao nhiêu lần cũng được, không mất\n'
    + '2️⃣ Xử lý Xin đổi / Quá hạn (T4) — bé PH chưa xác nhận / xin đổi\n'
    + '3️⃣ Gửi tin cho GV (T5-T6) — chỉ gửi ca PH đã chốt ✅\n'
    + '4️⃣ Làm mới tuần mới (T7-CN) — tự backup trước khi xoá\n\n'
    + '⚙️ CÀI ĐẶT — lệnh nào dùng khi nào:\n'
    + '🔧 Nâng cấp sheet SOTW: chạy 1 lần sau khi em gửi code mới. An toàn — không mất data\n'
    + '🔍 Kiểm tra / sửa cột BAO_BU: bấm khi nghi ngờ cột Lớp/Tên bé bị ngược (tự dò + tự sửa)\n'
    + '🔄 Đồng bộ DS HS: bấm khi có HS mới vào / nghỉ (hoặc trước khi Gom nhóm)\n'
    + '🖼️ Gắn link ảnh: bấm sau khi thêm ảnh vào folder (cần dán link folder vào ô H1 DS HỌC SINH)\n'
    + '🗜️ Ẩn / hiện tab LOP: xem bảng lớp cũ\n'
    + '⚠️ LƯU Ý:\n• Menu này CHỈ DÀNH CHO QUẢN LÝ — GV không cần vào đây\n• 🔨 Tạo sheet mới = RESET TOÀN BỘ (xoá hết data) — chỉ dùng lần đầu setup\n\n'
    + '📊 THỐNG KÊ (menu Báo cáo): cần tab "Backup tháng …" đã có data\n'
    + '(tự tạo khi backup / Làm mới tuần mới). Xem số ca, số giờ của từng GV.';
  try { SpreadsheetApp.getUi().alert('JOY DẠY BÙ — hướng dẫn', txt, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { Logger.log(txt); }
}

// ===== 🔍 KIỂM TRA / SỬA THỨ TỰ CỘT BAO_BU =====
// Dò TỪNG DÒNG: cột C chứa lớp + cột D chứa tên → đúng; ngược lại → tự hoán dòng đó.
// Sheet mới (header đã đúng) mà sót vài dòng bị ngược vẫn được sửa — anh khỏi sửa tay.
var LOP_RE = /^[A-Za-z]{1,3}\d+\./; // S1.001 - Peach, C2.002 - Chestnut...
function kiemTraThuTuCot() {
  var ss = laySS();
  var bao = ss.getSheetByName('BAO_BU');
  if (!bao) { baoXong('Chưa có tab BAO_BU.'); return; }
  var src = nguonBAOBU(ss);
  var lopSet = {}, tenSet = {};
  src.lops.forEach(function (l) { lopSet[String(l).trim().toLowerCase()] = 1; });
  src.tenAll.forEach(function (t) { tenSet[String(t).trim().toLowerCase()] = 1; });
  function laLop(s) { s = String(s || '').trim(); return !!s && (lopSet[s.toLowerCase()] === 1 || LOP_RE.test(s)); }
  function laTen(s) { s = String(s || '').trim(); return !!s && !laLop(s); }

  // 1) Header cũ (C1 = 'Tên bé') → hoán cả sheet trước
  var daHoanHeader = chuyenCotMoiBAOBU(bao);

  var data = bao.getDataRange().getValues();
  var demDung = 0, demSua = 0, demLo = [];
  for (var i = 1; i < data.length; i++) {
    var c = String(data[i][2] === undefined ? '' : data[i][2]).trim();
    var d = String(data[i][3] === undefined ? '' : data[i][3]).trim();
    if (!c && !d) continue; // dòng trống
    if (laLop(c) && (laTen(d) || d === '')) { demDung++; continue; }
    if (laLop(d) && (laTen(c) || c === '')) {
      // dòng bị ngược → hoán lại đúng C=Lớp, D=Tên
      bao.getRange(i + 1, 3, 1, 2).setValues([[d, c]]);
      demSua++;
      continue;
    }
    demLo.push('dòng ' + (i + 1) + ' (' + (c || 'trống') + ' / ' + (d || 'trống') + ')');
  }

  baoXong('🔍 Kiểm tra thứ tự cột BAO_BU (C = Lớp, D = Tên bé):\n'
    + (daHoanHeader ? '• Header cũ → đã hoán cả sheet\n' : '• Header đúng thứ tự mới\n')
    + '• ' + demDung + ' dòng đúng\n'
    + (demSua > 0 ? '• ' + demSua + ' dòng bị ngược → ĐÃ TỰ SỬA\n' : '• Không dòng nào bị ngược\n')
    + (demLo.length ? '⚠️ ' + demLo.length + ' dòng không chắc, anh xem tay: '
      + demLo.slice(0, 5).join('; ') + (demLo.length > 5 ? ' …' : '')
      : '• Không dòng nào lẫn lộn'));
}

// ===== TIM DÒNG BÉ TRONG BAO_BU =====
function timDongBaoBu(bao, ten, lop) {
  try { chuyenCotMoiBAOBU(bao); } catch (e) {} // sheet cũ → đổi cột trước khi đọc
  var data = bao.getDataRange().getValues();
  var dauTien = -1;
  for (var i = 1; i < data.length; i++) {
    if ((data[i][8] || '').toString().indexOf(DAU_MAU) >= 0) continue;
    if ((data[i][3] || '').toString().trim().toLowerCase() !== ten.toLowerCase()) continue;
    if (lop && (data[i][2] || '').toString().trim() !== lop) continue;
    var st = (data[i][6] || '').toString();
    if (st === 'Đã xếp') return i + 1;
    if (dauTien < 0) dauTien = i + 1;
  }
  return dauTien;
}

// ===== GOM NHÓM + SOTW (1 nút chạy gộp) =====
// ===== ĐỒNG BỘ DS HỌC SINH TỪ FILE CHÍNH =====
// NGUYÊN TẮC BẤT DI BẤT DỌNG (yêu cầu anh Trương): CHỈ getValues() —
// KHÔNG BAO GIỜ ghi / sửa / xoá bất cứ ô nào trong file chính.

// Bỏ dấu tiếng Việt + chuẩn hoá để so tên/lớp không lỗi chính tả
function boDau(s) {
  return (s === null || s === undefined ? '' : String(s)).toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ').trim();
}

// Tìm dòng tiêu đề trong 30 dòng đầu. Header nhận diện được:
//   cột Tên: chứa "ten"/"name" (vd "Full name", "Họ và tên"), cột Lớp: chứa "lop"/"class"
// Trả {tim:true, dong, cTen, cLop, cGv} hoặc {tim:false, thieu:'thiếu...'}
function timTieuDe(data) {
  var coTen = false, coLop = false;
  for (var d = 0; d < data.length && d < 30; d++) {
    var t = -1, l = -1, g = -1;
    for (var c = 0; c < data[d].length; c++) {
      var h = boDau(data[d][c]);
      if (t < 0 && ((h.indexOf('ten') >= 0 && h.indexOf('tinh') < 0) || h.indexOf('name') >= 0)) t = c;
      if (l < 0 && (h.indexOf('lop') >= 0 || h.indexOf('class') >= 0)) l = c;
      if (g < 0 && (h === 'gv' || h.indexOf('giao vien') >= 0 || h.indexOf('teacher') >= 0 ||
        h.indexOf('gv chinh') >= 0 || h.indexOf('gvchinh') >= 0)) g = c;
    }
    if (t >= 0) coTen = true;
    if (l >= 0) coLop = true;
    if (t >= 0 && l >= 0) return { tim: true, dong: d, cTen: t, cLop: l, cGv: g };
  }
  return {
    tim: false,
    thieu: coTen ? 'thiếu cột chứa chữ "Lớp"' : (coLop ? 'thiếu cột chứa chữ "Full name"/"Tên"' : 'không thấy dòng tiêu đề nào')
  };
}

// Đọc file chính → mảng {ten, lop, gv}. CHỈ getValues.
// Thử tab theo link (gid) trước → không thấy tiêu đề thì thử TỪNG tab còn lại (fallback);
// quét 30 dòng đầu mỗi tab; lỗi cuối nêu rõ tên tab + cột nào đang thiếu.
function docFileChinh() {
  var f = SpreadsheetApp.openById(FCHINH_ID); // CHỈ ĐỌC
  var sheets = f.getSheets();
  if (!sheets || !sheets.length) throw new Error('file chính không có tab nào');
  var thu = [], tenTab = [];
  for (var i = 0; i < sheets.length; i++) {
    if (String(sheets[i].getSheetId()) === String(FCHINH_GID)) thu.unshift(sheets[i]);
    else thu.push(sheets[i]);
  }
  var thieuCuoi = null;
  for (var k = 0; k < thu.length; k++) {
    var tab = thu[k];
    tenTab.push('"' + tab.getName() + '"');
    var data = tab.getDataRange().getValues();
    var td = timTieuDe(data);
    if (td.tim) {
      var rows = [];
      var bo = { 'ten': 1, 'ho ten': 1, 'ho va ten': 1, 'stt': 1 };
      for (var r = td.dong + 1; r < data.length; r++) {
        var ten = String(data[r][td.cTen] === undefined || data[r][td.cTen] === null ? '' : data[r][td.cTen]).trim();
        if (!ten || bo[boDau(ten)]) continue;
        rows.push({
          ten: ten,
          lop: String(data[r][td.cLop] === undefined || data[r][td.cLop] === null ? '' : data[r][td.cLop]).trim(),
          gv: td.cGv >= 0 ? String(data[r][td.cGv] === undefined || data[r][td.cGv] === null ? '' : data[r][td.cGv]).trim() : ''
        });
      }
      return rows;
    }
    thieuCuoi = td.thieu;
  }
  throw new Error('Đã thử ' + thu.length + ' tab (' + tenTab.join(', ') + ') nhưng ' + (thieuCuoi || 'không thấy tiêu đề')
    + '. Header cần cột kiểu "Full name"/"Tên" + "Lớp" — anh đối chiếu giúp em rồi chạy lại.');
}

// Đồng bộ vào DS HỌC SINH:
//  • A:B:C (Tên/Lớp/GV chính) ← lấy từ file chính
//  • D:E:F (Giới tính/Link ảnh/Tick SOTW) ← GIỮ NGUYÊN theo tên bé, không bao giờ mất
//  • Bé có trong DS nhưng KHÔNG có trong file chính → GIỮ LẠI cuối bảng + báo anh quyết
function dongBoDSHocSinh(ss) {
  var ds = ss.getSheetByName(SOTW_SHEET);
  if (!ds) ds = taoBangSotw(ss);
  var nguon = docFileChinh(); // ← CHỈ ĐỌC file chính
  var cu = ds.getDataRange().getValues();
  var dongCu = [];
  for (var r = 2; r < cu.length; r++) {
    var ten = String(cu[r][0] === undefined ? '' : cu[r][0]).trim();
    if (!ten) continue;
    dongCu.push({
      ten: ten,
      lop: String(cu[r][1] === undefined ? '' : cu[r][1]).trim(),
      gv: String(cu[r][2] === undefined ? '' : cu[r][2]).trim(),
      gt: cu[r][3], link: cu[r][4], tick: cu[r][5]
    });
  }
  var daDung = {}, out = [], them = 0, gvLa = {};
  nguon.forEach(function (x) {
    var chon = -1;
    for (var i = 0; i < dongCu.length && chon < 0; i++) { // Ưu tiên khớp TÊN + LỚP
      if (daDung[i]) continue;
      if (boDau(dongCu[i].ten) === boDau(x.ten) && boDau(dongCu[i].lop) === boDau(x.lop)) chon = i;
    }
    for (var j = 0; j < dongCu.length && chon < 0; j++) { // Bấm tên (bé đổi lớp)
      if (daDung[j]) continue;
      if (boDau(dongCu[j].ten) === boDau(x.ten)) chon = j;
    }
    if (chon >= 0) {
      daDung[chon] = 1;
      var c = dongCu[chon];
      out.push([x.ten, x.lop, x.gv || c.gv || (LOP_GV_MAP[x.lop] || ''), c.gt, c.link, c.tick]);
    } else {
      them++;
      out.push([x.ten, x.lop, x.gv || (LOP_GV_MAP[x.lop] || ''), '', '', '']);
    }
    if (x.gv && GV_LIST.indexOf(x.gv) < 0) gvLa[x.gv] = 1;
  });
  var giu = [], giuTen = [];
  for (var k = 0; k < dongCu.length; k++) {
    if (daDung[k]) continue;
    var c2 = dongCu[k];
    giu.push([c2.ten, c2.lop, c2.gv, c2.gt, c2.link, c2.tick]);
    giuTen.push(c2.ten);
  }
  var ca = out.concat(giu);
  var soDong = Math.max(cu.length - 2, ca.length, 1);
  ds.getRange(3, 1, soDong, 6).clearContent();
  if (ca.length) ds.getRange(3, 1, ca.length, 6).setValues(ca);
  apLocDS(ds); // chạy lại bộ lọc → dòng mới không lẫn khi GV đang lọc
  return { them: them, tongNguon: nguon.length, giuTen: giuTen, gvLa: Object.keys(gvLa) };
}

// Bọc an toàn: thiếu quyền / file đổi cấu trúc → {loi}, không ném lỗi làm dừng lệnh chính
function dongBoAnToan(ss) {
  try {
    return dongBoDSHocSinh(ss);
  } catch (e) {
    Logger.log('Đồng bộ DS lỗi: ' + e);
    return { loi: String(e) };
  }
}

// Nút menu 🔄 Đồng bộ DS học sinh
function menuDongBoDS() {
  var kq = dongBoAnToan(laySS());
  if (kq.loi) {
    baoXong('⚠️ Chưa đọc được file chính:\n' + kq.loi
      + '\n\nCÁCH LÀM:\n1. Bấm nút này lần nữa — Google sẽ hiện trang xin quyền đọc\n'
      + '\n2. Nếu hiện trang cảnh báo "Google chưa xác minh": bấm Advanced → Go to ... → Allow (Cho phép)\n'
      + '3. Xong là DS HỌC SINH tự lấy danh sách — file gốc KHÔNG bị thay đổi gì');
    return;
  }
  var msg = '✅ Đồng bộ DS HỌC SINH từ file chính:\n• File có ' + kq.tongNguon + ' bé'
    + (kq.them ? '\n• Thêm mới ' + kq.them + ' bé' : '\n• Không có bé mới')
    + '\n• Link ảnh / tick SOTW / giới tính của bé cũ GIỮ NGUYÊN';
  if (kq.giuTen.length) {
    msg += '\n⚠️ ' + kq.giuTen.length + ' bé có trong DS nhưng KHÔNG có trong file chính → GIỮ LẠI: '
      + kq.giuTen.slice(0, 6).join(', ') + (kq.giuTen.length > 6 ? ' …' : '')
      + '\n(Nếu bé thật sự nghỉ học, anh xoá dòng tay giúp em)';
  }
  if (kq.gvLa.length) msg += '\n⚠️ Cột GV trong file chính có tên lạ: ' + kq.gvLa.join(', ');
  baoXong(msg);
  kiemTraThuTuCot();
}

// ===== 🖼️ GẮN LINK ẢNH TỪ FOLDER DRIVE (khớp theo TÊN FILE) =====
// Anh tạo folder ảnh → share "Bất kỳ ai có link" → dán link folder vào Ô H1 tab DS HỌC SINH
// → bấm nút này: file 'Ho Ten.jpg' khớp bé 'Ho Ten' → điền cột Link ảnh tự động
function ganLinkAnhTuFolder() {
  var ss = laySS();
  var ds = ss.getSheetByName(SOTW_SHEET);
  if (!ds) ds = taoBangSotw(ss);
  if (!ds.getRange(1, 7).getValue()) {
    ds.getRange(1, 7).setValue('Folder ảnh:').setFontWeight('bold').setBackground('#F6F3EE');
  }
  var link = String(ds.getRange(1, 8).getValue() === null ? '' : ds.getRange(1, 8).getValue()).trim();
  if (!link) {
    baoXong('Chưa có link folder. Anh làm 3 bước:\n1. Tạo folder trong Drive, đặt tên "ẢNH HỌC SINH SOTW", thả ảnh vào (tên file = tên bé)\n2. Chuột phải folder → Chia sẻ → "Bất kỳ ai có đường liên kết" → Người xem\n3. Copy link folder → dán vào Ô H1 tab DS HỌC SINH → bấm lại nút này');
    return;
  }
  var m = link.match(/\/folders\/([-\w]{10,})/) || link.match(/[-\w]{25,}/);
  if (!m) {
    baoXong('Link chưa đúng dạng folder. Cần dạng: https://drive.google.com/drive/folders/xxxx (anh kiểm tra lại ô H1)');
    return;
  }
  var anh = {};
  try {
    var files = DriveApp.getFolderById(m[1]).getFiles();
    while (files.hasNext()) {
      var f = files.next();
      var tenFile = boDau(String(f.getName() || '').replace(/\.[^.]+$/, ''));
      if (tenFile) anh[tenFile] = f.getUrl();
    }
  } catch (e) {
    baoXong('Không đọc được folder: ' + e + '\n\nKiểm tra: (1) link H1 đúng, (2) folder đã share "Bất kỳ ai có link", (3) Google hỏi quyền Drive thì bấm Advanced → Allow.');
    return;
  }
  var data = ds.getDataRange().getValues();
  var dem = 0, thieu = [];
  for (var r = 2; r < data.length; r++) {
    var tenBe = String(data[r][0] === undefined || data[r][0] === null ? '' : data[r][0]).trim();
    if (!tenBe) continue;
    var url = anh[boDau(tenBe)];
    if (url) {
      if (String(data[r][4] === undefined || data[r][4] === null ? '' : data[r][4]).trim() !== url) {
        ds.getRange(r + 1, 5).setValue(url);
        dem++;
      }
    } else {
      thieu.push(tenBe);
    }
  }
  var msgXong = '🖼️ Đã gắn ' + dem + ' link ảnh mới (folder có ' + Object.keys(anh).length + ' file)';
  if (thieu.length) {
    msgXong += '\n⚠️ Chưa khớp file ảnh (' + thieu.length + '): ' + thieu.slice(0, 8).join(', ')
      + (thieu.length > 8 ? ' …' : '') + '\n(Đổi tên file ảnh = tên bé trong DS là khớp nha)';
  }
  baoXong(msgXong);
}

function gomNhom() {
  var ss = laySS();
  try { chuyenCotMoiBAOBU(ss.getSheetByName('BAO_BU')); } catch (e) {}
  // Tự đồng bộ DS HỌC SINH từ file chính (chỉ đọc) — thiếu quyền thì vẫn chạy tiếp, báo ở cuối
  var dongBoNote = '';
  try {
    var kqDB = dongBoAnToan(ss);
    if (kqDB.loi) dongBoNote = '\n\n⚠️ DS HS chưa đọc được file chính — bấm 🔄 Đồng bộ trong Cài đặt để Google hỏi quyền → Cho phép.';
    else dongBoNote = '\n\n🔄 DS HS: ' + kqDB.tongNguon + ' bé từ file chính'
      + (kqDB.them ? ', +' + kqDB.them + ' bé mới' : '')
      + (kqDB.giuTen.length ? ', ' + kqDB.giuTen.length + ' bé thiếu trong file → giữ lại' : '');
  } catch (e) {}
  var bao = laySheetBaoBu(ss);
  var lich = ss.getSheetByName('LICH_BU');
  if (!bao || !lich) {
    baoXong('Chưa có sheet. Bấm menu "🔧 Nâng cấp sheet SOTW" (hoặc "Tạo sheet") trước.');
    return;
  }
  var msgXep = xepLichChinh(ss, bao, lich);
  var rs = guiSOTW(false);
  baoXong(msgXep + (rs.skip ? '\n\nℹ️ SOTW: ' + rs.msg : '\n\n🏆 SOTW: ' + rs.msg) + dongBoNote);
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
    var tenBe = (r[3] || '').toString().trim().toLowerCase(); // thứ tự mới: C=Lớp, D=Tên bé
    if (!tenBe) continue;
    if ((r[8] || '').toString().indexOf(DAU_MAU) >= 0) continue;
    if (tenBe.indexOf('ghi chú mẫu') >= 0 || tenBe.indexOf('không bù') === 0) continue;
    if (trangThai === '' || trangThai === 'Chờ') {
      chuaXep.push({ dong: i + 1, gvBao: r[1], tenBe: r[3], lop: r[2], trinhDo: r[4], link: r[5], ghiChu: r[8] });
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
  var ghiChu = (be.ghiChu || '').toString().trim();
  var tinGV = '📚 [' + ca.thu + ' ' + ca.gio + '] ' + ca.gv + ' dạy bù: bé ' + be.tenBe
    + ' (' + be.lop + ' - ' + be.trinhDo + '). Slide: ' + (be.link || '(chưa có link)')
    + (ghiChu ? '\n📌 Ghi chú: ' + ghiChu : '');
  lich.appendRow([ca.ma, ca.thu, ca.gio, ca.gv, be.tenBe, be.lop, be.trinhDo, be.link, 'Chờ Ms. Vân Anh', tinPH, tinGV, '', ghiChu]);
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
  while (header.length < 12) header.push(header.length === 11 ? 'Đã dạy' : '');
  if (header.length === 12) header.push('Ghi chú'); // bản cũ 12 cột → thêm cột Ghi chú
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
  lich.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#F6F3EE');
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
      bao.getRange(dongMoi, 1, 1, 9).setValues([[new Date(), '', be.lop, be.tenBe, be.trinhDo, be.link, '', '', ghiChu]]); // thứ tự mới: Lớp trước, Tên sau
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
    theoCa[ma].bes.push({ ten: data[i][4], lop: data[i][5], td: data[i][6], link: data[i][7], ghiChu: data[i][12] });
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
    // Ghi chú GỘP: bé nào ghi giống nhau (cùng lớp / cùng yêu cầu) → 1 dòng chung
    var noteMap = {}, noteThuTu = [];
    c.bes.forEach(function (b) {
      var n = (b.ghiChu || '').toString().trim();
      if (!n) return;
      if (!noteMap[n]) { noteMap[n] = []; noteThuTu.push(n); }
      if (b.lop && noteMap[n].indexOf(b.lop) < 0) noteMap[n].push(b.lop);
    });
    noteThuTu.forEach(function (n) {
      tin += '📌 Ghi chú' + (noteMap[n].length ? ' (' + noteMap[n].join(', ') + ')' : '') + ': ' + n + '\n';
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
  try { chuyenCotMoiBAOBU(bao); } catch (e) {}
  var data = bao.getDataRange().getValues();
  var daBao = {};
  for (var i = 1; i < data.length; i++) {
    var gv = (data[i][1] || '').toString().trim();
    var tenBe = (data[i][3] || '').toString().trim().toLowerCase();
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
  try { chuyenCotMoiBAOBU(ss.getSheetByName('BAO_BU')); } catch (e) {} // sheet cũ → đổi cột trước
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
        new Date(), '', lopP, tenP, (dataLich[p][6] || ''), (dataLich[p][7] || ''), '', '', ghiChuP
      ]]);
    }
    demChuyen++;
  }

  // 3. Lấy bé CHƯA XẾP (Ca xếp trống), bỏ dòng mẫu
  var dataBao = bao.getDataRange().getValues();
  var batDau = 2;
  while (batDau - 1 < dataBao.length) {
    var g = (dataBao[batDau - 1][8] || '').toString();
    var tenMau = ((dataBao[batDau - 1][2] || '') + ' ' + (dataBao[batDau - 1][3] || '')).toLowerCase();
    if (g.indexOf(DAU_MAU) >= 0 || tenMau.indexOf('ghi chú mẫu') >= 0) batDau++;
    else break;
  }

  var giuLai = [];
  for (var i = batDau - 1; i < dataBao.length; i++) {
    var r = dataBao[i];
    if (!r[3]) continue; // cột D = Tên bé (thứ tự mới)
    var caXep = (r[7] || '').toString().trim();
    if (caXep === '') {
      giuLai.push([r[0] || new Date(), r[1], r[2], r[3], r[4], r[5], '', '', r[8] || '']);
    }
  }

  // 4. Clear LICH_BU (giữ tiêu đề)
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú']);
  lich.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#F6F3EE');
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

  var backup = ss.getSheetByName(tenBackup);
  if (!backup) {
    baoXong('Chưa có sheet "' + tenBackup + '" (tháng này chưa backup lần nào).\n'
      + 'Cách tạo: bấm 🔁 Gửi/Nhắc lẻ → 💾 Backup thủ công, hoặc bấm 4️⃣ Làm mới tuần mới (tự backup trước).');
    return;
  }

  var tk = ss.getSheetByName('THỐNG KÊ');
  if (!tk) tk = ss.insertSheet('THỐNG KÊ');
  tk.clear();

  var b = '\'' + tenBackup + '\'';
  var sep = ngachCongThuc(); // ';' với file vi_VN — gõ ',' → #ERROR!
  tk.getRange(1, 1).setValue('THỐNG KÊ DẠY BÙ THÁNG ' + thang).setFontSize(14).setFontWeight('bold');
  tk.getRange(3, 1, 1, 3).setValues([['GV dạy', 'Số ca dạy', 'Tổng giờ']]).setFontWeight('bold').setBackground('#F6F3EE');

  // Danh sách GV lấy TỪ DATA backup thật (cộng GV_LIST cho chắc) — có GV mới là tự có dòng
  var gvSet = {};
  GV_LIST.forEach(function (gv) { gvSet[gv] = 1; });
  var dataBk = backup.getDataRange().getValues();
  for (var iB = 1; iB < dataBk.length; iB++) {
    var gvB = String(dataBk[iB][4] === undefined || dataBk[iB][4] === null ? '' : dataBk[iB][4]).trim();
    if (gvB) gvSet[gvB] = 1;
  }
  var dsGV = Object.keys(gvSet);

  var dongBatDau = 4;
  var dongCuoi = dongBatDau + dsGV.length - 1;
  dsGV.forEach(function (gv, idx) {
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

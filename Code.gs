/****************************************************
 * JOY DẠY BÙ — Code.gs
 * Chạy trong Google Apps Script (gắn với Google Sheet DẠY BÙ)
 * Cách dùng: copy toàn bộ file này vào Apps Script → chạy setupDayBu() 1 lần
 ****************************************************/

// ===== CẤU HÌNH — bạn chỉ cần sửa chỗ này =====
var CFG = {
  GROUP_ID: '-1004378772858', // nhóm Học Bù
  TOPIC_ID: 2,                // topic Học Bù
  HAN_TRA_LOI: '12h trưa Thứ 4', // quá hạn không trả lời = đẩy tuần sau
  TOI_DA_CA: 4,               // mỗi ca tối đa 4 bé
  TOI_DA_TRINH_DO: 2,         // mỗi ca tối đa 2 trình độ chung
  HONG_ANH_DEN_HT: '2026-10-31', // Ms. Hồng Anh làm hết tháng 10
};

// ID file Sheet DẠY BÙ (để chạy được cả khi script đứng riêng)
var SHEET_ID = '1O_RUUL9P4YggLI2Vp1AcFraZuUHcF8CXULtZ9jPZGsg';

function laySS() {
  var ss = null;
  try { ss = laySS(); } catch (e) {}
  if (!ss) ss = SpreadsheetApp.openById(SHEET_ID);
  return ss;
}

function baoXong(msg) {
  try { baoXong(msg); } catch (e) { Logger.log(msg); }
}

var TRINH_DO = ['Kids', 'SP0', 'SP1', 'SP2', 'SP3', 'SP4'];

var GV_LIST = ['Mr. Đức Anh', 'Mr. Ngọc', 'Ms. Hồng Anh', 'Ms. Nhung', 'Ms. Trâm', 'Ms. Uyên Vi', 'Ms. Vân'];
var PH_TRANG_THAI = ['Chờ Vân Anh', '✅ Đi được', '🔄 Xin đổi', '❌ Nghỉ', 'Tuần sau (quá hạn)'];
var DA_DAY = ['✅ Đã học', '❌ Vắng (không tới)'];

// Ai được sửa 3 cột cuối (Trạng thái, Ca xếp, Ghi chú)
var EMAIL_QUAN_LY = ['tuanngoctruong2710@gmail.com', 'nguyenthiuyenvi@gmail.com', 'vananhhthuy@gmail.com'];

// 25 lớp thật (đã bỏ 7 dòng Kem/Ketoan/G1.001)
var LOP_LIST = [
  // Mr. Đức Anh — bé nhỏ
  'S1.006 - Lychee', 'S2.004 - Cherry', 'C2.004 - Kiwi', 'T1.001 - Apple', 'W2.001 - Cookie',
  // Ms. Vân
  'S1.005 - Peach', 'S2.003 - Peanut', 'C2.002 - Chestnut', 'W1.002 - Ice-cream', 'T2.004 - Pea',
  // Ms. Hồng Anh
  'S1.004 - Watermelon', 'S2.002 - Blueberry', 'C2.003 - Tomato', 'T2.002 - Carrot',
  // Mr. Ngọc
  'S1.001 - Cashew', 'S2.001 - Pumpkin Seed', 'C2.005 - Pineapple', 'W1.003 - Tiramisu',
  // Ms. Trâm
  'S1.003 - Hazelnut', 'S2.005 - Acorn', 'C2.006 - Broccoli', 'T2.003 - Potato',
  // Ms. Uyên Vi
  'S1.002 - Almond', 'C2.001 - Strawberry',
  // Ms. Nhung
  'S2.006 - Avocado'
];

// Lớp của Đức Anh → ưu tiên xếp ca Đức Anh
var LOP_DUC_ANH = ['S1.006 - Lychee', 'S2.004 - Cherry', 'C2.004 - Kiwi', 'T1.001 - Apple', 'W2.001 - Cookie'];

// 4 ca cố định mỗi tuần
function layDanhSachCa() {
  var hongAnhCon = hongAnhConLam();
  var gvVan = 'Ms. Vân'; // Ưu tiên Vân, Hồng Anh dự phòng
  var gvHongAnh = 'Ms. Hồng Anh';
  return [
    { ma: 'T5-1', thu: 'Thứ 5', gio: '17h00 - 18h30', gv: hongAnhCon ? gvVan : gvVan },
    { ma: 'T6-1', thu: 'Thứ 6', gio: '15h00 - 16h30', gv: hongAnhCon ? gvVan : gvVan },
    { ma: 'T6-2', thu: 'Thứ 6', gio: '17h00 - 18h30', gv: hongAnhCon ? gvVan : gvVan },
    { ma: 'T6-3', thu: 'Thứ 6', gio: '18h00 - 19h30', gv: 'Mr. Đức Anh' },
  ];
}

// Tính ngày gần nhất cho Thứ X (Thứ 5 = 4, Thứ 6 = 5)
function layNgayThu(thu) {
  var homNay = new Date();
  var thuHienTai = homNay.getDay(); // 0=CN, 1=T2...6=T7
  var thuMuon = thu === 'Thứ 5' ? 4 : (thu === 'Thứ 6' ? 5 : 4);
  var ngayCach = thuMuon - thuHienTai;
  if (ngayCach <= 0) ngayCach += 7; // tuần sau
  var ngayHoc = new Date(homNay);
  ngayHoc.setDate(homNay.getDate() + ngayCach);
  return Utilities.formatDate(ngayHoc, 'GMT+7', 'dd/MM/yyyy');
}

function hongAnhConLam() {
  var homNay = new Date();
  var han = new Date(CFG.HONG_ANH_DEN_HT + 'T23:59:59');
  return homNay <= han;
}

// ===== MENU =====
function onOpen() {
  try {
  SpreadsheetApp.getUi()
    .createMenu('📚 Dạy Bù')
    .addItem('1️⃣ Tạo sheet (chạy 1 lần)', 'setupDayBu')
    .addItem('2️⃣ Gom nhóm (bấm chiều T2)', 'gomNhom')
    .addItem('3️⃣ Gửi tin cho GV (ca đã chốt ✅)', 'guiTinChoGV')
    .addItem('4️⃣ Đẩy quá hạn sang tuần sau', 'dayQuaHanSangTuanSau')
    .addItem('5️⃣ Nhắc GV báo bù (sáng T2)', 'nhacGVBaoBu')
    .addItem('6️⃣ Backup T7 + Refresh tuần mới', 'backupVaRefreshTuanMoi')
    .addToUi();
  } catch (e) {} 
}

// ===== TẠO SHEET =====
function setupDayBu() {
  var ss = laySS();

  // Tab 1: BÁO BÙ (GV gõ thẳng vào đây, mỗi bé 1 dòng)
  var sh1 = layHoacTaoSheet(ss, 'BAO_BU');
  sh1.clear();
  sh1.appendRow(['Ngày báo', 'GV báo', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú']);
  sh1.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#F6F3EE');
  // Dòng mẫu ghi chú cho GV: lớp đi đủ thì gõ "Không bù"
  sh1.appendRow(['', '', '(ghi chú mẫu: nếu lớp không ai nghỉ, GV gõ "Không bù" ở đây)', '', '', '', '', '', '']);
  sh1.getRange(2, 3).setFontStyle('italic').setFontColor('#888888');
  // Chọn sẵn: GV báo (cột B), Lớp (cột D), Trình độ (cột E) — bấm chọn, khỏi gõ chữ
  datDropdown(sh1, 2, 100, GV_LIST);
  datDropdown(sh1, 4, 100, LOP_LIST);
  datDropdown(sh1, 5, 100, TRINH_DO);

  // Tab 2: LỊCH BÙ (sau khi gom nhóm)
  var sh2 = layHoacTaoSheet(ss, 'LICH_BU');
  sh2.clear();
  sh2.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  sh2.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  // Ô tick chọn sẵn: PH xác nhận (cột I), Đã dạy (cột L)
  datDropdown(sh2, 9, 200, PH_TRANG_THAI);
  datDropdown(sh2, 12, 200, DA_DAY);

  // Tab 3: DANH SÁCH LỚP (để coi)
  var sh3 = layHoacTaoSheet(ss, 'LOP');
  sh3.clear();
  sh3.appendRow(['Lớp', 'GV chính']);
  var gvMap = {
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
  LOP_LIST.forEach(function (lop) {
    sh3.appendRow([lop, gvMap[lop] || '']);
  });

  baoXong('Xong! Đã tạo 3 tab: BAO_BU, LICH_BU, LOP.');
}

// Bản nhẹ — chạy khi Sheet đã có dữ liệu, KHÔNG xoá gì, chỉ gắn ô chọn + thiếu tab nào tạo tab đó
function setupNhe() {
  var ss = laySS();
  var sh1 = layHoacTaoSheet(ss, 'BAO_BU');
  // Chỉ ghi hàng tiêu đề nếu dòng 1 còn trống
  if (!sh1.getRange(1, 1).getValue()) {
    sh1.getRange(1, 1, 1, 9).setValues([['Ngày báo', 'GV báo', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú']]);
    sh1.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#F6F3EE');
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
  baoXong('Xong bản nhẹ! Không mất dữ liệu cũ.');
}

function layHoacTaoSheet(ss, ten) {
  var sh = ss.getSheetByName(ten);
  if (!sh) sh = ss.insertSheet(ten);
  return sh;
}

// Tạo ô chọn sẵn (dropdown) cho 1 cột — GV bấm chọn, khỏi gõ chữ
function datDropdown(sh, cot, toiDong, danhSach) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(danhSach, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(2, cot, toiDong - 1, 1).setDataValidation(rule);
}

// Khóa 3 cột cuối (Trạng thái, Ca xếp, Ghi chú) — chỉ bạn + Vân Anh + Uyên Vi sửa được
function khoaCotQuanLy() {
  var ss = laySS();
  var sh = ss.getSheetByName('BAO_BU');
  if (!sh) return;
  var range = sh.getRange(1, 7, 500, 3);
  var prot = range.protect().setDescription('Chỉ quản lý sửa');
  prot.addEditors(EMAIL_QUAN_LY);
  if (prot.canDomainEdit()) prot.setDomainEdit(false);
}

// Tự chạy khi GV gõ dòng mới: điền ngày giờ hôm nay vào cột A
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    if (sh.getName() !== 'BAO_BU') return;
    var dong = e.range.getRow();
    if (dong < 2) return;
    var cot = e.range.getColumn();
    if (cot < 2 || cot > 6) return; // chỉ khi gõ 5 cột GV được gõ
    var oNgay = sh.getRange(dong, 1);
    if (!oNgay.getValue()) oNgay.setValue(new Date());
  } catch (err) { }
}

// Đọc báo bù: ưu tiên tab BAO_BU (GV gõ thẳng), có tab Form thì đọc thêm
function laySheetBaoBu(ss) {
  return ss.getSheetByName('BAO_BU');
}

// ===== GOM NHÓM (bấm chiều T2) =====
function gomNhom() {
  var ss = laySS();
  var bao = laySheetBaoBu(ss);
  var lich = ss.getSheetByName('LICH_BU');
  if (!bao || !lich) {
    baoXong('Chưa có sheet. Bấm menu "Tạo sheet" trước.');
    return;
  }

  var data = bao.getDataRange().getValues();
  if (data.length < 2) {
    baoXong('Chưa có bé nào báo bù.');
    return;
  }

  // Lấy các bé chưa xếp (cột Trạng thái trống hoặc = Chờ)
  var chuaXep = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var trangThai = (r[6] || '').toString().trim();
    if (trangThai === '' || trangThai === 'Chờ') {
      chuaXep.push({ dong: i + 1, gvBao: r[1], tenBe: r[2], lop: r[3], trinhDo: r[4], link: r[5] });
    }
  }
  if (chuaXep.length === 0) {
    baoXong('Không còn bé nào chờ xếp.');
    return;
  }

  // Sắp xếp: bé lớp Đức Anh lên trước → ca Đức Anh ưu tiên; còn lại gom theo trình độ
  chuaXep.sort(function (a, b) {
    var au = LOP_DUC_ANH.indexOf(a.lop) >= 0 ? 0 : 1;
    var bu = LOP_DUC_ANH.indexOf(b.lop) >= 0 ? 0 : 1;
    if (au !== bu) return au - bu;
    if (a.trinhDo < b.trinhDo) return -1;
    if (a.trinhDo > b.trinhDo) return 1;
    return 0;
  });

  var caList = layDanhSachCa();
  var sucChua = caList.length * CFG.TOI_DA_CA; // 16

  // Xoá lịch cũ chưa chốt để xếp lại cho gọn (giữ lại dòng đã ✅)
  giuLaiDongDaChot(lich);

  // Xếp từng bé
  var beDu = [];
  var stt = 0;
  chuaXep.forEach(function (be) {
    if (stt < sucChua) {
      var ca = chonCaChoBe(be, caList, lich);
      themBeVaoLich(lich, bao, be, ca);
      stt++;
    } else {
      beDu.push(be);
    }
  });

  // Đánh dấu bé dư → tuần sau
  beDu.forEach(function (be) {
    bao.getRange(be.dong, 7).setValue('Tuần sau');
    bao.getRange(be.dong, 9).setValue('Quá 16 bé, tự đẩy sang tuần sau');
  });

  // Tô đỏ ca nào ghép 3 trình độ
  toDoCa3TrinhDo(lich);

  var msg = 'Đã xếp ' + stt + ' bé vào ' + caList.length + ' ca.'
    + (beDu.length ? '\nDư ' + beDu.length + ' bé → đẩy sang tuần sau.' : '')
    + '\n\nBước tiếp theo: mở tab LICH_BU, copy cột "Tin nhắn PH" gửi Zalo cho PH.';
  baoXong(msg);
}

// Chọn ca cho 1 bé: ưu tiên (1) ca Đức Anh nếu bé lớp Đức Anh, (2) ca cùng trình độ còn chỗ, (3) ca trống
function chonCaChoBe(be, caList, lich) {
  var rows = lich.getDataRange().getValues();

  function beTrongCa(maCa) {
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === maCa) list.push({ trinhDo: rows[i][6], tenBe: rows[i][4] });
    }
    return list;
  }

  // 1. Bé lớp Đức Anh → ca Đức Anh trước
  if (LOP_DUC_ANH.indexOf(be.lop) >= 0) {
    var caDA = caList[caList.length - 1]; // ca cuối = Đức Anh
    if (beTrongCa(caDA.ma).length < CFG.TOI_DA_CA) return caDA;
  }

  // 2. Tìm ca cùng trình độ còn chỗ (để gom gọn, tối đa 2 trình độ/ca)
  for (var k = 0; k < caList.length; k++) {
    var trong = beTrongCa(caList[k].ma);
    if (trong.length >= CFG.TOI_DA_CA) continue;
    var trinhDos = {};
    trong.forEach(function (x) { trinhDos[x.trinhDo] = 1; });
    var ds = Object.keys(trinhDos);
    if (ds.length === 0) continue; // ca trống để dành bước 3
    if (ds.indexOf(be.trinhDo) >= 0) return caList[k]; // cùng trình độ
    if (ds.length < CFG.TOI_DA_TRINH_DO) return caList[k]; // còn slot trình độ
  }

  // 3. Ca trống đầu tiên
  for (var j = 0; j < caList.length; j++) {
    if (beTrongCa(caList[j].ma).length === 0) return caList[j];
  }

  // 4. Ca nào còn chỗ thì nhét (trường hợp lẻ)
  for (var m = 0; m < caList.length; m++) {
    if (beTrongCa(caList[m].ma).length < CFG.TOI_DA_CA) return caList[m];
  }
  return caList[0];
}

function themBeVaoLich(lich, bao, be, ca) {
  var ngayHoc = layNgayThu(ca.thu);
  var tinPH = 'Dạ em chào chị, em xin thông báo lịch học bù cho bé ' + be.tenBe + ':\n'
    + '• Thời gian: ' + ca.thu + ' ngày ' + ngayHoc + ' lúc ' + ca.gio + '\n'
    + '• GV: ' + ca.gv + '\n'
    + '• Lớp: ' + be.lop + '\n'
    + 'Dạ thời gian này chị có sắp xếp đưa bé đến Trung tâm học bù được không ạ?\n'
    + 'Nhờ chị xác nhận giúp em trước 11h trưa Thứ 3 nhé!\nEm cám ơn chị ạ.';
  var tinGV = '📚 [' + ca.thu + ' ' + ca.gio + '] ' + ca.gv + ' dạy bù: bé ' + be.tenBe
    + ' (' + be.lop + ' - ' + be.trinhDo + '). Slide: ' + (be.link || '(chưa có link)');
  lich.appendRow([ca.ma, ca.thu, ca.gio, ca.gv, be.tenBe, be.lop, be.trinhDo, be.link, 'Chờ Vân Anh', tinPH, tinGV, '']);
  // Tô vàng bé thiếu link slide để bạn nhắc GV báo
  if (!be.link || !be.link.toString().trim()) {
    var dongMoi = lich.getLastRow();
    lich.getRange(dongMoi, 8).setBackground('#FFF3CD');
  }
  bao.getRange(be.dong, 7).setValue('Đã xếp');
  bao.getRange(be.dong, 8).setValue(ca.ma + ' ' + ca.thu + ' ' + ca.gio);
}

// Giữ lại dòng đã ✅, xoá dòng chưa chốt để xếp lại
function giuLaiDongDaChot(lich) {
  var data = lich.getDataRange().getValues();
  var giu = [data[0]];
  // Đảm bảo hàng tiêu đề đủ 12 cột (bản cũ 11 cột thì thêm "Đã dạy")
  if (giu[0].length < 12) {
    giu[0].push('Đã dạy');
    lich.getRange(1, 12).setValue('Đã dạy');
    datDropdown(lich, 12, 200, DA_DAY);
  }
  for (var i = 1; i < data.length; i++) {
    var st = (data[i][8] || '').toString();
    if (st.indexOf('✅') >= 0 || st.indexOf('Đi được') >= 0) giu.push(data[i]);
  }
  lich.clear();
  giu.forEach(function (r) { lich.appendRow(r); });
  lich.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(lich, 9, 200, PH_TRANG_THAI);
  datDropdown(lich, 12, 200, DA_DAY);
}

// Tô đỏ ca ghép 3 trình độ để bạn quyết
function toDoCa3TrinhDo(lich) {
  var data = lich.getDataRange().getValues();
  var theoCa = {};
  for (var i = 1; i < data.length; i++) {
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

// ===== ĐẨY QUÁ HẠN SANG TUẦN SAU =====
function dayQuaHanSangTuanSau() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var data = lich.getDataRange().getValues();
  var dem = 0;
  for (var i = 1; i < data.length; i++) {
    var st = (data[i][8] || '').toString();
    if (st === 'Chờ Vân Anh' || st === 'Chờ' || st === '') {
      lich.getRange(i + 1, 9).setValue('Tuần sau (quá hạn)');
      dem++;
    }
  }
  baoXong('Đã đẩy ' + dem + ' bé chưa xác nhận sang tuần sau.');
}

// ===== GỬI TIN CHO GV (chỉ ca đã ✅) =====
function guiTinChoGV() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var data = lich.getDataRange().getValues();

  // Gom theo ca đã chốt
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

  keys.forEach(function (ma) {
    var c = theoCa[ma];
    var tin = '📚 [HỌC BÙ ' + c.thu + ' ' + c.gio + '] ' + c.gv + ' dạy:\n';
    c.bes.forEach(function (b, idx) {
      tin += (idx + 1) + '. ' + b.ten + ' (' + b.lop + ' - ' + b.td + ')\n   Slide: ' + (b.link || '(chưa có)') + '\n';
    });
    guiTelegram(tin);
  });
  baoXong('Đã gửi ' + keys.length + ' tin vào nhóm Học Bù.');
}

// ===== NHẮC GV BÁO BÙ SÁNG T2 =====
function nhacGVBaoBu() {
  var ss = laySS();
  var bao = ss.getSheetByName('BAO_BU');
  var data = bao.getDataRange().getValues();
  var daBao = {};
  for (var i = 1; i < data.length; i++) {
    var gv = (data[i][1] || '').toString().trim();
    var tenBe = (data[i][2] || '').toString().trim().toLowerCase();
    // GV đã điền gì cũng tính là đã báo (kể cả "không bù")
    if (gv && tenBe) daBao[gv] = 1;
  }
  var chuaBao = GV_LIST.filter(function (g) { return !daBao[g]; });
  var tin = '📢 [SÁNG T2] Nhắc báo bù:\n';
  if (!chuaBao.length) {
    tin += 'Cả 7 GV đều đã báo ✅ Cảm ơn thầy cô!';
  } else {
    tin += 'GV chưa báo: ' + chuaBao.join(', ') + '\nThầy cô vào tab BAO_BU:\n• Nếu có bé nghỉ: ghi tên bé + lớp + trình độ + link Canva\n• Nếu lớp đi đủ: gõ "Không bù" vào cột Tên bé';
  }
  guiTelegram(tin);
  baoXong('Đã gửi tin nhắc vào nhóm Học Bù.');
}

// ===== BACKUP T7 + REFRESH TUẦN MỚI =====
function backupVaRefreshTuanMoi() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var bao = ss.getSheetByName('BAO_BU');
  
  // 1. Copy LICH_BU sang sheet backup tên "Backup_YYYY-MM-DD"
  var homNay = new Date();
  var tenBackup = 'Backup_' + Utilities.formatDate(homNay, 'GMT+7', 'yyyy-MM-dd');
  var backup = ss.getSheetByName(tenBackup);
  if (backup) ss.deleteSheet(backup); // xoá backup cũ cùng ngày nếu có
  backup = lich.copyTo(ss);
  backup.setName(tenBackup);
  
  // 2. Clear LICH_BU (giữ tiêu đề) để tuần mới bắt đầu sạch
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  lich.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(lich, 9, 200, PH_TRANG_THAI);
  datDropdown(lich, 12, 200, DA_DAY);
  
  // 3. Clear BAO_BU (giữ tiêu đề + dòng mẫu) để GV báo tuần mới
  var dataBao = bao.getDataRange().getValues();
  if (dataBao.length > 2) {
    bao.deleteRows(3, dataBao.length - 2);
  }
  
  baoXong('Đã backup ' + tenBackup + ' và làm mới BAO_BU + LICH_BU cho tuần mới ✅');
}

// ===== GỬI TELEGRAM =====
function guiTelegram(text) {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) {
    baoXong('Chưa có token bot. Vào Cài đặt dự án → Thuộc tính tập lệnh → thêm TELEGRAM_BOT_TOKEN.');
    return;
  }
  var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  UrlFetchApp.fetch(url, {
    method: 'post',
    payload: { chat_id: CFG.GROUP_ID, message_thread_id: CFG.TOPIC_ID, text: text }
  });
}

// Test gửi 1 tin (chạy để kiểm tra bot đã vào nhóm chưa)
function testGuiTelegram() {
  guiTelegram('✅ Bot Dạy Bù đã vào nhóm thành công!');
}

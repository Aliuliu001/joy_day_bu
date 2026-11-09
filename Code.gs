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
  GROUP_ID: '-1004378772858',    // nhóm Học Bù — lịch, nhắc GV, xin đổi
  TOPIC_ID: 2,                   // topic Học Bù
  // SOTW đọc từ Thuộc tính tập lệnh để đổi bot/topic không phải sửa code.
  // Không để số topic cũ ở đây: gửi nhầm topic còn nguy hiểm hơn việc dừng và báo thiếu cấu hình.
  SOTW_GROUP_ID: '',
  SOTW_TOPIC_ID: '',
  HAN_TRA_LOI: '12h trưa Thứ 4',
  HAN_PH_XAC_NHAN: '11h trưa Thứ 3',
  TOI_DA_CA: 4,
  TOI_DA_TRINH_DO: 2,
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
var GV_LIST = ['Mr. Đức Anh', 'Mr. Ngọc', 'Ms. Nhung', 'Ms. Trâm', 'Ms. Uyên Vi', 'Ms. Vân'];
// Chỉ hai GV này nhận lịch Dạy Bù tự động. GV chính/SOTW vẫn lấy từ DS học sinh.
var GV_DAY_BU = ['Ms. Vân', 'Mr. Đức Anh'];
var PH_TRANG_THAI = ['Chờ Ms. Vân Anh', '✅ Đi được', '🔄 Xin đổi', '❌ Nghỉ', 'Tuần sau (quá hạn)'];
var DA_DAY = ['✅ Đã học', '❌ Vắng (không tới)'];
var GIOI_TINH = ['Nam', 'Nữ'];
var EMAIL_QUAN_LY = ['tuanngoctruong2710@gmail.com', 'nguyenthiuyenvi@gmail.com', 'vananhhthuy@gmail.com'];

// Khóa các sheet quan trọng — chỉ 3 email EMAIL_QUAN_LY được sửa
// GV chỉ sửa được: BAO_BU (trừ cột G/H đã khóa riêng) + DS HỌC SINH (tick SOTW)
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
  // Ms. Hồng Anh đã rời cơ sở: không tự gán các lớp này sang GV khác.
  // Danh sách nguồn có GV mới thì Đồng bộ sẽ lấy đúng GV mới từ file chính.
  'S1.004 - Watermelon': '', 'S2.002 - Blueberry': '',
  'C2.003 - Tomato': '', 'T2.002 - Carrot': '',
  'S1.001 - Cashew': 'Mr. Ngọc', 'S2.001 - Pumpkin Seed': 'Mr. Ngọc',
  'C2.005 - Pineapple': 'Mr. Ngọc', 'W1.003 - Tiramisu': 'Mr. Ngọc',
  'S1.003 - Hazelnut': 'Ms. Trâm', 'S2.005 - Acorn': 'Ms. Trâm',
  'C2.006 - Broccoli': 'Ms. Trâm', 'T2.003 - Potato': 'Ms. Trâm',
  'S1.002 - Almond': 'Ms. Uyên Vi', 'C2.001 - Strawberry': 'Ms. Uyên Vi',
  'S2.006 - Avocado': 'Ms. Nhung'
};

var LOP_DUC_ANH = ['S1.006 - Lychee', 'S2.004 - Cherry', 'C2.004 - Kiwi', 'T1.001 - Apple', 'W2.001 - Cookie'];

// Ca mặc định chỉ dùng để tạo sheet CÀI ĐẶT CA DẠY BÙ lần đầu.
// Sau đó việc sửa giờ/GV/ca thực hiện trực tiếp trên sheet, không cần sửa Code.gs.
var CA_DAY_BU_MAC_DINH = [
  ['T4-1', 'Thứ 4', '17h30 - 19h00', 'Mr. Đức Anh', 'Dùng', 4, 2],
  ['T5-1', 'Thứ 5', '17h30 - 19h00', 'Ms. Vân', 'Dùng', 4, 2],
  ['T6-1', 'Thứ 6', '13h30 - 15h00', 'Ms. Vân', 'Dùng', 4, 2],
  ['T6-2', 'Thứ 6', '15h00 - 16h30', 'Ms. Vân', 'Dùng', 4, 2],
  ['T6-3', 'Thứ 6', '13h30 - 15h00', 'Mr. Đức Anh', 'Dùng', 4, 2],
  ['T6-4', 'Thứ 6', '15h00 - 16h30', 'Mr. Đức Anh', 'Dùng', 4, 2]
];

function capNhatNhanCaDayBu(sh) {
  if (!sh) return;
  var last = sh.getLastRow();
  if (last < 2) return;
  // Nhãn chỉ để chọn/nhìn; luôn dựng lại từ dữ liệu thật để không lưu nhãn cũ.
  var rows = sh.getRange(2, 1, last - 1, 5).getValues();
  var out = rows.map(function(r) { return [r[0] && r[1] && r[2] && r[4] ? nhanCaDayBu(r[0], r[1], r[2], r[4]) : '']; });
  sh.getRange(2, 4, out.length, 1).setValues(out);
}

function taoCaiDatCaDayBu(ss) {
  var sh = layHoacTaoSheet(ss, 'CÀI ĐẶT CA DẠY BÙ');
  if (!sh.getRange(1, 1).getValue()) {
    sh.getRange(1, 1, 1, 8).setValues([['Mã ca', 'Thứ', 'Giờ', 'Ca hiển thị', 'GV dạy bù', 'Trạng thái', 'Tối đa bé', 'Tối đa trình độ']]);
    sh.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#F6F3EE');
    var caMoi = CA_DAY_BU_MAC_DINH.map(function(r) { return [r[0],r[1],r[2],nhanCaDayBu(r[0],r[1],r[2],r[3]),r[3],r[4],r[5],r[6]]; });
    sh.getRange(2, 1, caMoi.length, 8).setValues(caMoi);
    sh.getRange(1, 10, 1, 3).setValues([['Lớp', 'GV chính', 'GV dạy bù ưu tiên']]);
    sh.getRange(1, 10, 1, 3).setFontWeight('bold').setBackground('#F6F3EE');
    var dongLop = LOP_LIST.map(function(lop) { var gv=LOP_GV_MAP[lop]||''; return [lop,gv,GV_DAY_BU.indexOf(gv)>=0?gv:'']; });
    if (dongLop.length) sh.getRange(2, 10, dongLop.length, 3).setValues(dongLop);
    sh.getRange(9, 1).setValue('Cột D chỉ để nhìn nhanh: Mã ca | Thứ | Giờ. Khi đổi ca, sửa cột A-C và E-H; cột D tự cập nhật. Cột M chỉ chọn khi muốn ưu tiên lớp vào ca Ms. Vân hoặc Mr. Đức Anh.');
  } else if (String(sh.getRange(1,4).getValue()||'').trim() !== 'Ca hiển thị') {
    // Bản cũ: D là GV. Chèn D, giữ toàn bộ thông tin cũ không mất.
    sh.insertColumnsAfter(3, 1);
    sh.getRange(1,4).setValue('Ca hiển thị').setFontWeight('bold').setBackground('#F6F3EE');
    capNhatNhanCaDayBu(sh);
  } else capNhatNhanCaDayBu(sh);
  return sh;
}

function layDanhSachCa(ss) {
  var sh = ss && ss.getSheetByName('CÀI ĐẶT CA DẠY BÙ');
  if (!sh) return CA_DAY_BU_MAC_DINH.map(function(r) { return { ma:r[0], thu:r[1], gio:r[2], gv:r[3], nhan:nhanCaDayBu(r[0],r[1],r[2],r[3]), toiDaBe:Number(r[5]), toiDaTrinhDo:Number(r[6]) }; });
  var data=sh.getDataRange().getValues(), out=[];
  for (var i=1;i<data.length;i++) {
    var r=data[i], ma=String(r[0]||'').trim(), thu=String(r[1]||'').trim(), gio=String(r[2]||'').trim();
    if (!ma || String(r[5]||'').trim() !== 'Dùng') continue;
    if (GV_DAY_BU.indexOf(String(r[4]||'').trim())<0) continue;
    var gv=String(r[4]||'').trim();
    // Không tin nhãn cũ ở cột D: dựng lại để dropdown luôn đúng giờ/GV hiện hành.
    out.push({ma:ma, thu:thu, gio:gio, gv:gv, nhan:nhanCaDayBu(ma,thu,gio,gv), toiDaBe:Number(r[6])||CFG.TOI_DA_CA, toiDaTrinhDo:Number(r[7])||CFG.TOI_DA_TRINH_DO});
  }
  return out;
}

function layGvBuUuTienTheoLop(ss) {
  var sh=ss && ss.getSheetByName('CÀI ĐẶT CA DẠY BÙ'), out={};
  if (!sh) return out;
  var data=sh.getDataRange().getValues();
  for (var i=1;i<data.length;i++) {
    var lop=String(data[i][9]||'').trim(), gv=String(data[i][11]||'').trim();
    if (lop && GV_DAY_BU.indexOf(gv)>=0) out[lop]=gv;
  }
  return out;
}

// Tính ngày sắp tới cho mọi ca T2…CN trong sheet CÀI ĐẶT CA DẠY BÙ.
function layNgayThu(thu) {
  return layNgayThuBatKy(thu);
}

// Parse cột "Ca đặc biệt". Form mới: "ĐB-01 | Thứ 4 | 14h00 - 15h30 | Ms. Vân".
// Vẫn đọc form cũ để các dòng đã nhập không bị kẹt, nhưng chỉ hướng dẫn form mới.
function parseCaDacBiet(text) {
  var s=(text||'').toString().trim(); if(!s) return null;
  var ma='ĐB-01', thuNhap='', gio='', gv='', m=s.match(/^ĐB-01\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*(.+)$/i);
  if(m){thuNhap=m[1].trim();gio=m[2].trim();gv=m[3].trim();}
  else {
    m=s.match(/^(T[2-7]|CN|Thứ\s*[2-7]|Chủ\s*nhật)\s+([\d:h\-\s]+)\s+(.+)$/i);
    if(!m)return null; thuNhap=m[1].trim();gio=m[2].trim();gv=m[3].trim();
  }
  // Ca đặc biệt là ngoại lệ một lần: nhận mọi GV đang hoạt động, không chỉ 2 GV xếp tự động.
  var soThu=thuVietSangSo(thuNhap); if(soThu===null || GV_LIST.indexOf(gv)<0)return null;
  var tenThu={1:'Thứ 2',2:'Thứ 3',3:'Thứ 4',4:'Thứ 5',5:'Thứ 6',6:'Thứ 7',0:'Chủ nhật'};
  thuNhap=tenThu[soThu]; gio=gio.replace(/\s+/g,' ').trim();
  // Form mới giữ giờ kiểu 14h00 cho đồng nhất ca chuẩn; form cũ vẫn được đọc.
  return {ma:ma,thu:thuNhap,gio:gio,gv:gv,nhan:nhanCaDayBu(ma,thuNhap,gio,gv),dacBiet:true};
}
function timCaTheoNhanHoacDacBiet(ss, nhan) { return timCaTheoNhan(ss,nhan) || parseCaDacBiet(nhan); }

// Đổi cách viết thứ tiếng Việt sang số ISO: T2=1 … T7=6, CN=0.
// Không dùng trực tiếp số 4: “Thứ 4” tiếng Việt là Wednesday (3), không phải Thursday (4).
function thuVietSangSo(thuText) {
  var s = String(thuText || '').trim().toUpperCase().replace(/\s+/g, '');
  var map = { 'T2': 1, 'THỨ2': 1, 'T3': 2, 'THỨ3': 2, 'T4': 3, 'THỨ4': 3,
    'T5': 4, 'THỨ5': 4, 'T6': 5, 'THỨ6': 5, 'T7': 6, 'THỨ7': 6,
    'CN': 0, 'CHỦNHẬT': 0 };
  return Object.prototype.hasOwnProperty.call(map, s) ? map[s] : null;
}

// Tính ngày học gần nhất phía trước cho mọi ngày T2…CN.
function layNgayThuBatKy(thuText) {
  var thuMuon = thuVietSangSo(thuText);
  if (thuMuon === null) return '';
  var homNay = new Date();
  var thuHienTai = parseInt(Utilities.formatDate(homNay, 'GMT+7', 'u'), 10) % 7; // 0=CN, 1=T2…6=T7
  var ngayCach = thuMuon - thuHienTai;
  if (ngayCach <= 0) ngayCach += 7;
  var ngayHoc = new Date(homNay.getTime() + ngayCach * 24 * 60 * 60 * 1000);
  return Utilities.formatDate(ngayHoc, 'GMT+7', 'dd/MM/yyyy');
}

// ===== MENU (4 nút workflow + 3 menu con) =====
// LƯU Ý: menu con KHÔNG được gọi addToUi() — chỉ gọi 1 lần cuối cho menu chính,
// nếu không Google sẽ ném lỗi → menu chính không hiện (bug đã fix 17/10)
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('⚙️ Quản lý Dạy Bù')
      // Làm từ trên xuống dưới: chuẩn bị → xếp → xử lý → gửi → kết tuần.
      .addItem('1️⃣ Cập nhật danh sách HS đầu tuần', 'menuDongBoDS')
      .addItem('2️⃣ Gom nhóm tạm + gửi SOTW (T2 chiều)', 'gomNhom')
      .addItem('3️⃣ Chốt BAO_BU → tạo LICH_BU + Tin PH', 'chotBaoBuTaoLichTinPH')
      .addItem('4️⃣ Xử lý PH xin đổi / quá hạn (khi có)', 'xuLyCaseDacBiet')
      .addItem('5️⃣ Chốt LICH_BU → tạo tin GV', 'chotLichTaoTinGV')
      .addItem('6️⃣ Gửi lịch đã chốt cho GV (T5-T6)', 'guiTinChoGV')
      .addItem('7️⃣ Kết tuần mới — tự backup trước (T7-CN)', 'lamMoiTuanMoi')
      .addSeparator()
      .addSubMenu(ui.createMenu('📨 Gửi tin / Nhắc việc')
        .addItem('🔔 Nhắc GV báo Dạy Bù (T2 sáng)', 'nhacGVBaoBu')
        .addItem('📨 Gửi lại lịch đã chốt cho GV', 'guiLaiTinChoGV')
        .addItem('🏆 Gửi lại SOTW', 'guiSOTWMenu')
        .addItem('🧪 Gửi thử Topic Dạy Bù', 'testGuiTelegram'))
      .addSubMenu(ui.createMenu('📦 Backup / Thống kê / Chốt tháng')
        .addItem('💾 Lưu backup ngay', 'backupThuCong')
        .addItem('📊 Xem thống kê tháng này', 'lamMoiThongKe')
        .addItem('📅 Chọn tháng để xem thống kê', 'lamMoiThongKeChonThang')
        .addItem('📌 Xem việc cần làm hôm nay', 'tongQuanCongViec'))
      .addSubMenu(ui.createMenu('🗂️ Cập nhật dữ liệu phụ')
        .addItem('🔄 Làm mới danh sách Ca xếp', 'lamMoiDanhSachCaXep')
        .addItem('🖼️ Gắn ảnh SOTW từ folder', 'ganLinkAnhTuFolder')
        .addItem('🔍 Kiểm tra và sửa cột Lớp / Tên bé', 'kiemTraThuTuCot')
        .addItem('🗜️ Ẩn / hiện bảng lớp tham khảo', 'anTabLop'))
      .addSubMenu(ui.createMenu('🛠️ Cài đặt kỹ thuật')
        .addItem('📖 Hướng dẫn quy trình tuần + chốt tháng', 'huongDanQuyTrinhDayBu')
        .addItem('🧪 Gửi thử Topic SOTW', 'testGuiTelegramSOTW')
        .addItem('🔎 Lấy mã Topic SOTW_3 từ tin test', 'layMaTopicSOTW')
        .addItem('🔧 Nâng cấp sheet sau khi copy code mới', 'nangCapSheetSotw')
        .addSeparator()
        .addItem('🔨 Tạo lại sheet trống — ⚠️ XOÁ TOÀN BỘ DỮ LIỆU', 'setupDayBu'))
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
    sh.getRange(2, 1, 1, 7).setValues([['Tên bé', 'Lớp', 'GV chính', 'Giới tính', 'Link ảnh', '☑ SOTW tuần này', 'MSHS']]);
    sh.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#F6F3EE');
    sh.getRange(2, 1, 1, 7).setFontWeight('bold').setBackground('#F6F3EE');
  } else if (sh.getRange(2, 7).getValue() !== 'MSHS') {
    // Thêm MSHS ở CUỐI để tab DS cũ không lệch dữ liệu đang dùng.
    sh.getRange(2, 7).setValue('MSHS').setFontWeight('bold').setBackground('#F6F3EE');
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
  if (dem >= 2) {
    // Sheet đã có mẫu từ bản cũ: chỉ bổ sung ví dụ cột K, không tạo thêm dòng.
    var mauDaCo = 0;
    for (var m = 1; m < data.length && mauDaCo < 2; m++) {
      if (String(data[m][8] || '').indexOf(DAU_MAU) < 0) continue;
      bao.getRange(m + 1, 11).setValue(mauDaCo === 0 ? '' : 'ĐB-01 | Thứ 4 | 14h00 - 15h30 | Ms. Vân');
      mauDaCo++;
    }
    return false;
  }
  // Chỉ giữ 2 dòng mẫu: mỗi dòng vừa minh họa báo bù, vừa minh họa cột K Ca đặc biệt.
  var mau1 = ['', 'Mr. Ngọc', 'S1.001 - Cashew', 'Không bù', '', '', '', '',
    DAU_MAU + ' Lớp đi đủ → gõ "Không bù" ở cột Tên bé. Ca đặc biệt để trống.', '', '', ''];
  var mau2 = ['', 'Mr. Ngọc', 'S2.001 - Pumpkin Seed', 'Iphone', 'SP1', '', '', '',
    DAU_MAU + ' Chỉ dùng Ca đặc biệt khi bé phải học đúng ca phát sinh một lần.', '', 'ĐB-01 | Thứ 4 | 14h00 - 15h30 | Ms. Vân', ''];
  var dong2LaMau = false;
  if (data.length >= 2) {
    var dong2 = data[1];
    var tenDong2 = ((dong2[2] || '') + ' ' + (dong2[3] || '')).toLowerCase();
    dong2LaMau = (dong2[8] || '').toString().indexOf(DAU_MAU) >= 0 || tenDong2.indexOf('ghi chú mẫu') >= 0;
  }
  if (dong2LaMau) {
    bao.getRange(2, 1, 1, 12).setValues([mau1]);
    bao.insertRows(3, 1);
    bao.getRange(3, 1, 1, 12).setValues([mau2]);
  } else if (data.length < 2) {
    bao.appendRow(mau1);
    bao.appendRow(mau2);
  } else {
    bao.insertRows(2, 2);
    bao.getRange(2, 1, 1, 12).setValues([mau1]);
    bao.getRange(3, 1, 1, 12).setValues([mau2]);
  }
  bao.getRange(2, 1, 2, 12).setFontStyle('italic').setFontColor('#999999');
  return true;
}

// Bảo vệ 2 dòng mẫu: chỉ quản lý sửa được
function chongCheDongMau(bao) {
  try {
    var olds = bao.getProtections(SpreadsheetApp.ProtectionType.RANGE) || [];
    // Bản cũ chỉ khóa A:K. Gỡ khóa cũ rồi tạo lại A:L để cột GV ưu tiên
    // trong 2 dòng mẫu cũng không bị sửa nhầm.
    for (var i = 0; i < olds.length; i++) {
      if ((olds[i].getDescription() || '').indexOf('Dòng mẫu') >= 0) olds[i].remove();
    }
  } catch (e) {}
  var prot = bao.getRange(2, 1, 2, 12).protect().setDescription('Dòng mẫu - chỉ quản lý sửa');
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
  try { taoCaiDatCaDayBu(ss); } catch (e) { loi.push('Tạo tab CÀI ĐẶT CA DẠY BÙ: ' + e); }
  var msg = '✅ Đã nâng cấp sheet SOTW:\n• Tab "' + SOTW_SHEET + '"';
  if (sotw) msg = '✅ Đã nâng cấp sheet SOTW:\n• Tab "' + SOTW_SHEET + '" sẵn sàng (dropdown GV / lớp, ô tick)';
  var bao = ss.getSheetByName('BAO_BU');
  if (bao) {
    try {
      if (chuyenCotMoiBAOBU(bao)) msg += '\n• Đã đổi cột: Lớp ngay sau GV báo (Tên bé dời sang cột D)';

      // Thêm cột K/L ở CUỐI để không làm lệch dữ liệu cũ.
      if (!bao.getRange(1, 11).getValue()) {
        bao.getRange(1, 11).setValue('Ca đặc biệt');
        bao.getRange(1, 11).setFontWeight('bold').setBackground('#F6F3EE');
        msg += '\n• Đã thêm cột K "Ca đặc biệt"';
      }
      if (String(bao.getRange(1, 12).getValue() || '').trim() !== 'GV dạy bù ưu tiên') {
        bao.getRange(1, 12).setValue('GV dạy bù ưu tiên').setFontWeight('bold').setBackground('#F6F3EE');
        bao.getRange(2, 12, 300, 1).setDataValidation(SpreadsheetApp.newDataValidation()
          .requireValueInList(GV_DAY_BU, true).setAllowInvalid(true).build());
        msg += '\n• Đã thêm cột L "GV dạy bù ưu tiên" (chỉ chọn khi muốn đổi riêng từng bé)';
      }
      var lichNangCap = ss.getSheetByName('LICH_BU');
      if (lichNangCap && String(lichNangCap.getRange(1, 14).getValue() || '').trim() !== 'Ngày học') {
        lichNangCap.getRange(1, 14).setValue('Ngày học').setFontWeight('bold').setBackground('#F6F3EE');
        msg += '\n• Đã thêm cột "Ngày học" trong LICH_BU (phục vụ backup không sót buổi)';
      }
      if (lichNangCap && String(lichNangCap.getRange(1, 15).getValue() || '').trim() !== 'Đã gửi GV lúc') {
        lichNangCap.getRange(1, 15).setValue('Đã gửi GV lúc').setFontWeight('bold').setBackground('#F6F3EE');
        msg += '\n• Đã thêm cột "Đã gửi GV lúc" (chống gửi lặp)';
      }
      if (lichNangCap && String(lichNangCap.getRange(1, 16).getValue() || '').trim() !== 'Đã chốt lịch lúc') {
        lichNangCap.getRange(1, 16).setValue('Đã chốt lịch lúc').setFontWeight('bold').setBackground('#F6F3EE');
        msg += '\n• Đã thêm cột "Đã chốt lịch lúc" (bắt buộc tạo tin theo lịch đã kiểm tra)';
      }
      if (lichNangCap) {
        damBaoCotCaLich(ss, lichNangCap);
        msg += '\n• LICH_BU dùng một cột Ca xếp (chọn) để tự cập nhật mã ca, thứ, giờ và GV';
      }

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
  msg += '\n• Tự kiểm tra/sửa cột BAO_BU';
  baoXong(msg);
}

// ===== TẠO SHEET (1 lần) =====
function setupDayBu() {
  if (!xacNhan('Việc này sẽ XOÁ HẾT dữ liệu 3 tab BAO_BU, LICH_BU, LOP và tạo lại. Tiếp tục?')) return;
  var ss = laySS();

  var sh1 = layHoacTaoSheet(ss, 'BAO_BU');
  sh1.clear();
  sh1.appendRow(['Ngày báo', 'GV báo', 'Lớp', 'Tên bé', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú', 'SOTW', 'Ca đặc biệt', 'GV dạy bù ưu tiên']);
  sh1.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  taoDongMau(sh1);

  var sh2 = layHoacTaoSheet(ss, 'LICH_BU');
  sh2.clear();
  sh2.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú', 'Ngày học', 'Đã gửi GV lúc', 'Đã chốt lịch lúc', 'Ca xếp (chọn)', 'Mã buổi']);
  sh2.getRange(1, 1, 1, 18).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdownCaLich(ss, sh2);
  datDropdown(sh2, 9, 200, PH_TRANG_THAI);
  datDropdown(sh2, 12, 200, DA_DAY);

  var sh3 = layHoacTaoSheet(ss, 'LOP');
  sh3.clear();
  sh3.appendRow(['Lớp', 'GV chính']);
  LOP_LIST.forEach(function (lop) {
    sh3.appendRow([lop, LOP_GV_MAP[lop] || '']);
  });

  var sotw = taoBangSotw(ss);
  taoCaiDatCaDayBu(ss);
  themLinkSotw(sh1, sotw.getSheetId());
  chongCheDongMau(sh1);
  datDropdownBaoBu(ss, sh1);
  khoaCotQuanLy();
  try { sh3.hideSheet(); } catch (e) {}
  baoXong('Xong! Đã tạo: BAO_BU (kèm 2 dòng mẫu + cột SOTW), LICH_BU, DS HỌC SINH (tab LOP đã ẩn).');
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
  // Chỉ khóa Trạng thái (G). Ca xếp (H) có dropdown để quản lý sửa tay;
  // không khóa H vì một số tài khoản quản lý Google Sheet bị từ chối dù đã add editor.
  var range = sh.getRange(1, 7, 500, 1);
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

// Tab LOP là nơi quản lý có thể đổi GV chủ nhiệm/dạy thay theo LỚP.
// Danh sách bé vẫn lấy từ DS HỌC SINH; chỉ quan hệ GV → Lớp lấy LOP ưu tiên hơn.
function layGvTheoLopTuLOP(ss) {
  var out = {}, lopSh = ss && ss.getSheetByName('LOP');
  if (!lopSh) return out;
  var data = lopSh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var lop = String(data[i][0] || '').trim();
    var gv = String(data[i][1] || '').trim();
    if (lop && gv) out[lop] = gv;
  }
  return out;
}

// Nguồn cho cascade GV → Lớp → Tên bé:
// tên bé lấy DS HỌC SINH, còn GV của lớp ưu tiên lấy tab LOP để thay GV không bị lỗi dropdown.
function nguonBAOBU(ss) {
  var out = { gvs: [], lops: [], tenAll: [], theoGv: {}, tenTheoLop: {}, theoTen: {} };
  var ds = ss.getSheetByName(SOTW_SHEET);
  if (!ds) return out;
  var gvTheoLop = layGvTheoLopTuLOP(ss);
  var data = ds.getDataRange().getValues();
  for (var r = 2; r < data.length; r++) {
    var ten = String(data[r][0] === undefined || data[r][0] === null ? '' : data[r][0]).trim();
    if (!ten) continue;
    var lop = String(data[r][1] === undefined || data[r][1] === null ? '' : data[r][1]).trim();
    var gvTrongDS = String(data[r][2] === undefined || data[r][2] === null ? '' : data[r][2]).trim();
    var gv = gvTheoLop[lop] || gvTrongDS; // LOP sửa tay = nguồn ưu tiên cho dropdown BAO_BU.
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
    // Cài đặt ca: cột D chỉ để xem; khi sửa A-C hoặc E, dựng lại nhãn ngay.
    if (sh.getName() === 'CÀI ĐẶT CA DẠY BÙ' && dong >= 2 && (cot <= 3 || cot === 5 || cot === 6)) {
      capNhatNhanCaDayBu(sh);
      // Sửa/thêm/bật-tắt ca là dropdown hai bảng làm mới ngay, không cần chạy lại workflow.
      lamMoiDanhSachCaXep(true);
      return;
    }
    // DS HỌC SINH: đổi GV (B1) hoặc Lớp (D1) → chạy lại bộ lọc ẩn/hiện dòng
    if (sh.getName() === SOTW_SHEET && dong === 1 && (cot === 2 || cot === 4)) {
      apLocDS(sh);
      return;
    }
    if (sh.getName() === 'LICH_BU' && cot === 17 && dong >= 2) {
      var caChon = timCaTheoNhan(laySS(), sh.getRange(dong, 17).getValue());
      if (caChon) datLaiLichSauDoiCa(laySS(), sh, dong, caChon);
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

// ===== 📖 HƯỚNG DẪN QUY TRÌNH (popup trong menu Cài đặt kỹ thuật) =====
function huongDanQuyTrinhDayBu() {
  var txt = '📖 QUY TRÌNH MỖI TUẦN\n\n'
    + 'T2 sáng — nếu cần: 📨 Gửi tin / Nhắc việc → Nhắc GV báo Dạy Bù.\n'
    + '1️⃣ Cập nhật danh sách HS đầu tuần.\n'
    + '2️⃣ Gom nhóm tạm + gửi SOTW: máy chỉ xếp tạm tại BAO_BU, chưa gửi tin cho ai. Quản lý kiểm tra/đổi Ca xếp (Mã | Thứ | Giờ | GV).\n'
    + '3️⃣ Chốt BAO_BU → tạo LICH_BU + Tin PH: Ms. Vân Anh dùng lịch này để hỏi PH.\n'
    + '4️⃣ Nếu PH xin đổi/quá hạn: bấm Xử lý PH xin đổi / quá hạn, rồi Gom nhóm tạm lại cho các bé đó và hỏi PH lại.\n'
    + '5️⃣ PH ✅ Đi được: bấm Chốt LICH_BU → tạo tin GV. Nếu đổi Ca xếp ở LICH_BU, hệ thống đổi ngày/giờ/GV, xoá lịch cũ và PH phải xác nhận lại.\n'
    + '6️⃣ Gửi lịch đã chốt cho GV: chỉ khi Telegram gửi thành công, BAO_BU mới tự hiện Ca xếp cuối và trạng thái “Đã báo GV”. Gửi lỗi = chưa báo GV, không gửi lại chỉ để đồng bộ.\n'
    + '7️⃣ T7-CN: Kết tuần mới. Hệ thống tự backup trước, sau đó dọn LICH_BU; bé chưa chốt vẫn giữ.\n\n'
    + '📌 NHỚ: CÀI ĐẶT CA DẠY BÙ là danh mục ca chung; BAO_BU là lịch tạm/bảng theo dõi; LICH_BU là lịch cuối của từng bé.\n'
    + 'Ví dụ: T6-1 → PH xin đổi → T6-2 → PH đồng ý → gửi GV thành công = BAO_BU tự đổi sang T6-2.\n'
    + '📋 ĐỔI CA CHUNG: sửa/thêm/bật-tắt tại CÀI ĐẶT CA DẠY BÙ. Dropdown Ca xếp tự làm mới; nếu cần, vào 🗂️ Cập nhật dữ liệu phụ → 🔄 Làm mới danh sách Ca xếp (không đổi lịch).\n'
    + '⭐ CA ĐẶC BIỆT (cột K): chỉ cho ca phát sinh một lần, ưu tiên cao nhất. Nhập: ĐB-01 | Thứ 4 | 14h00 - 15h30 | Ms. Vân. Mã luôn ĐB-01; chỉ đổi Thứ/Giờ/GV, dùng mọi GV đang hoạt động (kể cả Mr. Ngọc).\n'
    + '👩‍🏫 ƯU TIÊN GV BÙ: chọn Ms. Vân/Mr. Đức Anh theo LỚP ở bảng bên phải; cột L BAO_BU chỉ dùng để đổi RIÊNG một bé.\n\n'
    + '📦 CUỐI THÁNG — KHÔNG XOÁ BACKUP\n'
    + '1. Vào 📦 Backup / Thống kê / Chốt tháng → Chọn tháng để xem thống kê.\n'
    + '2. Đọc tab THỐNG KÊ: chỉ “Đã học” được tính giờ; Vắng/Nghỉ được tách riêng.\n'
    + '3. Giữ nguyên tab “Backup tháng MM-yyyy”: đây là hồ sơ tháng, không xoá và không sửa tay.\n'
    + '4. Tab THỐNG KÊ chỉ là bản xem lại, tháng sau bấm xem tháng mới thì bảng này được thay bằng tháng mới — dữ liệu gốc vẫn nằm ở Backup tháng.\n'
    + '5. Không cần nhân bản BAO_BU hoặc LICH_BU: nút Kết tuần đã lưu các ca đã chốt vào Backup tháng.\n'
    + '6. Nếu cần lưu đối chiếu ngoài Google Sheet: vào File → Tạo bản sao, đặt tên “Dạy Bù - chốt MM-yyyy”.\n\n'
    + '⚠️ “Tạo lại sheet trống” xoá toàn bộ dữ liệu — chỉ dùng khi bắt đầu file mới, không dùng cuối tháng.';
  try { SpreadsheetApp.getUi().alert('JOY DẠY BÙ — quy trình & chốt tháng', txt, SpreadsheetApp.getUi().ButtonSet.OK); }
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
// Trả {tim:true, dong, cTen, cLop, cGv, cMshs}; MSHS là tuỳ chọn để ghép ảnh chính xác.
function timTieuDe(data) {
  var coTen = false, coLop = false;
  for (var d = 0; d < data.length && d < 30; d++) {
    var t = -1, l = -1, g = -1, m = -1;
    for (var c = 0; c < data[d].length; c++) {
      var h = boDau(data[d][c]);
      if (t < 0 && ((h.indexOf('ten') >= 0 && h.indexOf('tinh') < 0) || h.indexOf('name') >= 0)) t = c;
      if (l < 0 && (h.indexOf('lop') >= 0 || h.indexOf('class') >= 0)) l = c;
      if (g < 0 && (h === 'gv' || h.indexOf('giao vien') >= 0 || h.indexOf('teacher') >= 0 ||
        h.indexOf('gv chinh') >= 0 || h.indexOf('gvchinh') >= 0)) g = c;
      if (m < 0 && (h === 'mshs' || h.indexOf('ma so hoc sinh') >= 0 || h.indexOf('ma hs') >= 0)) m = c;
    }
    if (t >= 0) coTen = true;
    if (l >= 0) coLop = true;
    if (t >= 0 && l >= 0) return { tim: true, dong: d, cTen: t, cLop: l, cGv: g, cMshs: m };
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
          gv: td.cGv >= 0 ? String(data[r][td.cGv] === undefined || data[r][td.cGv] === null ? '' : data[r][td.cGv]).trim() : '',
          mshs: td.cMshs >= 0 ? String(data[r][td.cMshs] === undefined || data[r][td.cMshs] === null ? '' : data[r][td.cMshs]).trim() : ''
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
//  • File chính là nguồn chuẩn: bé không còn trong file chính tự bỏ khỏi DS HỌC SINH.
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
      gt: cu[r][3], link: cu[r][4], tick: cu[r][5], mshs: String(cu[r][6] === undefined ? '' : cu[r][6]).trim()
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
      out.push([x.ten, x.lop, x.gv || c.gv || (LOP_GV_MAP[x.lop] || ''), c.gt, c.link, c.tick, x.mshs || c.mshs]);
    } else {
      them++;
      out.push([x.ten, x.lop, x.gv || (LOP_GV_MAP[x.lop] || ''), '', '', '', x.mshs]);
    }
    if (x.gv && GV_LIST.indexOf(x.gv) < 0) gvLa[x.gv] = 1;
  });
  var boTen = [];
  for (var k = 0; k < dongCu.length; k++) if (!daDung[k]) boTen.push(dongCu[k].ten);
  var soDong = Math.max(cu.length - 2, out.length, 1);
  ds.getRange(3, 1, soDong, 7).clearContent();
  if (out.length) ds.getRange(3, 1, out.length, 7).setValues(out);
  apLocDS(ds); // chạy lại bộ lọc → dòng mới không lẫn khi GV đang lọc
  return { them: them, tongNguon: nguon.length, boTen: boTen, gvLa: Object.keys(gvLa) };
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
  if (kq.boTen.length) {
    msg += '\n• Đã bỏ ' + kq.boTen.length + ' bé không còn trong file chính: '
      + kq.boTen.slice(0, 6).join(', ') + (kq.boTen.length > 6 ? ' …' : '');
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
  var anhTheoTen = {}, anhTheoMshs = {};
  try {
    var files = DriveApp.getFolderById(m[1]).getFiles();
    while (files.hasNext()) {
      var f = files.next();
      var tenGoc = String(f.getName() || '').replace(/\.[^.]+$/, '').trim();
      var tenFile = boDau(tenGoc);
      if (!tenFile) continue;
      var urlFile = f.getUrl();
      anhTheoTen[tenFile] = { url: urlFile, tenFile: tenGoc };
      // Nhận cả "HV152-Phạm Gia Khải" lẫn "HV152 Phạm Gia Khải".
      var ma = tenGoc.match(/\b(HV\s*\d{2,})\b/i);
      if (ma) {
        var maChuan = String(ma[1]).replace(/\s+/g, '').toUpperCase();
        var tenSauMa = tenGoc.replace(/^\s*HV\s*\d{2,}\s*[-_–—]?\s*/i, '').trim();
        anhTheoMshs[maChuan] = { url: urlFile, tenFile: tenGoc, tenSauMa: tenSauMa };
      }
    }
  } catch (e) {
    baoXong('Không đọc được folder: ' + e + '\n\nKiểm tra: (1) link H1 đúng, (2) folder đã share "Bất kỳ ai có link", (3) Google hỏi quyền Drive thì bấm Advanced → Allow.');
    return;
  }
  var data = ds.getDataRange().getValues();
  var dem = 0, thieu = [], lechTen = [];
  for (var r = 2; r < data.length; r++) {
    var tenBe = String(data[r][0] === undefined || data[r][0] === null ? '' : data[r][0]).trim();
    if (!tenBe) continue;
    var mshs = String(data[r][6] === undefined || data[r][6] === null ? '' : data[r][6]).replace(/\s+/g, '').toUpperCase();
    // Ưu tiên MSHS vì tên file anh đặt "HVxxx-Họ tên"; tên chỉ là phương án dự phòng cho ảnh cũ.
    var fileTheoMa = mshs ? anhTheoMshs[mshs] : null;
    var fileTheoTen = anhTheoTen[boDau(tenBe)];
    var fileAnh = fileTheoMa || fileTheoTen;
    if (fileAnh) {
      if (fileTheoMa && fileTheoMa.tenSauMa && boDau(fileTheoMa.tenSauMa) !== boDau(tenBe)) {
        lechTen.push(mshs + ': Danh sách "' + tenBe + '" ≠ tên file "' + fileTheoMa.tenSauMa + '"');
      }
      if (String(data[r][4] === undefined || data[r][4] === null ? '' : data[r][4]).trim() !== fileAnh.url) {
        ds.getRange(r + 1, 5).setValue(fileAnh.url);
        dem++;
      }
    } else {
      thieu.push(tenBe + (mshs ? ' (' + mshs + ')' : ''));
    }
  }
  var msgXong = '🖼️ Đã gắn ' + dem + ' link ảnh mới (folder có ' + Object.keys(anhTheoTen).length + ' file)';
  if (lechTen.length) {
    msgXong += '\n\n⚠️ MSHS và họ tên chưa khớp (' + lechTen.length + '):\n• ' + lechTen.slice(0, 8).join('\n• ')
      + (lechTen.length > 8 ? '\n… và ' + (lechTen.length - 8) + ' bạn khác' : '')
      + '\n→ Ảnh vẫn được gắn theo MSHS, anh kiểm tra lại tên file giúp em.';
  }
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
      + (kqDB.boTen.length ? ', đã bỏ ' + kqDB.boTen.length + ' bé không còn trong file' : '');
  } catch (e) {}
  var bao = laySheetBaoBu(ss);
  var lich = ss.getSheetByName('LICH_BU');
  if (!bao || !lich) {
    baoXong('Chưa có sheet. Bấm menu "🔧 Nâng cấp sheet SOTW" (hoặc "Tạo sheet") trước.');
    return;
  }
  var msgXep = xepLichTam(ss, bao, lich);
  var rs = guiSOTW(false);
  baoXong(msgXep + (rs.skip ? '\n\nℹ️ SOTW: ' + rs.msg : '\n\n🏆 SOTW: ' + rs.msg) + dongBoNote);
}

// Kiểm tra thuần để có thể test trước khi ghi lịch. Cảnh báo, không tự chặn lịch.
function kiemTraDuLieuTruocKhiXep(dsBe, dsCa) {
  var kq = { thieuThongTin: 0, thieuLink: 0, canhBao: [] };
  (dsBe || []).forEach(function(be) {
    if (!String(be.tenBe || '').trim() || !String(be.lop || '').trim() || !String(be.trinhDo || '').trim()) kq.thieuThongTin++;
    if (!String(be.link || '').trim()) kq.thieuLink++;
  });
  (dsCa || []).forEach(function(ca) {
    if (Number(ca.bes || 0) > CFG.TOI_DA_CA) kq.canhBao.push(ca.ma + ' quá 4 bé');
    if (Number(ca.trinhDos || 0) > CFG.TOI_DA_TRINH_DO) kq.canhBao.push(ca.ma + ' quá 2 trình độ');
  });
  for (var i = 0; i < (dsCa || []).length; i++) for (var j = i + 1; j < dsCa.length; j++) {
    var a = dsCa[i], b = dsCa[j];
    if (a.gv === b.gv && a.thu === b.thu && khoangGioTrung(a.gio, b.gio)) kq.canhBao.push(a.gv + ' trùng giờ: ' + a.ma + ' / ' + b.ma);
  }
  return kq;
}
function khoangGioTrung(a, b) {
  function phut(s) { var m = String(s || '').match(/(\d{1,2})[h:](\d{2}).*?[-–].*?(\d{1,2})[h:](\d{2})/); return m ? [parseInt(m[1],10)*60+parseInt(m[2],10), parseInt(m[3],10)*60+parseInt(m[4],10)] : null; }
  var x = phut(a), y = phut(b); return !!(x && y && x[0] < y[1] && y[0] < x[1]);
}

// Chỉ kiểm tra các rủi ro PHÁT SINH từ ca đặc biệt; quản lý luôn được quyền xác nhận tiếp tục.
function taoCanhBaoCaDacBiet(lich, beDacBiet) {
  var caTheoMa = {}, canhBao = [], daBao = {};
  function themCa(ca, trinhDo) {
    if (!caTheoMa[ca.ma]) caTheoMa[ca.ma] = { ma:ca.ma, thu:ca.thu, gio:ca.gio, gv:ca.gv, bes:0, trinhDo:{} };
    caTheoMa[ca.ma].bes++;
    if (trinhDo) caTheoMa[ca.ma].trinhDo[trinhDo] = 1;
  }
  var rows = lich.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0] || String(rows[i][8] || '').indexOf('❌ Nghỉ') >= 0) continue;
    themCa({ ma:rows[i][0], thu:rows[i][1], gio:rows[i][2], gv:rows[i][3] }, rows[i][6]);
  }
  (beDacBiet || []).forEach(function(be) { themCa(be.caDacBiet, be.trinhDo); });
  var dsCa = Object.keys(caTheoMa).map(function(ma) { return caTheoMa[ma]; });
  (beDacBiet || []).forEach(function(be) {
    var ca = caTheoMa[be.caDacBiet.ma];
    if (ca.bes > CFG.TOI_DA_CA && !daBao['suc'+ca.ma]) {
      canhBao.push(ca.ma + ' quá ' + CFG.TOI_DA_CA + ' bé (' + ca.bes + ' bé)'); daBao['suc'+ca.ma] = 1;
    }
    if (Object.keys(ca.trinhDo).length > CFG.TOI_DA_TRINH_DO && !daBao['td'+ca.ma]) {
      canhBao.push(ca.ma + ' quá ' + CFG.TOI_DA_TRINH_DO + ' trình độ'); daBao['td'+ca.ma] = 1;
    }
    dsCa.forEach(function(khac) {
      if (khac.ma === ca.ma || khac.gv !== ca.gv || khac.thu !== ca.thu || !khoangGioTrung(khac.gio, ca.gio)) return;
      var key = 'trung' + [ca.ma, khac.ma].sort().join('|');
      if (!daBao[key]) {
        canhBao.push(ca.gv + ' trùng giờ: ' + ca.ma + ' / ' + khac.ma);
        if (khac.bes >= CFG.TOI_DA_CA) canhBao.push(khac.ma + ' quá ' + CFG.TOI_DA_CA + ' bé (' + khac.bes + ' bé), không còn chỗ trống');
        daBao[key] = 1;
      }
    });
  });
  return canhBao;
}

function xepLichChinh(ss, bao, lich, daKiemTra) {
  // Lượt đầu chỉ kiểm tra. Lượt sau mới dọn lịch cũ, rồi đọc lại BAO_BU để xếp.
  // Nhờ vậy nếu quản lý bấm Không thì không dữ liệu nào bị thay đổi.
  var daCo = daKiemTra ? giuLaiDongDaChot(lich, bao) : 0;

  // 2. Đọc bé chưa xếp
  var data = bao.getDataRange().getValues();
  if (data.length < 2) return 'Chưa có bé nào báo bù.';
  var chuaXep = [];
  var coDacBiet = []; // Bé có Ca đặc biệt → xếp trước, không check capacity
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var trangThai = (r[6] || '').toString().trim();
    var tenBe = (r[3] || '').toString().trim().toLowerCase(); // thứ tự mới: C=Lớp, D=Tên bé
    if (!tenBe) continue;
    if ((r[8] || '').toString().indexOf(DAU_MAU) >= 0) continue;
    if (tenBe.indexOf('ghi chú mẫu') >= 0 || tenBe.indexOf('không bù') === 0) continue;
    if (trangThai === '' || trangThai === 'Chờ') {
      var caDacBiet = parseCaDacBiet(r[10]); // cột K = index 10
      var beObj = { dong: i + 1, gvBao: r[1], tenBe: r[3], lop: r[2], trinhDo: r[4], link: r[5], ghiChu: r[8], caDacBiet: caDacBiet, gvBuUuTien: String(r[11] || '').trim() };
      if (caDacBiet) {
        coDacBiet.push(beObj);
      } else {
        chuaXep.push(beObj);
      }
    }
  }
  
  // Kiểm tra dữ liệu trước khi ghi lịch. Thiếu dữ liệu/cảnh báo vẫn cho quản lý quyết định tiếp tục.
  var kiemTra = kiemTraDuLieuTruocKhiXep(coDacBiet.concat(chuaXep), []);
  if (!daKiemTra && (kiemTra.thieuThongTin || kiemTra.thieuLink)) {
    var canhBaoNhap = '⚠️ Kiểm tra trước khi gom lịch:\n• Thiếu tên/lớp/trình độ: ' + kiemTra.thieuThongTin + ' bé\n• Chưa có link Canva: ' + kiemTra.thieuLink + ' bé\n\nVẫn xếp lịch chứ?';
    if (!xacNhan(canhBaoNhap)) return 'Đã dừng gom lịch để kiểm tra dữ liệu.';
  }

  // Ca đặc biệt không tự chặn, nhưng phải báo RÕ quá tải/trùng giờ trước khi ghi lịch.
  var caCanhBao = taoCanhBaoCaDacBiet(lich, coDacBiet);
  if (!daKiemTra && caCanhBao.length) {
    var canhBaoCa = '⚠️ CẢNH BÁO CA ĐẶC BIỆT:\n• ' + caCanhBao.join('\n• ')
      + '\n\nVẫn xếp các ca đặc biệt này chứ?';
    if (!xacNhan(canhBaoCa)) return 'Đã dừng gom lịch để kiểm tra cảnh báo ca đặc biệt.';
  }

  // Lần đầu chỉ kiểm tra. Sau khi quản lý đồng ý, chạy lại một lượt để dọn rồi ĐỌC LẠI bé cần xếp.
  // Nhờ vậy không có bé nào bị mất khỏi danh sách chỉ vì lịch cũ vừa được dọn.
  if (!daKiemTra) return xepLichChinh(ss, bao, lich, true);

  // 3. Xếp bé có Ca đặc biệt TRƯỚC (ưu tiên cao nhất)
  var stt = 0;
  coDacBiet.forEach(function (be) {
    themBeVaoLich(lich, bao, be, be.caDacBiet);
    stt++;
  });
  
  if (chuaXep.length === 0) {
    return 'Đã xếp ' + stt + ' bé (ca đặc biệt).';
  }

  chuaXep.sort(function (a, b) {
    var au = LOP_DUC_ANH.indexOf(a.lop) >= 0 ? 0 : 1;
    var bu = LOP_DUC_ANH.indexOf(b.lop) >= 0 ? 0 : 1;
    if (au !== bu) return au - bu;
    if (a.trinhDo < b.trinhDo) return -1;
    if (a.trinhDo > b.trinhDo) return 1;
    return 0;
  });

  var caList = layDanhSachCa(ss);
  var uuTienTheoLop = layGvBuUuTienTheoLop(ss);
  // Ô “GV dạy bù ưu tiên” của TỪNG BÉ (cột L) luôn được ưu tiên hơn cài đặt theo lớp.
  chuaXep.forEach(function(be) { be.gvBuUuTien = be.gvBuUuTien || uuTienTheoLop[be.lop] || ''; });
  // Gom bé cùng GV dạy bù ưu tiên trước để máy tận dụng đúng các ca của GV đó.
  chuaXep.sort(function(a, b) {
    if (a.gvBuUuTien && !b.gvBuUuTien) return -1;
    if (!a.gvBuUuTien && b.gvBuUuTien) return 1;
    if (a.gvBuUuTien !== b.gvBuUuTien) return String(a.gvBuUuTien).localeCompare(String(b.gvBuUuTien));
    return String(a.trinhDo).localeCompare(String(b.trinhDo));
  });

  var beDu = [];
  chuaXep.forEach(function (be) {
    var ca = chonCaChoBe(be, caList, lich);
    if (ca) {
      themBeVaoLich(lich, bao, be, ca);
      stt++;
    } else {
      beDu.push(be);
    }
  });

  beDu.forEach(function (be) {
    bao.getRange(be.dong, 7).setValue('Tuần sau');
    bao.getRange(be.dong, 9).setValue('Hết chỗ các ca, tự đẩy sang tuần sau');
  });

  toDoCa3TrinhDo(lich);

  var msg = 'Đã xếp ' + stt + ' bé';
  if (coDacBiet.length > 0) msg += ' (' + coDacBiet.length + ' ca đặc biệt + ' + (stt - coDacBiet.length) + ' ca thường)';
  msg += ' vào ' + (caList.length + coDacBiet.length) + ' ca.';
  if (beDu.length) msg += '\nDư ' + beDu.length + ' bé → đẩy sang tuần sau.';
  msg += '\nBước tiếp: mở tab LICH_BU, copy cột "Tin nhắn PH" gửi Zalo cho PH.';
  return msg;
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

  // Nếu lớp có GV dạy bù ưu tiên, chỉ xét các ca của đúng GV đó trước.
  var uuTien = String(be.gvBuUuTien || '').trim();
  var theoUuTien = uuTien ? caList.filter(function(ca) { return ca.gv === uuTien; }) : [];
  var thuTuCa = theoUuTien.concat(caList.filter(function(ca) { return ca.gv !== uuTien; }));

  // Lượt 1: ghép đúng trình độ vào ca đã có trước; không để ca trống chen lên đầu.
  for (var k = 0; k < thuTuCa.length; k++) {
    var ca = thuTuCa[k], trong = beTrongCa(ca.ma);
    if (trong.length >= (ca.toiDaBe || CFG.TOI_DA_CA)) continue;
    var trinhDos = {};
    trong.forEach(function (x) { trinhDos[x.trinhDo] = 1; });
    var ds = Object.keys(trinhDos);
    if (ds.length && ds.indexOf(be.trinhDo) >= 0) return ca;
  }
  // Lượt 2: thêm trình độ mới vào một ca đang chạy nếu vẫn trong giới hạn.
  for (var j = 0; j < thuTuCa.length; j++) {
    var ca2 = thuTuCa[j], trong2 = beTrongCa(ca2.ma);
    if (!trong2.length || trong2.length >= (ca2.toiDaBe || CFG.TOI_DA_CA)) continue;
    var td2 = {};
    trong2.forEach(function (x) { td2[x.trinhDo] = 1; });
    if (Object.keys(td2).length < (ca2.toiDaTrinhDo || CFG.TOI_DA_TRINH_DO)) return ca2;
  }
  // Lượt 3: khi chưa có ca phù hợp đang chạy mới mở ca trống.
  for (var m = 0; m < thuTuCa.length; m++) {
    if (beTrongCa(thuTuCa[m].ma).length < (thuTuCa[m].toiDaBe || CFG.TOI_DA_CA)) return thuTuCa[m];
  }
  return null;
}

function themBeVaoLich(lich, bao, be, ca) {
  var ngayHoc = ca.dacBiet ? layNgayThuBatKy(ca.thu) : layNgayThu(ca.thu);
  var ghiChu = (be.ghiChu || '').toString().trim();
  // Tin PH/GV để trống khi gom lịch: quản lý có thể sửa ca/GV/giờ trước khi chốt.
  // Chỉ nút “Chốt lịch → tạo tin PH / GV” mới tạo nội dung theo dữ liệu cuối cùng trong LICH_BU.
  lich.appendRow([ca.ma, ca.thu, ca.gio, ca.gv, be.tenBe, be.lop, be.trinhDo, be.link, 'Chờ Ms. Vân Anh', '', '', '', ghiChu, ngayHoc, '', '']);
  lich.getRange(1, 16).setValue('Đã chốt lịch lúc').setFontWeight('bold').setBackground('#F6F3EE');
  // Lưu ngày học ngay khi xếp: backup dùng ngày này để phân biệt hai buổi trùng ca/tên trong tháng.
  lich.getRange(1, 14).setValue('Ngày học').setFontWeight('bold').setBackground('#F6F3EE');
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
  if (header.length === 13) header.push('Ngày học'); // thêm ở cuối, không làm lệch cột cũ
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
  var gvCanBao = GV_LIST.slice(); // Ms. Hồng Anh đã được xoá khỏi GV_LIST.
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
  if (!guiTelegramSOTW(tin)) {
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

// ===== CHỐT LỊCH → TẠO TIN PH / GV =====
// Đọc LICH_BU tại thời điểm bấm nút, nên tin luôn khớp với ca/GV/giờ sau khi quản lý sửa tay.
function chotLichTaoTin() {
  var lich = laySS().getSheetByName('LICH_BU');
  if (!lich) { baoXong('Chưa có tab LICH_BU.'); return; }
  var data = lich.getDataRange().getValues(), dem = 0;
  var luc = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM HH:mm');
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!String(r[4] || '').trim()) continue;
    var ngayHoc = String(r[13] || '').trim() || layNgayThu(r[1]);
    var tinPH = 'Dạ em chào chị, em xin thông báo lịch học bù cho bé ' + r[4] + ':\n'
      + '• Thời gian: ' + r[1] + ' ngày ' + ngayHoc + ' lúc ' + r[2] + '\n'
      + 'Dạ thời gian này chị có sắp xếp đưa bé đến Trung tâm học bù được không ạ?\n'
      + 'Nhờ chị xác nhận giúp em trước ' + CFG.HAN_PH_XAC_NHAN + ' nhé!\nEm cám ơn chị ạ.';
    var ghiChu = String(r[12] || '').trim();
    var tinGV = '📚 [' + r[1] + ' ' + r[2] + '] ' + r[3] + ' dạy bù: bé ' + r[4]
      + ' (' + r[5] + ' - ' + r[6] + '). Slide: ' + (r[7] || '(chưa có link)')
      + (ghiChu ? '\n📌 Ghi chú: ' + ghiChu : '');
    lich.getRange(i + 1, 10).setValue(tinPH);
    lich.getRange(i + 1, 11).setValue(tinGV);
    // Chốt lại nghĩa là nội dung lịch đã được kiểm tra lần cuối.
    // Xóa mốc gửi cũ để nếu đã gửi trước đó, tin mới vẫn được gửi lại đúng nội dung.
    lich.getRange(i + 1, 15).clearContent();
    lich.getRange(i + 1, 16).setValue(luc);
    dem++;
  }
  baoXong('✅ Đã chốt lịch và tạo lại tin PH/GV cho ' + dem + ' bé. Giờ anh kiểm tra cột J/K, sau đó mới gửi lịch cho GV.');
}

// ===== GỬI TIN CHO GV (ca đã ✅) =====
// Gửi các ca mới; force=true chỉ dùng sau xác nhận để gửi lại toàn bộ ca đã chốt.
function dongBoCaCuoiVeBaoBu(ss, bao, lich, rows, luc) {
  var loi=[];
  (rows||[]).forEach(function(r){
    var maBuoi=String(lich.getRange(r,18).getValue()||'').trim(), dong=dongBaoTheoMa(ss,bao,maBuoi);
    if(!dong){loi.push('Không tìm thấy dòng BAO_BU của mã buổi '+(maBuoi||'(thiếu mã)'));return;}
    var nhan=String(lich.getRange(r,17).getValue()||'').trim();
    bao.getRange(dong,8).setValue(nhan);
    bao.getRange(dong,7).setValue('Đã báo GV');
  });
  return loi;
}
function guiTinChoGV(force) {
  var ss = laySS(), lich = ss.getSheetByName('LICH_BU'), bao=ss.getSheetByName('BAO_BU');
  if (!lich || !bao) { baoXong('Chưa có tab LICH_BU hoặc BAO_BU.'); return; }
  damBaoCotCaLich(ss,lich);
  if (String(lich.getRange(1, 15).getValue() || '').trim() !== 'Đã gửi GV lúc') {
    lich.getRange(1, 15).setValue('Đã gửi GV lúc').setFontWeight('bold').setBackground('#F6F3EE');
  }
  if (String(lich.getRange(1, 16).getValue() || '').trim() !== 'Đã chốt lịch lúc') {
    lich.getRange(1, 16).setValue('Đã chốt lịch lúc').setFontWeight('bold').setBackground('#F6F3EE');
  }
  var data = lich.getDataRange().getValues(), theoCa = {}, chuaChot = 0;
  for (var i = 1; i < data.length; i++) {
    var st = String(data[i][8] || ''), daGui = String(data[i][14] || '');
    if (st.indexOf('✅') < 0 && st.indexOf('Đi được') < 0) continue;
    if (String(data[i][15] || '').indexOf('GV:') !== 0) { chuaChot++; continue; }
    if (!force && daGui) continue;
    var ma = data[i][0];
    if (!theoCa[ma]) theoCa[ma] = { thu:data[i][1], gio:data[i][2], gv:data[i][3], bes:[], rows:[] };
    theoCa[ma].bes.push({ ten:data[i][4], lop:data[i][5], td:data[i][6], link:data[i][7], ghiChu:data[i][12] });
    theoCa[ma].rows.push(i + 1);
  }
  var keys = Object.keys(theoCa);
  if (!keys.length) {
    if (chuaChot) baoXong('Có ' + chuaChot + ' bé PH đã chốt nhưng lịch chưa được chốt nội dung. Bấm 4️⃣ Chốt lịch → tạo tin PH / GV sau khi kiểm tra lại ca/GV/giờ.');
    else baoXong(force ? 'Chưa có ca nào được chốt ✅.' : 'Không có tin GV mới. Các ca đã chốt đều đã gửi rồi.');
    return;
  }
  var dem = 0, luc = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM HH:mm');
  keys.forEach(function(ma) {
    var c = theoCa[ma], tin = '📚 [HỌC BÙ ' + c.thu + ' ' + c.gio + '] ' + c.gv + ' dạy:\n';
    c.bes.forEach(function(b, idx) { tin += (idx+1) + '. ' + b.ten + ' (' + b.lop + ' - ' + b.td + ')\n   Slide: ' + (b.link || '(chưa có)') + '\n'; });
    var noteMap = {}, noteOrder = [];
    c.bes.forEach(function(b) { var n=String(b.ghiChu||'').trim(); if (!n) return; if (!noteMap[n]) { noteMap[n]=[]; noteOrder.push(n); } if (b.lop && noteMap[n].indexOf(b.lop)<0) noteMap[n].push(b.lop); });
    noteOrder.forEach(function(n) { tin += '📌 Ghi chú' + (noteMap[n].length ? ' ('+noteMap[n].join(', ')+')' : '') + ': ' + n + '\n'; });
    if (guiTelegram(tin)) {
      c.rows.forEach(function(r) { lich.getRange(r,15).setValue(luc); });
      var loiDongBo=dongBoCaCuoiVeBaoBu(ss,bao,lich,c.rows,luc);
      if(loiDongBo.length) Logger.log('Đã gửi GV nhưng chưa đồng bộ BAO_BU: '+loiDongBo.join(' | '));
      c.loiDongBo=loiDongBo; dem++;
    }
  });
  var canhBao=[]; keys.forEach(function(ma){if(theoCa[ma].loiDongBo && theoCa[ma].loiDongBo.length) canhBao=canhBao.concat(theoCa[ma].loiDongBo);});
  baoXong('Đã gửi ' + dem + '/' + keys.length + ' tin cho GV' + (force ? ' (gửi lại)' : ' mới') + '.' + (canhBao.length ? '\n⚠️ Tin đã gửi nhưng chưa đồng bộ được BAO_BU:\n• '+canhBao.join('\n• ')+'\nKhông gửi lại tin; kiểm tra Mã buổi rồi chạy đồng bộ lại.' : ''));
}
function guiLaiTinChoGV() { if (xacNhan('Gửi LẠI toàn bộ tin cho các ca đã chốt?')) guiTinChoGV(true); }

// Bảng việc cần làm, không tạo thêm tab.
function tongQuanCongViec() {
  var lich = laySS().getSheetByName('LICH_BU');
  if (!lich) { baoXong('Chưa có tab LICH_BU.'); return; }
  var d=lich.getDataRange().getValues(), cho=0, doi=0, chuaGui={}, chuaCham=0;
  for(var i=1;i<d.length;i++) { if(!d[i][4])continue; var st=String(d[i][8]||''), daDay=String(d[i][11]||''); if(!st||st.indexOf('Chờ')===0)cho++; if(st.indexOf('Xin đổi')>=0)doi++; if((st.indexOf('✅')>=0||st.indexOf('Đi được')>=0)&&!d[i][14])chuaGui[d[i][0]]=1; if((st.indexOf('✅')>=0||st.indexOf('Đi được')>=0)&&!daDay)chuaCham++; }
  baoXong('📌 HÔM NAY CẦN LÀM GÌ?\n• Chờ PH xác nhận: '+cho+' bé\n• PH xin đổi: '+doi+' bé\n• Ca đã chốt chưa gửi GV: '+Object.keys(chuaGui).length+' ca\n• Bé chưa chấm Đã học/Vắng: '+chuaCham+' bé');
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
  var gvCanBao = GV_LIST.slice(); // Ms. Hồng Anh đã được xoá khỏi GV_LIST.
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
function backupTuanBuNoiBo(imLang) {
  function ketQua(m, ok) {
    var kq = { ok: ok !== false, msg: m };
    if (imLang === true) return kq;
    baoXong(m);
    return kq;
  }

  var ss = laySS();
  try { chuyenCotMoiBAOBU(ss.getSheetByName('BAO_BU')); } catch (e) {} // sheet cũ → đổi cột trước
  var lich = ss.getSheetByName('LICH_BU');
  if (!lich) return ketQua('Chưa có sheet LICH_BU.', false);

  var homNay = new Date();
  var thang = Utilities.formatDate(homNay, 'GMT+7', 'MM-yyyy');
  var tenBackup = 'Backup tháng ' + thang;
  var backup = ss.getSheetByName(tenBackup);
  if (!backup) {
    backup = ss.insertSheet(tenBackup);
    backup.appendRow(['Ngày backup', 'Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'PH xác nhận', 'Đã dạy', 'Ngày học']);
    backup.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#F6F3EE');
  } else if (String(backup.getRange(1, 10).getValue() || '').trim() !== 'Ngày học') {
    // Backup cũ: thêm cột Ngày học ở CUỐI để không làm lệch các cột báo cáo hiện có.
    backup.insertColumnsAfter(9, 1);
    backup.getRange(1, 10).setValue('Ngày học').setFontWeight('bold').setBackground('#F6F3EE');
  }

  var ngay = Utilities.formatDate(homNay, 'GMT+7', 'dd/MM/yyyy');
  function ngayHocCua(r) { return String(r[13] || '').trim() || ngay; }
  function khoaBackup(ngayHoc, r) { return [ngayHoc, r[0], r[1], r[2], r[3], r[4]].join('|'); }

  // Khóa: Ngày học|Ca|Thứ|Giờ|GV|Tên bé — không lẫn hai buổi khác ngày.
  var daCo = {};
  var dataCu = backup.getDataRange().getValues();
  for (var c = 1; c < dataCu.length; c++) {
    var k = [dataCu[c][9], dataCu[c][1], dataCu[c][2], dataCu[c][3], dataCu[c][4], dataCu[c][5]].join('|');
    if (k !== '|||||') daCo[k] = 1;
  }

  var dataLich = lich.getDataRange().getValues();
  var demTong = 0, demMoi = 0;
  for (var i = 1; i < dataLich.length; i++) {
    if (!dataLich[i][4]) continue;
    var st = (dataLich[i][8] || '').toString().trim();
    if (st === '' || st.indexOf('Chờ') === 0) continue;
    demTong++;
    var ngayHoc = ngayHocCua(dataLich[i]);
    var key = khoaBackup(ngayHoc, dataLich[i]);
    if (daCo[key]) continue;
    backup.appendRow([ngay, dataLich[i][0], dataLich[i][1], dataLich[i][2], dataLich[i][3],
      dataLich[i][4], dataLich[i][5], st, dataLich[i][11], ngayHoc]);
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

// Hàm công khai cho nút/trigger. Luôn trả kết quả rõ để Làm mới tuần biết có được phép xoá hay không.
function backupTuanBu(imLang) {
  try {
    return backupTuanBuNoiBo(imLang);
  } catch (e) {
    var kq = { ok: false, msg: '❌ Backup gặp lỗi: ' + e };
    if (imLang !== true) baoXong(kq.msg);
    return kq;
  }
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

  // 1. TỰ BACKUP trước khi xoá. Lỗi thật → DỪNG ngay, tuyệt đối không động vào lịch.
  var kqBackup = backupTuanBu(true);
  if (!kqBackup || kqBackup.ok === false) {
    baoXong('⛔ DỪNG làm mới tuần: backup chưa hoàn tất.\n'
      + ((kqBackup && kqBackup.msg) || 'Không nhận được kết quả backup.')
      + '\n\nBAO_BU và LICH_BU vẫn được giữ nguyên. Hãy xử lý backup rồi bấm lại.');
    return;
  }
  var msgBackup = kqBackup.msg;

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
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy', 'Ghi chú', 'Ngày học', 'Đã gửi GV lúc', 'Đã chốt lịch lúc', 'Ca xếp (chọn)', 'Mã buổi']);
  lich.getRange(1, 1, 1, 18).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(lich, 9, 200, PH_TRANG_THAI);
  datDropdown(lich, 12, 200, DA_DAY);
  datDropdownCaLich(ss, lich);

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
function tinhSoGio(gioStr) {
  var m = String(gioStr || '').match(/(\d+)h(\d+).*?-.*?(\d+)h(\d+)/);
  if (!m) return 0;
  return (parseInt(m[3], 10) + parseInt(m[4], 10) / 60) - (parseInt(m[1], 10) + parseInt(m[2], 10) / 60);
}

// Tổng hợp thuần: chỉ "Đã học" mới tính giờ/c a; Vắng và Nghỉ tách riêng.
function tongHopBaoCaoBackup(data) {
  var kq = { daHoc: 0, vang: 0, nghi: 0, chuaChot: 0, gioTheoGV: {}, caTheoGV: {} }, caDaTinh = {};
  for (var i = 1; i < (data || []).length; i++) {
    var r = data[i], ketQua = String(r[8] || '').toLowerCase(), ph = String(r[7] || '').toLowerCase();
    var gv = String(r[4] || '').trim();
    if (ketQua.indexOf('đã học') >= 0 || ketQua.indexOf('da hoc') >= 0) {
      kq.daHoc++;
      var key = [r[0], r[1], r[4], r[3]].join('|');
      if (!caDaTinh[key]) { caDaTinh[key] = 1; kq.gioTheoGV[gv] = (kq.gioTheoGV[gv] || 0) + tinhSoGio(r[3]); kq.caTheoGV[gv] = (kq.caTheoGV[gv] || 0) + 1; }
    } else if (ketQua.indexOf('vắng') >= 0 || ketQua.indexOf('vang') >= 0) kq.vang++;
    else if (ketQua.indexOf('nghỉ') >= 0 || ketQua.indexOf('nghi') >= 0 || ph.indexOf('nghỉ') >= 0) kq.nghi++;
    else kq.chuaChot++;
  }
  return kq;
}
function lamMoiThongKeChonThang() {
  var ui = SpreadsheetApp.getUi();
  var traLoi = ui.prompt('Chọn tháng báo cáo', 'Nhập theo dạng MM-yyyy, ví dụ 11-2026:', ui.ButtonSet.OK_CANCEL);
  if (traLoi.getSelectedButton() !== ui.Button.OK) return;
  lamMoiThongKeTheoThang(traLoi.getResponseText());
}
function lamMoiThongKe() {
  var thang = Utilities.formatDate(new Date(), 'GMT+7', 'MM-yyyy');
  return lamMoiThongKeTheoThang(thang);
}
function lamMoiThongKeTheoThang(thang) {
  thang = String(thang || '').trim();
  if (!/^\d{2}-\d{4}$/.test(thang)) { baoXong('Tháng chưa đúng dạng MM-yyyy, ví dụ 11-2026.'); return; }
  var ss = laySS(), tenBackup = 'Backup tháng ' + thang, backup = ss.getSheetByName(tenBackup);
  if (!backup) { baoXong('Chưa có sheet "' + tenBackup + '". Hãy kiểm tra tháng đã nhập hoặc backup tháng đó trước.'); return; }
  var tk = ss.getSheetByName('THỐNG KÊ') || ss.insertSheet('THỐNG KÊ');
  tk.clear();
  var data = backup.getDataRange().getValues(), tong = tongHopBaoCaoBackup(data), gvSet = {};
  GV_LIST.forEach(function(gv) { gvSet[gv] = 1; });
  Object.keys(tong.gioTheoGV).forEach(function(gv) { gvSet[gv] = 1; });
  var dsGV = Object.keys(gvSet), dong = 4;
  tk.getRange(1, 1).setValue('THỐNG KÊ DẠY BÙ THÁNG ' + thang).setFontSize(14).setFontWeight('bold');
  tk.getRange(3, 1, 1, 3).setValues([['GV dạy', 'Số ca đã dạy', 'Tổng giờ thực']]).setFontWeight('bold').setBackground('#F6F3EE');
  var dongGV = dsGV.map(function(gv) { return [gv, tong.caTheoGV[gv] || 0, tong.gioTheoGV[gv] || 0]; });
  if (dongGV.length) tk.getRange(dong, 1, dongGV.length, 3).setValues(dongGV);
  var tongDong = dong + dongGV.length + 2;
  tk.getRange(tongDong, 1, 6, 2).setValues([
    ['Tổng bé đã học', tong.daHoc], ['Bé vắng', tong.vang], ['Bé nghỉ', tong.nghi], ['Chưa chốt kết quả', tong.chuaChot],
    ['Tổng số ca đã dạy', Object.keys(tong.caTheoGV).reduce(function(s, gv) { return s + tong.caTheoGV[gv]; }, 0)],
    ['Tổng số giờ thực', Object.keys(tong.gioTheoGV).reduce(function(s, gv) { return s + tong.gioTheoGV[gv]; }, 0)]
  ]);
  tk.getRange(tongDong, 1, 6, 1).setFontWeight('bold');
  baoXong('Đã làm mới THỐNG KÊ tháng ' + thang + '. Giờ chỉ tính bé “Đã học”; Vắng/Nghỉ được tách riêng.');
}

// ===== TELEGRAM =====
function guiTelegramDenBangToken(text, groupId, topicId, nhan, token) {
  if (!token) {
    baoXong('Chưa có token cho ' + (nhan || 'bot') + '.');
    return false;
  }
  if (text.length > 4000) text = text.substring(0, 4000) + '…';
  var url = 'https://api.telegram.org/bot' + token + '/sendMessage';

  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      muteHttpExceptions: true,
      payload: { chat_id: groupId, message_thread_id: topicId, text: text }
    });
    if (res.getResponseCode() !== 200) {
      baoXong((nhan || 'Telegram') + ' báo lỗi ' + res.getResponseCode() + ': ' + res.getContentText());
      return false;
    }
    return true;
  } catch (err) {
    baoXong('Không gửi được ' + (nhan || 'Telegram') + ': ' + err);
    return false;
  }
}

// Dạy Bù dùng bot RIÊNG; không được rơi về TELEGRAM_BOT_TOKEN cũ.
function layDichDayBu() {
  var p = PropertiesService.getScriptProperties();
  var token = String(p.getProperty('DAY_BU_BOT_TOKEN') || '').trim();
  if (!token) {
    baoXong('Chưa có DAY_BU_BOT_TOKEN. Anh tạo/dán token bot Dạy Bù riêng trong Thuộc tính tập lệnh; SOTW vẫn không bị ảnh hưởng.');
    return null;
  }
  return { token: token, groupId: CFG.GROUP_ID, topicId: CFG.TOPIC_ID };
}

// Tin vận hành Dạy Bù: chỉ gửi bằng bot Dạy Bù riêng vào Topic Dạy Bù.
function guiTelegram(text) {
  var dich = layDichDayBu();
  if (!dich) return false;
  return guiTelegramDenBangToken(text, dich.groupId, dich.topicId, 'Telegram Dạy Bù', dich.token);
}

// Chỉ SOTW đi sang topic riêng trong nhóm Office - Joy.
function layDichSOTW(canLayTopic) {
  var p = PropertiesService.getScriptProperties();
  // SOTW bắt buộc dùng token RIÊNG. Tuyệt đối không rơi về TELEGRAM_BOT_TOKEN
  // vì property đó từng là bot chấm công và sẽ đọc/gửi nhầm luồng.
  var token = String(p.getProperty('SOTW_BOT_TOKEN') || '').trim();
  var groupId = String(p.getProperty('SOTW_CHAT_ID') || '').trim();
  var topicId = String(p.getProperty('SOTW_THREAD_ID') || '').trim();
  if (!token) {
    baoXong('Chưa có SOTW_BOT_TOKEN. Anh vào Thuộc tính tập lệnh và dán token của @joy_lichlam_sotw_daybu_bot.');
    return null;
  }
  if (!groupId || !/^-?\d+$/.test(groupId)) {
    baoXong('Chưa có SOTW_CHAT_ID. Anh cần cài mã nhóm Office - Joy trước.');
    return null;
  }
  if (!canLayTopic && (!topicId || !/^\d+$/.test(topicId))) {
    baoXong('Chưa có SOTW_THREAD_ID. Hãy gửi “test SOTW” trong Topic SOTW_3 rồi bấm nút 🔎 Lấy Topic SOTW_3 từ tin test.');
    return null;
  }
  return { token: token, groupId: groupId, topicId: topicId ? Number(topicId) : null };
}

function guiTelegramSOTW(text) {
  var dich = layDichSOTW(false);
  if (!dich) return false;
  return guiTelegramDenBangToken(text, dich.groupId, dich.topicId, 'Telegram SOTW', dich.token);
}

function testGuiTelegram() {
  if (guiTelegram('✅ Bot Dạy Bù đã vào nhóm thành công!')) baoXong('Gửi thử Dạy Bù thành công ✅');
}

// Chỉ kiểm tra bot SOTW riêng, không đụng token bot Dạy Bù/chấm công.
// Tên hiển thị của bot có thể đổi, còn @username Telegram có thể vẫn là tên cũ.
function kiemTraBotVaTopicSOTW() {
  var dich = layDichSOTW(false);
  if (!dich) return false;
  try {
    var me = UrlFetchApp.fetch('https://api.telegram.org/bot' + dich.token + '/getMe', { muteHttpExceptions: true });
    if (me.getResponseCode() !== 200) {
      baoXong('Không đọc được bot đang dùng: ' + me.getContentText());
      return false;
    }
    var bot = JSON.parse(me.getContentText()).result || {};
    var tenBot = bot.username ? '@' + bot.username : '(không rõ tên bot)';
    // Token đã tách riêng ở SOTW_BOT_TOKEN. Không khóa cứng @username vì BotFather
    // có thể đổi tên hiển thị/username sau khi code đã được triển khai.
    var text = '🧪 Kiểm tra SOTW_3\nBot SOTW đang dùng: ' + tenBot
      + '\nĐích: Office - Joy → Topic SOTW_3\nNếu anh thấy tin này đúng topic thì đã xong ✅';
    if (guiTelegramSOTW(text)) {
      baoXong('Đã gửi thử bằng ' + tenBot + '. Kiểm tra topic SOTW trong Office - Joy.');
      return true;
    }
    return false;
  } catch (err) {
    baoXong('Không kiểm tra được bot/topic: ' + err);
    return false;
  }
}

function testGuiTelegramSOTW() {
  return kiemTraBotVaTopicSOTW();
}

// Đọc tin "test SOTW" mới nhất mà chính bot nhận được để lấy mã topic thật.
// Chỉ dùng khi Telegram báo "message thread not found" sau khi đổi topic.
function layMaTopicSOTW() {
  var p = PropertiesService.getScriptProperties();
  var dich = layDichSOTW(true); // lúc dò topic chưa cần SOTW_THREAD_ID
  if (!dich) return false;
  try {
    var url = 'https://api.telegram.org/bot' + dich.token + '/getUpdates?limit=100&allowed_updates=%5B%22message%22%5D';
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) { baoXong('Không đọc được tin Telegram: ' + res.getContentText()); return false; }
    var data = JSON.parse(res.getContentText());
    var ds = data.result || [];
    for (var i = ds.length - 1; i >= 0; i--) {
      var msg = ds[i].message;
      if (!msg || !msg.chat || String(msg.chat.id) !== dich.groupId) continue;
      if (String(msg.text || '').trim().toLowerCase().indexOf('test sotw') < 0) continue;
      if (!msg.message_thread_id) {
        baoXong('Bot đã thấy tin test SOTW, nhưng tin này không nằm trong Topic. Anh mở đúng Topic SOTW rồi gửi lại “test SOTW”.');
        return false;
      }
      p.setProperty('SOTW_THREAD_ID', String(msg.message_thread_id));
      baoXong('Đã lấy được mã Topic SOTW_3: ' + msg.message_thread_id + '. Đã tự lưu; giờ anh chạy nút Gửi thử topic SOTW.');
      return msg.message_thread_id;
    }
    baoXong('Bot SOTW chưa thấy tin “test SOTW”. Kiểm tra bot của SOTW_BOT_TOKEN đã ở group Office - Joy, rồi gửi lại đúng câu đó trong Topic SOTW_3 và chạy lại nút này.');
    return false;
  } catch (err) {
    baoXong('Không lấy được mã Topic SOTW: ' + err);
    return false;
  }
}


// ===== WORKFLOW DẠY BÙ 2 GIAI ĐOẠN =====
// CÀI ĐẶT CA DẠY BÙ là nguồn chuẩn; nhãn giúp quản lý chọn đúng một ca mà vẫn
// lưu riêng mã/thứ/giờ/GV cho backup, báo cáo và tin nhắn.
function nhanCaDayBu(ma, thu, gio, gv) { return [ma, thu, gio, gv].filter(function(v) { return String(v || '').trim(); }).join(' | '); }
function timCaTheoNhan(ss, nhan) {
  var ds = layDanhSachCa(ss), s = String(nhan || '').trim();
  for (var i = 0; i < ds.length; i++) if (ds[i].nhan === s) return ds[i];
  return null;
}
function datDropdownCaBaoBu(ss, bao) {
  if (!bao) return;
  var nhan = layDanhSachCa(ss).map(function(c) { return c.nhan; });
  // H nhận cả ca chuẩn và Ca đặc biệt một lần (ĐB-01). Nếu đặt chặn tuyệt đối,
  // lúc Gom nhóm ghi nhãn ca đặc biệt vào H, Sheets báo lỗi xác thực ở chính ô đó.
  // Ca nhập tay vẫn được kiểm tra đầy đủ trước khi Chốt BAO_BU.
  if (nhan.length) bao.getRange(2, 8, Math.max(100, bao.getLastRow() + 20) - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(nhan, true).setAllowInvalid(true).build());
}
// Làm mới danh sách chọn sau khi quản lý thêm/sửa/bật-tắt ca. Không đổi lịch, không gửi tin.
function lamMoiDanhSachCaXep(khongThongBao) {
  var ss=laySS(), bao=ss.getSheetByName('BAO_BU'), lich=ss.getSheetByName('LICH_BU');
  if(bao) datDropdownCaBaoBu(ss,bao);
  if(lich) datDropdownCaLich(ss,lich);
  if(!khongThongBao) baoXong('✅ Đã làm mới danh sách Ca xếp ở BAO_BU và LICH_BU. Không có bé nào bị đổi lịch.');
}
// Mã buổi liên kết đúng một dòng BAO_BU với một dòng LICH_BU. BAO_BU chỉ dùng đến L;
// mã được cất trong tab kỹ thuật ẩn nên GV/quản lý không phải thấy hoặc sửa cột M.
var TAB_LIEN_KET_BU = 'DỮ LIỆU KỸ THUẬT';
function taoMaBuoi() { return 'DB-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000000); }
function khoaBaoBu(b) { return [String(b[0]||'').trim(),String(b[2]||'').trim(),String(b[3]||'').trim(),String(b[5]||'').trim()].join('|'); }
function layBangLienKetBu(ss) {
  var sh=ss.getSheetByName(TAB_LIEN_KET_BU);
  if(!sh){ sh=ss.insertSheet(TAB_LIEN_KET_BU); sh.appendRow(['Mã buổi','Khóa BAO_BU']); }
  try{sh.hideSheet();}catch(e){}
  return sh;
}
function layMaBuoiBao(ss, baoRow) {
  var sh=layBangLienKetBu(ss), d=sh.getDataRange().getValues(), k=khoaBaoBu(baoRow);
  for(var i=1;i<d.length;i++) if(String(d[i][1]||'')===k) return String(d[i][0]||'').trim();
  var ma=taoMaBuoi(); sh.appendRow([ma,k]); return ma;
}
function dongBaoTheoMa(ss, bao, maBuoi) {
  if (!bao || !maBuoi) return 0;
  var sh=layBangLienKetBu(ss), link=sh.getDataRange().getValues(), k='';
  for(var a=1;a<link.length;a++) if(String(link[a][0]||'').trim()===String(maBuoi).trim()){k=String(link[a][1]||'');break;}
  if(!k)return 0;
  var d=bao.getDataRange().getValues(), found=0;
  for (var i=1;i<d.length;i++) if(khoaBaoBu(d[i])===k){if(found)return -1;found=i+1;}
  return found;
}
function damBaoCotCaLich(ss, lich) {
  if (!lich) return;
  if (String(lich.getRange(1, 17).getValue() || '').trim() !== 'Ca xếp (chọn)')
    lich.getRange(1, 17).setValue('Ca xếp (chọn)').setFontWeight('bold').setBackground('#F6F3EE');
  if (String(lich.getRange(1, 18).getValue() || '').trim() !== 'Mã buổi')
    lich.getRange(1, 18).setValue('Mã buổi').setFontWeight('bold').setBackground('#F6F3EE');
  var ds=layDanhSachCa(ss), data=lich.getDataRange().getValues();
  // Dòng lịch cũ chưa có Q: tự điền nhãn nếu A-D trùng một ca đang Dùng.
  for(var i=1;i<data.length;i++) if(!String(data[i][16]||'').trim()) for(var j=0;j<ds.length;j++) {
    var c=ds[j]; if(String(data[i][0])===c.ma && String(data[i][1])===c.thu && String(data[i][2])===c.gio && String(data[i][3])===c.gv) { lich.getRange(i+1,17).setValue(c.nhan); break; }
  }
  datDropdownCaLich(ss, lich);
}
function datLaiLichSauDoiCa(ss, lich, dong, ca) {
  var ngay=layNgayThu(ca.thu);
  lich.getRange(dong,1,1,4).setValues([[ca.ma,ca.thu,ca.gio,ca.gv]]);
  lich.getRange(dong,14).setValue(ngay);
  // Đổi lịch sau khi hỏi PH: lịch cũ không còn hiệu lực, phải hỏi/xác nhận lại.
  lich.getRange(dong,9).setValue('Chờ Ms. Vân Anh');
  lich.getRange(dong,10).clearContent(); lich.getRange(dong,11).clearContent();
  lich.getRange(dong,15).clearContent(); lich.getRange(dong,16).clearContent();
}
function datDropdownCaLich(ss, lich) {
  if (!lich) return;
  var nhan = layDanhSachCa(ss).map(function(c) { return c.nhan; });
  // LICH_BU có thể có lịch cũ: không để validation chặn nâng cấp chỉ vì một nhãn lịch sử.
  // Ca mới vẫn chọn từ danh sách; trước khi gửi GV, hệ thống kiểm lại ca đang Dùng.
  if (nhan.length) lich.getRange(2,17,Math.max(200,lich.getLastRow()+20)-1,1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(nhan,true).setAllowInvalid(true).build());
}
function datDropdownBaoBu(ss, bao) {
  var src = nguonBAOBU(ss);
  datDropdown(bao, 2, 100, GV_LIST); datList(bao, 2, 3, src.lops.length ? src.lops : LOP_LIST.slice());
  datList(bao, 2, 4, src.tenAll); datDropdown(bao, 5, 100, TRINH_DO);
  if (src.lops.length || src.tenAll.length) {
    bao.getRange(2, 3, 100, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(src.lops.length ? src.lops : LOP_LIST, true).setAllowInvalid(true).build());
    if (src.tenAll.length) datDropdown(bao, 4, 100, src.tenAll);
  }
  // H là dropdown chỉ quản lý: chỉ ca đang Dùng từ nguồn chuẩn.
  datDropdownCaBaoBu(ss, bao);
}
function xepLichTam(ss, bao, lich, daKiemTra) {
  // Giai đoạn nháp: tuyệt đối không ghi LICH_BU hoặc tạo tin. Quản lý sửa H (Ca xếp) trước khi chốt.
  var data = bao.getDataRange().getValues(), caList = layDanhSachCa(ss), uuTien = layGvBuUuTienTheoLop(ss), demTheoCa = {}, stt = 0, du = 0;
  for (var i=1;i<data.length;i++) if (String(data[i][6]||'').indexOf('Đã xếp tạm') >= 0 && String(data[i][7]||'')) demTheoCa[data[i][7]] = (demTheoCa[data[i][7]]||0)+1;
  for (var r=1;r<data.length;r++) {
    var row=data[r], ten=String(row[3]||'').trim(), st=String(row[6]||'').trim();
    var nhapDacBiet=String(row[10]||'').trim();
    // Copy dòng mẫu có thể mang theo “Đã xếp tạm” nhưng H vẫn trống.
    // Nếu K có ca đặc biệt, luôn sửa lại H theo K thay vì bỏ qua dòng đó.
    var duocXuLyDacBiet=!!nhapDacBiet && (st==='' || st==='Chờ' || st.indexOf('Đã xếp tạm')>=0);
    if (!ten || String(row[8]||'').indexOf(DAU_MAU)>=0 || ten.toLowerCase().indexOf('không bù')===0 || (!duocXuLyDacBiet && st && st !== 'Chờ' && st.indexOf('Đã xếp tạm')<0)) continue;
    // K có Ca đặc biệt thì ưu tiên tuyệt đối: không xét ca chuẩn, ghi chính nhãn ĐB sang H.
    var caDacBiet=parseCaDacBiet(nhapDacBiet);
    if(nhapDacBiet && !caDacBiet){ bao.getRange(r+1,7).setValue('Cần sửa ca đặc biệt'); bao.getRange(r+1,8).clearContent(); bao.getRange(r+1,9).setValue('Ca đặc biệt phải theo mẫu: ĐB-01 | Thứ 4 | 14h00 - 15h30 | Ms. Vân'); continue; }
    if(caDacBiet){ bao.getRange(r+1,7).setValue('Đã xếp tạm'); bao.getRange(r+1,8).setValue(caDacBiet.nhan); stt++; continue; }
    var uu=String(row[11]||'').trim() || uuTien[String(row[2]||'').trim()] || '';
    var ds=caList.filter(function(c){ return !uu || c.gv===uu; }).concat(caList.filter(function(c){ return uu && c.gv!==uu; }));
    var ca=null;
    for(var j=0;j<ds.length;j++) if((demTheoCa[ds[j].nhan]||0)<ds[j].toiDaBe){ ca=ds[j]; break; }
    if (!ca) { bao.getRange(r+1,7).setValue('Tuần sau'); bao.getRange(r+1,9).setValue('Hết chỗ các ca đang bật'); du++; continue; }
    bao.getRange(r+1,7).setValue('Đã xếp tạm'); bao.getRange(r+1,8).setValue(ca.nhan); demTheoCa[ca.nhan]=(demTheoCa[ca.nhan]||0)+1; stt++;
  }
  return 'Đã xếp tạm ' + stt + ' bé trong BAO_BU' + (du ? '; dư '+du+' bé sang tuần sau.' : '.') + '\nQuản lý kiểm tra/đổi cột Ca xếp rồi bấm “Chốt BAO_BU → tạo LICH_BU + Tin PH”.';
}
function kiemTraCaTruocKhiChot(ss, bao) {
  var d=bao.getDataRange().getValues(), ds=layDanhSachCa(ss), map={}, loi=[];
  ds.forEach(function(c){map[c.nhan]={ca:c,bes:0,td:{}};});
  for(var i=1;i<d.length;i++) {
    if(String(d[i][6]||'').indexOf('Đã xếp tạm')<0) continue;
    var nhan=String(d[i][7]||'').trim(), x=map[nhan], db=parseCaDacBiet(nhan);
    if(db) continue; // Ca đặc biệt là ngoại lệ một lần, không thuộc danh mục ca chuẩn.
    if(!x) {loi.push('Dòng '+(i+1)+' chọn ca không còn Dùng: '+(nhan||'(trống)')); continue;}
    x.bes++; if(d[i][4]) x.td[String(d[i][4])]=1;
  }
  Object.keys(map).forEach(function(n){var x=map[n], c=x.ca;
    if(x.bes>c.toiDaBe) loi.push(c.ma+' quá chỗ: '+x.bes+'/'+c.toiDaBe+' bé');
    if(Object.keys(x.td).length>c.toiDaTrinhDo) loi.push(c.ma+' quá số trình độ: '+Object.keys(x.td).length+'/'+c.toiDaTrinhDo);
  });
  for(var a=0;a<ds.length;a++) for(var b=a+1;b<ds.length;b++) if(map[ds[a].nhan].bes && map[ds[b].nhan].bes && ds[a].gv===ds[b].gv && ds[a].thu===ds[b].thu && khoangGioTrung(ds[a].gio,ds[b].gio)) loi.push(ds[a].gv+' trùng giờ: '+ds[a].ma+' / '+ds[b].ma);
  return loi;
}
function chotBaoBuTaoLichTinPH() {
  var ss=laySS(), bao=ss.getSheetByName('BAO_BU'), lich=ss.getSheetByName('LICH_BU');
  if(!bao || !lich) { baoXong('Chưa có tab BAO_BU hoặc LICH_BU.'); return; }
  damBaoCotCaLich(ss, lich);
  var loi=kiemTraCaTruocKhiChot(ss,bao);
  if(loi.length){baoXong('⚠️ Chưa chốt vì có ca cần sửa:\n• '+loi.join('\n• ')+'\n\nHãy đổi Ca xếp ở BAO_BU rồi chốt lại.');return;}
  var data=bao.getDataRange().getValues(), old=lich.getDataRange().getValues(), byMa={};
  for(var i=1;i<old.length;i++) if(String(old[i][17]||'').trim()) byMa[String(old[i][17]).trim()]=i+1;
  var dem=0, luc=Utilities.formatDate(new Date(),'GMT+7','dd/MM HH:mm');
  for(var r=1;r<data.length;r++) {
    var b=data[r], ten=String(b[3]||'').trim(), nhan=String(b[7]||'').trim();
    if(!ten || String(b[6]||'').indexOf('Đã xếp tạm')<0 || !nhan) continue;
    var ca=timCaTheoNhanHoacDacBiet(ss,nhan); if(!ca){baoXong('⚠️ Không tìm được ca ở dòng '+(r+1)+'. Chưa có dữ liệu nào được chốt.');return;}
    var maBuoi=layMaBuoiBao(ss,b);
    var ngay=layNgayThu(ca.thu), pos=byMa[maBuoi], p;
    if(pos){
      var cu=old[pos-1];
      // Nếu lịch đã chốt/gửi thì không được ghi đè im lặng.
      if(String(cu[14]||'').trim() || String(cu[8]||'').indexOf('✅')>=0){baoXong('⚠️ Dòng '+(r+1)+' đã có lịch PH/GV. Không thể chốt đè; hãy xử lý đổi lịch trong LICH_BU.');return;}
      lich.getRange(pos,1,1,8).setValues([[ca.ma,ca.thu,ca.gio,ca.gv,ten,b[2],b[4],b[5]]]);
      lich.getRange(pos,9).setValue('Chờ Ms. Vân Anh'); lich.getRange(pos,13).setValue(b[8]||''); lich.getRange(pos,14).setValue(ngay); lich.getRange(pos,17).setValue(ca.nhan); p=pos;
    } else { lich.appendRow([ca.ma,ca.thu,ca.gio,ca.gv,ten,b[2],b[4],b[5],'Chờ Ms. Vân Anh','','','',b[8]||'',ngay,'','',ca.nhan,maBuoi]); p=lich.getLastRow(); }
    var tin='Dạ em chào chị, em xin thông báo lịch học bù cho bé '+ten+':\n• Thời gian: '+ca.thu+' ngày '+ngay+' lúc '+ca.gio+'\nDạ thời gian này chị có sắp xếp đưa bé đến Trung tâm học bù được không ạ?\nNhờ chị xác nhận giúp em trước '+CFG.HAN_PH_XAC_NHAN+' nhé!\nEm cám ơn chị ạ.';
    lich.getRange(p,10).setValue(tin); lich.getRange(p,11).clearContent(); lich.getRange(p,15).clearContent(); lich.getRange(p,16).setValue('PH: '+luc);
    bao.getRange(r+1,7).setValue('Đã chốt chờ PH'); dem++;
  }
  baoXong('✅ Đã chốt BAO_BU: tạo/cập nhật LICH_BU và tin PH cho '+dem+' bé. PH ✅ Đi được → Chốt LICH_BU → Gửi lịch GV.');
}
function kiemTraLichCuoiTruocGui(ss, lich) {
  // File cũ chưa có tab Cài đặt: giữ được lịch đã có; sau nâng cấp thì luôn kiểm theo ca đang Dùng.
  if(!ss.getSheetByName('CÀI ĐẶT CA DẠY BÙ')) return [];
  var d=lich.getDataRange().getValues(), ds=layDanhSachCa(ss), map={}, loi=[];
  ds.forEach(function(c){map[c.nhan]={ca:c,bes:0,td:{}};});
  for(var i=1;i<d.length;i++) {
    var r=d[i], st=String(r[8]||''), nhan=String(r[16]||'').trim();
    if(!String(r[4]||'').trim() || (st.indexOf('✅')<0 && st.indexOf('Đi được')<0)) continue;
    if(parseCaDacBiet(nhan)) continue; // Ca đặc biệt hợp lệ được phép gửi dù không nằm trong Cài đặt ca chung.
    var x=map[nhan];
    if(!x){loi.push('LICH_BU dòng '+(i+1)+' chọn ca không còn Dùng: '+(nhan||'(trống)'));continue;}
    x.bes++; if(r[6]) x.td[String(r[6])]=1;
  }
  Object.keys(map).forEach(function(n){var x=map[n],c=x.ca;
    if(x.bes>c.toiDaBe) loi.push(c.ma+' quá chỗ: '+x.bes+'/'+c.toiDaBe+' bé');
    if(Object.keys(x.td).length>c.toiDaTrinhDo) loi.push(c.ma+' quá số trình độ: '+Object.keys(x.td).length+'/'+c.toiDaTrinhDo);
  });
  for(var a=0;a<ds.length;a++) for(var b=a+1;b<ds.length;b++) if(map[ds[a].nhan].bes && map[ds[b].nhan].bes && ds[a].gv===ds[b].gv && ds[a].thu===ds[b].thu && khoangGioTrung(ds[a].gio,ds[b].gio)) loi.push(ds[a].gv+' trùng giờ: '+ds[a].ma+' / '+ds[b].ma);
  return loi;
}
function chotLichTaoTinGV() {
  var ss=laySS(), lich=ss.getSheetByName('LICH_BU'); if(!lich){baoXong('Chưa có tab LICH_BU.');return;}
  damBaoCotCaLich(ss,lich); var loi=kiemTraLichCuoiTruocGui(ss,lich);
  if(loi.length){baoXong('⚠️ Chưa tạo tin GV vì lịch cuối cần sửa:\n• '+loi.join('\n• '));return;}
  var d=lich.getDataRange().getValues(), dem=0, luc=Utilities.formatDate(new Date(),'GMT+7','dd/MM HH:mm');
  for(var i=1;i<d.length;i++){var r=d[i]; if(!String(r[4]||'').trim() || (String(r[8]||'').indexOf('✅')<0 && String(r[8]||'').indexOf('Đi được')<0))continue; var note=String(r[12]||'').trim(); var tin='📚 ['+r[1]+' '+r[2]+'] '+r[3]+' dạy bù: bé '+r[4]+' ('+r[5]+' - '+r[6]+'). Slide: '+(r[7]||'(chưa có link)')+(note?'\n📌 Ghi chú: '+note:''); lich.getRange(i+1,11).setValue(tin); lich.getRange(i+1,15).clearContent(); lich.getRange(i+1,16).setValue('GV: '+luc);dem++;}
  baoXong('✅ Đã chốt LICH_BU và tạo tin GV cho '+dem+' bé. Chỉ bé PH “✅ Đi được” mới được gửi.');
}
// Tên cũ giữ cho automation cũ, nhưng dùng đúng quy tắc PH xác nhận của luồng mới.
function chotLichTaoTin(){ return chotLichTaoTinGV(); }
